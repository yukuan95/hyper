import { state, Color, CONST } from './Store'
import { ConfigProvider, theme } from 'antd'
import { useEffect, memo } from 'react'
import { useSnapshot } from 'valtio'
import { FlexStyle } from './Css'
import { Candle } from './Candle'
import * as store from './Store'
import * as lib from './Lib'

function initWebsocket() {
  const socket = new WebSocket(CONST.WsUrl)
  socket.onopen = () => {
    socket.send(JSON.stringify({
      "method": "subscribe",
      "subscription": { "type": "allMids" }
    }))
    socket.send(JSON.stringify({
      "method": "subscribe",
      "subscription": {
        "type": "candle",
        "coin": "BTC",
        "interval": "15m",
      }
    }))
    socket.send(JSON.stringify({
      "method": "subscribe",
      "subscription": {
        "type": "webData2",
        "user": CONST.AccountAddress,
      }
    }))
  }
  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      if (data.channel === 'allMids') {
        const price = Number.parseFloat(data?.data?.mids?.BTC)
        if (!Number.isNaN(price)) {
          state.price = price
        }
      }
      if (data.channel === 'candle') {
        if (data?.data) {
          state.candle = data?.data
        }
      }
      if (data.channel === 'webData2') {
        const assetPositions = data.data.clearinghouseState?.assetPositions ?? []
        const item = assetPositions.find((item: any) => item.position?.coin === 'BTC')
        if (item.position) {
          let { szi, entryPx, positionValue, unrealizedPnl } = item.position
          if (szi.at(0) === '-') {
            positionValue = '-' + positionValue
          }
          state.position = { entryPrice: entryPx, positionValue, unrealizedPnl }
        }
      }
    } catch { }
  }
}

function initColorScheme() {
  const themeMedia = window.matchMedia("(prefers-color-scheme: light)")
  state.isLight = themeMedia.matches
  themeMedia.onchange = ({ matches }) => state.isLight = matches
}

async function getValueHistory(): Promise<{
  accountValue: Array<{ time: string, value: number }>;
  totalPnL: Array<{ time: string, value: number }>;
}> {
  const res: any = await lib.fetchJson({
    url: CONST.InfoUrl, method: 'POST',
    body: { "type": "portfolio", "user": CONST.AccountAddress }
  })
  const his = res?.find((item: any) => item?.[0] === 'allTime')?.[1] ?? {}
  const accountValueHistory = his.accountValueHistory ?? []
  const pnlHistory = his.pnlHistory ?? []
  return {
    accountValue: accountValueHistory.map((item: any) => {
      return { time: lib.milliTimeToStringTime(item[0]), value: Number(item[1]) }
    }),
    totalPnL: pnlHistory.map((item: any) => {
      return { time: lib.milliTimeToStringTime(item[0]), value: Number(item[1]) }
    })
  }
}

async function getUserFills(): Promise<{
  time: string, side: string, price: number, size: number, fee: number, closedPnl: number,
}> {
  let data: any = await store.fetchInfo({
    "type": "userFills", "user": CONST.AccountAddress
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

const App = memo(() => {
  async function a() {
    await getUserFills()
  }
  return <>
    <div><button onClick={() => a()}>123</button></div>
    <Candle></Candle>
  </>
})

export default memo(() => {
  const snap = useSnapshot(state)
  useEffect(() => {
    initColorScheme()
    initWebsocket()
  }, [])
  const f = FlexStyle()
  return (
    <ConfigProvider
      wave={{ disabled: true }}
      theme={{
        algorithm: snap.isLight ? theme.defaultAlgorithm : theme.darkAlgorithm,
        components: {
          Tooltip: {
            colorBgSpotlight: snap.isLight ? Color.white : Color.gray,
            colorTextLightSolid: snap.isLight ? Color.gray : Color.white,
          },
          Table: {
            cellPaddingBlockSM: 0,
            headerBorderRadius: 0,
          }
        },
      }}
    >
      <div className={f.fcc}>
        <App></App>
      </div>
    </ConfigProvider>
  )
})
