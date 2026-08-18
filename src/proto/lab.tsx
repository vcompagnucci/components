import { useEffect, useState, type CSSProperties } from 'react'
import css from './lab.module.css'

/* ─────────────────────────────────────────────────────────────
   LAB · EL NIVEL SECUNDARIO DE TEXTO

   Ya no se elige un color: se elige UN NÚMERO. La estructura está
   decidida y horneada —la de benji, verificada en su CSS servido:
   declara un solo token de color de texto (--body-color:#111) y
   ningún token de gris. Todo lo gris es su negro o su ink a un
   alfa, y el alfa manda (.4 aparece en 40 declaraciones; el
   siguiente, .5, en 8).

   De ahí salen sus dos valores, que NO son dos grises:
     anotación  rgba(0,0,0,.4)     → 152
     nav        hsla(0,0%,7%,.4)   → 159
   El mismo 40% desde dos bases. Los 7 del medio son la fuga de
   escribir la regla en dos archivos, no un escalón.

   Acá queda una sola variable, el ALFA, y las dos se derivan:
     anotación  negro puro @ α
     nav        --ink      @ α

   POR QUÉ ESTA HOJA TIENE TRES FORMAS DE MIRAR LO MISMO:
   un salto de 6 unidades en texto de 13px es invisible, y ése era
   el problema para decidir. Separados por aire dos grises a 6
   leen igual; pegados, o hay costura o no la hay. Entonces:
     1 · la rampa de corrido — el ancho del barrido de una mirada
     2 · el contacto — si el escalón existe, se ve como costura
     3 · el texto real — cómo se lee de verdad, que es lo que importa

   Todos los números están MEDIDOS por píxel sobre #fdfdfc, no
   calculados. Y el barrido valida el modelo solo: en α=.4 las dos
   bases dan 152 y 159, que son exactamente los dos valores que se
   midieron en su página.
   ───────────────────────────────────────────────────────────── */

type Alfa = {
  a: string
  /* compuestos sobre #fdfdfc, medidos por píxel */
  anot: number
  nav: number
  /* APCA. Su piso para texto que no es cuerpo es 60 */
  lc: string
  marca?: string
}

const ALFAS: Alfa[] = [
  { a: '30%', anot: 176, nav: 181, lc: '41 / 39' },
  { a: '32.5%', anot: 170, nav: 176, lc: '45 / 41' },
  { a: '35.5%', anot: 163, nav: 169, lc: '48 / 45', marca: 'el del slider' },
  { a: '37%', anot: 160, nav: 166, lc: '50 / 47', marca: 'lo horneado' },
  { a: '40%', anot: 152, nav: 159, lc: '54 / 50', marca: 'benji clavado' },
  { a: '45%', anot: 139, nav: 147, lc: '60 / 56', marca: 'cruza APCA' },
]

/* Las estructuras que quedaron atrás. Se dejan a la vista porque el
   contraste con el barrido ES el argumento: todas usan DOS números
   sueltos que hay que mantener sincronizados a mano, y así fue como
   los dos anteriores se separaron 4 unidades sin que nadie lo
   notara. Ninguna se deriva de nada. */
type Suelto = { nombre: string; nav: number; anot: number; nota: string }

const SUELTOS: Suelto[] = [
  { nombre: 'Hoy', nav: 159, anot: 163, nota: 'nav copiada\nanot elegida' },
  { nombre: 'Uno', nav: 159, anot: 159, nota: 'un valor\npara los dos' },
  { nombre: 'Escalón', nav: 159, anot: 145, nota: 'anot más\noscura' },
  { nombre: 'Escalón +', nav: 159, anot: 138, nota: 'cruza APCA\ncon 2 números' },
  { nombre: 'Invertido', nav: 145, anot: 159, nota: 'el orden\nal revés' },
]

