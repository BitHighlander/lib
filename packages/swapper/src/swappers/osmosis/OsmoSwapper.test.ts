/*
    osmo Swapper
 */
import { ChainAdapterManager } from '@shapeshiftoss/chain-adapters'

import { OsmoSwapper, ZrxSwapper } from '../..'
import { getRateInfo } from './OsmoService'
import { setupQuote } from './test-data/setupSwapQuote'

describe('OsmoSwapper', () => {
  const sellAmount = '1000000000000000000'

  const swapperDeps = {
    adapterManager: <ChainAdapterManager>{}
  }

  it('is true', () => {
    expect(true).toBeTruthy()
  })

  //get Quote
  it('Get Quote', async () => {
    const { quoteInput } = setupQuote()
    console.log('quoteInput: ', quoteInput)
    const swapper = new OsmoSwapper()
    //TODO mocking
    // ;(zrxService.get as jest.Mock<unknown>).mockReturnValue(
    //     Promise.resolve({
    //       data: { success: true, price: '100', gasPrice: '1000', estimatedGas: '1000000' }
    //     })
    // )
    //
    const quote = await swapper.getQuote(quoteInput)
    console.log('(output) quote: ', quote)
    expect(true).toBeTruthy()
  })
})
