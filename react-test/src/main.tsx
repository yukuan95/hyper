import { createRoot } from 'react-dom/client'
import 'antd/dist/reset.css'
import 'dayjs/locale/zh-cn'
import App from './App.tsx'
import dayjs from 'dayjs'
import './App.css'
dayjs.locale('zh-cn')

createRoot(document.getElementById('root')!).render(<App />)
