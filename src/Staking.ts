import BigNumber from 'bignumber.js';

const programDuration = 10080;

export default class Staking {

  constructor(currency: string) {
    this.currency = currency;
  }

  private DURATION = programDuration;
  private currency: string;
  private periodFinish = 0;
  private rewardRate = new BigNumber("0");
  private lastUpdateTime: number;
  private rewardPerTokenStored = new BigNumber("0");
  private userRewardPerTokenPaid = new Map<string, BigNumber>();
  private rewards = new Map<string, BigNumber>();
  private _totalSupply = new BigNumber("0");
  private _balances = new Map<string, BigNumber>();

  totalSupply(): BigNumber {
    return this._totalSupply;
  }

  balanceOf(account: string): BigNumber {
    return this._balances.get(account) || new BigNumber('0');
  }

  updateReward(account: string, currentLevel: number) {
    this.rewardPerTokenStored = this.rewardPerToken(currentLevel);
    this.lastUpdateTime = this.lastTimeRewardApplicable(currentLevel);
    if (account != "0x0000") {
      this.rewards.set(account, this.earned(account, currentLevel));
      this.userRewardPerTokenPaid.set(account, this.rewardPerTokenStored);
    }
  }

  lastTimeRewardApplicable(currentLevel: number): number {
    return Math.min(currentLevel, this.periodFinish);
  }

  rewardPerToken(blockLevel: number): BigNumber {
    if (this.totalSupply().isZero()) {
      return this.rewardPerTokenStored;
    }
    return this.rewardPerTokenStored.plus(
      new BigNumber(
        this.lastTimeRewardApplicable(blockLevel) - this.lastUpdateTime, 10)
        .multipliedBy(this.rewardRate).dividedBy(this.totalSupply()));
    /*return
    rewardPerTokenStored.add(
      lastTimeRewardApplicable()
        .sub(lastUpdateTime)
        .mul(rewardRate)
        .mul(1e18)
        .div(totalSupply())
    );*/
  }

  earned(account: string, blockLevel: number): BigNumber {
    return this.balanceOf(account)
      .multipliedBy(
        this.rewardPerToken(blockLevel).minus(this.userRewardPerTokenPaid.get(account) || new BigNumber("0")))
      .plus(this.rewards.get(account) || new BigNumber("0"));
    /*return
    balanceOf(account)
      .mul(rewardPerToken().sub(userRewardPerTokenPaid[account]))
      .div(1e18)
      .add(rewards[account]);*/
  }

  stake(account: string, amount: number, currentLevel: number): void {
    this.updateReward(account, currentLevel);
    this._totalSupply = this._totalSupply.plus(amount);
    this._balances.set(account, this.balanceOf(account).plus(amount, 10));
  }

  withdraw(account: string, amount: number, currentLevel: number): void {
    this.updateReward(account, currentLevel);
    this._totalSupply = this._totalSupply.minus(amount);
    this._balances.set(account, this.balanceOf(account).plus(amount, 10));
  }

  notifyRewardAmount(reward: number, currentLevel: number): void {
    this.updateReward("0x0000", currentLevel);
    if (currentLevel >= this.periodFinish) {
      this.rewardRate = new BigNumber(reward, 10).dividedBy(this.DURATION);
    } else {
      const remaining = this.periodFinish - currentLevel;
      const leftover = new BigNumber(remaining, 10).multipliedBy(this.rewardRate);
      this.rewardRate = (new BigNumber(reward, 10).plus(leftover)).dividedBy(this.DURATION);
    }
    this.lastUpdateTime = currentLevel;
    this.periodFinish = currentLevel + this.DURATION;
  }

  allRewards(currentLevel: number): Map<string, BigNumber> {
    for(const balance of this._balances.keys()) {
      this.updateReward(balance, currentLevel);
    }
    return this.rewards;
  }
}
