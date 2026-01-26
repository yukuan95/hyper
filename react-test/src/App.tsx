import { ConfigProvider, theme } from 'antd'
import { useEffect, memo } from 'react'
import { state, Color } from './Store'
import locale from 'antd/locale/zh_CN'
import { useSnapshot } from 'valtio'
import { Candle } from './Candle'
import { FlexStyle } from './Css'

function initWebsocket() {
  const socket = new WebSocket('wss://api.hyperliquid.xyz/ws')
  socket.onopen = () => {
    socket.send(JSON.stringify({
      "method": "subscribe",
      "subscription": { "type": "allMids" }
    }));
    socket.send(JSON.stringify({
      "method": "subscribe",
      "subscription": {
        "type": "candle",
        "coin": "BTC",
        "interval": "15m",
      }
    }));
  };
  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      if (data.channel === 'allMids') {
        const price = Number.parseInt(data?.data?.mids?.BTC)
        if (!Number.isNaN(price)) {
          state.price = price
        }
      }
      if (data.channel === 'candle') {
        if (data?.data) {
          state.candle = data?.data
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
      locale={locale}
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
