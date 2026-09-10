import { Component, Suspense, lazy, type ComponentType, type ReactNode } from 'react'
import css from './playground.module.css'
import { nombreDeRuta } from './clips'

/* ═══════════════════════════════════════════════════════════════
   LOS BOCETOS — escribir un componente desde cero, adentro del lienzo.

   Un boceto es UN ARCHIVO DE VERDAD en src/privado/bocetos/, que exporta
   un componente por defecto. El frame lo dibuja, Vite lo recarga al
   guardar, y el lienzo no se entera: no hay recarga de página, no se
   pierde la posición de nada.

   ─── POR QUÉ NO UN EDITOR EN EL NAVEGADOR ───
   La alternativa era Monaco o CodeMirror más un transformador en el
   cliente (esbuild-wasm), y sería una dependencia grande para darte un
   editor PEOR que el que ya tenés abierto al lado. Y sobre todo: un
   agente escribe archivos, no tipea en un textarea. Si el boceto es un
   archivo, las dos formas de trabajar —vos en el editor, un agente en
   la terminal— son la MISMA, y ninguna necesita interfaz.

   Todo esto vive en src/privado/, así que el glob no toca el bundle.

   ─── ES SÓLO WEB, Y ES A PROPÓSITO ───
   Una pieza de App no se construye acá: se construye contra el
   simulador, con el agente al lado, y llega a la exposición como video.
   El lienzo no intenta simular un teléfono — react-native-web dibujaría
   la forma y mentiría justo en lo que este vault estudia, que es el
   gesto.
   ═══════════════════════════════════════════════════════════════ */

/* El glob trae las CLAVES ya, y el módulo sólo cuando se pide. Eager
   sería importar los treinta bocetos al abrir cualquier lienzo. */
const MODULOS = import.meta.glob<{ default: ComponentType }>('./sketches/*.tsx')

const PRE = './sketches/'
const POS = '.tsx'
const refDe = (clave: string) => clave.slice(PRE.length, -POS.length)

/* Los que existen hoy, para el diálogo de agregar. Se recalcula al
   recargar el módulo, y Vite recarga este módulo cuando aparece un
   archivo nuevo que matchea el glob: por eso un boceto recién creado
   aparece en la lista sin tocar nada. */
export const BOCETOS = Object.keys(MODULOS).map(refDe).sort()

export const nombreDeBoceto = (ref: string) => nombreDeRuta(ref)

/* UNO POR REF Y NO UNO POR RENDER. `lazy` guarda adentro la promesa del
   módulo: crear uno nuevo en cada render volvería a montar el boceto
   —y a tirarle el estado— cada vez que movés el frame. */
const cache = new Map<string, ComponentType>()

function componenteDe(ref: string): ComponentType | null {
  const cargar = MODULOS[PRE + ref + POS]
  if (!cargar) return null
  let c = cache.get(ref)
  if (!c) {
    c = lazy(cargar)
    cache.set(ref, c)
  }
  return c
}

/* ─── LA SUPERFICIE DE "TODAVÍA NO" ───
   La misma caja que usa un clip que ya no está: el nombre y una palabra
   que dice por qué está vacía. Se ve en dos momentos, los dos cortos —
   mientras el módulo viaja, y en los milisegundos entre que se crea el
   archivo y Vite avisa que existe— y en uno largo: cuando el boceto
   está roto. */
function Hueco({ ref_, estado }: { ref_: string; estado: string }) {
  return (
    <div className={css.hueco}>
      <span className={css.huecoNombre}>{nombreDeBoceto(ref_)}</span>
      <span className={css.huecoFalta}>{estado}</span>
    </div>
  )
}

/* ─── UN BOCETO ROTO NO PUEDE TIRAR EL TABLERO ───
   Escribir libremente significa que la mitad del tiempo el archivo está
   a medias, y sin esto un `undefined.map` en un boceto desmonta el
   lienzo entero: perdés los otros frames, la selección y el gesto que
   estabas haciendo. Con el límite, lo único que se apaga es su frame.

   SE LIMPIA SOLO AL SIGUIENTE HOT UPDATE, que es exactamente cuando
   arreglaste el archivo. Sin eso el frame quedaría en rojo para siempre
   y habría que recargar la página — o sea, perder lo mismo que este
   componente vino a salvar. Y se limpia SÓLO si hay error: pisar el
   estado en cada guardado remontaría todos los bocetos del tablero cada
   vez que tocás cualquier archivo. */
