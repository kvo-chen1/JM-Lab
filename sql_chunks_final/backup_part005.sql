-- Name: COLUMN brand_wizard_drafts.current_step; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.brand_wizard_drafts.current_step IS '当前步骤（1-4）';


--
-- Name: COLUMN brand_wizard_drafts.data; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.brand_wizard_drafts.data IS '草稿数据（JSON格式）';


--
-- Name: COLUMN brand_wizard_drafts.thumbnail; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.brand_wizard_drafts.thumbnail IS '缩略图URL';


--
-- Name: business_tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.business_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    brand_name text NOT NULL,
    brand_logo text,
    budget_min numeric(10,2) NOT NULL,
    budget_max numeric(10,2) NOT NULL,
    deadline timestamp with time zone NOT NULL,
    requirements jsonb DEFAULT '[]'::jsonb,
    tags jsonb DEFAULT '[]'::jsonb,
    type text NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    max_participants integer DEFAULT 1,
    current_participants integer DEFAULT 0,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT business_tasks_status_check CHECK ((status = ANY (ARRAY['open'::text, 'closed'::text, 'completed'::text]))),
    CONSTRAINT business_tasks_type_check CHECK ((type = ANY (ARRAY['design'::text, 'illustration'::text, 'video'::text, 'writing'::text, 'photography'::text, 'other'::text])))
);


ALTER TABLE public.business_tasks OWNER TO postgres;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.categories (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    description text,
    created_at bigint NOT NULL,
    updated_at bigint NOT NULL
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: channel_costs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.channel_costs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    channel character varying(100) NOT NULL,
    cost_type character varying(50) NOT NULL,
    amount numeric(10,2) NOT NULL,
    start_date date NOT NULL,
    end_date date,
    description text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.channel_costs OWNER TO postgres;

--
-- Name: TABLE channel_costs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.channel_costs IS '推广渠道成本表';


--
-- Name: COLUMN channel_costs.channel; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.channel_costs.channel IS '渠道名称';


--
-- Name: COLUMN channel_costs.cost_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.channel_costs.cost_type IS '成本类型：advertising(广告费), commission(佣金), cooperation(合作费)';


--
-- Name: COLUMN channel_costs.amount; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.channel_costs.amount IS '成本金额';


--
-- Name: COLUMN channel_costs.start_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.channel_costs.start_date IS '开始日期';


--
-- Name: COLUMN channel_costs.end_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.channel_costs.end_date IS '结束日期';


--
-- Name: checkin_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.checkin_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    checkin_date date NOT NULL,
    consecutive_days integer DEFAULT 1,
    points_earned integer DEFAULT 5,
    is_bonus boolean DEFAULT false,
    bonus_points integer DEFAULT 0,
    is_retroactive boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.checkin_records OWNER TO postgres;

--
-- Name: TABLE checkin_records; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.checkin_records IS '签到记录表';


--
-- Name: cold_start_recommendation_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.cold_start_recommendation_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    recommendation_type character varying(50),
    content_id uuid,
    "position" integer,
    was_clicked boolean DEFAULT false,
    was_liked boolean DEFAULT false,
    dwell_time integer,
    recommended_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.cold_start_recommendation_logs OWNER TO postgres;

--
-- Name: TABLE cold_start_recommendation_logs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.cold_start_recommendation_logs IS '冷启动推荐效果日志';


--
-- Name: cold_start_analytics; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.cold_start_analytics AS
 SELECT recommendation_type,
    count(*) AS total_recommendations,
    count(
        CASE
            WHEN was_clicked THEN 1
            ELSE NULL::integer
        END) AS clicks,
    count(
        CASE
            WHEN was_liked THEN 1
            ELSE NULL::integer
        END) AS likes,
    round((((count(
        CASE
            WHEN was_clicked THEN 1
            ELSE NULL::integer
        END))::numeric / (NULLIF(count(*), 0))::numeric) * (100)::numeric), 2) AS ctr_percent,
    round((((count(
        CASE
            WHEN was_liked THEN 1
            ELSE NULL::integer
        END))::numeric / (NULLIF(count(*), 0))::numeric) * (100)::numeric), 2) AS like_rate_percent,
    round(avg(COALESCE(dwell_time, 0)), 2) AS avg_dwell_time_seconds,
    date_trunc('day'::text, recommended_at) AS date
   FROM public.cold_start_recommendation_logs
  GROUP BY recommendation_type, (date_trunc('day'::text, recommended_at))
  ORDER BY (date_trunc('day'::text, recommended_at)) DESC, (count(*)) DESC;


ALTER VIEW public.cold_start_analytics OWNER TO postgres;

--
-- Name: comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid,
    user_id uuid NOT NULL,
    content text NOT NULL,
    parent_id uuid,
    likes integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    author_id uuid,
    work_id text,
    images jsonb DEFAULT '[]'::jsonb
);


ALTER TABLE public.comments OWNER TO postgres;

--
-- Name: commercial_opportunities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.commercial_opportunities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    brand_name character varying(255) NOT NULL,
    brand_logo text,
    name character varying(255) NOT NULL,
    description text,
    reward character varying(255),
    requirements text,
    deadline timestamp with time zone,
    status character varying(50) DEFAULT 'open'::character varying,
    match_criteria jsonb,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT commercial_opportunities_status_check CHECK (((status)::text = ANY ((ARRAY['open'::character varying, 'matched'::character varying, 'closed'::character varying])::text[])))
);


ALTER TABLE public.commercial_opportunities OWNER TO postgres;

--
-- Name: communities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.communities (
    id character varying(50) DEFAULT (gen_random_uuid())::text NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    cover text,
    tags text[],
    members_count integer DEFAULT 0,
    privacy character varying(20) DEFAULT 'public'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    topic text,
    avatar text,
    cover_image text,
    creator_id uuid,
    is_active boolean DEFAULT true,
    is_special boolean DEFAULT false,
    theme jsonb DEFAULT '{"textColor": "#1f2937", "primaryColor": "#3b82f6", "secondaryColor": "#60a5fa", "backgroundColor": "#f3f4f6"}'::jsonb,
    layout_type text DEFAULT 'standard'::text,
    enabled_modules jsonb DEFAULT '{"chat": true, "posts": true, "members": true, "announcements": true}'::jsonb,
    member_count integer DEFAULT 1,
    updated_at timestamp with time zone DEFAULT now(),
    bookmarks jsonb DEFAULT '[]'::jsonb,
    posts_count integer DEFAULT 0
);


ALTER TABLE public.communities OWNER TO postgres;

--
-- Name: community_announcements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.community_announcements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    community_id character varying(50),
    content text NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.community_announcements OWNER TO postgres;

--
-- Name: community_invitation_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.community_invitation_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    community_id character varying(50) NOT NULL,
    user_id text NOT NULL,
    target_user_id text,
    action_type character varying(50) NOT NULL,
    action_detail jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT community_invitation_history_action_type_check CHECK (((action_type)::text = ANY ((ARRAY['invite_sent'::character varying, 'invite_accepted'::character varying, 'invite_rejected'::character varying, 'invite_cancelled'::character varying, 'invite_expired'::character varying, 'application_submitted'::character varying, 'application_approved'::character varying, 'application_rejected'::character varying, 'application_cancelled'::character varying, 'member_joined'::character varying, 'member_left'::character varying, 'member_removed'::character varying])::text[])))
);


ALTER TABLE public.community_invitation_history OWNER TO postgres;

--
-- Name: TABLE community_invitation_history; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.community_invitation_history IS '社群邀请/申请历史记录表，用于审计和统计';


--
-- Name: community_invitations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.community_invitations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    community_id character varying(50) NOT NULL,
    inviter_id text NOT NULL,
    invitee_id text,
    invitee_email character varying(255),
    invitee_phone character varying(50),
    invite_code character varying(20),
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    message text,
    expires_at timestamp with time zone,
    accepted_at timestamp with time zone,
    rejected_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT community_invitations_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'accepted'::character varying, 'rejected'::character varying, 'expired'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.community_invitations OWNER TO postgres;

