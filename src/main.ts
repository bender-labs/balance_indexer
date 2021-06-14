import * as fs from 'fs';
import axios from 'axios';
import * as _ from 'lodash';
import BigNumber from 'bignumber.js';
import Staking from './Staking';
import { Fee, Operations, TotalFee } from './Operation';
import tokens from './tokens';
import tokensToDistribute from './tokensToDistribute';

type SimpleOperation = {
  hash: string;
  level: number;
  id: number;
}

type BigMapDiff = {
  operation: SimpleOperation;
  path: string;
  action: string;
  content: {
    hash: string;
    key: any;
    value: string;
  }
}

type BalanceEvolution = {
  operation: SimpleOperation;
  account: string;
  value: string;
}

const operationsFile = 'operations.json';
const feesFile = 'fees.json';
const diffsFile = 'diffs.json';
const balancesEvolutionsFile = 'balancesEvolutions.json';
const balancesFile = 'balances.json';

const weekStarts = [0, 1445703 + 10080 + 1, 1445703 + 10080 + 1 + 10080, 1445703 + 10080 + 1 + 10080 + 10080];

async function indexOperationsList() {
  const contractAddress = 'KT1LRboPna9yQY9BrjtQYDS1DVxhKESK4VVd';
  const limit = 100;
  let lastId: number | undefined;
  const operations: Array<SimpleOperation> = [];
  do {
    console.log(lastId);
    const result = await axios.get(`https://api.tzkt.io/v1/accounts/${contractAddress}/operations?type=origination,transaction&limit=${limit}&sort=0&quote=usd${lastId ? '&lastId=' + lastId : ''}`);
    if (result.data.length > 0) {
      operations.push(...result.data.map(op => ({ hash: op.hash, level: op.level, id: op.id })));
      lastId = _.last(operations).id;
    } else {
      lastId = undefined;
    }
  } while (lastId);
  fs.writeFileSync(operationsFile, JSON.stringify(_.uniqBy(operations,'hash')));
}

async function indexDiffs() {
  const bigMapId = 1777;
  const operations = JSON.parse(fs.readFileSync(operationsFile).toString());
  const diffs: Array<BigMapDiff> = [];
  let i = 0;
  for (const operation of operations) {
    console.log(i++, operation.hash);
    const result = await axios.get(`https://api.tzkt.io/v1/operations/${operation.hash}?quote=usd`);
    for (const sub of result.data) {
      if (sub.diffs) {
        for (const diff of sub.diffs) {
          if (diff.bigmap === bigMapId) {
            diffs.push({
              operation,
              path: diff.path,
              action: diff.action,
              content: {
                hash: diff.content ? diff.content.hash : '',
                key: diff.content ? diff.content.key : '',
                value: diff.content ? diff.content.value : ''
              }
            });
          }
        }
      }
    }
  }
  fs.writeFileSync(diffsFile, JSON.stringify(diffs));
}

function calculateBalances() {
  const balances: Map<string, string> = new Map<string, string>();
  const balancesEvolutions: Array<BalanceEvolution> = [];
  const diffs = JSON.parse(fs.readFileSync(diffsFile).toString()) as Array<BigMapDiff>;
  diffs.forEach(d => {
    switch (d.action) {
      case 'add_key': {
        balances.set(d.content.key, d.content.value);
        balancesEvolutions.push({operation: d.operation, account: d.content.key, value: d.content.value});
        break;
      }
      case 'remove_key': {
        const existingBalance = balances.get(d.content.key);
        balancesEvolutions.push({operation: d.operation, account: d.content.key, value: "-" + existingBalance});
        balances.delete(d.content.key);
        break;
      }
      case 'update_key': {
        const existingBalance = balances.get(d.content.key) || "0";
        const newBalance = d.content.value;
        balancesEvolutions.push({operation: d.operation, account: d.content.key, value: new BigNumber(newBalance).minus(new BigNumber(existingBalance)).toString(10)})
        balances.set(d.content.key, d.content.value);
        break;
      }
      default:
        break;
    }
  });
  fs.writeFileSync(balancesFile, JSON.stringify(balances));
  fs.writeFileSync(balancesEvolutionsFile, JSON.stringify(balancesEvolutions));
  for (const value of balances.entries()) {
    console.log(value[0], value[1]);
  }
  console.log(balances.size);
}

