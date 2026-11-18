import { useEffect, useState } from 'react'
import { Agendamento } from './components/Agendamento'
import { PerfilBarbeiro } from './components/PerfilBarbeiro'
import { Clube, Depoimentos, Extras, Galeria, IconeWhatsapp, Mapa, SeloGoogle, TituloSecao, WhatsappFixo } from './components/Secoes'
import { agoraLocal, diaDaSemana, horariosLivres, somarDias } from './lib/agenda'
import { DIAS, barbearia, equipe, linkWhatsapp, preco, servicos } from './lib/conteudo'
import { buscarOcupados } from './lib/painel'
import { useRevelar } from './lib/revelar'
import type { Barbeiro } from './lib/conteudo'

const FOTO_HERO = '/images/hero.webp'

/** Primeiro horário livre (para um corte) hoje ou nos próximos dias. Busca no painel só os horários ocupados. */
function useProximoHorario() {
  const [proximo, setProximo] = useState<{ data: string; hora: string } | null | undefined>(undefined)
  useEffect(() => {
    let vivo = true
    const servico = servicos[0]
    if (!servico) return
    ;(async () => {
      const hoje = agoraLocal().data
      for (let i = 0; i < 7 && vivo; i++) {
        const data = somarDias(hoje, i)
        const regra = barbearia.horarios.find((h) => h.dia === diaDaSemana(data))
        if (!regra?.aberto) continue
        const ocupados = await buscarOcupados(data).catch(() => [])
        const horas = equipe
          .flatMap((b) =>
            horariosLivres({
              data,
              duracao: servico.duracaoMinutos,
              barbeiroId: b.id,
              horarios: barbearia.horarios,
              intervalo: barbearia.intervaloMinutos,
              ocupados,
            }),
          )
          .sort()
        if (horas[0]) {
          if (vivo) setProximo({ data, hora: horas[0] })
          return
        }
      }
      if (vivo) setProximo(null)
    })()
    return () => {
      vivo = false
    }
  }, [])
  return proximo
}

function quando(data: string) {
  const hoje = agoraLocal().data
  if (data === hoje) return 'Hoje'
  if (data === somarDias(hoje, 1)) return 'Amanhã'
  return DIAS[diaDaSemana(data)]
}

function FotoOuPlaca({ src, alt, className, children }: { src: string; alt: string; className?: string; children: React.ReactNode }) {
  const [falhou, setFalhou] = useState(false)
  if (falhou) return <div className={className}>{children}</div>
  return <img src={src} alt={alt} className={className} onError={() => setFalhou(true)} />
}

/** Poste de barbeiro com tampas de latão e listras girando. */
function PosteGiratorio() {
  return (
    <div className="flex h-[82%] flex-col items-center" aria-hidden>
      <span className="poste-tampa size-7 shrink-0 rounded-full sm:size-9" />
      <span className="poste-tampa -mt-1 h-4 w-16 shrink-0 rounded-md sm:w-20" />
      <span className="poste poste-animado w-10 flex-1 rounded-sm sm:w-14" />
      <span className="poste-tampa h-4 w-16 shrink-0 rounded-md sm:w-20" />
      <span className="poste-tampa -mt-1 h-3 w-10 shrink-0 rounded-b-full sm:w-12" />
    </div>
  )
}

const FERRAMENTAS = [
  // [imagem, classes de posição e tamanho, duração, atraso, giro]
  ['maquina', '-left-8 top-6 w-32 sm:w-40 lg:left-[2%] lg:top-12 lg:w-48', '9s', '0s', '7deg'],
  ['pincel', '-right-6 top-6 w-20 sm:w-28 lg:right-[3%] lg:top-10 lg:w-32', '8s', '-5s', '8deg'],
  ['navalha', 'bottom-4 left-[7%] hidden w-44 lg:block lg:w-52', '11s', '-3s', '6deg'],
  ['pente', 'bottom-3 right-[2%] hidden w-56 lg:block lg:w-64', '10s', '-2s', '5deg'],
] as const

