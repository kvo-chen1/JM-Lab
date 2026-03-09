--
-- PostgreSQL database dump
--

\restrict mqUtBBP7a73wMfvfkZVpJ4TDFpKxABIyr5oP0jgY1doPRpLbV2n5aD9yZ4GUeWA

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;
--
-- PostgreSQL database dump
--

\restrict mqUtBBP7a73wMfvfkZVpJ4TDFpKxABIyr5oP0jgY1doPRpLbV2n5aD9yZ4GUeWA

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA auth;


ALTER SCHEMA auth OWNER TO supabase_admin;

--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA extensions;


ALTER SCHEMA extensions OWNER TO postgres;

--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql;


ALTER SCHEMA graphql OWNER TO supabase_admin;

--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql_public;


ALTER SCHEMA graphql_public OWNER TO supabase_admin;

--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: pgbouncer
--

CREATE SCHEMA pgbouncer;


ALTER SCHEMA pgbouncer OWNER TO pgbouncer;

--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA realtime;


ALTER SCHEMA realtime OWNER TO supabase_admin;

--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA storage;


ALTER SCHEMA storage OWNER TO supabase_admin;

--
-- Name: supabase_migrations; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA supabase_migrations;


ALTER SCHEMA supabase_migrations OWNER TO postgres;

--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA vault;


ALTER SCHEMA vault OWNER TO supabase_admin;

--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;


--
-- Name: EXTENSION pg_graphql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_graphql IS 'pg_graphql: GraphQL support';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


ALTER TYPE auth.aal_level OWNER TO supabase_auth_admin;

--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


ALTER TYPE auth.code_challenge_method OWNER TO supabase_auth_admin;

--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


ALTER TYPE auth.factor_status OWNER TO supabase_auth_admin;

--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


ALTER TYPE auth.factor_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_authorization_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


ALTER TYPE auth.oauth_authorization_status OWNER TO supabase_auth_admin;

--
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_client_type AS ENUM (
    'public',
    'confidential'
);


ALTER TYPE auth.oauth_client_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


ALTER TYPE auth.oauth_registration_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_response_type AS ENUM (
    'code'
);


ALTER TYPE auth.oauth_response_type OWNER TO supabase_auth_admin;

--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


ALTER TYPE auth.one_time_token_type OWNER TO supabase_auth_admin;

--
-- Name: action; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


ALTER TYPE realtime.action OWNER TO supabase_admin;

--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);


ALTER TYPE realtime.equality_op OWNER TO supabase_admin;

--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


ALTER TYPE realtime.user_defined_filter OWNER TO supabase_admin;

--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


ALTER TYPE realtime.wal_column OWNER TO supabase_admin;

--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


ALTER TYPE realtime.wal_rls OWNER TO supabase_admin;

--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


ALTER TYPE storage.buckettype OWNER TO supabase_storage_admin;

--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


ALTER FUNCTION auth.email() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


ALTER FUNCTION auth.jwt() OWNER TO supabase_auth_admin;

--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


ALTER FUNCTION auth.role() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


ALTER FUNCTION auth.uid() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_cron_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


ALTER FUNCTION extensions.grant_pg_graphql_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_net_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_ddl_watch() OWNER TO supabase_admin;

--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_drop_watch() OWNER TO supabase_admin;

--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


ALTER FUNCTION extensions.set_graphql_placeholder() OWNER TO supabase_admin;

--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: supabase_admin
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
  BEGIN
      RAISE DEBUG 'PgBouncer auth request: %', p_usename;

      RETURN QUERY
      SELECT
          rolname::text,
          CASE WHEN rolvaliduntil < now()
              THEN null
              ELSE rolpassword::text
          END
      FROM pg_authid
      WHERE rolname=$1 and rolcanlogin;
  END;
  $_$;


ALTER FUNCTION pgbouncer.get_auth(p_usename text) OWNER TO supabase_admin;

