import BigNumber from 'bignumber.js';

export interface MichelineNode {
  prim: string;
  type: string;
  name?: string;
  value?: string | number;
  children?: Array<MichelineNode>;
}

export interface Operation {
  level: number;
  counter: number;
  parameters: MichelineNode;
  timestamp: Date;
  id: string;
  protocol: string;
  hash: string;
  source: string;
  destination: string;
  status: string;
  entrypoint: string;
  internal: boolean;
  mempool: boolean;
}

export interface Operations {
  operations: Array<Operation>;
  last_id: string;
}

export interface Fee {
  type: "mint_tokens" | "unwrap_erc20";
  level: number;
  fees: string;
  erc20?: string;
  token?: string;
  tokenId?: string;
}

export interface TotalFee {
  symbol: string;
  amount: BigNumber;
}
