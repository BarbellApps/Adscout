-- ============================================
-- Migration 002: Track whether a synced ad is still running
-- Run in Supabase SQL Editor (idempotent)
-- ============================================

-- Meta's ads_archive omits ad_delivery_stop_time for ads that are still
-- running. The sync route previously discarded that signal (defaulting
-- last_seen to "now" either way), so the Scout UI had no real way to show
-- an active/inactive breakdown. Store it explicitly.
ALTER TABLE public.ads
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;
