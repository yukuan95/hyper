import { css, cx } from '@emotion/css'
import { useSnapshot } from 'valtio'
import { FlexStyle } from './Css'
import * as store from './Store'
import { numeral } from './Lib'
import { state } from './Store'
import { memo, useEffect, useState } from 'react'
import { Loading } from './Comp'

export const Price = memo(() => {
  const snap = useSnapshot(state)
  const [isLoading, setIsLoading] = useState(true)
  useEffect(() => {
    setIsLoading(!(snap.price !== 0 && snap.chg24Hour !== 0))
  }, [snap.price, snap.chg24Hour])
  const f = FlexStyle()
  const style = () => {
    const titleColor = snap.isLight ? store.Color.blackGray : store.Color.whiteGray
    let bgColor = store.Color.blackGray
    if (snap.chg24Hour > 0) { bgColor = store.Color.green }
    if (snap.chg24Hour < 0) { bgColor = store.Color.red }
    return {
      loadingCon: css`
        position: relative;
      `,
      loadingC: css`
        width: 100%;
        height: calc(100% + 40px);
        left: 0;
        top: -20px;
        position: absolute;
        background: transparent;
        backdrop-filter: blur(3px);
      `,
      container: css`
        display: grid;
        grid-template-columns: 2fr 1fr 1fr;
        align-items: center;
        grid-row-gap: 10px;
        grid-column-gap: 10px;
        padding-left: 15px;
        padding-right: 15px;
      `,
      jsStart: css`
        justify-self: start;
      `,
      jsEnd: css`
        justify-self: end;
      `,
      titleFont: css`
        color: ${titleColor};
        font-size: 11px;
      `,
      font1: css`
        color: ${snap.isLight ? store.Color.black : store.Color.white};
        font-size: 16px;
      `,
      font2: css`
        color: ${snap.isLight ? store.Color.black : store.Color.white};
        font-size: 16px;
      `,
      font3: css`
        color: ${store.Color.white};
        font-size: 14px;
        background-color: ${bgColor};
        border-radius: 4px;
        width: 65px;
        height: 28px;
      `,
    }
  }
  const s = style()
  return <div className={cx(f.container, s.loadingCon)}>
    {isLoading ? <div className={cx(s.loadingC, f.fcc)}>
      <Loading width={30} border={3}></Loading>
    </div> : <></>}
    <div className={cx(s.container)}>
      <div className={cx(s.jsStart, s.titleFont)}>Name</div>
      <div className={cx(s.jsEnd, s.titleFont)}>Last Price</div>
      <div className={cx(s.jsEnd, s.titleFont)}>24h chg%</div>
      <div className={cx(s.jsStart, s.font1)}>BTCUSD</div>
      <div className={cx(s.jsEnd, s.font2)}>{numeral(snap.price).format('0,0.0')}</div>
      <div className={cx(s.jsEnd, s.font3, f.fcc)}>
        <div>{numeral(snap.chg24Hour).format('0.00%')}</div>
      </div>
    </div>
  </div>
})