async function indexProtocolFees() {
  const allFees: Array<Fee> = [];
  let lastProcessedId = undefined;
  let inProgress = true;
  do {
    const currentOperations = (await axios.get<Operations>(`https://api.better-call.dev/v1/contract/mainnet/KT1MTnKjFSN2u4myPRBqnFuCYCPX8kTdUEnv/operations\\?entrypoints\\=mint_tokens,unwrap_erc20${lastProcessedId ? '&last_id=' + lastProcessedId : ''}`)).data;
    if (currentOperations.operations.length === 0) {
      inProgress = false;
    } else {
      lastProcessedId = currentOperations.last_id;
    }
    currentOperations.operations.filter(
      (o) => o.status == 'applied' && !o.mempool && ["mint_tokens","unwrap_erc20"].indexOf(o.entrypoint) !== -1
    ).map(o => {
      if (o.entrypoint === "mint_tokens") {
        const mints = o.parameters[0].children[0].children;
        if (mints.length > 1) {
          const params = mints[1].children;
          const token = o.destination;
          const tokenId = _.find(params, p => p.name === 'token_id').value;
          const fees = _.find(params, p => p.name === 'amount').value;
          console.log("mint", o.level, token, tokenId, fees);
          allFees.push({
            type: "mint_tokens",
            level: o.level,
            fees,
            token,
            tokenId
          })
        }
      } else if (o.entrypoint === "unwrap_erc20") {
        const params = o.parameters[0].children;
        const erc20 = _.find(params, p => p.name === 'erc_20').value;
        const fees = _.find(params, p => p.name === 'fees').value;
        console.log("unwrap", o.level, erc20, fees);
        allFees.push({
          type: "unwrap_erc20",
          level: o.level,
          fees,
          erc20
        })
      }
    });
  } while (inProgress);
  fs.writeFileSync(feesFile, JSON.stringify(allFees));
}

function readAllFees() {
  return JSON.parse(fs.readFileSync(feesFile).toString()) as Array<Fee>;
}

function initFeesPerWeekMap(weekStarts: number[]) {
  const result: Map<number, Array<TotalFee>> = new Map<number, Array<TotalFee>>();
  for (const weekStart of weekStarts) {
    const weekFees: Array<TotalFee> = [];
    for (const token of tokens) {
      weekFees.push({
        symbol: token.symbol,
        amount: new BigNumber('0')
      });
    }
    result.set(weekStart, weekFees);
  }
  return result;
}

function nextWeek(currentWeek, weekStarts, endLevel) {
  const currentIndex = weekStarts.indexOf(currentWeek);
  if (currentIndex === weekStarts.length - 1) {
    return endLevel;
  }
  return weekStarts[currentIndex + 1];
}

function addMissingFees(distributionPerWeek: Map<number, Array<TotalFee>>, week: number) {
  const totalDistributedFees: Array<TotalFee> = [];
  for (const token of tokens) {
    totalDistributedFees.push({
      symbol: token.symbol,
      amount: new BigNumber('0')
    });
  }
  distributionPerWeek.forEach(value => {
    value.forEach(v => {
      const check = totalDistributedFees.find(c => c.symbol === v.symbol);
      check.amount = check.amount.plus(v.amount);
    });
  });
  const lastWeekDistribution = distributionPerWeek.get(week);
  for (const token of tokens) {
    const calculatedAmount = totalDistributedFees.find(t => t.symbol === token.symbol);
    const totalToDistribute = tokensToDistribute.find(t => t.symbol === token.symbol);
    const tokenLastWeekDistribution = lastWeekDistribution.find(t => t.symbol === token.symbol);
    tokenLastWeekDistribution.amount = tokenLastWeekDistribution.amount.plus(totalToDistribute.amount.minus(calculatedAmount.amount));
  }
}

function calculateAllFees() {
  const allTokens = tokens;
  const endLevel = 1489752;
  const result = initFeesPerWeekMap(weekStarts);
  for (const week of weekStarts) {
    const filteredFees = readAllFees().filter(f => f.level >= week && f.level < nextWeek(week, weekStarts, endLevel));
    const allWeekFees = result.get(week);
    for(const fee of filteredFees) {
      let token;
      if (fee.type === "unwrap_erc20") {
        token = allTokens.find(t => t.ethereum === "0x" + fee.erc20);
      } else if (fee.type === "mint_tokens") {
        token = allTokens.find(t => t.tezos === fee.token && t.tokenId === fee.tokenId);
      }
      const allFee = allWeekFees.find(t => t.symbol === token.symbol);
      allFee.amount = allFee.amount.plus(new BigNumber(fee.fees).multipliedBy(0.4).integerValue(BigNumber.ROUND_DOWN));
    }
  }
  addMissingFees(result, weekStarts[3]);
  return result;
}

