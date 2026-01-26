import { useConst } from './Store'
import { css } from '@emotion/css'

export const FlexStyle = () => {
  return {
    fsbc: css`
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    `,
    fcc: css`
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
    `,
    container: css`
      width: ${useConst.width}px;
      padding-left: ${useConst.paddingLeft}px;
      padding-right: ${useConst.paddingRight}px;
    `,
  }
}