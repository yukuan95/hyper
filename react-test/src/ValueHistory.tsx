import * as store from './Store'
import * as lib from './Lib'
import { memo, useEffect, useMemo, useState } from 'react'
import { FlexStyle } from './Css'
import { Select } from 'antd'
import { useSnapshot } from 'valtio'
import { cx, css } from '@emotion/css'
import Chart from 'chart.js/auto'
import { Tooltip } from 'antd'

// @ts-ignore
enum HistoryType {
  AccountValue = 'Account Value',
  TotalPnL = 'TotalPnL',
}

async function getValueHistory(): Promise<{
  accountValue: Array<{ time: string, value: number }>;
  totalPnL: Array<{ time: string, value: number }>;
}> {
  const res: any = await lib.fetchJson({
    url: store.CONST.InfoUrl, method: 'POST',
    body: { "type": "portfolio", "user": store.CONST.AccountAddress }
  })
  const his = res?.find((item: any) => item?.[0] === 'allTime')?.[1] ?? {}
  const accountValueHistory = his.accountValueHistory ?? []
  const pnlHistory = his.pnlHistory ?? []
  store.state.isShowHistory = true
  return {
    accountValue: accountValueHistory.map((item: any) => {
      return { time: lib.milliTimeToStringTime(item[0]), value: Number(item[1]) }
    }),
    totalPnL: pnlHistory.map((item: any) => {
      return { time: lib.milliTimeToStringTime(item[0]), value: Number(item[1]) }
    })
  }
}

function getChartOption(type: string, data: Array<any>, isLight: boolean): any {
  return {
    type: 'line', data: {
      labels: data.map((item) => item.time.slice(0, 16)),
      datasets: [{
        data: data.map((item) => item.value),
        pointRadius: 0, pointHoverRadius: 0, tension: 0.4,
        borderWidth: 2,
        backgroundColor: data.map((item) => {
          if (type === HistoryType.AccountValue) {
            return '#4FC1FF'
          }
          if (item.value > 0) {
            return store.Color.green
          } else {
            return store.Color.red
          }
        }),
        segment: {
          borderColor: (ctx: any) => {
            if (type === HistoryType.AccountValue) {
              return '#4FC1FF'
            }
            const value = ctx.p1.parsed.y;
            return value > 0 ? store.Color.green : store.Color.red;
          },
        }
      }]
    },
    options: {
      interaction: { mode: 'index', intersect: false },
      animation: false, plugins: { legend: { display: false } },
      scales: {
        x: {
          ticks: {
            color: isLight ? store.Color.blackGray : store.Color.whiteGray,
            maxTicksLimit: 5, callback: function (value: any) {
              const label = this.getLabelForValue(value)
              return label.slice(5, 10)
            }
          } as any,
          grid: { display: false, }
        },
        y: {
          position: 'right',
          ticks: {
            color: isLight ? store.Color.blackGray : store.Color.whiteGray,
          },
        }
      }
    }
  }
}

export const ValueHistory = memo(() => {
  const [data, setData] = useState({
    accountValue: [] as Array<{ key: string, time: string; value: number }>,
    totalPnL: [] as Array<{ key: string, time: string; value: number }>,
  })
  const [type, setType] = useState(HistoryType.TotalPnL)
  const chartEl = useMemo(() => {
    return { totalPnLChartEl: null as null | any, accountValueChartEl: null as null | any }
  }, [])
  const chart = useMemo(() => {
    return { totalPnLChart: null as null | any, accountValueChart: null as null | any }
  }, [])
  useEffect(() => {
    ; (async () => {
      setData(await getValueHistory() as any)
    })();
  }, [])
  const snap = useSnapshot(store.state)
  useEffect(() => {
    chartEl.accountValueChartEl = document.getElementById('accountValueChart')
    if (data.accountValue.length > 0 && chartEl.accountValueChartEl && type === HistoryType.AccountValue) {
      if (chart.accountValueChart && chart.accountValueChart.destroy) {
        chart.accountValueChart.destroy()
      }
      chart.accountValueChart = new Chart(
        chartEl.accountValueChartEl,
        getChartOption(type, data.accountValue, snap.isLight)
      )
    }
    chartEl.totalPnLChartEl = document.getElementById('totalPnLChart')
    if (data.totalPnL.length > 0 && chartEl.totalPnLChartEl && type === HistoryType.TotalPnL) {
      if (chart.totalPnLChart && chart.totalPnLChart.destroy) {
        chart.totalPnLChart.destroy()
      }
      chart.totalPnLChart = new Chart(
        chartEl.totalPnLChartEl,
        getChartOption(type, data.totalPnL, snap.isLight)
      )
    }
  }, [data.accountValue.length, data.totalPnL.length, type, snap.isLight])
  const f = FlexStyle()
  function style() {
    return {
      back: css`
        background-color: ${snap.isLight ? '#F7F8F9' : '#1F262F'};
        user-select: none;
      `,
      container: css`
      `,
      font: css`
        font-size: 17px;
        user-select: none;
        color: ${snap.isLight ? store.Color.black : store.Color.white};
      `
    }
  }
  const s = style()
  const a1 = store.CONST.AccountAddress.slice(0, 6)
  const a2 = store.CONST.AccountAddress.slice(-4, store.CONST.AccountAddress.length)
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  const trigger = isTouchDevice ? 'click' : 'hover'
  return <div className={cx(f.container)}>
    <div style={{ height: '10px' }}></div>
    <div className={cx(f.fsbc, s.container)}>
      <div className={s.font}>
        <Tooltip trigger={trigger} title={store.CONST.AccountAddress}>{a1}...{a2}</Tooltip>
      </div>
      <div style={{ userSelect: 'none' }}>
        <Select
          defaultValue={type} style={{ width: 150 }}
          onChange={(e) => setType(e)} value={type}
          options={[
            { value: HistoryType.AccountValue, label: HistoryType.AccountValue },
            { value: HistoryType.TotalPnL, label: HistoryType.TotalPnL }
          ]}
        />
      </div>
    </div>
    <div style={{ height: '10px' }}></div>
    {type === HistoryType.TotalPnL ? <>
      <div className={s.back}><canvas id="totalPnLChart" height="130"></canvas></div>
    </> : <></>}
    {type === HistoryType.AccountValue ? <>
      <div className={s.back}><canvas id="accountValueChart" height="130"></canvas></div>
    </> : <></>}
  </div>
})