/** Ferramentas de barbeiro em latão, balançando atrás da primeira dobra. Puramente decorativas. */
function FerramentasAoFundo() {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {FERRAMENTAS.map(([nome, posicao, dur, atraso, giro]) => (
        <img
          key={nome}
          src={`/images/ferramentas/${nome}.webp`}
          alt=""
          className={`ferramenta absolute h-auto opacity-[0.14] ${posicao}`}
          style={{ '--dur': dur, '--atraso': atraso, '--giro': giro } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

export default function App() {
  const [agendar, setAgendar] = useState<{ aberto: boolean; servico?: string; barbeiro?: string }>({ aberto: false })
  const abrir = (servico?: string, barbeiro?: string) => setAgendar({ aberto: true, servico, barbeiro })
  const [perfil, setPerfil] = useState<Barbeiro | null>(null)
  useRevelar()
  const proximo = useProximoHorario()
  const hoje = diaDaSemana(agoraLocal().data)
  const regraHoje = barbearia.horarios.find((h) => h.dia === hoje)

  return (
    <>
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2">
        Pular para o conteúdo
      </a>

      {barbearia.aviso.ativo && barbearia.aviso.texto && (
        <div className="bg-poste px-4 py-2 text-center text-sm font-semibold text-white" role="status">
          {barbearia.aviso.texto}
        </div>
      )}

      <header className="sticky top-0 z-30 bg-couro text-azulejo">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
          <a href="#topo" className="flex items-center gap-2.5" aria-label={`${barbearia.nome}, início`}>
            <span className="grid size-9 place-items-center rounded-md bg-latao-claro font-placa text-2xl font-black text-couro">7</span>
            <span className="font-placa text-2xl font-bold uppercase tracking-wide">{barbearia.nome}</span>
          </a>
          <nav aria-label="Seções" className="hidden items-center gap-7 text-[15px] md:flex">
            <a href="#precos" className="link-menu">Preços</a>
            <a href="#equipe" className="link-menu">Barbeiros</a>
            <a href="#clube" className="link-menu">Clube</a>
            <a href="#onde" className="link-menu">Onde fica</a>
            <button onClick={() => abrir()} className="pressionar h-10 rounded-md bg-latao px-4 font-semibold text-tinta hover:bg-latao-claro">
              Marcar horário
            </button>
          </nav>
        </div>
        <div className="poste h-1" aria-hidden />
      </header>

      <main id="conteudo">
        {/* Primeira dobra: a placa da barbearia + o próximo horário livre */}
        <section id="topo" className="relative overflow-hidden bg-couro-escuro text-azulejo">
          <FerramentasAoFundo />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:pb-24 lg:pt-16">
            <div className="entrada">
              <p className="text-[15px] text-latao-claro">
                {barbearia.complemento} em {barbearia.cidade.split(',')[0]} · {barbearia.bairro}
              </p>
              <h1 className="mt-3 font-placa text-[clamp(4.5rem,15vw,9.5rem)] font-black uppercase leading-[0.82] tracking-tight">
                Cadeira
                <br />
                Sete
              </h1>
              <p className="mt-6 max-w-md text-lg leading-relaxed text-azulejo/85">{barbearia.chamada}</p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => abrir()}
                  className="pressionar h-13 rounded-md bg-latao px-6 text-[17px] font-semibold text-tinta hover:bg-latao-claro"
                >
                  Marcar horário
                </button>
                <a href="#precos" className="h-13 content-center rounded-md px-4 text-[17px] font-semibold text-azulejo underline-offset-4 hover:underline">
                  Ver preços
                </a>
              </div>
              <div className="mt-7">
                <SeloGoogle />
              </div>
            </div>

            <div className="relative">
              <div className="relative aspect-[5/4] overflow-hidden rounded-t-[999px] border-[6px] border-latao/70 bg-couro sm:aspect-square lg:aspect-[4/5]">
                <FotoOuPlaca
                  src={FOTO_HERO}
                  alt="Barbeiro finalizando um corte na cadeira de couro"
                  className="size-full object-cover"
                >
                  <div className="grid size-full place-items-center bg-couro">
                    <PosteGiratorio />
                  </div>
                </FotoOuPlaca>
              </div>

              {/* Comanda: o próximo horário livre, calculado com a agenda real do painel */}
              <button
                onClick={() => abrir(servicos[0]?.id)}
                className="pressionar group absolute -bottom-6 left-3 right-3 rounded-lg bg-azulejo p-4 text-left text-tinta shadow-[0_18px_40px_-12px_rgb(0_0_0/0.55)] sm:left-auto sm:right-6 sm:w-72 lg:-left-10 lg:right-auto"
              >
                <span className="flex items-center gap-2 text-sm text-tinta/65">
                  <span className="relative flex size-2.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-couro-claro opacity-60" />
                    <span className="relative inline-flex size-2.5 rounded-full bg-couro-claro" />
                  </span>
                  Próximo horário livre
                </span>
                <span className="mt-1 block font-placa text-4xl font-bold uppercase leading-none" aria-live="polite">
                  {proximo === undefined ? '…' : proximo ? `${quando(proximo.data)}, ${proximo.hora}` : 'Agenda cheia'}
                </span>
                <span className="mt-2 block text-sm font-semibold text-couro group-hover:underline">
                  Reservar {servicos[0]?.nome.toLowerCase()} · {servicos[0] && preco(servicos[0].preco)}
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* Tabela de preços no estilo letreiro de feltro */}
        <section id="precos" className="azulejo px-4 pb-20 pt-24 sm:px-6">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <TituloSecao apoio={barbearia.sobre}>Tabela de preços</TituloSecao>
              <p className="revelar mt-6 text-[15px] text-tinta/65">Toque num serviço para marcar.</p>
            </div>
            <div className="revelar rounded-xl border-[10px] border-[#5b3a22] bg-tinta p-2 shadow-[inset_0_2px_12px_rgb(0_0_0/0.6)]">
              <ul
                className="rounded-md px-4 py-3 sm:px-7 sm:py-5"
                style={{ backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0 13px, rgb(255 255 255 / 0.035) 13px 14px)' }}
              >
                {servicos.map((s, i) => (
                  <li key={s.id} className="revelar" style={{ '--i': i + 2 } as React.CSSProperties}>
                    <button
                      onClick={() => abrir(s.id)}
                      className="group flex w-full items-baseline gap-3 py-3 text-left text-azulejo"
                    >
                      <span className="min-w-0">
                        <span className="block font-placa text-[1.7rem] font-bold uppercase leading-tight tracking-wide transition-colors group-hover:text-latao-claro">
                          {s.nome}
                        </span>
                        <span className="block text-sm text-azulejo/60">
                          {s.descricao} {s.duracaoMinutos} min.
                        </span>
                      </span>
                      <span className="mb-2 flex-1 self-end border-b-2 border-dotted border-azulejo/25 transition-colors group-hover:border-latao-claro/60" aria-hidden />
                      <span className="font-placa text-[1.9rem] font-bold tabular-nums text-latao-claro">{preco(s.preco)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section id="equipe" className="bg-azulejo px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <TituloSecao apoio="Toque no barbeiro para ver os cortes dele, ou deixe a casa escolher pelo horário.">Os barbeiros</TituloSecao>
            <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {equipe.map((b, i) => (
                <li key={b.id} className="revelar" style={{ '--i': i } as React.CSSProperties}>
                  <button onClick={() => setPerfil(b)} className="zoom group block w-full text-left" aria-label={`Ver o perfil de ${b.nome}`}>
                    <div className="relative aspect-[4/5] overflow-hidden rounded-t-[999px] bg-couro">
                      {b.foto ? (
                        <img src={b.foto} alt="" className="size-full object-cover" loading="lazy" />
                      ) : (
                        <div className="grid size-full place-items-center font-placa text-[9rem] font-black text-latao/60">{b.nome[0]}</div>
                      )}
                      <span className="absolute inset-x-0 bottom-0 translate-y-1 bg-gradient-to-t from-tinta/85 to-transparent px-5 pb-4 pt-12 text-[15px] font-semibold text-azulejo opacity-90 transition-[opacity,transform] duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                        {b.portfolio?.length ? `Ver ${b.portfolio.length} cortes →` : 'Ver perfil →'}
                      </span>
                    </div>
                  </button>
                  <div className="mt-4 flex items-end justify-between gap-3">
                    <div>
                      <h3 className="font-placa text-3xl font-bold uppercase">{b.nome}</h3>
                      <p className="text-tinta/70">{b.especialidade}</p>
                    </div>
                    <button
                      onClick={() => abrir(undefined, b.id)}
                      className="pressionar shrink-0 rounded-md border border-couro/30 px-3 py-2 text-sm font-semibold hover:border-couro hover:bg-white"
                    >
                      Marcar com {b.nome.split(' ')[0]}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <Galeria />
        <Clube />
        <Depoimentos />
        <Extras />

        <section id="onde" className="bg-couro px-4 py-20 text-azulejo sm:px-6">
          <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2">
            <div>
              <TituloSecao claro>Onde fica</TituloSecao>
              <address className="revelar mt-5 text-xl not-italic leading-relaxed">
                {barbearia.endereco}
                <br />
                {barbearia.bairro}, {barbearia.cidade}
              </address>
              <div className="revelar mt-7 flex flex-wrap gap-3">
                <a href={barbearia.mapsUrl} target="_blank" rel="noreferrer" className="pressionar h-12 content-center rounded-md bg-azulejo px-5 font-semibold text-tinta hover:bg-white">
                  Abrir no mapa
                </a>
                <a href={linkWhatsapp('Olá! Vim pelo site.')} target="_blank" rel="noreferrer" className="pressionar inline-flex h-12 items-center gap-2 rounded-md border border-azulejo/40 px-5 font-semibold hover:border-azulejo">
                  <IconeWhatsapp className="size-5" /> WhatsApp
                </a>
              </div>
            </div>
            <div className="revelar" style={{ '--i': 2 } as React.CSSProperties}>
              <h3 className="text-lg font-semibold text-latao-claro">Horário de funcionamento</h3>
              <table className="mt-3 w-full text-[17px]">
                <tbody>
                  {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                    const h = barbearia.horarios.find((x) => x.dia === d)
                    const ehHoje = d === hoje
                    return (
                      <tr key={d} className={`border-b border-couro-claro ${ehHoje ? 'font-semibold text-latao-claro' : ''}`}>
                        <th scope="row" className="py-2.5 text-left font-[inherit]">
                          {DIAS[d]} {ehHoje && <span className="text-sm">(hoje)</span>}
                        </th>
                        <td className="py-2.5 text-right tabular-nums">{h?.aberto ? `${h.abre} às ${h.fecha}` : 'Fechado'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {regraHoje && !regraHoje.aberto && <p className="mt-3 text-sm text-azulejo/70">Hoje estamos fechados, mas a agenda on-line funciona.</p>}
            </div>
          </div>
          <div className="mx-auto max-w-6xl">
            <Mapa />
          </div>
        </section>
      </main>

      <footer className="bg-couro-escuro px-4 pb-28 pt-8 text-sm text-azulejo/60 sm:px-6 md:pb-8">
        <div className="mx-auto flex max-w-6xl flex-wrap justify-between gap-3">
          <p>
            © {new Date().getFullYear()} {barbearia.nome} {barbearia.complemento} ·{' '}
            <a className="hover:text-azulejo" href={`https://instagram.com/${barbearia.instagram}`} target="_blank" rel="noreferrer">
              @{barbearia.instagram}
            </a>
          </p>
          <p>Protótipo demonstrativo · negócio fictício · MJ Studios</p>
        </div>
      </footer>

      {/* Botão fixo no celular */}
      <div className="fixed inset-x-0 bottom-0 z-20 flex gap-2 border-t border-couro-claro bg-couro/95 p-3 backdrop-blur md:hidden">
        <button onClick={() => abrir()} className="pressionar h-12 flex-1 rounded-md bg-latao text-[17px] font-semibold text-tinta">
          Marcar horário
        </button>
        <a
          href={linkWhatsapp('Olá! Vim pelo site.')}
          target="_blank"
          rel="noreferrer"
          aria-label="Conversar no WhatsApp"
          className="pressionar grid size-12 shrink-0 place-items-center rounded-md bg-[#1f8f4e] text-white"
        >
          <IconeWhatsapp className="size-6" />
        </a>
      </div>
      <WhatsappFixo />

      <PerfilBarbeiro
        barbeiro={perfil}
        onFechar={() => setPerfil(null)}
        onMarcar={(id) => {
          setPerfil(null)
          abrir(undefined, id)
        }}
      />
      <Agendamento
        aberto={agendar.aberto}
        servicoInicial={agendar.servico}
        barbeiroInicial={agendar.barbeiro}
        onFechar={() => setAgendar({ aberto: false })}
      />
    </>
  )
}
