'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { MessageCircle, Send, User } from 'lucide-react'
import type { Profile, MensagemInterna } from '@/types'

export default function MensagensPage() {
  const supabase = createClient()
  const [usuarios, setUsuarios] = useState<Profile[]>([])
  const [meuId, setMeuId] = useState('')
  const [contatoSelecionado, setContatoSelecionado] = useState<Profile | null>(null)
  const [mensagens, setMensagens] = useState<MensagemInterna[]>([])
  const [naoLidas, setNaoLidas] = useState<Record<string, number>>({})
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const fimRef = useRef<HTMLDivElement>(null)

  const carregarUsuarios = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setMeuId(user.id)

    const { data: profs } = await supabase.from('profiles').select('*').neq('id', user.id).eq('ativo', true).order('nome')
    setUsuarios(profs ?? [])

    const { data: naoLidasData } = await supabase
      .from('mensagens_internas')
      .select('remetente_id')
      .eq('destinatario_id', user.id)
      .eq('lida', false)

    const contagem: Record<string, number> = {}
    naoLidasData?.forEach(m => { contagem[m.remetente_id] = (contagem[m.remetente_id] ?? 0) + 1 })
    setNaoLidas(contagem)
  }, [])

  useEffect(() => { carregarUsuarios() }, [carregarUsuarios])

  const carregarConversa = useCallback(async (contatoId: string) => {
    if (!meuId) return
    const { data } = await supabase
      .from('mensagens_internas')
      .select('*')
      .or(`and(remetente_id.eq.${meuId},destinatario_id.eq.${contatoId}),and(remetente_id.eq.${contatoId},destinatario_id.eq.${meuId})`)
      .order('created_at', { ascending: true })
    setMensagens(data ?? [])

    await supabase.from('mensagens_internas')
      .update({ lida: true })
      .eq('destinatario_id', meuId)
      .eq('remetente_id', contatoId)
      .eq('lida', false)

    setNaoLidas(prev => ({ ...prev, [contatoId]: 0 }))
  }, [meuId])

  useEffect(() => {
    if (contatoSelecionado) carregarConversa(contatoSelecionado.id)
  }, [contatoSelecionado, carregarConversa])

  // Realtime: novas mensagens
  useEffect(() => {
    if (!meuId) return
    const channel = supabase
      .channel('mensagens_internas_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens_internas' }, (payload) => {
        const nova = payload.new as MensagemInterna
        if (nova.destinatario_id === meuId || nova.remetente_id === meuId) {
          if (contatoSelecionado && (nova.remetente_id === contatoSelecionado.id || nova.destinatario_id === contatoSelecionado.id)) {
            setMensagens(prev => [...prev, nova])
            if (nova.destinatario_id === meuId) {
              supabase.from('mensagens_internas').update({ lida: true }).eq('id', nova.id)
            }
          } else if (nova.destinatario_id === meuId) {
            setNaoLidas(prev => ({ ...prev, [nova.remetente_id]: (prev[nova.remetente_id] ?? 0) + 1 }))
          }
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [meuId, contatoSelecionado])

  useEffect(() => { fimRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [mensagens])

  async function enviar() {
    if (!texto.trim() || !contatoSelecionado || !meuId) return
    setEnviando(true)
    try {
      const { error } = await supabase.from('mensagens_internas').insert({
        remetente_id: meuId,
        destinatario_id: contatoSelecionado.id,
        conteudo: texto.trim(),
      })
      if (error) throw error
      setTexto('')
    } catch (err) {
      toast.error('Erro ao enviar mensagem.'); console.error(err)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-indigo-100 rounded-xl ring-1 ring-indigo-200/60"><MessageCircle className="text-indigo-700" size={24} /></div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Mensagens Internas</h1>
          <p className="text-gray-500 text-sm">Converse com outros atendentes do sistema</p>
        </div>
      </div>

      <div className="grid md:grid-cols-[280px_1fr] gap-6 card p-0 overflow-hidden" style={{ height: '70vh' }}>
        {/* Lista de contatos */}
        <div className="border-r border-gray-100 overflow-y-auto">
          {usuarios.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-400">Nenhum outro usuário cadastrado.</div>
          ) : usuarios.map(u => (
            <button
              key={u.id}
              onClick={() => setContatoSelecionado(u)}
              className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-indigo-50 transition-colors flex items-center gap-3 ${contatoSelecionado?.id === u.id ? 'bg-indigo-50' : ''}`}
            >
              <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm shrink-0">
                {u.nome?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-800 text-sm truncate">{u.nome}</div>
                <div className="text-xs text-gray-400 truncate">{u.role === 'admin' ? 'Administrador' : 'Atendente'}</div>
              </div>
              {naoLidas[u.id] > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                  {naoLidas[u.id]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Conversa */}
        <div className="flex flex-col">
          {!contatoSelecionado ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
              <User size={48} />
              <p className="mt-2 text-sm text-gray-400">Selecione um usuário para conversar</p>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-gray-100 font-medium text-gray-800 flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs">
                  {contatoSelecionado.nome?.[0]?.toUpperCase()}
                </div>
                {contatoSelecionado.nome}
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {mensagens.map(m => (
                  <div key={m.id} className={`flex ${m.remetente_id === meuId ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${m.remetente_id === meuId ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                      {m.conteudo}
                      <div className={`text-[10px] mt-1 ${m.remetente_id === meuId ? 'text-blue-100' : 'text-gray-400'}`}>
                        {new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={fimRef} />
              </div>
              <div className="p-3 border-t border-gray-100 flex gap-2">
                <input
                  value={texto}
                  onChange={e => setTexto(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() } }}
                  placeholder="Digite uma mensagem..."
                  className="input-field flex-1"
                />
                <button onClick={enviar} disabled={enviando || !texto.trim()} className="btn-primary px-4 disabled:opacity-40">
                  <Send size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
