'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, Search } from 'lucide-react'
import type { CategoriaExame } from '@/types'

const CATEGORIAS: CategoriaExame[] = ['Ultrassom', 'Raio-X', 'Mamografia', 'Tomossíntese', 'Ressonância', 'Tomografia', 'Outros']

export default function PreparosPage() {
  const supabase = createClient()
  const [exames, setExames] = useState<any[]>([])
  const [carregando, setCarregando] = useState(true)
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState<CategoriaExame | ''>('')

  useEffect(() => {
    async function carregar() {
      const { data } = await supabase
        .from('exames')
        .select('id, nome, categoria, preparo')
        .not('preparo', 'is', null)
        .order('categoria')
        .order('nome')
      if (data) setExames(data)
      setCarregando(false)
    }
    carregar()
  }, [])

  const examesFiltrados = exames.filter(e => {
    const matchBusca = !busca || e.nome.toLowerCase().includes(busca.toLowerCase())
    const matchCategoria = !categoria || e.categoria === categoria
    return matchBusca && matchCategoria
  })

  const categoriaColors: Record<string, string> = {
    'Ultrassom': 'bg-blue-100 text-blue-800',
    'Raio-X': 'bg-gray-100 text-gray-800',
    'Mamografia': 'bg-pink-100 text-pink-800',
    'Tomossíntese': 'bg-purple-100 text-purple-800',
    'Ressonância': 'bg-indigo-100 text-indigo-800',
    'Tomografia': 'bg-orange-100 text-orange-800',
    'Outros': 'bg-yellow-100 text-yellow-800',
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <BookOpen className="text-blue-700" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Central de Preparos</h1>
          <p className="text-gray-500 text-sm">Instruções de preparo por exame</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Buscar exame..."
              className="input-field pl-9"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategoria('')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!categoria ? 'bg-blue-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Todos
            </button>
            {CATEGORIAS.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoria(cat === categoria ? '' : cat)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${categoria === cat ? 'bg-blue-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {carregando ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {examesFiltrados.length === 0 ? (
            <div className="card text-center py-12 text-gray-400">
              <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
              <p>Nenhum exame com preparo encontrado</p>
            </div>
          ) : (
            examesFiltrados.map(exame => (
              <div key={exame.id} className="card">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{exame.nome}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${categoriaColors[exame.categoria] ?? 'badge-blue'}`}>
                    {exame.categoria}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{exame.preparo}</p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
