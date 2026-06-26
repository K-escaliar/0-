import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function formatDate(date: string): string {
  try {
    return format(parseISO(date), "dd/MM/yyyy", { locale: ptBR })
  } catch {
    return date
  }
}

export function formatDateTime(date: string): string {
  try {
    return format(parseISO(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  } catch {
    return date
  }
}

export function formatDateLong(date: string): string {
  try {
    return format(parseISO(date), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  } catch {
    return date
  }
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

// Normaliza texto para busca: minúsculas e sem acentos (atendentes digitam sem acento).
export function semAcento(s: string): string {
  return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

// Minutos de antecedência por exame. RM=30, AngioTC Coronária=30, demais=15.
export function antecedenciaPorExame(nome?: string, categoria?: string): number {
  if (categoria === 'Ressonância') return 30
  if (nome && semAcento(nome).includes('angio') && semAcento(nome).includes('coronar')) return 30
  return 15
}

// Maior antecedência entre um conjunto de exames.
export function antecedenciaMax(exames: { nome?: string; categoria?: string }[]): number {
  return exames.reduce((max, e) => Math.max(max, antecedenciaPorExame(e.nome, e.categoria)), 15)
}

/** @deprecated Use antecedenciaMax com objetos { nome, categoria } */
export function antecedenciaPorCategoria(categoria?: string): number {
  return antecedenciaPorExame(undefined, categoria)
}

export interface BlocoAgendamento {
  unidade: string
  data: string
  horario: string
  exames: string[]
  enderecoUnidade: string
  chegadaMin: number
}

// MENSAGEM 1 — Agendamento (sem o preparo). Suporta 1 ou 2 unidades.
export function gerarMensagemAgendamento(dados: {
  pacienteNome: string
  convenio: string
  blocos: BlocoAgendamento[]
}): string {
  const { pacienteNome, convenio, blocos } = dados
  const multi = blocos.length > 1

  const blocosTexto = blocos.map((b) => {
    const titulo = multi ? `\n*— ${b.unidade} —*\n` : ''
    const listaExames = b.exames.length > 1
      ? b.exames.map(e => `   • ${e}`).join('\n')
      : b.exames[0]
    return `${titulo}🔬 *Exame${b.exames.length > 1 ? 's' : ''}:*\n${listaExames}
📅 *Data:* ${b.data}
⏰ *Horário:* ${b.horario}
⏳ *Chegada:* ${b.chegadaMin} minutos de antecedência
${b.enderecoUnidade}`
  }).join('\n\n')

  return `Olá, *${pacienteNome}*! 👋

✅ Seu agendamento no *CDI* está confirmado!

👤 *Convênio:* ${convenio}

${blocosTexto}

📋 *DOCUMENTOS NECESSÁRIOS NO DIA:*
   • Documento oficial com foto (RG ou CNH)
   • Pedido médico original dentro da validade

_Em caso de dúvidas ou necessidade de reagendamento, entre em contato conosco com antecedência._

Agradecemos a preferência! 💙`
}

// MENSAGEM 2 — Preparo (separada, para colar em seguida no WhatsApp).
export function gerarMensagemPreparo(dados: {
  pacienteNome: string
  preparos: { nome: string; preparo: string }[]
}): string {
  const { pacienteNome, preparos } = dados
  if (preparos.length === 0) {
    return `${pacienteNome}
⚠️ *ORIENTAÇÕES E PREPARO*
Seus exames não exigem preparo especial. Basta chegar no horário com os documentos. 😊`
  }
  const lista = preparos.map(p => `📋 *${p.nome}:*\n${p.preparo}`).join('\n\n')
  return `${pacienteNome}
⚠️ *ORIENTAÇÕES E PREPARO DOS SEUS EXAMES*
${lista}

Qualquer dúvida, estamos à disposição! 💖`
}

export const ENDERECOS = {
  'CDI Prime': '📍 *CDI Prime*\nR. das Margaridas, 711 - Alphaville, Sorriso - MT\nCEP: 78891-076\n🗺 Fica a 2 quadras do CDI Treze de Maio, atrás do Laboratório Vitória.',
  'CDI Treze de Maio': '📍 *CDI Treze de Maio*\nAv. Brasil, 2346 - Vila Romana, Sorriso - MT\n🏥 Em anexo ao Hospital 13 de Maio.',
}
