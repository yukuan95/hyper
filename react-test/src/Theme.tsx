import { useSnapshot } from 'valtio'
import { FlexStyle } from './Css'
import { state } from './Store'
import { Switch } from 'antd'
import { memo } from 'react'

export const ThemeButton = memo(() => {
  const snap = useSnapshot(state)
  const f = FlexStyle()
  return <>
    <div className={f.container} style={{ display: 'flex', justifyContent: 'end' }}>
      <Switch
        checked={!snap.isLight}
        onChange={() => {
          state.isLight = !state.isLight
        }} checkedChildren="Dark" unCheckedChildren="Light" />
    </div>
  </>
})