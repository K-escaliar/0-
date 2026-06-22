import { Client } from 'pg'

const c = new Client({
  host: 'aws-1-us-east-2.pooler.supabase.com', port: 5432,
  user: 'postgres.wscniwsvjmkymmeeypih', password: process.env.DBPASS,
  database: 'postgres', ssl: { rejectUnauthorized: false },
})
await c.connect()
try {
  const u = await c.query(`select id, email, email_confirmed_at, created_at, role, aud from auth.users where email like '%admin%' or email like '%cdi.local%' order by created_at`)
  console.log('USUARIOS auth.users:', JSON.stringify(u.rows, null, 2))
  const ident = await c.query(`select user_id, provider, identity_data->>'email' as email from auth.identities`)
  console.log('IDENTITIES:', JSON.stringify(ident.rows))
  const p = await c.query(`select id, nome, email, role from profiles`)
  console.log('PROFILES:', JSON.stringify(p.rows))
} finally { await c.end() }

// Replica exatamente o que o supabase-js faz no navegador
const anon = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndzY25pd3N2am1reW1tZWV5cGloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwODAzMDUsImV4cCI6MjA5NzY1NjMwNX0.-zLn4zLfh0n1n7gVocTQ3N-qrV0prQ4OcH7jrPePkr0'
const r = await fetch('https://wscniwsvjmkymmeeypih.supabase.co/auth/v1/token?grant_type=password', {
  method: 'POST',
  headers: { apikey: anon, Authorization: `Bearer ${anon}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@cdi.local', password: 'CdiAdmin2026' }),
})
console.log('LOGIN (estilo navegador) status:', r.status, r.ok ? 'OK' : await r.text())
