
-- ==========================================================
-- SCRIPT DE INICIALIZAÇÃO: PIZZARIA MASTER RESERVE - MULTI-TENANT
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
    CREATE TYPE public.user_role AS ENUM ('operador', 'admin_restaurante', 'super_admin');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 3. TABELA DE RESTAURANTES
CREATE TABLE IF NOT EXISTS public.restaurantes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  endereco TEXT,
  telefone TEXT,
  email TEXT,
  logo_url TEXT,
  cor_primaria TEXT DEFAULT '#f59e0b',
  cor_secundaria TEXT DEFAULT '#374151',
  ativo BOOLEAN DEFAULT true NOT NULL,
  criado_por UUID REFERENCES auth.users(id),
  criado_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. TABELA DE PERFIS (ATUALIZADA)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT,
  role public.user_role DEFAULT 'operador' NOT NULL,
  restaurante_id UUID REFERENCES public.restaurantes(id) ON DELETE CASCADE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. TABELA DE MESAS (ATUALIZADA)
CREATE TABLE IF NOT EXISTS public.mesas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurante_id UUID REFERENCES public.restaurantes(id) ON DELETE CASCADE NOT NULL,
  numero INTEGER NOT NULL,
  capacidade INTEGER NOT NULL DEFAULT 4,
  status public.table_status DEFAULT 'livre' NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(restaurante_id, numero)
);

-- 6. TABELA DE RESERVAS (ATUALIZADA)
CREATE TABLE IF NOT EXISTS public.reservas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurante_id UUID REFERENCES public.restaurantes(id) ON DELETE CASCADE NOT NULL,
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

-- 7. MIGRAÇÃO PARA TABELAS EXISTENTES (SINGLE-TENANT -> MULTI-TENANT)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS restaurante_id UUID REFERENCES public.restaurantes(id) ON DELETE CASCADE;
ALTER TABLE public.mesas ADD COLUMN IF NOT EXISTS restaurante_id UUID REFERENCES public.restaurantes(id) ON DELETE CASCADE;
ALTER TABLE public.reservas ADD COLUMN IF NOT EXISTS restaurante_id UUID REFERENCES public.restaurantes(id) ON DELETE CASCADE;
ALTER TABLE public.restaurantes ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true NOT NULL;

-- Se existir restaurante default, atualize dados antigos (ajuste slug se necessário)
UPDATE public.profiles SET restaurante_id = (SELECT id FROM public.restaurantes WHERE slug = 'rainha-das-pizzas' LIMIT 1) WHERE restaurante_id IS NULL AND role != 'super_admin';
UPDATE public.mesas SET restaurante_id = (SELECT id FROM public.restaurantes WHERE slug = 'rainha-das-pizzas' LIMIT 1) WHERE restaurante_id IS NULL;
UPDATE public.reservas SET restaurante_id = (SELECT id FROM public.restaurantes WHERE slug = 'rainha-das-pizzas' LIMIT 1) WHERE restaurante_id IS NULL;

-- 8. TABELA DE CONFIGURAÇÕES POR RESTAURANTE
CREATE TABLE IF NOT EXISTS public.configuracoes_restaurante (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurante_id UUID REFERENCES public.restaurantes(id) ON DELETE CASCADE NOT NULL,
  chave TEXT NOT NULL,
  valor TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(restaurante_id, chave)
);

-- 9. SEGURANÇA - HABILITAR RLS
ALTER TABLE public.restaurantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes_restaurante ENABLE ROW LEVEL SECURITY;

-- 9. POLÍTICAS RLS

-- Restaurantes: Super admin vê todos, outros só os seus
DROP POLICY IF EXISTS "Super admin vê todos restaurantes" ON public.restaurantes;
CREATE POLICY "Super admin vê todos restaurantes" ON public.restaurantes FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
);

DROP POLICY IF EXISTS "Admin restaurante vê seu restaurante" ON public.restaurantes;
CREATE POLICY "Admin restaurante vê seu restaurante" ON public.restaurantes FOR SELECT USING (
  id = (SELECT restaurante_id FROM public.profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Super admin gerencia restaurantes" ON public.restaurantes;
CREATE POLICY "Super admin gerencia restaurantes" ON public.restaurantes FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
);

-- Perfis: Super admin vê todos, outros só do seu restaurante
DROP POLICY IF EXISTS "Super admin vê todos perfis" ON public.profiles;
CREATE POLICY "Super admin vê todos perfis" ON public.profiles FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
);

