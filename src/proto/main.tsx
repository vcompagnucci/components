import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../tokens.css'
import { Separators } from './separators'

/* Entry aparte del harness. No lo importa nadie de producción: se llega
   por /proto.html y se borra entero cuando la decisión esté horneada. */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Separators />
  </StrictMode>,
)
