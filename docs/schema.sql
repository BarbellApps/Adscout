-- ============================================
-- AdScout Database Schema
-- Run in Supabase SQL Editor (in order)
-- ============================================

-- ---- TABLES ----

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'starter', 'premium', 'pro')),
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'past_due')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  canvas_credits_remaining INT DEFAULT 0,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  page_name TEXT NOT NULL,
  page_id TEXT,
  platform TEXT DEFAULT 'facebook' CHECK (platform IN ('facebook', 'instagram', 'tiktok', 'other')),
  added_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
  platform TEXT DEFAULT 'facebook' CHECK (platform IN ('facebook', 'instagram', 'tiktok', 'other')),
  -- Source-provided id (e.g. Meta ad_archive_id) for dedup on re-sync. Null
  -- for manual_capture ads, which have no stable upstream identifier.
  external_id TEXT UNIQUE,
  headline TEXT,
  body_copy TEXT,
  media_url TEXT,
  hook TEXT,
  angle TEXT,
  cta TEXT,
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  runtime_days INT DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  -- DSA transparency fields, present for EU-reaching ads via graph_api
  eu_total_reach INT,
  target_ages JSONB,
  target_gender TEXT,
  target_locations JSONB,
  languages JSONB,
  link_caption TEXT,
  link_description TEXT,
  demographic_breakdown JSONB,
  publisher_platforms JSONB,
  source TEXT DEFAULT 'manual_capture' CHECK (source IN ('graph_api', 'manual_capture', 'scraped')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID REFERENCES public.ads(id) ON DELETE SET NULL,
  industry TEXT,
  format TEXT,
  canva_url TEXT,
  figma_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.collection_ads (
  collection_id UUID REFERENCES public.collections(id) ON DELETE CASCADE,
  ad_id UUID REFERENCES public.ads(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (collection_id, ad_id)
);

CREATE TABLE public.canvas_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.canvas_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_project_id UUID REFERENCES public.canvas_projects(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  credits_used INT DEFAULT 0,
  -- Structured text output (hook/angle/body/cta) for script generations.
  content JSONB,
  -- Reserved for image/video model outputs once those adapters exist.
  output_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.canvas_generation_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canvas_generation_id UUID REFERENCES public.canvas_generations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.credit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  delta INT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- api_keys: for the Chrome extension. Only a SHA-256 hash of the key is
-- stored; the plaintext key is shown to the user exactly once at creation.
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  key_hash TEXT NOT NULL UNIQUE,
  label TEXT DEFAULT 'Chrome extension',
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ---- GRANTS ----
-- RLS policies alone do nothing without base table privileges — Postgres
-- checks both. Supabase's dashboard grants these automatically for tables
-- created through its UI; raw SQL (e.g. via psql or the SQL editor) does
-- not, so every table would otherwise be unreachable via the API even with
-- correct RLS policies in place.

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;

-- The users table is write-locked for the authenticated role: tier,
-- status, credits, and is_admin are privileged fields that must only be
-- changed by server routes using the service-role key. Users can read
-- their own row (SELECT policy below); all writes bypass RLS via service
-- role. See migration 001.
REVOKE INSERT, UPDATE, DELETE ON public.users FROM authenticated;

-- ---- ROW LEVEL SECURITY ----

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvas_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvas_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canvas_generation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;

-- SELECT only — privileged writes go through service-role server routes.
CREATE POLICY "Users: read own row" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Brands: own data" ON public.brands
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Ads: via own brand" ON public.ads
  FOR ALL USING (
    brand_id IS NULL OR EXISTS (
      SELECT 1 FROM public.brands WHERE brands.id = ads.brand_id AND brands.user_id = auth.uid()
    )
  );

CREATE POLICY "Templates: readable by all authenticated users" ON public.templates
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Collections: own data" ON public.collections
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Collection ads: via own collection" ON public.collection_ads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.collections WHERE collections.id = collection_ads.collection_id AND collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Canvas projects: own data" ON public.canvas_projects
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Canvas generations: via own project" ON public.canvas_generations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.canvas_projects WHERE canvas_projects.id = canvas_generations.canvas_project_id AND canvas_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Canvas generation notes: via own project" ON public.canvas_generation_notes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.canvas_generations
      JOIN public.canvas_projects ON canvas_projects.id = canvas_generations.canvas_project_id
      WHERE canvas_generations.id = canvas_generation_notes.canvas_generation_id
      AND canvas_projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Credit ledger: own data" ON public.credit_ledger
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "API keys: own data" ON public.api_keys
  FOR ALL USING (auth.uid() = user_id);

-- ---- NEW USER TRIGGER ----

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---- REALTIME ----
-- Powers live team annotation on Canvas generations.
ALTER PUBLICATION supabase_realtime ADD TABLE public.canvas_generation_notes;
