'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Hash, Search } from 'lucide-react'

export default function CodigosTUSSPage() {
  const supabase = createClient()
  const [exames, setExames] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [aba, setAba] = useState<'lista' | 'obs'>('lista')

  useEffect(() => {
    async function carregar() {
      const { data } = await supabase
        .from('exames')
        .select('id, nome, categoria, codigo_tuss, observacoes_tuss')
        .not('codigo_tuss', 'is', null)
        .order('nome')
      if (data) setExames(data)
      setCarregando(false)
    }
    carregar()
  }, [])

  const examesFiltrados = exames.filter(e => {
    const q = busca.toLowerCase()
    return !busca || e.nome.toLowerCase().includes(q) || e.codigo_tuss?.toLowerCase().includes(q)
  })

  const examesComObs = examesFiltrados.filter(e => e.observacoes_tuss)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Hash className="text-blue-700" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Códigos TUSS</h1>
          <p className="text-gray-500 text-sm">Tabela de procedimentos e codes</p>
        </div>
      </div>

      {/* Abas */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setAba('lista')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${aba === 'lista' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Lista de Exames
        </button>
        <button
          onClick={() => setAba('obs')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${aba === 'obs' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Com Observações
        </button>
      </div>

      {/* Busca */}
      <div className="card mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por nome ou código TUSS..."
            className="input-field pl-9"
          />
        </div>
      </div>

      {carregando ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Código TUSS</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Exame</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Categoria</th>
                {aba === 'obs' && (
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">Observações</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(aba === 'obs' ? examesComObs : examesFiltrados).map(exame => (
                <tr key={exame.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                      {exame.codigo_tuss}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{exame.nome}</td>
                  <td className="px-4 py-3">
                    <span className="badge-blue text-xs">{exame.categoria}</span>
                  </td>
                  {aba === 'obs' && (
                    <td className="px-4 py-3 text-sm text-gray-600">{exame.observacoes_tuss}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {(aba === 'obs' ? examesComObs : examesFiltrados).length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <Hash size={40} className="mx-auto mb-3 opacity-30" />
              <p>Nenhum resultado encontrado</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
