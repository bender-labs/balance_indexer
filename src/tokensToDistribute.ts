import BigNumber from 'bignumber.js';

export interface TokenToDistribute {
  symbol: string;
  amount: BigNumber;
}


const tokensToDistribute: Array<TokenToDistribute> = [
  {
    symbol: 'UNI',
    amount: new BigNumber("80418953036394330000")
  },
  {
    symbol: 'HUSD',
    amount: new BigNumber("174430409262")
  },
  {
    symbol: 'USDT',
    amount: new BigNumber("4807374002")
  },
  {
    symbol: 'WETH',
    amount: new BigNumber("1545701215847069000")
  },
  {
    symbol: 'AAVE',
    amount: new BigNumber("4123454342689945000")
  },
  {
    symbol: 'MATIC',
    amount: new BigNumber("3350817320158768400000")
  },
  {
    symbol: 'COMP',
    amount: new BigNumber("1992002845645099000")
  },
  {
    symbol: 'SUSHI',
    amount: new BigNumber("256912575262343400000")
  },
  {
    symbol: 'HT',
    amount: new BigNumber("48787817518378720000")
  },
  {
    symbol: 'WRAP',
    amount: new BigNumber("1161392914")
  },
  {
    symbol: 'OKB',
    amount: new BigNumber("33173208287299090000")
  },
  {
    symbol: 'USDC',
    amount: new BigNumber("4684874780")
  },
  {
    symbol: 'CEL',
    amount: new BigNumber("1629522")
  },
  {
    symbol: 'DAI',
    amount: new BigNumber("2774451747164361600000")
  },
  {
    symbol: 'LINK',
    amount: new BigNumber("131046083698255680000")
  },
  {
    symbol: 'CRO',
    amount: new BigNumber("1143990449356")
  },
  {
    symbol: 'FTT',
    amount: new BigNumber("19511278547814834000")
  },
  {
    symbol: 'MKR',
    amount: new BigNumber("488511843044424200")
  },
  {
    symbol: 'BUSD',
    amount: new BigNumber("2589374507948465700000")
  },
  {
    symbol: 'LEO',
    amount: new BigNumber("210445400874194040000")
  },
  {
    symbol: 'WBTC',
    amount: new BigNumber("6735807")
  },
  {
    symbol: 'PAX',
    amount: new BigNumber("2236721600631130300000")
  }
];

export default tokensToDistribute;
