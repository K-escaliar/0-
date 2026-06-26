import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './env'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as Parameters<typeof supabaseResponse.cookies.set>[2])
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isPublic = request.nextUrl.pathname === '/' || request.nextUrl.pathname.startsWith('/login')
  const isApi = request.nextUrl.pathname.startsWith('/api/')

  if (!user && !isPublic) {
    if (isApi) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Validação de sessão única: só em páginas (não APIs, não login)
  if (user && !isPublic && !isApi) {
    const cookieToken = request.cookies.get('cdi_session_id')?.value
    if (cookieToken) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('session_token')
        .eq('id', user.id)
        .single()

      if (profile && profile.session_token && profile.session_token !== cookieToken) {
        // Sessão inválida — outro dispositivo fez login
        await supabase.auth.signOut()
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('motivo', 'sessao_encerrada')
        const response = NextResponse.redirect(url)
        response.cookies.delete('cdi_session_id')
        return response
      }
    }
  }

  if (user && request.nextUrl.pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