class Limite extends Component<
  { ref_: string; children: ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  limpiar = () => this.setState((s) => (s.error ? { error: null } : s))

  componentDidMount() {
    import.meta.hot?.on('vite:afterUpdate', this.limpiar)
  }

  componentWillUnmount() {
    import.meta.hot?.off('vite:afterUpdate', this.limpiar)
  }

  render() {
    if (!this.state.error) return this.props.children
    return <Hueco ref_={this.props.ref_} estado="Error" />
  }
}

/* El boceto en su frame. `key` en el límite y no adentro: cambiar de
   boceto tiene que empezar de cero, incluido el error del anterior.

   `data-boceto` es el contrato con el lienzo: es lo que mira el gesto
   del frame para apartarse cuando el puntero cae adentro de un boceto
   elegido. Va en el atributo y no en la clase porque una clase de CSS
   Modules cambia de nombre al compilar. */
export function Boceto({ ref_ }: { ref_: string }) {
  const C = componenteDe(ref_)
  if (!C) return <Hueco ref_={ref_} estado="Sketch" />
  return (
    <div className={css.boceto} data-boceto="">
      <Limite key={ref_} ref_={ref_}>
        {/* Sin fallback: el módulo llega en un cuadro o dos y un
            parpadeo gris en el medio sería más ruido que el vacío. */}
        <Suspense fallback={null}>
          {/* oxlint-disable-next-line react/static-components -- `C` no se
              crea en cada render: `componenteDe` cachea el `lazy()` en un Map
              de nivel de módulo y devuelve la misma referencia por clave. El
              bug que la regla busca —perder el estado en cada render— acá no
              puede pasar. */}
          <C />
        </Suspense>
      </Limite>
    </div>
  )
}

/* PUBLICAR un boceto como pieza Web. El servidor copia el archivo a
   src/components/pieces/<slug>/<slug>.tsx —el lado público de la
   frontera, donde demos.tsx lo encuentra por slug— con un index.tsx al
   lado que lo exporta, y anota la entrada en pieces.ts, las dos cosas o
   ninguna. Es COPIA: el boceto se queda en el tablero, y desde
   la publicación la pieza se edita en su archivo publicado. Devuelve el
   slug, que es a dónde navegar. */
export async function publicarBoceto(
  ref: string,
  nombre: string,
  desc: string,
): Promise<string> {
  const r = await fetch('/vault-media/__publicar', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ tipo: 'boceto', ref, nombre, desc }),
  })
  const d = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(d?.error ?? `error ${r.status}`)
  return d.slug as string
}

/* UN NOMBRE LIBRE PARA EL PRÓXIMO. El servidor igual rechaza los
   repetidos —escribe con 'wx'— así que esto no es la guarda: es para no
   pedirte un nombre antes de que exista la cosa, que es la misma regla
   que ya usa "New view". Renombrar es renombrar el archivo. */
export function refLibre(base = 'sketch') {
  if (!BOCETOS.includes(base)) return base
  for (let n = 2; n < 200; n++) if (!BOCETOS.includes(`${base}-${n}`)) return `${base}-${n}`
  return `${base}-${BOCETOS.length + 1}`
}

/* ─── CREAR UNO ───
   Lo escribe el servidor porque el navegador no puede escribir en tu
   disco, y tiene que ser un archivo de verdad o no lo puede abrir ni tu
   editor ni un agente. La plantilla y las guardas están en
   scripts/vault-media.mjs.

   Devuelve el `ref` —el nombre del archivo sin extensión— o null si el
   servidor lo rechazó. */
export async function crearBoceto(nombre: string): Promise<string | null> {
  const r = await fetch('/vault-media/__boceto?nombre=' + encodeURIComponent(nombre), {
    method: 'POST',
  })
  /* `r.ok` y no sólo la forma de la respuesta: el 409 de "ya existe"
     TAMBIÉN devuelve un ref —el del archivo que ya estaba— y tomarlo
     sería poner en la tela un boceto ajeno creyendo que se creó uno. */
  if (!r.ok) return null
  const d = await r.json().catch(() => null)
  return typeof d?.ref === 'string' ? d.ref : null
}