const gris = (n: number) => `rgb(${n}, ${n}, ${n})`
const mix = (base: string, a: string) => `color-mix(in srgb, ${base} ${a}, transparent)`

/* Lo que sale de la REGLA se pinta con la regla y no con su resultado:
   si el alfa se escribiera mal, tiene que verse acá. Lo suelto se
   pinta con su valor, que es justamente lo que lo hace suelto. */
const valores = (o: Alfa | Suelto) =>
  'a' in o
    ? { nav: mix('var(--ink)', o.a), anot: mix('#000', o.a) }
    : { nav: gris(o.nav), anot: gris(o.anot) }

const vars = (o: Alfa | Suelto) => {
  const v = valores(o)
  return { '--type-nav-c': v.nav, '--text-secondary': v.anot } as CSSProperties
}

/* El par real, a los tamaños reales: la columna del índice a 13/16
   contra el masthead a 14/20. Es exactamente la distancia a la que los
   dos derivados se encuentran en la página. */
function Textos() {
  return (
    <>
      <div className={css.nav}>
        <div className={css.navRotulo}>Web</div>
        <div>Button</div>
        <div className={css.navActivo}>Input</div>
        <div>Select</div>
      </div>
      <div className={css.mast}>
        <div className={css.mastTitulo}>Library</div>
        <div className={css.mastSub}>
          Components for web and native apps that feel right.
        </div>
      </div>
    </>
  )
}

/* Los dos derivados pegados, sin nada en el medio. */
function Contacto({ o }: { o: Alfa | Suelto }) {
  const v = valores(o)
  return (
    <div className={css.contacto}>
      <div className={css.contactoMitad} style={{ background: v.nav }} />
      <div className={css.contactoMitad} style={{ background: v.anot }} />
    </div>
  )
}

function Fila({
  o,
  activa,
  onPick,
  etiqueta,
  cifras,
}: {
  o: Alfa | Suelto
  activa: boolean
  onPick: () => void
  etiqueta: string
  cifras: string
}) {
  const marca = 'a' in o ? o.marca : o.nota
  return (
    <button
      className={css.fila}
      style={vars(o)}
      data-on={activa ? '' : undefined}
      onClick={onPick}
    >
      <div>
        <div className={css.alfa}>{etiqueta}</div>
        {marca && <div className={css.marca}>{marca}</div>}
      </div>
      <Contacto o={o} />
      <Textos />
      <div className={css.cifras}>{cifras}</div>
    </button>
  )
}

