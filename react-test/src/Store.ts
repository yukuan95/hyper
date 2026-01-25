import { proxy } from 'valtio'
import { subscribeKey } from 'valtio/utils'
import * as lib from './Lib'

export const useConst = {
  width: 355,
  paddingLeft: 5,
  paddingRight: 5,
}

export const CONST = {
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
  isLight: window.matchMedia("(prefers-color-scheme: light)").matches as Boolean,
  candle: null as null | any,
  isShowCandle: false,
  price: 0 as number,

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

