import {
  createChart, LineSeries, CandlestickSeries, CrosshairMode
} from 'lightweight-charts'
import { useEffect, useRef, memo, useState } from 'react'
import { state, Color, useConst } from './Store'
import { ConfigProvider, theme } from 'antd'
import { subscribeKey } from 'valtio/utils'
import locale from 'antd/locale/zh_CN'
import { cx, css } from '@emotion/css'
import { useSnapshot } from 'valtio'
import * as store from './Store'
import * as lib from './Lib'
import { Button } from 'antd'

const FlexStyle = () => {
  return {
    fsbc: css`
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    `,
    fcc: css`
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
    `,
    container: css`
      width: ${useConst.width}px;
      padding-left: ${useConst.paddingLeft}px;
      padding-right: ${useConst.paddingRight}px;
    `,
  }
}

const Loading = memo(({ width, border }: {
  width: number, border: number
}) => {
  const style = css`
    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
    width: ${width}px;
    height: ${width}px;
    border-radius: 50%;
    border-top: ${border}px solid #e2e2e2;
    border-right: ${border}px solid #e2e2e2;
    border-bottom: ${border}px solid #e2e2e2;
    border-left: ${border}px solid #409eff;
    animation: spin 1.5s linear infinite;
  `
  return (<>
    <div className={cx(style)}></div>
  </>)
})

