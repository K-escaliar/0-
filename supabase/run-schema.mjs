import { readFileSync } from 'fs'
import { Client } from 'pg'

const sql = readFileSync(new URL('./schema.sql', import.meta.url), 'utf8')

const client = new Client({
  host: 'aws-1-us-east-2.pooler.supabase.com',
  port: 5432,
  user: 'postgres.wscniwsvjmkymmeeypih',
  password: process.env.DBPASS,
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
})

try {
  await client.connect()
  console.log('Conectado ao banco. Executando schema...')
  await client.query(sql)
  console.log('SCHEMA EXECUTADO COM SUCESSO!')

  const { rows } = await client.query(`
    select
      (select count(*) from exames) as exames,
      (select count(*) from medicos) as medicos,
      (select count(*) from convenios) as convenios,
      (select count(*) from rede_externa) as rede_externa,
      (select count(*) from exames_sedacao) as sedacao
  `)
  console.log('CONTAGENS:', JSON.stringify(rows[0]))
} catch (e) {
  console.error('ERRO:', e.message)
  process.exitCode = 1
} finally {
  await client.end()
}