--
-- Name: TABLE community_invitations; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.community_invitations IS '社群成员邀请表，记录所有邀请信息';


--
-- Name: community_invite_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.community_invite_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    community_id character varying(50) NOT NULL,
    allow_member_invite boolean DEFAULT true,
    require_admin_approval boolean DEFAULT false,
    require_application_approval boolean DEFAULT true,
    max_invites_per_day integer DEFAULT 10,
    max_invites_per_batch integer DEFAULT 20,
    invite_expire_hours integer DEFAULT 168,
    application_questions jsonb,
    welcome_message text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.community_invite_settings OWNER TO postgres;

--
-- Name: TABLE community_invite_settings; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.community_invite_settings IS '社群邀请配置表，存储各社群的邀请规则';


--
-- Name: community_join_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.community_join_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    community_id character varying(50) NOT NULL,
    user_id text NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    reason text,
    answers jsonb,
    reviewed_by text,
    reviewed_at timestamp with time zone,
    review_note text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT community_join_requests_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.community_join_requests OWNER TO postgres;

--
-- Name: TABLE community_join_requests; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.community_join_requests IS '社群加入申请表，记录用户的入群申请';


--
-- Name: community_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.community_members (
    community_id character varying(50) NOT NULL,
    user_id text NOT NULL,
    role character varying(20) DEFAULT 'member'::character varying,
    joined_at timestamp with time zone DEFAULT now(),
    last_active bigint
);


ALTER TABLE public.community_members OWNER TO postgres;

--
-- Name: COLUMN community_members.last_active; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.community_members.last_active IS '用户最后活跃时间（Unix时间戳，秒）';


--
-- Name: community_posts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.community_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(255),
    content text,
    user_id text,
    community_id text,
    community_name character varying(100),
    images text[],
    thumbnail text,
    views integer DEFAULT 0,
    likes integer DEFAULT 0,
    comment_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.community_posts OWNER TO postgres;

--
-- Name: consumption_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.consumption_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    order_id text NOT NULL,
    order_amount numeric(10,2) NOT NULL,
    category text,
    points integer DEFAULT 0,
    status text DEFAULT 'pending'::text,
    confirmed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT consumption_records_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'cancelled'::text, 'refunded'::text])))
);


ALTER TABLE public.consumption_records OWNER TO postgres;

--
-- Name: TABLE consumption_records; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.consumption_records IS '消费返积分记录表';


--
-- Name: content_quality_assessments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.content_quality_assessments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    content_id uuid NOT NULL,
    completeness_score numeric(4,3),
    visual_quality_score numeric(4,3),
    text_quality_score numeric(4,3),
    predicted_engagement numeric(4,3),
    overall_quality_score numeric(4,3),
    quality_factors jsonb,
    assessed_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.content_quality_assessments OWNER TO postgres;

--
-- Name: TABLE content_quality_assessments; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.content_quality_assessments IS '内容质量预评估结果';


--
-- Name: content_stats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.content_stats (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    content_id uuid NOT NULL,
    view_count integer DEFAULT 0,
    like_count integer DEFAULT 0,
    collect_count integer DEFAULT 0,
    share_count integer DEFAULT 0,
    comment_count integer DEFAULT 0,
    avg_dwell_time numeric DEFAULT 0,
    ctr numeric DEFAULT 0,
    engagement_rate numeric DEFAULT 0,
    calculated_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.content_stats OWNER TO postgres;

--
-- Name: TABLE content_stats; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.content_stats IS '内容统计表，存储内容的互动统计数据';


--
-- Name: COLUMN content_stats.ctr; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.content_stats.ctr IS '点击率 (Click Through Rate)';


--
-- Name: COLUMN content_stats.engagement_rate; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.content_stats.engagement_rate IS '互动率';


--
-- Name: content_vectors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.content_vectors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    item_id uuid NOT NULL,
    item_type text NOT NULL,
    category text,
    tags text[],
    author_id uuid,
    theme text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT content_vectors_item_type_check CHECK ((item_type = ANY (ARRAY['post'::text, 'work'::text, 'challenge'::text, 'template'::text])))
);


ALTER TABLE public.content_vectors OWNER TO postgres;

--
-- Name: TABLE content_vectors; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.content_vectors IS '内容向量表，存储内容的特征向量用于相似度计算';


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.conversations (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    title character varying(255),
    is_active boolean DEFAULT true,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.conversations OWNER TO postgres;

--
-- Name: conversion_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.conversion_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    promoted_work_id uuid NOT NULL,
    conversion_type text NOT NULL,
    conversion_value numeric(10,2) DEFAULT 0,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT conversion_events_conversion_type_check CHECK ((conversion_type = ANY (ARRAY['purchase'::text, 'signup'::text, 'download'::text, 'share'::text, 'follow'::text])))
);


ALTER TABLE public.conversion_events OWNER TO postgres;

--
-- Name: TABLE conversion_events; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.conversion_events IS '转化事件表，记录用户通过推广产生的转化行为';


--
-- Name: COLUMN conversion_events.conversion_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.conversion_events.conversion_type IS '转化类型：purchase(购买), signup(注册), download(下载), share(分享), follow(关注)';


--
-- Name: COLUMN conversion_events.conversion_value; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.conversion_events.conversion_value IS '转化价值，如订单金额';


--
-- Name: COLUMN conversion_events.metadata; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.conversion_events.metadata IS '额外元数据，如订单 ID、商品详情等';


--
-- Name: copyright_assets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.copyright_assets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    thumbnail text,
    type character varying(100) NOT NULL,
    status character varying(50) DEFAULT 'registered'::character varying,
    can_license boolean DEFAULT true,
    license_price integer,
    certificate_url text,
    registered_at timestamp with time zone,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT copyright_assets_status_check CHECK (((status)::text = ANY ((ARRAY['registered'::character varying, 'licensed'::character varying, 'expired'::character varying])::text[])))
);


ALTER TABLE public.copyright_assets OWNER TO postgres;

--
-- Name: creator_earnings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.creator_earnings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    creator_id uuid NOT NULL,
    task_id uuid NOT NULL,
    submission_id uuid,
    amount numeric(10,2) NOT NULL,
    source_type text NOT NULL,
    calculation_basis jsonb DEFAULT '{}'::jsonb,
    status text DEFAULT 'pending'::text NOT NULL,
    paid_at timestamp with time zone,
    payment_reference text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT creator_earnings_source_type_check CHECK ((source_type = ANY (ARRAY['task_reward'::text, 'bonus'::text, 'adjustment'::text]))),
    CONSTRAINT creator_earnings_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'paid'::text, 'cancelled'::text])))
);


ALTER TABLE public.creator_earnings OWNER TO postgres;

--
-- Name: creator_level_configs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.creator_level_configs (
    id integer NOT NULL,
    level integer NOT NULL,
    name character varying(100) NOT NULL,
    icon character varying(50) NOT NULL,
    required_points integer DEFAULT 0 NOT NULL,
    benefits text[] DEFAULT '{}'::text[] NOT NULL,
    description text NOT NULL,
    color character varying(20),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.creator_level_configs OWNER TO postgres;

--
-- Name: creator_level_configs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.creator_level_configs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.creator_level_configs_id_seq OWNER TO postgres;

--
-- Name: creator_level_configs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.creator_level_configs_id_seq OWNED BY public.creator_level_configs.id;


--
-- Name: creator_revenue; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.creator_revenue (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    total_revenue numeric(12,2) DEFAULT 0,
    monthly_revenue numeric(12,2) DEFAULT 0,
    pending_revenue numeric(12,2) DEFAULT 0,
    withdrawable_revenue numeric(12,2) DEFAULT 0,
    total_withdrawn numeric(12,2) DEFAULT 0,
    last_month_revenue numeric(12,2) DEFAULT 0,
    updated_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.creator_revenue OWNER TO postgres;

--
-- Name: creator_task_applications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.creator_task_applications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    task_id uuid NOT NULL,
    creator_id uuid NOT NULL,
    status text DEFAULT 'applied'::text NOT NULL,
    deliverables jsonb DEFAULT '[]'::jsonb,
    earnings numeric(10,2) DEFAULT 0,
    applied_at timestamp with time zone DEFAULT now(),
    accepted_at timestamp with time zone,
    completed_at timestamp with time zone,
    CONSTRAINT creator_task_applications_status_check CHECK ((status = ANY (ARRAY['applied'::text, 'accepted'::text, 'rejected'::text, 'completed'::text, 'cancelled'::text])))
);


ALTER TABLE public.creator_task_applications OWNER TO postgres;

--
-- Name: cultural_knowledge; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.cultural_knowledge (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    category character varying(100) NOT NULL,
    subcategory character varying(100),
    content text NOT NULL,
    image_url character varying(500),
    tags text[] DEFAULT '{}'::text[],
    related_items text[] DEFAULT '{}'::text[],
    sources text[] DEFAULT '{}'::text[],
    status character varying(20) DEFAULT 'active'::character varying,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT cultural_knowledge_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'pending'::character varying])::text[])))
);


