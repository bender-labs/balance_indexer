export interface Token {
  symbol: string;
  ethereum: string;
  tezos: string;
  tokenId: string;
}

const tokens: Array<Token> = [
  {
    symbol: 'PAX',
    ethereum: '0x8e870d67f660d95d5be530380d0ec0bd388289e1',
    tezos: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ',
    tokenId: '14'
  },
  {
    symbol: 'WBTC',
    ethereum: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599',
    tezos: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ',
    tokenId: '19'
  },
  {
    symbol: 'LEO',
    ethereum: '0x2af5d2ad76741191d15dfe7bf6ac92d4bd912ca3',
    tezos: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ',
    tokenId: '9'
  },
  {
    symbol: 'BUSD',
    ethereum: '0x4fabb145d64652a948d72533023f6e7a623c7c53',
    tezos: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ',
    tokenId: '1'
  },
  {
    symbol: 'MKR',
    ethereum: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
    tezos: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ',
    tokenId: '12'
  },
  {
    symbol: 'FTT',
    ethereum: '0x50d1c9771902476076ecfc8b2a83ad6b9355a4c9',
    tezos: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ',
    tokenId: '6'
  },
  {
    symbol: 'CRO',
    ethereum: '0xa0b73e1ff0b80914ab6fe0444e65848c4c34450b',
    tezos: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ',
    tokenId: '4'
  },
  {
    symbol: 'LINK',
    ethereum: '0x514910771af9ca656af840dff83e8264ecf986ca',
    tezos: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ',
    tokenId: '10'
  },
  {
    symbol: 'DAI',
    ethereum: '0x6b175474e89094c44da98b954eedeac495271d0f',
    tezos: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ',
    tokenId: '5'
  },
  {
    symbol: 'SUSHI',
    ethereum: '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2',
    tezos: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ',
    tokenId: '15'
  },
  {
    symbol: 'HT',
    ethereum: '0x6f259637dcd74c767781e37bc6133cd6a68aa161',
    tezos: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ',
    tokenId: '7'
  },
  {
    symbol: 'WRAP',
    ethereum: '0x7421a18de2ee1dc8b84e42eb00d8b73578c23526',
    tezos: 'KT1LRboPna9yQY9BrjtQYDS1DVxhKESK4VVd',
    tokenId: '0'
  },
  {
    symbol: 'OKB',
    ethereum: '0x75231f58b43240c9718dd58b4967c5114342a86c',
    tezos: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ',
    tokenId: '13'
  },
  {
    symbol: 'USDC',
    ethereum: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    tezos: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ',
    tokenId: '17'
  },
  {
    symbol: 'CEL',
    ethereum: '0xaaaebe6fe48e54f431b0c390cfaf0b017d09d42d',
    tezos: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ',
    tokenId: '2'
  },
  {
    symbol: 'COMP',
    ethereum: '0xc00e94cb662c3520282e6f5717214004a7f26888',
    tezos: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ',
    tokenId: '3'
  },
  {
    symbol: 'MATIC',
    ethereum: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0',
    tezos: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ',
    tokenId: '11'
  },
  {
    symbol: 'AAVE',
    ethereum: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
    tezos: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ',
    tokenId: '0'
  },
  {
    symbol: 'WETH',
    ethereum: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    tezos: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ',
    tokenId: '20'
  },
  {
    symbol: 'USDT',
    ethereum: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    tezos: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ',
    tokenId: '18'
  },
  {
    symbol: 'HUSD',
    ethereum: '0xdf574c24545e5ffecb9a659c229253d4111d87e1',
    tezos: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ',
    tokenId: '8'
  },
  {
    symbol: 'UNI',
    ethereum: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
    tezos: 'KT18fp5rcTW7mbWDmzFwjLDUhs5MeJmagDSZ',
    tokenId: '16'
  }
];

export default tokens;
