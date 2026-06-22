import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const limpar = (v: string | undefined) => {
  let out = ''
  const s = v ?? ''
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    if (c === 0xfeff || c === 0x200b || c === 13 || c === 10) continue
    out += s[i]
  }
  return out.trim()
}

const supabaseAdmin = createClient(
  limpar(process.env.NEXT_PUBLIC_SUPABASE_URL),
  limpar(process.env.SUPABASE_SERVICE_ROLE_KEY),
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// Domínio técnico interno — o usuário só digita o nome de usuário
const DOMINIO_INTERNO = '@cdi.local'

export async function POST(req: NextRequest) {
  try {
    const { nome, usuario, senha, role } = await req.json()

    const usuarioLimpo = String(usuario).trim().toLowerCase().replace(/\s+/g, '')
    if (!usuarioLimpo) return NextResponse.json({ error: 'Usuário inválido' }, { status: 400 })
    const email = usuarioLimpo + DOMINIO_INTERNO

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
    })

    if (authError) {
      const msg = authError.message.includes('already')
        ? 'Já existe um usuário com esse nome.'
        : authError.message
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    await supabaseAdmin.from('profiles').upsert({
      id: authData.user.id,
      nome,
      email,
      role: role ?? 'atendente',
      ativo: true,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID necessário' }, { status: 400 })

    await supabaseAdmin.from('profiles').delete().eq('id', id)
    await supabaseAdmin.auth.admin.deleteUser(id)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
