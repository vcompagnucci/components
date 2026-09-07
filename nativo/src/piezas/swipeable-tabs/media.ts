/* ═══════════════════════════════════════════════════════════════
   LAS IMÁGENES DEL MOCK — asignadas a mano por el usuario (2026-09-01),
   una lista por tab, EN SU ORDEN. No hay nada que derivar acá: es
   contenido editorial, no mecanismo.

   · En Stocks, las tres de Berry van PRIMERO (pedido explícito:
     "primero las de Berry").
   · La tarjeta de Lex Fridman llegó sin tab en el mensaje; se asignó a
     `tech` por tema — es la única decisión nuestra.
   · `ai` llegó al final (2026-09-02, cuatro adjuntos): tres fotos
     distintas — el tercero y el cuarto eran EL MISMO archivo, byte a
     byte (sha256 28d61a40…), así que entra una sola vez. Las tres son
     verticales de 904×1200 (0.7533, apenas por encima del piso 3:4).
   · REORDENADO el 2026-09-02, pedido por pedido: For you abre con el
     sketch azul sobre fondo claro; Following con el jinete de la
     bandera; Stocks con el gráfico de Figma y la de "pre-market"
     segunda; Tech con los tres grabados azules (el de los cipreses
     primero) y después las dos tarjetas; Design con el Empire State.
     Los archivos no se renombraron: el número es el del orden en que
     llegaron, el orden del feed es el de esta lista.

   El `ratio` (ancho/alto) viene medido de cada archivo al convertirlo
   (ffmpeg, ancho máx. 1300 px ≈ el ancho del bloque de media a 3x) y
   viaja acá para que el layout no tenga que esperar a decodificar la
   imagen para saber su alto. La página lo CLAMPEA a [3:4, 16:9] —
   decisión nuestra, SIN RECIBO de X: el recorte real de X cambió entre
   versiones y no está medido; 3:4 mantiene el feed hojeable con las
   capturas verticales (la más alta es 9:16).
   ═══════════════════════════════════════════════════════════════ */

export type Foto = { fuente: number; ratio: number }

export const MEDIA: Record<string, Foto[]> = {
  'for-you': [
    { fuente: require('./media/for-you-2.jpg'), ratio: 1.3274 },
    { fuente: require('./media/for-you-1.jpg'), ratio: 1.0 },
    { fuente: require('./media/for-you-3.jpg'), ratio: 1.7808 },
  ],
  following: [
    { fuente: require('./media/following-4.jpg'), ratio: 1.7804 },
    { fuente: require('./media/following-1.jpg'), ratio: 1.7804 },
    { fuente: require('./media/following-2.jpg'), ratio: 1.7804 },
    { fuente: require('./media/following-3.jpg'), ratio: 1.7751 },
  ],
  stocks: [
    { fuente: require('./media/stocks-2.jpg'), ratio: 0.8 },
    { fuente: require('./media/stocks-1.jpg'), ratio: 1.3333 },
    { fuente: require('./media/stocks-3.jpg'), ratio: 1.3333 },
    { fuente: require('./media/stocks-4.jpg'), ratio: 0.6667 },
    { fuente: require('./media/stocks-5.jpg'), ratio: 0.5625 },
  ],
  tech: [
    { fuente: require('./media/tech-5.jpg'), ratio: 1.776 },
    { fuente: require('./media/tech-3.jpg'), ratio: 1.776 },
    { fuente: require('./media/tech-4.jpg'), ratio: 1.776 },
    { fuente: require('./media/tech-1.jpg'), ratio: 1.4254 },
    { fuente: require('./media/tech-2.jpg'), ratio: 1.7751 },
  ],
  design: [
    { fuente: require('./media/design-3.jpg'), ratio: 0.7483 },
    { fuente: require('./media/design-1.jpg'), ratio: 1.3274 },
    { fuente: require('./media/design-2.jpg'), ratio: 2.0619 },
  ],
  ai: [
    { fuente: require('./media/ai-1.jpg'), ratio: 0.7533 },
    { fuente: require('./media/ai-2.jpg'), ratio: 0.7533 },
    { fuente: require('./media/ai-3.jpg'), ratio: 0.7533 },
  ],
}
