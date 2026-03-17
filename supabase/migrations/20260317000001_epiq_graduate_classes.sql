-- Graduate Class Redistribution (applied via scripts/migrate-graduate-classes.js)
-- 
-- Reduces 167 Graduates to 75 across 5 classes of 15 (Class of 2022-2026).
-- Remaining 92 graduates are archived.
--
-- Uses existing columns (no DDL required):
--   cohort_label  → "Class of 20XX" for active, "Archived" for archived
--   narrative     → NULL for active, 'ARCHIVED' for archived
--
-- Score distribution by class:
--   Class of 2026: mean=68, range=[60–76]  — tight, moderate-to-high (current)
--   Class of 2025: mean=55, range=[38–74]  — wide spread (recent grads)
--   Class of 2024: mean=72, range=[62–82]  — higher baseline (mature)
--   Class of 2023: mean=78, range=[72–84]  — tight high cluster (established)
--   Class of 2022: mean=60, range=[40–80]  — widest range (senior alumni)
--
-- Applied: 2026-03-17
-- Script: scripts/migrate-graduate-classes.js

-- This migration was run programmatically via Supabase JS client.
-- The SQL below documents the equivalent operations for reference.

-- Mark all graduates as archived
-- UPDATE public.epiq_profiles SET narrative = 'ARCHIVED', cohort_label = 'Archived' WHERE role = 'Graduate';

-- Assign first 75 graduates (by id order) to 5 classes, un-archive
-- For each of 5 classes, take 15 profiles:
--   1. SET cohort_label = 'Class of 20XX', narrative = NULL
--   2. Scale attribute scores toward class target center
--   3. Update Graduate-period history row to match new pillar averages
