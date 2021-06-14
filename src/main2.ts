import * as fs from 'fs';
import axios from 'axios';
import * as _ from 'lodash';
import BigNumber from 'bignumber.js';
import Staking from './Staking';

type SimpleOperation = {
  hash: string;
  level: number;
  amount: string;
  source: string;
  type: 'stake' | 'withdraw';
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

async function indexContractOperations(contractAddress: string) {
  let lastId: number | undefined;
  const operations: Array<SimpleOperation> = [];
  do {
    const result = await axios.get(`https://api.better-call.dev/v1/contract/mainnet/${contractAddress}/operations?entrypoints=stake,withdraw&with_storage_diff=true${lastId ? '&last_id=' + lastId : ''}`);
    if (result.data.operations.length > 0) {
      operations.push(
        ...result.data.operations.filter(o => ['stake', 'withdraw'].indexOf(o.entrypoint) !== -1).map(o => ({hash: o.hash, level: o.level, source: o.source, amount: o.parameters[0].value, type: o.entrypoint}))
      );
      lastId = result.data.last_id;
    } else {
      lastId = undefined;
    }
  } while (lastId);
  return operations;
}

function calculateDistribution() {
  const staking = new Staking("USDC");
  staking.notifyRewardAmount(1500000000, 1445703);
  const diffs = JSON.parse(fs.readFileSync(diffsFile).toString()) as Array<BigMapDiff>;
  const balances: Map<string, string> = new Map<string, string>();
  diffs.forEach(d => {
    if (d.operation.level < 1445703 || d.operation.level > 1445703 + 10080) {
      return;
    }
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
        } else {
          staking.withdraw(d.content.key, difference.abs().toNumber(), d.operation.level);
        }
        balances.set(d.content.key, d.content.value);
        break;
      }
      default:
        break;
    }
  });
  return staking.allRewards(1445703 + 10080);
}

const configuration = {
  wCEL: 'KT1FQBbU7uNkHSq4oLyiTyBFTZ7KfTWGLpcv',
  wWBTC: 'KT1SZVLvLDQvqx6qMbF8oXZe2tfP7bJMASy2',
  WRAP: 'KT1AnsHEdYKEdM62QCNpZGc5PfpXhftcdu22'
};

(async () => {
  //wCEL: KT1FQBbU7uNkHSq4oLyiTyBFTZ7KfTWGLpcv
  await indexContractOperations(configuration.wCEL);
  //await indexDiffs();
  //calculateBalances();

  /*const allRewards = calculateDistribution();
  for (const entry of allRewards.entries()) {
    console.log(entry[0], entry[1].toString(10));
  }
  let total = new BigNumber("0");
  for(const value of allRewards.values()) {
    total = total.plus(value);
  }
  console.log(1500000000,
    total.toString(10),
    new BigNumber(1500000000, 10).minus(total).toString(10));*/
})().catch(e => {
  console.error(e);
});


