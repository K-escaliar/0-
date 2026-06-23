import { Client } from 'pg'
const c = new Client({
  host: 'aws-1-us-east-2.pooler.supabase.com', port: 5432,
  user: 'postgres.wscniwsvjmkymmeeypih', password: process.env.DBPASS,
  database: 'postgres', ssl: { rejectUnauthorized: false },
})
await c.connect()
try {
  for (const t of ['exames','medico_exames','convenio_exames','agendamentos','agendamento_exames','exame_conflitos','exames_sedacao']) {
    const r = await c.query(`select count(*)::int n from ${t}`)
    console.log(t.padEnd(22), r.rows[0].n)
  }
  const cols = await c.query(`select column_name from information_schema.columns where table_name='exames' order by ordinal_position`)
  console.log('exames cols:', cols.rows.map(r=>r.column_name).join(', '))
} catch(e){ console.error('ERRO:', e.message); process.exitCode=1 } finally { await c.end() }
