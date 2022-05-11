export type BuildTxInput = {
  gas: string
}

export type Account = {
  sequence: number
}

export type FeeData = {
  gasLimit: string
}

export type QuoteFeeData = {
  /**
   * estimated gas units in gwei
   */
  estimatedGas?: string
  /**
   * gas price per gwei
   */
  gasPrice?: string
  /**
   * total approval fee in eth
   */
  approvalFee?: string
  /**
   * total fee including approval
   */
  totalFee?: string
}
