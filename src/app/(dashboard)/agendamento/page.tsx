'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { CalendarPlus, Search, X, AlertTriangle, CheckCircle, Copy, Check, ChevronDown } from 'lucide-react'
import { gerarMensagemWhatsApp, ENDERECOS, formatDate } from '@/lib/utils'
import type { Exame, Convenio } from '@/types'

const CONVENIOS_PADRAO = ['Particular', 'Unimed', 'Bradesco Saúde', 'BRF', 'Sul América', 'CASSI', 'Infinity', 'Postal', 'MedService', 'Economy Brasil', 'Consórcio', 'Pax Vida', 'CDL', 'Outro']
const UNIDADES = ['CDI Prime', 'CDI Treze de Maio'] as const

export default function AgendamentoPage() {
  const supabase = createClient()
  const [exames, setExames] = useState<Exame[]>([])
  const [convenios, setConvenios] = useState<Convenio[]>([])
  const [carregando, setCarregando] = useState(false)
  const [mensagemGerada, setMensagemGerada] = useState('')
  const [copiado, setCopiado] = useState(false)
  const [erros, setErros] = useState<string[]>([])
  const [avisos, setAvisos] = useState<string[]>([])
  const [buscaExame, setBuscaExame] = useState('')
  const [exameAberto, setExameAberto] = useState(false)

  const [form, setForm] = useState({
    pacienteNome: '',
    convenio: '',
    unidade: '' as typeof UNIDADES[number] | '',
    data: '',
    horario: '',
    medicoSolicitante: '',
    examesSelecionados: [] as Exame[],
  })

  useEffect(() => {
    async function carregar() {
      const [{ data: examesData }, { data: conveniosData }] = await Promise.all([
        supabase.from('exames').select('*').order('nome'),
        supabase.from('convenios').select('*').order('nome'),
      ])
      if (examesData) setExames(examesData)
      if (conveniosData) setConvenios(conveniosData)
    }
    carregar()
  }, [])

  const examesFiltrados = exames.filter(e =>
    e.nome.toLowerCase().includes(buscaExame.toLowerCase()) &&
    !form.examesSelecionados.find(s => s.id === e.id)
  )

  function selecionarExame(exame: Exame) {
    setForm(f => ({ ...f, examesSelecionados: [...f.examesSelecionados, exame] }))
    setBuscaExame('')
    setExameAberto(false)
  }

  function removerExame(id: string) {
    setForm(f => ({ ...f, examesSelecionados: f.examesSelecionados.filter(e => e.id !== id) }))
  }

  const validar = useCallback(async () => {
    const novosErros: string[] = []
    const novosAvisos: string[] = []

    if (!form.unidade) return { erros: novosErros, avisos: novosAvisos }

    // Verificar exames por unidade
    for (const exame of form.examesSelecionados) {
      if (!exame.unidades?.includes(form.unidade as typeof UNIDADES[number])) {
        novosErros.push(`"${exame.nome}" não é realizado na ${form.unidade}.`)
      }
    }

    // Verificar conflitos entre exames
    if (form.examesSelecionados.length > 1) {
      const { data: conflitos } = await supabase
        .from('exame_conflitos')
        .select('*, exame1:exames!exame_conflitos_exame_id1_fkey(nome), exame2:exames!exame_conflitos_exame_id2_fkey(nome)')

      if (conflitos) {
        const ids = form.examesSelecionados.map(e => e.id)
        for (const conflito of conflitos) {
          if (ids.includes(conflito.exame_id1) && ids.includes(conflito.exame_id2)) {
            novosAvisos.push(conflito.aviso)
          }
        }
      }
    }

    // Verificar convênio x exame
    if (form.convenio) {
      const convenioObj = convenios.find(c => c.nome === form.convenio)
      if (convenioObj) {
        const { data: convenioExames } = await supabase
          .from('convenio_exames')
          .select('*, exame:exames(nome)')
          .eq('convenio_id', convenioObj.id)
          .eq('status', 'negado')

        if (convenioExames) {
          const negadosIds = convenioExames.map((ce: any) => ce.exame_id)
          for (const exame of form.examesSelecionados) {
            if (negadosIds.includes(exame.id)) {
              novosAvisos.push(`"${exame.nome}" não é coberto pelo convênio ${form.convenio}.`)
            }
          }
        }
      }
    }

    return { erros: novosErros, avisos: novosAvisos }
  }, [form, convenios])

  useEffect(() => {
    if (form.unidade && form.examesSelecionados.length > 0) {
      validar().then(({ erros: e, avisos: a }) => {
        setErros(e)
        setAvisos(a)
      })
    } else {
      setErros([])
      setAvisos([])
    }
  }, [form.unidade, form.examesSelecionados, validar])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const { erros: errosAtual } = await validar()
    if (errosAtual.length > 0) {
      toast.error('Corrija os erros antes de finalizar.')
      return
    }

    if (!form.pacienteNome || !form.convenio || !form.unidade || !form.data || !form.horario || form.examesSelecionados.length === 0) {
      toast.error('Preencha todos os campos obrigatórios.')
      return
    }

    setCarregando(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const convenioObj = convenios.find(c => c.nome === form.convenio)

      const { data: agendamento, error } = await supabase
        .from('agendamentos')
        .insert({
          paciente_nome: form.pacienteNome,
          convenio_id: convenioObj?.id ?? null,
          convenio_nome: form.convenio,
          unidade: form.unidade,
          data: form.data,
          horario: form.horario,
          medico_solicitante: form.medicoSolicitante || null,
          status: 'Paciente Agendado',
          atendente_id: user!.id,
        })
        .select()
        .single()

      if (error) throw error

      // Inserir exames do agendamento
      const examesAgendamento = form.examesSelecionados.map(exame => ({
        agendamento_id: agendamento.id,
        exame_id: exame.id,
      }))
      await supabase.from('agendamento_exames').insert(examesAgendamento)

      // Gerar mensagem WhatsApp
      const preparos = form.examesSelecionados
        .filter(e => e.preparo)
        .map(e => `*${e.nome}:*\n${e.preparo}`)

      const mensagem = gerarMensagemWhatsApp({
        pacienteNome: form.pacienteNome,
        exames: form.examesSelecionados.map(e => e.nome),
        unidade: form.unidade,
        data: formatDate(form.data),
        horario: form.horario,
        convenio: form.convenio,
        preparos,
        enderecoUnidade: ENDERECOS[form.unidade as keyof typeof ENDERECOS] ?? form.unidade,
      })

      setMensagemGerada(mensagem)
      toast.success('Agendamento realizado com sucesso!')

      setForm({
        pacienteNome: '', convenio: '', unidade: '', data: '',
        horario: '', medicoSolicitante: '', examesSelecionados: [],
      })
      setErros([])
      setAvisos([])
    } catch (err) {
      toast.error('Erro ao salvar agendamento.')
      console.error(err)
    } finally {
      setCarregando(false)
    }
  }

  async function copiarMensagem() {
    await navigator.clipboard.writeText(mensagemGerada)
    setCopiado(true)
    toast.success('Mensagem copiada!')
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <CalendarPlus className="text-blue-700" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Agendamento</h1>
          <p className="text-gray-500 text-sm">Preencha os dados do paciente</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Formulário */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nome do paciente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Paciente <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.pacienteNome}
                onChange={e => setForm(f => ({ ...f, pacienteNome: e.target.value }))}
                className="input-field"
                placeholder="Nome completo"
                required
              />
            </div>

            {/* Convênio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Convênio <span className="text-red-500">*</span>
              </label>
              <select
                value={form.convenio}
                onChange={e => setForm(f => ({ ...f, convenio: e.target.value }))}
                className="input-field"
                required
              >
                <option value="">Selecionar convênio...</option>
                {CONVENIOS_PADRAO.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Unidade */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unidade <span className="text-red-500">*</span>
              </label>
              <select
                value={form.unidade}
                onChange={e => setForm(f => ({ ...f, unidade: e.target.value as typeof UNIDADES[number] }))}
                className="input-field"
                required
              >
                <option value="">Selecionar unidade...</option>
                {UNIDADES.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>

            {/* Data e Horário */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.data}
                  onChange={e => setForm(f => ({ ...f, data: e.target.value }))}
                  className="input-field"
                  required
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horário <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={form.horario}
                  onChange={e => setForm(f => ({ ...f, horario: e.target.value }))}
                  className="input-field"
                  required
                />
              </div>
            </div>

            {/* Exames */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exames <span className="text-red-500">*</span>
              </label>

              {/* Exames selecionados */}
              {form.examesSelecionados.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.examesSelecionados.map(exame => (
                    <span key={exame.id} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">
                      {exame.nome}
                      <button type="button" onClick={() => removerExame(exame.id)} className="hover:text-red-600 ml-1">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Busca de exames */}
              <div className="relative">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={buscaExame}
                    onChange={e => { setBuscaExame(e.target.value); setExameAberto(true) }}
                    onFocus={() => setExameAberto(true)}
                    className="input-field pl-9"
                    placeholder="Buscar exame..."
                  />
                </div>
                {exameAberto && buscaExame && examesFiltrados.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {examesFiltrados.slice(0, 20).map(exame => (
                      <button
                        key={exame.id}
                        type="button"
                        onClick={() => selecionarExame(exame)}
                        className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm flex items-center justify-between"
                      >
                        <span>{exame.nome}</span>
                        <span className="text-xs text-gray-400 ml-2">{exame.categoria}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Médico Solicitante */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Médico Solicitante</label>
              <input
                type="text"
                value={form.medicoSolicitante}
                onChange={e => setForm(f => ({ ...f, medicoSolicitante: e.target.value }))}
                className="input-field"
                placeholder="Nome do médico (opcional)"
              />
            </div>

            {/* Alertas */}
            {erros.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
                {erros.map((erro, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-red-700">
                    <X size={16} className="mt-0.5 flex-shrink-0" />
                    {erro}
                  </div>
                ))}
              </div>
            )}

            {avisos.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 space-y-1">
                {avisos.map((aviso, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-yellow-800">
                    <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                    {aviso}
                  </div>
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={carregando || erros.length > 0}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              {carregando ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle size={18} />
                  Confirmar Agendamento
                </>
              )}
            </button>
          </form>
        </div>

        {/* Mensagem WhatsApp */}
        <div>
          {mensagemGerada ? (
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <CheckCircle size={18} className="text-green-500" />
                  Mensagem para WhatsApp
                </h2>
                <button
                  onClick={copiarMensagem}
                  className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                    copiado ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  {copiado ? <Check size={14} /> : <Copy size={14} />}
                  {copiado ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-4 border border-gray-200 max-h-[500px] overflow-y-auto font-sans leading-relaxed">
                {mensagemGerada}
              </pre>
            </div>
          ) : (
            <div className="card flex flex-col items-center justify-center py-16 text-center text-gray-400">
              <CalendarPlus size={48} className="mb-3 opacity-30" />
              <p className="font-medium">A mensagem do WhatsApp aparecerá aqui</p>
              <p className="text-sm mt-1">após confirmar o agendamento</p>
            </div>
          )}

          {/* Dicas rápidas */}
          <div className="mt-4 bg-blue-50 border border-blue-100 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">Lembretes importantes</h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Mamografias: somente no CDI Prime</li>
              <li>• AngiTC Coronárias: 2ª, 4ª, 6ª – até 10:30h</li>
              <li>• RM Coração: 4ª e 6ª – até 10:00h</li>
              <li>• RX contrastados: CDI Treze de Maio</li>
              <li>• Sedação: agendar com enfermeira Francieli</li>
              <li>• Alergia a contraste: CDI 13 (respaldo hospitalar)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
