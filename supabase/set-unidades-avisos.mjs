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
  // US que sao so do 13 de Maio (TODOS os Raio-X tambem sao so do 13 — tratados abaixo)
  const TREZE = ['USMAMAS', 'USTRCOLO']
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
  // TODOS os Raio-X sao realizados somente no CDI 13 de Maio
  await c.query(`update exames set unidades=array['CDI Treze de Maio'] where categoria='Raio-X'`)
  for (const [cod, txt] of Object.entries(AV)) await c.query(`update exames set avisos=$1 where codigo=$2`, [txt, cod])

  // Aviso nas Ressonancias musculoesqueleticas (especialidade do Dr. Claudio Nelson)
  const INC = /(ombro|omoplata|escapul|acromio|clavicula|cotovelo|antebraco|braco|punho|mao|joelho|patela|perna|tornozelo|calcaneo|retrope|coxa|quadril|coxo ?femural|coxofemoral|bacia|sacroiliac|sacrococcig|coccix|coluna|temporomandibular|esternoclavicular|cintura escapular|plexo|sinfise|articular por articulacao|artroressonancia|\bsacro)/i
  const EXC = /(angiorr|aorta|pulmonar|coracao|abdome|torax|costela|pescoco|cranio|face|seios|orbita|mastoide|maxilar|malar|zigomatic|sela turcica|ossos temporais|hipofise|colangi|entero|uro|espectro|perfusao|mama|prostata|pelve)/i
  const avClaudio = 'Exame da especialidade do Dr. Claudio Nelson. Se o convenio permitir (ex.: Unimed ou particular), agende preferencialmente no CDI Prime.'
  const rm = await c.query(`select codigo, nome from exames where categoria='Ressonância'`)
  let nc = 0
  for (const e of rm.rows) {
    if (INC.test(e.nome) && !EXC.test(e.nome)) { await c.query(`update exames set avisos=$1 where codigo=$2`, [avClaudio, e.codigo]); nc++ }
  }
  console.log(`Prime-only: ${PRIME.length} | so-13 (US): ${TREZE.length} + todos RX | avisos: ${Object.keys(AV).length} | RM Claudio: ${nc}`)
} catch (e) { console.error('ERRO:', e.message); process.exitCode = 1 } finally { await c.end() }
