import {
  createChart, LineSeries, CandlestickSeries, CrosshairMode
} from 'lightweight-charts'
import { useState, useEffect, memo, useMemo } from 'react'
import { subscribeKey } from 'valtio/utils'
import { state, useConst } from './Store'
import { cx, css } from '@emotion/css'
import { useSnapshot } from 'valtio'
import { FlexStyle } from './Css'
import { Loading } from './Comp'
import * as store from './Store'
import { Button } from 'antd'
import * as lib from './Lib'

type Data = { chart: any; candleData: any; ma8Series: any; ma288Series: any; candlestickSeries: any; }

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

function setData(data: Data, setMaPrice: any) {
  const { ma8Color, ma288Color } = getMaColor()
  const ma8Data = calculateMA(data.candleData, 8)
  const ma288Data = calculateMA(data.candleData, 288)
  const ma8Price = ma8Data.at(-1)?.value ?? 0
  const ma288Price = ma288Data.at(-1)?.value ?? 0
  setMaPrice({ ma8Price, ma288Price })
  data.ma8Series = data.chart.addSeries(LineSeries, {
    color: ma8Color, lineWidth: 1, lastValueVisible: false,
    priceLineVisible: false, crosshairMarkerVisible: false,
  })
  data.ma288Series = data.chart.addSeries(LineSeries, {
    color: ma288Color, lineWidth: 1, lastValueVisible: false,
    priceLineVisible: false, crosshairMarkerVisible: false,
  })
  data.ma8Series.setData(ma8Data)
  data.ma288Series.setData(ma288Data)
  data.candlestickSeries = data.chart.addSeries(CandlestickSeries);
  data.candlestickSeries.setData(data.candleData)
  data.chart.timeScale().applyOptions({
    tickMarkFormatter: (time: any) => {
      return lib.milliTimeToStringTime(time * 1000).slice(5, 10)
    },
  })
  data.chart.applyOptions({
    localization: {
      timeFormatter: (timestamp: any) => {
        return lib.milliTimeToStringTime(timestamp * 1000).slice(0, 16)
      },
    },
  })
  data.chart.applyOptions({
    localization: {
      priceFormatter: (price: any) => {
        return new Intl.NumberFormat('en-US', {
          minimumFractionDigits: 0, maximumFractionDigits: 0,
        }).format(price)
      },
    },
  })
}

async function init(data: Data, setIsShowLoading: any, setMaPrice: any) {
  try {
    const dataRes: Array<any> = await store.fetchInfo({
      "type": "candleSnapshot",
      "req": {
        "coin": "BTC", "interval": "15m", "endTime": lib.getNowMilliTime(),
        "startTime": lib.getNowMilliTime() - lib.timesToMilli({ days: 50 }),
      }
    })
    setIsShowLoading(false)
    data.candleData = mapCandle(dataRes)
    setData(data, setMaPrice)
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

function createChartF(data: Data, chartEl: any, isShowCandle: boolean, isLight: boolean): void {
  data.chart = createChart(chartEl, {
    width: getWidth(), height: getHeight(isShowCandle)
  } as any)
  const { lightTheme, darkTheme } = getChartTheme()
  data.chart.applyOptions(isLight ? lightTheme : darkTheme)
  data.chart.applyOptions({ crosshair: { mode: CrosshairMode.Normal } })
}

function subscribe(data: Data, setMaPrice: any) {
  const unSubscribeCandle = subscribeKey(state, 'candle', () => {
    if (!data.candleData) {
      return
    }
    const candle = mapCandle([state.candle])[0]
    if (candle.time > (data.candleData.at(-1).time)) {
      data.candleData.push(candle)
    } else {
      data.candleData[data.candleData.length - 1] = candle
    }
    const ma8Data = calculateMA(data.candleData, 8).at(-1)
    const ma288Data = calculateMA(data.candleData, 288).at(-1)
    data.ma8Series.update(ma8Data)
    data.ma288Series.update(ma288Data)
    setMaPrice({
      ma8Price: ma8Data?.value ?? 0,
      ma288Price: ma288Data?.value ?? 0,
    })
    data.candlestickSeries.update(data.candleData.at(-1))
  })
  const unSubscribeIsLight = subscribeKey(state, 'isLight', () => {
    const { lightTheme, darkTheme } = getChartTheme()
    data.chart.applyOptions(state.isLight ? lightTheme : darkTheme)
  })
  const unSubscribe = () => {
    unSubscribeCandle()
    unSubscribeIsLight()
  }
  return unSubscribe
}

export const Candle = memo(() => {
  const [maPrice, setMaPrice] = useState({ ma8Price: 0, ma288Price: 0, })
  const [isShowLoading, setIsShowLoading] = useState(true)
  const [isShowCandle, setIsShowCandle] = useState(false)
  const data: Data = useMemo(() => ({
    chart: null as any, candleData: null as any, ma8Series: null as any,
    ma288Series: null as any, candlestickSeries: null as any,
  }), []);
  const snap = useSnapshot(state)
  const flexStyle = FlexStyle()
  const style = getCandleStyle(
    getHeight(isShowCandle), getBackgroundColor(snap.isLight)
  )
  useEffect(() => {
    const chartEl = document.getElementById('chart')
    createChartF(data, chartEl, isShowCandle, snap.isLight)
    init(data, setIsShowLoading, setMaPrice)
    const unSubscribe = subscribe(data, setMaPrice)
    return () => unSubscribe()
  }, [])
  useEffect(() => {
    data.chart.applyOptions({ width: getWidth(), height: getHeight(isShowCandle) })
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