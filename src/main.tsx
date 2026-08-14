import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './tokens.css'
import { App } from './app'
import { Viewports } from './proto/viewports'

/* ⚠ TALLER — adentro del iframe se dibuja la página; afuera, el marco
   que la contiene a distintos anchos. Sin esta rama el harness se
   anidaría infinitamente. Se saca junto con src/proto/ cuando la
   decisión de espaciado responsive esté cerrada. */
const inFrame = window.self !== window.top

createRoot(document.getElementById('root')!).render(
  <StrictMode>{inFrame ? <App /> : <Viewports />}</StrictMode>,
)
