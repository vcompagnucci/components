import css from './app.module.css'
import type { Piece } from './pieces'

/* Piezas de la página, cada una con una sola responsabilidad. Viven
   acá y no en app.tsx para que app quede sólo con la composición. */

export const slug = (name: string) => name.toLowerCase().replace(/\s+/g, '-')

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
  /* ⚠ EN ESTUDIO: la marca que lee el scrubber del índice. Se va con
     src/proto/. */
  primera?: boolean
}) {
  return (
    <button className={css.streamItem} id={slug(piece.name)} onClick={() => onOpen(piece)}>
      <div className={css.streamTitle} data-primera-pieza={primera ? '' : undefined}>
        {piece.name}
      </div>
      <div className={css.streamPreview} />
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
