// import { CAIP19 } from '@shapeshiftoss/caip'
// @ts-ignore
import {
  ChainAdapterManager,
  // @ts-ignore
  CosmosChainAdapter,
  // @ts-ignore
  OsmosisChainAdapter
  // @ts-ignore
} from '@shapeshiftoss/chain-adapters/*'
import {
  bip32ToAddressNList,
  CosmosWallet,
  HDWallet,
  OsmosisWallet
} from '@shapeshiftoss/hdwallet-core'
import {
  ApprovalNeededOutput,
  Asset, ChainTypes,
  // BuildQuoteTxInput,
  // ChainTypes,
  // ExecQuoteInput,
  ExecQuoteOutput,
  // GetQuoteInput,
  MinMaxOutput,
  // Quote,
  SwapperType
  // @ts-ignore
} from '@shapeshiftoss/types'
import axios from 'axios'
import { sleep } from 'wait-promise'

// import { getRate } from '../../api'
import {
  BuildTradeInput,
  BuyAssetBySellIdInput,
  CommonTradeInput,
  // ExecuteTradeInput,
  Swapper,
  // Trade,
  // TradeQuote
} from '../../api'
import { DEFAULT_SOURCE } from './constants'
// @ts-ignore
import { getRateInfo, IsymbolDenomMapping, symbolDenomMapping, getAtomChannelBalance } from './OsmoService'

const osmoUrl =
  'https://osmosis-1--lcd--full.datahub.figment.io/apikey/0180433904229d03ca0e8370b0ff3fb8'
// const osmoUrl = 'https://lcd-osmosis.keplr.app'
const atomUrl =
  'https://cosmoshub-4--lcd--full.datahub.figment.io/apikey/06fa766d1a458fe25081e83ffdf085ae'

const getMin = async function () {
  return {
    minimum: '0',
    maximum: '1000'
  }
}

export type OsmoSwapperDeps = {
  wallet: HDWallet
  adapterManager: ChainAdapterManager
}

/**
 * Playground for testing different scenarios of multiple swappers in the manager.
 * Meant for local testing only
 */
export class OsmoSwapper implements Swapper {
  supportAssets: string[]
  deps: OsmoSwapperDeps

  getType() {
    return SwapperType.Osmosis
  }

  constructor(deps: OsmoSwapperDeps) {
    this.deps = deps
    this.supportAssets = ['cosmos:cosmoshub-4/slip44:118', 'cosmos:osmosis-1/slip44:118']
  }

  async getTradeQuote(input: CommonTradeInput): Promise<any> {
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

    return {
      buyAsset,
      feeData: { fee: '100' },
      maximum: '100',
      minimum: '10000',
      sellAssetAccountId: '0',
      rate,
      sellAsset,
      success: true,
      sellAmount,
      buyAmount,
      sources: DEFAULT_SOURCE
    }
  }

  async buildTrade(args: BuildTradeInput): Promise<any> {
    const { sellAsset, buyAsset, sellAmount } = args

    if (!sellAmount) {
      throw new Error('sellAmount is required')
    }

    const { rate, buyAmount } = await getRateInfo(
      sellAsset,
      buyAsset,
      sellAmount !== '0' ? sellAmount : '1'
    )

    //convert amount to base
    let amountBaseSell: number = parseFloat(sellAmount) * 1000000
    amountBaseSell = parseInt(String(amountBaseSell))
    const amountBaseSellString = amountBaseSell.toString()

    // @ts-ignore
    return {
      buyAmount,
      buyAsset,
      depositAddress: '',
      feeData: { fee: '100' },
      rate,
      receiveAddress: '',
      sellAmount: amountBaseSellString,
      sellAsset,
      sellAssetAccountId: '0',
      sources: [{ name: 'Osmosis', proportion: '100' }],
      success: true
    }
  }

