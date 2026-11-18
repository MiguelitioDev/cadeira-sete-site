import type { Ocupado } from './agenda'

/**
 * Único canal entre o site e o painel do dono.
 * O site pode: (1) perguntar quais horários estão ocupados, sem nenhum dado de cliente;
 * (2) enviar um pedido de agendamento. Nada além disso.
 */
const PAINEL = (import.meta.env.VITE_PAINEL_URL as string | undefined)?.replace(/\/$/, '') || ''

export interface PedidoAgendamento {
  servicoId: string
  barbeiroId: string
  data: string
  hora: string
  nome: string
  telefone: string
  observacao?: string
  /** Campo-isca: fica escondido. Robôs preenchem, pessoas não. */
  site?: string
}

export class ErroPainel extends Error {}

export async function buscarOcupados(data: string, sinal?: AbortSignal): Promise<Ocupado[]> {
  if (!PAINEL) return []
  const r = await fetch(`${PAINEL}/api/horarios?data=${data}`, { signal: sinal })
  if (!r.ok) throw new ErroPainel('Não foi possível ver a agenda agora.')
  const corpo = (await r.json()) as { ocupados: Ocupado[] }
  return corpo.ocupados
}

export async function enviarAgendamento(pedido: PedidoAgendamento): Promise<{ id: string }> {
  if (!PAINEL) throw new ErroPainel('A agenda on-line ainda não foi ligada.')
  let r: Response
  try {
    r = await fetch(`${PAINEL}/api/agendamentos`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(pedido),
    })
  } catch {
    throw new ErroPainel('Sem conexão. Confira a internet e tente de novo.')
  }
  const corpo = await r.json().catch(() => ({}))
  if (!r.ok) throw new ErroPainel(corpo.error || 'Não foi possível agendar agora.')
  return corpo as { id: string }
}
