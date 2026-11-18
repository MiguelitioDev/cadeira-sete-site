// O conteúdo do site mora em src/content/*.json. O painel do dono edita esses
// arquivos (commit no GitHub) e a Vercel publica o site de novo em segundos.
import barbeariaJson from '../content/barbearia.json'
import servicosJson from '../content/servicos.json'
import equipeJson from '../content/equipe.json'
import vitrineJson from '../content/vitrine.json'
import type { HorarioDia } from './agenda'

export interface Barbearia {
  nome: string
  complemento: string
  chamada: string
  sobre: string
  aviso: { ativo: boolean; texto: string }
  endereco: string
  bairro: string
  cidade: string
  mapsUrl: string
  whatsapp: string
  instagram: string
  intervaloMinutos: number
  antecedenciaDias: number
  horarios: HorarioDia[]
}

export interface Servico {
  id: string
  nome: string
  descricao: string
  preco: number
  duracaoMinutos: number
  ativo: boolean
}

export interface Barbeiro {
  id: string
  nome: string
  especialidade: string
  bio?: string
  foto: string
  portfolio?: { foto: string }[]
  ativo: boolean
}

export interface Vitrine {
  google: { nota: number; avaliacoes: number; url: string }
  depoimentos: { id: string; nome: string; texto: string; quando: string }[]
  galeria: { id: string; foto: string; legenda: string }[]
  clube: {
    ativo: boolean
    texto: string
    planos: { id: string; nome: string; preco: number; itens: string[]; destaque: boolean }[]
  }
  extras: { id: string; titulo: string; texto: string; chamada: string }[]
}

export const barbearia = barbeariaJson as Barbearia
export const servicos = (servicosJson as Servico[]).filter((s) => s.ativo !== false)
export const equipe = (equipeJson as Barbeiro[]).filter((b) => b.ativo !== false)
export const vitrine = vitrineJson as Vitrine

export const preco = (valor: number) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })

export const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export const linkWhatsapp = (texto: string) =>
  `https://wa.me/${barbearia.whatsapp}?text=${encodeURIComponent(texto)}`
