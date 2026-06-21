'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, X, Save } from 'lucide-react'

const convenioVazio = {
  nome: '', tipo: 'convenio' as const, precisa_guia: false,
  precisa_autorizacao: false, alertas: '', observacoes: '',
}

export default function AdminConveniosPage() {
  const supabase = createClient()
  const [convenios, setConvenios] = useState<any[]>([])
  const [exames, setExames] = useState<any[]>([])
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState<any | null>(null)
  const [form, setForm] = useState(convenioVazio)
  const [statusExames, setStatusExames] = useState<Record<string, string>>({})
  const [obsExames, setObsExames] = useState<Record<string, string>>({})
  const [salvando, setSalvando] = useState(false)
  const [aba, setAba] = useState<'info' | 'exames'>('info')

  useEffect(() => {
    carregar()
    carregarExames()
  }, [])

  async function carregar() {
    const { data } = await supabase.from('convenios').select('*').order('nome')
    if (data) setConvenios(data)
  }

  async function carregarExames() {
    const { data } = await supabase.from('exames').select('id, nome, categoria').order('categoria').order('nome')
    if (data) setExames(data)
  }

  async function abrirModal(convenio?: any) {
    if (convenio) {
      setEditando(convenio)
      setForm({
        nome: convenio.nome, tipo: convenio.tipo,
        precisa_guia: convenio.precisa_guia, precisa_autorizacao: convenio.precisa_autorizacao,
        alertas: convenio.alertas ?? '', observacoes: convenio.observacoes ?? '',
      })
      const { data: ceData } = await supabase.from('convenio_exames').select('*').eq('convenio_id', convenio.id)
      const status: Record<string, string> = {}
      const obs: Record<string, string> = {}
      ceData?.forEach((ce: any) => {
        status[ce.exame_id] = ce.status
        obs[ce.exame_id] = ce.observacao ?? ''
      })
      setStatusExames(status)
      setObsExames(obs)
    } else {
      setEditando(null)
      setForm(convenioVazio)
      setStatusExames({})
      setObsExames({})
    }
    setAba('info')
    setModal(true)
  }

  async function salvar() {
    if (!form.nome.trim()) return toast.error('Nome é obrigatório.')
    setSalvando(true)
    try {
      let convId = editando?.id
      const dados = { nome: form.nome, tipo: form.tipo, precisa_guia: form.precisa_guia, precisa_autorizacao: form.precisa_autorizacao, alertas: form.alertas || null, observacoes: form.observacoes || null }
      if (editando) {
        await supabase.from('convenios').update(dados).eq('id', editando.id)
      } else {
        const { data } = await supabase.from('convenios').insert(dados).select().single()
        convId = data?.id
      }
      await supabase.from('convenio_exames').delete().eq('convenio_id', convId)
      const vinculos = Object.entries(statusExames)
        .filter(([, v]) => v)
        .map(([exame_id, status]) => ({ convenio_id: convId, exame_id, status, observacao: obsExames[exame_id] || null }))
      if (vinculos.length > 0) await supabase.from('convenio_exames').insert(vinculos)
      toast.success(editando ? 'Convênio atualizado!' : 'Convênio cadastrado!')
      setModal(false)
      carregar()
    } finally {
      setSalvando(false)
    }
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este convênio?')) return
    await supabase.from('convenio_exames').delete().eq('convenio_id', id)
    await supabase.from('convenios').delete().eq('id', id)
    toast.success('Convênio excluído.')
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
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Convênios</h1>
          <p className="text-gray-500 text-sm">{convenios.length} convênios cadastrados</p>
        </div>
        <button onClick={() => abrirModal()} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Novo Convênio
        </button>
      </div>

      <div className="space-y-3">
        {convenios.map(c => (
          <div key={c.id} className="card flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">{c.nome}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="badge-blue text-xs">{c.tipo}</span>
                {c.precisa_guia && <span className="badge-yellow text-xs">Exige guia</span>}
                {c.precisa_autorizacao && <span className="badge-yellow text-xs">Autorização prévia</span>}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => abrirModal(c)} className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"><Pencil size={16} /></button>
              <button onClick={() => excluir(c.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-semibold text-lg">{editando ? 'Editar Convênio' : 'Novo Convênio'}</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>

            <div className="flex gap-1 px-6 pt-4">
              {(['info', 'exames'] as const).map(a => (
                <button key={a} onClick={() => setAba(a)} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${aba === a ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                  {a === 'info' ? 'Informações' : 'Exames & Status'}
                </button>
              ))}
            </div>

            <div className="overflow-y-auto flex-1 p-6">
              {aba === 'info' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                    <input type="text" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} className="input-field" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                    <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as any }))} className="input-field">
                      <option value="convenio">Convênio</option>
                      <option value="desconto">Desconto</option>
                      <option value="particular">Particular</option>
                    </select>
                  </div>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.precisa_guia} onChange={e => setForm(f => ({ ...f, precisa_guia: e.target.checked }))} className="w-4 h-4 accent-blue-600" />
                      <span className="text-sm text-gray-700">Exige guia médica</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.precisa_autorizacao} onChange={e => setForm(f => ({ ...f, precisa_autorizacao: e.target.checked }))} className="w-4 h-4 accent-blue-600" />
                      <span className="text-sm text-gray-700">Autorização prévia</span>
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alertas</label>
                    <textarea value={form.alertas} onChange={e => setForm(f => ({ ...f, alertas: e.target.value }))} className="input-field h-20 resize-none" placeholder="Ex: Biometria obrigatória, token Bradesco..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                    <textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} className="input-field h-20 resize-none" />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">Defina o status de cada exame para este convênio</p>
                  {Object.entries(examesPorCategoria).map(([cat, exList]) => (
                    <div key={cat}>
                      <h4 className="font-semibold text-gray-700 text-sm mb-2">{cat}</h4>
                      <div className="space-y-2">
                        {exList.map(exame => (
                          <div key={exame.id} className="bg-gray-50 rounded-lg p-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-700">{exame.nome}</span>
                              <div className="flex gap-1">
                                {['autorizado', 'negado', 'restrito'].map(s => (
                                  <button
                                    key={s}
                                    onClick={() => setStatusExames(prev => ({ ...prev, [exame.id]: prev[exame.id] === s ? '' : s }))}
                                    className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                                      statusExames[exame.id] === s
                                        ? s === 'autorizado' ? 'bg-green-500 text-white' : s === 'negado' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'
                                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                    }`}
                                  >
                                    {s === 'autorizado' ? 'Aut.' : s === 'negado' ? 'Neg.' : 'Rest.'}
                                  </button>
                                ))}
                              </div>
                            </div>
                            {statusExames[exame.id] && (
                              <input
                                type="text"
                                value={obsExames[exame.id] ?? ''}
                                onChange={e => setObsExames(prev => ({ ...prev, [exame.id]: e.target.value }))}
                                className="input-field mt-1 text-xs py-1"
                                placeholder="Observação (opcional)..."
                              />
                            )}
                          </div>
                        ))}
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