ALTER TABLE public.cultural_knowledge OWNER TO postgres;

--
-- Name: TABLE cultural_knowledge; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.cultural_knowledge IS '文化知识库表，存储文化知识条目';


--
-- Name: COLUMN cultural_knowledge.title; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.cultural_knowledge.title IS '知识条目标题';


--
-- Name: COLUMN cultural_knowledge.category; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.cultural_knowledge.category IS '知识分类';


--
-- Name: COLUMN cultural_knowledge.subcategory; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.cultural_knowledge.subcategory IS '子分类';


--
-- Name: COLUMN cultural_knowledge.content; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.cultural_knowledge.content IS '知识内容';


--
-- Name: COLUMN cultural_knowledge.image_url; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.cultural_knowledge.image_url IS '封面图片URL';


--
-- Name: COLUMN cultural_knowledge.tags; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.cultural_knowledge.tags IS '标签数组';


--
-- Name: COLUMN cultural_knowledge.related_items; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.cultural_knowledge.related_items IS '相关条目ID数组';


--
-- Name: COLUMN cultural_knowledge.sources; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.cultural_knowledge.sources IS '参考来源数组';


--
-- Name: COLUMN cultural_knowledge.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.cultural_knowledge.status IS '状态：active-已发布, inactive-已下架, pending-待审核';


--
-- Name: cultural_knowledge_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cultural_knowledge_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cultural_knowledge_id_seq OWNER TO postgres;

--
-- Name: cultural_knowledge_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cultural_knowledge_id_seq OWNED BY public.cultural_knowledge.id;


--
-- Name: memberships; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.memberships (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    plan_type character varying(50) NOT NULL,
    status character varying(50) DEFAULT 'active'::character varying NOT NULL,
    amount numeric(10,2) NOT NULL,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone NOT NULL,
    payment_method character varying(50),
    transaction_id character varying(255),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT memberships_plan_type_check CHECK (((plan_type)::text = ANY ((ARRAY['monthly'::character varying, 'quarterly'::character varying, 'yearly'::character varying, 'lifetime'::character varying])::text[]))),
    CONSTRAINT memberships_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'expired'::character varying, 'cancelled'::character varying, 'pending'::character varying])::text[])))
);


ALTER TABLE public.memberships OWNER TO postgres;

--
-- Name: TABLE memberships; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.memberships IS '会员订阅表';


--
-- Name: COLUMN memberships.user_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.memberships.user_id IS '用户 ID';


--
-- Name: COLUMN memberships.plan_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.memberships.plan_type IS '套餐类型：monthly(月卡), quarterly(季卡), yearly(年卡), lifetime(终身)';


--
-- Name: COLUMN memberships.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.memberships.status IS '状态：active(有效), expired(过期), cancelled(取消), pending(待支付)';


--
-- Name: COLUMN memberships.amount; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.memberships.amount IS '订阅金额';


--
-- Name: COLUMN memberships.start_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.memberships.start_date IS '开始日期';


--
-- Name: COLUMN memberships.end_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.memberships.end_date IS '结束日期';


--
-- Name: COLUMN memberships.payment_method; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.memberships.payment_method IS '支付方式';


--
-- Name: COLUMN memberships.transaction_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.memberships.transaction_id IS '交易 ID';


--
-- Name: promotion_orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.promotion_orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    order_no text NOT NULL,
    work_id text,
    work_title text,
    work_thumbnail text,
    package_type text NOT NULL,
    package_name text,
    package_duration integer,
    expected_views_min integer,
    expected_views_max integer,
    target_type text DEFAULT 'account'::text NOT NULL,
    metric_type text DEFAULT 'views'::text NOT NULL,
    original_price numeric(10,2) NOT NULL,
    discount_amount numeric(10,2) DEFAULT 0,
    final_price numeric(10,2) NOT NULL,
    coupon_id text,
    coupon_code text,
    coupon_discount numeric(10,2) DEFAULT 0,
    status text DEFAULT 'pending'::text NOT NULL,
    payment_method text,
    payment_time timestamp with time zone,
    transaction_id text,
    start_time timestamp with time zone,
    end_time timestamp with time zone,
    actual_views integer DEFAULT 0,
    actual_clicks integer DEFAULT 0,
    actual_conversions integer DEFAULT 0,
    refund_amount numeric(10,2) DEFAULT 0,
    refund_reason text,
    refund_time timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    notes text,
    metadata jsonb DEFAULT '{}'::jsonb,
    audit_notes text,
    audited_at timestamp with time zone,
    channel character varying(100),
    channel_cost numeric(10,2) DEFAULT 0,
    CONSTRAINT promotion_orders_metric_type_check CHECK ((metric_type = ANY (ARRAY['views'::text, 'fans'::text, 'interactions'::text, 'hot'::text, 'followers'::text, 'engagement'::text, 'heat'::text]))),
    CONSTRAINT promotion_orders_package_type_check CHECK ((package_type = ANY (ARRAY['standard'::text, 'basic'::text, 'long'::text, 'custom'::text]))),
    CONSTRAINT promotion_orders_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'paid'::text, 'processing'::text, 'active'::text, 'completed'::text, 'cancelled'::text, 'refunded'::text]))),
    CONSTRAINT promotion_orders_target_type_check CHECK ((target_type = ANY (ARRAY['account'::text, 'transaction'::text, 'live'::text, 'product'::text])))
);


ALTER TABLE public.promotion_orders OWNER TO postgres;

--
-- Name: COLUMN promotion_orders.channel; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.promotion_orders.channel IS '推广渠道：feed(信息流), social(社交媒体), search(搜索引擎), kol(KOL 合作), content(内容营销)';


--
-- Name: COLUMN promotion_orders.channel_cost; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.promotion_orders.channel_cost IS '渠道成本';


--
-- Name: daily_revenue_stats; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.daily_revenue_stats AS
 SELECT date(memberships.created_at) AS date,
    'membership'::text AS revenue_type,
    count(*) AS count,
    sum(memberships.amount) AS total_amount
   FROM public.memberships
  WHERE ((memberships.status)::text = 'active'::text)
  GROUP BY (date(memberships.created_at))
UNION ALL
 SELECT date(blind_box_sales.created_at) AS date,
    'blind_box'::text AS revenue_type,
    count(*) AS count,
    sum(blind_box_sales.price) AS total_amount
   FROM public.blind_box_sales
  WHERE ((blind_box_sales.status)::text = 'completed'::text)
  GROUP BY (date(blind_box_sales.created_at))
UNION ALL
 SELECT date(promotion_orders.created_at) AS date,
    'promotion'::text AS revenue_type,
    count(*) AS count,
    sum(promotion_orders.final_price) AS total_amount
   FROM public.promotion_orders
  WHERE (promotion_orders.status = 'paid'::text)
  GROUP BY (date(promotion_orders.created_at));


ALTER VIEW public.daily_revenue_stats OWNER TO postgres;

--
-- Name: direct_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.direct_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sender_id uuid NOT NULL,
    receiver_id uuid NOT NULL,
    content text NOT NULL,
    type text DEFAULT 'text'::text,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT direct_messages_type_check CHECK ((type = ANY (ARRAY['text'::text, 'image'::text, 'work_share'::text, 'community_invite'::text])))
);


