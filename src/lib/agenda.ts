/**
 * Regras de horário da barbearia.
 * ATENÇÃO: este arquivo existe em dois lugares com o MESMO conteúdo:
 *   site/src/lib/agenda.ts   (mostra os horários livres ao cliente)
 *   painel/api/_lib/agenda.ts (confere o agendamento no servidor)
 * Ao mudar um, copie para o outro.
 */

export const FUSO = 'America/Fortaleza';

export interface HorarioDia {
  dia: number; // 0 = domingo
  aberto: boolean;
  abre: string; // "09:00"
  fecha: string; // "19:00"
}

export interface Ocupado {
  barbeiroId: string;
  hora: string; // "15:40"
  duracaoMinutos: number;
}

export const paraMinutos = (hora: string) => {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
};

export const paraHora = (minutos: number) =>
  `${String(Math.floor(minutos / 60)).padStart(2, '0')}:${String(minutos % 60).padStart(2, '0')}`;

/** Data e hora "agora" no fuso da barbearia. */
export function agoraLocal(base = new Date()): { data: string; minutos: number } {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: FUSO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(base);
  const p = (t: string) => partes.find((x) => x.type === t)?.value ?? '00';
  return { data: `${p('year')}-${p('month')}-${p('day')}`, minutos: Number(p('hour')) * 60 + Number(p('minute')) };
}

export function somarDias(data: string, dias: number): string {
  const d = new Date(`${data}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

export const diaDaSemana = (data: string) => new Date(`${data}T12:00:00Z`).getUTCDay();

export const DATA_VALIDA = /^\d{4}-\d{2}-\d{2}$/;
export const HORA_VALIDA = /^\d{2}:\d{2}$/;

/**
 * Horários em que um serviço de `duracao` minutos cabe para o barbeiro,
 * respeitando expediente, horários já ocupados e o "agora" (+15 min de folga).
 */
export function horariosLivres(params: {
  data: string;
  duracao: number;
  barbeiroId: string;
  horarios: HorarioDia[];
  intervalo: number;
  ocupados: Ocupado[];
  agora?: { data: string; minutos: number };
}): string[] {
  const { data, duracao, barbeiroId, horarios, intervalo, ocupados } = params;
  const agora = params.agora ?? agoraLocal();
  const regra = horarios.find((h) => h.dia === diaDaSemana(data));
  if (!regra || !regra.aberto || data < agora.data) return [];

  const inicio = paraMinutos(regra.abre);
  const fim = paraMinutos(regra.fecha);
  const minimo = data === agora.data ? agora.minutos + 15 : 0;
  const doBarbeiro = ocupados
    .filter((o) => o.barbeiroId === barbeiroId)
    .map((o) => [paraMinutos(o.hora), paraMinutos(o.hora) + o.duracaoMinutos] as const);

  const livres: string[] = [];
  for (let t = inicio; t + duracao <= fim; t += intervalo) {
    if (t < minimo) continue;
    if (doBarbeiro.some(([a, b]) => t < b && t + duracao > a)) continue;
    livres.push(paraHora(t));
  }
  return livres;
}