  async executeTrade(args: any): Promise<ExecQuoteOutput> {
    console.info('args: ', args)
    // const {
    //   // @ts-ignore
    //   quote: { sellAsset, buyAsset, sellAmount }
    // } = args.quote
    const sellAsset = args.trade.sellAsset
    const buyAsset = args.trade.buyAsset
    const sellAmount = args.trade.sellAmount
    const wallet = args.wallet
    if (!sellAsset) throw Error('missing sellAsset')
    if (!buyAsset) throw Error('missing buyAsset')
    if (!sellAmount) throw Error('missing sellAmount')
    if (!wallet) throw Error('missing wallet')

    const pair = sellAsset.symbol + '_' + buyAsset.symbol
    console.info('pair: ', pair)
    const sellAssetDenom = symbolDenomMapping[sellAsset.symbol as keyof IsymbolDenomMapping]
    const buyAssetDenom = symbolDenomMapping[buyAsset.symbol as keyof IsymbolDenomMapping]
    console.info('sellAssetDenom: ', sellAssetDenom)
    console.info('buyAssetDenom: ', buyAssetDenom)


    const fee = '100'
    const gas = '1350000'

    console.info('sellAsset.chain: ', sellAsset.chain)
    console.info('deps: ', this.deps)
    const osmosisAdapter = this.deps.adapterManager.byChain(ChainTypes.Osmosis) as OsmosisChainAdapter
    console.info('osmosisAdapter: ', osmosisAdapter)

    const cosmosAdapter = this.deps.adapterManager.byChain(ChainTypes.Cosmos) as OsmosisChainAdapter
    console.info('cosmosAdapter: ', cosmosAdapter)

    console.info('args: ', args)
    console.info('wallet: ', wallet)
    const osmoAddress = await (wallet as OsmosisWallet).osmosisGetAddress({
      addressNList: bip32ToAddressNList("m/44'/118'/0'/0/0")
    })
    const atomAddress = await (wallet as CosmosWallet).cosmosGetAddress({
      addressNList: bip32ToAddressNList("m/44'/118'/0'/0/0")
    })
    if(!osmoAddress) throw Error("Failed to get osmoAddress!")
    if(!atomAddress) throw Error("Failed to get atomAddress!")
    //get IBC balance
    //if ibc balance low
    //then do ibc deposit FIRST
    //wait
    let sellAddress
    let buyAddress
    //if pair
    if(pair === 'ATOM_OSMO'){
      //check IBC balance
      //TODO verify input balance
      console.info('osmoAddress: ', osmoAddress)
      let atomChannelBalance = await getAtomChannelBalance(osmoAddress)
      console.info('atomChannelBalance: ', atomChannelBalance)

      sellAddress = atomAddress
      buyAddress = osmoAddress

      //perform IBC deposit
      const transfer = {
        sender: sellAddress,
        receiver: buyAddress,
        amount: sellAmount
      }
      const txid = await this.performIbcTransfer(transfer, cosmosAdapter, wallet)
      console.info('txid: ', txid)

      //wait till confirmed
      console.info('txid: ', txid)
      let confirmed = false
      let timeStart = new Date().getTime()
      while (!confirmed) {
        //get info
        try {
          let txInfo = await axios({
            method: 'GET',
            url: `${atomUrl}/cosmos/tx/v1beta1/txs/${txid.txid}`
          })
          txInfo = txInfo.data
          console.info('txInfo: ', txInfo)

          //@ts-ignore
          if (txInfo?.tx_response?.height) confirmed = true
        } catch (e) {
          let timeNow = new Date().getTime()
          let duration = timeNow - timeStart
          console.info('txid Not found yet! duration: '+duration / 1000)
        }
        await sleep(3000)
      }
    } else if(pair === 'OSMO_ATOM'){
      sellAddress = osmoAddress
      buyAddress = atomAddress
    } else {
      throw Error("Pair not supported! "+pair)
    }

    if (!sellAddress) throw new Error('no sell address')
    if (!buyAddress) throw new Error('no buy address')
    console.info('sellAddress: ', sellAddress)
    console.info('buyAddress: ', buyAddress)
    let sender = osmoAddress
    const accountUrl = `${osmoUrl}/auth/accounts/${sender}`
    console.info('accountUrl: ', accountUrl)
    const responseAccount = await axios.get(accountUrl)
    console.info('responseAccount: ', responseAccount.data)
    const accountNumber = responseAccount.data.result.value.account_number || 0
    const sequence = responseAccount.data.result.value.sequence || 0
    console.info('accountNumber: ', accountNumber)
    console.info('sequence: ', sequence)
    const osmoAddressNList = bip32ToAddressNList("m/44'/118'/0'/0/0")



    const tx1 = {
      memo: '',
      fee: {
        amount: [
          {
            amount: fee.toString(),
            denom: 'uosmo'
          }
        ],
        gas: gas.toString()
      },
      signatures: null,
      msg: [
        {
          type: 'osmosis/gamm/swap-exact-amount-in',
          value: {
            sender,
            routes: [
              {
                poolId: '1', // TODO should probably get this from the util pool call
                tokenOutDenom: buyAssetDenom
              }
            ],
            tokenIn: {
              denom: sellAssetDenom,
              amount: sellAmount
            },
            tokenOutMinAmount: '1' // TODO slippage tolerance
          }
        }
      ]
    }

    const signTxInput = {
      txToSign: {
        tx: tx1,
        addressNList: osmoAddressNList,
        chain_id: 'osmosis-1',
        account_number: accountNumber,
        sequence
      },
      wallet
    }
    console.info('signTxInput: ', signTxInput)
    console.info('signTxInput: ', JSON.stringify(signTxInput))
    const signed = await osmosisAdapter.signTransaction(signTxInput)
    console.info('signed: ', signed)

    //if broadcast
    const payload = {
      tx_bytes: signed,
      mode: 'BROADCAST_MODE_SYNC'
    }
    const urlRemote = osmoUrl + '/cosmos/tx/v1beta1/txs'
    let txid1 = await axios({
      url: urlRemote,
      method: 'POST',
      data: payload
    })
    txid1 = txid1.data?.tx_response.txhash
    console.info('txid1: ', txid1)

    if(pair === 'OSMO_ATOM'){
      //wait till confirmed
      console.info('txid1: ', txid1)
      let confirmed = false
      let timeStart = new Date().getTime()
      while (!confirmed) {
        //get info
        try {
          let txInfo = await axios({
            method: 'GET',
            url: `${osmoUrl}/cosmos/tx/v1beta1/txs/${txid1}`
          })
          txInfo = txInfo.data
          console.info('txInfo: ', txInfo)

          //@ts-ignore
          if (txInfo?.tx_response?.height) confirmed = true
        } catch (e) {
          let timeNow = new Date().getTime()
          let duration = timeStart - timeNow
          console.info('txid Not found yet! duration: '+duration / 1000)
        }
        await sleep(3000)
      }

      //perform IBC deposit
      const transfer = {
        sender: sellAddress,
        receiver: buyAddress,
        amount: sellAmount
      }
      const txid = await this.performIbcTransfer(transfer, cosmosAdapter, wallet)
      console.info('txid: ', txid)


    }

    // @ts-ignore
    return { txid: txid1 || 'error' }
  }