--
-- Name: add_revenue_record(uuid, numeric, text, text, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.add_revenue_record(p_user_id uuid, p_amount numeric, p_type text, p_description text DEFAULT NULL::text, p_work_id uuid DEFAULT NULL::uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_record_id UUID;
BEGIN
    -- 验证类型
    IF p_type NOT IN ('ads', 'sponsorship', 'tipping', 'membership', 'task', 'withdrawal') THEN
        RAISE EXCEPTION 'Invalid revenue type: %', p_type;
    END IF;

    -- 插入收入记录
    INSERT INTO public.revenue_records (
        user_id,
        amount,
        type,
        description,
        work_id,
        status
    ) VALUES (
        p_user_id,
        p_amount,
        p_type,
        COALESCE(p_description, 
            CASE p_type
                WHEN 'ads' THEN '广告分成收入'
                WHEN 'sponsorship' THEN '品牌合作收入'
                WHEN 'tipping' THEN '粉丝打赏'
                WHEN 'membership' THEN '会员订阅收入'
                WHEN 'task' THEN '任务奖励'
                WHEN 'withdrawal' THEN '提现'
            END
        ),
        p_work_id,
        'completed'
    )
    RETURNING id INTO v_record_id;

    -- 更新创作者总收入
    INSERT INTO public.creator_revenue (
        user_id,
        total_revenue,
        withdrawable_revenue
    ) VALUES (
        p_user_id,
        p_amount,
        p_amount
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
        total_revenue = public.creator_revenue.total_revenue + p_amount,
        withdrawable_revenue = public.creator_revenue.withdrawable_revenue + p_amount,
        updated_at = NOW();

    RETURN v_record_id;
END;
$$;


ALTER FUNCTION public.add_revenue_record(p_user_id uuid, p_amount numeric, p_type text, p_description text, p_work_id uuid) OWNER TO postgres;

--
-- Name: add_test_revenue_record(uuid, numeric, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.add_test_revenue_record(p_user_id uuid, p_amount numeric DEFAULT 100.00, p_type text DEFAULT 'ads'::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_record_id UUID;
BEGIN
    v_record_id := public.add_revenue_record(
        p_user_id,
        p_amount,
        p_type,
        '测试收入记录'
    );
    
    RETURN jsonb_build_object(
        'success', true,
        'record_id', v_record_id,
        'amount', p_amount,
        'type', p_type
    );
END;
$$;


ALTER FUNCTION public.add_test_revenue_record(p_user_id uuid, p_amount numeric, p_type text) OWNER TO postgres;

--
-- Name: aggregate_user_realtime_features(uuid, interval); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.aggregate_user_realtime_features(p_user_id uuid, p_time_window interval DEFAULT '01:00:00'::interval) RETURNS TABLE(view_count integer, click_count integer, like_count integer, avg_dwell_time integer, top_categories jsonb, top_tags jsonb)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    WITH user_events AS (
        SELECT 
            event_type,
            metadata,
            created_at
        FROM user_behavior_events
        WHERE user_id = p_user_id
            AND created_at >= NOW() - p_time_window
    ),
    event_stats AS (
        SELECT
            COUNT(*) FILTER (WHERE event_type = 'view') as view_count,
            COUNT(*) FILTER (WHERE event_type = 'click') as click_count,
            COUNT(*) FILTER (WHERE event_type = 'like') as like_count,
            AVG((metadata->>'dwellTime')::INTEGER) FILTER (WHERE event_type = 'dwell') as avg_dwell_time
        FROM user_events
    )
    SELECT 
        es.view_count::INTEGER,
        es.click_count::INTEGER,
        es.like_count::INTEGER,
        COALESCE(es.avg_dwell_time, 0)::INTEGER,
        '{}'::JSONB as top_categories,
        '{}'::JSONB as top_tags
    FROM event_stats es;
END;
$$;


ALTER FUNCTION public.aggregate_user_realtime_features(p_user_id uuid, p_time_window interval) OWNER TO postgres;

--
-- Name: audit_promotion_application(uuid, text, text, text, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.audit_promotion_application(p_application_id uuid, p_action text, p_notes text, p_reason text, p_performed_by uuid) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_application RECORD;
    v_new_status TEXT;
    v_permissions JSONB;
BEGIN
    SELECT * INTO v_application FROM public.promotion_applications WHERE id = p_application_id;
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    CASE p_action
        WHEN 'approve' THEN
            v_new_status := 'approved';
            v_permissions := jsonb_build_object(
                'can_create_orders', true,
                'can_use_coupons', true,
                'max_daily_budget', 10000,
                'allowed_package_types', jsonb_build_array('standard', 'basic', 'long', 'custom'),
                'commission_rate', 0.1
            );
        WHEN 'reject' THEN
            v_new_status := 'rejected';
            v_permissions := '{}'::jsonb;
        WHEN 'suspend' THEN
            v_new_status := 'suspended';
            v_permissions := v_application.promotion_permissions;
        ELSE
            RETURN false;
    END CASE;
    
    UPDATE public.promotion_applications
    SET 
        status = v_new_status,
        reviewed_by = p_performed_by,
        reviewed_at = NOW(),
        review_notes = p_notes,
        rejection_reason = CASE WHEN p_action = 'reject' THEN p_reason ELSE NULL END,
        promotion_permissions = v_permissions,
        approved_at = CASE WHEN p_action = 'approve' THEN NOW() ELSE approved_at END,
        updated_at = NOW()
    WHERE id = p_application_id;
    
    PERFORM log_promotion_audit(
        p_application_id, v_application.user_id, p_action,
        v_application.status, v_new_status, p_notes, p_reason, p_performed_by,
        jsonb_build_object('permissions', v_permissions)
    );
    
    PERFORM send_promotion_notification(
        v_application.user_id,
        CASE p_action
            WHEN 'approve' THEN 'application_approved'
            WHEN 'reject' THEN 'application_rejected'
            ELSE 'system_notice'
        END,
        CASE p_action
            WHEN 'approve' THEN '推广申请已通过'
            WHEN 'reject' THEN '推广申请未通过'
            ELSE '推广账号状态变更'
        END,
        CASE p_action
            WHEN 'approve' THEN '恭喜！您的推广用户申请已通过审核，现在可以开始使用推广功能了。'
            WHEN 'reject' THEN '很遗憾，您的推广用户申请未通过审核。原因：' || COALESCE(p_reason, '未提供')
            ELSE '您的推广账号状态已变更为：' || v_new_status
        END,
        p_application_id, 'application'
    );
    
    RETURN true;
END;
$$;


ALTER FUNCTION public.audit_promotion_application(p_application_id uuid, p_action text, p_notes text, p_reason text, p_performed_by uuid) OWNER TO postgres;

--
-- Name: audit_promotion_order(uuid, boolean, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.audit_promotion_order(p_order_id uuid, p_approved boolean, p_notes text DEFAULT ''::text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_order RECORD;
    v_package_duration INTEGER;
    v_target_views INTEGER;
    v_promotion_weight DECIMAL(10, 2);
BEGIN
    -- 获取订单信息
    SELECT * INTO v_order FROM public.promotion_orders WHERE id = p_order_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION '订单不存在';
    END IF;
    
    IF v_order.status != 'paid' THEN
        RAISE EXCEPTION '订单状态不正确，无法审核';
    END IF;
    
    -- 根据套餐类型设置参数
    CASE v_order.package_type
        WHEN 'standard' THEN
            v_package_duration := 24;
            v_target_views := 1000;
            v_promotion_weight := 1.0;
        WHEN 'basic' THEN
            v_package_duration := 24;
            v_target_views := 2500;
            v_promotion_weight := 1.5;
        WHEN 'long' THEN
            v_package_duration := 48;
            v_target_views := 7500;
            v_promotion_weight := 2.0;
        WHEN 'custom' THEN
            v_package_duration := 72;
            v_target_views := 15000;
            v_promotion_weight := 3.0;
        ELSE
            v_package_duration := 24;
            v_target_views := 1000;
            v_promotion_weight := 1.0;
    END CASE;
    
    IF p_approved THEN
        -- 审核通过：创建推广作品记录
        INSERT INTO public.promoted_works (
            order_id,
            work_id,
            user_id,
            package_type,
            target_type,
            metric_type,
            start_time,
            end_time,
            target_views,
            target_clicks,
            promotion_weight,
            is_featured,
            status
        ) VALUES (
            p_order_id,
            v_order.work_id,
            v_order.user_id,
            v_order.package_type,
            COALESCE(v_order.target_type, 'account'),
            COALESCE(v_order.metric_type, 'views'),
            NOW(),
            NOW() + (v_package_duration || ' hours')::INTERVAL,
            v_target_views,
            ROUND(v_target_views * 0.05),
            v_promotion_weight,
            v_order.package_type IN ('long', 'custom'),
            'active'
        );
        
        -- 更新订单状态
        UPDATE public.promotion_orders 
        SET 
            status = 'active',
            audit_notes = p_notes,
            audited_at = NOW(),
            start_time = NOW(),
            end_time = NOW() + (v_package_duration || ' hours')::INTERVAL,
            updated_at = NOW()
        WHERE id = p_order_id;
    ELSE
        -- 审核拒绝：更新订单状态
        UPDATE public.promotion_orders 
        SET 
            status = 'refunded',
            audit_notes = p_notes,
            audited_at = NOW(),
            updated_at = NOW()
        WHERE id = p_order_id;
    END IF;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING '审核订单失败: %', SQLERRM;
        RETURN FALSE;
END;
$$;


ALTER FUNCTION public.audit_promotion_order(p_order_id uuid, p_approved boolean, p_notes text) OWNER TO postgres;

--
-- Name: batch_publish_scores(uuid[], uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.batch_publish_scores(p_submission_ids uuid[], p_published_by uuid) RETURNS TABLE(submission_id uuid, success boolean, error text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_submission_id UUID;
BEGIN
    FOREACH v_submission_id IN ARRAY p_submission_ids
    LOOP
        BEGIN
            -- 检查作品是否存在且已评分
            IF NOT EXISTS (
                SELECT 1 FROM public.event_submissions 
                WHERE id = v_submission_id 
                AND status = 'submitted'
            ) THEN
                RETURN QUERY SELECT v_submission_id, FALSE, '作品不存在或未提交'::TEXT;
                CONTINUE;
            END IF;
            
            -- 更新发布状态
            UPDATE public.event_submissions
            SET is_published = TRUE,
                published_at = NOW(),
                published_by = p_published_by,
                status = 'reviewed'
            WHERE id = v_submission_id;
            
            -- 记录日志
            INSERT INTO public.score_audit_logs (submission_id, judge_id, action, comment)
            VALUES (v_submission_id, p_published_by, 'publish', '批量发布评分结果');
            
            RETURN QUERY SELECT v_submission_id, TRUE, NULL::TEXT;
        EXCEPTION WHEN OTHERS THEN
            RETURN QUERY SELECT v_submission_id, FALSE, SQLERRM::TEXT;
        END;
    END LOOP;
END;
$$;


ALTER FUNCTION public.batch_publish_scores(p_submission_ids uuid[], p_published_by uuid) OWNER TO postgres;

--
-- Name: calculate_content_hot_score(integer, integer, integer, integer, integer, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calculate_content_hot_score(p_view_count integer, p_like_count integer, p_collect_count integer, p_share_count integer, p_comment_count integer, p_created_at timestamp with time zone) RETURNS numeric
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    v_score NUMERIC;
    v_hours_since_created NUMERIC;
BEGIN
    -- 基础分数计算
    v_score := (p_view_count * 1.0) + 
               (p_like_count * 3.0) + 
               (p_collect_count * 5.0) + 
               (p_share_count * 8.0) + 
               (p_comment_count * 4.0);
    
    -- 时间衰减因子
    v_hours_since_created := EXTRACT(EPOCH FROM (NOW() - p_created_at)) / 3600;
    
    -- 应用时间衰减 (Hacker News 算法风格)
    v_score := v_score / POWER((v_hours_since_created + 2), 1.5);
    
    RETURN ROUND(v_score, 4);
END;
$$;


ALTER FUNCTION public.calculate_content_hot_score(p_view_count integer, p_like_count integer, p_collect_count integer, p_share_count integer, p_comment_count integer, p_created_at timestamp with time zone) OWNER TO postgres;

--
-- Name: calculate_content_scores(uuid, text, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calculate_content_scores(p_work_id uuid, p_content text, p_title text, p_description text) RETURNS TABLE(authenticity_score integer, ai_risk_score integer, spam_score integer, cultural_elements jsonb)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_authenticity INTEGER := 0;
    v_ai_risk INTEGER := 0;
    v_spam INTEGER := 0;
    v_cultural JSONB := '[]'::jsonb;
    v_full_text TEXT;
BEGIN
    -- 合并文本内容
    v_full_text := COALESCE(p_title, '') || ' ' || COALESCE(p_description, '') || ' ' || COALESCE(p_content, '');
    
    -- ========== 计算垃圾内容评分 ==========
    -- 检查敏感词
    IF v_full_text ~* '(暴力|色情|赌博|毒品|诈骗|反动|违禁)' THEN
        v_spam := v_spam + 40;
    END IF;
    
    -- 检查重复字符
    IF v_full_text ~ '(.)1{4,}' THEN
        v_spam := v_spam + 20;
    END IF;
    
    -- 检查链接数量
    IF array_length(regexp_matches(v_full_text, 'http', 'g'), 1) > 3 THEN
        v_spam := v_spam + 15;
    END IF;
    
    -- 检查内容长度
    IF LENGTH(v_full_text) < 20 THEN
        v_spam := v_spam + 25;
    END IF;
    
    -- 检查特殊字符比例
    IF LENGTH(regexp_replace(v_full_text, '[\w\s\u4e00-\u9fa5]', '', 'g'))::FLOAT / NULLIF(LENGTH(v_full_text), 0) > 0.3 THEN
        v_spam := v_spam + 15;
    END IF;
    
    v_spam := LEAST(v_spam, 100);
    
    -- ========== 计算 AI 生成风险评分 ==========
    -- 检查过于完美的格式
    IF v_full_text ~ '^[\u4e00-\u9fa5]+[，。！？]' AND 
       (LENGTH(regexp_replace(v_full_text, '[^，。！？]', '', 'g'))::FLOAT / NULLIF(LENGTH(v_full_text), 0)) > 0.05 THEN
        v_ai_risk := v_ai_risk + 20;
    END IF;
    
    -- 检查重复模式
    IF (SELECT COUNT(DISTINCT s) FROM unnest(string_to_array(v_full_text, '。')) s) < 
       (SELECT COUNT(*) FROM unnest(string_to_array(v_full_text, '。')) s) * 0.7 
       AND LENGTH(v_full_text) > 100 THEN
        v_ai_risk := v_ai_risk + 25;
    END IF;
    
    -- 检查过于通用的表达
    IF v_full_text ~ '(众所周知|不言而喻|总而言之|综上所述|首先.*其次.*最后)' THEN
        v_ai_risk := v_ai_risk + 15;
    END IF;
    
    v_ai_risk := LEAST(v_ai_risk, 100);
    
    -- ========== 计算真实性评分 ==========
    -- 检测文化元素
    v_cultural := '[]'::jsonb;
    
    -- 传统文化关键词
    IF v_full_text ~* '(京剧|昆曲|书法|国画|剪纸|刺绣|陶瓷|丝绸|茶道|中医|武术|太极|春节|中秋|端午|清明)' THEN
        v_authenticity := v_authenticity + 25;
        v_cultural := v_cultural || '["传统艺术"]'::jsonb;
    END IF;
    
    -- 历史文化关键词
    IF v_full_text ~* '(故宫|长城|兵马俑|敦煌|丝绸之路|大运河|颐和园|天坛|孔庙)' THEN
        v_authenticity := v_authenticity + 25;
        v_cultural := v_cultural || '["历史遗迹"]'::jsonb;
    END IF;
    
    -- 民俗文化关键词
    IF v_full_text ~* '(龙舟|舞狮|舞龙|花灯|庙会|年画|皮影|木偶戏|杂技)' THEN
        v_authenticity := v_authenticity + 20;
        v_cultural := v_cultural || '["民俗文化"]'::jsonb;
    END IF;
    
    -- 地方特色关键词
    IF v_full_text ~* '(天津|北京|上海|广州|成都|西安|杭州|苏州|南京)' THEN
        v_authenticity := v_authenticity + 15;
        v_cultural := v_cultural || '["地方文化"]'::jsonb;
    END IF;
    
    -- 手工艺关键词
    IF v_full_text ~* '(手工|工艺|匠心|传承|非遗|民间艺术|传统技艺)' THEN
        v_authenticity := v_authenticity + 15;
        v_cultural := v_cultural || '["手工艺"]'::jsonb;
    END IF;
    
    -- 内容长度加分
    IF LENGTH(v_full_text) > 200 THEN
        v_authenticity := v_authenticity + 10;
    END IF;
    
    -- 有图片/视频加分（通过描述判断）
    IF v_full_text ~* '(图|图片|视频|作品|设计|创作)' THEN
        v_authenticity := v_authenticity + 10;
    END IF;
    
    v_authenticity := LEAST(v_authenticity, 100);
    
    -- 去重文化元素
    SELECT jsonb_agg(DISTINCT elem) INTO v_cultural
    FROM jsonb_array_elements_text(v_cultural) elem;
    
    -- 返回结果
    RETURN QUERY SELECT v_authenticity, v_ai_risk, v_spam, COALESCE(v_cultural, '[]'::jsonb);
END;
$$;


ALTER FUNCTION public.calculate_content_scores(p_work_id uuid, p_content text, p_title text, p_description text) OWNER TO postgres;

--
-- Name: FUNCTION calculate_content_scores(p_work_id uuid, p_content text, p_title text, p_description text); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.calculate_content_scores(p_work_id uuid, p_content text, p_title text, p_description text) IS '计算作品内容的真实性、AI风险和垃圾内容评分';


--
-- Name: calculate_work_reward(integer, integer, integer, integer, jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.calculate_work_reward(p_views integer, p_likes integer, p_favorites integer, p_shares integer, p_incentive_model jsonb) RETURNS numeric
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_reward DECIMAL := 0;
    v_metrics JSONB;
    v_max_reward DECIMAL;
    v_min_reward DECIMAL;
BEGIN
    v_metrics := p_incentive_model->'metrics';
    v_max_reward := (p_incentive_model->>'max_reward_per_work')::DECIMAL;
    v_min_reward := (p_incentive_model->>'min_reward_per_work')::DECIMAL;
    
    -- 计算各项指标的奖励
    IF v_metrics ? 'views' THEN
        v_reward := v_reward + (p_views / 1000.0) * ((v_metrics->'views'->>'rate_per_1000')::DECIMAL);
    END IF;
    
    IF v_metrics ? 'likes' THEN
        v_reward := v_reward + p_likes * ((v_metrics->'likes'->>'rate_per')::DECIMAL);
    END IF;
    
    IF v_metrics ? 'favorites' THEN
        v_reward := v_reward + p_favorites * ((v_metrics->'favorites'->>'rate_per')::DECIMAL);
    END IF;
    
    IF v_metrics ? 'shares' THEN
        v_reward := v_reward + p_shares * ((v_metrics->'shares'->>'rate_per')::DECIMAL);
    END IF;
    
    -- 应用上下限
    IF v_max_reward IS NOT NULL THEN
        v_reward := LEAST(v_reward, v_max_reward);
    END IF;
    
    IF v_min_reward IS NOT NULL THEN
        v_reward := GREATEST(v_reward, v_min_reward);
    END IF;
    
    RETURN ROUND(v_reward, 2);
END;
$$;


ALTER FUNCTION public.calculate_work_reward(p_views integer, p_likes integer, p_favorites integer, p_shares integer, p_incentive_model jsonb) OWNER TO postgres;

--
-- Name: can_edit_event(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.can_edit_event(p_event_id uuid, p_user_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_status TEXT;
    v_organizer_id UUID;
BEGIN
    SELECT status, organizer_id INTO v_status, v_organizer_id
    FROM public.events
    WHERE id = p_event_id;

    RETURN v_organizer_id = p_user_id 
        AND v_status IN ('draft', 'rejected', 'pending');
END;
$$;


ALTER FUNCTION public.can_edit_event(p_event_id uuid, p_user_id uuid) OWNER TO postgres;

--
-- Name: FUNCTION can_edit_event(p_event_id uuid, p_user_id uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.can_edit_event(p_event_id uuid, p_user_id uuid) IS '检查活动是否可以编辑';


--
-- Name: check_invite_rate_limit(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_invite_rate_limit(p_user_id text) RETURNS TABLE(can_invite boolean, daily_remaining integer, weekly_remaining integer, monthly_remaining integer, reset_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_record RECORD;
    v_daily_limit INTEGER := 10;
    v_weekly_limit INTEGER := 50;
    v_monthly_limit INTEGER := 200;
BEGIN
    -- 获取或创建用户的频率限制记录
    SELECT * INTO v_record FROM user_invite_rate_limits WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        INSERT INTO user_invite_rate_limits (user_id) VALUES (p_user_id);
        RETURN QUERY SELECT true, v_daily_limit, v_weekly_limit, v_monthly_limit, NOW() + INTERVAL '1 day';
        RETURN;
    END IF;
    
    -- 检查是否需要重置计数器
    IF v_record.reset_daily_at < NOW() THEN
        UPDATE user_invite_rate_limits 
        SET daily_count = 0, reset_daily_at = NOW() + INTERVAL '1 day'
        WHERE user_id = p_user_id;
        v_record.daily_count := 0;
    END IF;
    
    IF v_record.reset_weekly_at < NOW() THEN
        UPDATE user_invite_rate_limits 
        SET weekly_count = 0, reset_weekly_at = NOW() + INTERVAL '7 days'
        WHERE user_id = p_user_id;
        v_record.weekly_count := 0;
    END IF;
    
    IF v_record.reset_monthly_at < NOW() THEN
        UPDATE user_invite_rate_limits 
        SET monthly_count = 0, reset_monthly_at = NOW() + INTERVAL '30 days'
        WHERE user_id = p_user_id;
        v_record.monthly_count := 0;
    END IF;
    
    RETURN QUERY SELECT 
        (v_record.daily_count < v_daily_limit AND v_record.weekly_count < v_weekly_limit AND v_record.monthly_count < v_monthly_limit),
        GREATEST(0, v_daily_limit - v_record.daily_count),
        GREATEST(0, v_weekly_limit - v_record.weekly_count),
        GREATEST(0, v_monthly_limit - v_record.monthly_count),
        v_record.reset_daily_at;
END;
$$;


ALTER FUNCTION public.check_invite_rate_limit(p_user_id text) OWNER TO postgres;

--
-- Name: check_points_limit(uuid, character varying, integer, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_points_limit(p_user_id uuid, p_source_type character varying, p_points integer, p_period_type character varying DEFAULT 'daily'::character varying) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_rule RECORD;
    v_limit INTEGER;
    v_used INTEGER;
    v_start_date TIMESTAMPTZ;
BEGIN
    -- 获取规则
    SELECT * INTO v_rule
    FROM public.points_rules
    WHERE source_type = p_source_type AND is_active = true
    LIMIT 1;

    IF v_rule IS NULL THEN
        RETURN jsonb_build_object(
            'can_add', true,
            'remaining', 999999,
            'limit_amount', 0,
            'used_amount', 0
        );
    END IF;

    -- 根据周期类型确定限制
    CASE p_period_type
        WHEN 'daily' THEN v_limit := v_rule.daily_limit;
        WHEN 'weekly' THEN v_limit := v_rule.weekly_limit;
        WHEN 'monthly' THEN v_limit := v_rule.monthly_limit;
        WHEN 'yearly' THEN v_limit := v_rule.yearly_limit;
        ELSE v_limit := NULL;
    END CASE;

    IF v_limit IS NULL THEN
        RETURN jsonb_build_object(
            'can_add', true,
            'remaining', 999999,
            'limit_amount', 0,
            'used_amount', 0
        );
    END IF;

    -- 计算周期开始时间
    CASE p_period_type
        WHEN 'daily' THEN v_start_date := CURRENT_DATE::TIMESTAMPTZ;
        WHEN 'weekly' THEN v_start_date := DATE_TRUNC('week', CURRENT_DATE);
        WHEN 'monthly' THEN v_start_date := DATE_TRUNC('month', CURRENT_DATE);
        WHEN 'yearly' THEN v_start_date := DATE_TRUNC('year', CURRENT_DATE);
    END CASE;

    -- 计算已使用积分
    SELECT COALESCE(SUM(points), 0) INTO v_used
    FROM public.points_records
    WHERE user_id = p_user_id
      AND source_type = p_source_type
      AND type = 'earned'
      AND created_at >= v_start_date;

    RETURN jsonb_build_object(
        'can_add', (v_used + p_points) <= v_limit,
        'remaining', GREATEST(0, v_limit - v_used),
        'limit_amount', v_limit,
        'used_amount', v_used
    );
END;
$$;


ALTER FUNCTION public.check_points_limit(p_user_id uuid, p_source_type character varying, p_points integer, p_period_type character varying) OWNER TO postgres;

--
-- Name: cleanup_expired_backups(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.cleanup_expired_backups() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    DELETE FROM organizer_backups 
    WHERE expires_at < NOW();
END;
$$;


ALTER FUNCTION public.cleanup_expired_backups() OWNER TO postgres;

--
-- Name: cleanup_expired_invitations(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.cleanup_expired_invitations() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE community_invitations 
    SET status = 'expired'
    WHERE status = 'pending' 
    AND expires_at IS NOT NULL 
    AND expires_at < NOW();
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;


ALTER FUNCTION public.cleanup_expired_invitations() OWNER TO postgres;

--
-- Name: cleanup_expired_recommendations(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.cleanup_expired_recommendations() RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    DELETE FROM realtime_recommendation_cache 
    WHERE expires_at < NOW();
    
    DELETE FROM user_realtime_features 
    WHERE expires_at < NOW();
END;
$$;


ALTER FUNCTION public.cleanup_expired_recommendations() OWNER TO postgres;

--
-- Name: cleanup_old_brand_wizard_drafts(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.cleanup_old_brand_wizard_drafts(days integer DEFAULT 90) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.brand_wizard_drafts
    WHERE updated_at < NOW() - INTERVAL '1 day' * days;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;


ALTER FUNCTION public.cleanup_old_brand_wizard_drafts(days integer) OWNER TO postgres;

--
-- Name: FUNCTION cleanup_old_brand_wizard_drafts(days integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.cleanup_old_brand_wizard_drafts(days integer) IS '清理指定天数前未更新的品牌向导草稿';


--
-- Name: cleanup_old_generation_tasks(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.cleanup_old_generation_tasks() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
begin
  delete from generation_tasks
  where created_at < now() - interval '90 days'
    and status in ('completed', 'failed', 'cancelled');
end;
$$;


ALTER FUNCTION public.cleanup_old_generation_tasks() OWNER TO postgres;

--
-- Name: cleanup_old_search_history(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.cleanup_old_search_history(p_user_id uuid) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM user_search_history
    WHERE user_id = p_user_id
    AND id NOT IN (
        SELECT id FROM user_search_history
        WHERE user_id = p_user_id
        ORDER BY created_at DESC
        LIMIT 100
    );
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN v_deleted_count;
END;
$$;


ALTER FUNCTION public.cleanup_old_search_history(p_user_id uuid) OWNER TO postgres;

--
-- Name: cleanup_old_sync_logs(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.cleanup_old_sync_logs(p_retention_days integer DEFAULT 30) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM user_sync_logs
  WHERE synced_at < NOW() - (p_retention_days || ' days')::INTERVAL;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN v_deleted_count;
END;
$$;


ALTER FUNCTION public.cleanup_old_sync_logs(p_retention_days integer) OWNER TO postgres;

--
-- Name: FUNCTION cleanup_old_sync_logs(p_retention_days integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.cleanup_old_sync_logs(p_retention_days integer) IS '清理旧的同步日志';


--
-- Name: create_ip_asset_with_stages(uuid, character varying, text, character varying, uuid, integer, text, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_ip_asset_with_stages(p_user_id uuid, p_name character varying, p_description text, p_type character varying, p_original_work_id uuid, p_commercial_value integer, p_thumbnail text, p_status character varying DEFAULT 'pending_review'::character varying) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_asset_id UUID;
BEGIN
    -- 创建IP资产，使用传入的状态
    INSERT INTO ip_assets (user_id, name, description, type, original_work_id, commercial_value, thumbnail, status)
    VALUES (p_user_id, p_name, p_description, p_type, p_original_work_id, p_commercial_value, p_thumbnail, p_status)
    RETURNING id INTO v_asset_id;
    
    -- 创建默认孵化阶段
    INSERT INTO ip_stages (ip_asset_id, name, description, order_index) VALUES
    (v_asset_id, '创意设计', '完成原创设计作品', 1),
    (v_asset_id, '版权存证', '完成作品版权存证', 2),
    (v_asset_id, 'IP孵化', '将设计转化为IP资产', 3),
    (v_asset_id, '商业合作', '对接品牌合作机会', 4),
    (v_asset_id, '收益分成', '获得作品收益分成', 5);
    
    RETURN v_asset_id;
END;
$$;


ALTER FUNCTION public.create_ip_asset_with_stages(p_user_id uuid, p_name character varying, p_description text, p_type character varying, p_original_work_id uuid, p_commercial_value integer, p_thumbnail text, p_status character varying) OWNER TO postgres;

--
-- Name: FUNCTION create_ip_asset_with_stages(p_user_id uuid, p_name character varying, p_description text, p_type character varying, p_original_work_id uuid, p_commercial_value integer, p_thumbnail text, p_status character varying); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.create_ip_asset_with_stages(p_user_id uuid, p_name character varying, p_description text, p_type character varying, p_original_work_id uuid, p_commercial_value integer, p_thumbnail text, p_status character varying) IS '创建IP资产并初始化孵化阶段，支持设置状态（默认pending_review）';


--
-- Name: create_organizer_backup(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_organizer_backup(p_organizer_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_backup_id UUID;
    v_download_url TEXT;
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- 生成备份ID
    v_backup_id := gen_random_uuid();
    
    -- 设置过期时间（30天后）
    v_expires_at := NOW() + INTERVAL '30 days';
    
    -- 生成下载URL（实际项目中应该使用安全的签名URL）
    v_download_url := '/api/backups/' || v_backup_id::text;
    
    -- 插入备份记录
    INSERT INTO organizer_backups (
        id,
        organizer_id,
        type,
        size,
        download_url,
        expires_at
    ) VALUES (
        v_backup_id,
        p_organizer_id,
        'manual',
        0, -- 实际大小应该在备份完成后更新
        v_download_url,
        v_expires_at
    );
    
    -- 返回备份信息
    RETURN jsonb_build_object(
        'id', v_backup_id,
        'created_at', NOW(),
        'expires_at', v_expires_at,
        'download_url', v_download_url,
        'size', 0
    );
END;
$$;


ALTER FUNCTION public.create_organizer_backup(p_organizer_id uuid) OWNER TO postgres;

--
-- Name: create_post_transaction(text, text, uuid, uuid, jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_post_transaction(p_title text, p_content text, p_community_id uuid, p_author_id uuid, p_images jsonb DEFAULT '[]'::jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_post_id UUID;
    v_post_data JSONB;
BEGIN
    -- 1. Insert Post
    INSERT INTO public.posts (title, content, community_id, author_id, images, status)
    VALUES (p_title, p_content, p_community_id, p_author_id, p_images, 'published')
    RETURNING id INTO v_post_id;

    -- 2. Update User Stats (Atomic Increment)
    UPDATE public.users
    SET 
        posts_count = COALESCE(posts_count, 0) + 1,
        last_active_at = NOW()
    WHERE id = p_author_id;

    -- 3. Update Community Stats
    IF p_community_id IS NOT NULL THEN
        UPDATE public.communities
        SET 
            posts_count = COALESCE(posts_count, 0) + 1,
            updated_at = NOW()
        WHERE id = p_community_id;
    END IF;

    -- 4. Return the created post structure
    SELECT to_jsonb(p) INTO v_post_data FROM public.posts p WHERE id = v_post_id;
    
    RETURN v_post_data;

EXCEPTION WHEN OTHERS THEN
    -- Transaction will automatically rollback on error
    RAISE;
END;
$$;


ALTER FUNCTION public.create_post_transaction(p_title text, p_content text, p_community_id uuid, p_author_id uuid, p_images jsonb) OWNER TO postgres;

--
-- Name: create_promo_order(uuid, text, text, text, text, numeric, numeric, numeric, uuid, jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_promo_order(p_user_id uuid, p_work_id text, p_package_type text, p_target_type text, p_metric_type text, p_original_price numeric, p_discount_amount numeric, p_final_price numeric, p_coupon_id uuid DEFAULT NULL::uuid, p_metadata jsonb DEFAULT '{}'::jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_order_id UUID;
    v_order_no TEXT;
BEGIN
    -- 生成订单号
    v_order_no := 'PRO' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- 插入订单
    INSERT INTO public.promotion_orders (
        user_id,
        order_no,
        work_id,
        package_type,
        target_type,
        metric_type,
        original_price,
        discount_amount,
        final_price,
        coupon_id,
        metadata,
        status,
        created_at
    ) VALUES (
        p_user_id,
        v_order_no,
        p_work_id,
        p_package_type,
        p_target_type,
        p_metric_type,
        p_original_price,
        p_discount_amount,
        p_final_price,
        p_coupon_id,
        p_metadata,
        'pending',
        NOW()
    )
    RETURNING id INTO v_order_id;
    
    -- 返回 JSON 对象
    RETURN jsonb_build_object(
        'order_id', v_order_id,
        'order_no', v_order_no
    );
END;
$$;


ALTER FUNCTION public.create_promo_order(p_user_id uuid, p_work_id text, p_package_type text, p_target_type text, p_metric_type text, p_original_price numeric, p_discount_amount numeric, p_final_price numeric, p_coupon_id uuid, p_metadata jsonb) OWNER TO postgres;

--
-- Name: create_promotion_order(uuid, text, text, text, text, numeric, numeric, numeric, text, jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_promotion_order(p_user_id uuid, p_work_id text, p_package_type text, p_target_type text, p_metric_type text, p_original_price numeric, p_discount_amount numeric, p_final_price numeric, p_coupon_id text DEFAULT NULL::text, p_metadata jsonb DEFAULT '{}'::jsonb) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_order_id UUID;
    v_order_no TEXT;
BEGIN
    -- 生成订单号
    v_order_no := generate_promotion_order_no();

    -- 创建订单
    INSERT INTO public.promotion_orders (
        user_id,
        order_no,
        work_id,
        package_type,
        target_type,
        metric_type,
        original_price,
        discount_amount,
        final_price,
        coupon_id,
        metadata,
        status
    ) VALUES (
        p_user_id,
        v_order_no,
        p_work_id,
        p_package_type,
        p_target_type,
        p_metric_type,
        p_original_price,
        p_discount_amount,
        p_final_price,
        p_coupon_id,
        p_metadata,
        'pending'
    )
    RETURNING id INTO v_order_id;

    RETURN v_order_id;
END;
$$;


ALTER FUNCTION public.create_promotion_order(p_user_id uuid, p_work_id text, p_package_type text, p_target_type text, p_metric_type text, p_original_price numeric, p_discount_amount numeric, p_final_price numeric, p_coupon_id text, p_metadata jsonb) OWNER TO postgres;

--
-- Name: create_test_promotion_data(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.create_test_promotion_data() RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_user_id UUID;
  v_work_id TEXT;
  v_order_id UUID;
  v_promoted_work_id UUID;
BEGIN
  -- 获取第一个用户作为测试用户
  SELECT id INTO v_user_id FROM users LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN '错误: 没有找到用户，请先创建用户';
  END IF;

  -- 获取第一个作品作为测试作品
  SELECT id::TEXT INTO v_work_id FROM works WHERE status = 'published' LIMIT 1;

  IF v_work_id IS NULL THEN
    RETURN '错误: 没有找到已发布作品，请先创建作品';
  END IF;

  -- 检查是否已有活跃推广
  SELECT id INTO v_promoted_work_id
  FROM promoted_works
  WHERE work_id = v_work_id AND status = 'active';

  IF v_promoted_work_id IS NOT NULL THEN
    RETURN '已存在活跃推广: ' || v_promoted_work_id::TEXT;
  END IF;

  -- 创建推广订单
  INSERT INTO promotion_orders (
    user_id,
    order_no,
    work_id,
    work_title,
    work_thumbnail,
    package_type,
    target_type,
    metric_type,
    original_price,
    discount_amount,
    final_price,
    status,
    payment_time,
    start_at,
    end_at
  ) VALUES (
    v_user_id,
    'TEST' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS'),
    v_work_id,
    '测试推广作品',
    '',
    'standard',
    'account',
    'views',
    98,
    0,
    98,
    'active',
    NOW(),
    NOW(),
    NOW() + INTERVAL '24 hours'
  )
  RETURNING id INTO v_order_id;

  -- 创建推广作品记录
  INSERT INTO promoted_works (
    order_id,
    work_id,
    user_id,
    package_type,
    target_type,
    metric_type,
    start_time,
    end_time,
    target_views,
    target_clicks,
    promotion_weight,
    priority_score,
    status,
    actual_views,
    actual_clicks
  ) VALUES (
    v_order_id,
    v_work_id,
    v_user_id,
    'standard',
    'account',
    'views',
    NOW(),
    NOW() + INTERVAL '24 hours',
    1000,
    50,
    1.0,
    100,
    'active',
    0,
    0
  )
  RETURNING id INTO v_promoted_work_id;

  RETURN '成功创建测试推广数据: ' || v_promoted_work_id::TEXT;
END;
$$;


ALTER FUNCTION public.create_test_promotion_data() OWNER TO postgres;

--
-- Name: FUNCTION create_test_promotion_data(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.create_test_promotion_data() IS '创建测试推广数据，用于验证功能';


--
-- Name: evaluate_small_traffic_test(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.evaluate_small_traffic_test() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- 检查是否达到目标样本量
    IF NEW.sample_size >= NEW.target_sample_size THEN
        -- 评估是否通过
        IF NEW.engagement_rate >= NEW.quality_threshold THEN
            IF NEW.engagement_rate >= NEW.graduation_threshold THEN
                NEW.test_status := 'graduated';
                NEW.end_time := NOW();
                
                -- 自动加入新内容推荐池
                INSERT INTO new_content_boost_pool (content_id, quality_score, test_performance)
                VALUES (NEW.content_id, 
                        (SELECT overall_quality_score FROM content_quality_assessments WHERE content_id = NEW.content_id),
                        NEW.engagement_rate)
                ON CONFLICT (content_id) DO UPDATE SET
                    test_performance = EXCLUDED.test_performance,
                    updated_at = NOW();
            ELSE
                NEW.test_status := 'passed';
                NEW.end_time := NOW();
            END IF;
        ELSE
            NEW.test_status := 'failed';
            NEW.end_time := NOW();
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.evaluate_small_traffic_test() OWNER TO postgres;

--
-- Name: exchange_product(uuid, uuid, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.exchange_product(p_user_id uuid, p_product_id uuid, p_quantity integer DEFAULT 1) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_product RECORD;
    v_user_balance INTEGER;
    v_total_cost INTEGER;
    v_exchange_id UUID;
    v_result JSONB;
BEGIN
    -- 获取商品信息并锁定行
    SELECT * INTO v_product
    FROM public.products
    WHERE id = p_product_id
    FOR UPDATE;

    IF v_product IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_message', '商品不存在'
        );
    END IF;

    -- 检查商品状态
    IF v_product.status != 'active' THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_message', '商品已下架'
        );
    END IF;

    -- 检查库存
    IF v_product.stock < p_quantity THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_message', '商品库存不足'
        );
    END IF;

    -- 计算总积分消耗
    v_total_cost := v_product.points * p_quantity;

    -- 获取用户积分余额
    SELECT balance INTO v_user_balance
    FROM public.user_points_balance
    WHERE user_id = p_user_id;

    IF v_user_balance IS NULL THEN
        v_user_balance := 0;
    END IF;

    -- 检查积分是否足够
    IF v_user_balance < v_total_cost THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_message', '积分余额不足'
        );
    END IF;

    -- 扣减库存
    UPDATE public.products
    SET stock = stock - p_quantity,
        status = CASE WHEN stock - p_quantity <= 0 THEN 'sold_out' ELSE status END
    WHERE id = p_product_id;

    -- 扣减用户积分
    PERFORM public.update_user_points_balance(
        p_user_id,
        -v_total_cost,
        'spent',
        '积分商城',
        'exchange',
        '兑换商品：' || v_product.name || ' x' || p_quantity
    );

    -- 创建兑换记录
    INSERT INTO public.exchange_records (
        user_id,
        product_id,
        product_name,
        product_category,
        points_cost,
        quantity,
        status
    ) VALUES (
        p_user_id,
        p_product_id::TEXT,
        v_product.name,
        v_product.category,
        v_total_cost,
        p_quantity,
        'completed'
    )
    RETURNING id INTO v_exchange_id;

    RETURN jsonb_build_object(
        'success', true,
        'exchange_id', v_exchange_id,
        'points_cost', v_total_cost,
        'remaining_stock', v_product.stock - p_quantity
    );
END;
$$;


ALTER FUNCTION public.exchange_product(p_user_id uuid, p_product_id uuid, p_quantity integer) OWNER TO postgres;

--
-- Name: exec_sql(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.exec_sql(sql text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    EXECUTE sql;
END;
$$;


ALTER FUNCTION public.exec_sql(sql text) OWNER TO postgres;

--
-- Name: execute_sql(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.execute_sql(sql text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
begin
  execute sql;
end;
$$;


ALTER FUNCTION public.execute_sql(sql text) OWNER TO postgres;

--
-- Name: export_organizer_data(uuid, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.export_organizer_data(p_organizer_id uuid, p_type text, p_format text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_export_id UUID;
    v_download_url TEXT;
BEGIN
    -- 生成导出ID
    v_export_id := gen_random_uuid();
    
    -- 生成下载URL
    v_download_url := '/api/exports/' || v_export_id::text || '.' || p_format;
    
    -- 返回导出信息
    RETURN jsonb_build_object(
        'id', v_export_id,
        'download_url', v_download_url,
        'created_at', NOW()
    );
END;
$$;


ALTER FUNCTION public.export_organizer_data(p_organizer_id uuid, p_type text, p_format text) OWNER TO postgres;

--
-- Name: generate_promotion_order_no(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.generate_promotion_order_no() RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_order_no TEXT;
    v_exists BOOLEAN;
BEGIN
    LOOP
        v_order_no := 'PRO' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
        SELECT EXISTS(SELECT 1 FROM public.promotion_orders WHERE order_no = v_order_no) INTO v_exists;
        EXIT WHEN NOT v_exists;
    END LOOP;
    RETURN v_order_no;
END;
$$;


ALTER FUNCTION public.generate_promotion_order_no() OWNER TO postgres;

--
-- Name: get_active_alerts(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_active_alerts(p_limit integer DEFAULT 50, p_offset integer DEFAULT 0) RETURNS TABLE(id uuid, rule_id uuid, rule_name text, metric_type text, threshold numeric, actual_value numeric, severity text, message text, status text, created_at timestamp with time zone, time_ago text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ar.id,
    ar.rule_id,
    alr.name as rule_name,
    ar.metric_type,
    ar.threshold,
    ar.actual_value,
    ar.severity,
    ar.message,
    ar.status,
    ar.created_at,
    CASE 
      WHEN ar.created_at > NOW() - INTERVAL '1 minute' THEN '刚刚'
      WHEN ar.created_at > NOW() - INTERVAL '1 hour' THEN EXTRACT(MINUTE FROM NOW() - ar.created_at)::TEXT || '分钟前'
      WHEN ar.created_at > NOW() - INTERVAL '1 day' THEN EXTRACT(HOUR FROM NOW() - ar.created_at)::TEXT || '小时前'
      ELSE EXTRACT(DAY FROM NOW() - ar.created_at)::TEXT || '天前'
    END as time_ago
  FROM alert_records ar
  JOIN alert_rules alr ON ar.rule_id = alr.id
  WHERE ar.status = 'active'
  ORDER BY ar.created_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$;


ALTER FUNCTION public.get_active_alerts(p_limit integer, p_offset integer) OWNER TO postgres;

--
-- Name: get_ai_feedback_list(integer, text, boolean, text, timestamp with time zone, timestamp with time zone, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_ai_feedback_list(p_rating integer DEFAULT NULL::integer, p_feedback_type text DEFAULT NULL::text, p_is_read boolean DEFAULT NULL::boolean, p_search_query text DEFAULT NULL::text, p_start_date timestamp with time zone DEFAULT NULL::timestamp with time zone, p_end_date timestamp with time zone DEFAULT NULL::timestamp with time zone, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0) RETURNS TABLE(id uuid, user_id uuid, user_name text, user_avatar text, session_id text, conversation_id uuid, message_id uuid, rating integer, feedback_type text, comment text, ai_model text, ai_response text, user_query text, created_at timestamp with time zone, is_read boolean, tags text[], total_count bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_total_count BIGINT;
BEGIN
    -- 计算总数
    SELECT COUNT(*) INTO v_total_count
    FROM ai_feedback f
    WHERE (p_rating IS NULL OR f.rating = p_rating)
      AND (p_feedback_type IS NULL OR f.feedback_type = p_feedback_type)
      AND (p_is_read IS NULL OR f.is_read = p_is_read)
      AND (p_start_date IS NULL OR f.created_at >= p_start_date)
      AND (p_end_date IS NULL OR f.created_at <= p_end_date)
      AND (
          p_search_query IS NULL 
          OR f.user_name ILIKE '%' || p_search_query || '%'
          OR f.comment ILIKE '%' || p_search_query || '%'
          OR f.user_query ILIKE '%' || p_search_query || '%'
      );

    RETURN QUERY
    SELECT
        f.id,
        f.user_id,
        f.user_name,
        f.user_avatar,
        f.session_id,
        f.conversation_id,
        f.message_id,
        f.rating,
        f.feedback_type,
        f.comment,
        f.ai_model,
        f.ai_response,
        f.user_query,
        f.created_at,
        f.is_read,
        f.tags,
        v_total_count as total_count
    FROM ai_feedback f
    WHERE (p_rating IS NULL OR f.rating = p_rating)
      AND (p_feedback_type IS NULL OR f.feedback_type = p_feedback_type)
      AND (p_is_read IS NULL OR f.is_read = p_is_read)
      AND (p_start_date IS NULL OR f.created_at >= p_start_date)
      AND (p_end_date IS NULL OR f.created_at <= p_end_date)
      AND (
          p_search_query IS NULL 
          OR f.user_name ILIKE '%' || p_search_query || '%'
          OR f.comment ILIKE '%' || p_search_query || '%'
          OR f.user_query ILIKE '%' || p_search_query || '%'
      )
    ORDER BY f.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;


ALTER FUNCTION public.get_ai_feedback_list(p_rating integer, p_feedback_type text, p_is_read boolean, p_search_query text, p_start_date timestamp with time zone, p_end_date timestamp with time zone, p_limit integer, p_offset integer) OWNER TO postgres;

--
-- Name: get_ai_feedback_stats(timestamp with time zone, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_ai_feedback_stats(p_start_date timestamp with time zone DEFAULT NULL::timestamp with time zone, p_end_date timestamp with time zone DEFAULT NULL::timestamp with time zone) RETURNS TABLE(total_count bigint, avg_rating numeric, unread_count bigint, rating_5_count bigint, rating_4_count bigint, rating_3_count bigint, rating_2_count bigint, rating_1_count bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_count,
        COALESCE(AVG(rating), 0)::NUMERIC as avg_rating,
        COUNT(*) FILTER (WHERE is_read = false)::BIGINT as unread_count,
        COUNT(*) FILTER (WHERE rating = 5)::BIGINT as rating_5_count,
        COUNT(*) FILTER (WHERE rating = 4)::BIGINT as rating_4_count,
        COUNT(*) FILTER (WHERE rating = 3)::BIGINT as rating_3_count,
        COUNT(*) FILTER (WHERE rating = 2)::BIGINT as rating_2_count,
        COUNT(*) FILTER (WHERE rating = 1)::BIGINT as rating_1_count
    FROM ai_feedback
    WHERE (p_start_date IS NULL OR created_at >= p_start_date)
      AND (p_end_date IS NULL OR created_at <= p_end_date);
END;
$$;


ALTER FUNCTION public.get_ai_feedback_stats(p_start_date timestamp with time zone, p_end_date timestamp with time zone) OWNER TO postgres;

--
-- Name: get_ai_review_detail(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_ai_review_detail(p_review_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT to_jsonb(ar.*) INTO v_result
    FROM public.ai_reviews ar
    WHERE ar.id = p_review_id AND ar.user_id = auth.uid();
    
    RETURN v_result;
END;
$$;


ALTER FUNCTION public.get_ai_review_detail(p_review_id uuid) OWNER TO postgres;

--
-- Name: get_ai_review_detail(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_ai_review_detail(p_review_id uuid, p_user_id uuid) RETURNS TABLE(id uuid, work_id text, prompt text, ai_explanation text, overall_score integer, cultural_fit_score integer, creativity_score integer, aesthetics_score integer, commercial_potential_score integer, cultural_fit_details jsonb, creativity_details jsonb, aesthetics_details jsonb, suggestions jsonb, highlights jsonb, commercial_analysis jsonb, recommended_commercial_paths jsonb, related_activities jsonb, similar_works jsonb, work_thumbnail text, created_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ar.id,
        ar.work_id,
        ar.prompt,
        ar.ai_explanation,
        ar.overall_score,
        ar.cultural_fit_score,
        ar.creativity_score,
        ar.aesthetics_score,
        ar.commercial_potential_score,
        ar.cultural_fit_details,
        ar.creativity_details,
        ar.aesthetics_details,
        ar.suggestions,
        ar.highlights,
        ar.commercial_analysis,
        ar.recommended_commercial_paths,
        ar.related_activities,
        ar.similar_works,
        ar.work_thumbnail,
        ar.created_at
    FROM ai_reviews ar
    WHERE ar.id = p_review_id AND ar.user_id = p_user_id;
END;
$$;


ALTER FUNCTION public.get_ai_review_detail(p_review_id uuid, p_user_id uuid) OWNER TO postgres;

--
-- Name: get_alert_stats(timestamp with time zone, timestamp with time zone); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_alert_stats(p_start_date timestamp with time zone DEFAULT (now() - '7 days'::interval), p_end_date timestamp with time zone DEFAULT now()) RETURNS TABLE(total_alerts bigint, active_alerts bigint, acknowledged_alerts bigint, critical_alerts bigint, warning_alerts bigint, avg_resolution_time interval)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_alerts,
    COUNT(*) FILTER (WHERE status = 'active')::BIGINT as active_alerts,
    COUNT(*) FILTER (WHERE status = 'acknowledged')::BIGINT as acknowledged_alerts,
    COUNT(*) FILTER (WHERE severity = 'critical')::BIGINT as critical_alerts,
    COUNT(*) FILTER (WHERE severity = 'warning')::BIGINT as warning_alerts,
    AVG(resolved_at - created_at) FILTER (WHERE resolved_at IS NOT NULL) as avg_resolution_time
  FROM alert_records
  WHERE created_at BETWEEN p_start_date AND p_end_date;
END;
$$;


ALTER FUNCTION public.get_alert_stats(p_start_date timestamp with time zone, p_end_date timestamp with time zone) OWNER TO postgres;

--
-- Name: get_auth_users_info(uuid[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_auth_users_info(user_ids uuid[]) RETURNS TABLE(id uuid, email text, username text, avatar_url text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        au.id,
        au.email,
        COALESCE(
            au.raw_user_meta_data->>'username',
            au.raw_user_meta_data->>'name',
            SPLIT_PART(au.email, '@', 1)
        ) as username,
        au.raw_user_meta_data->>'avatar_url' as avatar_url
    FROM auth.users au
    WHERE au.id = ANY(user_ids);
END;
$$;


ALTER FUNCTION public.get_auth_users_info(user_ids uuid[]) OWNER TO postgres;

--
-- Name: FUNCTION get_auth_users_info(user_ids uuid[]); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.get_auth_users_info(user_ids uuid[]) IS '根据用户ID数组获取 auth.users 表中的用户基本信息';


--
-- Name: get_brand_events(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_brand_events(p_user_id uuid) RETURNS TABLE(id uuid, title text, start_time timestamp with time zone, end_time timestamp with time zone, status text, submission_count bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.title,
        e.start_time,
        e.end_time,
        e.status,
        COUNT(es.id) as submission_count
    FROM public.events e
    LEFT JOIN public.event_submissions es ON e.id = es.event_id
    WHERE e.organizer_id = p_user_id
    GROUP BY e.id, e.title, e.start_time, e.end_time, e.status
    ORDER BY e.created_at DESC;
END;
$$;


ALTER FUNCTION public.get_brand_events(p_user_id uuid) OWNER TO postgres;

--
-- Name: FUNCTION get_brand_events(p_user_id uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.get_brand_events(p_user_id uuid) IS '获取品牌方有权限管理的活动列表（简化版）';


--
-- Name: get_brand_task_stats(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_brand_task_stats(p_task_id uuid) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_participants', COUNT(DISTINCT creator_id),
        'total_submissions', COUNT(*),
        'approved_submissions', COUNT(*) FILTER (WHERE status = 'approved'),
        'pending_submissions', COUNT(*) FILTER (WHERE status = 'pending'),
        'total_views', COALESCE(SUM(current_views), 0),
        'total_likes', COALESCE(SUM(current_likes), 0),
        'total_favorites', COALESCE(SUM(current_favorites), 0),
        'total_rewards', COALESCE(SUM(final_reward), 0)
    )
    INTO v_stats
    FROM public.brand_task_submissions
    WHERE task_id = p_task_id;
    
    RETURN v_stats;
END;
$$;


ALTER FUNCTION public.get_brand_task_stats(p_task_id uuid) OWNER TO postgres;

--
-- Name: get_community_invite_stats(character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_community_invite_stats(p_community_id character varying) RETURNS TABLE(total_invites bigint, accepted_invites bigint, pending_invites bigint, rejected_invites bigint, expired_invites bigint, total_applications bigint, approved_applications bigint, pending_applications bigint, rejected_applications bigint, conversion_rate numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM community_invitations WHERE community_id = p_community_id),
        (SELECT COUNT(*) FROM community_invitations WHERE community_id = p_community_id AND status = 'accepted'),
        (SELECT COUNT(*) FROM community_invitations WHERE community_id = p_community_id AND status = 'pending'),
        (SELECT COUNT(*) FROM community_invitations WHERE community_id = p_community_id AND status = 'rejected'),
        (SELECT COUNT(*) FROM community_invitations WHERE community_id = p_community_id AND status = 'expired'),
        (SELECT COUNT(*) FROM community_join_requests WHERE community_id = p_community_id),
        (SELECT COUNT(*) FROM community_join_requests WHERE community_id = p_community_id AND status = 'approved'),
        (SELECT COUNT(*) FROM community_join_requests WHERE community_id = p_community_id AND status = 'pending'),
        (SELECT COUNT(*) FROM community_join_requests WHERE community_id = p_community_id AND status = 'rejected'),
        CASE 
            WHEN (SELECT COUNT(*) FROM community_invitations WHERE community_id = p_community_id) > 0 
            THEN ROUND(
                (SELECT COUNT(*)::NUMERIC FROM community_invitations WHERE community_id = p_community_id AND status = 'accepted') /
                (SELECT COUNT(*)::NUMERIC FROM community_invitations WHERE community_id = p_community_id) * 100, 
                2
            )
            ELSE 0
        END;
END;
$$;


ALTER FUNCTION public.get_community_invite_stats(p_community_id character varying) OWNER TO postgres;

--
-- Name: get_default_lottery_activity_id(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_default_lottery_activity_id() RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_activity_id UUID;
BEGIN
    SELECT id INTO v_activity_id FROM lottery_activities WHERE name = '幸运大转盘' LIMIT 1;
    RETURN v_activity_id;
END;
$$;


ALTER FUNCTION public.get_default_lottery_activity_id() OWNER TO postgres;

--
-- Name: get_exchange_stats(uuid, date, date); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_exchange_stats(p_user_id uuid DEFAULT NULL::uuid, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_total INTEGER;
    v_pending INTEGER;
    v_processing INTEGER;
    v_completed INTEGER;
    v_cancelled INTEGER;
    v_refunded INTEGER;
    v_total_points BIGINT;
    v_today_orders INTEGER;
    v_today_date DATE;
BEGIN
    -- 获取今天的日期
    v_today_date := CURRENT_DATE;

    -- 计算总订单数
    SELECT COUNT(*) INTO v_total
    FROM public.exchange_records
    WHERE (p_user_id IS NULL OR user_id = p_user_id)
      AND (p_start_date IS NULL OR created_at::DATE >= p_start_date)
      AND (p_end_date IS NULL OR created_at::DATE <= p_end_date);

    -- 计算各状态订单数
    SELECT 
        COUNT(*) FILTER (WHERE status = 'pending'),
        COUNT(*) FILTER (WHERE status = 'processing'),
        COUNT(*) FILTER (WHERE status = 'completed'),
        COUNT(*) FILTER (WHERE status = 'cancelled'),
        COUNT(*) FILTER (WHERE status = 'refunded')
    INTO v_pending, v_processing, v_completed, v_cancelled, v_refunded
    FROM public.exchange_records
    WHERE (p_user_id IS NULL OR user_id = p_user_id)
      AND (p_start_date IS NULL OR created_at::DATE >= p_start_date)
      AND (p_end_date IS NULL OR created_at::DATE <= p_end_date);

    -- 计算总积分消耗
    SELECT COALESCE(SUM(points_cost), 0) INTO v_total_points
    FROM public.exchange_records
    WHERE (p_user_id IS NULL OR user_id = p_user_id)
      AND (p_start_date IS NULL OR created_at::DATE >= p_start_date)
      AND (p_end_date IS NULL OR created_at::DATE <= p_end_date)
      AND status IN ('completed', 'pending', 'processing');

    -- 计算今日订单数
    SELECT COUNT(*) INTO v_today_orders
    FROM public.exchange_records
    WHERE created_at::DATE = v_today_date
      AND (p_user_id IS NULL OR user_id = p_user_id);

    RETURN jsonb_build_object(
        'total', v_total,
        'pending', v_pending,
        'processing', v_processing,
        'completed', v_completed,
        'cancelled', v_cancelled,
        'refunded', v_refunded,
        'totalPoints', v_total_points,
        'todayOrders', v_today_orders
    );
END;
$$;


ALTER FUNCTION public.get_exchange_stats(p_user_id uuid, p_start_date date, p_end_date date) OWNER TO postgres;

--
-- Name: FUNCTION get_exchange_stats(p_user_id uuid, p_start_date date, p_end_date date); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.get_exchange_stats(p_user_id uuid, p_start_date date, p_end_date date) IS '获取兑换订单统计数据，支持按用户和日期范围筛选';


--
-- Name: get_feedback_stats(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_feedback_stats() RETURNS TABLE(total_count bigint, pending_count bigint, processing_count bigint, resolved_count bigint, today_count bigint, avg_process_hours numeric)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_count,
        COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending_count,
        COUNT(*) FILTER (WHERE status = 'processing')::BIGINT as processing_count,
        COUNT(*) FILTER (WHERE status = 'resolved')::BIGINT as resolved_count,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE)::BIGINT as today_count,
        ROUND(AVG(EXTRACT(EPOCH FROM (responded_at - created_at)) / 3600)::NUMERIC, 2) as avg_process_hours
    FROM user_feedbacks;
END;
$$;


ALTER FUNCTION public.get_feedback_stats() OWNER TO postgres;

--
-- Name: get_final_ranking(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_final_ranking(p_event_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_ranking_data jsonb;
    v_is_published boolean;
BEGIN
    -- 检查排名是否已发布
    SELECT final_ranking_published, final_ranking_data
    INTO v_is_published, v_ranking_data
    FROM public.events
    WHERE id = p_event_id;
    
    IF NOT v_is_published OR v_ranking_data IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', '最终排名尚未发布'
        );
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'ranking_data', v_ranking_data
    );
END;
$$;


ALTER FUNCTION public.get_final_ranking(p_event_id uuid) OWNER TO postgres;

--
-- Name: FUNCTION get_final_ranking(p_event_id uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.get_final_ranking(p_event_id uuid) IS '获取活动的最终排名';


--
-- Name: get_ip_asset_details(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_ip_asset_details(p_asset_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', a.id,
        'user_id', a.user_id,
        'name', a.name,
        'description', a.description,
        'type', a.type,
        'original_work_id', a.original_work_id,
        'commercial_value', a.commercial_value,
        'thumbnail', a.thumbnail,
        'status', a.status,
        'created_at', a.created_at,
        'updated_at', a.updated_at,
        'stages', COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'id', s.id,
                    'name', s.name,
                    'description', s.description,
                    'order_index', s.order_index,
                    'completed', s.completed,
                    'completed_at', s.completed_at
                ) ORDER BY s.order_index
            )
            FROM ip_stages s
            WHERE s.ip_asset_id = a.id
            ), '[]'::jsonb
        )
    )
    INTO result
    FROM ip_assets a
    WHERE a.id = p_asset_id;
    
    RETURN result;
END;
$$;


ALTER FUNCTION public.get_ip_asset_details(p_asset_id uuid) OWNER TO postgres;

--
-- Name: get_lottery_activity_stats(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_lottery_activity_stats(p_activity_id uuid) RETURNS TABLE(total_spins bigint, total_participants bigint, total_cost bigint, win_rate numeric)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_spins,
        COUNT(DISTINCT user_id)::BIGINT as total_participants,
        SUM(cost)::BIGINT as total_cost,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                (COUNT(CASE WHEN p.points > 0 THEN 1 END)::DECIMAL / COUNT(*) * 100)
            ELSE 0
        END as win_rate
    FROM lottery_spin_records r
    JOIN lottery_prizes p ON r.prize_id = p.id
    WHERE r.activity_id = p_activity_id;
END;
$$;


ALTER FUNCTION public.get_lottery_activity_stats(p_activity_id uuid) OWNER TO postgres;

--
-- Name: get_lottery_daily_stats(uuid, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_lottery_daily_stats(p_activity_id uuid, p_days integer DEFAULT 30) RETURNS TABLE(date date, spins bigint, participants bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(created_at) as date,
        COUNT(*)::BIGINT as spins,
        COUNT(DISTINCT user_id)::BIGINT as participants
    FROM lottery_spin_records
    WHERE activity_id = p_activity_id
    AND created_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY DATE(created_at)
    ORDER BY date;
END;
$$;


ALTER FUNCTION public.get_lottery_daily_stats(p_activity_id uuid, p_days integer) OWNER TO postgres;

--
-- Name: get_lottery_hourly_stats(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_lottery_hourly_stats(p_activity_id uuid) RETURNS TABLE(hour integer, spins bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXTRACT(HOUR FROM created_at)::INTEGER as hour,
        COUNT(*)::BIGINT as spins
    FROM lottery_spin_records
    WHERE activity_id = p_activity_id
    AND created_at >= NOW() - INTERVAL '7 days'
    GROUP BY EXTRACT(HOUR FROM created_at)
    ORDER BY hour;
END;
$$;


ALTER FUNCTION public.get_lottery_hourly_stats(p_activity_id uuid) OWNER TO postgres;

--
-- Name: get_lottery_top_prizes(uuid, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_lottery_top_prizes(p_activity_id uuid, p_limit integer DEFAULT 5) RETURNS TABLE(prize_id uuid, name character varying, count bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as prize_id,
        p.name,
        COUNT(r.id)::BIGINT as count
    FROM lottery_prizes p
    LEFT JOIN lottery_spin_records r ON p.id = r.prize_id
    WHERE p.activity_id = p_activity_id
    GROUP BY p.id, p.name
    ORDER BY count DESC
    LIMIT p_limit;
END;
$$;


ALTER FUNCTION public.get_lottery_top_prizes(p_activity_id uuid, p_limit integer) OWNER TO postgres;

--
-- Name: get_organizer_dashboard_stats(uuid, date, date); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_organizer_dashboard_stats(p_organizer_id uuid, p_start_date date DEFAULT NULL::date, p_end_date date DEFAULT NULL::date) RETURNS TABLE(total_events bigint, total_submissions bigint, total_votes bigint, total_likes bigint, avg_score numeric, pending_review bigint, daily_submissions jsonb, top_works jsonb)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- 设置默认日期范围（最近30天）
    IF p_start_date IS NULL THEN
        p_start_date := CURRENT_DATE - INTERVAL '30 days';
    END IF;
    IF p_end_date IS NULL THEN
        p_end_date := CURRENT_DATE;
    END IF;

    RETURN QUERY
    WITH organizer_events AS (
        SELECT e.id as event_id
        FROM public.events e
        WHERE e.organizer_id = p_organizer_id
    ),
    stats AS (
        SELECT 
            COUNT(DISTINCT oe.event_id) as total_events,
            COUNT(DISTINCT es.id) as total_submissions,
            COALESCE(SUM(es.vote_count), 0) as total_votes,
            COALESCE(SUM(es.like_count), 0) as total_likes,
            AVG(es.avg_rating)::DECIMAL(5,2) as avg_score,
            COUNT(DISTINCT CASE WHEN es.status = 'draft' OR es.status = 'under_review' THEN es.id END) as pending_review
        FROM organizer_events oe
        LEFT JOIN public.event_submissions es ON oe.event_id = es.event_id
    ),
    daily_stats_raw AS (
        SELECT 
            to_timestamp(es.created_at / 1000)::DATE as stat_date,
            COUNT(*) as count
        FROM public.event_submissions es
        JOIN organizer_events oe ON es.event_id = oe.event_id
        WHERE to_timestamp(es.created_at / 1000)::DATE BETWEEN p_start_date AND p_end_date
        GROUP BY to_timestamp(es.created_at / 1000)::DATE
    ),
    daily_stats AS (
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'date', stat_date,
                'count', count
            ) ORDER BY stat_date
        ), '[]'::jsonb) as daily_data
        FROM daily_stats_raw
    ),
    top_works_raw AS (
        SELECT 
            es.id,
            es.title,
            es.vote_count,
            es.like_count,
            es.avg_rating
        FROM public.event_submissions es
        JOIN organizer_events oe ON es.event_id = oe.event_id
        ORDER BY es.vote_count DESC
        LIMIT 5
    ),
    top_works AS (
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'id', id,
                'title', title,
                'views', vote_count,
                'likes', like_count,
                'score', avg_rating
            )
        ), '[]'::jsonb) as works_data
        FROM top_works_raw
    )
    SELECT 
        s.total_events,
        s.total_submissions,
        s.total_votes,
        s.total_likes,
        s.avg_score,
        s.pending_review,
        ds.daily_data as daily_submissions,
        tw.works_data as top_works
    FROM stats s
    CROSS JOIN daily_stats ds
    CROSS JOIN top_works tw;
END;
$$;


ALTER FUNCTION public.get_organizer_dashboard_stats(p_organizer_id uuid, p_start_date date, p_end_date date) OWNER TO postgres;

--
-- Name: get_pending_promotion_applications_count(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_pending_promotion_applications_count() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM public.promotion_applications WHERE status = 'pending';
    RETURN v_count;
END;
$$;


ALTER FUNCTION public.get_pending_promotion_applications_count() OWNER TO postgres;

--
-- Name: get_personalized_suggestions(uuid, text, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_personalized_suggestions(p_user_id uuid, p_query text, p_limit integer DEFAULT 10) RETURNS TABLE(id uuid, keyword text, category character varying, weight integer, is_hot boolean, relevance_score numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    WITH user_preferences AS (
        SELECT preferred_categories, preferred_tags
        FROM user_search_preferences
        WHERE user_id = p_user_id
    ),
    user_history AS (
        SELECT query, COUNT(*) as search_count
        FROM user_search_history
        WHERE user_id = p_user_id
        AND created_at > NOW() - INTERVAL '30 days'
        GROUP BY query
    )
    SELECT 
        s.id,
        s.keyword,
        s.category,
        s.weight,
        s.is_hot,
        (
            s.weight * 1.0 +
            (CASE WHEN s.is_hot THEN 50 ELSE 0 END) +
            (CASE 
                WHEN s.category = ANY(SELECT preferred_categories FROM user_preferences) THEN 30
                ELSE 0
            END) +
            (CASE 
                WHEN s.keyword ILIKE '%' || p_query || '%' THEN 100
                ELSE 0
            END) +
            COALESCE((SELECT search_count FROM user_history WHERE query = s.keyword), 0) * 5
        )::DECIMAL as relevance_score
    FROM search_suggestions s
    WHERE s.is_active = true
    AND (s.keyword ILIKE '%' || p_query || '%' OR p_query = '')
    ORDER BY relevance_score DESC
    LIMIT p_limit;
END;
$$;


ALTER FUNCTION public.get_personalized_suggestions(p_user_id uuid, p_query text, p_limit integer) OWNER TO postgres;

--
-- Name: get_products(character varying, character varying, text, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_products(p_category character varying DEFAULT NULL::character varying, p_status character varying DEFAULT 'active'::character varying, p_search text DEFAULT NULL::text, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_total INTEGER;
    v_products JSONB;
BEGIN
    -- 获取总数
    SELECT COUNT(*) INTO v_total
    FROM public.products
    WHERE (p_status IS NULL OR status = p_status)
      AND (p_category IS NULL OR category = p_category)
      AND (p_search IS NULL OR 
           name ILIKE '%' || p_search || '%' OR 
           description ILIKE '%' || p_search || '%' OR
           EXISTS (SELECT 1 FROM unnest(tags) t WHERE t ILIKE '%' || p_search || '%'));

    -- 获取商品列表
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'name', name,
            'description', description,
            'points', points,
            'stock', stock,
            'status', status,
            'category', category,
            'tags', tags,
            'image_url', image_url,
            'is_featured', is_featured,
            'created_at', created_at
        ) ORDER BY sort_order ASC, created_at DESC
    ) INTO v_products
    FROM (
        SELECT *
        FROM public.products
        WHERE (p_status IS NULL OR status = p_status)
          AND (p_category IS NULL OR category = p_category)
          AND (p_search IS NULL OR 
               name ILIKE '%' || p_search || '%' OR 
               description ILIKE '%' || p_search || '%' OR
               EXISTS (SELECT 1 FROM unnest(tags) t WHERE t ILIKE '%' || p_search || '%'))
        ORDER BY sort_order ASC, created_at DESC
        LIMIT p_limit OFFSET p_offset
    ) sub;

    RETURN jsonb_build_object(
        'total', v_total,
        'products', COALESCE(v_products, '[]'::JSONB),
        'limit', p_limit,
        'offset', p_offset
    );
END;
$$;


ALTER FUNCTION public.get_products(p_category character varying, p_status character varying, p_search text, p_limit integer, p_offset integer) OWNER TO postgres;

--
-- Name: get_promotion_debug_info(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_promotion_debug_info(p_promoted_work_id uuid) RETURNS TABLE(work_id uuid, status text, end_time timestamp with time zone, is_active boolean, actual_views integer, actual_clicks integer)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    pw.id as work_id,
    pw.status,
    pw.end_time,
    (pw.status = 'active' AND pw.end_time > NOW()) as is_active,
    pw.actual_views,
    pw.actual_clicks
  FROM promoted_works pw
  WHERE pw.id = p_promoted_work_id;
END;
$$;


ALTER FUNCTION public.get_promotion_debug_info(p_promoted_work_id uuid) OWNER TO postgres;

--
-- Name: FUNCTION get_promotion_debug_info(p_promoted_work_id uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.get_promotion_debug_info(p_promoted_work_id uuid) IS '获取推广作品调试信息';


--
-- Name: get_promotion_user_stats(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_promotion_user_stats(p_user_id uuid) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_applications', COUNT(*),
        'pending_applications', COUNT(*) FILTER (WHERE status = 'pending'),
        'approved_applications', COUNT(*) FILTER (WHERE status = 'approved'),
        'rejected_applications', COUNT(*) FILTER (WHERE status = 'rejected'),
        'total_spent', COALESCE(SUM(total_spent), 0),
        'total_orders', COALESCE(SUM(total_orders), 0),
        'total_views', COALESCE(SUM(total_views), 0)
    )
    INTO v_stats
    FROM public.promotion_applications
    WHERE user_id = p_user_id;
    
    RETURN v_stats;
END;
$$;


ALTER FUNCTION public.get_promotion_user_stats(p_user_id uuid) OWNER TO postgres;

--
-- Name: get_score_audit_logs(uuid, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_score_audit_logs(p_submission_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 50) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_logs JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', sal.id,
            'submission_id', sal.submission_id,
            'judge_id', sal.judge_id,
            'judge_name', u.raw_user_meta_data->>'username',
            'action', sal.action,
            'old_score', sal.old_score,
            'new_score', sal.new_score,
            'comment', sal.comment,
            'created_at', sal.created_at
        ) ORDER BY sal.created_at DESC
    ) INTO v_logs
    FROM public.score_audit_logs sal
    JOIN auth.users u ON sal.judge_id = u.id
    WHERE (p_submission_id IS NULL OR sal.submission_id = p_submission_id)
    LIMIT p_limit;
    
    RETURN COALESCE(v_logs, '[]'::jsonb);
END;
$$;


ALTER FUNCTION public.get_score_audit_logs(p_submission_id uuid, p_limit integer) OWNER TO postgres;

--
-- Name: get_square_works_with_promotion(integer, integer, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_square_works_with_promotion(p_limit integer DEFAULT 20, p_offset integer DEFAULT 0, p_user_id uuid DEFAULT NULL::uuid) RETURNS TABLE(id uuid, work_type text, title text, thumbnail text, video_url text, creator_id uuid, creator_username text, creator_avatar text, views integer, likes integer, comments integer, created_at timestamp with time zone, is_promoted boolean, promoted_work_id uuid, package_type text, promotion_weight numeric)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_promoted_count INTEGER;
  v_normal_limit INTEGER;
BEGIN
  -- 计算需要插入的推广作品数量（约20%，至少1个）
  v_promoted_count := GREATEST(1, ROUND(p_limit * 0.2));
  v_normal_limit := p_limit - v_promoted_count;

  -- 使用 UNION ALL 合并普通作品和推广作品，确保返回统一的结果集
  RETURN QUERY
  WITH normal_works AS (
    -- 普通作品
    SELECT
      w.id::UUID as id,
      'normal'::TEXT as work_type,
      w.title::TEXT as title,
      COALESCE(w.thumbnail, w.cover_url, '')::TEXT as thumbnail,
      COALESCE(w.video_url, '')::TEXT as video_url,
      w.creator_id::UUID as creator_id,
      u.username::TEXT as creator_username,
      u.avatar_url::TEXT as creator_avatar,
      COALESCE(w.views, 0)::INTEGER as views,
      COALESCE(w.likes, 0)::INTEGER as likes,
      COALESCE(w.comments, 0)::INTEGER as comments,
      to_timestamp(w.created_at::bigint / 1000.0)::TIMESTAMPTZ as created_at,
      FALSE as is_promoted,
      NULL::UUID as promoted_work_id,
      NULL::TEXT as package_type,
      NULL::DECIMAL as promotion_weight
    FROM works w
    LEFT JOIN users u ON w.creator_id = u.id
    WHERE w.status = 'published'
    ORDER BY w.created_at DESC
    LIMIT v_normal_limit
    OFFSET p_offset
  ),
  promoted_works_list AS (
    -- 推广作品
    SELECT
      pw.work_id::UUID as id,
      'promoted'::TEXT as work_type,
      po.work_title::TEXT as title,
      COALESCE(po.work_thumbnail, '')::TEXT as thumbnail,
      ''::TEXT as video_url,
      pw.user_id::UUID as creator_id,
      u.username::TEXT as creator_username,
      u.avatar_url::TEXT as creator_avatar,
      COALESCE(pw.actual_views, 0)::INTEGER as views,
      0::INTEGER as likes,
      0::INTEGER as comments,
      pw.created_at::TIMESTAMPTZ as created_at,
      TRUE as is_promoted,
      pw.id::UUID as promoted_work_id,
      pw.package_type::TEXT as package_type,
      pw.promotion_weight::DECIMAL(3,2) as promotion_weight
    FROM promoted_works pw
    JOIN promotion_orders po ON pw.order_id = po.id
    LEFT JOIN users u ON pw.user_id = u.id
    WHERE pw.status = 'active'
      AND pw.end_time > NOW()
      AND (p_user_id IS NULL OR pw.user_id != p_user_id)
    ORDER BY pw.promotion_weight DESC, pw.priority_score DESC
    LIMIT v_promoted_count
  )
  -- 合并结果：先推广作品，再普通作品
  SELECT * FROM promoted_works_list
  UNION ALL
  SELECT * FROM normal_works
  -- 最终排序：推广作品优先，然后按时间倒序
  ORDER BY 
    CASE WHEN is_promoted THEN 1 ELSE 0 END DESC,
    created_at DESC;
END;
$$;


ALTER FUNCTION public.get_square_works_with_promotion(p_limit integer, p_offset integer, p_user_id uuid) OWNER TO postgres;

--
-- Name: FUNCTION get_square_works_with_promotion(p_limit integer, p_offset integer, p_user_id uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.get_square_works_with_promotion(p_limit integer, p_offset integer, p_user_id uuid) IS '获取广场作品列表，包含推广作品（使用UNION ALL修复版）';


--
-- Name: get_submission_score_stats(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_submission_score_stats(p_submission_id uuid) RETURNS TABLE(avg_score numeric, max_score numeric, min_score numeric, score_count integer, judge_count integer)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(AVG(score), 0)::DECIMAL(5,2) as avg_score,
        COALESCE(MAX(score), 0)::DECIMAL(5,2) as max_score,
        COALESCE(MIN(score), 0)::DECIMAL(5,2) as min_score,
        COUNT(*)::INTEGER as score_count,
        COUNT(DISTINCT judge_id)::INTEGER as judge_count
    FROM public.submission_scores
    WHERE submission_id = p_submission_id;
END;
$$;


ALTER FUNCTION public.get_submission_score_stats(p_submission_id uuid) OWNER TO postgres;

--
-- Name: get_submission_scores(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_submission_scores(p_submission_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_scores JSONB;
    v_stats JSONB;
BEGIN
    -- 获取所有评分
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', jsd.id,
            'judge_id', jsd.judge_id,
            'judge_name', jsd.judge_name,
            'judge_avatar', jsd.judge_avatar,
            'score', jsd.score,
            'comment', jsd.comment,
            'created_at', jsd.created_at,
            'updated_at', jsd.updated_at
        ) ORDER BY jsd.created_at DESC
    ) INTO v_scores
    FROM public.judge_score_details jsd
    WHERE jsd.submission_id = p_submission_id;
    
    -- 获取统计
    SELECT jsonb_build_object(
        'avg_score', avg_score,
        'max_score', max_score,
        'min_score', min_score,
        'score_count', score_count,
        'judge_count', judge_count
    ) INTO v_stats
    FROM public.get_submission_score_stats(p_submission_id) gs;
    
    RETURN jsonb_build_object(
        'scores', COALESCE(v_scores, '[]'::jsonb),
        'stats', v_stats
    );
END;
$$;


ALTER FUNCTION public.get_submission_scores(p_submission_id uuid) OWNER TO postgres;

--
-- Name: get_template_favorite_count(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_template_favorite_count(template_id integer) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
BEGIN
    RETURN (SELECT COUNT(*) FROM template_favorites WHERE template_favorites.template_id = $1);
END;
$_$;


ALTER FUNCTION public.get_template_favorite_count(template_id integer) OWNER TO postgres;

--
-- Name: get_template_like_count(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_template_like_count(template_id integer) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
BEGIN
    RETURN (SELECT COUNT(*) FROM template_likes WHERE template_likes.template_id = $1);
END;
$_$;


ALTER FUNCTION public.get_template_like_count(template_id integer) OWNER TO postgres;

--
-- Name: get_unread_message_count(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_unread_message_count(p_user_id uuid) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) 
        FROM public.direct_messages 
        WHERE receiver_id = p_user_id AND is_read = FALSE
    );
END;
$$;


ALTER FUNCTION public.get_unread_message_count(p_user_id uuid) OWNER TO postgres;

--
-- Name: get_unread_notification_count(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_unread_notification_count(p_user_id uuid) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) 
        FROM public.notifications 
        WHERE user_id = p_user_id AND is_read = FALSE
    );
END;
$$;


ALTER FUNCTION public.get_unread_notification_count(p_user_id uuid) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: generation_tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.generation_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    params jsonb DEFAULT '{}'::jsonb NOT NULL,
    progress integer DEFAULT 0,
    result jsonb,
    error text,
    error_type text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    CONSTRAINT generation_tasks_error_type_check CHECK ((error_type = ANY (ARRAY['content_policy'::text, 'timeout'::text, 'auth'::text, 'general'::text, 'network'::text]))),
    CONSTRAINT generation_tasks_progress_check CHECK (((progress >= 0) AND (progress <= 100))),
    CONSTRAINT generation_tasks_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text, 'cancelled'::text]))),
    CONSTRAINT generation_tasks_type_check CHECK ((type = ANY (ARRAY['image'::text, 'video'::text])))
);


ALTER TABLE public.generation_tasks OWNER TO postgres;

--
-- Name: TABLE generation_tasks; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.generation_tasks IS 'AI生成任务表，支持后台生成';


--
-- Name: get_user_active_generation_tasks(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_active_generation_tasks(p_user_id uuid) RETURNS SETOF public.generation_tasks
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
begin
  return query
  select *
  from generation_tasks
  where user_id = p_user_id
    and status in ('pending', 'processing')
  order by created_at desc;
end;
$$;


ALTER FUNCTION public.get_user_active_generation_tasks(p_user_id uuid) OWNER TO postgres;

--
-- Name: get_user_ai_reviews(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_ai_reviews(p_limit integer DEFAULT 20, p_offset integer DEFAULT 0) RETURNS TABLE(id uuid, work_id uuid, work_type text, work_title text, work_thumbnail text, overall_score integer, created_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ar.id,
        ar.work_id,
        ar.work_type,
        ar.work_title,
        ar.work_thumbnail,
        ar.overall_score,
        ar.created_at
    FROM public.ai_reviews ar
    WHERE ar.user_id = auth.uid()
    ORDER BY ar.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;


ALTER FUNCTION public.get_user_ai_reviews(p_limit integer, p_offset integer) OWNER TO postgres;

--
-- Name: get_user_ai_reviews(uuid, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_ai_reviews(p_user_id uuid, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0) RETURNS TABLE(id uuid, work_id text, prompt text, overall_score integer, cultural_fit_score integer, creativity_score integer, aesthetics_score integer, commercial_potential_score integer, highlights jsonb, work_thumbnail text, created_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ar.id,
        ar.work_id,
        ar.prompt,
        ar.overall_score,
        ar.cultural_fit_score,
        ar.creativity_score,
        ar.aesthetics_score,
        ar.commercial_potential_score,
        ar.highlights,
        ar.work_thumbnail,
        ar.created_at
    FROM ai_reviews ar
    WHERE ar.user_id = p_user_id
    ORDER BY ar.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;


ALTER FUNCTION public.get_user_ai_reviews(p_user_id uuid, p_limit integer, p_offset integer) OWNER TO postgres;

--
-- Name: get_user_conversations(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_conversations(p_user_id uuid) RETURNS TABLE(user_id uuid, username text, avatar_url text, last_message text, last_message_time timestamp with time zone, unread_count bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    WITH conversations AS (
        SELECT 
            CASE 
                WHEN dm.sender_id = p_user_id THEN dm.receiver_id
                ELSE dm.sender_id
            END as other_user_id,
            dm.content,
            dm.created_at,
            CASE 
                WHEN dm.receiver_id = p_user_id AND NOT dm.is_read THEN 1
                ELSE 0
            END as is_unread
        FROM public.direct_messages dm
        WHERE dm.sender_id = p_user_id OR dm.receiver_id = p_user_id
    ),
    latest_messages AS (
        SELECT DISTINCT ON (other_user_id)
            other_user_id,
            content,
            created_at
        FROM conversations
        ORDER BY other_user_id, created_at DESC
    ),
    unread_counts AS (
        SELECT 
            other_user_id,
            SUM(is_unread) as unread
        FROM conversations
        GROUP BY other_user_id
    )
    SELECT 
        u.id,
        u.username,
        u.avatar_url,
        lm.content,
        lm.created_at,
        COALESCE(uc.unread, 0)::BIGINT
    FROM latest_messages lm
    JOIN public.users u ON u.id = lm.other_user_id
    LEFT JOIN unread_counts uc ON uc.other_user_id = lm.other_user_id
    ORDER BY lm.created_at DESC;
END;
$$;


ALTER FUNCTION public.get_user_conversations(p_user_id uuid) OWNER TO postgres;

--
-- Name: get_user_conversations(uuid, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_conversations(p_user_id uuid, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0) RETURNS TABLE(id uuid, title text, model_id text, created_at timestamp with time zone, updated_at timestamp with time zone, is_active boolean, message_count integer, last_message text, last_message_time timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.title,
        c.model_id,
        c.created_at,
        c.updated_at,
        c.is_active,
        c.message_count,
        m.content as last_message,
        m.timestamp as last_message_time
    FROM ai_conversations c
    LEFT JOIN LATERAL (
        SELECT content, timestamp
        FROM ai_messages
        WHERE conversation_id = c.id
        ORDER BY timestamp DESC
        LIMIT 1
    ) m ON true
    WHERE c.user_id = p_user_id
    ORDER BY c.updated_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;


ALTER FUNCTION public.get_user_conversations(p_user_id uuid, p_limit integer, p_offset integer) OWNER TO postgres;

--
-- Name: get_user_events_simple(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_events_simple(p_user_id uuid) RETURNS TABLE(id uuid, title text, description text, organizer_id uuid, status text, created_at bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.title,
        e.description,
        e.organizer_id,
        e.status,
        e.created_at
    FROM public.events e
    WHERE e.organizer_id = p_user_id
    ORDER BY e.created_at DESC;
END;
$$;


ALTER FUNCTION public.get_user_events_simple(p_user_id uuid) OWNER TO postgres;

--
-- Name: FUNCTION get_user_events_simple(p_user_id uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.get_user_events_simple(p_user_id uuid) IS '获取指定用户的基本活动信息，绕过 RLS';


--
-- Name: get_user_exchange_records_with_products(uuid, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_exchange_records_with_products(p_user_id uuid, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_total INTEGER;
    v_records JSONB;
BEGIN
    -- 获取总数
    SELECT COUNT(*) INTO v_total
    FROM public.exchange_records
    WHERE user_id = p_user_id;

    -- 获取记录列表
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', er.id,
            'product_id', er.product_id,
            'product_name', er.product_name,
            'product_category', er.product_category,
            'points_cost', er.points_cost,
            'quantity', er.quantity,
            'status', er.status,
            'created_at', er.created_at,
            'product_image', p.image_url
        ) ORDER BY er.created_at DESC
    ) INTO v_records
    FROM (
        SELECT *
        FROM public.exchange_records
        WHERE user_id = p_user_id
        ORDER BY created_at DESC
        LIMIT p_limit OFFSET p_offset
    ) er
    LEFT JOIN public.products p ON p.id = er.product_id::UUID;

    RETURN jsonb_build_object(
        'total', v_total,
        'records', COALESCE(v_records, '[]'::JSONB),
        'limit', p_limit,
        'offset', p_offset
    );
END;
$$;


ALTER FUNCTION public.get_user_exchange_records_with_products(p_user_id uuid, p_limit integer, p_offset integer) OWNER TO postgres;

--
-- Name: get_user_generation_history(uuid, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_generation_history(p_user_id uuid, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0) RETURNS SETOF public.generation_tasks
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
begin
  return query
  select *
  from generation_tasks
  where user_id = p_user_id
    and status in ('completed', 'failed', 'cancelled')
  order by created_at desc
  limit p_limit
  offset p_offset;
end;
$$;


ALTER FUNCTION public.get_user_generation_history(p_user_id uuid, p_limit integer, p_offset integer) OWNER TO postgres;

--
-- Name: get_user_interactions(uuid, uuid[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_interactions(p_user_id uuid, p_submission_ids uuid[]) RETURNS jsonb[]
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN (
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'submission_id', sr.submission_id,
                'has_voted', EXISTS(
                    SELECT 1 FROM public.submission_votes 
                    WHERE submission_id = sr.submission_id AND user_id = p_user_id
                ),
                'has_liked', EXISTS(
                    SELECT 1 FROM public.submission_likes 
                    WHERE submission_id = sr.submission_id AND user_id = p_user_id
                ),
                'user_rating', (
                    SELECT rating FROM public.submission_ratings 
                    WHERE submission_id = sr.submission_id AND user_id = p_user_id
                )
            )
        ), '[]')
        FROM (
            SELECT DISTINCT unnest(p_submission_ids) as submission_id
        ) sr
    );
END;
$$;


ALTER FUNCTION public.get_user_interactions(p_user_id uuid, p_submission_ids uuid[]) OWNER TO postgres;

--
-- Name: get_user_ip_assets(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_ip_assets(p_user_id uuid) RETURNS TABLE(id uuid, user_id uuid, name character varying, description text, type character varying, original_work_id uuid, commercial_value integer, thumbnail text, status character varying, created_at timestamp with time zone, updated_at timestamp with time zone, stages jsonb)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.user_id,
        a.name,
        a.description,
        a.type,
        a.original_work_id,
        a.commercial_value,
        a.thumbnail,
        a.status,
        a.created_at,
        a.updated_at,
        COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'id', s.id,
                    'name', s.name,
                    'description', s.description,
                    'order_index', s.order_index,
                    'completed', s.completed,
                    'completed_at', s.completed_at,
                    'created_at', s.created_at,
                    'updated_at', s.updated_at
                ) ORDER BY s.order_index
            )
            FROM ip_stages s
            WHERE s.ip_asset_id = a.id
            ), '[]'::jsonb
        ) as stages
    FROM ip_assets a
    WHERE a.user_id = p_user_id 
      AND a.status = 'active'
    ORDER BY a.created_at DESC;
END;
$$;


ALTER FUNCTION public.get_user_ip_assets(p_user_id uuid) OWNER TO postgres;

--
-- Name: get_user_ip_stats(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_ip_stats(p_user_id uuid) RETURNS TABLE(total_assets bigint, completed_assets bigint, in_progress_assets bigint, total_partnerships bigint, active_partnerships bigint, total_estimated_value bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(s.total_assets, 0)::BIGINT,
        COALESCE(s.completed_assets, 0)::BIGINT,
        COALESCE(s.in_progress_assets, 0)::BIGINT,
        COALESCE(p.total_partnerships, 0)::BIGINT,
        COALESCE(p.active_partnerships, 0)::BIGINT,
        COALESCE(s.total_estimated_value, 0)::BIGINT
    FROM 
        (SELECT 
            COUNT(*) as total_assets,
            COUNT(*) FILTER (WHERE NOT EXISTS (
                SELECT 1 FROM ip_stages 
                WHERE ip_stages.ip_asset_id = ip_assets.id 
                AND ip_stages.completed = FALSE
            )) as completed_assets,
            COUNT(*) FILTER (WHERE EXISTS (
                SELECT 1 FROM ip_stages 
                WHERE ip_stages.ip_asset_id = ip_assets.id 
                AND ip_stages.completed = FALSE
            )) as in_progress_assets,
            SUM(commercial_value) as total_estimated_value
        FROM ip_assets 
        WHERE user_id = p_user_id AND status = 'active') s
    CROSS JOIN
        (SELECT 
            COUNT(*) as total_partnerships,
            COUNT(*) FILTER (WHERE status IN ('pending', 'negotiating')) as active_partnerships
        FROM ip_partnerships 
        WHERE user_id = p_user_id) p;
END;
$$;


ALTER FUNCTION public.get_user_ip_stats(p_user_id uuid) OWNER TO postgres;

--
-- Name: get_user_memories(uuid, text, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_memories(p_user_id uuid, p_memory_type text DEFAULT NULL::text, p_limit integer DEFAULT 10) RETURNS TABLE(id uuid, memory_type text, content text, importance integer, created_at timestamp with time zone, source_conversation_id uuid)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.memory_type,
        m.content,
        m.importance,
        m.created_at,
        m.source_conversation_id
    FROM ai_user_memories m
    WHERE m.user_id = p_user_id
    AND m.is_active = true
    AND (p_memory_type IS NULL OR m.memory_type = p_memory_type)
    AND (m.expires_at IS NULL OR m.expires_at > NOW())
    ORDER BY m.importance DESC, m.updated_at DESC
    LIMIT p_limit;
END;
$$;


ALTER FUNCTION public.get_user_memories(p_user_id uuid, p_memory_type text, p_limit integer) OWNER TO postgres;

--
-- Name: get_user_participation_stats(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_participation_stats(p_user_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_total INTEGER;
    v_total_votes INTEGER;
    v_total_likes INTEGER;
    v_submission_ids UUID[];
BEGIN