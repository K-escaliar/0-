'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { StickyNote, Plus, Trash2, Save, X, Search, Calendar, AlertCircle } from 'lucide-react'
import type { NotaPessoal } from '@/types'

function fmtData(d: string) {
  const [ano, mes, dia] = d.split('-')
  return `${dia}/${mes}/${ano}`
}

function statusLembrete(d?: string | null): 'hoje' | 'atrasado' | 'futuro' | null {
  if (!d) return null
  const hoje = new Date().toISOString().split('T')[0]
  if (d === hoje) return 'hoje'
  if (d < hoje) return 'atrasado'
  return 'futuro'
}

export default function AnotacoesPage() {
  const supabase = createClient()
  const [notas, setNotas] = useState<NotaPessoal[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')

  const [selecionada, setSelecionada] = useState<NotaPessoal | null>(null)
  const [titulo, setTitulo] = useState('')
  const [conteudo, setConteudo] = useState('')
  const [dataLembrete, setDataLembrete] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [sujo, setSujo] = useState(false)

  const carregar = useCallback(async () => {
    setCarregando(true)
    const { data } = await supabase.from('notas_pessoais').select('*').order('data_lembrete', { ascending: true, nullsFirst: false }).order('updated_at', { ascending: false })
    setNotas(data ?? [])
    setCarregando(false)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  function novaNota() {
    setSelecionada(null)
    setTitulo('')
    setConteudo('')
    setDataLembrete('')
    setSujo(false)
  }

  function abrirNota(nota: NotaPessoal) {
    setSelecionada(nota)
    setTitulo(nota.titulo)
    setConteudo(nota.conteudo)
    setDataLembrete(nota.data_lembrete ?? '')
    setSujo(false)
  }

  async function salvar() {
    if (!titulo.trim()) { toast.error('Dê um título para a nota.'); return }
    setSalvando(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const payload = { titulo, conteudo, data_lembrete: dataLembrete || null }

      if (selecionada) {
        const { error } = await supabase
          .from('notas_pessoais')
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq('id', selecionada.id)
        if (error) throw error
        toast.success('Nota atualizada!')
      } else {
        const { data, error } = await supabase
          .from('notas_pessoais')
          .insert({ user_id: user.id, ...payload })
          .select().single()
        if (error) throw error
        setSelecionada(data)
        toast.success('Nota criada!')
      }
      setSujo(false)
      carregar()
    } catch (err) {
      toast.error('Erro ao salvar nota.'); console.error(err)
    } finally {
      setSalvando(false)
    }
  }

  async function excluir(id: string) {
    if (!confirm('Excluir esta nota? Essa ação não pode ser desfeita.')) return
    const { error } = await supabase.from('notas_pessoais').delete().eq('id', id)
    if (error) { toast.error('Erro ao excluir.'); return }
    toast.success('Nota excluída.')
    if (selecionada?.id === id) novaNota()
    carregar()
  }

  const notasFiltradas = notas.filter(n =>
    n.titulo.toLowerCase().includes(busca.toLowerCase()) ||
    n.conteudo.toLowerCase().includes(busca.toLowerCase())
  )

  const statusAtual = statusLembrete(dataLembrete)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-amber-100 rounded-xl ring-1 ring-amber-200/60"><StickyNote className="text-amber-700" size={24} /></div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Minhas Anotações</h1>
          <p className="text-gray-500 text-sm">Notas privadas e avisos com data — só você pode ver</p>
        </div>
      </div>

      <div className="grid md:grid-cols-[300px_1fr] gap-6">
        {/* Lista */}
        <div className="card p-0 overflow-hidden flex flex-col" style={{ maxHeight: '70vh' }}>
          <div className="p-3 border-b border-gray-100 space-y-2">
            <button onClick={novaNota} className="btn-primary w-full flex items-center justify-center gap-2 py-2 text-sm">
              <Plus size={15} /> Nova nota
            </button>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar..." className="input-field pl-8 text-sm py-1.5" />
            </div>
          </div>
          <div className="overflow-y-auto flex-1">
            {carregando ? (
              <div className="p-4 text-center text-sm text-gray-400">Carregando...</div>
            ) : notasFiltradas.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-400">Nenhuma nota encontrada.</div>
            ) : notasFiltradas.map(n => {
              const status = statusLembrete(n.data_lembrete)
              return (
                <button
                  key={n.id}
                  onClick={() => abrirNota(n)}
                  className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-amber-50 transition-colors ${selecionada?.id === n.id ? 'bg-amber-50' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium text-gray-800 text-sm truncate">{n.titulo}</div>
                    {status && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 flex items-center gap-1 ${
                        status === 'atrasado' ? 'bg-red-100 text-red-700' :
                        status === 'hoje' ? 'bg-amber-100 text-amber-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {status === 'atrasado' && <AlertCircle size={10} />}
                        {fmtData(n.data_lembrete!)}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 truncate mt-0.5">{n.conteudo || 'Sem conteúdo'}</div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Editor */}
        <div className="card">
          <div className="flex items-center justify-between mb-3 gap-2">
            <input
              value={titulo}
              onChange={e => { setTitulo(e.target.value); setSujo(true) }}
              placeholder="Título da nota..."
              className="text-lg font-semibold text-gray-900 border-0 focus:outline-none focus:ring-0 w-full placeholder:text-gray-300"
            />
            <div className="flex gap-2 shrink-0">
              {selecionada && (
                <button onClick={() => excluir(selecionada.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Excluir">
                  <Trash2 size={16} />
                </button>
              )}
              {sujo && (
                <button onClick={novaNota} className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg" title="Descartar">
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100">
            <Calendar size={15} className="text-gray-400" />
            <label htmlFor="dataLembrete" className="text-sm text-gray-600">Lembrete / aviso para:</label>
            <input
              id="dataLembrete"
              type="date"
              value={dataLembrete}
              onChange={e => { setDataLembrete(e.target.value); setSujo(true) }}
              className="input-field w-auto text-sm py-1"
            />
            {dataLembrete && (
              <button onClick={() => { setDataLembrete(''); setSujo(true) }} className="text-xs text-gray-400 hover:text-red-500">
                Remover data
              </button>
            )}
            {statusAtual && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                statusAtual === 'atrasado' ? 'bg-red-100 text-red-700' :
                statusAtual === 'hoje' ? 'bg-amber-100 text-amber-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {statusAtual === 'atrasado' ? 'Atrasado' : statusAtual === 'hoje' ? 'Hoje' : 'Agendado'}
              </span>
            )}
          </div>

          <textarea
            value={conteudo}
            onChange={e => { setConteudo(e.target.value); setSujo(true) }}
            placeholder="Escreva sua anotação aqui..."
            className="w-full h-80 resize-none border-0 focus:outline-none focus:ring-0 text-sm text-gray-700 leading-relaxed"
          />
          <div className="flex justify-end pt-3 border-t border-gray-100">
            <button onClick={salvar} disabled={salvando || !sujo} className="btn-primary flex items-center gap-2 disabled:opacity-40">
              {salvando ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
              Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
