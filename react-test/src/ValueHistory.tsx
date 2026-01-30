import * as store from './Store'
import * as lib from './Lib'

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
      return { time: lib.milliTimeToStringTime(item[0]), value: Number(item[1]) }
    }),
    totalPnL: pnlHistory.map((item: any) => {
      return { time: lib.milliTimeToStringTime(item[0]), value: Number(item[1]) }
    })
  }
}