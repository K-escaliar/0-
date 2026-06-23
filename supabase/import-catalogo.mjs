// Importa o catalogo de 434 exames (catalogo_exames.json) substituindo o catalogo atual.
// Preserva os registros de agendamentos (apenas remove os vinculos exame<->agendamento de teste).
// Uso:  DBPASS=... CONFIRM=yes node supabase/import-catalogo.mjs
import { Client } from 'pg'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const catalogo = JSON.parse(readFileSync(join(__dirname, 'catalogo_exames.json'), 'utf-8'))

// "1.232,50" -> 1232.50 ; null/'' -> null
function valor(v) {
  if (!v) return null
  const n = parseFloat(String(v).replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

const c = new Client({
  host: 'aws-1-us-east-2.pooler.supabase.com', port: 5432,
  user: 'postgres.wscniwsvjmkymmeeypih', password: process.env.DBPASS,
  database: 'postgres', ssl: { rejectUnauthorized: false },
})
await c.connect()
try {
  // 1) Colunas novas
  await c.query(`alter table exames
    add column if not exists codigo text,
    add column if not exists valor_particular numeric,
    add column if not exists valor_unimed_279 numeric,
    add column if not exists valor_unimed_completa numeric,
    add column if not exists avisos text`)

  if (process.env.CONFIRM !== 'yes') {
    console.log(`DRY-RUN: ${catalogo.length} exames prontos para importar. Colunas criadas.`)
    console.log('Para executar a substituicao, rode com CONFIRM=yes.')
    process.exit(0)
  }

  await c.query('begin')
  // 2) Limpar catalogo antigo e vinculos (preservando a tabela agendamentos)
  await c.query('delete from agendamento_exames')
  await c.query('delete from exame_conflitos')
  await c.query('delete from medico_exames')
  await c.query('delete from exames_sedacao')
  await c.query('delete from exames')

  // 3) Inserir os 434 exames
  let n = 0
  for (const e of catalogo) {
    await c.query(
      `insert into exames (nome, categoria, codigo, codigo_tuss, preparo, unidades,
                           requer_sedacao, valor_particular, valor_unimed_279, valor_unimed_completa)
       values ($1,$2,$3,$4,$5, array['CDI Prime','CDI Treze de Maio'], false, $6,$7,$8)`,
      [e.nome, e.categoria, e.codigo, e.codigo_tuss || null, e.preparo,
       valor(e.valor_particular), valor(e.valor_unimed279), valor(e.valor_unimed_completa)]
    )
    n++
  }

  // 4) Recriar conflito Mamografia + US Mamas, se ambos existirem
  const conf = await c.query(`
    select
      (select id from exames where categoria='Mamografia' order by nome limit 1) as mamo,
      (select id from exames where lower(nome) like '%ultrass%mama%' or lower(nome) like '%us%mama%' order by nome limit 1) as usmama`)
  const { mamo, usmama } = conf.rows[0]
  if (mamo && usmama) {
    await c.query(
      `insert into exame_conflitos (exame_id1, exame_id2, aviso) values ($1,$2,$3)`,
      [mamo, usmama, 'Se Mamografia e US de Mamas forem feitos no mesmo dia, a MAMOGRAFIA deve ser realizada PRIMEIRO.']
    )
  }

  await c.query('commit')
  const tot = await c.query('select count(*)::int n, count(codigo)::int comcod from exames')
  console.log(`OK: ${n} exames inseridos. Total no banco: ${tot.rows[0].n} (com codigo: ${tot.rows[0].comcod}).`)
  console.log(`Conflito mamografia/US recriado: ${mamo && usmama ? 'sim' : 'nao (codigos nao encontrados)'}`)
} catch (e) {
  await c.query('rollback').catch(() => {})
  console.error('ERRO:', e.message)
  process.exitCode = 1
} finally { await c.end() }
