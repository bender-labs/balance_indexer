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

type ContractConfiguration = {
  contract: string;
  duration: number;
  startLevel: number;
  rewards: string;
}

async function indexContractOperations(configuration: ContractConfiguration) {
  let lastId: number | undefined;
  const operations: Array<SimpleOperation> = [];
  do {
    const result = await axios.get(`https://api.better-call.dev/v1/contract/mainnet/${configuration.contract}/operations?entrypoints=stake,withdraw&with_storage_diff=true${lastId ? '&last_id=' + lastId : ''}`);
    if (result.data.operations.length > 0) {
      operations.push(
        ...result.data.operations.filter(o => o.status === 'applied' && ['stake', 'withdraw'].indexOf(o.entrypoint) !== -1).map(o => ({hash: o.hash, level: o.level, source: o.source, amount: o.parameters[0].value, type: o.entrypoint}))
      );
      lastId = result.data.last_id;
    } else {
      lastId = undefined;
    }
  } while (lastId);
  return operations;
}

function calculateDistribution(operations: Array<SimpleOperation>, configuration: ContractConfiguration) {
  const reward = new BigNumber(configuration.rewards);
  const startLevel = configuration.startLevel;
  const duration = configuration.duration;
  const staking = new Staking(duration, "USDC");
  let stakingStarted = false;
  operations
    .reverse()
    .filter(d => !(d.level > startLevel + duration))
    .forEach(d => {
      if (!stakingStarted && d.level >= startLevel) {
        staking.notifyRewardAmount(reward, startLevel);
        stakingStarted = true;
      }
      switch (d.type) {
        case 'stake': {
          staking.stake(d.source, new BigNumber(d.amount), d.level);
          break;
        }
        case 'withdraw': {
          staking.withdraw(d.source, new BigNumber(d.amount), d.level);
          break;
        }
        default:
          break;
      }
    });
  return staking;
}

function showDistribution(name: string, staking: Staking, configuration: ContractConfiguration) {
  const reward = configuration.rewards;
  const startLevel = configuration.startLevel;
  const duration = configuration.duration;
  const allRewards = staking.allRewards(startLevel + duration);
  let total = new BigNumber("0");
  for(const entry of allRewards.entries()) {
    const roundedValue = entry[1].integerValue(BigNumber.ROUND_DOWN);
    total = total.plus(roundedValue);
    if (!roundedValue.isZero()) {
      console.log(entry[0], roundedValue.toString(10));
    }
  }
  console.log('[Original reward amount] [Total calculated] [Difference]', reward,
    total.toString(10),
    new BigNumber(reward, 10).minus(total, 10).toString(10));
  let result = 'address,amount\n';
  for(const entry of allRewards.entries()) {
    const roundedValue = entry[1].integerValue(BigNumber.ROUND_DOWN);
    if (!roundedValue.isZero()) {
      result += `${entry[0]},${roundedValue.toString(10)}\n`
    }
  }
  fs.writeFileSync(`result/${name}_${configuration.contract}_week1.csv`, result);
}

async function calculateAll(name: string, configuration: ContractConfiguration) {
  console.log(name, configuration.contract);
  const operations = await indexContractOperations(configuration);
  const staking = calculateDistribution(operations, configuration);
  showDistribution(name, staking, configuration);
}

const configuration = {
  wCEL: {
    contract: 'KT1FQBbU7uNkHSq4oLyiTyBFTZ7KfTWGLpcv',
    duration: 10800,
    startLevel: 1499538,
    rewards: '260129'
  },
  wWBTC: {
    contract:'KT1SZVLvLDQvqx6qMbF8oXZe2tfP7bJMASy2',
    duration: 10800,
    startLevel: 1499538,
    rewards: '1767162'
  },
  WRAP: {
    contract: 'KT1AnsHEdYKEdM62QCNpZGc5PfpXhftcdu22',
    duration: 10800,
    startLevel: 1499538,
    rewards: '63920'
  }
};

(async () => {
  await calculateAll('wCEL', configuration.wCEL);
  await calculateAll('wWBTC', configuration.wWBTC);
  await calculateAll('WRAP', configuration.WRAP);
})().catch(e => {
  console.error(e);
});


