/* ¿ALGÚN COMENTARIO NOMBRA ALGO QUE YA NO EXISTE?
 *
 *     pnpm referencias           # informe; sale con 1 si hay algo muerto
 *     pnpm referencias --todo    # también lo que nunca fue de acá
 *
 * ─── POR QUÉ EXISTE ───
 * El repo escribe el porqué arriba de cada archivo y en la bitácora, y
 * esos textos NOMBRAN cosas: `medidas.ts`, `HOLD.duracion`, `css.sombra`.
 * Cuando algo se borra o se renombra, el código deja de compilar y el
 * comentario NO: sigue ahí explicando algo que ya no pasa. Es el modo en
 * que este repo se rompe, y ninguna otra herramienta lo ve: el typecheck
 * no lee comentarios y el linter tampoco. El 2026-09-09 fueron nueve en
 * un día — dos recibos que quedaron atrás de un renombre y siete que
 * sobrevivieron al borrado del anillo.
 *
 * ─── POR QUÉ NO ALCANZA CON "NO ESTÁ DEFINIDO" ───
 * Así, el primer intento marcó 426 referencias y casi todas eran
 * legítimas: el repo nombra placeholders (`src/notas/<slug>.tsx`), APIs
 * del navegador (`getComputedStyle`), teclas (`Escape`) y clases CSS de
 * los sitios que MIDE (`Toolbar_chip` es de una referencia ajena). "No
 * está acá" no distingue lo muerto de lo que nunca fue nuestro.
 *
 * ─── LOS DOS DISCRIMINADORES, Y NINGUNA LISTA DE EXCEPCIONES ───
 * 1. LA HISTORIA. Se marca lo que este repo TUVO: un archivo, si figura
 *    entre los borrados de `git log --diff-filter=D`; un nombre, si
 *    alguna vez hubo una definición suya. El índice de nombres sale de
 *    un solo `git log -p` sobre toda la historia (~11 s, 2.600 nombres);
 *    preguntarle a git nombre por nombre con `-G` tardaba 31 s CADA UNO.
 * 2. EL PARECIDO. Un nombre que nunca existió pero que, bajado a
 *    minúsculas y sin guiones bajos, coincide con uno que sí existe hoy,
 *    es una referencia mal escrita y no algo ajeno: decía VELO_BLANCO
 *    donde el nombre vivo es `COMMIT.veloBlanco`. Sin esta regla, un
 *    nombre que SIEMPRE estuvo mal no lo encuentra nadie.
 *
 *    (Y ese ejemplo va sin backticks a propósito: la convención que este
 *    script impone es que un backtick PROMETE que la cosa existe. Nombrar
 *    algo muerto se hace en prosa. Sin eso, el script se marcaba a sí
 *    mismo por citar el error que encontró.)
 *
 * ─── QUÉ ATRAPA, PROBADO ───
 * Con tres referencias muertas inyectadas a propósito encuentra dos:
 * un archivo borrado y un nombre que existió. NO encuentra la tercera,
 * `HOLD_DURACION` por `HOLD.duracion` —un camino con puntos escrito con
 * guiones bajos—, y no se le agregó la regla porque para atraparla habría
 * que aceptar como sospechoso cualquier NOMBRE_ASI cuyas dos mitades
 * existan por separado, que en este repo son muchas.
 *
 * Y no ve, por definición, un comentario que describe MAL algo que sí
 * existe. Para eso hay que leer. */
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync, execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const RAIZ = fileURLToPath(new URL('../', import.meta.url))
const TODO = process.argv.includes('--todo')
const git = (...a) => execFileSync('git', a, { cwd: RAIZ, maxBuffer: 1 << 28 }).toString()

const rastreados = git('ls-files').trim().split('\n')
/* Para leer: sólo texto. Para RESOLVER una referencia: todos, o un
   `media/compra.wav` no se encuentra a sí mismo. */
const archivos = rastreados.filter((f) => /\.(ts|tsx|mjs|js|md|css|swift|py|sh)$/.test(f))
const contenido = new Map(archivos.map((f) => [f, fs.readFileSync(path.join(RAIZ, f), 'utf8')]))

/* Los archivos de medición viven en `.context/`, que está gitignoreado:
   la bitácora los nombra igual y existen en la máquina. */
