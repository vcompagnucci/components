/* Sketch — un boceto del lienzo.

   Escribí lo que quieras acá y guardá: Vite lo recarga en el frame sin
   tocar la página. Los tokens del sistema (--ink, --surface, --canvas,
   las duraciones y las curvas) están disponibles como variables CSS. */
export default function Sketch() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'grid',
        placeItems: 'center',
        color: 'var(--ink)',
      }}
    >
      Sketch
    </div>
  )
}