  async performIbcTransfer(input: any, adapter: any, wallet: any): Promise<any> {
    let { sender, receiver, amount } = input
    console.info('performIbcTransfer input: ', input)

    // const fee = '100'
    const gas = '1350000'

    //get block height
    const atomResponseLatestBlock = await axios.get(`${atomUrl}/blocks/latest`)
    const atomLatestBlock = atomResponseLatestBlock.data.block.header.height
    console.info('atomLatestBlock: ', atomLatestBlock)

    const addressNList = bip32ToAddressNList("m/44'/118'/0'/0/0")

    const atomAccountUrl = `${atomUrl}/auth/accounts/${sender}`
    const atomResponseAccount = await axios.get(atomAccountUrl)
    console.info('atomResponseAccount: ', atomResponseAccount)
    const atomAccountNumber = atomResponseAccount.data.result.value.account_number
    const atomSequence = atomResponseAccount.data.result.value.sequence
    console.info('atomAccountNumber: ', atomAccountNumber)
    console.info('atomSequence: ', atomSequence)
    amount = amount/1000000
    if (!atomAccountNumber) throw new Error('no atom account number')

    const tx1 = {
      memo: '',
      fee: {
        amount: [
          {
            amount: '0', // having a fee here causes error
            denom: 'uosmo'
          }
        ],
        gas: gas.toString()
      },
      signatures: null,
      msg: [
        {
          type: 'cosmos-sdk/MsgTransfer',
          value: {
            source_port: 'transfer',
            source_channel: 'channel-141',
            token: {
              denom: 'uatom',
              amount
            },
            sender,
            receiver,
            timeout_height: {
              revision_number: '4',
              revision_height: String(Number(atomLatestBlock) + 100)
            }
          }
        }
      ]
    }

    console.info('adapter: ', adapter)
    const signed = await adapter.signTransaction({
      txToSign: {
        tx: tx1,
        addressNList,
        chain_id: 'cosmoshub-4',
        account_number: atomAccountNumber,
        sequence: atomSequence
      },
      wallet: wallet as CosmosWallet
    })
    console.info('signed:', signed)

    const payload = {
      tx_bytes: signed,
      mode: 'BROADCAST_MODE_SYNC'
    }
    const urlRemote = atomUrl + '/cosmos/tx/v1beta1/txs'
    let txid1 = await axios({
      url: urlRemote,
      method: 'POST',
      data: payload
    })
    console.info('txid1.data: ', txid1.data)
    txid1 = txid1.data?.tx_response.txhash
    console.info('txid1: ', txid1)

    return {
      txid: txid1
    }
  }