DROP POLICY IF EXISTS "Usuários vêem perfis do seu restaurante" ON public.profiles;
CREATE POLICY "Usuários vêem perfis do seu restaurante" ON public.profiles FOR SELECT USING (
  restaurante_id = (SELECT restaurante_id FROM public.profiles WHERE id = auth.uid())
);

DROP POLICY IF EXISTS "Super admin gerencia perfis" ON public.profiles;
CREATE POLICY "Super admin gerencia perfis" ON public.profiles FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
);

DROP POLICY IF EXISTS "Admin restaurante gerencia perfis do restaurante" ON public.profiles;
CREATE POLICY "Admin restaurante gerencia perfis do restaurante" ON public.profiles FOR ALL USING (
  restaurante_id = (SELECT restaurante_id FROM public.profiles WHERE id = auth.uid()) AND
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin_restaurante', 'super_admin')
);

-- Mesas: Só do restaurante do usuário
DROP POLICY IF EXISTS "Acesso mesas do restaurante" ON public.mesas;
CREATE POLICY "Acesso mesas do restaurante" ON public.mesas FOR ALL USING (
  restaurante_id = (SELECT restaurante_id FROM public.profiles WHERE id = auth.uid())
);

-- Reservas: Só do restaurante do usuário
DROP POLICY IF EXISTS "Acesso reservas do restaurante" ON public.reservas;
CREATE POLICY "Acesso reservas do restaurante" ON public.reservas FOR ALL USING (
  restaurante_id = (SELECT restaurante_id FROM public.profiles WHERE id = auth.uid())
);

-- Configurações: Só do restaurante do usuário
DROP POLICY IF EXISTS "Acesso config do restaurante" ON public.configuracoes_restaurante;
CREATE POLICY "Acesso config do restaurante" ON public.configuracoes_restaurante FOR ALL USING (
  restaurante_id = (SELECT restaurante_id FROM public.profiles WHERE id = auth.uid())
);

-- 10. REALTIME
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'restaurantes') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.restaurantes;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'mesas') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.mesas;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'reservas') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reservas;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'configuracoes_restaurante') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.configuracoes_restaurante;
  END IF;
END $$;

-- 11. TRIGGERS
CREATE OR REPLACE FUNCTION public.handle_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ language 'plpgsql';

CREATE TRIGGER tr_update_restaurantes_time BEFORE UPDATE ON public.restaurantes FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER tr_update_mesas_time BEFORE UPDATE ON public.mesas FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER tr_update_profiles_time BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER tr_update_reservas_time BEFORE UPDATE ON public.reservas FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
CREATE TRIGGER tr_update_config_time BEFORE UPDATE ON public.configuracoes_restaurante FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 12. TRIGGER PERFIL AUTOMÁTICO (ATUALIZADO)
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

-- 13. TRIGGER PARA CONFIGURAÇÃO PADRÃO DO RESTAURANTE
CREATE OR REPLACE FUNCTION public.handle_new_restaurante() RETURNS TRIGGER AS $$
BEGIN
  -- Inserir configuração padrão de sistema ativo
  INSERT INTO public.configuracoes_restaurante (restaurante_id, chave, valor)
  VALUES (new.id, 'sistema_ativo', 'false');

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_restaurante_created AFTER INSERT ON public.restaurantes FOR EACH ROW EXECUTE PROCEDURE public.handle_new_restaurante();

-- 14. DADOS INICIAIS (REMOVER APÓS TESTES)
-- Criar restaurante de exemplo para desenvolvimento
INSERT INTO public.restaurantes (nome, slug, endereco, telefone, email, criado_por)
VALUES ('Rainha das Pizzas', 'rainha-das-pizzas', 'Rua das Pizzas, 123', '(11) 99999-9999', 'contato@rainhadaspizzas.com', null)
ON CONFLICT (slug) DO NOTHING;
