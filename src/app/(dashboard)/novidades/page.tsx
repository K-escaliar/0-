'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Megaphone, Plus, Pencil, Trash2, X, Save, Clock, AlertCircle } from 'lucide-react'

function formatarData(iso: string | null) {
  if (!iso) return 'Sem expiração'
  return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function estaExpirado(iso: string | null) {
  if (!iso) return false
  return new Date(iso) < new Date()
}

export default function NovidadesPage() {
  const supabase = createClient()
  const [avisos, setAvisos] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userId, setUserId] = useState('')
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState<any | null>(null)
  const [form, setForm] = useState({ titulo: '', mensagem: '', expira_em: '' })
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        setIsAdmin(profile?.role === 'admin')
      }
      await carregar()
    }
    init()
  }, [])

  async function carregar() {
    setCarregando(true)
    const { data } = await supabase.from('avisos').select('*').order('created_at', { ascending: false })
    if (data) setAvisos(data)
    setCarregando(false)
  }

  function abrirModal(aviso?: any) {
    if (aviso) {
      setEditando(aviso)
      // converte ISO para formato do input datetime-local
      const exp = aviso.expira_em ? new Date(aviso.expira_em) : null
      const local = exp ? new Date(exp.getTime() - exp.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : ''
      setForm({ titulo: aviso.titulo, mensagem: aviso.mensagem, expira_em: local })
    } else {
      setEditando(null)
      setForm({ titulo: '', mensagem: '', expira_em: '' })
    }
    setModal(true)
  }

  async function salvar() {
    if (!form.titulo.trim() || !form.mensagem.trim()) return toast.error('Título e mensagem são obrigatórios.')
    setSalvando(true)
    try {
      const dados: any = {
        titulo: form.titulo.trim(),
        mensagem: form.mensagem.trim(),
        expira_em: form.expira_em ? new Date(form.expira_em).toISOString() : null,
      }
      if (editando) {
        await supabase.from('avisos').update(dados).eq('id', editando.id)
        toast.success('Aviso atualizado!')
      } else {
        dados.criado_por = userId
        dados.ativo = true
        await supabase.from('avisos').insert(dados)
        toast.success('Aviso publicado!')
      }
      setModal(false)
      carregar()
    } catch {
      toast.error('Erro ao salvar aviso.')
    } finally {
      setSalvando(false)
    }
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este aviso?')) return
    await supabase.from('avisos').delete().eq('id', id)
    toast.success('Aviso excluído.')
    carregar()
  }

  async function alternarAtivo(aviso: any) {
    await supabase.from('avisos').update({ ativo: !aviso.ativo }).eq('id', aviso.id)
    carregar()
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Megaphone className="text-amber-600" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Novidades & Avisos</h1>
            <p className="text-gray-500 text-sm">Comunicados internos da clínica</p>
          </div>
        </div>
        {isAdmin && (
          <button onClick={() => abrirModal()} className="btn-primary flex items-center gap-2">
            <Plus size={18} /> Novo Aviso
          </button>
        )}
      </div>

      {carregando ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : avisos.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <Megaphone size={40} className="mx-auto mb-3 opacity-30" />
          <p>Nenhum aviso no momento</p>
        </div>
      ) : (
        <div className="space-y-3">
          {avisos.map(aviso => {
            const expirado = estaExpirado(aviso.expira_em)
            const inativo = !aviso.ativo || expirado
            return (
              <div key={aviso.id} className={`card border-l-4 ${inativo ? 'border-gray-300 opacity-60' : 'border-amber-400'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{aviso.titulo}</h3>
                      {expirado && <span className="badge-red text-xs">Expirado</span>}
                      {!aviso.ativo && !expirado && <span className="bg-gray-100 text-gray-600 badge-blue text-xs">Desativado</span>}
                      {!inativo && <span className="badge-green text-xs">Ativo</span>}
                    </div>
                    <p className="text-sm text-gray-700 mt-1 whitespace-pre-line">{aviso.mensagem}</p>
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                      <Clock size={12} />
                      Expira: {formatarData(aviso.expira_em)}
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={() => alternarAtivo(aviso)} title={aviso.ativo ? 'Desativar' : 'Ativar'} className="p-2 text-gray-400 hover:text-amber-600 rounded-lg hover:bg-amber-50">
                        <AlertCircle size={16} />
                      </button>
                      <button onClick={() => abrirModal(aviso)} className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"><Pencil size={16} /></button>
                      <button onClick={() => excluir(aviso.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"><Trash2 size={16} /></button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-semibold text-lg">{editando ? 'Editar Aviso' : 'Novo Aviso'}</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input type="text" value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} className="input-field" placeholder="Ex: Aparelho de RM indisponível" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem *</label>
                <textarea value={form.mensagem} onChange={e => setForm(f => ({ ...f, mensagem: e.target.value }))} className="input-field h-28 resize-none" placeholder="Ex: O aparelho de ressonância não estará disponível no dia 25/06." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expira em (opcional)</label>
                <input type="datetime-local" value={form.expira_em} onChange={e => setForm(f => ({ ...f, expira_em: e.target.value }))} className="input-field" />
                <p className="text-xs text-gray-400 mt-1">Depois dessa data e hora, o aviso some sozinho. Deixe vazio para não expirar.</p>
              </div>
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
