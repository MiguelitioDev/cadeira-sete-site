import { useEffect } from 'react'

/**
 * Revela ao rolar: todo elemento com a classe `revelar` ganha `visivel` quando entra na tela.
 * Um único IntersectionObserver para a página inteira; cada elemento é observado uma vez só.
 * `--i` no style escalona a entrada de itens de uma lista.
 */
export function useRevelar() {
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    document.documentElement.classList.add('js-revelar')
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue
          e.target.classList.add('visivel')
          observador.unobserve(e.target)
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
    )
    document.querySelectorAll('.revelar:not(.visivel)').forEach((el) => observador.observe(el))
    return () => observador.disconnect()
  }, [])
}
