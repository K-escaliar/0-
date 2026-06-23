import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/layout/Sidebar'
import InteractiveMedicalBackground from '@/components/InteractiveMedicalBackground'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('nome, role')
    .eq('id', user.id)
    .single()

  const userRole = profile?.role ?? 'atendente'
  const userName = profile?.nome ?? user.email ?? 'Usuário'

  return (
    <div className="relative min-h-screen bg-gray-50">
      <div className="fixed inset-0 z-0">
        <InteractiveMedicalBackground />
      </div>
      <div className="relative z-10">
        <Sidebar userRole={userRole} userName={userName} />
        <main className="lg:ml-64 pt-0 lg:pt-0">
          <div className="pt-14 lg:pt-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
