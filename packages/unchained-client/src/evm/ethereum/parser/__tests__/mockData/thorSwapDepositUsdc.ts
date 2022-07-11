import { THOR_ROUTER_CONTRACT_MAINNET } from '../../constants'

export default {
  tx: {
    txid: '0xc88ccc23a6d5b23b67a093aa3f3c58416af34bb45f169b9e97a84fec2d15de87',
    blockHash: '0xd5eff3f2f132e0861398c207170d4bf85d09bc4dd9b234a64daaa9d7760c362e',
    blockHeight: 12518044,
    timestamp: 1622141232,
    status: 1,
    from: '0x5a8C5afbCC1A58cCbe17542957b587F46828B38E',
    to: THOR_ROUTER_CONTRACT_MAINNET,
    confirmations: 2295267,
    value: '0',
    fee: '4700280000000000',
    gasLimit: '78338',
    gasUsed: '78338',
    gasPrice: '60000000000',
    inputData:
      '0x1fece7b4000000000000000000000000fb43496982b951c36a27b2be21b3f7d5fa689ca9000000000000000000000000a0b86991c6218b36c1d19d4a2e9eb0ce3606eb4800000000000000000000000000000000000000000000000000000003dd5ed4d900000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000047535741503a54484f522e52554e453a74686f723168686a75706b7a793374366363656c687a377177386570797834726d386130366e6c6d3563653a31313039323836343231313100000000000000000000000000000000000000000000000000',
    tokenTransfers: [
      {
        contract: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        decimals: 6,
        name: 'USD Coin',
        symbol: 'USDC',
        type: 'ERC20',
        from: '0x5a8C5afbCC1A58cCbe17542957b587F46828B38E',
        to: THOR_ROUTER_CONTRACT_MAINNET,
        value: '16598881497'
      }
    ]
  }
}