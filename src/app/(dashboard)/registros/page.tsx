'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BarChart3, CalendarDays, Users, Building2, TrendingUp } from 'lucide-react'
import { formatDate } from '@/lib/utils'

function ultimosMeses(qtd = 12) {
  const out: { valor: string; label: string }[] = []
  const d = new Date()
  for (let i = 0; i < qtd; i++) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1)
    const valor = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`
    out.push({ valor, label: m.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) })
  }
  return out
}

function Barras({ titulo, icon, dados, max }: { titulo: string; icon: React.ReactNode; dados: { label: string; total: number }[]; max?: number }) {
  const maxTotal = max ?? Math.max(1, ...dados.map(d => d.total))
  return (
    <div className="card">
      <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">{icon} {titulo}</h2>
      {dados.length === 0 ? (
        <p className="text-gray-400 text-sm">Nenhum registro neste mês.</p>
      ) : (
        <div className="space-y-2.5">
          {dados.map(({ label, total }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="text-xs text-gray-600 w-32 flex-shrink-0 truncate" title={label}>{label}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-3">
                <div className="h-3 rounded-full bg-blue-500 transition-all duration-500" style={{ width: `${Math.round((total / maxTotal) * 100)}%` }} />
              </div>
              <span className="text-xs font-semibold text-gray-700 w-8 text-right">{total}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function RegistrosPage() {
  const supabase = createClient()
  const meses = ultimosMeses()
  const [mes, setMes] = useState(meses[0].valor)
  const [isAdmin, setIsAdmin] = useState(false)
  const [uid, setUid] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [ags, setAgs] = useState<any[]>([])

  const carregar = useCallback(async (mesSel: string, admin: boolean, userId: string) => {
    setCarregando(true)
    try {
      const inicio = `${mesSel}-01`
      const [ano, m] = mesSel.split('-').map(Number)
      const fim = new Date(ano, m, 0).toISOString().split('T')[0]
      let q = supabase
        .from('agendamentos')
        .select(`id, paciente_nome, unidade, data, horario, convenio_nome, atendente_id,
                 atendente:profiles!agendamentos_atendente_id_fkey(nome),
                 exames:agendamento_exames(exame:exames(nome, categoria))`)
        .gte('data', inicio).lte('data', fim)
        .order('data', { ascending: false })
      if (!admin) q = q.eq('atendente_id', userId)
      const { data } = await q
      setAgs(data ?? [])
    } finally { setCarregando(false) }
  }, [])

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUid(user.id)
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      const admin = profile?.role === 'admin'
      setIsAdmin(admin)
      await carregar(mes, admin, user.id)
    }
    init()
  }, [])

  function trocarMes(novo: string) {
    setMes(novo)
    carregar(novo, isAdmin, uid)
  }

  // agregações
  const totalExames = ags.reduce((s, a) => s + (a.exames?.length || 0), 0)
  const porAtendente = Object.values(ags.reduce((acc: any, a) => {
    const nome = a.atendente?.nome ?? 'Desconhecido'
    acc[nome] = acc[nome] || { label: nome, total: 0 }
    acc[nome].total += a.exames?.length || 1
    return acc
  }, {})).sort((a: any, b: any) => b.total - a.total) as { label: string; total: number }[]

  const porDia = Object.values(ags.reduce((acc: any, a) => {
    const dia = formatDate(a.data)
    acc[a.data] = acc[a.data] || { label: dia, total: 0, ord: a.data }
    acc[a.data].total += a.exames?.length || 1
    return acc
  }, {})).sort((a: any, b: any) => a.ord.localeCompare(b.ord)) as any[]

  const porUnidade = Object.values(ags.reduce((acc: any, a) => {
    acc[a.unidade] = acc[a.unidade] || { label: a.unidade, total: 0 }
    acc[a.unidade].total += a.exames?.length || 1
    return acc
  }, {})) as { label: string; total: number }[]

  const porCategoria = Object.values(ags.reduce((acc: any, a) => {
    for (const e of a.exames ?? []) {
      const cat = e.exame?.categoria ?? 'Outros'
      acc[cat] = acc[cat] || { label: cat, total: 0 }
      acc[cat].total += 1
    }
    return acc
  }, {})).sort((a: any, b: any) => b.total - a.total) as { label: string; total: number }[]

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg"><BarChart3 className="text-blue-700" size={24} /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Registros</h1>
            <p className="text-gray-500 text-sm">{isAdmin ? 'Todos os agendamentos do mês' : 'Seus agendamentos do mês'}</p>
          </div>
        </div>
        <select value={mes} onChange={e => trocarMes(e.target.value)} className="input-field w-auto capitalize">
          {meses.map(m => <option key={m.valor} value={m.valor} className="capitalize">{m.label}</option>)}
        </select>
      </div>

      {carregando ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Resumo */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg"><TrendingUp size={20} className="text-green-700" /></div>
                <div><p className="text-xs text-gray-500 uppercase font-medium">Agendamentos</p><p className="text-2xl font-bold text-gray-900">{ags.length}</p></div>
              </div>
            </div>
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg"><BarChart3 size={20} className="text-blue-700" /></div>
                <div><p className="text-xs text-gray-500 uppercase font-medium">Exames</p><p className="text-2xl font-bold text-gray-900">{totalExames}</p></div>
              </div>
            </div>
            {isAdmin && (
              <div className="card">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg"><Users size={20} className="text-purple-700" /></div>
                  <div><p className="text-xs text-gray-500 uppercase font-medium">Atendentes</p><p className="text-2xl font-bold text-gray-900">{porAtendente.length}</p></div>
                </div>
              </div>
            )}
          </div>

          {/* Gráficos */}
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            {isAdmin && <Barras titulo="Por Atendente" icon={<Users size={18} />} dados={porAtendente} />}
            <Barras titulo="Por Unidade" icon={<Building2 size={18} />} dados={porUnidade} />
            <Barras titulo="Por Categoria de Exame" icon={<BarChart3 size={18} />} dados={porCategoria} />
            <Barras titulo="Por Dia" icon={<CalendarDays size={18} />} dados={porDia} />
          </div>

          {/* Lista detalhada (admin) */}
          {isAdmin && ags.length > 0 && (
            <div className="card overflow-hidden p-0 mt-4">
              <div className="px-4 py-3 border-b bg-gray-50">
                <h2 className="font-semibold text-gray-900 text-sm">Detalhamento ({ags.length})</h2>
              </div>
              <div className="divide-y divide-gray-100 max-h-[480px] overflow-y-auto">
                {ags.map(a => (
                  <div key={a.id} className="px-4 py-3 flex items-start justify-between gap-3 hover:bg-gray-50">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{a.paciente_nome}</p>
                      <p className="text-xs text-gray-500">{formatDate(a.data)} às {a.horario} · {a.unidade} · {a.convenio_nome}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(a.exames ?? []).map((e: any, i: number) => <span key={i} className="badge-blue text-xs">{e.exame?.nome}</span>)}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{a.atendente?.nome}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