ALTER TABLE public.direct_messages OWNER TO postgres;

--
-- Name: drafts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.drafts (
    id text NOT NULL,
    user_id uuid NOT NULL,
    title text,
    content text,
    template_id text,
    template_name text,
    summary text,
    category text,
    tags text[],
    is_favorite boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.drafts OWNER TO postgres;

--
-- Name: errors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.errors (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    error_type character varying(100) NOT NULL,
    error_message text NOT NULL,
    stack_trace text,
    context jsonb,
    status_code integer,
    url text,
    user_agent text,
    ip_address inet,
    is_resolved boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.errors OWNER TO postgres;

--
-- Name: event_bookmarks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.event_bookmarks (
    user_id text NOT NULL,
    event_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.event_bookmarks OWNER TO postgres;

--
-- Name: TABLE event_bookmarks; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.event_bookmarks IS '活动收藏表';


--
-- Name: event_daily_stats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.event_daily_stats (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    stat_date date NOT NULL,
    submissions_count integer DEFAULT 0,
    views_count integer DEFAULT 0,
    likes_count integer DEFAULT 0,
    comments_count integer DEFAULT 0,
    unique_visitors integer DEFAULT 0,
    avg_score numeric(5,2),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.event_daily_stats OWNER TO postgres;

--
-- Name: event_likes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.event_likes (
    user_id text NOT NULL,
    event_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.event_likes OWNER TO postgres;

--
-- Name: TABLE event_likes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.event_likes IS '活动点赞表';


--
-- Name: event_notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.event_notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    event_id uuid,
    type text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    is_read boolean DEFAULT false,
    is_important boolean DEFAULT false,
    action_url text,
    action_text text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    read_at timestamp with time zone
);


ALTER TABLE public.event_notifications OWNER TO postgres;

--
-- Name: event_participants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.event_participants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    user_id uuid NOT NULL,
    status text DEFAULT 'pending'::text,
    registration_date bigint DEFAULT (EXTRACT(epoch FROM now()))::bigint NOT NULL,
    updated_at bigint DEFAULT ((EXTRACT(epoch FROM now()))::bigint * 1000) NOT NULL,
    progress integer DEFAULT 0,
    current_step integer DEFAULT 1,
    submitted_work_id uuid,
    submission_data jsonb DEFAULT '{}'::jsonb,
    submission_date bigint,
    ranking integer,
    award text,
    notes text,
    created_at bigint DEFAULT ((EXTRACT(epoch FROM now()))::bigint * 1000),
    CONSTRAINT event_participants_current_step_check CHECK (((current_step >= 1) AND (current_step <= 4))),
    CONSTRAINT event_participants_progress_check CHECK (((progress >= 0) AND (progress <= 100)))
);


ALTER TABLE public.event_participants OWNER TO postgres;

--
-- Name: event_prizes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.event_prizes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    level integer DEFAULT 1 NOT NULL,
    rank_name character varying(100) NOT NULL,
    combination_type character varying(20) DEFAULT 'single'::character varying NOT NULL,
    single_prize jsonb,
    sub_prizes jsonb,
    display_order integer DEFAULT 0 NOT NULL,
    is_highlight boolean DEFAULT false NOT NULL,
    highlight_color character varying(20),
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.event_prizes OWNER TO postgres;

--
-- Name: TABLE event_prizes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.event_prizes IS '活动奖品表，存储每个活动的奖品配置';


--
-- Name: COLUMN event_prizes.level; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.event_prizes.level IS '奖品等级：1=一等奖, 2=二等奖, 3=三等奖, 4=四等奖, 5=五等奖, 0=特别奖, 99=参与奖';


--
-- Name: COLUMN event_prizes.combination_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.event_prizes.combination_type IS '奖品组合类型：single=单一奖品, compound=复合奖品';


--
-- Name: COLUMN event_prizes.single_prize; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.event_prizes.single_prize IS '单一奖品详情，JSON格式';


--
-- Name: COLUMN event_prizes.sub_prizes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.event_prizes.sub_prizes IS '复合奖品子奖品列表，JSON数组格式';


--
-- Name: event_submissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.event_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    user_id uuid NOT NULL,
    work_id uuid,
    work_title text,
    work_thumbnail text,
    description text,
    status text DEFAULT 'pending'::text,
    score integer,
    feedback text,
    submission_date bigint DEFAULT (EXTRACT(epoch FROM now()))::bigint NOT NULL,
    updated_at bigint DEFAULT ((EXTRACT(epoch FROM now()))::bigint * 1000) NOT NULL,
    vote_count integer DEFAULT 0,
    like_count integer DEFAULT 0,
    avg_rating numeric(5,2) DEFAULT 0,
    rating_count integer DEFAULT 0,
    media_type text DEFAULT 'image'::text,
    participation_id uuid,
    title text DEFAULT ''::text NOT NULL,
    files jsonb DEFAULT '[]'::jsonb,
    submitted_at bigint,
    created_at bigint DEFAULT ((EXTRACT(epoch FROM now()))::bigint * 1000),
    cover_image text,
    metadata jsonb DEFAULT '{}'::jsonb,
    reviewed_at timestamp with time zone,
    review_notes text,
    published_at timestamp with time zone,
    CONSTRAINT event_submissions_media_type_check CHECK ((media_type = ANY (ARRAY['image'::text, 'video'::text, 'audio'::text, 'document'::text, 'other'::text]))),
    CONSTRAINT event_submissions_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'submitted'::text, 'under_review'::text, 'reviewed'::text, 'rejected'::text, 'published'::text])))
);


ALTER TABLE public.event_submissions OWNER TO postgres;

--
-- Name: TABLE event_submissions; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.event_submissions IS '活动作品提交表';


--
-- Name: COLUMN event_submissions.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.event_submissions.status IS '作品状态: draft-草稿, submitted-已提交, under_review-审核中, reviewed-已审核, rejected-已驳回, published-已发布';


--
-- Name: COLUMN event_submissions.metadata; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.event_submissions.metadata IS '扩展元数据，包含标签、文化元素、优先级等';


--
-- Name: event_works; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.event_works (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    work_id uuid NOT NULL,
    user_id uuid NOT NULL,
    participation_id uuid,
    submitted_at timestamp with time zone DEFAULT now(),
    status text DEFAULT 'submitted'::text,
    prize_rank integer,
    prize_title text,
    prize_reward text,
    judge_notes text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.event_works OWNER TO postgres;

--
-- Name: events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    start_date bigint NOT NULL,
    end_date bigint NOT NULL,
    location text,
    organizer_id uuid,
    requirements text,
    rewards text,
    visibility text DEFAULT 'public'::text,
    status text DEFAULT 'draft'::text,
    registration_deadline bigint,
    max_participants integer,
    created_at bigint DEFAULT (EXTRACT(epoch FROM now()))::bigint NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    published_at bigint,
    image_url text,
    category text,
    tags text[],
    platform_event_id text,
    content text DEFAULT ''::text NOT NULL,
    media jsonb DEFAULT '[]'::jsonb,
    thumbnail_url text,
    start_time timestamp with time zone DEFAULT now() NOT NULL,
    end_time timestamp with time zone DEFAULT now() NOT NULL,
    type text DEFAULT 'offline'::text NOT NULL,
    is_public boolean DEFAULT true NOT NULL,
    contact_name text,
    contact_phone text,
    contact_email text,
    push_to_community boolean DEFAULT false,
    apply_for_recommendation boolean DEFAULT false,
    participants integer DEFAULT 0,
    current_participants integer DEFAULT 0,
    review_start_date bigint,
    result_date bigint,
    phase_status character varying(50) DEFAULT 'registration'::character varying,
    final_ranking_published boolean DEFAULT false,
    final_ranking_published_at timestamp with time zone,
    final_ranking_published_by uuid,
    final_ranking_data jsonb,
    brand_id text,
    CONSTRAINT events_type_check CHECK ((type = ANY (ARRAY['online'::text, 'offline'::text])))
);