const Candle = memo(() => {
  const snap = useSnapshot(state)
  const chart: { current: any } = useRef(null)
  const data: { current: any } = useRef(null)
  const [isShowLoading, setIsShowLoading] = useState(true)
  const flexStyle = FlexStyle()

  function mapCandle(data: Array<any>): Array<any> {
    return data.map((item: any) => {
      return {
        time: item.t / 1000,
        open: Number(item.o), high: Number(item.h),
        low: Number(item.l), close: Number(item.c),
      }
    })
  }

  function calculateMA(data: Array<any>, count: number) {
    const avg = []
    for (let i of Array.from({ length: data.length }, ((_, i) => i))) {
      if (i < count - 1) {
        continue
      }
      let sum = 0
      for (let j of Array.from({ length: count }, ((_, i) => i))) {
        sum += data[i - j].close
      }
      avg.push({ time: data[i].time, value: Number.parseInt('' + (sum / count)) })
    }
    return avg
  }

  function setData(data: Array<any>) {
    const ma8Data = calculateMA(data, 8)
    const ma288Data = calculateMA(data, 288)
    const ma8Series = chart.current.addSeries(LineSeries, {
      color: '#4FC1FF', lineWidth: 1, lastValueVisible: false,
      priceLineVisible: false, crosshairMarkerVisible: false,
      priceFormat: {
        type: 'custom', minMove: 0.01, formatter: (price: any) => Number.parseInt(price),
      },
    })
    const ma288Series = chart.current.addSeries(LineSeries, {
      color: '#e82ac2', lineWidth: 1, lastValueVisible: false,
      priceLineVisible: false, crosshairMarkerVisible: false,
      priceFormat: {
        type: 'custom', minMove: 0.01, formatter: (price: any) => Number.parseInt(price),
      },
    })
    ma8Series.setData(ma8Data)
    ma288Series.setData(ma288Data)
    const candlestickSeries = chart.current.addSeries(CandlestickSeries);
    candlestickSeries.setData(data)
    candlestickSeries.applyOptions({
      priceFormat: {
        type: 'custom', formatter: (price: any) => Number.parseInt(price),
      },
    })
    chart.current.timeScale().applyOptions({
      tickMarkFormatter: (time: any) => {
        return lib.milliTimeToStringTime(time * 1000).slice(5, 10)
      },
    })
    chart.current.applyOptions({
      localization: {
        timeFormatter: (timestamp: any) => {
          return lib.milliTimeToStringTime(timestamp * 1000).slice(0, 16)
        },
      },
    })
    return { ma8Series, ma288Series, candlestickSeries }
  }

  function getHeight(isShowCandle = snap.isShowCandle): number {
    return isShowCandle ? 350 : 150
  }

  function getWidth(): number {
    const { width, paddingLeft, paddingRight } = useConst
    return width - paddingLeft - paddingRight
  }

  function getBackgroundColor(): string {
    const n = snap.isLight ? 255 : 1
    return `rgba(${n}, ${n}, ${n}, 0.2)`
  }

  const style = {
    container: css`
      height: ${getHeight()}px;
      position: relative;
    `,
    loadingC: css`
      height: ${getHeight()}px;
      width: ${getWidth()}px;
      z-index: 3;
      position: absolute;
      background: ${getBackgroundColor()};
      backdrop-filter: blur(5px);
    `,
    button: css`
      z-index: 2;
      position: absolute;
      top: 0;
      right: 70px;
    `
  }

  useEffect(() => {
    async function init() {
      try {
        const dataRes: Array<any> = await store.fetchInfo({
          "type": "candleSnapshot",
          "req": {
            "coin": "BTC", "interval": "15m", "endTime": lib.getNowMilliTime(),
            "startTime": lib.getNowMilliTime() - lib.timesToMilli({ days: 50 }),
          }
        })
        setIsShowLoading(false)
        data.current = mapCandle(dataRes)
        const setDataRes = setData(data.current)
        const { ma8Series, ma288Series, candlestickSeries } = setDataRes
        subscribeKey(state, 'candle', () => {
          const candle = mapCandle([state.candle])[0]
          if (state.candle.t > data.current.at(-1).t) {
            data.current.push(candle)
          } else {
            data.current[data.current.length - 1] = candle
          }
          ma8Series.update(calculateMA(data.current, 8).at(-1))
          ma288Series.update(calculateMA(data.current, 288).at(-1))
          candlestickSeries.update(data.current.at(-1))
        })
      } catch {
        setIsShowLoading(false)
      }
    }
    init()
    const darkTheme = {
      layout: {
        background: { color: '#141414' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: 'rgba(42, 46, 57, 0.6)' },
        horzLines: { color: 'rgba(42, 46, 57, 0.6)' },
      },
    }
    const lightTheme = {
      layout: {
        background: { color: '#FFFFFF', },
        textColor: '#191919',
      }, grid: {
        vertLines: { color: 'rgba(197, 203, 206, 0.5)' },
        horzLines: { color: 'rgba(197, 203, 206, 0.5)' },
      },
    }
    chart.current = createChart(document.getElementById('chart') as any, {
      width: getWidth(), height: getHeight(),
      localization: {
        priceFormatter: (price: any) => {
          return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 0, maximumFractionDigits: 0,
          }).format(price)
        },
      },
    } as any)
    chart.current.applyOptions(snap.isLight ? lightTheme : darkTheme)
    chart.current.applyOptions({ crosshair: { mode: CrosshairMode.Normal } })
    subscribeKey(state, 'isShowCandle', () => {
      chart.current.applyOptions({ width: getWidth(), height: getHeight(state.isShowCandle) })
    })
    subscribeKey(state, 'isLight', () => {
      chart.current.applyOptions(state.isLight ? lightTheme : darkTheme)
    })
  }, [])

  return (<>
    <div className={cx(flexStyle.container, flexStyle.fcc, style.container)}>
      <div style={{ zIndex: 1 }} id="chart"></div>
      {(isShowLoading) ?
        <div className={cx(style.loadingC, flexStyle.fcc)}>
          <Loading width={30} border={3}></Loading>
        </div> :
        <div className={cx(style.button)}>
          {snap.isShowCandle ?
            <Button onClick={() => state.isShowCandle = !snap.isShowCandle} style={{ width: '30px', height: '30px', padding: '0' }}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13A.5.5 0 0 1 1 8m7-8a.5.5 0 0 1 .5.5v3.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 1 .708-.708L7.5 4.293V.5A.5.5 0 0 1 8 0m-.5 11.707-1.146 1.147a.5.5 0 0 1-.708-.708l2-2a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 11.707V15.5a.5.5 0 0 1-1 0z" />
            </svg></Button> :
            <Button onClick={() => state.isShowCandle = !snap.isShowCandle} style={{ width: '30px', height: '30px', padding: '0' }}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13A.5.5 0 0 1 1 8M7.646.146a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 1.707V5.5a.5.5 0 0 1-1 0V1.707L6.354 2.854a.5.5 0 1 1-.708-.708zM8 10a.5.5 0 0 1 .5.5v3.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 0 1 .708-.708L7.5 14.293V10.5A.5.5 0 0 1 8 10" />
            </svg></Button>
          }
        </div>}
    </div>
  </>)
})


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
