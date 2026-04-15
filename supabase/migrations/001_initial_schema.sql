-- Criação da tabela de Perfis
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  avatar_url TEXT,
  api_key_anthropic TEXT,
  api_key_openai TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criação da tabela Brand Kits
CREATE TABLE public.brand_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  primary_color TEXT,
  secondary_color TEXT,
  accent_color TEXT,
  font_title TEXT,
  font_body TEXT,
  tone_of_voice TEXT,
  logo_url TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enumeração para formatos de projeto
CREATE TYPE public.project_format AS ENUM ('carousel', 'post', 'story', 'video_16_9', 'video_9_16', 'caption');

-- Enumeração para status de projeto
CREATE TYPE public.project_status AS ENUM ('draft', 'generating', 'rendering', 'ready', 'error');

-- Criação da tabela de Projetos
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  brand_kit_id UUID REFERENCES public.brand_kits(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  format public.project_format NOT NULL,
  status public.project_status DEFAULT 'draft' NOT NULL,
  command TEXT,
  content_data JSONB,
  slides_urls JSONB,
  video_url TEXT,
  thumbnail_url TEXT,
  caption_text TEXT,
  hashtags TEXT[],
  render_progress INTEGER DEFAULT 0 CHECK (render_progress >= 0 AND render_progress <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS: profiles
CREATE POLICY "Usuários podem visualizar seus próprios perfis" 
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seus próprios perfis" 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Políticas de RLS: brand_kits
CREATE POLICY "Usuários podem gerenciar seus próprios brand kits" 
  ON public.brand_kits FOR ALL USING (auth.uid() = user_id);

-- Políticas de RLS: projects
CREATE POLICY "Usuários podem gerenciar seus próprios projetos" 
  ON public.projects FOR ALL USING (auth.uid() = user_id);

-- Função e Trigger para Auto-Atualização do campo updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_updated_at_brand_kits
  BEFORE UPDATE ON public.brand_kits
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at_projects
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Função e Trigger para Auto-criar Perfil na criação de Usuário da Autenticação
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Índices de Performance: Ordenados por Criação para Buscas Recentes Rápidas
CREATE INDEX idx_brand_kits_user_id_created_at ON public.brand_kits (user_id, created_at DESC);
CREATE INDEX idx_projects_user_id_created_at ON public.projects (user_id, created_at DESC);