ALTER TABLE public.events OWNER TO postgres;

--
-- Name: TABLE events; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.events IS '活动表，包含活动基本信息和状态';


--
-- Name: COLUMN events.final_ranking_published; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.events.final_ranking_published IS '最终排名是否已发布';


--
-- Name: COLUMN events.final_ranking_published_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.events.final_ranking_published_at IS '最终排名发布时间';


--
-- Name: COLUMN events.final_ranking_data; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.events.final_ranking_data IS '最终排名数据快照';


--
-- Name: exchange_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.exchange_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    product_id text NOT NULL,
    product_name text NOT NULL,
    product_category text,
    points_cost integer NOT NULL,
    quantity integer DEFAULT 1,
    status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now(),
    admin_notes text,
    processed_by character varying(100),
    processed_at timestamp with time zone,
    product_image text,
    user_email text,
    contact_phone character varying(50),
    shipping_address text,
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT exchange_records_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'cancelled'::text, 'refunded'::text])))
);


ALTER TABLE public.exchange_records OWNER TO postgres;

--
-- Name: TABLE exchange_records; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.exchange_records IS '积分兑换记录表';


--
-- Name: COLUMN exchange_records.admin_notes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.exchange_records.admin_notes IS '管理员处理备注';


--
-- Name: COLUMN exchange_records.processed_by; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.exchange_records.processed_by IS '处理人ID或名称';


--
-- Name: COLUMN exchange_records.processed_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.exchange_records.processed_at IS '处理时间';


--
-- Name: COLUMN exchange_records.product_image; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.exchange_records.product_image IS '商品图片URL';


--
-- Name: COLUMN exchange_records.user_email; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.exchange_records.user_email IS '用户邮箱';


--
-- Name: COLUMN exchange_records.contact_phone; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.exchange_records.contact_phone IS '联系电话';


--
-- Name: COLUMN exchange_records.shipping_address; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.exchange_records.shipping_address IS '配送地址';


--
-- Name: favorites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.favorites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    post_id integer,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.favorites OWNER TO postgres;

--
-- Name: feed_collects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.feed_collects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    feed_id text NOT NULL,
    user_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.feed_collects OWNER TO postgres;

--
-- Name: feed_comment_likes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.feed_comment_likes (
    user_id text NOT NULL,
    comment_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.feed_comment_likes OWNER TO postgres;

--
-- Name: feed_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.feed_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    feed_id text NOT NULL,
    user_id text NOT NULL,
    content text NOT NULL,
    parent_id uuid,
    likes_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    author_name text,
    author_avatar text
);


ALTER TABLE public.feed_comments OWNER TO postgres;

--
-- Name: feed_likes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.feed_likes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    feed_id text NOT NULL,
    user_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.feed_likes OWNER TO postgres;

--
-- Name: feedback_process_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.feedback_process_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    feedback_id uuid,
    admin_id uuid,
    action character varying(50) NOT NULL,
    old_value text,
    new_value text,
    details jsonb,
    ip_address inet,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.feedback_process_logs OWNER TO postgres;

--
-- Name: feeds; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.feeds (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    content text NOT NULL,
    images text[] DEFAULT '{}'::text[],
    videos text[] DEFAULT '{}'::text[],
    community_id text,
    likes integer DEFAULT 0,
    comments integer DEFAULT 0,
    shares integer DEFAULT 0,
    views integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.feeds OWNER TO postgres;

--
-- Name: final_ranking_publishes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.final_ranking_publishes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    published_by uuid NOT NULL,
    published_at timestamp with time zone DEFAULT now(),
    ranking_data jsonb NOT NULL,
    notification_sent boolean DEFAULT false,
    notification_sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.final_ranking_publishes OWNER TO postgres;

--
-- Name: TABLE final_ranking_publishes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.final_ranking_publishes IS '最终排名发布记录表';


--
-- Name: follows; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.follows (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    follower_id uuid,
    following_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.follows OWNER TO postgres;

--
-- Name: forbidden_words; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.forbidden_words (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    word text NOT NULL,
    category text DEFAULT 'general'::text NOT NULL,
    severity integer DEFAULT 1 NOT NULL,
    is_regex boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT forbidden_words_severity_check CHECK (((severity >= 1) AND (severity <= 5)))
);


ALTER TABLE public.forbidden_words OWNER TO postgres;

--
-- Name: TABLE forbidden_words; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.forbidden_words IS '违禁词库';


--
-- Name: COLUMN forbidden_words.severity; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.forbidden_words.severity IS '严重程度 1-5，5级最严重';


--
-- Name: friend_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.friend_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sender_id uuid NOT NULL,
    receiver_id uuid NOT NULL,
    status text DEFAULT 'pending'::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT friend_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text])))
);


ALTER TABLE public.friend_requests OWNER TO postgres;

--
-- Name: friends; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.friends (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    friend_id text NOT NULL,
    user_note character varying(255),
    friend_note character varying(255),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.friends OWNER TO postgres;

--
-- Name: home_recommendations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.home_recommendations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    item_id character varying(255) NOT NULL,
    item_type character varying(50) NOT NULL,
    title character varying(500) NOT NULL,
    description text,
    thumbnail character varying(1000),
    order_index integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    click_count integer DEFAULT 0,
    impression_count integer DEFAULT 0,
    created_by character varying(255),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    metadata jsonb DEFAULT '{}'::jsonb
);


ALTER TABLE public.home_recommendations OWNER TO postgres;

--
-- Name: TABLE home_recommendations; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.home_recommendations IS '首页推荐位配置表';


--
-- Name: COLUMN home_recommendations.id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.home_recommendations.id IS '推荐项主键';


--
-- Name: COLUMN home_recommendations.item_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.home_recommendations.item_id IS '推荐项 ID（作品 ID、活动 ID、模板 ID 等）';


--
-- Name: COLUMN home_recommendations.item_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.home_recommendations.item_type IS '推荐项类型：work(作品), event(活动), template(模板), challenge(挑战)';


--
-- Name: COLUMN home_recommendations.title; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.home_recommendations.title IS '推荐项标题';


--
-- Name: COLUMN home_recommendations.description; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.home_recommendations.description IS '推荐项描述';


--
-- Name: COLUMN home_recommendations.thumbnail; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.home_recommendations.thumbnail IS '缩略图 URL';


--
-- Name: COLUMN home_recommendations.order_index; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.home_recommendations.order_index IS '排序索引，数值越小越靠前';


--
-- Name: COLUMN home_recommendations.is_active; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.home_recommendations.is_active IS '是否激活';


--
-- Name: COLUMN home_recommendations.start_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.home_recommendations.start_date IS '开始显示时间';


--
-- Name: COLUMN home_recommendations.end_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.home_recommendations.end_date IS '结束显示时间';


--
-- Name: COLUMN home_recommendations.click_count; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.home_recommendations.click_count IS '点击次数';


--
-- Name: COLUMN home_recommendations.impression_count; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.home_recommendations.impression_count IS '曝光次数';


--
-- Name: COLUMN home_recommendations.created_by; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.home_recommendations.created_by IS '创建人 ID';


--
-- Name: COLUMN home_recommendations.created_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.home_recommendations.created_at IS '创建时间';


--
-- Name: COLUMN home_recommendations.updated_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.home_recommendations.updated_at IS '更新时间';


--
-- Name: COLUMN home_recommendations.metadata; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.home_recommendations.metadata IS '额外元数据';


--
-- Name: hot_searches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.hot_searches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    query text NOT NULL,
    search_count integer DEFAULT 1,
    unique_searchers integer DEFAULT 1,
    trend_score numeric(10,4) DEFAULT 0,
    category character varying(50),
    is_active boolean DEFAULT true,
    last_searched_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.hot_searches OWNER TO postgres;

--
-- Name: TABLE hot_searches; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.hot_searches IS '热门搜索表';