  getUsdRate(input: Pick<Asset, 'symbol' | 'tokenId'>): Promise<string> {
    console.info(input)
    throw new Error('OsmoSwapper: getUsdRate unimplemented')
  }

  getMinMax(input: any): Promise<MinMaxOutput> {
    console.info(input)
    return getMin()
  }

  // async executeQuote(args: ExecQuoteInput<ChainTypes>): Promise<ExecQuoteOutput> {
  //   console.info('args: ', args)
  //   // const {
  //   //   // @ts-ignore
  //   //   quote: { sellAsset, buyAsset, sellAmount }
  //   // } = args.quote
  //   const sellAsset = args.quote.sellAsset
  //   const buyAsset = args.quote.buyAsset
  //   const sellAmount = args.quote.sellAmount
  //   const wallet = args.wallet
  //
  //   const sellAssetDenom = symbolDenomMapping[sellAsset.symbol as keyof IsymbolDenomMapping]
  //   const buyAssetDenom = symbolDenomMapping[buyAsset.symbol as keyof IsymbolDenomMapping]
  //
  //   const fee = '100'
  //   const gas = '1350000'
  //
  //   console.info('sellAsset.chain: ', sellAsset.chain)
  //   console.info('deps: ', this.deps)
  //   const osmosisAdapter = this.deps.adapterManager.byChain(sellAsset.chain) as OsmosisChainAdapter
  //   console.info('osmosisAdapter: ', osmosisAdapter)
  //
  //   // const osmosisAdapter = this.adapterManager.byNetwork(sellAsset.network) as OsmosisChainAdapter
  //
  //   console.info('args: ', args)
  //   console.info('wallet: ', wallet)
  //   const sellAddress = await (wallet as OsmosisWallet).osmosisGetAddress({
  //     addressNList: bip32ToAddressNList("m/44'/118'/0'/0/0")
  //   })
  //   const buyAddress = await (wallet as CosmosWallet).cosmosGetAddress({
  //     addressNList: bip32ToAddressNList("m/44'/118'/0'/0/0")
  //   })
  //
  //   //TODO verify input balance
  //
  //   //if ibc balance low
  //   //then do ibc deposit FIRST
  //   //wait
  //
  //   if (!sellAddress) throw new Error('no sell address')
  //   if (!buyAddress) throw new Error('no buy address')
  //   console.info('sellAddress: ', sellAddress)
  //   console.info('buyAddress: ', buyAddress)
  //
  //   const accountUrl = `${osmoUrl}/auth/accounts/${sellAddress}`
  //   console.info('accountUrl: ', accountUrl)
  //   const responseAccount = await axios.get(accountUrl)
  //   console.info('responseAccount: ', responseAccount.data)
  //   const accountNumber = responseAccount.data.result.value.account_number || 0
  //   const sequence = responseAccount.data.result.value.sequence || 0
  //   console.info('accountNumber: ', accountNumber)
  //   console.info('sequence: ', sequence)
  //
  //   const osmoAddressNList = bip32ToAddressNList("m/44'/118'/0'/0/0")
  //
  //   const tx1 = {
  //     memo: '',
  //     fee: {
  //       amount: [
  //         {
  //           amount: fee.toString(),
  //           denom: 'uosmo'
  //         }
  //       ],
  //       gas: gas.toString()
  //     },
  //     signatures: null,
  //     msg: [
  //       {
  //         type: 'osmosis/gamm/swap-exact-amount-in',
  //         value: {
  //           sender: sellAddress,
  //           routes: [
  //             {
  //               poolId: '1', // TODO should probably get this from the util pool call
  //               tokenOutDenom: buyAssetDenom
  //             }
  //           ],
  //           tokenIn: {
  //             denom: sellAssetDenom,
  //             amount: sellAmount
  //           },
  //           tokenOutMinAmount: '1' // TODO slippage tolerance
  //         }
  //       }
  //     ]
  //   }
  //
  //   const signTxInput = {
  //     txToSign: {
  //       tx: tx1,
  //       addressNList: osmoAddressNList,
  //       chain_id: 'osmosis-1',
  //       account_number: accountNumber,
  //       sequence
  //     },
  //     wallet
  //   }
  //   console.info('signTxInput: ', signTxInput)
  //   console.info('signTxInput: ', JSON.stringify(signTxInput))
  //
  //   const signed = await osmosisAdapter.signTransaction(signTxInput)
  //   console.info('signed: ', signed)
  //
  //   //if broadcast
  //   const payload = {
  //     tx_bytes: signed,
  //     mode: 'BROADCAST_MODE_SYNC'
  //   }
  //   const urlRemote = osmoUrl + '/cosmos/tx/v1beta1/txs'
  //   let txid1 = await axios({
  //     url: urlRemote,
  //     method: 'POST',
  //     data: payload
  //   })
  //   txid1 = txid1.data
  //   console.info('txid1: ', txid1)
  //
  //   // const signed = await osmosisAdapter.signAndBroadcastTransaction(signTxInput)
  //   // console.info('signed: ', signed)
  //
  //   // const broadcastTxInput = { tx: signed, symbol: 'OSMO', amount: '0', network: 'OSMO' }
  //   //
  //   // const txid1 = await osmosisAdapter.broadcastTransaction(broadcastTxInput)
  //
  //   // osmoToAtomCallback(
  //   //   txid1,
  //   //   sellAddress,
  //   //   gas,
  //   //   buyAssetDenom,
  //   //   buyAddress,
  //   //   wallet,
  //   //   accountUrl,
  //   //   osmosisAdapter,
  //   //   osmoAddressNList
  //   // )
  //   // @ts-ignore
  //   return { txid: txid1 }
  // }

