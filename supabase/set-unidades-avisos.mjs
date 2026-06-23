// Define a unidade de cada exame (so Prime / so 13 / ambas) e avisos importantes,
// a partir de "ATENDIMENTO DE EXAMES CDI PRIME OU 13.pdf". Exames fora da lista ficam nas duas.
// Uso: DBPASS=... node supabase/set-unidades-avisos.mjs
import { Client } from 'pg'
const c = new Client({ host: 'aws-1-us-east-2.pooler.supabase.com', port: 5432,
  user: 'postgres.wscniwsvjmkymmeeypih', password: process.env.DBPASS, database: 'postgres',
  ssl: { rejectUnauthorized: false } })
await c.connect()
try {
  const PRIME = ['MAMOGRA', 'MAMOESPC', 'TODIGMAM', 'RMCOMFUN', 'RMCOMFU', 'RMCOVIAP', 'RMABDSUV']
  const TREZE = ['RXENEOPA', 'RXESOFAG', 'RXESHIES', 'RXESDUOD', 'RXURADUL', 'RXURECRI', 'RXURERET', 'RXUVPOSM', 'USMAMAS', 'USTRCOLO']
  const cardio = 'Somente no CDI Prime, as 2a/4a/6a ate 09:30h, com o Dr. Rafael Valentini presente. Convenios: particular, Unimed ou Consorcio.'
  const partBoth = 'Apenas particular (nenhum convenio). Realizado no CDI Prime e no 13 de Maio.'
  const rxContr = 'Somente no CDI 13 de Maio. Marcar 1 exame de cada tipo por dia, a partir das 08h.'
  const corona = 'Preferencialmente no CDI Prime (2a/4a/6a ate 09:30h, com o Dr. Valentini presente). No 13 de Maio apenas pelos convenios Bradesco e BRF. Atende particular, Unimed ou Consorcio.'
  const AV = {
    MAMOGRA: 'Somente no CDI Prime. Atende particular e Unimed; demais convenios, cobrar particular.',
    MAMOESPC: 'Somente no CDI Prime. Atende particular e Unimed; demais convenios, cobrar particular.',
    TODIGMAM: 'Somente no CDI Prime. Apenas particular (nenhum convenio).',
    RMCOMFUN: cardio, RMCOMFU: cardio, RMCOVIAP: cardio,
    RMABDSUV: 'Somente no CDI Prime. Apenas particular (nenhum convenio). Usa Primovist (contraste especial).',
    ANTCCORO: corona, PCTANGCO: corona,
    RMMULPRO: partBoth, TCESCCAL: partBoth,
    ANTCAMSD: partBoth, ANTCAMSE: partBoth, ANTCMSE: partBoth, ANTCMSD: partBoth,
    ENTRESSO: 'Preparo especial. Realizado no CDI 13 de Maio e no CDI Prime.',
    ENTTOMO: 'Preparo especial. Realizado no CDI 13 de Maio e no CDI Prime.',
    ANTCAOAB: 'No Protocolo TAVI: apenas particular. Realizado no CDI Prime e no 13 de Maio.',
    ANTCAOTO: 'No Protocolo TAVI: apenas particular. Realizado no CDI Prime e no 13 de Maio.',
    RXENEOPA: rxContr, RXESOFAG: rxContr, RXESHIES: rxContr, RXESDUOD: rxContr,
    RXURADUL: rxContr, RXURECRI: rxContr, RXURERET: rxContr, RXUVPOSM: rxContr,
    USMAMAS: 'Somente no CDI 13 de Maio (realizado pelo Dr. Henrique).',
    USTRCOLO: 'Somente no CDI 13 de Maio. Marcar com o Dr. Rafael.',
  }
  for (const cod of PRIME) await c.query(`update exames set unidades=array['CDI Prime'] where codigo=$1`, [cod])
  for (const cod of TREZE) await c.query(`update exames set unidades=array['CDI Treze de Maio'] where codigo=$1`, [cod])
  for (const [cod, txt] of Object.entries(AV)) await c.query(`update exames set avisos=$1 where codigo=$2`, [txt, cod])
  console.log(`Prime-only: ${PRIME.length} | 13-only: ${TREZE.length} | avisos: ${Object.keys(AV).length}`)
} catch (e) { console.error('ERRO:', e.message); process.exitCode = 1 } finally { await c.end() }
