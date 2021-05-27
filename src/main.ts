import * as fs from 'fs';
import axios from 'axios';
import * as _ from 'lodash';
import BigNumber from 'bignumber.js';
import Staking from './Staking';

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
const diffsFile = 'diffs.json';
const balancesEvolutionsFile = 'balancesEvolutions.json';
const balancesFile = 'balances.json';

async function indexOperationsList() {
  const contractAddress = 'KT1LRboPna9yQY9BrjtQYDS1DVxhKESK4VVd';
  const limit = 100;
  let lastId: number | undefined;
  const operations: Array<SimpleOperation> = [];
  do {
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
}

const blacklistedAddresses = ["KT1FG63hhFtMEEEtmBSX2vuFmP87t9E7Ab4t", "KT1SN87btphRCwGXFTbzndMVQzrpZ165XutV", "tz1QGZU9mpkSYkMVkoi2J22RtoqMY7RRzjjn"]


function calculateDistribution(reward: number, startLevel: number, duration: number) {
  const staking = new Staking(duration, "USDC");
  staking.notifyRewardAmount(reward, startLevel);
  const diffs = JSON.parse(fs.readFileSync(diffsFile).toString()) as Array<BigMapDiff>;
  const balances: Map<string, string> = new Map<string, string>();
  diffs
    .filter(d => !(d.operation.level < startLevel || d.operation.level > startLevel + duration) && blacklistedAddresses.indexOf(d.content.key) === -1)
    .forEach(d => {
    switch (d.action) {
      case 'add_key': {
        balances.set(d.content.key, d.content.value);
        staking.stake(d.content.key, +d.content.value, d.operation.level);
        break;
      }
      case 'remove_key': {
        const existingBalance = balances.get(d.content.key);
        staking.withdraw(d.content.key, +existingBalance, d.operation.level);
        balances.delete(d.content.key);
        break;
      }
      case 'update_key': {
        const existingBalance = balances.get(d.content.key) || "0";
        const newBalance = d.content.value;
        const difference = new BigNumber(newBalance, 10).minus(new BigNumber(existingBalance, 10));
        if (difference.isGreaterThan(0)) {
          staking.stake(d.content.key, difference.toNumber(), d.operation.level);
        } else if (difference.isLessThan(0)){
          staking.withdraw(d.content.key, difference.abs().toNumber(), d.operation.level);
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
  const reward = 2000000000;
  const duration = 10080;
  const staking = calculateDistribution(reward, startLevel, duration);
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
}

(async () => {
  //await indexOperationsList();
  //await indexDiffs();
  //calculateBalances();

  showDistribution();
})().catch(e => {
  console.error(e);
});