  // async executeOsmoToAtomQuote(
  //   input: ExecQuoteInput,
  //   wallet: any
  // ): Promise<ExecQuoteOutput | undefined> {
  //   const {
  //     quote: { sellAsset, buyAsset, sellAmount }
  //   } = input
  //
  //   const sellAssetDenom = symbolDenomMapping[sellAsset.symbol as keyof IsymbolDenomMapping]
  //   const buyAssetDenom = symbolDenomMapping[buyAsset.symbol as keyof IsymbolDenomMapping]
  //
  //   const fee = '100'
  //   const gas = '1350000'
  //
  //   const osmosisAdapter = this.adapterManager.byNetwork(sellAsset.network) as OsmosisChainAdapter
  //
  //   const sellAddress = await (wallet as OsmosisWallet).osmosisGetAddress({
  //     addressNList: bip32ToAddressNList("m/44'/118'/0'/0/0")
  //   })
  //   const buyAddress = await (wallet as CosmosWallet).cosmosGetAddress({
  //     addressNList: bip32ToAddressNList("m/44'/118'/0'/0/0")
  //   })
  //
  //   if (!sellAddress) throw new SwapError('no sell address')
  //   if (!buyAddress) throw new SwapError('no buy address')
  //
  //   const accountUrl = `${osmoUrl}/auth/accounts/${sellAddress}`
  //   const responseAccount = await axios.get(accountUrl)
  //   const accountNumber = responseAccount.data.result.value.account_number
  //   const sequence = responseAccount.data.result.value.sequence
  //
  //   const osmoAddressNList = bip32ToAddressNList("m/44'/118'/0'/0/0")
  //
  //   const tx1 = {
  //     memo: '',
  //     fee: {
  //       amount: [
  //         {
  //           amount: fee.toString(),
  //           denom: 'uosmo'
  //         }
  //       ],
  //       gas: gas.toString()
  //     },
  //     signatures: null,
  //     msg: [
  //       {
  //         type: 'osmosis/gamm/swap-exact-amount-in',
  //         value: {
  //           sender: sellAddress,
  //           routes: [
  //             {
  //               poolId: '1', // TODO should probably get this from the util pool call
  //               tokenOutDenom: buyAssetDenom
  //             }
  //           ],
  //           tokenIn: {
  //             denom: sellAssetDenom,
  //             amount: sellAmount
  //           },
  //           tokenOutMinAmount: '1' // TODO slippage tolerance
  //         }
  //       }
  //     ]
  //   }
  //
  //   const signed = await osmosisAdapter.signTransaction(
  //     {
  //       symbol: 'OSMO',
  //       transaction: {
  //         tx: tx1,
  //         addressNList: osmoAddressNList,
  //         chain_id: 'osmosis-1',
  //         account_number: accountNumber,
  //         sequence
  //       }
  //     },
  //     wallet as any
  //   )
  //
  //   const broadcastTxInput = { tx: signed, symbol: 'OSMO', amount: '0', network: 'OSMO' }
  //
  //   const txid1 = await osmosisAdapter.broadcastTransaction(broadcastTxInput)
  //
  //   // osmoToAtomCallback(txid1, sellAddress, gas, buyAssetDenom, buyAddress, wallet, accountUrl, osmosisAdapter, osmoAddressNList)
  //   //
  //   return { txid: txid1 }
  // }


  async approvalNeeded(): Promise<ApprovalNeededOutput> {
    const result = { approvalNeeded: false }
    return result
  }

  async approveInfinite(): Promise<string> {
    throw new Error('OsmoSwapper: approveInfinite unimplemented')
  }

  filterBuyAssetsBySellAssetId(args: BuyAssetBySellIdInput): any[] {
    const { sellAssetId } = args
    if (!this.supportAssets.includes(sellAssetId)) return []
    return this.supportAssets
  }

  filterAssetIdsBySellable(): any[] {
    return this.supportAssets
  }
}
