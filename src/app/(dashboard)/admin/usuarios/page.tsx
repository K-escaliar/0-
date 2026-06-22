'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Plus, Pencil, Trash2, X, Save, User, ShieldCheck } from 'lucide-react'

export default function AdminUsuariosPage() {
  const supabase = createClient()
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState<any | null>(null)
  const [form, setForm] = useState({ nome: '', usuario: '', senha: '', role: 'atendente' as 'atendente' | 'admin' })
  const [salvando, setSalvando] = useState(false)

  useEffect(() => { carregar() }, [])

  async function carregar() {
    const { data } = await supabase.from('profiles').select('*').order('nome')
    if (data) setUsuarios(data)
  }

  function abrirModal(u?: any) {
    if (u) {
      setEditando(u)
      // Recupera o nome de usuário a partir do e-mail técnico (usuario@cdi.local)
      const usuarioNome = (u.email || '').split('@')[0]
      setForm({ nome: u.nome, usuario: usuarioNome, senha: '', role: u.role })
    } else {
      setEditando(null)
      setForm({ nome: '', usuario: '', senha: '', role: 'atendente' })
    }
    setModal(true)
  }

  async function salvar() {
    if (!form.nome.trim() || !form.usuario.trim()) return toast.error('Nome e usuário são obrigatórios.')
    if (!editando && !form.senha) return toast.error('Senha é obrigatória para novo usuário.')
    setSalvando(true)
    try {
      if (editando) {
        await supabase.from('profiles').update({ nome: form.nome, role: form.role }).eq('id', editando.id)
        toast.success('Usuário atualizado!')
      } else {
        // Criar usuário via admin API (requer service role - usar apenas API route)
        const res = await fetch('/api/usuarios', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome: form.nome, usuario: form.usuario, senha: form.senha, role: form.role }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error)
        toast.success('Usuário criado!')
      }
      setModal(false)
      carregar()
    } catch (err: any) {
      toast.error(err.message ?? 'Erro ao salvar usuário.')
    } finally {
      setSalvando(false)
    }
  }

  async function excluir(id: string) {
    if (!confirm('Excluir este usuário?')) return
    const res = await fetch(`/api/usuarios?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Usuário excluído.')
      carregar()
    } else {
      toast.error('Erro ao excluir.')
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Usuários</h1>
          <p className="text-gray-500 text-sm">{usuarios.length} usuários cadastrados</p>
        </div>
        <button onClick={() => abrirModal()} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Novo Usuário
        </button>
      </div>

      <div className="space-y-3">
        {usuarios.map(u => (
          <div key={u.id} className="card flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${u.role === 'admin' ? 'bg-purple-100' : 'bg-blue-100'}`}>
                {u.role === 'admin' ? <ShieldCheck size={18} className="text-purple-700" /> : <User size={18} className="text-blue-700" />}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{u.nome}</h3>
                <p className="text-sm text-gray-500">Usuário: {(u.email || '').split('@')[0]}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={u.role === 'admin' ? 'badge-blue' : 'bg-gray-100 text-gray-600 badge-blue'}>
                {u.role === 'admin' ? 'Administrador' : 'Atendente'}
              </span>
              <div className="flex gap-2">
                <button onClick={() => abrirModal(u)} className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"><Pencil size={16} /></button>
                <button onClick={() => excluir(u.id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-semibold text-lg">{editando ? 'Editar Usuário' : 'Novo Usuário'}</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input type="text" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} className="input-field" />
              </div>
              {!editando && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Usuário *</label>
                  <input type="text" value={form.usuario} onChange={e => setForm(f => ({ ...f, usuario: e.target.value }))} className="input-field" placeholder="ex: maria (sem espaços)" autoCapitalize="none" />
                  <p className="text-xs text-gray-400 mt-1">É com este nome que a pessoa fará login. Sem espaços ou acentos.</p>
                </div>
              )}
              {!editando && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Senha *</label>
                  <input type="password" value={form.senha} onChange={e => setForm(f => ({ ...f, senha: e.target.value }))} className="input-field" placeholder="Mínimo 6 caracteres" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Perfil</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as any }))} className="input-field">
                  <option value="atendente">Atendente</option>
                  <option value="admin">Administrador</option>
                </select>
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