--
-- Name: hourly_stats; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.hourly_stats AS
 SELECT date_trunc('hour'::text, created_at) AS hour,
    action,
    count(*) AS count
   FROM public.user_behavior_logs
  WHERE (created_at >= (now() - '24:00:00'::interval))
  GROUP BY (date_trunc('hour'::text, created_at)), action
  ORDER BY (date_trunc('hour'::text, created_at)) DESC;


ALTER VIEW public.hourly_stats OWNER TO postgres;

--
-- Name: inspiration_ai_suggestions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.inspiration_ai_suggestions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    node_id uuid NOT NULL,
    type text NOT NULL,
    content text NOT NULL,
    prompt text,
    confidence double precision DEFAULT 0.8,
    is_applied boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.inspiration_ai_suggestions OWNER TO postgres;

--
-- Name: TABLE inspiration_ai_suggestions; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.inspiration_ai_suggestions IS 'AI建议表';


--
-- Name: inspiration_mindmaps; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.inspiration_mindmaps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text DEFAULT '未命名脉络'::text NOT NULL,
    description text,
    layout_type text DEFAULT 'tree'::text,
    settings jsonb DEFAULT '{"theme": "tianjin", "autoSave": true, "gridSize": 20, "showGrid": true, "layoutType": "tree", "snapToGrid": false}'::jsonb,
    stats jsonb DEFAULT '{"maxDepth": 0, "totalNodes": 0, "cultureNodes": 0, "aiGeneratedNodes": 0}'::jsonb,
    tags text[] DEFAULT '{}'::text[],
    is_public boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.inspiration_mindmaps OWNER TO postgres;

--
-- Name: TABLE inspiration_mindmaps; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.inspiration_mindmaps IS '创作灵感脉络表';


--
-- Name: inspiration_nodes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.inspiration_nodes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    map_id uuid NOT NULL,
    parent_id uuid,
    title text DEFAULT '新节点'::text NOT NULL,
    description text,
    category text DEFAULT 'inspiration'::text,
    content jsonb,
    ai_prompt text,
    ai_generated_content text,
    user_note text,
    tags text[] DEFAULT '{}'::text[],
    style jsonb,
    brand_references jsonb,
    cultural_elements jsonb,
    ai_results jsonb,
    "position" jsonb,
    version integer DEFAULT 1,
    history jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.inspiration_nodes OWNER TO postgres;

--
-- Name: TABLE inspiration_nodes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.inspiration_nodes IS '脉络节点表';


--
-- Name: inspiration_stories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.inspiration_stories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    map_id uuid NOT NULL,
    title text NOT NULL,
    subtitle text,
    full_story text,
    key_turning_points jsonb DEFAULT '[]'::jsonb,
    culture_elements text[] DEFAULT '{}'::text[],
    timeline jsonb DEFAULT '[]'::jsonb,
    stats jsonb,
    themes text[] DEFAULT '{}'::text[],
    participants uuid[] DEFAULT '{}'::uuid[],
    generated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.inspiration_stories OWNER TO postgres;

--
-- Name: TABLE inspiration_stories; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.inspiration_stories IS '创作故事表';


--
-- Name: invitation_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.invitation_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reporter_id text NOT NULL,
    invitation_id uuid,
    reported_user_id text NOT NULL,
    community_id character varying(50) NOT NULL,
    reason character varying(50) NOT NULL,
    description text,
    status character varying(20) DEFAULT 'pending'::character varying,
    resolved_by text,
    resolved_at timestamp with time zone,
    resolution_note text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT invitation_reports_reason_check CHECK (((reason)::text = ANY ((ARRAY['spam'::character varying, 'harassment'::character varying, 'inappropriate'::character varying, 'fake'::character varying, 'other'::character varying])::text[]))),
    CONSTRAINT invitation_reports_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'investigating'::character varying, 'resolved'::character varying, 'dismissed'::character varying])::text[])))
);


ALTER TABLE public.invitation_reports OWNER TO postgres;

--
-- Name: TABLE invitation_reports; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.invitation_reports IS '邀请举报表，记录不当邀请的举报';


--
-- Name: invite_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.invite_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    inviter_id uuid NOT NULL,
    invitee_id uuid,
    invite_code text NOT NULL,
    status text DEFAULT 'pending'::text,
    inviter_points integer DEFAULT 0,
    invitee_points integer DEFAULT 0,
    registered_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT invite_records_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'registered'::text, 'completed'::text])))
);


ALTER TABLE public.invite_records OWNER TO postgres;

--
-- Name: TABLE invite_records; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.invite_records IS '邀请记录表';


--
-- Name: ip_activities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.ip_activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    ip_asset_id uuid,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT ip_activities_type_check CHECK (((type)::text = ANY ((ARRAY['progress'::character varying, 'opportunity'::character varying, 'milestone'::character varying, 'alert'::character varying])::text[])))
);


ALTER TABLE public.ip_activities OWNER TO postgres;

--
-- Name: ip_assets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.ip_assets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    type character varying(50) NOT NULL,
    original_work_id uuid,
    commercial_value integer DEFAULT 0,
    thumbnail text,
    status character varying(50) DEFAULT 'active'::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    reviewed_at timestamp with time zone,
    reviewed_by uuid,
    review_notes text,
    priority character varying(20) DEFAULT 'medium'::character varying,
    is_featured boolean DEFAULT false,
    tags jsonb DEFAULT '[]'::jsonb,
    cultural_elements jsonb DEFAULT '[]'::jsonb,
    view_count integer DEFAULT 0,
    like_count integer DEFAULT 0,
    CONSTRAINT ip_assets_priority_check CHECK (((priority)::text = ANY ((ARRAY['high'::character varying, 'medium'::character varying, 'low'::character varying])::text[]))),
    CONSTRAINT ip_assets_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'archived'::character varying, 'deleted'::character varying, 'pending_review'::character varying, 'rejected'::character varying])::text[]))),
    CONSTRAINT ip_assets_type_check CHECK (((type)::text = ANY ((ARRAY['illustration'::character varying, 'pattern'::character varying, 'design'::character varying, '3d_model'::character varying, 'digital_collectible'::character varying])::text[])))
);


ALTER TABLE public.ip_assets OWNER TO postgres;

--
-- Name: ip_asset_audit_stats; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.ip_asset_audit_stats AS
 SELECT count(*) AS total,
    count(*) FILTER (WHERE ((status)::text = 'pending_review'::text)) AS pending,
    count(*) FILTER (WHERE ((status)::text = ANY ((ARRAY['active'::character varying, 'approved'::character varying])::text[]))) AS approved,
    count(*) FILTER (WHERE ((status)::text = 'rejected'::text)) AS rejected,
    count(*) FILTER (WHERE (created_at >= CURRENT_DATE)) AS today_submitted,
    count(*) FILTER (WHERE (reviewed_at >= CURRENT_DATE)) AS today_reviewed
   FROM public.ip_assets;


ALTER VIEW public.ip_asset_audit_stats OWNER TO postgres;

--
-- Name: ip_partnerships; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.ip_partnerships (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ip_asset_id uuid NOT NULL,
    opportunity_id uuid,
    user_id uuid NOT NULL,
    brand_name character varying(255),
    description text,
    reward character varying(255),
    status character varying(50) DEFAULT 'pending'::character varying,
    notes text,
    contract_url text,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT ip_partnerships_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'negotiating'::character varying, 'approved'::character varying, 'rejected'::character varying, 'completed'::character varying])::text[])))
);


ALTER TABLE public.ip_partnerships OWNER TO postgres;

--
-- Name: ip_stages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.ip_stages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ip_asset_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    order_index integer DEFAULT 0 NOT NULL,
    completed boolean DEFAULT false,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.ip_stages OWNER TO postgres;

--
-- Name: ip_stats; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.ip_stats AS
 SELECT user_id,
    count(*) AS total_assets,
    count(*) FILTER (WHERE (EXISTS ( SELECT 1
           FROM public.ip_stages
          WHERE ((ip_stages.ip_asset_id = ip_assets.id) AND (ip_stages.completed = false))))) AS in_progress_assets,
    count(*) FILTER (WHERE (NOT (EXISTS ( SELECT 1
           FROM public.ip_stages
          WHERE ((ip_stages.ip_asset_id = ip_assets.id) AND (ip_stages.completed = false)))))) AS completed_assets,
    sum(commercial_value) AS total_estimated_value
   FROM public.ip_assets
  WHERE ((status)::text = 'active'::text)
  GROUP BY user_id;


