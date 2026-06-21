'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, X, Save, CheckCircle, XCircle } from 'lucide-react'

const UNIDADES_OPCOES = ['CDI Prime', 'CDI Treze de Maio', 'Ambas']

export default function AdminMedicosPage() {
  const supabase = createClient()
  const [medicos, setMedicos] = useState<any[]>([])
  const [exames, setExames] = useState<any[]>([])
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState<any | null>(null)
  const [form, setForm] = useState({ nome: '', especialidade: '', unidade: 'CDI Prime' })
  const [examesVinculados, setExamesVinculados] = useState<Record<string, boolean | null>>({})
  const [salvando, setSalvando] = useState(false)
  const [abaModal, setAbaModal] = useState<'info' | 'exames'>('info')

  useEffect(() => {
    carregar()
    carregarExames()
  }, [])

  async function carregar() {
    const { data } = await supabase.from('medicos').select('*, medico_exames(exame_id, realiza)').order('nome')
    if (data) setMedicos(data)
  }

  async function carregarExames() {
    const { data } = await supabase.from('exames').select('id, nome, categoria').order('categoria').order('nome')
    if (data) setExames(data)
  }

  function abrirModal(medico?: any) {
    if (medico) {
      setEditando(medico)
      setForm({ nome: medico.nome, especialidade: medico.especialidade ?? '', unidade: medico.unidade })
      const vinc: Record<string, boolean | null> = {}
      medico.medico_exames?.forEach((me: any) => { vinc[me.exame_id] = me.realiza })
      setExamesVinculados(vinc)
    } else {
      setEditando(null)
      setForm({ nome: '', especialidade: '', unidade: 'CDI Prime' })
      setExamesVinculados({})
    }
    setAbaModal('info')
    setModal(true)
  }

  function toggleExame(id: string, realiza: boolean) {
    setExamesVinculados(prev => {
      const atual = prev[id]
      if (atual === realiza) return { ...prev, [id]: null }
      return { ...prev, [id]: realiza }
    })
  }

  async function salvar() {
    if (!form.nome.trim()) return toast.error('Nome é obrigatório.')
    setSalvando(true)
    try {
      let medicoId = editando?.id
      if (editando) {
        await supabase.from('medicos').update({ nome: form.nome, especialidade: form.especialidade, unidade: form.unidade }).eq('id', editando.id)
      } else {
        const { data } = await supabase.from('medicos').insert({ nome: form.nome, especialidade: form.especialidade, unidade: form.unidade }).select().single()
        medicoId = data?.id
      }

      // Atualizar vínculos
      await supabase.from('medico_exames').delete().eq('medico_id', medicoId)
      const vinculos = Object.entries(examesVinculados)
        .filter(([, v]) => v !== null)
        .map(([exame_id, realiza]) => ({ medico_id: medicoId, exame_id, realiza }))
      if (vinculos.length > 0) await supabase.from('medico_exames').insert(vinculos)

      toast.success(editando ? 'Médico atualizado!' : 'Médico cadastrado!')
      setModal(false)
      carregar()
    } finally {
      setSalvando(false)
    }
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este médico?')) return
    await supabase.from('medico_exames').delete().eq('medico_id', id)
    await supabase.from('medicos').delete().eq('id', id)
    toast.success('Médico excluído.')
    carregar()
  }

  const examesPorCategoria = exames.reduce((acc: Record<string, any[]>, e) => {
    if (!acc[e.categoria]) acc[e.categoria] = []
    acc[e.categoria].push(e)
    return acc
  }, {})

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Médicos</h1>
          <p className="text-gray-500 text-sm">{medicos.length} médicos cadastrados</p>
        </div>
        <button onClick={() => abrirModal()} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Novo Médico
        </button>
      </div>

      <div className="space-y-4">
        {medicos.map(medico => (
          <div key={medico.id} className="card flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">{medico.nome}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                {medico.especialidade && <p className="text-sm text-gray-500">{medico.especialidade}</p>}
                <span className="badge-blue text-xs">{medico.unidade}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {medico.medico_exames?.filter((m: any) => m.realiza).length ?? 0} exames vinculados
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => abrirModal(medico)} className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50">
                <Pencil size={16} />
              </button>
              <button onClick={() => excluir(medico.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-semibold text-lg">{editando ? 'Editar Médico' : 'Novo Médico'}</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <div className="flex gap-1 p-4 pb-0">
              {(['info', 'exames'] as const).map(aba => (
                <button key={aba} onClick={() => setAbaModal(aba)} className={`px-4 py-2 rounded-t-lg text-sm font-medium border-b-2 transition-colors ${abaModal === aba ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                  {aba === 'info' ? 'Informações' : 'Exames Vinculados'}
                </button>
              ))}
            </div>

            <div className="overflow-y-auto flex-1 p-6">
              {abaModal === 'info' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                    <input type="text" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Especialidade</label>
                    <input type="text" value={form.especialidade} onChange={e => setForm(f => ({ ...f, especialidade: e.target.value }))} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unidade *</label>
                    <select value={form.unidade} onChange={e => setForm(f => ({ ...f, unidade: e.target.value }))} className="input-field">
                      {UNIDADES_OPCOES.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 mb-3">Clique em ✓ para "Realiza" ou ✗ para "Não Realiza"</p>
                  {Object.entries(examesPorCategoria).map(([cat, exList]) => (
                    <div key={cat}>
                      <h4 className="font-semibold text-gray-700 mb-2 text-sm">{cat}</h4>
                      <div className="space-y-1">
                        {exList.map(exame => {
                          const val = examesVinculados[exame.id]
                          return (
                            <div key={exame.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-50">
                              <span className="text-sm text-gray-700">{exame.nome}</span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => toggleExame(exame.id, true)}
                                  className={`p-1.5 rounded-lg transition-colors ${val === true ? 'bg-green-100 text-green-600' : 'text-gray-300 hover:text-green-500'}`}
                                >
                                  <CheckCircle size={18} />
                                </button>
                                <button
                                  onClick={() => toggleExame(exame.id, false)}
                                  className={`p-1.5 rounded-lg transition-colors ${val === false ? 'bg-red-100 text-red-500' : 'text-gray-300 hover:text-red-400'}`}
                                >
                                  <XCircle size={18} />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 p-6 border-t">
              <button onClick={() => setModal(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={salvar} disabled={salvando} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {salvando ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
