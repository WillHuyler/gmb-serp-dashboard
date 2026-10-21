-- CR-001 / AB-001: Supabase AUTH + RLS contract discovery
-- READ-ONLY METADATA QUERIES. 2026-10-21.
-- Run ONLY after owner-authorized Supabase access is connected.
-- No DDL, DML, secrets, client records, account tokens, or auth.users row data.
-- Execute each SELECT separately if SQL editor only displays one result set.
--
-- DO NOT paste any secrets/connection strings into GitHub or ChatGPT.
-- The output is metadata, but review before sharing to avoid exposing
-- application-specific confidential policy expressions.

-- Q1: Public/auth table inventory and whether RLS is enabled and forced.
SELECT
  ns.nspname AS schema_name,
  tbl.relname AS table_name,
  tbl.relrowsecurity AS rls_enabled,
  tbl.relforcerowsecurity AS force_rls
FROM pg_catalog.pg_class AS tbl
JOIN pg_catalog.pg_namespace AS ns ON ns.oid = tbl.relnamespace
WHERE ns.nspname IN ('public', 'auth')
  AND tbl.relkind IN ('r', 'p')
ORDER BY ns.nspname, tbl.relname;

-- Q2: All declared RLS policies for application/public tables.
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_catalog.pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Q3: Public table columns. Metadata only: NO business/customer row values.
SELECT
  table_schema,
  table_name,
  ordinal_position,
  column_name,
  data_type,
  udt_name,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
ORDER BY table_name, ordinal_position;

-- Q4: Primary keys, foreign keys, unique and check constraints.
SELECT
  ns.nspname AS schema_name,
  tbl.relname AS table_name,
  con.conname AS constraint_name,
  con.contype AS constraint_type,
  pg_catalog.pg_get_constraintdef(con.oid) AS definition
FROM pg_catalog.pg_constraint AS con
JOIN pg_catalog.pg_class AS tbl ON tbl.oid = con.conrelid
JOIN pg_catalog.pg_namespace AS ns ON ns.oid = tbl.relnamespace
WHERE ns.nspname = 'public'
ORDER BY tbl.relname, con.conname;

-- Q5: GRANTs for the anon and authenticated PostgreSQL roles.
SELECT
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, table_name, privilege_type;

-- Q6: Catalog user-facing/public functions by name and arguments
-- (avoid reading function body, which could contain implementation secrets).
SELECT
  ns.nspname AS schema_name,
  proc.proname AS function_name,
  pg_catalog.pg_get_function_identity_arguments(proc.oid) AS identity_arguments,
  pg_catalog.pg_get_userbyid(proc.proowner) AS owner_role,
  proc.prosecdef AS security_definer
FROM pg_catalog.pg_proc AS proc
JOIN pg_catalog.pg_namespace AS ns ON ns.oid = proc.pronamespace
WHERE ns.nspname = 'public'
ORDER BY proc.proname;

-- Q7: Verify whether role membership/tenant columns exist and in which tables.
-- This identifies candidates; it does NOT certify membership semantics.
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (
    column_name IN ('tenant_id', 'organization_id', 'user_id', 'auth_user_id',
                    'client_id', 'role', 'status', 'is_active')
    OR table_name ILIKE '%member%'
    OR table_name ILIKE '%tenant%'
    OR table_name ILIKE '%organization%'
  )
ORDER BY table_name, ordinal_position;

-- Q8: Identify public views and whether a view requires extra evaluation
-- for SECURITY INVOKER or possible bypass concerns.
SELECT table_schema, table_name, view_definition
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- End of read-only inspection: confirm Auth provider (Supabase Auth vs external
-- session) separately from application runtime/config. RLS metadata alone is
-- not proof of safe access; execute approved negative-path tests with two
-- non-production tenants before implementation approval.
