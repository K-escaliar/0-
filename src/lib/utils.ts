import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function formatDate(date: string): string {
  try {
    return format(parseISO(date), "dd/MM/yyyy", { locale: ptBR })
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

// Minutos de antecedência por categoria (US=15, RM=30, TC=15). Demais: 15.
export function antecedenciaPorCategoria(categoria?: string): number {
  if (categoria === 'Ressonância') return 30
  return 15
}

// Maior antecedência entre as categorias de um conjunto de exames.
export function antecedenciaMax(categorias: (string | undefined)[]): number {
  return categorias.reduce((max, c) => Math.max(max, antecedenciaPorCategoria(c)), 15)
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

  const blocosTexto = blocos.map((b, i) => {
    const titulo = multi ? `\n*— ${b.unidade} —*\n` : ''
    const listaExames = b.exames.join('\n📋 ')
    return `${titulo}📋 *Exame${b.exames.length > 1 ? 's' : ''}:* ${listaExames}
🏥 *Unidade:* ${b.unidade}
📅 *Data:* ${b.data}
⏰ *Horário:* ${b.horario}
⏳ *Chegada:* Chegar com ${b.chegadaMin} minutos de antecedência.
📍 *Endereço:* ${b.enderecoUnidade}`
  }).join('\n')

  return `${pacienteNome}
Confirmamos seu agendamento no *CDI*:
👤 *Convênio:* ${convenio}
${blocosTexto}
📝 *DOCUMENTOS NECESSÁRIOS NO DIA:*
- Documento oficial com foto (RG ou CNH);
- Pedido médico original dentro da validade;
Sua opinião é muito importante! Após o atendimento, você receberá nossa pesquisa de satisfação (NPS). Conte-nos como foi sua experiência! 😊
Agradecemos a preferência! 💖`
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
  'CDI Prime': '*CDI Prime*: Fica a 2 quadras do CDI 13 de Maio, atrás do Laboratório Vitória.',
  'CDI Treze de Maio': '*CDI Treze de Maio*: Hospital 13 de Maio - Avenida principal.',
}
