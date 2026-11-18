import { useEffect, useRef } from 'react'
import type { Barbeiro } from '../lib/conteudo'

/** Perfil do barbeiro: foto, especialidade, bio e portfólio de cortes, com atalho para marcar com ele. */
export function PerfilBarbeiro({
  barbeiro,
  onFechar,
  onMarcar,
}: {
  barbeiro: Barbeiro | null
  onFechar: () => void
  onMarcar: (id: string) => void
}) {
  const dialogo = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = dialogo.current
    if (!d) return
    if (barbeiro && !d.open) d.showModal()
    else if (!barbeiro && d.open) d.close()
  }, [barbeiro])

  return (
    <dialog
      ref={dialogo}
      onClose={onFechar}
      onClick={(e) => e.target === e.currentTarget && onFechar()}
      aria-labelledby="perfil-nome"
      className="modal m-0 mt-auto max-h-[92dvh] w-full max-w-none rounded-t-2xl bg-azulejo p-0 text-tinta sm:m-auto sm:max-w-3xl sm:rounded-2xl"
    >
      {barbeiro && (
        <div className="grid sm:grid-cols-[0.9fr_1.1fr]">
          <div className="relative aspect-[4/3] overflow-hidden bg-couro sm:aspect-auto">
            {barbeiro.foto ? (
              <img src={barbeiro.foto} alt={`${barbeiro.nome}, barbeiro`} className="size-full object-cover" />
            ) : (
              <div className="grid size-full place-items-center font-placa text-[9rem] font-black text-latao/60">{barbeiro.nome[0]}</div>
            )}
            <button
              onClick={onFechar}
              className="pressionar absolute right-3 top-3 grid size-11 place-items-center rounded-full bg-tinta/70 text-2xl leading-none text-white backdrop-blur hover:bg-tinta"
              aria-label="Fechar"
            >
              ×
            </button>
          </div>
          <div className="flex flex-col p-6 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-latao">{barbeiro.especialidade}</p>
            <h2 id="perfil-nome" className="mt-1 font-placa text-5xl font-black uppercase leading-none">
              {barbeiro.nome}
            </h2>
            {barbeiro.bio && <p className="mt-4 text-[17px] leading-relaxed text-tinta/80">{barbeiro.bio}</p>}
            {!!barbeiro.portfolio?.length && (
              <>
                <h3 className="mt-6 text-sm font-semibold text-tinta/60">Cortes recentes</h3>
                <ul className="mt-2 grid grid-cols-3 gap-2">
                  {barbeiro.portfolio.map((p, i) => (
                    <li key={p.foto} className="passo aspect-square overflow-hidden rounded-md bg-couro" style={{ animationDelay: `${120 + i * 70}ms`, animationFillMode: 'both' }}>
                      <img src={p.foto} alt={`Corte feito por ${barbeiro.nome}`} loading="lazy" className="size-full object-cover" />
                    </li>
                  ))}
                </ul>
              </>
            )}
            <button
              onClick={() => onMarcar(barbeiro.id)}
              className="pressionar mt-7 h-12 rounded-md bg-latao px-5 text-[17px] font-semibold text-tinta hover:bg-latao-claro"
            >
              Marcar com {barbeiro.nome.split(' ')[0]}
            </button>
          </div>
        </div>
      )}
    </dialog>
  )
}
