-- ============================================
-- Migration 003: Store the rich DSA transparency fields Meta returns
-- for EU-reaching ads, plus the full platform list.
-- Run in Supabase SQL Editor (idempotent)
-- ============================================

ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS eu_total_reach INT,
  ADD COLUMN IF NOT EXISTS target_ages JSONB,
  ADD COLUMN IF NOT EXISTS target_gender TEXT,
  ADD COLUMN IF NOT EXISTS target_locations JSONB,
  ADD COLUMN IF NOT EXISTS languages JSONB,
  ADD COLUMN IF NOT EXISTS link_caption TEXT,
  ADD COLUMN IF NOT EXISTS link_description TEXT,
  ADD COLUMN IF NOT EXISTS demographic_breakdown JSONB,
  ADD COLUMN IF NOT EXISTS publisher_platforms JSONB;
