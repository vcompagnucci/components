import css from './privado.module.css'

/* EL VAULT — la pared de referencias.

   FASE 1: el cascarón y el estado vacío. La grilla, el manifiesto y el
   filtro nativo/web son la fase 3.

   El estado vacío que se ve acá no es un placeholder que después se
   tira: es el mismo que va a aparecer cuando el manifiesto exista y
   esté vacío. */
export function Vault() {
  return <p className={css.vacio}>Sin clips.</p>
}
