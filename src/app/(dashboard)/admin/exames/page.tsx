'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, X, Save } from 'lucide-react'
import type { Exame, CategoriaExame } from '@/types'

const CATEGORIAS: CategoriaExame[] = ['Ultrassom', 'Raio-X', 'Mamografia', 'Tomossíntese', 'Ressonância', 'Tomografia', 'Outros']
const UNIDADES = ['CDI Prime', 'CDI Treze de Maio']

const exameVazio = {
  nome: '', categoria: 'Ultrassom' as CategoriaExame,
  codigo: '', codigo_tuss: '', preparo: '', observacoes_tuss: '',
  unidades: [] as string[], requer_sedacao: false, avisos: '',
  valor_particular: '', valor_unimed_279: '', valor_unimed_completa: '',
}

export default function AdminExamesPage() {
  const supabase = createClient()
  const [exames, setExames] = useState<Exame[]>([])
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState<Exame | null>(null)
  const [form, setForm] = useState(exameVazio)
  const [salvando, setSalvando] = useState(false)
  const [busca, setBusca] = useState('')

  useEffect(() => { carregar() }, [])

  async function carregar() {
    const { data } = await supabase.from('exames').select('*').order('nome')
    if (data) setExames(data)
  }

  function abrirModal(exame?: Exame) {
    if (exame) {
      setEditando(exame)
      setForm({
        nome: exame.nome,
        categoria: exame.categoria,
        codigo: exame.codigo ?? '',
        codigo_tuss: exame.codigo_tuss ?? '',
        preparo: exame.preparo ?? '',
        observacoes_tuss: exame.observacoes_tuss ?? '',
        unidades: exame.unidades ?? [],
        requer_sedacao: exame.requer_sedacao ?? false,
        avisos: exame.avisos ?? '',
        valor_particular: exame.valor_particular != null ? String(exame.valor_particular) : '',
        valor_unimed_279: exame.valor_unimed_279 != null ? String(exame.valor_unimed_279) : '',
        valor_unimed_completa: exame.valor_unimed_completa != null ? String(exame.valor_unimed_completa) : '',
      })
    } else {
      setEditando(null)
      setForm(exameVazio)
    }
    setModal(true)
  }

  function toggleUnidade(unidade: string) {
    setForm(f => ({
      ...f,
      unidades: f.unidades.includes(unidade)
        ? f.unidades.filter(u => u !== unidade)
        : [...f.unidades, unidade],
    }))
  }

  async function salvar() {
    if (!form.nome.trim()) return toast.error('Nome é obrigatório.')
    if (form.unidades.length === 0) return toast.error('Selecione pelo menos uma unidade.')
    setSalvando(true)
    try {
      const numOrNull = (v: string) => {
        const n = parseFloat(String(v).replace(/\./g, '').replace(',', '.'))
        return v.trim() && Number.isFinite(n) ? n : null
      }
      const dados = {
        nome: form.nome.trim(),
        categoria: form.categoria,
        codigo: form.codigo || null,
        codigo_tuss: form.codigo_tuss || null,
        preparo: form.preparo || null,
        observacoes_tuss: form.observacoes_tuss || null,
        unidades: form.unidades,
        requer_sedacao: form.requer_sedacao,
        avisos: form.avisos || null,
        valor_particular: numOrNull(form.valor_particular),
        valor_unimed_279: numOrNull(form.valor_unimed_279),
        valor_unimed_completa: numOrNull(form.valor_unimed_completa),
      }
      if (editando) {
        await supabase.from('exames').update(dados).eq('id', editando.id)
        toast.success('Exame atualizado!')
      } else {
        await supabase.from('exames').insert(dados)
        toast.success('Exame cadastrado!')
      }
      setModal(false)
      carregar()
    } finally {
      setSalvando(false)
    }
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este exame?')) return
    await supabase.from('exames').delete().eq('id', id)
    toast.success('Exame excluído.')
    carregar()
  }

  const examesFiltrados = exames.filter(e =>
    e.nome.toLowerCase().includes(busca.toLowerCase()) ||
    e.codigo_tuss?.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Exames</h1>
          <p className="text-gray-500 text-sm">{exames.length} exames cadastrados</p>
        </div>
        <button onClick={() => abrirModal()} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Novo Exame
        </button>
      </div>

      <div className="card mb-4">
        <input
          type="text"
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar exame..."
          className="input-field"
        />
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">Nome</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3 hidden sm:table-cell">Categoria</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3 hidden md:table-cell">TUSS</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3 hidden lg:table-cell">Unidades</th>
              <th className="px-4 py-3 w-24"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {examesFiltrados.map(exame => (
              <tr key={exame.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900 text-sm">{exame.nome}</p>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {exame.requer_sedacao && <span className="badge-yellow text-xs">Sedação</span>}
                    {exame.avisos && <span className="text-xs bg-amber-100 text-amber-700 rounded px-1.5 py-0.5" title={exame.avisos}>⚠️ Aviso</span>}
                  </div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className="badge-blue text-xs">{exame.categoria}</span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-xs font-mono text-gray-500">{exame.codigo_tuss ?? '—'}</td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {(exame.unidades ?? []).map(u => (
                      <span key={u} className="text-xs bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">
                        {u === 'CDI Prime' ? 'Prime' : '13 de Maio'}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => abrirModal(exame)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => excluir(exame.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-semibold text-lg">{editando ? 'Editar Exame' : 'Novo Exame'}</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input type="text" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} className="input-field" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
                  <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value as CategoriaExame }))} className="input-field">
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código interno</label>
                  <input type="text" value={form.codigo} onChange={e => setForm(f => ({ ...f, codigo: e.target.value }))} className="input-field" placeholder="ex: ANTCAMSD" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código TUSS</label>
                  <input type="text" value={form.codigo_tuss} onChange={e => setForm(f => ({ ...f, codigo_tuss: e.target.value }))} className="input-field" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unidades *</label>
                <div className="flex gap-3">
                  {UNIDADES.map(u => (
                    <label key={u} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.unidades.includes(u)} onChange={() => toggleUnidade(u)} className="w-4 h-4 accent-blue-600" />
                      <span className="text-sm text-gray-700">{u}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preparo</label>
                <textarea value={form.preparo} onChange={e => setForm(f => ({ ...f, preparo: e.target.value }))} className="input-field h-28 resize-none" placeholder="Instruções de preparo para o paciente..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">⚠️ Aviso do exame (aparece no agendamento e na lista de exames)</label>
                <textarea value={form.avisos} onChange={e => setForm(f => ({ ...f, avisos: e.target.value }))} className="input-field h-20 resize-none" placeholder="Ex.: Somente às 3ª e 5ª. Trazer pedido com 2 vias." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações TUSS</label>
                <textarea value={form.observacoes_tuss} onChange={e => setForm(f => ({ ...f, observacoes_tuss: e.target.value }))} className="input-field h-20 resize-none" />
              </div>
              <div>
                <p className="block text-sm font-medium text-gray-700 mb-1">Valores (uso interno do admin — não aparecem no agendamento)</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Particular</label>
                    <input type="text" value={form.valor_particular} onChange={e => setForm(f => ({ ...f, valor_particular: e.target.value }))} className="input-field" placeholder="R$" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Unimed 279</label>
                    <input type="text" value={form.valor_unimed_279} onChange={e => setForm(f => ({ ...f, valor_unimed_279: e.target.value }))} className="input-field" placeholder="R$" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Unimed Completa</label>
                    <input type="text" value={form.valor_unimed_completa} onChange={e => setForm(f => ({ ...f, valor_unimed_completa: e.target.value }))} className="input-field" placeholder="R$" />
                  </div>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.requer_sedacao} onChange={e => setForm(f => ({ ...f, requer_sedacao: e.target.checked }))} className="w-4 h-4 accent-blue-600" />
                <span className="text-sm text-gray-700">Requer sedação</span>
              </label>
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
