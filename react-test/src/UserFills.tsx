import * as store from './Store'
import * as lib from './Lib'

async function getUserFills(): Promise<{
  time: string, side: string, price: number, size: number, fee: number, closedPnl: number,
}> {
  let data: any = await store.fetchInfo({
    "type": "userFills", "user": store.CONST.AccountAddress
  }) ?? []
  data = data.filter((item: any) => item.coin === 'BTC').map((item: any) => {
    let side = item.side
    if (item.side === 'A') {
      side = 'SHORT'
    }
    if (item.side === 'B') {
      side = 'LONG'
    }
    return {
      time: lib.milliTimeToStringTime(item.time),
      side: side, price: Number(item.px),
      closedPnl: Number(item.closedPnl),
      fee: Number(item.fee), size: Number(item.sz),
    }
  })
  data = data.reverse()
  const m = new Map<string, Array<any>>()
  for (const item of data) {
    const key = item.time + item.side
    if (m.has(key)) {
      m.get(key)?.push(item)
    } else {
      m.set(key, [item])
    }
  }
  data = []
  for (const value of m.values()) {
    const time = value[0].time
    const side = value[0].side
    const priceTotal = value.map((item) => item.price).reduce((a, b) => a + b, 0)
    const price = Number.parseInt('' + priceTotal / value.length)
    const size = value.map((item) => item.size).reduce((a, b) => lib.add(a, b), 0)
    const fee = value.map((item) => item.fee).reduce((a, b) => lib.add(a, b), 0)
    const closedPnl = value.map((item) => item.closedPnl).reduce((a, b) => lib.add(a, b), 0)
    data.push({ time, side, price, size, fee, closedPnl })
  }
  for (let i = 0; i < data.length; i++) {
    if (data[i].closedPnl === 0) {
      if (data[i - 1]) {
        data[i - 1].side = 'Hedge'
      }
    }
  }
  return data
}