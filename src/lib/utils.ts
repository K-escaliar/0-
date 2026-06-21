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

export function gerarMensagemWhatsApp(dados: {
  pacienteNome: string
  exames: string[]
  unidade: string
  data: string
  horario: string
  convenio: string
  preparos: string[]
  enderecoUnidade: string
}): string {
  const { pacienteNome, exames, unidade, data, horario, convenio, preparos, enderecoUnidade } = dados

  const listaExames = exames.join('\n📋 ')
  const listaPreparos = preparos.length > 0
    ? preparos.join('\n\n')
    : 'Sem preparo especial necessário.'

  return `${pacienteNome}
Confirmamos seu agendamento no *CDI*:
📋 *Exame:* ${listaExames}
🏥 *Unidade:* ${unidade}
📅 *Data:* ${data}
⏰ *Horário:* ${horario}
👤 *Convênio:* ${convenio}
⏳ *Chegada:* Chegar com 30 minutos de antecedência.
📝 *DOCUMENTOS NECESSÁRIOS NO DIA:*
- Documento oficial com foto (RG ou CNH);
- Pedido médico original dentro da validade;
⚠️ *ORIENTAÇÕES E PREPARO:*
${listaPreparos}
📍 *Endereço da Unidade:*
${enderecoUnidade}
Sua opinião é muito importante! Após o atendimento, você receberá nossa pesquisa de satisfação (NPS). Conte-nos como foi sua experiência! 😊
Agradecemos a preferência! 💖`
}

export const ENDERECOS = {
  'CDI Prime': '*CDI Prime*: Fica a 2 quadras do CDI 13 de Maio, atrás do Laboratório Vitória.',
  'CDI Treze de Maio': '*CDI Treze de Maio*: Hospital 13 de Maio - Avenida principal.',
}
