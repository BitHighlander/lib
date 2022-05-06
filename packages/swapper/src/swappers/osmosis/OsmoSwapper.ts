import { CAIP19 } from '@shapeshiftoss/caip'
import {
  ApprovalNeededOutput,
  Asset,
  BuildQuoteTxInput,
  ChainTypes,
  ExecQuoteInput,
  ExecQuoteOutput,
  GetQuoteInput,
  MinMaxOutput,
  Quote,
  SwapperType
} from '@shapeshiftoss/types'

// import { getRate } from '../../api'
import {
  BuildTradeInput,
  BuyAssetBySellIdInput,
  CommonTradeInput,
  ExecuteTradeInput,
  Swapper,
  Trade,
  TradeQuote
} from '../../api'
import { DEFAULT_SOURCE } from './constants'
import { getRateInfo } from './OsmoService'

const getMin = async function () {
  return {
    minimum: '0',
    maximum: '1000'
  }
}

/**
 * Playground for testing different scenarios of multiple swappers in the manager.
 * Meant for local testing only
 */
export class OsmoSwapper implements Swapper {
  supportAssets: string[]

  getType() {
    return SwapperType.Osmosis
  }

  constructor() {
    this.supportAssets = ['cosmos:cosmoshub-4/slip44:118', 'cosmos:osmosis-1/slip44:118']
  }

  buildTrade(args: BuildTradeInput): Promise<Trade<ChainTypes>> {
    // eslint-disable-next-line no-console
    console.log('******: ', args)
    throw new Error('Method not implemented.')
  }
  getTradeQuote(input: CommonTradeInput): Promise<TradeQuote<ChainTypes>> {
    // eslint-disable-next-line no-console
    console.log('******: ', input)
    throw new Error('Method not implemented.')
  }
  executeTrade(args: ExecuteTradeInput<ChainTypes>): Promise<ExecQuoteOutput> {
    // eslint-disable-next-line no-console
    console.log('******: ', args)
    throw new Error('Method not implemented.')
  }

  async getQuote(input: GetQuoteInput): Promise<Quote<ChainTypes>> {
    const { sellAsset, buyAsset, sellAmount } = input

    if (!sellAmount) {
      throw new Error('sellAmount is required')
    }

    const { rate, buyAmount } = await getRateInfo(
      sellAsset,
      buyAsset,
      sellAmount !== '0' ? sellAmount : '1'
    )
    // console.log('******: ', { rate, priceImpact, tradeFee, buyAmount })

    // @ts-ignore
    return {
      buyAsset,
      // maximum: MAX_SWAPPER_SELL,
      rate,
      sellAsset,
      success: true,
      // feeData: { fee: '100', receiveNetworkFee: tradeFee },
      sellAmount: input.sellAmount,
      buyAmount,
      sources: DEFAULT_SOURCE
    }
  }

  async buildQuoteTx(input: BuildQuoteTxInput): Promise<Quote<ChainTypes>> {
    const {
      sellAsset,
      buyAsset,
      sellAmount,
      sellAssetAccountId,
      buyAssetAccountId,
      // slippage = DEFAULT_SLIPPAGE_TOLERANCE,
    } = input.input

    if (!sellAmount) throw new Error('OsmosisSwapper:buildQuoteTx sellAmount is required')

    const { buyAmount } = await getRateInfo(sellAsset, buyAsset, sellAmount)
    // console.log('resp: ', { tradeFee, buyAmount })

    return {
      success: true,
      sellAsset,
      buyAsset,
      depositAddress: '',
      // feeData: { fee: '100', receiveNetworkFee: tradeFee },
      sellAmount,
      buyAmount,
      sources: DEFAULT_SOURCE,
      sellAssetAccountId,
      buyAssetAccountId
    }
  }

  getUsdRate(input: Pick<Asset, 'symbol' | 'tokenId'>): Promise<string> {
    console.info(input)
    throw new Error('OsmoSwapper: getUsdRate unimplemented')
  }

  getMinMax(input: GetQuoteInput): Promise<MinMaxOutput> {
    console.info(input)
    return getMin()
  }

  async executeQuote(args: ExecQuoteInput<ChainTypes>): Promise<ExecQuoteOutput> {
    // eslint-disable-next-line no-console
    console.log('******: ', args)
    throw new Error('OsmoSwapper: executeQuote unimplemented')
  }

  getDefaultPair(): [CAIP19, CAIP19] {
    throw new Error('OsmoSwapper: getDefaultPair unimplemented')
  }

  async approvalNeeded(): Promise<ApprovalNeededOutput> {
    const result = { approvalNeeded: false }
    return result
  }

  async approveInfinite(): Promise<string> {
    throw new Error('OsmoSwapper: approveInfinite unimplemented')
  }

  filterBuyAssetsBySellAssetId(args: BuyAssetBySellIdInput): CAIP19[] {
    const { sellAssetId } = args
    if (!this.supportAssets.includes(sellAssetId)) return []
    return this.supportAssets
  }

  filterAssetIdsBySellable(): CAIP19[] {
    return this.supportAssets
  }
}
