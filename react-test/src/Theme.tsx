import { cx, css } from '@emotion/css'
import { useEffect, memo } from 'react'
import { state } from './Store'

export const ThemeButton = memo(() => {
  const button = css`
    position: fixed;
    top: 0;
    left: 0;
  `
  return <>
    <button className={button} onClick={() => state.isLight = !state.isLight}>button</button>
  </>
})