import { Client } from 'pg'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
const __dirname = dirname(fileURLToPath(import.meta.url))
const cat = JSON.parse(readFileSync(join(__dirname, 'catalogo_exames.json'), 'utf-8'))
const c = new Client({ host:'aws-1-us-east-2.pooler.supabase.com', port:5432,
  user:'postgres.wscniwsvjmkymmeeypih', password:process.env.DBPASS, database:'postgres',
  ssl:{rejectUnauthorized:false} })
await c.connect()
try {
  let n=0
  for (const e of cat) {
    if (!e.codigo_tuss) continue
    const r = await c.query('update exames set codigo_tuss=$1 where codigo=$2',[e.codigo_tuss, e.codigo])
    n += r.rowCount
  }
  const tot = await c.query('select count(codigo_tuss)::int t from exames')
  console.log(`TUSS atualizado em ${n} exames. Total com TUSS no banco: ${tot.rows[0].t}`)
} catch(e){ console.error('ERRO:',e.message); process.exitCode=1 } finally { await c.end() }