ALTER VIEW public.ip_stats OWNER TO postgres;

--
-- Name: submission_scores; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.submission_scores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    submission_id uuid NOT NULL,
    judge_id uuid NOT NULL,
    score numeric(5,2) NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT submission_scores_score_check CHECK (((score >= (0)::numeric) AND (score <= (10)::numeric)))
);


ALTER TABLE public.submission_scores OWNER TO postgres;

--
-- Name: judge_score_details; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.judge_score_details AS
 SELECT ss.id,
    ss.submission_id,
    ss.judge_id,
    (u.raw_user_meta_data ->> 'username'::text) AS judge_name,
    (u.raw_user_meta_data ->> 'avatar_url'::text) AS judge_avatar,
    ss.score,
    ss.comment,
    ss.created_at,
    ss.updated_at
   FROM (public.submission_scores ss
     JOIN auth.users u ON ((ss.judge_id = u.id)));


ALTER VIEW public.judge_score_details OWNER TO postgres;

--
-- Name: VIEW judge_score_details; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.judge_score_details IS '评委评分详情视图';


--
-- Name: likes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.likes (
    user_id text NOT NULL,
    post_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.likes OWNER TO postgres;

--
-- Name: TABLE likes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.likes IS '社区帖子点赞表（RLS 已临时禁用）';


--
-- Name: lottery_activities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.lottery_activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    spin_cost integer DEFAULT 10 NOT NULL,
    daily_limit integer DEFAULT '-1'::integer NOT NULL,
    total_limit integer DEFAULT '-1'::integer NOT NULL,
    created_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT lottery_activities_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'active'::character varying, 'paused'::character varying, 'ended'::character varying])::text[])))
);


ALTER TABLE public.lottery_activities OWNER TO postgres;

--
-- Name: TABLE lottery_activities; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.lottery_activities IS '转盘活动表';


--
-- Name: lottery_prizes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.lottery_prizes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    activity_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    probability numeric(5,4) NOT NULL,
    points integer DEFAULT 0 NOT NULL,
    stock integer DEFAULT '-1'::integer NOT NULL,
    image_url text,
    sort_order integer DEFAULT 0 NOT NULL,
    is_enabled boolean DEFAULT true NOT NULL,
    is_rare boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT lottery_prizes_probability_check CHECK (((probability >= (0)::numeric) AND (probability <= (1)::numeric)))
);


ALTER TABLE public.lottery_prizes OWNER TO postgres;

--
-- Name: TABLE lottery_prizes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.lottery_prizes IS '转盘奖品表';


--
-- Name: lottery_spin_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.lottery_spin_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    activity_id uuid NOT NULL,
    user_id uuid NOT NULL,
    prize_id uuid NOT NULL,
    cost integer DEFAULT 0 NOT NULL,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.lottery_spin_records OWNER TO postgres;

--
-- Name: TABLE lottery_spin_records; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.lottery_spin_records IS '用户抽奖记录表';


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    username text NOT NULL,
    email text NOT NULL,
    password_hash text,
    phone text,
    avatar_url text,
    interests text[],
    age integer,
    tags text[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    github_id text,
    github_username text,
    auth_provider text DEFAULT 'local'::text,
    is_new_user boolean DEFAULT true,
    membership_level text DEFAULT 'free'::text,
    membership_status text DEFAULT 'active'::text,
    membership_start bigint,
    membership_end bigint,
    posts_count integer DEFAULT 0,
    likes_count integer DEFAULT 0,
    views integer DEFAULT 0,
    followers_count integer DEFAULT 0,
    following_count integer DEFAULT 0,
    email_login_code text,
    email_login_expires timestamp with time zone,
    bio text,
    location text,
    occupation text,
    website text,
    social_links jsonb,
    github text,
    twitter text,
    cover_image text,
    metadata jsonb,
    is_admin boolean DEFAULT false,
    role character varying(50) DEFAULT 'user'::character varying,
    is_verified boolean DEFAULT false,
    status text DEFAULT 'active'::text,
    CONSTRAINT users_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'banned'::text, 'pending'::text])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: COLUMN users.avatar_url; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.avatar_url IS '用户头像URL';


--
-- Name: COLUMN users.created_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.created_at IS '用户创建时间 (TIMESTAMPTZ)';


--
-- Name: COLUMN users.updated_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.updated_at IS '用户更新时间 (TIMESTAMPTZ)';


--
-- Name: COLUMN users.email_login_code; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.email_login_code IS '邮箱登录验证码';


--
-- Name: COLUMN users.email_login_expires; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.email_login_expires IS '邮箱登录验证码过期时间';


--
-- Name: COLUMN users.cover_image; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.cover_image IS '用户封面图片URL';


--
-- Name: COLUMN users.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.status IS '用户状态: active(活跃), inactive(未激活), banned(禁用), pending(待审核)';


--
-- Name: lottery_spin_records_with_users; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.lottery_spin_records_with_users AS
 SELECT r.id,
    r.activity_id,
    r.user_id,
    r.prize_id,
    r.cost,
    r.ip_address,
    r.user_agent,
    r.created_at,
    a.name AS activity_name,
    p.name AS prize_name,
    p.points AS prize_points,
    u.username,
    u.avatar_url AS avatar
   FROM (((public.lottery_spin_records r
     JOIN public.lottery_activities a ON ((r.activity_id = a.id)))
     JOIN public.lottery_prizes p ON ((r.prize_id = p.id)))
     LEFT JOIN public.users u ON ((r.user_id = u.id)));


ALTER VIEW public.lottery_spin_records_with_users OWNER TO postgres;

--
-- Name: membership_benefits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.membership_benefits (
    id integer NOT NULL,
    membership_level character varying(20),
    benefit text NOT NULL,
    sort_order integer DEFAULT 0,
    CONSTRAINT membership_benefits_membership_level_check CHECK (((membership_level)::text = ANY ((ARRAY['free'::character varying, 'premium'::character varying, 'vip'::character varying])::text[])))
);


ALTER TABLE public.membership_benefits OWNER TO postgres;

--
-- Name: membership_benefits_config; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.membership_benefits_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    level character varying(20) NOT NULL,
    name character varying(50) NOT NULL,
    description text,
    features jsonb DEFAULT '[]'::jsonb NOT NULL,
    limits jsonb DEFAULT '{}'::jsonb NOT NULL,
    pricing jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT membership_benefits_config_level_check CHECK (((level)::text = ANY ((ARRAY['free'::character varying, 'premium'::character varying, 'vip'::character varying])::text[])))
);


ALTER TABLE public.membership_benefits_config OWNER TO postgres;

--
-- Name: TABLE membership_benefits_config; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.membership_benefits_config IS '会员权益配置表';


--
-- Name: membership_benefits_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.membership_benefits_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.membership_benefits_id_seq OWNER TO postgres;

--
-- Name: membership_benefits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.membership_benefits_id_seq OWNED BY public.membership_benefits.id;


--
-- Name: membership_coupon_usage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.membership_coupon_usage (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    coupon_id uuid NOT NULL,
    user_id uuid NOT NULL,
    order_id text,
    discount_amount numeric(10,2) NOT NULL,
    used_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.membership_coupon_usage OWNER TO postgres;

--
-- Name: TABLE membership_coupon_usage; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.membership_coupon_usage IS '优惠券使用记录表';


--
-- Name: membership_coupons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.membership_coupons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    discount_type character varying(20) NOT NULL,
    discount_value numeric(10,2) NOT NULL,
    min_purchase_amount numeric(10,2) DEFAULT 0,
    max_discount_amount numeric(10,2),
    applicable_plans jsonb DEFAULT '["premium", "vip"]'::jsonb,
    usage_limit integer,
    usage_count integer DEFAULT 0,
    valid_from timestamp with time zone DEFAULT now(),
    valid_until timestamp with time zone,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT membership_coupons_discount_type_check CHECK (((discount_type)::text = ANY ((ARRAY['percentage'::character varying, 'fixed'::character varying])::text[])))
);


