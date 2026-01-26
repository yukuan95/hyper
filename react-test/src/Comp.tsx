import { cx, css } from '@emotion/css'
import { memo } from 'react'

export const Loading = memo(({ width, border }: {
  width: number, border: number
}) => {
  const style = css`
    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
    width: ${width}px;
    height: ${width}px;
    border-radius: 50%;
    border-top: ${border}px solid #e2e2e2;
    border-right: ${border}px solid #e2e2e2;
    border-bottom: ${border}px solid #e2e2e2;
    border-left: ${border}px solid #409eff;
    animation: spin 1.5s linear infinite;
  `
  return (<>
    <div className={cx(style)}></div>
  </>)
})