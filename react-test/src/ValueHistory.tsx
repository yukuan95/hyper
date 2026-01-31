import * as store from './Store'
import * as lib from './Lib'
import { memo, useEffect, useMemo, useState } from 'react'
import { FlexStyle } from './Css'
import { Select } from 'antd'
import { useSnapshot } from 'valtio'
import { cx, css } from '@emotion/css'
import { v4 as uuidv4 } from 'uuid'
import Chart from 'chart.js/auto'

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
  return {
    accountValue: accountValueHistory.map((item: any) => {
      return { key: uuidv4(), time: lib.milliTimeToStringTime(item[0]), value: Number(item[1]) }
    }),
    totalPnL: pnlHistory.map((item: any) => {
      return { key: uuidv4(), time: lib.milliTimeToStringTime(item[0]), value: Number(item[1]) }
    })
  }
}

export const ValueHistory = memo(() => {
  const [data, setData] = useState({
    accountValue: [] as Array<{ key: string, time: string; value: number }>,
    totalPnL: [] as Array<{ key: string, time: string; value: number }>,
  })
  const [type, setType] = useState('Total PnL')
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
  useEffect(() => {
    chartEl.accountValueChartEl = document.getElementById('accountValueChart')
    if (data.accountValue.length > 0 && chartEl.accountValueChartEl && type === 'Account Value') {
      chart.accountValueChart = new Chart(chartEl.accountValueChartEl, {
        type: 'line', data: {
          labels: data.accountValue.map((item) => item.time.slice(0, 16)),
          datasets: [{
            data: data.accountValue.map((item) => item.value),
            pointRadius: 0,      // 普通状态下点的半径为 0
            pointHoverRadius: 0  // 鼠标悬停时点也不显示（可选）
          }]
        }, options: {
          interaction: {
            mode: 'index',     // 只要鼠标进入 X 轴对应的纵向区域，就会触发
            intersect: false   // 设置为 false，表示鼠标不需要直接碰到线/点也能触发
          },
          animation: false, plugins: { legend: { display: false } },
          scales: {
            x: {
              ticks: {
                maxTicksLimit: 10,
                callback: function (value: any) {
                  const label = this.getLabelForValue(value)
                  return label.slice(8, 10)
                }
              } as any,
              grid: {
                display: false // 这将隐藏 X 轴所有的竖线
              }
            },
            y: {
              position: 'right', // 关键配置：将 Y 轴放在右侧
            }
          }
        }
      } as any)
    }
    chartEl.totalPnLChartEl = document.getElementById('totalPnLChart')
    if (data.totalPnL.length > 0 && chartEl.totalPnLChartEl && type === 'Total PnL') {
      chart.totalPnLChart = new Chart(chartEl.totalPnLChartEl, {
        type: 'line', data: {
          labels: data.totalPnL.map((item) => item.time.slice(0, 16)),
          datasets: [{
            data: data.totalPnL.map((item) => item.value),
            pointRadius: 0,      // 普通状态下点的半径为 0
            pointHoverRadius: 0  // 鼠标悬停时点也不显示（可选）
          }]
        }, options: {
          interaction: {
            mode: 'index',     // 只要鼠标进入 X 轴对应的纵向区域，就会触发
            intersect: false   // 设置为 false，表示鼠标不需要直接碰到线/点也能触发
          },
          animation: false, plugins: { legend: { display: false } },
          scales: {
            x: {
              ticks: {
                maxTicksLimit: 10,
                callback: function (value: any) {
                  const label = this.getLabelForValue(value)
                  return label.slice(8, 10)
                }
              } as any,
              grid: {
                display: false // 这将隐藏 X 轴所有的竖线
              }
            },
            y: {
              position: 'right', // 关键配置：将 Y 轴放在右侧
            }
          }
        }
      } as any)
    }
  }, [data.accountValue.length, data.totalPnL.length, type])
  const snap = useSnapshot(store.state)
  const f = FlexStyle()
  function style() {
    return {
      container: css`
        padding-left: 5px;
        padding-right: 5px;
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
  const a2 = store.CONST.AccountAddress.slice(-5, -1)
  return <div className={cx(f.container)}>
    <div style={{ height: '15px' }}></div>
    <div className={cx(f.fsbc, s.container)}>
      <div className={s.font}>{a1}...{a2}</div>
      <div style={{ userSelect: 'none' }}>
        <Select
          defaultValue={type} style={{ width: 150 }}
          onChange={(e) => setType(e)} value={type}
          options={[
            { value: 'Account Value', label: 'Account Value' },
            { value: 'Total PnL', label: 'Total PnL' }
          ]}
        />
      </div>
    </div>
    <div style={{ height: '15px' }}></div>
    {type === 'Total PnL' ? <>
      <div><canvas id="totalPnLChart"></canvas></div>
    </> : <></>}
    {type === 'Account Value' ? <>
      <div><canvas id="accountValueChart"></canvas></div>
    </> : <></>}
  </div>
})