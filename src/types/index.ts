export type UserRole = 'atendente' | 'admin'
export type Unidade = 'CDI Prime' | 'CDI Treze de Maio'
export type StatusAgendamento = 'Paciente Agendado' | 'Cancelado' | 'Realizado'
export type CategoriaExame = 'Ultrassom' | 'Raio-X' | 'Mamografia' | 'Tomossíntese' | 'Ressonância' | 'Tomografia' | 'Outros'
export type StatusConvenioExame = 'autorizado' | 'negado' | 'restrito'

export interface Profile {
  id: string
  nome: string
  email: string
  role: UserRole
  ativo: boolean
  created_at: string
}

export interface Exame {
  id: string
  nome: string
  categoria: CategoriaExame
  codigo?: string
  codigo_tuss?: string
  preparo?: string
  observacoes_tuss?: string
  unidades: Unidade[]
  requer_sedacao: boolean
  valor_particular?: number | null
  valor_unimed_279?: number | null
  valor_unimed_completa?: number | null
  avisos?: string | null
  created_at: string
}

export interface ExameConflito {
  id: string
  exame_id1: string
  exame_id2: string
  aviso: string
  exame1?: Exame
  exame2?: Exame
}

export interface Medico {
  id: string
  nome: string
  especialidade?: string
  unidade: Unidade | 'Ambas'
  created_at: string
}

export interface MedicoExame {
  medico_id: string
  exame_id: string
  realiza: boolean
  exame?: Exame
}

export interface Convenio {
  id: string
  nome: string
  tipo: 'convenio' | 'desconto' | 'particular'
  precisa_guia: boolean
  precisa_autorizacao: boolean
  alertas?: string
  observacoes?: string
  created_at: string
}

export interface ConvenioExame {
  convenio_id: string
  exame_id: string
  status: StatusConvenioExame
  observacao?: string
  exame?: Exame
}

export interface Agendamento {
  id: string
  paciente_nome: string
  convenio_id: string
  convenio?: Convenio
  unidade: Unidade
  data: string
  horario: string
  medico_solicitante?: string
  status: StatusAgendamento
  atendente_id: string
  atendente?: Profile
  created_at: string
  exames?: AgendamentoExame[]
}

export interface AgendamentoExame {
  agendamento_id: string
  exame_id: string
  exame?: Exame
}

export interface RedeExterna {
  id: string
  clinica_nome: string
  exames_oferecidos: string
  telefone?: string
  observacoes?: string
  created_at: string
}

export interface ExameSedacao {
  id: string
  exame_id: string
  restricoes?: string
  indicacoes?: string
  exame?: Exame
}

export interface NotaPessoal {
  id: string
  user_id: string
  titulo: string
  conteudo: string
  data_lembrete?: string | null
  created_at: string
  updated_at: string
}

export interface MensagemInterna {
  id: string
  remetente_id: string
  destinatario_id: string
  conteudo: string
  imagem_url?: string | null
  lida: boolean
  created_at: string
  remetente?: Profile
  destinatario?: Profile
}
