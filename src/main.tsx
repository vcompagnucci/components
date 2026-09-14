import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './fonts.css'
import './tokens.css'
import { App } from './app'

/* ═══ PROTOTYPE: contrast · delete with src/proto/contrast/ ═══
   The question is how dark the secondary level should be in LIGHT
   mode, and it cannot be answered in an isolated route: the grey is
   the masthead's line, the index down the side and the vault's chrome
   at once, so a fake page would answer about a page we are not
   shipping. It runs here, over the real one.

   It folds exactly like the private area: in the build the ternary
   goes to null and Rollup drops the import, so no picker and no
   variant reaches dist/. Verified by grep. */
const Picker = import.meta.env.DEV
  ? lazy(() => import('./proto/contrast/picker').then((m) => ({ default: m.ContrastPicker })))
  : null

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    {Picker && (
      <Suspense fallback={null}>
        <Picker />
      </Suspense>
    )}
  </StrictMode>,
)
/* ═══ END PROTOTYPE: contrast ═══ */
