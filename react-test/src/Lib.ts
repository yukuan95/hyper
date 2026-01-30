import { Decimal } from "decimal.js"
import _numeral from 'numeral'

export const numeral = (_numeral as any).default || _numeral

export async function fetchJson(data: { url: string, headers?: any, method?: any, body?: any }): Promise<any> {
  let { url, headers, method, body } = data
  headers = headers ?? { 'Content-Type': 'application/json' }
  method = method ?? 'POST'
  body = body ?? {}
  let res = await fetch(url, { method, headers, body: JSON.stringify(body) })
  return await res.json()
}

export function add(n1: number, n2: number): number {
  return Number(Decimal(n1).add(Decimal(n2)))
}

export function timesToMilli(times: { days?: number, hours?: number, minutes?: number, seconds?: number }): number {
  const days = (times.days ?? 0) * 24 * 60 * 60 * 1000
  const hours = (times.hours ?? 0) * 60 * 60 * 1000
  const minutes = (times.minutes ?? 0) * 60 * 1000
  const seconds = (times.seconds ?? 0) * 1000
  return days + hours + minutes + seconds
}

export function timesToMinute(times: { days?: number, hours?: number, minutes?: number, seconds?: number }): number {
  return Math.floor(timesToMilli(times) / 1000 / 60)
}

export function timesToSecond(times: { days?: number, hours?: number, minutes?: number, seconds?: number }): number {
  return Math.floor(timesToMilli(times) / 1000)
}

export function getNowMilliTime(): number {
  return new Date().getTime()
}

export function getNowStringTime(timezone?: number): string {
  timezone = timezone ?? getTimezone()
  return milliTimeToStringTime(new Date().getTime(), timezone)
}

export function stringTimeToMilliTime(stringTime: string): number {
  console.assert(stringTime.length === 27)
  const temp = stringTime.slice(0, 23) + stringTime.slice(24, 27)
  return new Date(temp).getTime()
}

export function timezoneToString(timezone: number): string {
  const temp = timezone >= 0 ? '+' + timezone : '-' + timezone
  return temp.length === 2 ? temp[0] + '0' + temp[1] : temp
}

export function milliTimeToStringTime(milliTime: number, timezone?: number): string {
  timezone = timezone ?? getTimezone()
  console.assert(!isNaN(Number(timezone)))
  console.assert(timezone <= 12 && timezone >= -12)
  timezone = Number.parseInt(String(timezone))
  const temp = new Date(milliTime + timesToMilli({ hours: timezone })).toISOString()
  const stringTime = `${temp.slice(0, 10)} ${temp.slice(11, 23)} ${timezoneToString(timezone)}`
  console.assert(stringTime.length === 27)
  return stringTime
}

export function stringTimePlus(stringTime: string, times: { days?: number, hours?: number, minutes?: number, seconds?: number }): string {
  return milliTimeToStringTime(stringTimeToMilliTime(stringTime) + timesToMilli(times))
}

export function getTimezone() {
  return new Date().getTimezoneOffset() / (-60)
}