ALTER TABLE public.membership_coupons OWNER TO postgres;

--
-- Name: TABLE membership_coupons; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.membership_coupons IS '会员优惠券表';


--
-- Name: membership_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.membership_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    action_type character varying(50) NOT NULL,
    from_level character varying(20),
    to_level character varying(20),
    order_id text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT membership_history_action_type_check CHECK (((action_type)::text = ANY ((ARRAY['upgrade'::character varying, 'downgrade'::character varying, 'renew'::character varying, 'cancel'::character varying, 'expire'::character varying, 'refund'::character varying])::text[])))
);


ALTER TABLE public.membership_history OWNER TO postgres;

--
-- Name: TABLE membership_history; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.membership_history IS '会员历史记录表';


--
-- Name: membership_orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.membership_orders (
    id text NOT NULL,
    user_id uuid NOT NULL,
    plan character varying(20) NOT NULL,
    plan_name character varying(50) NOT NULL,
    period character varying(20) NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'CNY'::character varying,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    payment_method character varying(20),
    payment_data jsonb,
    created_at timestamp with time zone DEFAULT now(),
    paid_at timestamp with time zone,
    expires_at timestamp with time zone,
    refunded_at timestamp with time zone,
    refund_amount numeric(10,2),
    metadata jsonb DEFAULT '{}'::jsonb,
    payment_type character varying(20) DEFAULT 'enterprise'::character varying,
    payment_code character varying(50),
    payment_proof jsonb,
    payer_info jsonb,
    verified_by uuid,
    verified_at timestamp with time zone,
    notes text,
    CONSTRAINT membership_orders_payment_type_check CHECK (((payment_type)::text = ANY ((ARRAY['enterprise'::character varying, 'personal_qr'::character varying])::text[]))),
    CONSTRAINT membership_orders_period_check CHECK (((period)::text = ANY ((ARRAY['monthly'::character varying, 'quarterly'::character varying, 'yearly'::character varying])::text[]))),
    CONSTRAINT membership_orders_plan_check CHECK (((plan)::text = ANY ((ARRAY['free'::character varying, 'premium'::character varying, 'vip'::character varying])::text[]))),
    CONSTRAINT membership_orders_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'verifying'::character varying, 'completed'::character varying, 'failed'::character varying, 'cancelled'::character varying, 'refunded'::character varying])::text[])))
);


ALTER TABLE public.membership_orders OWNER TO postgres;

--
-- Name: TABLE membership_orders; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.membership_orders IS '会员订单表';


--
-- Name: COLUMN membership_orders.payment_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.membership_orders.payment_type IS '支付类型: enterprise(企业支付), personal_qr(个人收款码)';


--
-- Name: COLUMN membership_orders.payment_code; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.membership_orders.payment_code IS '个人收款码支付的识别码';


--
-- Name: COLUMN membership_orders.payment_proof; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.membership_orders.payment_proof IS '支付凭证信息(JSON)';


--
-- Name: COLUMN membership_orders.payer_info; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.membership_orders.payer_info IS '付款人信息(JSON)';


--
-- Name: COLUMN membership_orders.verified_by; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.membership_orders.verified_by IS '审核人ID';


--
-- Name: COLUMN membership_orders.verified_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.membership_orders.verified_at IS '审核时间';


--
-- Name: COLUMN membership_orders.notes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.membership_orders.notes IS '备注信息';


--
-- Name: membership_usage_stats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.membership_usage_stats (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    stat_date date DEFAULT CURRENT_DATE NOT NULL,
    ai_generations_count integer DEFAULT 0,
    storage_used_bytes bigint DEFAULT 0,
    exports_count integer DEFAULT 0,
    api_calls_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.membership_usage_stats OWNER TO postgres;

--
-- Name: TABLE membership_usage_stats; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.membership_usage_stats IS '会员使用统计表';


--
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.messages (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    conversation_id uuid,
    content text NOT NULL,
    role character varying(20) DEFAULT 'user'::character varying NOT NULL,
    is_deleted boolean DEFAULT false,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    channel_id text DEFAULT 'global'::text NOT NULL,
    community_id text,
    sender_id uuid,
    receiver_id uuid,
    status text DEFAULT 'sent'::text NOT NULL,
    type text DEFAULT 'text'::text NOT NULL,
    retry_count integer DEFAULT 0 NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    delivered_at timestamp with time zone,
    read_at timestamp with time zone,
    CONSTRAINT messages_role_check CHECK (((role)::text = ANY ((ARRAY['user'::character varying, 'assistant'::character varying, 'system'::character varying])::text[])))
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- Name: moderation_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.moderation_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    content_id uuid NOT NULL,
    content_type text NOT NULL,
    user_id uuid,
    action text NOT NULL,
    reason text,
    scores jsonb DEFAULT '{}'::jsonb,
    matched_words text[] DEFAULT '{}'::text[],
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT moderation_logs_action_check CHECK ((action = ANY (ARRAY['auto_approved'::text, 'auto_rejected'::text, 'manual_approved'::text, 'manual_rejected'::text, 'flagged'::text]))),
    CONSTRAINT moderation_logs_content_type_check CHECK ((content_type = ANY (ARRAY['work'::text, 'post'::text, 'comment'::text, 'activity'::text])))
);


ALTER TABLE public.moderation_logs OWNER TO postgres;

--
-- Name: TABLE moderation_logs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.moderation_logs IS '内容审核日志';


--
-- Name: moderation_rules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.moderation_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    rule_type text NOT NULL,
    enabled boolean DEFAULT true,
    threshold integer NOT NULL,
    auto_action text DEFAULT 'flag'::text NOT NULL,
    config jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT moderation_rules_auto_action_check CHECK ((auto_action = ANY (ARRAY['none'::text, 'flag'::text, 'reject'::text]))),
    CONSTRAINT moderation_rules_rule_type_check CHECK ((rule_type = ANY (ARRAY['sensitive_words'::text, 'spam_detection'::text, 'ai_generated'::text, 'cultural_authenticity'::text]))),
    CONSTRAINT moderation_rules_threshold_check CHECK (((threshold >= 0) AND (threshold <= 100)))
);


ALTER TABLE public.moderation_rules OWNER TO postgres;

--
-- Name: TABLE moderation_rules; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.moderation_rules IS '内容审核规则配置';


--
-- Name: new_content_boost_pool; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.new_content_boost_pool (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    content_id uuid NOT NULL,
    quality_score numeric(4,3),
    test_performance numeric(5,4),
    boost_factor numeric(3,2) DEFAULT 1.5,
    boost_start_time timestamp with time zone DEFAULT now(),
    boost_end_time timestamp with time zone,
    current_status character varying(20) DEFAULT 'boosting'::character varying,
    total_exposure integer DEFAULT 0,
    total_clicks integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.new_content_boost_pool OWNER TO postgres;

--
-- Name: TABLE new_content_boost_pool; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.new_content_boost_pool IS '新内容推荐池，已通过测试的内容获得流量提升';


--
-- Name: posts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    community_id text NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    images text[],
    likes integer DEFAULT 0,
    comments_count integer DEFAULT 0,
    views integer DEFAULT 0,
    is_pinned boolean DEFAULT false,
    is_announcement boolean DEFAULT false,
    status text DEFAULT 'published'::text,
    created_at bigint DEFAULT (EXTRACT(epoch FROM now()))::bigint NOT NULL,
    updated_at bigint DEFAULT (EXTRACT(epoch FROM now()))::bigint NOT NULL,
    likes_count integer DEFAULT 0,
    author_id text,
    upvotes integer DEFAULT 0,
    videos text[] DEFAULT '{}'::text[],
    audios text[] DEFAULT '{}'::text[]
);


ALTER TABLE public.posts OWNER TO postgres;

--
-- Name: new_content_performance; Type: VIEW; Schema: public; Owner: postgres
--
