-- ============================================================
-- SCHEMA CDI SYSTEM
-- Execute este arquivo no Supabase SQL Editor
-- ============================================================

-- Habilitar extensão UUID
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABELA: profiles (estende auth.users)
-- ============================================================
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  nome text not null,
  email text not null,
  role text not null default 'atendente' check (role in ('atendente', 'admin')),
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

-- Trigger para criar profile automaticamente ao cadastrar usuário
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, nome, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'atendente')
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- TABELA: exames
-- ============================================================
create table if not exists exames (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  categoria text not null check (categoria in ('Ultrassom', 'Raio-X', 'Mamografia', 'Tomossíntese', 'Ressonância', 'Tomografia', 'Outros')),
  codigo_tuss text,
  preparo text,
  observacoes_tuss text,
  unidades text[] not null default '{}',
  requer_sedacao boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- TABELA: exame_conflitos
-- ============================================================
create table if not exists exame_conflitos (
  id uuid primary key default uuid_generate_v4(),
  exame_id1 uuid not null references exames(id) on delete cascade,
  exame_id2 uuid not null references exames(id) on delete cascade,
  aviso text not null,
  created_at timestamptz not null default now()
);

-- ============================================================
-- TABELA: medicos
-- ============================================================
create table if not exists medicos (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  especialidade text,
  unidade text not null check (unidade in ('CDI Prime', 'CDI Treze de Maio', 'Ambas')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- TABELA: medico_exames
-- ============================================================
create table if not exists medico_exames (
  medico_id uuid not null references medicos(id) on delete cascade,
  exame_id uuid not null references exames(id) on delete cascade,
  realiza boolean not null,
  primary key (medico_id, exame_id)
);

-- ============================================================
-- TABELA: convenios
-- ============================================================
create table if not exists convenios (
  id uuid primary key default uuid_generate_v4(),
  nome text not null,
  tipo text not null default 'convenio' check (tipo in ('convenio', 'desconto', 'particular')),
  precisa_guia boolean not null default false,
  precisa_autorizacao boolean not null default false,
  alertas text,
  observacoes text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- TABELA: convenio_exames
-- ============================================================
create table if not exists convenio_exames (
  convenio_id uuid not null references convenios(id) on delete cascade,
  exame_id uuid not null references exames(id) on delete cascade,
  status text not null check (status in ('autorizado', 'negado', 'restrito')),
  observacao text,
  primary key (convenio_id, exame_id)
);

-- ============================================================
-- TABELA: agendamentos
-- ============================================================
create table if not exists agendamentos (
  id uuid primary key default uuid_generate_v4(),
  paciente_nome text not null,
  convenio_id uuid references convenios(id),
  convenio_nome text not null,
  unidade text not null check (unidade in ('CDI Prime', 'CDI Treze de Maio')),
  data date not null,
  horario time not null,
  medico_solicitante text,
  status text not null default 'Paciente Agendado' check (status in ('Paciente Agendado', 'Cancelado', 'Realizado')),
  atendente_id uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

-- ============================================================
-- TABELA: agendamento_exames
-- ============================================================
create table if not exists agendamento_exames (
  agendamento_id uuid not null references agendamentos(id) on delete cascade,
  exame_id uuid not null references exames(id),
  primary key (agendamento_id, exame_id)
);

-- ============================================================
-- TABELA: rede_externa
-- ============================================================
create table if not exists rede_externa (
  id uuid primary key default uuid_generate_v4(),
  clinica_nome text not null,
  exames_oferecidos text not null,
  telefone text,
  observacoes text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- TABELA: exames_sedacao
-- ============================================================
create table if not exists exames_sedacao (
  id uuid primary key default uuid_generate_v4(),
  exame_id uuid not null references exames(id) on delete cascade,
  restricoes text,
  indicacoes text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles enable row level security;
alter table exames enable row level security;
alter table exame_conflitos enable row level security;
alter table medicos enable row level security;
alter table medico_exames enable row level security;
alter table convenios enable row level security;
alter table convenio_exames enable row level security;
alter table agendamentos enable row level security;
alter table agendamento_exames enable row level security;
alter table rede_externa enable row level security;
alter table exames_sedacao enable row level security;

-- Políticas: usuários autenticados podem ler tudo
create policy "Autenticados leem profiles" on profiles for select using (auth.role() = 'authenticated');
create policy "Autenticados leem exames" on exames for all using (auth.role() = 'authenticated');
create policy "Autenticados leem conflitos" on exame_conflitos for all using (auth.role() = 'authenticated');
create policy "Autenticados leem medicos" on medicos for all using (auth.role() = 'authenticated');
create policy "Autenticados leem medico_exames" on medico_exames for all using (auth.role() = 'authenticated');
create policy "Autenticados leem convenios" on convenios for all using (auth.role() = 'authenticated');
create policy "Autenticados leem convenio_exames" on convenio_exames for all using (auth.role() = 'authenticated');
create policy "Autenticados gerenciam agendamentos" on agendamentos for all using (auth.role() = 'authenticated');
create policy "Autenticados gerenciam agendamento_exames" on agendamento_exames for all using (auth.role() = 'authenticated');
create policy "Autenticados leem rede_externa" on rede_externa for all using (auth.role() = 'authenticated');
create policy "Autenticados leem exames_sedacao" on exames_sedacao for all using (auth.role() = 'authenticated');

-- ============================================================
-- DADOS INICIAIS: Exames
-- ============================================================

insert into exames (nome, categoria, codigo_tuss, preparo, unidades, requer_sedacao) values

-- ULTRASSOM
('US Abdome Total', 'Ultrassom', '40301010', 'Adultos: Jejum de 8 horas. Crianças até 1 ano: Jejum de 3h. De 1 a 4 anos: Jejum de 4h. Acima de 5 anos: Jejum de 8h. Realizar refeições leves (evite derivados do leite, líquidos gaseificados, feijão, carnes de porco e carne vermelha). Bexiga parcialmente cheia. Trazer exames anteriores.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),

('US Abdome Superior', 'Ultrassom', '40301028', 'Jejum de 8 horas. Realizar refeições leves no dia anterior (evite derivados do leite, líquidos gaseificados, feijão e carnes gordurosas). Trazer exames anteriores.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),

('US Abdome Inferior Feminino', 'Ultrassom', '40301036', 'Bexiga cheia: tomar 4 copos de água (800ml) 1 hora antes do exame e não urinar. Trazer exames anteriores.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),

('US Abdome Inferior Masculino', 'Ultrassom', '40301044', 'Bexiga cheia: tomar 4 copos de água (800ml) 1 hora antes do exame e não urinar. Trazer exames anteriores.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),

('US Pelve Feminina (Transvaginal)', 'Ultrassom', '40301079', 'Bexiga vazia. Trazer exames anteriores se possível.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),

('US Transvaginal com Doppler', 'Ultrassom', '40301087', 'Bexiga vazia. Trazer exames anteriores se possível.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),

('US Mamas e Axilas', 'Ultrassom', '40301109', 'Sem preparo especial. Se tiver mais de 40 anos, trazer o exame de mamografia anterior ou realizar no mesmo dia. Trazer exames anteriores.', ARRAY['CDI Treze de Maio'], false),

('US Tireoide', 'Ultrassom', '40301117', 'Sem preparo, trazer exames anteriores.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),

('US Órgãos Superficiais', 'Ultrassom', '40301125', 'Sem preparo especial. Trazer exames anteriores.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),

('US Bolsa Escrotal', 'Ultrassom', '40301133', 'Sem preparo especial. Trazer exames anteriores.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),

('US Próstata Abdominal', 'Ultrassom', '40301141', 'Bexiga cheia: tomar 4 copos de água (800ml) 1 hora antes do exame e não urinar.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),

('US Próstata Transretal', 'Ultrassom', '40301168', 'Bexiga cheia: tomar 4 copos de água (800ml) 1 hora antes. Intestino limpo com Fleet enema 2 horas antes.', ARRAY['CDI Treze de Maio'], false),

('US Articular (por articulação)', 'Ultrassom', '40301176', 'Sem preparo especial. Trazer exames anteriores (raio-x, RM se houver).', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),

('US Estruturas Superficiais', 'Ultrassom', '40301184', 'Sem preparo especial.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),

('US Aparelho Urinário', 'Ultrassom', '40301192', 'Bexiga cheia: tomar 4 copos de água (800ml) 1 hora antes do exame e não urinar.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),

('US Glândulas Salivares', 'Ultrassom', '40301206', 'Sem preparo especial. Trazer exames anteriores.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),

('US Obstétrico 1º Trimestre (Endovaginal)', 'Ultrassom', '40301214', 'Bexiga vazia. Trazer cartão de pré-natal e exames anteriores.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),

('US Obstétrico com Doppler', 'Ultrassom', '40301222', 'Bexiga parcialmente cheia. Trazer cartão de pré-natal e exames anteriores.', ARRAY['CDI Treze de Maio'], false),

('US Obstétrico Simples', 'Ultrassom', '40301230', 'Bexiga parcialmente cheia. Trajar cartão de pré-natal.', ARRAY['CDI Treze de Maio'], false),

('US Obstétrico Perfil Biofísico Fetal', 'Ultrassom', '40301249', 'Bexiga parcialmente cheia. Trazer cartão de pré-natal. A partir da 28ª semana.', ARRAY['CDI Treze de Maio'], false),

('US Transcraniano / Transfontanela', 'Ultrassom', '40301257', 'Sem preparo especial (crianças de 0 a 11 meses).', ARRAY['CDI Treze de Maio'], false),

('US Doppler de Carótidas e Vertebrais', 'Ultrassom', '40301265', 'Sem preparo especial. Trazer exames anteriores.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),

('US Doppler Venoso de Membros Inferiores', 'Ultrassom', '40301273', 'Sem preparo especial. Trazer exames anteriores. Usar roupas confortáveis.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),

('US Doppler Arterial de Membros Inferiores', 'Ultrassom', '40301281', 'Sem preparo especial. Usar roupas confortáveis.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),

('US Doppler de Membros Superiores', 'Ultrassom', '40301290', 'Sem preparo especial. Usar roupas confortáveis.', ARRAY['CDI Prime'], false),

('US Derma (Pele/Subcutâneo)', 'Ultrassom', '40301303', 'Sem preparo especial.', ARRAY['CDI Treze de Maio'], false),

('US Parede Abdominal', 'Ultrassom', '40301311', 'Sem preparo especial.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),

-- RAIO-X
('RX Tórax', 'Raio-X', '40901017', 'Sem preparo especial. Retirar objetos metálicos.', ARRAY['CDI Treze de Maio'], false),
('RX Coluna Cervical', 'Raio-X', '40901025', 'Sem preparo especial.', ARRAY['CDI Treze de Maio'], false),
('RX Coluna Dorsal', 'Raio-X', '40901033', 'Sem preparo especial.', ARRAY['CDI Treze de Maio'], false),
('RX Coluna Lombar', 'Raio-X', '40901041', 'Sem preparo especial.', ARRAY['CDI Treze de Maio'], false),
('RX Bacia / Quadril', 'Raio-X', '40901050', 'Sem preparo especial.', ARRAY['CDI Treze de Maio'], false),
('RX Joelho', 'Raio-X', '40901068', 'Sem preparo especial.', ARRAY['CDI Treze de Maio'], false),
('RX Pé / Tornozelo', 'Raio-X', '40901076', 'Sem preparo especial.', ARRAY['CDI Treze de Maio'], false),
('RX Mão / Punho', 'Raio-X', '40901084', 'Sem preparo especial.', ARRAY['CDI Treze de Maio'], false),
('RX Ombro / Clavícula', 'Raio-X', '40901092', 'Sem preparo especial.', ARRAY['CDI Treze de Maio'], false),
('RX Crânio / Face', 'Raio-X', '40901106', 'Sem preparo especial. Retirar brincos e adornos.', ARRAY['CDI Treze de Maio'], false),
('RX Seios da Face', 'Raio-X', '40901114', 'Sem preparo especial.', ARRAY['CDI Treze de Maio'], false),
('Uretrocistografia', 'Raio-X', '40901122', 'Não é necessário preparo. Agendar apenas nas 3ª e 5ª a partir das 08h, ou 2ª, 4ª, 6ª a partir das 14h. Somente 1 homem por dia.', ARRAY['CDI Treze de Maio'], false),
('Urografia Excretora', 'Raio-X', '40901130', 'Hidratação reduzida no dia anterior. Jejum de 4 horas. Laxante na véspera conforme orientação médica.', ARRAY['CDI Treze de Maio'], false),
('Esôfago / Estômago / Duodeno (Trânsito)', 'Raio-X', '40901149', 'Jejum de 8 horas. Não fumar no dia do exame. Não tomar medicações antes do exame.', ARRAY['CDI Treze de Maio'], false),
('Enema Opaco', 'Raio-X', '40901157', 'Dieta líquida por 2 dias. Fleet enema às 18h do dia anterior e às 6h do dia do exame. Jejum de 8h.', ARRAY['CDI Treze de Maio'], false),

-- MAMOGRAFIA
('Mamografia Digital Bilateral', 'Mamografia', '40901165', 'Não usar cosméticos (desodorante, creme, talco, óleo) nas mamas e axilas no dia do exame. Se tiver agendado US de mamas, realizar PRIMEIRO a mamografia. Mulheres lactantes: ordenha antes do exame. Trazer exames anteriores.', ARRAY['CDI Prime'], false),

-- TOMOSSÍNTESE
('Tomossíntese Digital de Mamas', 'Tomossíntese', '40901173', 'Não usar cosméticos (desodorante, creme, talco, óleo) nas mamas e axilas no dia do exame. Trazer exames anteriores.', ARRAY['CDI Prime'], false),

-- TOMOGRAFIA
('TC Crânio', 'Tomografia', '40201026', 'Sem preparo especial. Retirar objetos metálicos. Trazer exames anteriores.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),
('TC Encéfalo', 'Tomografia', '40201034', 'Sem preparo especial. Retirar objetos metálicos. Trazer exames anteriores.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),
('TC Face / Seios da Face', 'Tomografia', '40201042', 'Sem preparo especial. Retirar objetos metálicos.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),
('TC Pescoço', 'Tomografia', '40201050', 'Sem preparo especial. Retirar objetos metálicos.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),
('TC Tórax', 'Tomografia', '40201069', 'Sem preparo especial. Retirar objetos metálicos. Trazer exames anteriores.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),
('TC Abdome', 'Tomografia', '40201077', 'Jejum de 4 horas. Trazer exames anteriores. Em caso de contraste: informar alergias.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),
('TC Abdome e Pelve', 'Tomografia', '40201085', 'Jejum de 4 horas. Tomar contraste oral conforme orientação. Trazer exames anteriores.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),
('TC Pelve Feminina', 'Tomografia', '40201093', 'Jejum de 4 horas. Bexiga cheia. Trazer exames anteriores.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),
('TC Pelve Masculina', 'Tomografia', '40201107', 'Jejum de 4 horas. Bexiga cheia. Trazer exames anteriores.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),
('TC Coluna Cervical', 'Tomografia', '40201115', 'Sem preparo. Retirar objetos metálicos. Trajar roupa sem metal.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),
('TC Coluna Dorsal', 'Tomografia', '40201123', 'Sem preparo. Retirar objetos metálicos.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),
('TC Coluna Lombar', 'Tomografia', '40201131', 'Sem preparo. Retirar objetos metálicos.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),
('TC Joelho', 'Tomografia', '40201140', 'Sem preparo especial. Trazer exames anteriores (RX, RM).', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),
('TC Ombro', 'Tomografia', '40201158', 'Sem preparo especial.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),
('TC Punho / Mão', 'Tomografia', '40201166', 'Sem preparo especial.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),
('TC Cotovelo / Antebraço', 'Tomografia', '40201174', 'Sem preparo especial.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),
('TC Bacia / Quadril / Sacroilíacas', 'Tomografia', '40201182', 'Sem preparo especial.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),
('TC Tornozelo / Pé', 'Tomografia', '40201190', 'Sem preparo especial.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),
('TC ATM (Articulação Temporomandibular)', 'Tomografia', '40201204', 'Sem preparo especial.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),
('Angio TC Coronárias', 'Tomografia', '40201212', 'Enviar lista de medicamentos ao Dr. Rafael Valentini para avaliação prévia. Possível uso de Selozok. Agendar 2ª, 4ª, 6ª das 07:10 às 10:30h. Jejum de 4 horas. Não tomar café. Informar alergias a contraste.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),
('Angio TC Artérias (geral)', 'Tomografia', '40201220', 'Jejum de 4 horas. Informar alergias a contraste. Trazer exames anteriores.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),
('Angio TC Membros Superiores (Arterial/Venoso)', 'Tomografia', '40201239', 'Somente particular. Jejum de 4 horas. Informar alergias a contraste.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),
('TC Escore de Cálcio', 'Tomografia', '40201247', 'Somente particular. Sem preparo especial.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),
('Enterotomografia', 'Tomografia', '40201255', 'Preparo especial: dieta líquida 24h antes. Tomar preparação de manitol conforme orientação. Jejum de 4h. Contato prévio com a clínica.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),

-- RESSONÂNCIA
('RM Crânio', 'Ressonância', '40801027', 'Sem preparo. Retirar objetos metálicos, cartões magnéticos. Informar implantes metálicos.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),
('RM Encéfalo', 'Ressonância', '40801035', 'Sem preparo. Retirar objetos metálicos. Informar implantes.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),
('RM Coluna Cervical', 'Ressonância', '40801043', 'Sem preparo. Retirar objetos metálicos.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),
('RM Coluna Dorsal', 'Ressonância', '40801051', 'Sem preparo. Retirar objetos metálicos.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),
('RM Coluna Lombar', 'Ressonância', '40801060', 'Sem preparo. Retirar objetos metálicos. Trazer RX ou TC anteriores.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),
('RM Joelho', 'Ressonância', '40801078', 'Sem preparo. Retirar objetos metálicos. Trazer exames anteriores.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),
('RM Ombro', 'Ressonância', '40801086', 'Sem preparo. Retirar objetos metálicos.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),
('RM Quadril / Bacia', 'Ressonância', '40801094', 'Sem preparo. Retirar objetos metálicos.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),
('RM Sacroilíacas', 'Ressonância', '40801108', 'Sem preparo. Retirar objetos metálicos.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),
('RM Tornozelo / Pé', 'Ressonância', '40801116', 'Sem preparo. Retirar objetos metálicos.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),
('RM Punho / Mão', 'Ressonância', '40801124', 'Sem preparo. Retirar objetos metálicos.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),
('RM Cotovelo / Antebraço', 'Ressonância', '40801132', 'Sem preparo. Retirar objetos metálicos.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),
('RM Pelve Feminina', 'Ressonância', '40801140', 'Jejum de 4 horas. Bexiga moderadamente cheia. Retirar objetos metálicos.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),
('RM Pelve Masculina', 'Ressonância', '40801159', 'Jejum de 4 horas. Bexiga cheia. Retirar objetos metálicos.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),
('RM Abdome', 'Ressonância', '40801167', 'Jejum de 6 horas. Retirar objetos metálicos. Trazer exames anteriores.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),
('RM Tórax', 'Ressonância', '40801175', 'Sem preparo. Retirar objetos metálicos.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),
('RM Pescoço', 'Ressonância', '40801183', 'Sem preparo. Retirar objetos metálicos.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),
('RM Mamas', 'Ressonância', '40801191', 'Jejum de 4 horas. Preferencialmente agendar entre o 7º e 14º dia do ciclo menstrual. Retirar objetos metálicos.', ARRAY['CDI Prime'], false),
('RM Coração', 'Ressonância', '40801205', 'Agendar somente no CDI Prime, 4ª e 6ª das 08:00 às 10:00h. Enviar medicações ao Dr. Rafael Valentini. Jejum de 4h. Retirar objetos metálicos.', ARRAY['CDI Prime'], false),
('RM Multiparamétrica de Próstata', 'Ressonância', '40801213', 'Somente particular. Intestino limpo 24h antes. Dieta sem fibras. Jejum de 4h. Bexiga moderadamente cheia.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),
('RM Plexo Braquial', 'Ressonância', '40801221', 'Sem preparo. Retirar objetos metálicos.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),
('RM ATM (Articulação Temporomandibular)', 'Ressonância', '40801230', 'Sem preparo. Retirar objetos metálicos.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false),
('Enterorressonância', 'Ressonância', '40801248', 'Preparo especial: dieta sem resíduos 24h antes. Tomar preparação oral no dia. Jejum de 4h. Contato prévio necessário.', ARRAY['CDI Prime', 'CDI Treze de Maio'], false)

on conflict do nothing;

-- ============================================================
-- DADOS INICIAIS: Médicos
-- ============================================================

insert into medicos (nome, especialidade, unidade) values
('Dra. Julia Noschang', 'Radiologista - Especialista em Abdome, Tórax e Oncologia', 'CDI Prime'),
('Dr. Claudio Nelson', 'Radiologista - Especialista em Musculoesquelético', 'CDI Prime'),
('Dr. Ricardo Paganin', 'Radiologista - Especialista em Neurorradiologia', 'CDI Prime'),
('Dra. Flavia Abdo', 'Radiologista - Especialista em Radiologia de Mamas', 'CDI Prime'),
('Dr. Rafael Valentini', 'Cardiologista - Especialista em Radiologia Cardiológica', 'CDI Prime'),
('Dr. Henrique Martucci', 'Radiologista - Especialista em Diagnóstico por Imagem', 'CDI Treze de Maio'),
('Dr. Rafael Mioso', 'Radiologista - Especialista em Diagnóstico por Imagem', 'CDI Treze de Maio')
on conflict do nothing;

-- ============================================================
-- DADOS INICIAIS: Convênios
-- ============================================================

insert into convenios (nome, tipo, precisa_guia, precisa_autorizacao, alertas, observacoes) values
('Particular', 'particular', false, false, 'Priorizar agendamento quando possível. Sem necessidade de guia ou autorização.', null),
('Unimed', 'convenio', true, true, 'Exige biometria obrigatória no atendimento.', 'Autorização prévia necessária para alguns exames. Verificar validade da guia.'),
('Bradesco Saúde', 'convenio', true, true, 'Token Bradesco obrigatório para autorização. Não faz exames no CDI Prime.', 'Contato para autorização: central Bradesco. Verificar senha de autorização.'),
('BRF', 'convenio', true, false, null, 'Cobre sedação e anestesista para exames que necessitem.'),
('Sul América', 'convenio', true, true, null, 'Não faz exames no CDI Prime.'),
('CASSI', 'convenio', true, true, null, 'Não faz exames no CDI Prime.'),
('Infinity', 'convenio', true, true, null, 'Não faz exames no CDI Prime.'),
('Postal', 'convenio', true, false, null, null),
('MedService', 'convenio', true, false, null, null),
('Economy Brasil', 'convenio', true, false, null, null),
('Consórcio', 'convenio', false, false, null, 'Verificar exames cobertos pelo consórcio específico.'),
('Pax Vida', 'desconto', false, false, null, 'Convênio com desconto. Verificar tabela de preços.'),
('CDL', 'desconto', false, false, null, 'Desconto para associados.'),
('Quiropraxia', 'desconto', false, false, null, null),
('ACES', 'desconto', false, false, null, null)
on conflict do nothing;

-- ============================================================
-- DADOS INICIAIS: Rede Externa
-- ============================================================

insert into rede_externa (clinica_nome, exames_oferecidos, telefone, observacoes) values
('Espirometria', 'Espirometria, Teste de Função Pulmonar', '(66) 99985-8196', null),
('Vida Cardio', 'Ecocardiograma, Teste Ergométrico, Holter, MAPA', '(66) 99716-7505', null),
('Endoscopia', 'Endoscopia Digestiva, Colonoscopia', '(66) 99959-1503', null),
('Instituto de Cardiologia', 'Cardiologia clínica e exames cardíacos', '(66) 99957-9369', null),
('Intercor', 'Exames cardiológicos', '(66) 99999-2749', null),
('Clínica JC Work', 'EEG (Eletroencefalograma)', '(66) 99910-1704', null),
('Clínica Bonviv Sono', 'Polissonografia, Estudo do Sono', '(66) 99931-5633', null),
('Clínica Dr. Nerval', 'ENMG (Eletroneuromiografia)', '(66) 3544-4088', null),
('Clínica COG - Dr. Rodrigo Cruz', 'Exames neurológicos', '(66) 99641-0263', null),
('Dra. Maria Cristina (GO)', 'Histerossalpingografia, US morfológico obstétrico', '(66) 99282-5635', 'Especialista em obstetrícia e ginecologia'),
('Dra. Dorzelina (Cardiologista)', 'Consulta e exames cardiológicos', '(66) 99995-2451', null)
on conflict do nothing;

-- ============================================================
-- CONFLITO DE EXAMES: Mamografia + US Mamas
-- ============================================================
do $$
declare
  id_mamografia uuid;
  id_us_mamas uuid;
begin
  select id into id_mamografia from exames where nome = 'Mamografia Digital Bilateral' limit 1;
  select id into id_us_mamas from exames where nome = 'US Mamas e Axilas' limit 1;

  if id_mamografia is not null and id_us_mamas is not null then
    insert into exame_conflitos (exame_id1, exame_id2, aviso)
    values (id_mamografia, id_us_mamas, 'Se Mamografia e US de Mamas forem feitos no mesmo dia, a MAMOGRAFIA deve ser realizada PRIMEIRO.')
    on conflict do nothing;
  end if;
end $$;

-- ============================================================
-- EXAMES COM SEDAÇÃO
-- ============================================================
do $$
declare
  exame_id uuid;
  exames_sedacao_nomes text[] := ARRAY[
    'Enterotomografia',
    'Enterorressonância',
    'RM Multiparamétrica de Próstata'
  ];
  nome_exame text;
begin
  foreach nome_exame in array exames_sedacao_nomes loop
    select id into exame_id from exames where nome = nome_exame limit 1;
    if exame_id is not null then
      update exames set requer_sedacao = true where id = exame_id;
      insert into exames_sedacao (exame_id, indicacoes, restricoes)
      values (exame_id, 'Pacientes ansiosos ou que não conseguem permanecer imóveis durante o exame. Crianças acima de 2 anos.', 'Somente agendado pela enfermeira Francieli. Taxa de anestesista: R$ 800 (até 2 exames) / R$ 1.600 (acima de 2). Sedação: R$ 483. Crianças menores de 2 anos não são atendidas.')
      on conflict do nothing;
    end if;
  end loop;
end $$;
