import { state, Color, CONST } from './Store'
import { ConfigProvider, theme } from 'antd'
import { useEffect, memo } from 'react'
import { useSnapshot } from 'valtio'
import { FlexStyle } from './Css'
import { Candle } from './Candle'
import { Price } from './Price'
import { numeral } from './Lib'
import { Line } from './Comp'

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
          document.title = numeral(state.price).format('0,0.0')
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

const App = memo(() => {
  return <>
    <div><button onClick={() => state.isLight = !state.isLight}>button</button></div>
    <div style={{ height: '30px' }}></div>
    <Price></Price>
    <div style={{ height: '15px' }}></div>
    <Line></Line>
    <div style={{ height: '15px' }}></div>
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
            colorBgSpotlight: snap.isLight ? Color.white : Color.blackGray,
            colorTextLightSolid: snap.isLight ? Color.blackGray : Color.white,
          },
          Table: {
            cellPaddingBlockSM: 0,
            headerBorderRadius: 0,
          }
        },
      }}
    >
      <div className={f.fColumnCenter}>
        <App></App>
      </div>
    </ConfigProvider>
  )
})
