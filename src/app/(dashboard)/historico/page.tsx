'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ClipboardList, Search, Filter, Calendar, User, Building2, CheckCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'

export default function HistoricoPage() {
  const supabase = createClient()
  const [agendamentos, setAgendamentos] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [filtroUnidade, setFiltroUnidade] = useState('')
  const [filtroData, setFiltroData] = useState('')
  const [filtroAtendente, setFiltroAtendente] = useState('')
  const [atendentes, setAtendentes] = useState<any[]>([])
  const [userRole, setUserRole] = useState('atendente')
  const [userId, setUserId] = useState('')

  useEffect(() => {
    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      const role = profile?.role ?? 'atendente'
      setUserRole(role)

      // Carregar atendentes para filtro (apenas admin)
      if (role === 'admin') {
        const { data: profs } = await supabase.from('profiles').select('id, nome').order('nome')
        if (profs) setAtendentes(profs)
      }

      await carregarAgendamentos(user.id, role)
    }
    carregar()
  }, [])

  async function carregarAgendamentos(uid: string, role: string) {
    setCarregando(true)
    try {
      // Calcular 30 dias atrás
      const trintaDiasAtras = new Date()
      trintaDiasAtras.setDate(trintaDiasAtras.getDate() - 30)
      const dataLimite = trintaDiasAtras.toISOString().split('T')[0]

      let query = supabase
        .from('agendamentos')
        .select(`
          *,
          atendente:profiles!agendamentos_atendente_id_fkey(nome),
          exames:agendamento_exames(exame:exames(nome))
        `)
        .gte('created_at', dataLimite)
        .order('created_at', { ascending: false })

      if (role !== 'admin') {
        query = query.eq('atendente_id', uid)
      }

      const { data } = await query
      if (data) setAgendamentos(data)
    } finally {
      setCarregando(false)
    }
  }

  const agendamentosFiltrados = agendamentos.filter(a => {
    const matchBusca = !busca || a.paciente_nome.toLowerCase().includes(busca.toLowerCase())
    const matchUnidade = !filtroUnidade || a.unidade === filtroUnidade
    const matchData = !filtroData || a.data === filtroData
    const matchAtendente = !filtroAtendente || a.atendente_id === filtroAtendente
    return matchBusca && matchUnidade && matchData && matchAtendente
  })

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <ClipboardList className="text-blue-700" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Histórico de Agendamentos</h1>
          <p className="text-gray-500 text-sm">Registros dos últimos 30 dias</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar paciente..."
              className="input-field pl-9"
            />
          </div>
          <select value={filtroUnidade} onChange={e => setFiltroUnidade(e.target.value)} className="input-field">
            <option value="">Todas as unidades</option>
            <option value="CDI Prime">CDI Prime</option>
            <option value="CDI Treze de Maio">CDI Treze de Maio</option>
          </select>
          <input
            type="date"
            value={filtroData}
            onChange={e => setFiltroData(e.target.value)}
            className="input-field"
          />
          {userRole === 'admin' && (
            <select value={filtroAtendente} onChange={e => setFiltroAtendente(e.target.value)} className="input-field">
              <option value="">Todos os atendentes</option>
              {atendentes.map(a => (
                <option key={a.id} value={a.id}>{a.nome}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Contador */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          {agendamentosFiltrados.length} agendamento{agendamentosFiltrados.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Lista */}
      {carregando ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : agendamentosFiltrados.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <ClipboardList size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhum agendamento encontrado</p>
        </div>
      ) : (
        <div className="space-y-3">
          {agendamentosFiltrados.map((ag) => {
            const examesNomes = ag.exames?.map((e: any) => e.exame?.nome).filter(Boolean) ?? []
            return (
              <div key={ag.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">{ag.paciente_nome}</h3>
                      <span className="badge-green flex-shrink-0">
                        <CheckCircle size={10} className="mr-1" />
                        {ag.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={13} />
                        {formatDate(ag.data)} às {ag.horario}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 size={13} />
                        {ag.unidade}
                      </span>
                      <span className="flex items-center gap-1">
                        <User size={13} />
                        {ag.atendente?.nome ?? 'Atendente'}
                      </span>
                    </div>
                    {examesNomes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {examesNomes.map((nome: string, i: number) => (
                          <span key={i} className="badge-blue text-xs">{nome}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-400">{ag.convenio_nome}</p>
                    {ag.medico_solicitante && (
                      <p className="text-xs text-gray-400 mt-0.5">Dr(a). {ag.medico_solicitante}</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