const enContexto = new Set()
const recorrer = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.git')) continue
    const p = path.join(dir, e.name)
    if (e.isDirectory()) recorrer(p)
    else enContexto.add(e.name)
  }
}
if (fs.existsSync(path.join(RAIZ, '.context'))) recorrer(path.join(RAIZ, '.context'))

const borrados = git('log', '--all', '--diff-filter=D', '--name-only', '--format=').split('\n').filter(Boolean)

/* ── LOS DOS ÍNDICES DE NOMBRES ── */
const DEFINICION = '((export[[:space:]]+)?(const|let|var|function|type|interface|class)[[:space:]]+[A-Za-z_$][A-Za-z0-9_$]*)|(^[-+]?[[:space:]]*[A-Za-z_$][A-Za-z0-9_$]*[[:space:]]*:)'
const NOMBRE_SOLO = "grep -oE '[A-Za-z_$][A-Za-z0-9_$]*[[:space:]]*:?$' | tr -d ' :' | sort -u"
const sh = (cmd) => execSync(cmd, { cwd: RAIZ, maxBuffer: 1 << 28, shell: '/bin/bash' }).toString().trim().split('\n').filter(Boolean)

const definidosHoy = new Set(sh(`git ls-files -z | xargs -0 grep -hoE '${DEFINICION}' 2>/dev/null | ${NOMBRE_SOLO}`))

/* Un solo recorrido de la historia, CACHEADO por commit: es el paso caro
   (~11 s) y sin caché el loop de corregir-y-volver-a-correr cuesta dos
   minutos por vuelta. */
const CACHE = path.join(RAIZ, '.context/referencias-historia.txt')
/* El sello es HEAD y NADA MÁS. La primera versión sumaba
   `git rev-list --all --count`, y con varios worktrees en paralelo eso
   cambia cada vez que otra rama commitea: el caché no se usaba nunca. El
   índice se arma de `--all`, así que una rama ajena puede agregarle
   nombres; el precio de no verlos hasta que HEAD se mueva es que una
   referencia recién muerta EN OTRA RAMA no se detecta acá, que es
   exactamente donde no importa. */
const sello = git('rev-parse', 'HEAD').trim()
let existieron
if (fs.existsSync(CACHE) && fs.readFileSync(CACHE, 'utf8').split('\n')[0] === sello) {
  existieron = new Set(fs.readFileSync(CACHE, 'utf8').split('\n').slice(1).filter(Boolean))
} else {
  existieron = new Set(sh(
    `git log --all --format= -U0 -p -- '*.ts' '*.tsx' '*.mjs' '*.js' '*.md' '*.css' '*.swift' 2>/dev/null` +
    ` | grep -E '^[-+]' | grep -oE '${DEFINICION}' | ${NOMBRE_SOLO}`,
  ))
  fs.mkdirSync(path.dirname(CACHE), { recursive: true })
  fs.writeFileSync(CACHE, sello + '\n' + [...existieron].join('\n'))
}
/* Para el segundo discriminador: la forma normalizada de lo que hay hoy. */
const formaDeHoy = new Set([...definidosHoy].map((n) => n.toLowerCase().replace(/_/g, '')))

/* ¿El nombre aparece EN CÓDIGO, fuera de un backtick? Un nombre vivo se
   usa; uno muerto sólo se menciona. Los `.md` no cuentan: son prosa. */
