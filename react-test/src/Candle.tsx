import {
  createChart, LineSeries, CandlestickSeries, CrosshairMode
} from 'lightweight-charts'
import { useState, useEffect, useRef, memo } from 'react'
import { subscribeKey } from 'valtio/utils'
import { state, useConst } from './Store'
import { cx, css } from '@emotion/css'
import { useSnapshot } from 'valtio'
import { FlexStyle } from './Css'
import { Loading } from './Comp'
import * as store from './Store'
import { Button } from 'antd'
import * as lib from './Lib'

function getMaColor(): { ma8Color: string, ma288Color: string } {
  const ma8Color = '#4FC1FF'
  const ma288Color = '#e82ac2'
  return { ma8Color, ma288Color }
}

function mapCandle(data: Array<{ o: string; c: string; h: string; l: string; t: number; }>)
  : Array<{ open: number; close: number; high: number; low: number; time: number; }> {
  return data.map((item: any) => {
    return {
      time: item.t / 1000,
      open: Number(item.o), high: Number(item.h),
      low: Number(item.l), close: Number(item.c),
    }
  })
}

function calculateMA(data: Array<{ close: number; time: number; }>, count: number)
  : Array<{ value: number; time: number; }> {
  const avg = []
  for (const i of Array.from({ length: data.length }, ((_, i) => i))) {
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

function getHeight(isShowCandle: boolean): number {
  return isShowCandle ? 350 : 150
}

function getWidth(): number {
  const { width, paddingLeft, paddingRight } = useConst
  return width - paddingLeft - paddingRight
}

function getBackgroundColor(isLight: boolean): string {
  const color = isLight ? `255,255,255` : `31,38,47`
  return `rgba(${color}}, 0.2)`
}

function getCandleStyle(height: number, background: string) {
  return {
    container: css`
      height: ${height}px;
      position: relative;
    `,
    loadingC: css`
      height: ${height}px;
      width: ${getWidth()}px;
      z-index: 3;
      position: absolute;
      background: ${background};
      backdrop-filter: blur(5px);
    `,
    button: css`
      z-index: 2;
      position: absolute;
      top: 0;
      right: 70px;
    `,
    legend: css`
      z-index: 2;
      position: absolute;
      top: 0;
      left: 10px;
      font-size: 12px;
      display: flex;
      gap: 10px;
      user-select: none;
    `,
  }
}

function setData(data: Array<any>, chart: { current: any })
  : { ma8Series: any; ma288Series: any; candlestickSeries: any; ma8Price: number; ma288Price: number; } {
  const { ma8Color, ma288Color } = getMaColor()
  const ma8Data = calculateMA(data, 8)
  const ma288Data = calculateMA(data, 288)
  const ma8Price = ma8Data.at(-1)?.value ?? 0
  const ma288Price = ma288Data.at(-1)?.value ?? 0
  const ma8Series = chart.current.addSeries(LineSeries, {
    color: ma8Color, lineWidth: 1, lastValueVisible: false,
    priceLineVisible: false, crosshairMarkerVisible: false,
    priceFormat: {
      type: 'custom', minMove: 0.01, formatter: (price: any) => Number.parseInt(price),
    },
  })
  const ma288Series = chart.current.addSeries(LineSeries, {
    color: ma288Color, lineWidth: 1, lastValueVisible: false,
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
  return { ma8Series, ma288Series, candlestickSeries, ma8Price, ma288Price }
}

async function init(setIsShowLoading: any, setMaPrice: any, data: { current: any }, chart: { current: any }) {
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
    const setDataRes = setData(data.current, chart)
    const { ma8Series, ma288Series, candlestickSeries } = setDataRes
    const { ma8Price, ma288Price } = setDataRes
    setMaPrice({ ma8Price, ma288Price })
    subscribeKey(state, 'candle', () => {
      const candle = mapCandle([state.candle])[0]
      if (state.candle.t > data.current.at(-1).t) {
        data.current.push(candle)
      } else {
        data.current[data.current.length - 1] = candle
      }
      const ma8Data = calculateMA(data.current, 8).at(-1)
      const ma288Data = calculateMA(data.current, 288).at(-1)
      ma8Series.update(ma8Data)
      ma288Series.update(ma288Data)
      setMaPrice({
        ma8Price: ma8Data?.value ?? 0,
        ma288Price: ma288Data?.value ?? 0,
      })
      candlestickSeries.update(data.current.at(-1))
    })
  } catch {
    setIsShowLoading(false)
  }
}

function getChartTheme() {
  const darkTheme = {
    layout: {
      background: { color: '#1F262F' },
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
  return { darkTheme, lightTheme }
}

function createChartF(chart: { current: any }, chartEl: any, isShowCandle: boolean, isLight: boolean) {
  chart.current = createChart(chartEl, {
    width: getWidth(), height: getHeight(isShowCandle),
    localization: {
      priceFormatter: (price: any) => {
        return new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 0, maximumFractionDigits: 0,
        }).format(price)
      },
    },
  } as any)
  const { lightTheme, darkTheme } = getChartTheme()
  chart.current.applyOptions(isLight ? lightTheme : darkTheme)
  chart.current.applyOptions({ crosshair: { mode: CrosshairMode.Normal } })
}

export const Candle = memo(() => {
  const [maPrice, setMaPrice] = useState({ ma8Price: 0, ma288Price: 0, })
  const [isShowLoading, setIsShowLoading] = useState(true)
  const [isShowCandle, setIsShowCandle] = useState(false)
  const chart: { current: any } = useRef(null)
  const data: { current: any } = useRef(null)
  const snap = useSnapshot(state)
  const flexStyle = FlexStyle()
  const style = getCandleStyle(
    getHeight(isShowCandle), getBackgroundColor(snap.isLight)
  )
  useEffect(() => {
    const chartEl = document.getElementById('chart')
    createChartF(chart, chartEl, isShowCandle, snap.isLight)
    init(setIsShowLoading, setMaPrice, data, chart)
    const unSubscribe = subscribeKey(state, 'isLight', () => {
      const { lightTheme, darkTheme } = getChartTheme()
      chart.current.applyOptions(state.isLight ? lightTheme : darkTheme)
    })
    return () => unSubscribe()
  }, [])
  useEffect(() => {
    chart.current.applyOptions({ width: getWidth(), height: getHeight(isShowCandle) })
  }, [isShowCandle])

  return (<>
    <div className={cx(flexStyle.container, flexStyle.fcc, style.container)}>
      <div style={{ zIndex: 1 }} id="chart"></div>
      {(isShowLoading) ?
        <div className={cx(style.loadingC, flexStyle.fcc)}>
          <Loading width={30} border={3}></Loading>
        </div> : (<>
          <div className={cx(style.button)}>
            {isShowCandle ?
              <Button onClick={() => setIsShowCandle(!isShowCandle)} style={{ width: '30px', height: '30px', padding: '0' }}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13A.5.5 0 0 1 1 8m7-8a.5.5 0 0 1 .5.5v3.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 1 1 .708-.708L7.5 4.293V.5A.5.5 0 0 1 8 0m-.5 11.707-1.146 1.147a.5.5 0 0 1-.708-.708l2-2a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 11.707V15.5a.5.5 0 0 1-1 0z" />
              </svg></Button> :
              <Button onClick={() => setIsShowCandle(!isShowCandle)} style={{ width: '30px', height: '30px', padding: '0' }}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M1 8a.5.5 0 0 1 .5-.5h13a.5.5 0 0 1 0 1h-13A.5.5 0 0 1 1 8M7.646.146a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 1.707V5.5a.5.5 0 0 1-1 0V1.707L6.354 2.854a.5.5 0 1 1-.708-.708zM8 10a.5.5 0 0 1 .5.5v3.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 0 1 .708-.708L7.5 14.293V10.5A.5.5 0 0 1 8 10" />
              </svg></Button>
            }
          </div>
          <div className={cx(style.legend)}>
            <span style={{ color: snap.isLight ? '#000000' : '#FFFFFF' }}>15m</span>
            <span style={{ color: getMaColor().ma8Color }}>{'MA(8): ' + Number(maPrice.ma8Price).toLocaleString('en-US')}</span>
            <span style={{ color: getMaColor().ma288Color }}>{'MA(288): ' + Number(maPrice.ma288Price).toLocaleString('en-US')}</span>
          </div>
        </>)
      }
    </div>
  </>)
})