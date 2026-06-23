'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { Network, Search, Phone, Plus, Pencil, Trash2, X, Save } from 'lucide-react'

const vazio = { clinica_nome: '', exames_oferecidos: '', telefone: '', observacoes: '' }

export default function RedeExternaPage() {
  const supabase = createClient()
  const [clinicas, setClinicas] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [modal, setModal] = useState(false)
  const [editando, setEditando] = useState<any>(null)
  const [form, setForm] = useState(vazio)
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        setIsAdmin(profile?.role === 'admin')
      }
      await recarregar()
      setCarregando(false)
    }
    carregar()
  }, [])

  async function recarregar() {
    const { data } = await supabase.from('rede_externa').select('*').order('clinica_nome')
    if (data) setClinicas(data)
  }

  function abrirModal(clinica?: any) {
    if (clinica) {
      setEditando(clinica)
      setForm({
        clinica_nome: clinica.clinica_nome ?? '',
        exames_oferecidos: clinica.exames_oferecidos ?? '',
        telefone: clinica.telefone ?? '',
        observacoes: clinica.observacoes ?? '',
      })
    } else { setEditando(null); setForm(vazio) }
    setModal(true)
  }

  async function salvar() {
    if (!form.clinica_nome.trim()) return toast.error('Nome da clínica é obrigatório.')
    if (!form.exames_oferecidos.trim()) return toast.error('Informe os exames oferecidos.')
    setSalvando(true)
    try {
      const dados = {
        clinica_nome: form.clinica_nome.trim(),
        exames_oferecidos: form.exames_oferecidos.trim(),
        telefone: form.telefone || null,
        observacoes: form.observacoes || null,
      }
      if (editando) {
        await supabase.from('rede_externa').update(dados).eq('id', editando.id)
        toast.success('Clínica atualizada!')
      } else {
        await supabase.from('rede_externa').insert(dados)
        toast.success('Clínica cadastrada!')
      }
      setModal(false)
      await recarregar()
    } finally { setSalvando(false) }
  }

  async function excluir(id: string) {
    if (!confirm('Excluir esta clínica da rede externa?')) return
    await supabase.from('rede_externa').delete().eq('id', id)
    toast.success('Clínica excluída.')
    await recarregar()
  }

  const clinicasFiltradas = clinicas.filter(c =>
    c.clinica_nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.exames_oferecidos.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg"><Network className="text-blue-700" size={24} /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Rede Externa</h1>
            <p className="text-gray-500 text-sm">Clínicas parceiras para exames que não realizamos</p>
          </div>
        </div>
        {isAdmin && (
          <button onClick={() => abrirModal()} className="btn-primary flex items-center gap-2"><Plus size={18} /> Nova Clínica</button>
        )}
      </div>

      <div className="card mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar por clínica ou exame..." className="input-field pl-9" />
        </div>
        {busca && <p className="text-xs text-gray-500 mt-2">{clinicasFiltradas.length} resultado{clinicasFiltradas.length !== 1 ? 's' : ''} para "{busca}"</p>}
      </div>

      {carregando ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : clinicasFiltradas.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <Network size={40} className="mx-auto mb-3 opacity-30" />
          <p>Nenhuma clínica encontrada</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {clinicasFiltradas.map(clinica => (
            <div key={clinica.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-900 text-lg mb-2">{clinica.clinica_nome}</h3>
                {isAdmin && (
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => abrirModal(clinica)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50"><Pencil size={14} /></button>
                    <button onClick={() => excluir(clinica.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"><Trash2 size={14} /></button>
                  </div>
                )}
              </div>
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-500 mb-1">EXAMES OFERECIDOS</p>
                <p className="text-sm text-gray-700 whitespace-pre-line">{clinica.exames_oferecidos}</p>
              </div>
              {clinica.telefone && (
                <div className="flex items-center gap-2 text-sm text-blue-700">
                  <Phone size={14} />
                  <a href={`tel:${clinica.telefone}`} className="hover:underline">{clinica.telefone}</a>
                </div>
              )}
              {clinica.observacoes && (
                <div className="mt-3 bg-gray-50 rounded-lg p-3 text-xs text-gray-600 border border-gray-100">{clinica.observacoes}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Contatos fixos importantes */}
      <div className="mt-6 card border-blue-200 bg-blue-50">
        <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2"><Phone size={16} /> Contatos Importantes</h3>
        <div className="grid sm:grid-cols-2 gap-2 text-sm">
          {[
            { nome: 'Espirometria', tel: '(66) 99985-8196' },
            { nome: 'Vida Cardio', tel: '(66) 99716-7505' },
            { nome: 'Endoscopia', tel: '(66) 99959-1503' },
            { nome: 'Instituto de Cardiologia', tel: '(66) 99957-9369' },
            { nome: 'Intercor', tel: '(66) 99999-2749' },
            { nome: 'CDI 13 de Maio', tel: '(66) 99699-8633' },
            { nome: 'Hospital 13 de Maio', tel: '(66) 3212-4700' },
            { nome: 'Clínica JC Work (EEG)', tel: '(66) 99910-1704' },
            { nome: 'Clínica Bonviv Sono (Polissonografia)', tel: '(66) 99931-5633' },
            { nome: 'Clínica Dr. Nerval (ENMG)', tel: '(66) 3544-4088' },
            { nome: 'Clínica COG (Dr. Rodrigo Cruz)', tel: '(66) 99641-0263' },
          ].map(c => (
            <div key={c.nome} className="flex items-center justify-between bg-white rounded-lg px-3 py-2">
              <span className="text-gray-700">{c.nome}</span>
              <a href={`tel:${c.tel}`} className="text-blue-600 font-medium hover:underline">{c.tel}</a>
            </div>
          ))}
        </div>
      </div>

      {/* Modal admin */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="font-semibold text-lg">{editando ? 'Editar Clínica' : 'Nova Clínica'}</h2>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da clínica *</label>
                <input type="text" value={form.clinica_nome} onChange={e => setForm(f => ({ ...f, clinica_nome: e.target.value }))} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exames oferecidos *</label>
                <textarea value={form.exames_oferecidos} onChange={e => setForm(f => ({ ...f, exames_oferecidos: e.target.value }))} className="input-field h-20 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                <input type="text" value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} className="input-field" placeholder="(66) 99999-9999" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} className="input-field h-16 resize-none" />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t">
              <button onClick={() => setModal(false)} className="btn-secondary flex-1">Cancelar</button>
              <button onClick={salvar} disabled={salvando} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {salvando ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />} Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
