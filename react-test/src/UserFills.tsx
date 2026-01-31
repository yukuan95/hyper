import { memo, useEffect, useMemo, useState, useCallback } from 'react'
import { DatePicker, Button, Tooltip, Table } from 'antd'
import { cx, css } from '@emotion/css'
import { useSnapshot } from 'valtio'
import { v4 as uuidv4 } from 'uuid'
import { FlexStyle } from './Css'
import * as store from './Store'
import * as lib from './Lib'
import dayjs from 'dayjs'

const { Column } = Table

const ArrowButtonStyle = () => {
  return {
    arrowButton: css`
      width: 40px;
      height: 32px;
      padding: 0;
    `
  }
}
// @ts-ignore
export enum ArrowSvgName {
  rightArrow = 'rightArrow',
  leftArrow = 'leftArrow',
}

const ArrowSvg = (props: { name: string }) => {
  const name = props.name
  if (name === ArrowSvgName.rightArrow) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
        viewBox="0 0 16 16">
        <path
          d="M6 12.796V3.204L11.481 8 6 12.796zm.659.753 5.48-4.796a1 1 0 0 0 0-1.506L6.66 2.451C6.011 1.885 5 2.345 5 3.204v9.592a1 1 0 0 0 1.659.753z" />
      </svg>
    )
  }
  if (name === ArrowSvgName.leftArrow) {
    return (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor"
        viewBox="0 0 16 16">
        <path
          d="M10 12.796V3.204L4.519 8 10 12.796zm-.659.753-5.48-4.796a1 1 0 0 1 0-1.506l5.48-4.796A1 1 0 0 1 11 3.204v9.592a1 1 0 0 1-1.659.753z" />
      </svg>
    )
  }
  return <></>
}

const LeftArrowButton = () => {
  const arrowButtonStyle = ArrowButtonStyle()
  const flexStyle = FlexStyle()
  return (
    <Button className={arrowButtonStyle.arrowButton}>
      <div className={flexStyle.fcc}>
        <ArrowSvg name={ArrowSvgName.leftArrow} />
      </div>
    </Button>
  )
}

const RightArrowButton = () => {
  const arrowButtonStyle = ArrowButtonStyle()
  const flexStyle = FlexStyle()
  return (
    <Button className={arrowButtonStyle.arrowButton}>
      <div className={flexStyle.fcc}>
        <ArrowSvg name={ArrowSvgName.rightArrow} />
      </div>
    </Button>
  )
}

