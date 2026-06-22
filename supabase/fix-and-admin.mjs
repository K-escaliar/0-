import { Client } from 'pg'

const c = new Client({
  host: 'aws-1-us-east-2.pooler.supabase.com', port: 5432,
  user: 'postgres.wscniwsvjmkymmeeypih', password: process.env.DBPASS,
  database: 'postgres', ssl: { rejectUnauthorized: false },
})

const url = 'https://wscniwsvjmkymmeeypih.supabase.co'
const serviceKey = process.env.SERVICE_KEY
const usuario = (process.env.ADMIN_USER || 'admin').trim().toLowerCase()
const senha = process.env.ADMIN_PASS
const nome = process.env.ADMIN_NOME || 'Administrador'
const email = usuario + '@cdi.local'

await c.connect()
try {
  // Remove o trigger problemático (o app cria o profile explicitamente)
  await c.query(`drop trigger if exists on_auth_user_created on auth.users`)
  console.log('Trigger removido.')

  // Cria o usuário no Auth via GoTrue
  const res = await fetch(`${url}/auth/v1/admin/users`, {
    method: 'POST',
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: senha, email_confirm: true, user_metadata: { nome, role: 'admin' } }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(JSON.stringify(json))
  const userId = json.id
  console.log('Usuário criado no Auth:', userId)

  // Cria o profile com role admin
  await c.query(
    `insert into profiles (id, nome, email, role, ativo) values ($1,$2,$3,'admin',true)
     on conflict (id) do update set nome=excluded.nome, role='admin'`,
    [userId, nome, email]
  )
  console.log('ADMIN PRONTO! usuario:', usuario)
} catch (e) {
  console.error('ERRO:', e.message)
  process.exitCode = 1
} finally {
  await c.end()
}