const codigo = [...contenido].filter(([f]) => /\.(ts|tsx|mjs|js|css|swift)$/.test(f))
  .map(([, s]) => s.replace(/`[^`\n]*`/g, ' ')).join('\n')
const seUsa = (n) => new RegExp(`\\b${n}\\b`).test(codigo)

const EXT = /\.(ts|tsx|mjs|js|md|css|swift|py|sh|json|png|wav|caf|mp4|mov|webm)$/
/* Ni una extensión suelta (`.tsx`) ni un molde (`src/notas/<slug>.tsx`)
   son una referencia a un archivo. */
const esPlaceholder = (r) => /[<>*{}]/.test(r) || r.startsWith('.') && !r.includes('/')
const existeArchivo = (ref, desdeDir) => {
  const limpio = ref.replace(/^\.\//, '')
  const base = path.basename(limpio)
  if (fs.existsSync(path.join(RAIZ, limpio)) || fs.existsSync(path.join(RAIZ, desdeDir, limpio))) return true
  if (rastreados.some((f) => f === limpio || f.endsWith('/' + base))) return true
  return enContexto.has(base)
}
/* QUÉ SE MIRA Y QUÉ NO, después de leer los 23 primeros hallazgos.
   Nuestros nombres son CONSTANTES EN MAYÚSCULAS, solas o encabezando un
   campo (`HOLD.duracion`, `COMMIT.veloBlanco`). Eso deja afuera, sin
   nombrar a ninguno, todo lo que dio falso positivo: APIs de librerías
   (`ReduceMotion.Never`, `props.fallback`), del navegador
   (`history.pushState`, `console.log`), valores del DOM (`BODY`),
   bundles (`Taller.app`) y prosa (`undefined.map`). De un nombre con
   punto se mira SÓLO el primero: el segundo casi siempre es de otro. */
const primerSegmento = (r) => r.replace(/\(\)$/, '').split('.')[0]
const esNombreNuestro = (r) =>
  !r.endsWith('()') && /^[A-Z][A-Z0-9_]{2,}$/.test(primerSegmento(r)) && !primerSegmento(r).endsWith('_')

const muertos = []
const ajenos = []
const sinVerificar = []
for (const [f, src] of contenido) {
  const dir = path.dirname(f)
  src.split('\n').forEach((l, i) => {
    for (const m of l.matchAll(/`([^`\n]{2,80})`/g)) {
      const ref = m[1].trim()
      const donde = { archivo: f, linea: i + 1, ref, texto: l.trim().slice(0, 120) }
      if (EXT.test(ref) && !/\s/.test(ref) && !esPlaceholder(ref)) {
        if (existeArchivo(ref, dir)) continue
        const base = path.basename(ref)
        /* `.context/` es scratch de cada máquina y está gitignoreado: que
           un archivo de ahí no esté acá no dice nada sobre el repo. */
        if (ref.startsWith('.context/')) { sinVerificar.push({ ...donde, tipo: 'archivo' }); continue }
        const fueBorrado = borrados.some((b) => b === ref || b.endsWith('/' + base))
        ;(fueBorrado ? muertos : ajenos).push({ ...donde, tipo: 'archivo', motivo: fueBorrado ? 'lo borró un commit' : 'nunca estuvo' })
      } else if (esNombreNuestro(ref)) {
        const n = primerSegmento(ref)
        if (definidosHoy.has(n) || seUsa(n)) continue
        const existio = existieron.has(n)
        /* El parecido sólo vale con guión bajo: es el patrón de nuestras
           constantes, y sin esa condición `BODY` pesca a `body`. */
        const parecido = n.includes('_') && formaDeHoy.has(n.toLowerCase().replace(/_/g, ''))
        if (existio) muertos.push({ ...donde, tipo: 'nombre', motivo: `${n} existió en este repo y ya no` })
        else if (parecido) muertos.push({ ...donde, tipo: 'nombre', motivo: `${n} no existe; sí existe algo escrito de otra forma` })
        else ajenos.push({ ...donde, tipo: 'nombre', motivo: 'nunca fue de acá' })
      }
    }
  })
}

if (muertos.length) {
  console.log(`MUERTAS (${muertos.length}) — el repo tuvo esto y ya no:\n`)
  for (const h of muertos) console.log(`  ${h.archivo}:${h.linea}  \`${h.ref}\` — ${h.motivo}\n      ${h.texto}\n`)
} else {
  console.log('OK: ninguna referencia nombra algo que este repo haya perdido.')
}
if (TODO && ajenos.length) {
  console.log(`\nDE AFUERA (${ajenos.length}) — nunca estuvieron acá; casi siempre APIs, teclas o código ajeno medido:\n`)
  for (const h of ajenos) console.log(`  ${h.archivo}:${h.linea}  \`${h.ref}\``)
}
if (sinVerificar.length) {
  console.log(`\nSIN VERIFICAR (${sinVerificar.length}) — apuntan a \`.context/\`, que es scratch de cada máquina y no viaja: puede estar en la tuya y no en otra.`)
  if (TODO) for (const h of sinVerificar) console.log(`  ${h.archivo}:${h.linea}  \`${h.ref}\``)
}
console.log(`\n${archivos.length} archivos · ${definidosHoy.size} nombres hoy · ${existieron.size} en la historia · ${muertos.length} muertas · ${ajenos.length} de afuera · ${sinVerificar.length} sin verificar${TODO ? '' : ' (--todo)'}`)
process.exit(muertos.length ? 1 : 0)
