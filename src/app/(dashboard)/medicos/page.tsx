'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, Search, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react'

export default function MedicosPage() {
  const supabase = createClient()
  const [medicos, setMedicos] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [expandido, setExpandido] = useState<string | null>(null)

  useEffect(() => {
    async function carregar() {
      const { data } = await supabase
        .from('medicos')
        .select(`*, medico_exames(*, exame:exames(nome, categoria))`)
        .order('nome')
      if (data) setMedicos(data)
      setCarregando(false)
    }
    carregar()
  }, [])

  const medicosFiltrados = medicos.filter(m =>
    m.nome.toLowerCase().includes(busca.toLowerCase()) ||
    m.especialidade?.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Users className="text-blue-700" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Médicos & Exames</h1>
          <p className="text-gray-500 text-sm">Especialidades e exames por médico</p>
        </div>
      </div>

      <div className="card mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar médico ou especialidade..."
            className="input-field pl-9"
          />
        </div>
      </div>

      {carregando ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {medicosFiltrados.map(medico => {
            const examesRealiza = medico.medico_exames?.filter((me: any) => me.realiza) ?? []
            const examesNaoRealiza = medico.medico_exames?.filter((me: any) => !me.realiza) ?? []
            const isOpen = expandido === medico.id

            return (
              <div key={medico.id} className="card border border-gray-200">
                <button
                  onClick={() => setExpandido(isOpen ? null : medico.id)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{medico.nome}</h3>
                    <div className="flex items-center gap-3 mt-0.5">
                      {medico.especialidade && (
                        <p className="text-sm text-gray-500">{medico.especialidade}</p>
                      )}
                      <span className="badge-blue">{medico.unidade}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-green-600 font-medium">{examesRealiza.length} realiza</p>
                      <p className="text-xs text-red-500">{examesNaoRealiza.length} não realiza</p>
                    </div>
                    {isOpen ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-gray-100 grid sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-green-700 flex items-center gap-1 mb-2">
                        <CheckCircle size={14} /> Exames que realiza
                      </h4>
                      {examesRealiza.length === 0 ? (
                        <p className="text-xs text-gray-400">Nenhum cadastrado</p>
                      ) : (
                        <ul className="space-y-1">
                          {examesRealiza.map((me: any) => (
                            <li key={me.exame_id} className="flex items-center gap-2 text-sm text-gray-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                              {me.exame?.nome}
                              {me.exame?.categoria && (
                                <span className="text-xs text-gray-400">({me.exame.categoria})</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-red-600 flex items-center gap-1 mb-2">
                        <XCircle size={14} /> Exames que NÃO realiza
                      </h4>
                      {examesNaoRealiza.length === 0 ? (
                        <p className="text-xs text-gray-400">Nenhum cadastrado</p>
                      ) : (
                        <ul className="space-y-1">
                          {examesNaoRealiza.map((me: any) => (
                            <li key={me.exame_id} className="flex items-center gap-2 text-sm text-gray-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                              {me.exame?.nome}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
