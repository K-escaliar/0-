'use client'
import Link from 'next/link'
import { ClipboardList, Users, CreditCard, UserCog, Database, GitMerge, Network, Bed } from 'lucide-react'

const adminModules = [
  { href: '/admin/exames', icon: <ClipboardList size={24} />, label: 'Exames', desc: 'Cadastrar, editar e remover exames. Vincular conflitos.', color: 'bg-blue-100 text-blue-700' },
  { href: '/admin/medicos', icon: <Users size={24} />, label: 'Médicos', desc: 'Cadastrar médicos e vincular exames que realizam.', color: 'bg-green-100 text-green-700' },
  { href: '/admin/convenios', icon: <CreditCard size={24} />, label: 'Convênios', desc: 'Gerenciar convênios, exames autorizados e negados.', color: 'bg-purple-100 text-purple-700' },
  { href: '/admin/usuarios', icon: <UserCog size={24} />, label: 'Usuários', desc: 'Cadastrar e gerenciar atendentes e administradores.', color: 'bg-orange-100 text-orange-700' },
  { href: '/rede-externa', icon: <Network size={24} />, label: 'Rede Externa', desc: 'Clínicas parceiras para exames não realizados.', color: 'bg-teal-100 text-teal-700' },
  { href: '/sedacao', icon: <Bed size={24} />, label: 'Sedação', desc: 'Exames com sedação e restrições.', color: 'bg-red-100 text-red-700' },
]

export default function AdminPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Administração</h1>
        <p className="text-gray-500 text-sm">Gerencie todos os cadastros do sistema CDI</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {adminModules.map(mod => (
          <Link
            key={mod.href}
            href={mod.href}
            className="card hover:shadow-md transition-all hover:-translate-y-0.5 group"
          >
            <div className={`inline-flex p-3 rounded-xl mb-3 ${mod.color}`}>
              {mod.icon}
            </div>
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{mod.label}</h3>
            <p className="text-sm text-gray-500 mt-1">{mod.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
