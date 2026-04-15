-- Adiciona coluna para snapshot anterior (suporte ao botão Desfazer)
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS previous_content_data JSONB;
