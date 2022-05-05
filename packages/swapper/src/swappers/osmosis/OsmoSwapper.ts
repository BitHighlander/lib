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
import { BuyAssetBySellIdInput, Swapper } from '../../api'
import { DEFAULT_SLIPPAGE_TOLERANCE, DEFAULT_SOURCE, MAX_SWAPPER_SELL } from './constants'
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
  /*
  input:
      {
        "sellAsset": {
            "assetId": "cosmos:osmosis-1/slip44:118",
            "chainId": "cosmos:osmosis-1",
            "caip19": "cosmos:osmosis-1/slip44:118",
            "caip2": "cosmos:osmosis-1",
            "chain": "osmosis",
            "dataSource": "coingecko",
            "network": "OSMOSIS_MAINNET",
            "symbol": "OSMO",
            "name": "Osmosis",
            "precision": 6,
            "slip44": 60,
            "color": "#FFFFFF",
            "secondaryColor": "#FFFFFF",
            "icon": "https://raw.githubusercontent.com/cosmos/chain-registry/master/osmosis/images/osmo.png",
            "explorer": "https://mintscan.io",
            "explorerAddressLink": "https://mintscan.io/cosmos/account",
            "explorerTxLink": "https://mintscan.io/cosmos/txs/",
            "sendSupport": true,
            "receiveSupport": true
        },
        "buyAsset": {
            "assetId": "cosmos:cosmoshub-4/slip44:118",
            "chainId": "cosmos:cosmoshub-4",
            "caip19": "cosmos:cosmoshub-4/slip44:118",
            "caip2": "cosmos:cosmoshub-4",
            "chain": "cosmos",
            "dataSource": "coingecko",
            "network": "COSMOSHUB_MAINNET",
            "symbol": "ATOM",
            "name": "Cosmos",
            "precision": 6,
            "slip44": 118,
            "color": "#FFFFFF",
            "secondaryColor": "#FFFFFF",
            "icon": "https://assets.coincap.io/assets/icons/256/atom.png",
            "explorer": "https://www.mintscan.io/cosmos",
            "explorerAddressLink": "https://www.mintscan.io/cosmos/account/",
            "explorerTxLink": "https://www.mintscan.io/cosmos/txs/",
            "sendSupport": true,
            "receiveSupport": true
        },
        "sellAmount": "0"
      }

    //output
    {
    "sellAsset": {
        "assetId": "eip155:1/slip44:60",
        "chainId": "eip155:1",
        "caip19": "eip155:1/slip44:60",
        "caip2": "eip155:1",
        "chain": "ethereum",
        "dataSource": "coingecko",
        "network": "MAINNET",
        "symbol": "ETH",
        "name": "Ethereum",
        "precision": 18,
        "slip44": 60,
        "color": "#FFFFFF",
        "secondaryColor": "#FFFFFF",
        "icon": "https://assets.coincap.io/assets/icons/256/eth.png",
        "explorer": "https://etherscan.io",
        "explorerAddressLink": "https://etherscan.io/address/",
        "explorerTxLink": "https://etherscan.io/tx/",
        "sendSupport": true,
        "receiveSupport": true
    },
    "buyAsset": {
        "assetId": "eip155:1/erc20:0xc770eefad204b5180df6a14ee197d99d808ee52d",
        "chainId": "eip155:1",
        "caip19": "eip155:1/erc20:0xc770eefad204b5180df6a14ee197d99d808ee52d",
        "caip2": "eip155:1",
        "name": "Fox",
        "precision": 18,
        "tokenId": "0xc770eefad204b5180df6a14ee197d99d808ee52d",
        "contractType": "erc20",
        "color": "#FFFFFF",
        "dataSource": "coingecko",
        "secondaryColor": "#FFFFFF",
        "icon": "https://rawcdn.githack.com/trustwallet/assets/master/blockchains/ethereum/assets/0xc770EEfAd204B5180dF6a14Ee197D99d808ee52d/logo.png",
        "sendSupport": true,
        "receiveSupport": true,
        "symbol": "FOX",
        "chain": "ethereum",
        "network": "MAINNET",
        "slip44": 60,
        "explorer": "https://etherscan.io",
        "explorerAddressLink": "https://etherscan.io/address/",
        "explorerTxLink": "https://etherscan.io/tx/"
    },
    "minimum": "0.000349137900010036",
    "maximum": "100000000000000000000000000",
    "success": false,
    "statusCode": -1,
    "statusReason": "Unknown Error"
    }
}

   */
  async getQuote(input: GetQuoteInput): Promise<Quote<ChainTypes>> {
    const { sellAsset, buyAsset, sellAmount, minimum, slippage } = input

    if (!sellAmount) {
      throw new Error('sellAmount is required')
    }

    const { rate, priceImpact, tradeFee, buyAmount } = await getRateInfo(
      sellAsset,
      buyAsset,
      sellAmount !== '0' ? sellAmount : '1'
    )
    console.log('******: ', { rate, priceImpact, tradeFee, buyAmount })

    // @ts-ignore
    return {
      priceImpact,
      buyAsset,
      minimum,
      // maximum: MAX_SWAPPER_SELL,
      rate,
      sellAsset,
      slippage,
      success: true,
      statusCode: 0,
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
      slippage = DEFAULT_SLIPPAGE_TOLERANCE,
      priceImpact
    } = input.input

    if (!sellAmount) throw new Error('OsmosisSwapper:buildQuoteTx sellAmount is required')

    const { tradeFee, buyAmount } = await getRateInfo(sellAsset, buyAsset, sellAmount)
    console.log('resp: ', { tradeFee, buyAmount })

    return {
      success: true,
      statusCode: 0,
      sellAsset,
      buyAsset,
      depositAddress: '',
      // feeData: { fee: '100', receiveNetworkFee: tradeFee },
      sellAmount: sellAmount,
      buyAmount: buyAmount,
      sources: DEFAULT_SOURCE,
      slippage,
      priceImpact,
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
