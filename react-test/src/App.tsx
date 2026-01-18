import { ConfigProvider, theme } from 'antd'
import { useEffect, useRef, memo } from 'react'
import { state, Color } from './Store'
import * as lib from './Lib'
import * as store from './Store'
import { useSnapshot } from 'valtio'
import locale from 'antd/locale/zh_CN'
// import { cx, css } from '@emotion/css'
import { createChart, LineSeries, CandlestickSeries } from 'lightweight-charts';

const App = memo(() => {
  const chart: { current: any } = useRef(null)
  function calculateMA(data: Array<any>, count: number) {
    const avg = [];
    for (let i = 0; i < data.length; i++) {
      if (i < count - 1) {
        continue;
      }
      let sum = 0;
      for (let j = 0; j < count; j++) {
        sum += data[i - j].close || data[i - j].value;
      }
      avg.push({
        time: data[i].time,
        value: Number.parseInt('' + (sum / count))
      });
    }
    return avg;
  }
  function setData(data: Array<any>) {
    data = data.map((item: any) => {
      return {
        time: item.t / 1000,
        open: Number(item.o), high: Number(item.h),
        low: Number(item.l), close: Number(item.c),
      }
    })
    const ma8Data = calculateMA(data, 8)
    const ma288Data = calculateMA(data, 288)
    const ma8Series = chart.current.addSeries(LineSeries, {
      color: '#FF9800', lineWidth: 1, lastValueVisible: false,
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
    ma8Series.setData(ma8Data);
    ma288Series.setData(ma288Data);

    const candlestickSeries = chart.current.addSeries(CandlestickSeries);
    candlestickSeries.setData(data);
    candlestickSeries.applyOptions({
      priceFormat: {
        type: 'custom', formatter: (price: any) => Number.parseInt(price),
      },
    });
    chart.current.timeScale().applyOptions({
      tickMarkFormatter: (time: any) => {
        return lib.milliTimeToStringTime(time * 1000).slice(5, 10)
      },
    });
    chart.current.applyOptions({
      localization: {
        timeFormatter: (timestamp: any) => {
          return lib.milliTimeToStringTime(timestamp * 1000).slice(0, 16)
        },
      },
    });
  }


  const onClick = async () => {
    let data: Array<any> = await store.fetchInfo({
      "type": "candleSnapshot",
      "req": {
        "coin": "BTC", "interval": "15m", "endTime": lib.getNowMilliTime(),
        "startTime": lib.getNowMilliTime() - lib.timesToMilli({ days: 50 }),
      }
    })
    setData(data)
  }

  useEffect(() => {
    chart.current = createChart(
      document.getElementById('chart') as any, { width: 350, height: 150, } as any
    );
  }, [])
  return (<>
    <div>
      <div><button onClick={() => onClick()}>onClick</button></div>
      <div id="chart" style={{ width: 650, height: 350 }} />
    </div>
  </>)
})


// function initWebsocket() {
//   const socket = new WebSocket('wss://api.hyperliquid.xyz/ws')
//   socket.onopen = () => {
//     socket.send(JSON.stringify({
//       "method": "subscribe",
//       "subscription": { "type": "allMids" }
//     }));
//     socket.send(JSON.stringify({
//       "method": "subscribe",
//       "subscription": {
//         "type": "candle",
//         "coin": "BTC",
//         "interval": "15m"  // 1分钟线
//       }
//     }));
//   };
//   socket.onmessage = (event) => {
//     const data = JSON.parse(event.data).data
//     console.log(data?.mids?.BTC ?? data)
//   };
// }

function initColorScheme() {
  const themeMedia = window.matchMedia("(prefers-color-scheme: light)")
  state.isLight = themeMedia.matches
  themeMedia.onchange = ({ matches }) => state.isLight = matches
}

export default memo(() => {
  const snap = useSnapshot(state)
  useEffect(() => {
    initColorScheme()
    // initWebsocket()
  }, [])
  return (
    <ConfigProvider
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
      <App />
    </ConfigProvider>
  )
})