export const UserFills = memo(() => {
  const snap = useSnapshot(store.state)
  const f = FlexStyle()
  const [isShowTable1, setIsShowTable1] = useState(false)
  const [isShowTable2, setIsShowTable2] = useState(false)
  const getUserFillsData = useMemo(() => ({ res: null as any }), [])
  const getYearMonth = (data?: Date) => {
    return lib.milliTimeToStringTime(data?.getTime() ?? new Date().getTime()).slice(0, 7)
  }
  const [yearMonth, setYearMonth] = useState(getYearMonth(new Date()))
  useEffect(() => {
    ; (async () => {
      getUserFillsData.res = await getUserFills()
      setIsShowTable2(true)
      store.state.isShowFills = true
    })();
  }, [])
  const dataSource2 = useMemo(() => {
    if (isShowTable2) {
      return getUserFillsData.res.filter((item: any) => {
        return item.time.slice(0, 7) === yearMonth
      })
    }
  }, [isShowTable2, yearMonth])
  const dataSource1 = useMemo(() => {
    if (snap?.position?.entryPrice, snap?.position?.positionValue, snap?.position?.unrealizedPnl) {
      setIsShowTable1(true)
      store.state.isShowPosition = true
    }
    return [{
      key: uuidv4(),
      entryPrice: snap?.position?.entryPrice,
      positionValue: snap?.position?.positionValue,
      unrealizedPnl: snap?.position?.unrealizedPnl,
    }]
  }, [snap?.position?.entryPrice, snap?.position?.positionValue, snap?.position?.unrealizedPnl])
  const style = useMemo(() => ({ width: '220px' }), [])

  const datePickerValue: any = useMemo(() => yearMonth ? dayjs(yearMonth) : '', [yearMonth])
  const onChange = useCallback((e: any) => {
    const date = e?.$d ?? null
    setYearMonth(date ? getYearMonth(date) : '')
  }, [])
  const onClickLeft = () => {
    setYearMonth(lib.monthPlus(yearMonth || getYearMonth(), -1))
  }
  const onClickRight = () => {
    setYearMonth(lib.monthPlus(yearMonth || getYearMonth(), 1))
  }
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  const trigger = isTouchDevice ? 'click' : 'hover'
  return <div className={cx(f.container)}>
    {isShowTable1 ?
      <>
        <div style={{ height: '10px' }}></div>
        <Table size="small" pagination={false} bordered dataSource={dataSource1} >
          <Column className={cx(f.columnHeight)} align="center" title="entry price" dataIndex="entryPrice"></Column>
          <Column className={cx(f.columnHeight)} align="center" title="position value" dataIndex="positionValue"></Column>
          <Column className={cx(f.columnHeight)} align="center" title="unrealized pnl" dataIndex="unrealizedPnl"></Column>
        </Table>
      </> : <></>
    }
    {isShowTable1 ? <>
      <div style={{ height: '20px' }}></div>
      <div className={f.fsbc}>
        <div>
          <DatePicker
            inputReadOnly={true}
            style={style}
            value={datePickerValue}
            onChange={onChange}
            picker="month"
          />
        </div>
        <div className={f.fsbc} style={{ gap: '10px' }}>
          <div onClick={onClickLeft}>
            <LeftArrowButton />
          </div>
          <div onClick={onClickRight}>
            <RightArrowButton />
          </div>
        </div>
      </div>
      <div style={{ height: '20px' }}></div>
      <Table size="small" pagination={false} bordered dataSource={dataSource2} >
        <Column className={cx(f.columnHeight)} align="center" title={'time(' + getUserFillsData.res.at(-1).time.slice(-3) + ')'} dataIndex="time" render={(_, item) => (<>
          {item.time.slice(0, 16)}
        </>)}></Column>
        <Column className={cx(f.columnHeight)} align="center" title="price" dataIndex="price" render={(_, item) => (<>
          <Tooltip mouseEnterDelay={0} trigger={trigger} title={<>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto auto auto', justifyItems: 'center' }}>
              <div>fee</div>
              <div style={{ whiteSpace: 'pre' }}> : </div>
              <div>{item.fee}</div>
              <div>pnl</div>
              <div style={{ whiteSpace: 'pre' }}> : </div>
              <div>{item.closedPnl}</div>
            </div>
          </>} placement='left'>
            {lib.numeral(item.price).format('0,0')}
          </Tooltip>
        </>)}></Column>
        <Column className={cx(f.columnHeight)} align="center" title="side" dataIndex="side"></Column>
        <Column className={cx(f.columnHeight)} align="center" title="size" dataIndex="size"></Column>
      </Table>
    </> : <></>}
  </div>
})

async function getUserFills(): Promise<{
  key: string, time: string, side: string, price: number,
  size: number, fee: number, closedPnl: number,
}> {
  let data: any = await store.fetchInfo({
    "type": "userFills", "user": store.CONST.AccountAddress
  }) ?? []
  data = data.filter((item: any) => item.coin === 'BTC').map((item: any) => {
    let side = item.side
    if (item.side === 'A') {
      side = 'SHORT'
    }
    if (item.side === 'B') {
      side = 'LONG'
    }
    return {
      time: lib.milliTimeToStringTime(item.time),
      side: side, price: Number(item.px),
      closedPnl: Number(item.closedPnl),
      fee: Number(item.fee), size: Number(item.sz),
    }
  })
  data = data.reverse()
  const m = new Map<string, Array<any>>()
  for (const item of data) {
    const key = item.time + item.side
    if (m.has(key)) {
      m.get(key)?.push(item)
    } else {
      m.set(key, [item])
    }
  }
  data = []
  for (const value of m.values()) {
    const time = value[0].time
    const side = value[0].side
    const priceTotal = value.map((item) => item.price).reduce((a, b) => a + b, 0)
    const price = Number.parseInt('' + priceTotal / value.length)
    const size = value.map((item) => item.size).reduce((a, b) => lib.add(a, b), 0)
    const fee = value.map((item) => item.fee).reduce((a, b) => lib.add(a, b), 0)
    const closedPnl = value.map((item) => item.closedPnl).reduce((a, b) => lib.add(a, b), 0)
    data.push({
      key: uuidv4(),
      time, side, price, size, fee, closedPnl,
    })
  }
  for (let i = 0; i < data.length; i++) {
    if (data[i].closedPnl === 0) {
      if (data[i - 1]) {
        data[i - 1].side = 'Hedge'
      }
    }
  }
  return data
}