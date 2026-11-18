import type { CSSProperties, ReactNode } from 'react'
import { barbearia, linkWhatsapp, preco, vitrine } from '../lib/conteudo'

const ordem = (i: number) => ({ '--i': i }) as CSSProperties

/** Título de seção com o filete do poste que se desenha ao aparecer. */
export function TituloSecao({ children, apoio, claro }: { children: ReactNode; apoio?: ReactNode; claro?: boolean }) {
  return (
    <div className="revelar">
      <h2 className="font-placa text-[clamp(3rem,8vw,3.75rem)] font-black uppercase leading-[0.9]">{children}</h2>
      <div className="filete poste mt-4 h-1.5 w-24 rounded-full" aria-hidden />
      {apoio && <p className={`mt-4 max-w-lg text-lg leading-relaxed ${claro ? 'text-azulejo/75' : 'text-tinta/75'}`}>{apoio}</p>}
    </div>
  )
}

export function IconeWhatsapp({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3Z" />
      <path d="M9 8.5c0 3.6 2.9 6.5 6.5 6.5l1-1.6-2-1-1 .9c-1-.4-2-1.4-2.4-2.4l.9-1-1-2Z" fill="currentColor" strokeWidth="1" />
    </svg>
  )
}

/** Nota em estrelas: a parte cheia é recortada pela nota (4,9 → 98%). */
function Estrelas({ nota, className = '' }: { nota: number; className?: string }) {
  const linha = '★★★★★'
  return (
    <span className={`relative inline-block leading-none tracking-[0.12em] ${className}`} aria-hidden>
      <span className="text-current opacity-25">{linha}</span>
      <span className="estrelas-cheias absolute inset-0 text-latao" style={{ '--falta': `${100 - (nota / 5) * 100}%` } as CSSProperties}>
        {linha}
      </span>
    </span>
  )
}

export const notaTexto = vitrine.google.nota.toLocaleString('pt-BR', { minimumFractionDigits: 1 })

/** Selo curto para a primeira dobra. */
export function SeloGoogle() {
  return (
    <a href="#depoimentos" className="group inline-flex items-center gap-2.5 text-[15px] text-azulejo/80 hover:text-azulejo">
      <span className="revelar">
        <Estrelas nota={vitrine.google.nota} className="text-lg" />
      </span>
      <span>
        <strong className="font-semibold text-azulejo">{notaTexto}</strong> no Google · {vitrine.google.avaliacoes} avaliações
      </span>
    </a>
  )
}

