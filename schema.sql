
-- ==========================================================
-- SCRIPT DE INICIALIZAÇÃO: PIZZARIA MASTER RESERVE (ATUALIZADO)
-- Execute este script no SQL Editor do seu projeto Supabase
-- ==========================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TIPOS ENUMERADOS
DO $$ BEGIN
    CREATE TYPE public.table_status AS ENUM ('livre', 'ocupada', 'reservada');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('operador', 'super_admin');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 3. TABELA DE PERFIS
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT,
  role public.user_role DEFAULT 'operador' NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. TABELA DE MESAS
CREATE TABLE IF NOT EXISTS public.mesas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero INTEGER UNIQUE NOT NULL,
  capacidade INTEGER NOT NULL DEFAULT 4,
  status public.table_status DEFAULT 'livre' NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. TABELA DE RESERVAS
CREATE TABLE IF NOT EXISTS public.reservas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mesa_id UUID REFERENCES public.mesas(id) ON DELETE CASCADE NOT NULL,
  nome_cliente TEXT NOT NULL,
  contato TEXT,
  num_pessoas INTEGER NOT NULL DEFAULT 1,
  data_reserva DATE NOT NULL DEFAULT CURRENT_DATE,
  hora_inicio TIME NOT NULL,
  status TEXT DEFAULT 'ativa',
  criado_por UUID REFERENCES auth.users(id),
  criado_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. SEGURANÇA
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;

-- 7. POLÍTICAS (MODIFICADAS PARA MVP)
DROP POLICY IF EXISTS "Ver perfis" ON public.profiles;
CREATE POLICY "Ver perfis" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Super admin atualiza perfis" ON public.profiles;
CREATE POLICY "Super admin atualiza perfis" ON public.profiles FOR UPDATE USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
);

DROP POLICY IF EXISTS "Acesso total mesas para autenticados" ON public.mesas;
CREATE POLICY "Acesso total mesas para autenticados" ON public.mesas 
FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "Gerenciamento de reservas para autenticados" ON public.reservas;
CREATE POLICY "Gerenciamento de reservas para autenticados" ON public.reservas 
FOR ALL TO authenticated USING (true);

-- 8. REALTIME
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'mesas') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.mesas;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'reservas') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reservas;
  END IF;
END $$;

-- 9. TRIGGERS
CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ language 'plpgsql';

CREATE TRIGGER tr_update_mesas_time BEFORE UPDATE ON public.mesas FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER tr_update_profiles_time BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 10. TRIGGER PERFIL AUTOMÁTICO
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (new.id, split_part(new.email, '@', 1), new.email,
    CASE 
      WHEN new.email = 'natashjaabreu@hotmail.com' OR new.email = 'andersonacionalsat@gmail.com' THEN 'super_admin'::public.user_role 
      ELSE 'operador'::public.user_role 
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 11. TABELA DE CONFIGURAÇÕES
CREATE TABLE IF NOT EXISTS public.configuracoes (
  id SERIAL PRIMARY KEY,
  chave TEXT UNIQUE NOT NULL,
  valor BOOLEAN DEFAULT false,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Inserir configuração padrão
INSERT INTO public.configuracoes (chave, valor) 
VALUES ('sistema_ativo', false)
ON CONFLICT (chave) DO NOTHING;

ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Acesso total configuracoes para autenticados" ON public.configuracoes;
CREATE POLICY "Acesso total configuracoes para autenticados" ON public.configuracoes 
FOR ALL TO authenticated USING (true);

-- Adicionar ao Realtime
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'configuracoes') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.configuracoes;
  END IF;
END $$;
