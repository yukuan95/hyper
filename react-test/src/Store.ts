import { subscribeKey } from 'valtio/utils'
import { proxy } from 'valtio'
import * as lib from './Lib'

export const useConst = {
  width: 355,
  paddingLeft: 5,
  paddingRight: 5,
}

export const CONST = {
  WsUrl: 'wss://api.hyperliquid.xyz/ws',
  InfoUrl: 'https://api.hyperliquid.xyz/info',
  AccountAddress: "0x5B84b15A72096f7908B44A33d90FC03B59c02bb3",
}

export async function fetchInfo(body: any): Promise<any> {
  return await lib.fetchJson({ url: CONST.InfoUrl, body })
}

export async function fetchUserInfo(body: any): Promise<any> {
  return await lib.fetchJson({ url: CONST.InfoUrl, body: { ...body, user: CONST.AccountAddress } })
}

export const state = proxy({
  isLight: window.matchMedia("(prefers-color-scheme: light)").matches as boolean,
  candle: null as null | any, price: 0 as number, chg24Hour: 0 as number,
  position: null as { entryPrice: string, positionValue: string, unrealizedPnl: string } | null
})

subscribeKey(state, 'isLight', () => {
  document.body.style.backgroundColor = state.isLight ? Color.white : Color.black
})

// @ts-ignore
export enum Color {
  'white' = '#FFFFFFFF',
  'black' = '#292929FF',
  'gray' = '#505050FF',
  'red' = '#F23645FF',
  'green' = '#089981FF',
}

