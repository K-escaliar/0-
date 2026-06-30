'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'
import {
  CalendarPlus, ClipboardList, Users, BookOpen,
  CreditCard, Network, Hash, Bed, BarChart3,
  Settings, LogOut, Menu, X, ChevronDown, ChevronRight, Megaphone, FileBarChart,
  StickyNote, MessageCircle,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  adminOnly?: boolean
  children?: { href: string; label: string }[]
}

const navItems: NavItem[] = [
  { href: '/agendamento', label: 'Agendamento', icon: <CalendarPlus size={20} /> },
  { href: '/anotacoes', label: 'Minhas Anotações', icon: <StickyNote size={20} /> },
  { href: '/mensagens', label: 'Mensagens', icon: <MessageCircle size={20} /> },
  { href: '/novidades', label: 'Novidades', icon: <Megaphone size={20} /> },
  { href: '/historico', label: 'Histórico', icon: <ClipboardList size={20} /> },
  { href: '/registros', label: 'Registros', icon: <FileBarChart size={20} /> },
  { href: '/medicos', label: 'Médicos & Exames', icon: <Users size={20} /> },
  { href: '/preparos', label: 'Central de Preparos', icon: <BookOpen size={20} /> },
  { href: '/convenios', label: 'Convênios & Regras', icon: <CreditCard size={20} /> },
  { href: '/rede-externa', label: 'Contatos Externos', icon: <Network size={20} /> },
  { href: '/codigos-tuss', label: 'Códigos TUSS', icon: <Hash size={20} /> },
  { href: '/sedacao', label: 'Exames com Sedação', icon: <Bed size={20} /> },
  {
    href: '/dashboard', label: 'Dashboard', icon: <BarChart3 size={20} />, adminOnly: true,
    children: [
      { href: '/admin/exames', label: 'Exames' },
      { href: '/admin/medicos', label: 'Médicos' },
      { href: '/admin/convenios', label: 'Convênios' },
      { href: '/admin/usuarios', label: 'Usuários' },
    ]
  },
]

interface SidebarProps {
  userRole: string
  userName: string
}

export default function Sidebar({ userRole, userName }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const [mensagensNaoLidas, setMensagensNaoLidas] = useState(0)
  const isAdmin = userRole === 'admin'

  const atualizarContagem = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { count } = await supabase
      .from('mensagens_internas')
      .select('id', { count: 'exact', head: true })
      .eq('destinatario_id', user.id)
      .eq('lida', false)
    setMensagensNaoLidas(count ?? 0)
  }, [])

  useEffect(() => {
    atualizarContagem()

    let channel: ReturnType<typeof supabase.channel> | null = null
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      channel = supabase
        .channel('sidebar_mensagens')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'mensagens_internas' }, () => {
          atualizarContagem()
        })
        .subscribe()
    })

    return () => { if (channel) supabase.removeChannel(channel) }
  }, [atualizarContagem])

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Logout realizado.')
    router.push('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-blue-700">
        <div className="flex-shrink-0 w-9 h-9 bg-white rounded-lg flex items-center justify-center">
          <span className="text-blue-800 text-sm font-bold">CDI</span>
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="text-white font-semibold text-sm truncate">Sistema CDI</p>
            <p className="text-blue-200 text-xs truncate">{userName}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          if (item.adminOnly && !isAdmin) return null
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const hasChildren = item.children && item.children.length > 0

          if (hasChildren && isAdmin) {
            return (
              <div key={item.href}>
                <button
                  onClick={() => setAdminOpen(!adminOpen)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    isActive ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-blue-700/50'
                  }`}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-sm font-medium">{item.label}</span>
                      {adminOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </>
                  )}
                </button>
                {adminOpen && !collapsed && (
                  <div className="ml-8 mt-1 space-y-1">
                    <Link href={item.href} className={`block px-3 py-2 rounded-lg text-sm transition-colors ${pathname === item.href ? 'bg-blue-700 text-white' : 'text-blue-200 hover:bg-blue-700/50 hover:text-white'}`}>
                      Visão Geral
                    </Link>
                    {item.children!.map(child => (
                      <Link key={child.href} href={child.href} className={`block px-3 py-2 rounded-lg text-sm transition-colors ${pathname === child.href ? 'bg-blue-700 text-white' : 'text-blue-200 hover:bg-blue-700/50 hover:text-white'}`}>
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          const isMensagens = item.href === '/mensagens'

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors relative ${
                isActive ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-blue-700/50'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <span className="flex-shrink-0 relative">
                {item.icon}
                {isMensagens && mensagensNaoLidas > 0 && collapsed && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {mensagensNaoLidas > 9 ? '9+' : mensagensNaoLidas}
                  </span>
                )}
              </span>
              {!collapsed && (
                <span className="text-sm font-medium flex-1 flex items-center justify-between">
                  {item.label}
                  {isMensagens && mensagensNaoLidas > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center">
                      {mensagensNaoLidas > 99 ? '99+' : mensagensNaoLidas}
                    </span>
                  )}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-blue-700 space-y-1">
        {isAdmin && (
          <Link href="/admin" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-blue-100 hover:bg-blue-700/50`} title={collapsed ? 'Admin' : undefined}>
            <Settings size={20} />
            {!collapsed && <span className="text-sm font-medium">Administração</span>}
          </Link>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-blue-100 hover:bg-red-500/20 hover:text-red-200 transition-colors"
          title={collapsed ? 'Sair' : undefined}
        >
          <LogOut size={20} />
          {!collapsed && <span className="text-sm font-medium">Sair</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col bg-blue-800 transition-all duration-200 ${collapsed ? 'w-16' : 'w-64'} fixed left-0 top-0 h-full z-30`}>
        <SidebarContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-6 bg-blue-800 rounded-full p-1 text-white border-2 border-white/20 hover:bg-blue-700"
        >
          {collapsed ? <ChevronRight size={14} /> : <X size={14} />}
        </button>
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-blue-800 z-30 flex items-center px-4 h-14">
        <button onClick={() => setMobileOpen(true)} className="text-white mr-3">
          <Menu size={24} />
        </button>
        <span className="text-white font-semibold">Sistema CDI</span>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-blue-800 flex flex-col">
            <div className="flex justify-end p-3">
              <button onClick={() => setMobileOpen(false)} className="text-white">
                <X size={22} />
              </button>
            </div>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  )
}