const blacklistedAddresses = [
  "KT1FG63hhFtMEEEtmBSX2vuFmP87t9E7Ab4t",
  "KT1SN87btphRCwGXFTbzndMVQzrpZ165XutV",
  "tz1QGZU9mpkSYkMVkoi2J22RtoqMY7RRzjjn",
  "tz1d4EXxyFQV23dGV8pQhan4PK3oLbjY5yoY",
  "KT1Qofrn5NS7mBkqM8x1n1toKKAs9Z3KbeKV",
  "KT1SN87btphRCwGXFTbzndMVQzrpZ165XutV",
  "KT1K7L5bQzqmVRYyrgLTHWNHQ6C5vFpYGQRk",
  "KT1Hoc4ZMCe7CPkwrQmYDkJLHHPSfmvfb2iY",
  "KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ",
  "KT1LRboPna9yQY9BrjtQYDS1DVxhKESK4VVd",
  "KT1DLif2x9BtK6pUq9ZfFVVyW5wN2kau9rkW",
  "KT1MTnKjFSN2u4myPRBqnFuCYCPX8kTdUEnv",
  "KT1TVgWxE57yiu1Kkc5muXNSzENX3MzRgHKC",
  "tz1WT3oAw91JTcNujeWa7fdoWHAaZGGLMRBS",
  "KT1Qofrn5NS7mBkqM8x1n1toKKAs9Z3KbeKV",
  "tz1bnyAsktMg9ikHRCDFES6p6c6f8QFy48tb",
  "tz1cNABC2qtbbHKDDKdvxRkcyopL1kEfbpgV",
  "tz1YHDyyMKnq84R88v1uPG1Tj4Zxfk6NaKjb"
]
function calculateDistribution(reward: BigNumber, startLevel: number, duration: number) {
  const staking = new Staking(duration, "USDC");
  let stakingStarted = false;
  const diffs = JSON.parse(fs.readFileSync(diffsFile).toString()) as Array<BigMapDiff>;
  const balances: Map<string, string> = new Map<string, string>();
  diffs
    .filter(d => !(d.operation.level > startLevel + duration) && blacklistedAddresses.indexOf(d.content.key) === -1)
    .forEach(d => {
      if (!stakingStarted && d.operation.level >= startLevel) {
        staking.notifyRewardAmount(reward, startLevel);
        stakingStarted = true;
      }
    switch (d.action) {
      case 'add_key': {
        balances.set(d.content.key, d.content.value);
        staking.stake(d.content.key, new BigNumber(d.content.value), d.operation.level);
        break;
      }
      case 'remove_key': {
        const existingBalance = balances.get(d.content.key);
        staking.withdraw(d.content.key, new BigNumber(existingBalance), d.operation.level);
        balances.delete(d.content.key);
        break;
      }
      case 'update_key': {
        const existingBalance = balances.get(d.content.key) || "0";
        const newBalance = d.content.value;
        const difference = new BigNumber(newBalance, 10).minus(new BigNumber(existingBalance, 10));
        if (difference.isGreaterThan(0)) {
          staking.stake(d.content.key, difference, d.operation.level);
        } else if (difference.isLessThan(0)){
          staking.withdraw(d.content.key, difference.abs(), d.operation.level);
        }
        balances.set(d.content.key, d.content.value);
        break;
      }
      default:
        break;
    }
  });
  return staking;
}

function showDistribution() {
  const startLevel = 1445703;
  const duration = 10080;
  const reward = 3570000000;
  const staking = calculateDistribution(new BigNumber(reward, 10), startLevel, duration);
  const allRewards = staking.allRewards(startLevel + duration);
  /*for (const entry of allRewards.entries()) {
    console.log(entry[0], entry[1].toString(10));
  }*/
  let total = new BigNumber("0");
  for(const value of allRewards.values()) {
    total = total.plus(value);
  }
  console.log(reward,
    total.toString(10),
    new BigNumber(reward, 10).minus(total, 10).toString(10));
  console.log(new BigNumber(reward, 10).minus(total, 10).dividedBy(reward).multipliedBy(100).toString(10));
}

(async () => {
  //await indexOperationsList();
  //await indexDiffs();
  //calculateBalances();

  //await indexProtocolFees();

  const feesToDistribute = calculateAllFees();

  const totalResult: Map<string, Map<string, BigNumber>> = new Map<string, Map<string, BigNumber>>();
  for (const token of tokens) {
    totalResult.set(token.symbol, new Map<string, BigNumber>());
  }

  for (const week of weekStarts) {
    for (const totalFee of feesToDistribute.get(week)) {
      const duration = 10080;
      let startLevel = week;
      if (week === 0) {
        startLevel = 1445703;
      }
      const reward = totalFee.amount;
      console.log(startLevel, totalFee.symbol, reward.toString(10));
      const staking = calculateDistribution(reward, startLevel, duration);
      const allRewards = staking.allRewards(startLevel + duration);
      const resultForToken = totalResult.get(totalFee.symbol);
      for (const entry of allRewards) {
        const reward = entry[1].integerValue(BigNumber.ROUND_DOWN);
        if (reward.isGreaterThan(0)) {
          let existingResult = resultForToken.get(entry[0]);
          if (!existingResult) {
            existingResult = new BigNumber("0");
          }
          resultForToken.set(entry[0], existingResult.plus(reward));
        }
      }
    }
  }
  for (const resultToken of totalResult) {
    let fileContent = "Address,Amount\n";
    for (const entry of resultToken[1]) {
      const reward = entry[1];
      fileContent += `${entry[0]},${reward.toString(10)}\n`;
    }
    fs.writeFileSync(`result/All_${resultToken[0]}.csv`, fileContent);
  }

  //showDistribution();
})().catch(e => {
  console.error(e);
});

/*
* week1_DAI.csv
*
* address;amount
*
* */