export function Lab() {
  const [i, setI] = useState(ALFAS.findIndex((x) => x.marca === 'lo horneado'))
  const [suelto, setSuelto] = useState<number | null>(null)
  const [hoja, setHoja] = useState(false)
  const actual: Alfa | Suelto = suelto === null ? ALFAS[i] : SUELTOS[suelto]

  /* En documentElement y no en un contenedor: los dos tokens se
     declaran en :root y se leen desde ahí. Escribirlos en un
     descendiente de quien los lee no los alcanza. (En la hoja sí van
     inline, porque ahí la fila SÍ es ancestro de quien los lee.) */
  useEffect(() => {
    const d = document.documentElement
    const v = valores(actual)
    d.style.setProperty('--text-secondary', v.anot)
    d.style.setProperty('--type-nav-c', v.nav)
    return () => {
      d.style.removeProperty('--text-secondary')
      d.style.removeProperty('--type-nav-c')
    }
  }, [actual])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'h' || e.key === 'H') setHoja((v) => !v)
      const n = Number(e.key)
      if (n >= 1 && n <= ALFAS.length) {
        setI(n - 1)
        setSuelto(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const elegirAlfa = (k: number) => {
    setI(k)
    setSuelto(null)
  }

  return (
    <>
      {hoja && (
        <div className={css.hoja}>
          <div className={css.pliego}>
            <div className={css.titulo}>El nivel secundario · un alfa, dos bases</div>
            <div className={css.bajada}>
              La anotación sale de negro puro al alfa; la nav, de <code>--ink</code>{' '}
              al mismo alfa. Un solo número mueve las dos. Cliqueá cualquier fila
              para aplicarla a la página.
            </div>

            {/* 1 · LA RAMPA — el ancho del barrido de una sola mirada */}
            <div className={css.seccion}>
              <div className={css.titulo}>1 · La rampa, de corrido</div>
              <div className={css.bajada}>
                Los seis valores de la anotación tocándose. Separados por aire,
                dos grises a 6 unidades leen igual; pegados se ve dónde hay
                escalón y dónde no.
              </div>
              <div className={css.rampa}>
                {ALFAS.map((o) => (
                  <div
                    className={css.rampaCelda}
                    key={o.a}
                    style={{ background: mix('#000', o.a) }}
                  />
                ))}
              </div>
              <div className={css.rampaPie}>
                {ALFAS.map((o) => (
                  <div className={css.rampaRotulo} key={o.a}>
                    {`${o.a}\n${o.anot}${o.marca ? `\n${o.marca}` : ''}`}
                  </div>
                ))}
              </div>
            </div>

            {/* 2 y 3 · CONTACTO Y TEXTO REAL, fila por alfa */}
            <div className={css.seccion}>
              <div className={css.titulo}>2 · El barrido del alfa</div>
              <div className={css.bajada}>
                Cada fila: los dos derivados en contacto —si el alfa produce un
                escalón, acá se ve la costura— y después los mismos dos colores
                en el texto real, a 13/16 y 14/20. El activo del índice
                (&ldquo;Input&rdquo;, en 65) no lo mueve ninguna fila: es la
                constante.
              </div>
              <div className={css.encabezado}>
                <div>alfa</div>
                <div>nav | anot</div>
                <div>índice 13/16</div>
                <div>masthead 14/20</div>
                <div>anot · nav · Lc</div>
              </div>
              {ALFAS.map((o, k) => (
                <Fila
                  key={o.a}
                  o={o}
                  activa={suelto === null && k === i}
                  onPick={() => elegirAlfa(k)}
                  etiqueta={o.a}
                  cifras={`${o.anot} · ${o.nav}\ngap ${o.nav - o.anot}\nLc ${o.lc}`}
                />
              ))}
            </div>

            {/* Las descartadas, para contrastar contra el barrido */}
            <div className={css.seccion}>
              <div className={css.titulo}>3 · Las estructuras que quedaron atrás</div>
              <div className={css.bajada}>
                Ninguna se deriva de nada: todas son DOS números sueltos que hay
                que mantener sincronizados a mano. Así fue como los dos
                anteriores terminaron a 4 unidades sin que nadie lo notara, y con
                la anotación más clara que la nav — al revés que en su página.
              </div>
              <div className={css.encabezado}>
                <div>estructura</div>
                <div>nav | anot</div>
                <div>índice 13/16</div>
                <div>masthead 14/20</div>
                <div>anot · nav</div>
              </div>
              {SUELTOS.map((o, k) => (
                <Fila
                  key={o.nombre}
                  o={o}
                  activa={suelto === k}
                  onPick={() => setSuelto(k)}
                  etiqueta={o.nombre}
                  cifras={`${o.anot} · ${o.nav}\ngap ${o.nav - o.anot}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={css.barra}>
        {ALFAS.map((o, k) => (
          <button
            className={css.opcion}
            key={o.a}
            data-on={suelto === null && k === i ? '' : undefined}
            onClick={() => elegirAlfa(k)}
          >
            {o.a}
            <sub>{o.anot}</sub>
          </button>
        ))}
        <div className={css.sep} />
        <button
          className={css.opcion}
          data-on={hoja ? '' : undefined}
          onClick={() => setHoja((v) => !v)}
        >
          Hoja
          <sub>H</sub>
        </button>
      </div>
    </>
  )
}
