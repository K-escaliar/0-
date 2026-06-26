'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { CalendarPlus, Search, X, AlertTriangle, CheckCircle, Copy, Check, Info, Pencil, Save, Building2, MessageSquare, Printer, Send } from 'lucide-react'
import {
  gerarMensagemAgendamento, gerarMensagemPreparo, antecedenciaMax, semAcento,
  ENDERECOS, formatDate, type BlocoAgendamento,
} from '@/lib/utils'
import { imprimirFicha, type FichaDados } from '@/lib/ficha'
import AvisosBanner from '@/components/AvisosBanner'
import type { Exame, Convenio } from '@/types'

const CONVENIOS_PADRAO = ['Particular', 'Unimed', 'Bradesco Saúde', 'BRF', 'Sul América', 'CASSI', 'Infinity', 'Postal', 'MedService', 'Economy Brasil', 'Consórcio', 'Pax Vida', 'CDL', 'Outro']
const UNIDADES = ['CDI Prime', 'CDI Treze de Maio'] as const
type UnidadeT = typeof UNIDADES[number]
const outraUnidadeDe = (u: string): UnidadeT => (u === 'CDI Prime' ? 'CDI Treze de Maio' : 'CDI Prime')

export default function AgendamentoPage() {
  const supabase = createClient()
  const [exames, setExames] = useState<Exame[]>([])
  const [convenios, setConvenios] = useState<Convenio[]>([])
  const [carregando, setCarregando] = useState(false)
  const [msgAgendamento, setMsgAgendamento] = useState('')
  const [msgPreparo, setMsgPreparo] = useState('')
  const [comprovante, setComprovante] = useState<FichaDados | null>(null)
  const [copiado, setCopiado] = useState<'' | 'ag' | 'prep'>('')
  const [erros, setErros] = useState<string[]>([])
  const [avisos, setAvisos] = useState<string[]>([])

  // instruções gerais (config editável pelo admin)
  const [isAdmin, setIsAdmin] = useState(false)
  const [instrucoes, setInstrucoes] = useState('')
  const [editInstr, setEditInstr] = useState(false)
  const [novaInstr, setNovaInstr] = useState('')

  // busca de exames por bloco
  const [busca1, setBusca1] = useState('')
  const [busca2, setBusca2] = useState('')
  const [aberto1, setAberto1] = useState(false)
  const [aberto2, setAberto2] = useState(false)

  const [form, setForm] = useState({
    pacienteNome: '',
    telefone: '',
    convenio: '',
    medicoSolicitante: '',
    // bloco 1
    unidade: '' as UnidadeT | '',
    data: '',
    horario: '',
    examesSelecionados: [] as Exame[],
    // bloco 2 (outra unidade)
    outraUnidade: false,
    unidade2: '' as UnidadeT | '',
    data2: '',
    horario2: '',
    examesSelecionados2: [] as Exame[],
  })

  useEffect(() => {
    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        setIsAdmin(profile?.role === 'admin')
      }
      const [{ data: examesData }, { data: conveniosData }, { data: cfg }] = await Promise.all([
        supabase.from('exames').select('*').order('nome'),
        supabase.from('convenios').select('*').order('nome'),
        supabase.from('configuracoes').select('valor').eq('chave', 'instrucoes_agendamento').single(),
      ])
      if (examesData) setExames(examesData)
      if (conveniosData) setConvenios(conveniosData)
      if (cfg?.valor) { setInstrucoes(cfg.valor); setNovaInstr(cfg.valor) }
    }
    carregar()
  }, [])

  function filtrar(busca: string, jaSelecionados: Exame[]) {
    const todosSelecionados = [...form.examesSelecionados, ...form.examesSelecionados2]
    const q = semAcento(busca)
    return exames.filter(e =>
      semAcento(e.nome).includes(q) &&
      !todosSelecionados.find(s => s.id === e.id)
    )
  }

  function addExame(exame: Exame, bloco: 1 | 2) {
    if (bloco === 1) {
      setForm(f => ({ ...f, examesSelecionados: [...f.examesSelecionados, exame] }))
      setBusca1(''); setAberto1(false)
    } else {
      setForm(f => ({ ...f, examesSelecionados2: [...f.examesSelecionados2, exame] }))
      setBusca2(''); setAberto2(false)
    }
  }
  function removerExame(id: string, bloco: 1 | 2) {
    if (bloco === 1) setForm(f => ({ ...f, examesSelecionados: f.examesSelecionados.filter(e => e.id !== id) }))
    else setForm(f => ({ ...f, examesSelecionados2: f.examesSelecionados2.filter(e => e.id !== id) }))
  }

  function toggleOutraUnidade(on: boolean) {
    setForm(f => ({
      ...f,
      outraUnidade: on,
      unidade2: on && f.unidade ? outraUnidadeDe(f.unidade) : '',
      data2: on ? f.data2 : '',
      horario2: on ? f.horario2 : '',
      examesSelecionados2: on ? f.examesSelecionados2 : [],
    }))
  }

  const validar = useCallback(async () => {
    const novosErros: string[] = []
    const novosAvisos: string[] = []
    if (!form.unidade) return { erros: novosErros, avisos: novosAvisos }

    const blocos: { unidade: UnidadeT; exames: Exame[] }[] = [
      { unidade: form.unidade as UnidadeT, exames: form.examesSelecionados },
    ]
    if (form.outraUnidade && form.unidade2) {
      blocos.push({ unidade: form.unidade2 as UnidadeT, exames: form.examesSelecionados2 })
    }

    // exame x unidade
    for (const b of blocos) {
      for (const exame of b.exames) {
        if (!exame.unidades?.includes(b.unidade)) {
          novosErros.push(`"${exame.nome}" não é realizado na ${b.unidade}.`)
        }
      }
    }

    const todos = [...form.examesSelecionados, ...form.examesSelecionados2]

    // avisos por exame (definidos pelo admin)
    for (const e of todos) {
      if (e.avisos?.trim()) novosAvisos.push(`${e.nome}: ${e.avisos.trim()}`)
    }

    // conflitos entre exames
    if (todos.length > 1) {
      const { data: conflitos } = await supabase
        .from('exame_conflitos')
        .select('*, exame1:exames!exame_conflitos_exame_id1_fkey(nome), exame2:exames!exame_conflitos_exame_id2_fkey(nome)')
      if (conflitos) {
        const ids = todos.map(e => e.id)
        for (const c of conflitos) {
          if (ids.includes(c.exame_id1) && ids.includes(c.exame_id2)) novosAvisos.push(c.aviso)
        }
      }
    }

    // convênio x exame (negado)
    if (form.convenio) {
      const convenioObj = convenios.find(c => c.nome === form.convenio)
      if (convenioObj) {
        const { data: convenioExames } = await supabase
          .from('convenio_exames').select('exame_id').eq('convenio_id', convenioObj.id).eq('status', 'negado')
        if (convenioExames) {
          const negadosIds = convenioExames.map((ce: any) => ce.exame_id)
          for (const e of todos) {
            if (negadosIds.includes(e.id)) novosAvisos.push(`"${e.nome}" não é coberto pelo convênio ${form.convenio}.`)
          }
        }
      }
    }

    // sedação: apenas LEMBRETE (não bloqueia mais)
    const sed = todos.filter(e => e.requer_sedacao)
    if (sed.length >= 1) {
      novosAvisos.push('Exame com sedação: transferir para a enfermeira Francieli. Lembre o paciente que só é permitido 1 exame com sedação a cada 30 dias.')
    }

    return { erros: novosErros, avisos: novosAvisos }
  }, [form, convenios])

  useEffect(() => {
    if (form.unidade && (form.examesSelecionados.length > 0 || form.examesSelecionados2.length > 0)) {
      validar().then(({ erros: e, avisos: a }) => { setErros(e); setAvisos(a) })
    } else { setErros([]); setAvisos([]) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.unidade, form.unidade2, form.examesSelecionados, form.examesSelecionados2, form.convenio, validar])

  async function salvarInstrucoes() {
    await supabase.from('configuracoes').upsert({ chave: 'instrucoes_agendamento', valor: novaInstr, updated_at: new Date().toISOString() })
    setInstrucoes(novaInstr); setEditInstr(false)
    toast.success('Instruções atualizadas!')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const { erros: errosAtual } = await validar()
    if (errosAtual.length > 0) { toast.error('Corrija os erros antes de finalizar.'); return }
    if (!form.pacienteNome || !form.convenio || !form.unidade || !form.data || !form.horario || form.examesSelecionados.length === 0) {
      toast.error('Preencha todos os campos obrigatórios.'); return
    }
    if (form.outraUnidade && (!form.unidade2 || !form.data2 || !form.horario2 || form.examesSelecionados2.length === 0)) {
      toast.error('Complete os dados da segunda unidade ou desmarque a opção.'); return
    }

    setCarregando(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const convenioObj = convenios.find(c => c.nome === form.convenio)

      const blocosForm = [
        { unidade: form.unidade as UnidadeT, data: form.data, horario: form.horario, exames: form.examesSelecionados },
      ]
      if (form.outraUnidade && form.unidade2) {
        blocosForm.push({ unidade: form.unidade2 as UnidadeT, data: form.data2, horario: form.horario2, exames: form.examesSelecionados2 })
      }

      // inserir 1 agendamento por bloco (mesmo paciente/convênio/atendente)
      for (const b of blocosForm) {
        const { data: ag, error } = await supabase.from('agendamentos').insert({
          paciente_nome: form.pacienteNome,
          convenio_id: convenioObj?.id ?? null,
          convenio_nome: form.convenio,
          unidade: b.unidade,
          data: b.data,
          horario: b.horario,
          medico_solicitante: form.medicoSolicitante || null,
          status: 'Paciente Agendado',
          atendente_id: user!.id,
        }).select().single()
        if (error) throw error
        await supabase.from('agendamento_exames').insert(b.exames.map(ex => ({ agendamento_id: ag.id, exame_id: ex.id })))
      }

      // MENSAGEM 1 — agendamento
      const blocosMsg: BlocoAgendamento[] = blocosForm.map(b => ({
        unidade: b.unidade,
        data: formatDate(b.data),
        horario: b.horario,
        exames: b.exames.map(e => e.nome),
        enderecoUnidade: ENDERECOS[b.unidade as keyof typeof ENDERECOS] ?? b.unidade,
        chegadaMin: antecedenciaMax(b.exames.map(e => ({ nome: e.nome, categoria: e.categoria }))),
      }))
      setMsgAgendamento(gerarMensagemAgendamento({ pacienteNome: form.pacienteNome, convenio: form.convenio, blocos: blocosMsg }))

      // MENSAGEM 2 — preparo
      const todos = [...form.examesSelecionados, ...form.examesSelecionados2]
      const preparos = todos.filter(e => e.preparo).map(e => ({ nome: e.nome, preparo: e.preparo! }))
      setMsgPreparo(gerarMensagemPreparo({ pacienteNome: form.pacienteNome, preparos }))

      // FICHA / PDF
      setComprovante({
        pacienteNome: form.pacienteNome,
        convenio: form.convenio,
        medicoSolicitante: form.medicoSolicitante || null,
        blocos: blocosForm.map(b => ({
          unidade: b.unidade,
          data: formatDate(b.data),
          horario: b.horario,
          chegadaMin: antecedenciaMax(b.exames.map(e => ({ nome: e.nome, categoria: e.categoria }))),
          exames: b.exames.map(e => ({ nome: e.nome, preparo: e.preparo, categoria: e.categoria })),
        })),
      })

      toast.success('Agendamento realizado com sucesso!')
      setForm({
        pacienteNome: '', telefone: '', convenio: '', medicoSolicitante: '',
        unidade: '', data: '', horario: '', examesSelecionados: [],
        outraUnidade: false, unidade2: '', data2: '', horario2: '', examesSelecionados2: [],
      })
      setErros([]); setAvisos([])
    } catch (err) {
      toast.error('Erro ao salvar agendamento.'); console.error(err)
    } finally { setCarregando(false) }
  }

  function enviarWhatsApp() {
    if (!form.telefone.trim()) { toast.error('Informe o telefone do paciente.'); return }
    const digits = form.telefone.replace(/\D/g, '')
    const phone = digits.startsWith('55') ? digits : `55${digits}`
    const msg = `${msgAgendamento}\n\n${msgPreparo}`
    const url = `https://web.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(msg)}`
    window.open(url, 'cdi_whatsapp')
  }

  async function copiar(texto: string, qual: 'ag' | 'prep') {
    await navigator.clipboard.writeText(texto)
    setCopiado(qual)
    toast.success(qual === 'ag' ? 'Mensagem de agendamento copiada!' : 'Mensagem de preparo copiada!')
    setTimeout(() => setCopiado(''), 2000)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <AvisosBanner />
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-blue-100 rounded-xl ring-1 ring-blue-200/60"><CalendarPlus className="text-blue-700" size={24} /></div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Novo Agendamento</h1>
          <p className="text-gray-500 text-sm">Preencha os dados do paciente e gere as mensagens</p>
        </div>
      </div>

      {/* Instruções para atendentes (editável pelo admin) */}
      <div className="mb-6 bg-indigo-50 border border-indigo-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-indigo-800 flex items-center gap-2"><Info size={15} /> Instruções para atendentes</h3>
          {isAdmin && !editInstr && (
            <button onClick={() => setEditInstr(true)} className="text-indigo-600 hover:text-indigo-800 cursor-pointer p-1 -m-1 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400" title="Editar instruções" aria-label="Editar instruções"><Pencil size={14} /></button>
          )}
        </div>
        {editInstr ? (
          <div className="space-y-2">
            <textarea value={novaInstr} onChange={e => setNovaInstr(e.target.value)} className="input-field h-24 resize-none text-sm" />
            <div className="flex gap-2">
              <button onClick={salvarInstrucoes} className="btn-primary text-sm py-1.5 px-3 flex items-center gap-1"><Save size={14} /> Salvar</button>
              <button onClick={() => { setEditInstr(false); setNovaInstr(instrucoes) }} className="btn-secondary text-sm py-1.5 px-3">Cancelar</button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-indigo-700 whitespace-pre-line">{instrucoes || 'Nenhuma instrução cadastrada.'}</p>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Formulário */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Dados do paciente */}
            <div className="space-y-4">
              <h2 className="section-label">Dados do paciente</h2>
              <div>
                <label htmlFor="pacienteNome" className="block text-sm font-medium text-gray-700 mb-1">Nome do paciente <span className="text-red-500">*</span></label>
                <input id="pacienteNome" type="text" value={form.pacienteNome} onChange={e => setForm(f => ({ ...f, pacienteNome: e.target.value }))} className="input-field" placeholder="Nome completo" required autoComplete="off" />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="convenio" className="block text-sm font-medium text-gray-700 mb-1">Convênio <span className="text-red-500">*</span></label>
                  <select id="convenio" value={form.convenio} onChange={e => setForm(f => ({ ...f, convenio: e.target.value }))} className="input-field" required>
                    <option value="">Selecionar convênio...</option>
                    {CONVENIOS_PADRAO.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="medicoSolicitante" className="block text-sm font-medium text-gray-700 mb-1">Médico solicitante</label>
                  <input id="medicoSolicitante" type="text" value={form.medicoSolicitante} onChange={e => setForm(f => ({ ...f, medicoSolicitante: e.target.value }))} className="input-field" placeholder="Opcional" />
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Agendamento — BLOCO 1 */}
            <div className="space-y-4">
              <h2 className="section-label">Agendamento {form.outraUnidade && <span className="normal-case tracking-normal font-normal text-gray-400">· {form.unidade || 'unidade 1'}</span>}</h2>
              <div>
                <label htmlFor="unidade" className="block text-sm font-medium text-gray-700 mb-1">Unidade <span className="text-red-500">*</span></label>
                <select
                  id="unidade"
                  value={form.unidade}
                  onChange={e => setForm(f => ({ ...f, unidade: e.target.value as UnidadeT, unidade2: f.outraUnidade ? outraUnidadeDe(e.target.value) : '' }))}
                  className="input-field" required
                >
                  <option value="">Selecionar unidade...</option>
                  {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="data" className="block text-sm font-medium text-gray-700 mb-1">Data <span className="text-red-500">*</span></label>
                  <input id="data" type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} className="input-field" required min={new Date().toISOString().split('T')[0]} />
                </div>
                <div>
                  <label htmlFor="horario" className="block text-sm font-medium text-gray-700 mb-1">Horário <span className="text-red-500">*</span></label>
                  <input id="horario" type="time" value={form.horario} onChange={e => setForm(f => ({ ...f, horario: e.target.value }))} className="input-field" required />
                </div>
              </div>

              <div>
                <label htmlFor="exames1" className="block text-sm font-medium text-gray-700 mb-1">Exames <span className="text-red-500">*</span></label>
                <ExamePicker
                  inputId="exames1"
                  selecionados={form.examesSelecionados}
                  busca={busca1} setBusca={setBusca1}
                  aberto={aberto1} setAberto={setAberto1}
                  filtrados={filtrar(busca1, form.examesSelecionados)}
                  onAdd={e => addExame(e, 1)} onRemove={id => removerExame(id, 1)}
                />
              </div>

              {/* Opção: paciente tem exames na outra unidade */}
              <label className="flex items-center gap-2 cursor-pointer bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg px-3 py-2.5 transition-colors">
                <input type="checkbox" checked={form.outraUnidade} onChange={e => toggleOutraUnidade(e.target.checked)} className="w-4 h-4 accent-blue-600" />
                <span className="text-sm text-gray-700 flex items-center gap-1.5"><Building2 size={15} /> Paciente tem exames na outra unidade</span>
              </label>
            </div>

            {/* Agendamento — BLOCO 2 */}
            {form.outraUnidade && (
              <div className="space-y-4 border-l-4 border-blue-300 pl-4">
                <h2 className="section-label">Outra unidade <span className="normal-case tracking-normal font-normal text-gray-400">· {form.unidade2 || 'unidade 2'}</span></h2>
                <div>
                  <label htmlFor="unidade2" className="block text-sm font-medium text-gray-700 mb-1">Unidade <span className="text-red-500">*</span></label>
                  <select id="unidade2" value={form.unidade2} onChange={e => setForm(f => ({ ...f, unidade2: e.target.value as UnidadeT }))} className="input-field" required>
                    <option value="">Selecionar unidade...</option>
                    {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="data2" className="block text-sm font-medium text-gray-700 mb-1">Data <span className="text-red-500">*</span></label>
                    <input id="data2" type="date" value={form.data2} onChange={e => setForm(f => ({ ...f, data2: e.target.value }))} className="input-field" min={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div>
                    <label htmlFor="horario2" className="block text-sm font-medium text-gray-700 mb-1">Horário <span className="text-red-500">*</span></label>
                    <input id="horario2" type="time" value={form.horario2} onChange={e => setForm(f => ({ ...f, horario2: e.target.value }))} className="input-field" />
                  </div>
                </div>
                <div>
                  <label htmlFor="exames2" className="block text-sm font-medium text-gray-700 mb-1">Exames</label>
                  <ExamePicker
                    inputId="exames2"
                    selecionados={form.examesSelecionados2}
                    busca={busca2} setBusca={setBusca2}
                    aberto={aberto2} setAberto={setAberto2}
                    filtrados={filtrar(busca2, form.examesSelecionados2)}
                    onAdd={e => addExame(e, 2)} onRemove={id => removerExame(id, 2)}
                  />
                </div>
              </div>
            )}

            {erros.length > 0 && (
              <div role="alert" className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
                {erros.map((erro, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-red-700"><X size={16} className="mt-0.5 flex-shrink-0" />{erro}</div>
                ))}
              </div>
            )}
            {avisos.length > 0 && (
              <div aria-live="polite" className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 space-y-1">
                {avisos.map((aviso, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-yellow-800"><AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />{aviso}</div>
                ))}
              </div>
            )}

            <button type="submit" disabled={carregando || erros.length > 0} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
              {carregando ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><CheckCircle size={18} /> Confirmar agendamento</>}
            </button>
          </form>
        </div>

        {/* Mensagens WhatsApp */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          {msgAgendamento ? (
            <>
              <MensagemCard numero={1} titulo="Mensagem de agendamento" texto={msgAgendamento} ativo={copiado === 'ag'} onCopy={() => copiar(msgAgendamento, 'ag')} />
              <MensagemCard numero={2} titulo="Mensagem de preparo" texto={msgPreparo} ativo={copiado === 'prep'} onCopy={() => copiar(msgPreparo, 'prep')} />

              <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
                <div>
                  <label htmlFor="telefoneWpp" className="block text-sm font-medium text-gray-700 mb-1">
                    WhatsApp do paciente <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <input
                    id="telefoneWpp"
                    type="tel"
                    value={form.telefone}
                    onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
                    className="input-field"
                    placeholder="(66) 99999-9999"
                    autoComplete="off"
                  />
                </div>
                <button
                  onClick={enviarWhatsApp}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-white transition-colors"
                  style={{ backgroundColor: '#25D366' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#1ebe5d')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#25D366')}
                >
                  <Send size={18} />
                  Enviar confirmação para o paciente
                </button>
              </div>

              {comprovante && (
                <button onClick={() => imprimirFicha(comprovante)} className="btn-secondary w-full flex items-center justify-center gap-2 py-2.5">
                  <Printer size={16} /> Imprimir ficha / Salvar PDF
                </button>
              )}
              <p className="text-xs text-gray-400 text-center">O WhatsApp abrirá com a mensagem pronta. Informe o telefone do paciente para envio automático.</p>
            </>
          ) : (
            <div className="card flex flex-col items-center justify-center py-16 text-center">
              <div className="p-4 bg-gray-50 rounded-full mb-3"><MessageSquare size={36} className="text-gray-300" /></div>
              <p className="font-medium text-gray-500">As mensagens do WhatsApp aparecerão aqui</p>
              <p className="text-sm mt-1 text-gray-400">São duas: agendamento e preparo</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">Lembretes importantes</h3>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Mamografias: somente no CDI Prime</li>
              <li>• AngiTC Coronárias: 2ª, 4ª, 6ª – até 10:30h</li>
              <li>• RM Coração: 4ª e 6ª – até 10:00h</li>
              <li>• Sedação: agendar com enfermeira Francieli</li>
              <li>• Antecedência: Ressonância 30min · Ultrassom/Tomografia 15min</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

// Seletor de exames de um bloco — em escopo de módulo para não remontar (e perder foco) a cada tecla.
function ExamePicker({ inputId, selecionados, busca, setBusca, aberto, setAberto, filtrados, onAdd, onRemove }: {
  inputId?: string
  selecionados: Exame[]
  busca: string
  setBusca: (v: string) => void
  aberto: boolean
  setAberto: (v: boolean) => void
  filtrados: Exame[]
  onAdd: (e: Exame) => void
  onRemove: (id: string) => void
}) {
  return (
    <div>
      {selecionados.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {selecionados.map(exame => (
            <span key={exame.id} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-medium pl-2.5 pr-1 py-1 rounded-full">
              {exame.nome}
              <button type="button" onClick={() => onRemove(exame.id)} aria-label={`Remover ${exame.nome}`} className="ml-0.5 p-0.5 rounded-full text-blue-500 hover:text-white hover:bg-red-500 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"><X size={13} /></button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          id={inputId}
          type="text" value={busca}
          onChange={e => { setBusca(e.target.value); setAberto(true) }}
          onFocus={() => setAberto(true)}
          className="input-field pl-9" placeholder="Buscar exame..." autoComplete="off"
        />
        {aberto && busca && filtrados.length > 0 && (
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filtrados.slice(0, 20).map(exame => (
              <button key={exame.id} type="button" onClick={() => onAdd(exame)}
                className="w-full text-left px-3 py-2.5 hover:bg-blue-50 text-sm flex items-center justify-between gap-2 cursor-pointer border-b border-gray-50 last:border-0">
                <span className="text-gray-700">{exame.nome}</span>
                <span className="text-xs text-gray-400 shrink-0">{exame.categoria}</span>
              </button>
            ))}
          </div>
        )}
        {aberto && busca && filtrados.length === 0 && (
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-3 text-sm text-gray-400">
            Nenhum exame encontrado para “{busca}”.
          </div>
        )}
      </div>
    </div>
  )
}

function MensagemCard({ numero, titulo, texto, ativo, onCopy }: { numero: number; titulo: string; texto: string; ativo: boolean; onCopy: () => void }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3 gap-2">
        <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-2">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-800 text-white text-xs font-bold shrink-0">{numero}</span>
          {titulo}
        </h2>
        <button onClick={onCopy} aria-label={ativo ? 'Mensagem copiada' : `Copiar ${titulo}`} className={`flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${ativo ? 'bg-green-100 text-green-700 focus-visible:ring-green-400' : 'bg-blue-100 text-blue-700 hover:bg-blue-200 focus-visible:ring-blue-400'}`}>
          {ativo ? <Check size={14} /> : <Copy size={14} />}{ativo ? 'Copiado!' : 'Copiar'}
        </button>
      </div>
      <pre className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-4 border border-gray-200 max-h-[350px] overflow-y-auto font-sans leading-relaxed">{texto}</pre>
    </div>
  )
}