export function Galeria() {
  if (!vitrine.galeria.length) return null
  return (
    <section id="fotos" className="bg-azulejo px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <TituloSecao apoio="O salão, as cadeiras e os cortes que saem delas.">A casa</TituloSecao>
        <ul className="mt-10 columns-2 gap-3 sm:gap-4 md:columns-3">
          {vitrine.galeria.map((f, i) => (
            <li key={f.id} className="revelar mb-3 break-inside-avoid sm:mb-4" style={ordem(i % 3)}>
              <figure className="zoom group relative overflow-hidden rounded-lg bg-couro">
                <img src={f.foto} alt={f.legenda} loading="lazy" decoding="async" className="w-full" />
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-tinta/85 to-transparent px-3 pb-2.5 pt-8 text-sm text-azulejo">
                  {f.legenda}
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function Depoimentos() {
  const { google, depoimentos } = vitrine
  return (
    <section id="depoimentos" className="azulejo px-4 py-20 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.6fr] lg:items-start">
        <div className="revelar lg:sticky lg:top-28">
          <p className="font-placa text-[7rem] font-black leading-[0.8] tabular-nums">{notaTexto}</p>
          <Estrelas nota={google.nota} className="mt-3 text-3xl text-tinta" />
          <p className="mt-3 text-lg">
            Nota no Google, com <strong>{google.avaliacoes} avaliações</strong>.
          </p>
          <a
            href={google.url}
            target="_blank"
            rel="noreferrer"
            className="pressionar mt-5 inline-flex h-11 items-center rounded-md border border-couro/30 bg-white px-4 font-semibold hover:border-couro"
          >
            Ler as avaliações no Google
          </a>
        </div>
        <ul className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0">
          {depoimentos.map((d, i) => (
            <li
              key={d.id}
              className="revelar elevar w-[82%] shrink-0 snap-start rounded-xl border border-azulejo-escuro bg-white p-6 sm:w-auto"
              style={ordem(i)}
            >
              <Estrelas nota={5} className="text-base text-tinta" />
              <blockquote className="mt-3 text-[17px] leading-relaxed">“{d.texto}”</blockquote>
              <p className="mt-4 text-sm text-tinta/60">
                <strong className="font-semibold text-tinta">{d.nome}</strong> · {d.quando}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function Clube() {
  const { clube } = vitrine
  if (!clube.ativo || !clube.planos.length) return null
  return (
    <section id="clube" className="relative overflow-hidden bg-couro px-4 py-20 text-azulejo sm:px-6">
      <div className="mx-auto max-w-6xl">
        <TituloSecao claro apoio={clube.texto}>
          Clube da cadeira
        </TituloSecao>
        <ul className="mt-12 grid gap-5 md:grid-cols-3 md:items-stretch">
          {clube.planos.map((p, i) => (
            <li
              key={p.id}
              style={ordem(i)}
              className={`revelar elevar relative flex flex-col rounded-xl p-6 ${
                p.destaque ? 'bg-azulejo text-tinta ring-4 ring-latao md:-my-3 md:py-9' : 'border border-couro-claro bg-couro-escuro'
              }`}
            >
              {p.destaque && (
                <span className="absolute -top-3.5 left-6 rounded-full bg-latao px-3 py-1 text-xs font-bold uppercase tracking-wide text-tinta">
                  O mais assinado
                </span>
              )}
              <h3 className="font-placa text-3xl font-bold uppercase">{p.nome}</h3>
              <p className="mt-3 flex items-baseline gap-1">
                <span className="font-placa text-6xl font-black tabular-nums">{preco(p.preco)}</span>
                <span className={p.destaque ? 'text-tinta/60' : 'text-azulejo/60'}>/mês</span>
              </p>
              <ul className="mt-5 grid flex-1 content-start gap-2.5 text-[15px]">
                {p.itens.filter((item) => item.trim()).map((item) => (
                  <li key={item} className="flex gap-2.5">
                    <span className={`mt-[0.45em] size-2 shrink-0 rotate-45 ${p.destaque ? 'bg-couro' : 'bg-latao-claro'}`} aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href={linkWhatsapp(`Olá! Quero assinar o ${p.nome} (${preco(p.preco)}/mês).`)}
                target="_blank"
                rel="noreferrer"
                className={`pressionar mt-7 inline-flex h-12 items-center justify-center rounded-md font-semibold ${
                  p.destaque ? 'bg-couro text-azulejo hover:bg-couro-claro' : 'bg-latao text-tinta hover:bg-latao-claro'
                }`}
              >
                Assinar o {p.nome.replace(/^Clube\s+/i, '')}
              </a>
            </li>
          ))}
        </ul>
        <p className="revelar mt-8 text-sm text-azulejo/60">
          A assinatura é confirmada pelo WhatsApp, e o link de pagamento chega por lá. Sem fidelidade mínima.
        </p>
      </div>
    </section>
  )
}

const MARCAS_EXTRAS = ['I', 'II', 'III', 'IV', 'V', 'VI']

export function Extras() {
  if (!vitrine.extras.length) return null
  return (
    <section id="extras" className="bg-azulejo px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <TituloSecao apoio="Para ocasiões especiais e para quem volta sempre.">Mais da casa</TituloSecao>
        <ul className="mt-10 grid gap-4 md:grid-cols-3">
          {vitrine.extras.map((x, i) => (
            <li key={x.id} style={ordem(i)} className="revelar elevar flex flex-col overflow-hidden rounded-xl border border-azulejo-escuro bg-white">
              <div className="poste h-1.5" aria-hidden />
              <div className="flex flex-1 flex-col p-6">
                <span className="font-placa text-lg font-bold text-latao">{MARCAS_EXTRAS[i] ?? ''}</span>
                <h3 className="mt-1 font-placa text-3xl font-bold uppercase leading-none">{x.titulo}</h3>
                <p className="mt-3 flex-1 text-tinta/75">{x.texto}</p>
                <a
                  href={linkWhatsapp(`Olá! Vim pelo site: ${x.titulo}.`)}
                  target="_blank"
                  rel="noreferrer"
                  className="group mt-5 inline-flex items-center gap-2 font-semibold text-couro"
                >
                  {x.chamada}
                  <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden>
                    →
                  </span>
                </a>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/** Mapa incorporado: só carrega quando chega perto da tela. */
export function Mapa() {
  const q = encodeURIComponent(`${barbearia.endereco}, ${barbearia.bairro}, ${barbearia.cidade}`)
  return (
    <div className="revelar mt-12 overflow-hidden rounded-xl border-4 border-couro-claro bg-couro-escuro">
      <iframe
        title={`Mapa: ${barbearia.nome}, ${barbearia.endereco}`}
        src={`https://www.google.com/maps?q=${q}&output=embed`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="block h-72 w-full sm:h-96"
      />
    </div>
  )
}

/** WhatsApp sempre à mão no computador (no celular ele fica na barra de baixo). */
export function WhatsappFixo() {
  return (
    <a
      href={linkWhatsapp('Olá! Vim pelo site.')}
      target="_blank"
      rel="noreferrer"
      aria-label="Conversar no WhatsApp"
      className="pressionar fixed bottom-6 right-6 z-20 hidden size-16 place-items-center rounded-full bg-[#1f8f4e] text-white shadow-[0_14px_30px_-10px_rgb(0_0_0/0.55)] hover:bg-[#1a7a42] md:grid"
    >
      <IconeWhatsapp className="aceno size-8" />
    </a>
  )
}
