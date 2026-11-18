import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { agoraLocal, diaDaSemana, horariosLivres, somarDias, type Ocupado } from '../lib/agenda'
import { barbearia, equipe, linkWhatsapp, preco, servicos, type Servico } from '../lib/conteudo'
import { ErroPainel, buscarOcupados, enviarAgendamento } from '../lib/painel'

const QUALQUER = 'qualquer'
const DIAS_CURTOS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

type Etapa = 'servico' | 'barbeiro' | 'horario' | 'dados' | 'pronto'
const ETAPAS: { id: Etapa; nome: string }[] = [
  { id: 'servico', nome: 'Serviço' },
  { id: 'barbeiro', nome: 'Barbeiro' },
  { id: 'horario', nome: 'Horário' },
  { id: 'dados', nome: 'Seus dados' },
]

function dataLegivel(data: string) {
  const d = new Date(`${data}T12:00:00Z`)
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', timeZone: 'UTC' })
}

function mascaraTelefone(v: string) {
  const n = v.replace(/\D/g, '').slice(0, 11)
  if (n.length <= 2) return n
  if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`
}

export function Agendamento({
  aberto,
  servicoInicial,
  barbeiroInicial,
  onFechar,
}: {
  aberto: boolean
  servicoInicial?: string
  /** Vem do perfil do barbeiro: pula a etapa "Com quem?". */
  barbeiroInicial?: string
  onFechar: () => void
}) {
  const dialogo = useRef<HTMLDialogElement>(null)
  const [etapa, setEtapa] = useState<Etapa>('servico')
  const [servico, setServico] = useState<Servico | null>(null)
  const [barbeiroId, setBarbeiroId] = useState<string>(QUALQUER)
  const [data, setData] = useState(() => agoraLocal().data)
  const [hora, setHora] = useState<string | null>(null)
  const [ocupados, setOcupados] = useState<Ocupado[] | null>(null)
  const [erroAgenda, setErroAgenda] = useState<string | null>(null)
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [observacao, setObservacao] = useState('')
  const [isca, setIsca] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)

  // Abre/fecha o <dialog> nativo (foco preso e Esc de graça).
  useEffect(() => {
    const d = dialogo.current
    if (!d) return
    if (aberto && !d.open) {
      const inicial = servicos.find((s) => s.id === servicoInicial) ?? null
      const barbeiro = equipe.some((b) => b.id === barbeiroInicial) ? barbeiroInicial! : QUALQUER
      setServico(inicial)
      setBarbeiroId(barbeiro)
      setEtapa(inicial ? (barbeiro !== QUALQUER ? 'horario' : 'barbeiro') : 'servico')
      setHora(null)
      setErroEnvio(null)
      d.showModal()
    } else if (!aberto && d.open) d.close()
  }, [aberto, servicoInicial, barbeiroInicial])

  // Busca no painel os horários já ocupados do dia escolhido.
  useEffect(() => {
    if (etapa !== 'horario') return
    const controle = new AbortController()
    setOcupados(null)
    setErroAgenda(null)
    buscarOcupados(data, controle.signal)
      .then(setOcupados)
      .catch((e) => {
        if (controle.signal.aborted) return
        setErroAgenda(e instanceof ErroPainel ? e.message : 'Não foi possível ver a agenda agora.')
        setOcupados([])
      })
    return () => controle.abort()
  }, [data, etapa])

  const dias = useMemo(() => {
    const hoje = agoraLocal().data
    return Array.from({ length: barbearia.antecedenciaDias }, (_, i) => somarDias(hoje, i))
  }, [])

  /** Para cada horário livre, qual barbeiro atende (útil quando o cliente escolhe "qualquer um"). */
  const livres = useMemo(() => {
    if (!servico || !ocupados) return new Map<string, string>()
    const candidatos = barbeiroId === QUALQUER ? equipe.map((b) => b.id) : [barbeiroId]
    const mapa = new Map<string, string>()
    for (const id of candidatos) {
      for (const h of horariosLivres({
        data,
        duracao: servico.duracaoMinutos,
        barbeiroId: id,
        horarios: barbearia.horarios,
        intervalo: barbearia.intervaloMinutos,
        ocupados,
      })) {
        if (!mapa.has(h)) mapa.set(h, id)
      }
    }
    return new Map([...mapa.entries()].sort(([a], [b]) => a.localeCompare(b)))
  }, [servico, ocupados, barbeiroId, data])

  const barbeiroFinal = hora ? (barbeiroId === QUALQUER ? livres.get(hora) : barbeiroId) : undefined
  const nomeBarbeiro = equipe.find((b) => b.id === barbeiroFinal)?.nome
  const telefoneValido = telefone.replace(/\D/g, '').length >= 10

  async function confirmar(e: FormEvent) {
    e.preventDefault()
    if (!servico || !hora || !barbeiroFinal) return
    setEnviando(true)
    setErroEnvio(null)
    try {
      await enviarAgendamento({
        servicoId: servico.id,
        barbeiroId: barbeiroFinal,
        data,
        hora,
        nome: nome.trim(),
        telefone: telefone.replace(/\D/g, ''),
        observacao: observacao.trim() || undefined,
        site: isca,
      })
      setEtapa('pronto')
    } catch (err) {
      setErroEnvio(err instanceof ErroPainel ? err.message : 'Não foi possível agendar agora.')
    } finally {
      setEnviando(false)
    }
  }

  const indice = ETAPAS.findIndex((x) => x.id === etapa)
  const voltar = () => setEtapa(ETAPAS[Math.max(0, indice - 1)].id)

  return (
    <dialog
      ref={dialogo}
      onClose={onFechar}
      aria-labelledby="agendar-titulo"
      className="gaveta m-0 ml-auto h-dvh max-h-dvh w-full max-w-none bg-azulejo p-0 text-tinta sm:max-w-[30rem]"
    >
      <div className="flex h-full flex-col">
        <header className="bg-couro text-azulejo">
          <div className="poste h-1.5" aria-hidden />
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <div>
              <h2 id="agendar-titulo" className="font-placa text-3xl font-bold uppercase leading-none tracking-wide">
                Marcar horário
              </h2>
              <p className="mt-1 text-sm text-azulejo/70">
                {barbearia.nome} · {barbearia.bairro}, {barbearia.cidade}
              </p>
            </div>
            <button
              onClick={onFechar}
              className="grid size-11 place-items-center rounded-full text-2xl leading-none hover:bg-couro-claro"
              aria-label="Fechar"
            >
              ×
            </button>
          </div>
          {etapa !== 'pronto' && (
            <ol className="grid grid-cols-4 border-t border-couro-claro text-[13px]">
              {ETAPAS.map((x, i) => (
                <li
                  key={x.id}
                  aria-current={x.id === etapa ? 'step' : undefined}
                  className={`border-b-[3px] px-2 py-2.5 text-center ${
                    i < indice ? 'border-latao text-azulejo/80' : i === indice ? 'border-latao-claro font-semibold' : 'border-transparent text-azulejo/45'
                  }`}
                >
                  {x.nome}
                </li>
              ))}
            </ol>
          )}
        </header>

        <div key={etapa} className="passo flex-1 overflow-y-auto px-5 py-6">
          {etapa === 'servico' && (
            <fieldset>
              <legend className="mb-4 text-lg font-semibold">
                O que vamos fazer hoje?
                {barbeiroId !== QUALQUER && (
                  <span className="mt-0.5 block text-[15px] font-normal text-tinta/65">
                    Com {equipe.find((b) => b.id === barbeiroId)?.nome}.{' '}
                    <button type="button" className="font-semibold text-couro underline underline-offset-2" onClick={() => setBarbeiroId(QUALQUER)}>
                      Trocar
                    </button>
                  </span>
                )}
              </legend>
              <div className="grid gap-2">
                {servicos.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setServico(s)
                      setHora(null)
                      setEtapa(barbeiroInicial && barbeiroId === barbeiroInicial ? 'horario' : 'barbeiro')
                    }}
                    className={`flex items-baseline justify-between gap-4 pressionar rounded-lg border bg-white px-4 py-3.5 text-left transition-colors hover:border-couro ${
                      servico?.id === s.id ? 'border-couro ring-2 ring-couro/20' : 'border-azulejo-escuro'
                    }`}
                  >
                    <span>
                      <span className="block font-semibold">{s.nome}</span>
                      <span className="text-sm text-tinta/65">{s.duracaoMinutos} min · {s.descricao}</span>
                    </span>
                    <span className="font-placa text-2xl font-bold">{preco(s.preco)}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {etapa === 'barbeiro' && (
            <fieldset>
              <legend className="mb-4 text-lg font-semibold">Com quem?</legend>
              <div className="grid gap-2">
                {[{ id: QUALQUER, nome: 'Tanto faz', especialidade: 'Mostra mais horários livres', foto: '' }, ...equipe].map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      setBarbeiroId(b.id)
                      setHora(null)
                      setEtapa('horario')
                    }}
                    className={`flex items-center gap-4 pressionar rounded-lg border bg-white px-4 py-3 text-left transition-colors hover:border-couro ${
                      barbeiroId === b.id ? 'border-couro ring-2 ring-couro/20' : 'border-azulejo-escuro'
                    }`}
                  >
                    <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full bg-couro font-placa text-xl font-bold text-latao-claro">
                      {b.foto ? <img src={b.foto} alt="" className="size-full object-cover" /> : b.id === QUALQUER ? '7' : b.nome[0]}
                    </span>
                    <span>
                      <span className="block font-semibold">{b.nome}</span>
                      <span className="text-sm text-tinta/65">{b.especialidade}</span>
                    </span>
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {etapa === 'horario' && servico && (
            <div>
              <h3 className="text-lg font-semibold">Escolha o dia</h3>
              <div className="-mx-5 mt-3 flex snap-x scroll-px-5 gap-2 overflow-x-auto px-5 pb-2" role="listbox" aria-label="Dias">
                {dias.map((d) => {
                  const regra = barbearia.horarios.find((h) => h.dia === diaDaSemana(d))
                  const fechado = !regra?.aberto
                  const ativo = d === data
                  return (
                    <button
                      key={d}
                      role="option"
                      aria-selected={ativo}
                      disabled={fechado}
                      onClick={() => {
                        setData(d)
                        setHora(null)
                      }}
                      className={`flex w-16 shrink-0 snap-start flex-col items-center rounded-lg border py-2 transition-colors ${
                        ativo
                          ? 'border-couro bg-couro text-azulejo'
                          : fechado
                            ? 'border-transparent text-tinta/30'
                            : 'border-azulejo-escuro bg-white hover:border-couro'
                      }`}
                    >
                      <span className="text-xs">{DIAS_CURTOS[diaDaSemana(d)]}</span>
                      <span className="font-placa text-2xl font-bold leading-tight">{d.slice(8)}</span>
                    </button>
                  )
                })}
              </div>

              <h3 className="mt-6 text-lg font-semibold first-letter:uppercase">{dataLegivel(data)}</h3>
              {erroAgenda && (
                <p className="mt-2 rounded-md bg-poste/10 px-3 py-2 text-sm text-poste" role="alert">
                  {erroAgenda}
                </p>
              )}
              {ocupados === null ? (
                <div className="mt-3 grid grid-cols-4 gap-2" aria-busy="true" aria-label="Carregando horários">
                  {Array.from({ length: 12 }, (_, i) => (
                    <div key={i} className="h-11 animate-pulse rounded-md bg-azulejo-escuro" />
                  ))}
                </div>
              ) : livres.size === 0 ? (
                <p className="mt-3 text-tinta/70">Sem horários livres neste dia. Tente o próximo.</p>
              ) : (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {[...livres.keys()].map((h) => (
                    <button
                      key={h}
                      onClick={() => setHora(h)}
                      aria-pressed={hora === h}
                      className={`pressionar h-11 rounded-md border font-semibold tabular-nums transition-colors ${
                        hora === h ? 'border-couro bg-couro text-azulejo' : 'border-azulejo-escuro bg-white hover:border-couro'
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {etapa === 'dados' && servico && hora && (
            <form id="form-agendar" onSubmit={confirmar} className="grid gap-4">
              <Resumo servico={servico} data={data} hora={hora} barbeiro={nomeBarbeiro} />
              <label className="grid gap-1.5">
                <span className="font-semibold">Seu nome</span>
                <input
                  required
                  autoComplete="name"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  maxLength={60}
                  className="h-12 rounded-md border border-azulejo-escuro bg-white px-3 text-base"
                />
              </label>
              <label className="grid gap-1.5">
                <span className="font-semibold">WhatsApp</span>
                <input
                  required
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  placeholder="(85) 99999-0000"
                  value={telefone}
                  onChange={(e) => setTelefone(mascaraTelefone(e.target.value))}
                  className="h-12 rounded-md border border-azulejo-escuro bg-white px-3 text-base tabular-nums"
                />
                <span className="text-sm text-tinta/60">A barbearia confirma por aqui.</span>
              </label>
              <label className="grid gap-1.5">
                <span className="font-semibold">
                  Recado <span className="font-normal text-tinta/60">(opcional)</span>
                </span>
                <textarea
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  maxLength={200}
                  rows={2}
                  placeholder="Ex.: quero manter o comprimento em cima"
                  className="rounded-md border border-azulejo-escuro bg-white px-3 py-2 text-base"
                />
              </label>
              <label className="absolute -left-[9999px]" aria-hidden>
                Site
                <input tabIndex={-1} autoComplete="off" value={isca} onChange={(e) => setIsca(e.target.value)} />
              </label>
              {erroEnvio && (
                <div className="rounded-md bg-poste/10 px-3 py-2.5 text-sm text-poste" role="alert">
                  <p>{erroEnvio}</p>
                  <a
                    className="mt-1 inline-block font-semibold underline"
                    href={linkWhatsapp(`Olá! Quero marcar ${servico.nome} em ${dataLegivel(data)} às ${hora}.`)}
                  >
                    Marcar pelo WhatsApp
                  </a>
                </div>
              )}
            </form>
          )}

          {etapa === 'pronto' && servico && hora && (
            <div className="entrada py-4 text-center">
              <div className="mx-auto grid size-20 place-items-center rounded-full bg-couro text-4xl text-latao-claro" aria-hidden>
                ✓
              </div>
              <h3 className="mt-5 font-placa text-4xl font-bold uppercase">Horário reservado</h3>
              <p className="mx-auto mt-2 max-w-xs text-tinta/75">
                {nome.split(' ')[0]}, a barbearia já recebeu seu pedido e vai confirmar pelo WhatsApp.
              </p>
              <div className="mt-6 text-left">
                <Resumo servico={servico} data={data} hora={hora} barbeiro={nomeBarbeiro} />
              </div>
              <p className="mt-4 text-sm text-tinta/60">
                Precisa remarcar? Fale com a gente no{' '}
                <a className="font-semibold underline" href={linkWhatsapp('Olá! Preciso remarcar meu horário.')}>
                  WhatsApp
                </a>
                .
              </p>
            </div>
          )}
        </div>

        <footer className="border-t border-azulejo-escuro bg-white px-5 py-4">
          {etapa === 'pronto' ? (
            <button onClick={onFechar} className="h-12 w-full rounded-md bg-couro font-semibold text-azulejo hover:bg-couro-claro">
              Fechar
            </button>
          ) : (
            <div className="flex gap-3">
              {indice > 0 && (
                <button onClick={voltar} className="h-12 rounded-md border border-azulejo-escuro px-5 font-semibold hover:border-couro">
                  Voltar
                </button>
              )}
              {etapa === 'horario' && (
                <button
                  disabled={!hora}
                  onClick={() => setEtapa('dados')}
                  className="h-12 flex-1 rounded-md bg-couro font-semibold text-azulejo hover:bg-couro-claro disabled:opacity-40"
                >
                  {hora ? `Continuar com ${hora}` : 'Escolha um horário'}
                </button>
              )}
              {etapa === 'dados' && (
                <button
                  type="submit"
                  form="form-agendar"
                  disabled={enviando || !nome.trim() || !telefoneValido}
                  className="h-12 flex-1 rounded-md bg-latao font-semibold text-tinta hover:bg-latao-claro disabled:opacity-40"
                >
                  {enviando ? 'Enviando…' : 'Confirmar agendamento'}
                </button>
              )}
            </div>
          )}
        </footer>
      </div>
    </dialog>
  )
}

function Resumo({ servico, data, hora, barbeiro }: { servico: Servico; data: string; hora: string; barbeiro?: string }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-lg border border-dashed border-couro/40 bg-white px-4 py-3 text-[15px]">
      <dt className="text-tinta/60">Serviço</dt>
      <dd className="font-semibold">
        {servico.nome} · {preco(servico.preco)}
      </dd>
      <dt className="text-tinta/60">Quando</dt>
      <dd className="font-semibold first-letter:uppercase">
        {dataLegivel(data)}, {hora}
      </dd>
      {barbeiro && (
        <>
          <dt className="text-tinta/60">Barbeiro</dt>
          <dd className="font-semibold">{barbeiro}</dd>
        </>
      )}
    </dl>
  )
}
