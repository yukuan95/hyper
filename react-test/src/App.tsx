import { useEffect, memo, useMemo } from 'react'
import { ValueHistory } from './ValueHistory'
import { state, Color, CONST } from './Store'
import { ConfigProvider, theme } from 'antd'
import { UserFills } from './UserFills'
import { cx, css } from '@emotion/css'
import { Line, Loading } from './Comp'
import { ThemeButton } from './Theme'
import { useSnapshot } from 'valtio'
import { FlexStyle } from './Css'
import { Candle } from './Candle'
import { Price } from './Price'
import { numeral } from './Lib'

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
          state.position = {
            entryPrice: numeral(entryPx).format('0,0.0'),
            positionValue: numeral(positionValue).format('0,0.0000'),
            unrealizedPnl: numeral(unrealizedPnl).format('0,0.0000'),
          }
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

const _App = memo(() => {
  return <>
    <div style={{ height: '10px' }}></div>
    <ThemeButton></ThemeButton>
    <div style={{ height: '10px' }}></div>
    <Price></Price>
    <div style={{ height: '10px' }}></div>
    <Line></Line>
    <div style={{ height: '10px' }}></div>
    <Candle></Candle>
    <div style={{ height: '10px' }}></div>
    <ValueHistory></ValueHistory>
    <div style={{ height: '10px' }}></div>
    <UserFills></UserFills>
    <div style={{ height: '300px' }}></div>
  </>
})

const App = memo(() => {
  const snap = useSnapshot(state)
  const f = FlexStyle()
  const isLoading = useMemo(() => {
    if (snap.isShowCandle && snap.isShowPrice && snap.isShowHistory && snap.isShowFills) {
      return false
    }
    return true
  }, [snap.isShowCandle, snap.isShowPrice, snap.isShowHistory, snap.isShowFills])
  const style = () => {
    return {
      loading: css`
        position: fixed;
        z-index: 3;
        width: 100%;
        height: 100%;
        left: 0;
        top: 0;
        backdrop-filter: blur(5px);
      `
    }
  }
  const s = style()
  return <>
    {isLoading ? <div className={cx(s.loading, f.fcc)}><Loading width={30} border={3}></Loading></div> : <></>}
    <div><_App></_App></div>
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
