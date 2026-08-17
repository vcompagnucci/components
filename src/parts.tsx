import css from './app.module.css'
import type { Piece } from './pieces'

/* Piezas de la página, cada una con una sola responsabilidad. Viven
   acá y no en app.tsx para que app quede sólo con la composición. */

export const slug = (name: string) => name.toLowerCase().replace(/\s+/g, '-')

/* La BASE de un renglón: la línea sobre la que se apoyan las letras.
   Es por donde se alinean dos textos, y no por el medio de sus cajas:
   los renglones del índice son 13/16 y los de la página 14/20, así que
   centrarlos deja las letras apoyadas en dos alturas distintas.

   No hay API que la dé, así que se mide con una sonda: un inline-block
   de alto cero con vertical-align:baseline se apoya exactamente ahí, y
   como no tiene alto, su borde superior ES la base. Entra y sale en el
   mismo tick, así que React nunca la ve. */
export function baseDeTexto(el: HTMLElement) {
  const sonda = document.createElement('span')
  sonda.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline'
  el.appendChild(sonda)
  const y = sonda.getBoundingClientRect().top
  sonda.remove()
  return y
}

export function Masthead() {
  return (
    <header className={css.mast}>
      <h1 className={css.mastTitle}>Library</h1>
      <div className={css.mastSub}>Components for web and native apps that feel right.</div>
    </header>
  )
}

/* La pieza entera es el botón: el título también es clickeable y entra
   por teclado, no sólo el rectángulo. El id lo usa el índice para
   saltar hasta acá. */
export function Item({
  piece,
  onOpen,
  primera,
}: {
  piece: Piece
  onOpen: (p: Piece) => void
  /* La primera pieza lleva la marca contra la que se alinea el índice:
     "Web" se apoya en la misma línea que este título. */
  primera?: boolean
}) {
  return (
    <button className={css.streamItem} id={slug(piece.name)} onClick={() => onOpen(piece)}>
      <div className={css.streamTitle} data-primera-pieza={primera ? '' : undefined}>
        {piece.name}
      </div>
      {/* ⚠ EN ESTUDIO: data-card lo lee el laboratorio para informar el
          alto que la proporción está dando de verdad. Se va con proto/. */}
      <div className={css.streamPreview} data-card={primera ? '' : undefined} />
    </button>
  )
}

export function Detail({ piece, onBack }: { piece: Piece; onBack: () => void }) {
  return (
    <div className={css.content}>
      <div className={css.detail}>
        <button className={css.back} aria-label="Back" onClick={onBack}>
          ←
        </button>
        <div className={css.detailHead}>
          <h1 className={css.detailTitle}>{piece.name}</h1>
          <div className={css.detailMeta}>{piece.platform}</div>
          <p className={css.detailDesc}>{piece.desc}</p>
        </div>
        <div className={css.detailPreview} />
      </div>
    </div>
  )
}
