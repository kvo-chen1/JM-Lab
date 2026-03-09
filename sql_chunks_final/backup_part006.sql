 SELECT ncbp.content_id,
    p.title,
    ncbp.quality_score,
    ncbp.test_performance,
    ncbp.boost_factor,
    ncbp.total_exposure,
    ncbp.total_clicks,
    round((((ncbp.total_clicks)::numeric / (NULLIF(ncbp.total_exposure, 0))::numeric) * (100)::numeric), 2) AS actual_ctr_percent,
    ncbp.current_status,
    ncbp.boost_start_time,
    ncbp.boost_end_time
   FROM (public.new_content_boost_pool ncbp
     JOIN public.posts p ON ((ncbp.content_id = p.id)))
  ORDER BY ncbp.test_performance DESC;


ALTER VIEW public.new_content_performance OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    sender_id uuid,
    type text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    data jsonb DEFAULT '{}'::jsonb,
    link text,
    is_read boolean DEFAULT false,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    comment_id text,
    post_id text,
    work_id text,
    sender_name text,
    community_id text,
    priority text,
    CONSTRAINT notifications_type_check CHECK ((type = ANY (ARRAY['private_message'::text, 'direct_message'::text, 'reply'::text, 'comment_reply'::text, 'post_commented'::text, 'mention'::text, 'at_mention'::text, 'comment_replied'::text, 'like'::text, 'post_liked'::text, 'comment_liked'::text, 'work_liked'::text, 'follow'::text, 'user_followed'::text, 'new_follower'::text, 'system'::text, 'announcement'::text, 'ranking_published'::text, 'feedback_resolved'::text, 'invitation_received'::text, 'invitation_accepted'::text, 'application_approved'::text, 'application_rejected'::text])))
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: order_applications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.order_applications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    creator_id uuid NOT NULL,
    creator_name text,
    creator_avatar text,
    status text DEFAULT 'pending'::text NOT NULL,
    message text,
    portfolio_url text,
    review_note text,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT order_applications_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);


ALTER TABLE public.order_applications OWNER TO postgres;

--
-- Name: TABLE order_applications; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.order_applications IS '商单接单申请表';


--
-- Name: COLUMN order_applications.order_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.order_applications.order_id IS '关联的商单ID';


--
-- Name: COLUMN order_applications.creator_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.order_applications.creator_id IS '申请者（创作者）ID';


--
-- Name: COLUMN order_applications.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.order_applications.status IS '申请状态：pending-待审核, approved-已通过, rejected-已拒绝';


--
-- Name: COLUMN order_applications.message; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.order_applications.message IS '申请留言/自我介绍';


--
-- Name: COLUMN order_applications.portfolio_url; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.order_applications.portfolio_url IS '作品集链接';


--
-- Name: COLUMN order_applications.review_note; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.order_applications.review_note IS '品牌方审核备注';


--
-- Name: order_audits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.order_audits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id text NOT NULL,
    user_id uuid NOT NULL,
    title text NOT NULL,
    brand_name text NOT NULL,
    type text NOT NULL,
    description text NOT NULL,
    budget_min numeric(10,2) NOT NULL,
    budget_max numeric(10,2) NOT NULL,
    deadline timestamp with time zone NOT NULL,
    duration text NOT NULL,
    location text NOT NULL,
    max_applicants integer DEFAULT 10 NOT NULL,
    difficulty text NOT NULL,
    requirements text[] DEFAULT '{}'::text[] NOT NULL,
    tags text[] DEFAULT '{}'::text[],
    attachments text[] DEFAULT '{}'::text[],
    status text DEFAULT 'pending'::text NOT NULL,
    audit_opinion text,
    audited_by uuid,
    audited_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT order_audits_difficulty_check CHECK ((difficulty = ANY (ARRAY['easy'::text, 'medium'::text, 'hard'::text]))),
    CONSTRAINT order_audits_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])))
);


ALTER TABLE public.order_audits OWNER TO postgres;

--
-- Name: TABLE order_audits; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.order_audits IS '商单审核表 - 品牌方发布的商单，需要管理员审核';


--
-- Name: COLUMN order_audits.type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.order_audits.type IS '商单类型：design-设计，illustration-插画，video-视频，writing-文案，photography-摄影，other-其他';


--
-- Name: COLUMN order_audits.difficulty; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.order_audits.difficulty IS '难度等级：easy-简单，medium-中等，hard-困难';


--
-- Name: COLUMN order_audits.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.order_audits.status IS '审核状态：pending-待审核，approved-已通过，rejected-已驳回';


--
-- Name: order_execution_clicks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.order_execution_clicks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    execution_id uuid NOT NULL,
    user_id uuid,
    clicked_at timestamp with time zone DEFAULT now() NOT NULL,
    converted boolean DEFAULT false NOT NULL,
    sale_amount numeric(10,2),
    ip_address inet,
    user_agent text
);


ALTER TABLE public.order_execution_clicks OWNER TO postgres;

--
-- Name: TABLE order_execution_clicks; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.order_execution_clicks IS '点击记录表 - 详细的点击和转化记录';


--
-- Name: COLUMN order_execution_clicks.converted; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.order_execution_clicks.converted IS '是否转化（购买）';


--
-- Name: COLUMN order_execution_clicks.sale_amount; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.order_execution_clicks.sale_amount IS '成交金额';


--
-- Name: order_execution_daily_stats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.order_execution_daily_stats (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    execution_id uuid NOT NULL,
    date date NOT NULL,
    clicks integer DEFAULT 0 NOT NULL,
    conversions integer DEFAULT 0 NOT NULL,
    sales numeric(12,2) DEFAULT 0.00 NOT NULL,
    earnings numeric(12,2) DEFAULT 0.00 NOT NULL
);


ALTER TABLE public.order_execution_daily_stats OWNER TO postgres;

--
-- Name: TABLE order_execution_daily_stats; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.order_execution_daily_stats IS '每日统计表 - 按天聚合的统计数据';


--
-- Name: order_executions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.order_executions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid,
    user_id uuid NOT NULL,
    work_id uuid,
    order_title text NOT NULL,
    brand_name text NOT NULL,
    product_name text NOT NULL,
    product_url text NOT NULL,
    product_image text,
    commission_rate numeric(5,2) DEFAULT 10.00 NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    click_count integer DEFAULT 0 NOT NULL,
    conversion_count integer DEFAULT 0 NOT NULL,
    total_sales numeric(12,2) DEFAULT 0.00 NOT NULL,
    total_earnings numeric(12,2) DEFAULT 0.00 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT order_executions_status_check CHECK ((status = ANY (ARRAY['active'::text, 'paused'::text, 'ended'::text])))
);


ALTER TABLE public.order_executions OWNER TO postgres;

--
-- Name: TABLE order_executions; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.order_executions IS '商单执行表 - 记录创作者接单后的执行情况';


--
-- Name: COLUMN order_executions.commission_rate; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.order_executions.commission_rate IS '佣金比例（百分比）';


--
-- Name: COLUMN order_executions.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.order_executions.status IS '状态：active-进行中，paused-已暂停，ended-已结束';


--
-- Name: organizer_backups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.organizer_backups (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organizer_id uuid NOT NULL,
    type character varying(20) DEFAULT 'manual'::character varying NOT NULL,
    size bigint DEFAULT 0,
    file_path text,
    download_url text,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.organizer_backups OWNER TO postgres;

--
-- Name: TABLE organizer_backups; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.organizer_backups IS '主办方数据备份记录表';


--
-- Name: organizer_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.organizer_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organizer_id uuid NOT NULL,
    brand_info jsonb DEFAULT '{}'::jsonb,
    security_settings jsonb DEFAULT '{}'::jsonb,
    notification_settings jsonb DEFAULT '{}'::jsonb,
    permission_settings jsonb DEFAULT '{}'::jsonb,
    data_management_settings jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.organizer_settings OWNER TO postgres;

--
-- Name: TABLE organizer_settings; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.organizer_settings IS '主办方设置表，存储品牌信息、安全设置、通知偏好等';


--
-- Name: COLUMN organizer_settings.brand_info; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.organizer_settings.brand_info IS '品牌信息，包含名称、Logo、描述、联系方式等';


--
-- Name: COLUMN organizer_settings.security_settings; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.organizer_settings.security_settings IS '安全设置，包含双因素认证、登录通知、会话超时等';


--
-- Name: COLUMN organizer_settings.notification_settings; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.organizer_settings.notification_settings IS '通知设置，包含邮件、站内信、短信通知配置';


--
-- Name: COLUMN organizer_settings.permission_settings; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.organizer_settings.permission_settings IS '权限设置，包含团队成员和角色配置';


--
-- Name: COLUMN organizer_settings.data_management_settings; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.organizer_settings.data_management_settings IS '数据管理设置，包含自动备份、导出格式等';


--
-- Name: page_views; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.page_views (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    session_id character varying(100),
    page_path text NOT NULL,
    page_title character varying(255),
    referrer text,
    device_type character varying(20),
    browser character varying(50),
    os character varying(50),
    country character varying(100),
    city character varying(100),
    ip_address inet,
    duration integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.page_views OWNER TO postgres;

--
-- Name: pending_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.pending_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    context text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.pending_messages OWNER TO postgres;

--
-- Name: TABLE pending_messages; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.pending_messages IS '用户待发送消息草稿表，类似于微信的草稿功能';


--
-- Name: COLUMN pending_messages.content; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pending_messages.content IS '消息内容';


--
-- Name: COLUMN pending_messages.context; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pending_messages.context IS '消息上下文，如页面路径、来源等';


--
-- Name: COLUMN pending_messages.metadata; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.pending_messages.metadata IS '额外元数据，JSON格式存储';


--
-- Name: points; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.points (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    amount integer NOT NULL,
    type character varying(50) NOT NULL,
    reason character varying(255) NOT NULL,
    related_id uuid,
    related_type character varying(50),
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT points_type_check CHECK (((type)::text = ANY ((ARRAY['earned'::character varying, 'spent'::character varying, 'adjustment'::character varying])::text[])))
);


ALTER TABLE public.points OWNER TO postgres;

--
-- Name: user_points_balance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.user_points_balance (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    balance integer DEFAULT 0 NOT NULL,
    total_earned integer DEFAULT 0 NOT NULL,
    total_spent integer DEFAULT 0 NOT NULL,
    version integer DEFAULT 1 NOT NULL,
    last_updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT user_points_balance_balance_check CHECK ((balance >= 0)),
    CONSTRAINT user_points_balance_total_earned_check CHECK ((total_earned >= 0)),
    CONSTRAINT user_points_balance_total_spent_check CHECK ((total_spent >= 0))
);


ALTER TABLE public.user_points_balance OWNER TO postgres;

--
-- Name: TABLE user_points_balance; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.user_points_balance IS '用户积分余额表';


--
-- Name: points_leaderboard; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.points_leaderboard AS
 SELECT upb.user_id,
    u.username,
    u.avatar_url,
    upb.balance,
    upb.total_earned,
    rank() OVER (ORDER BY upb.balance DESC) AS rank
   FROM (public.user_points_balance upb
     JOIN public.users u ON ((upb.user_id = u.id)))
  WHERE (upb.balance > 0)
  ORDER BY upb.balance DESC;


ALTER VIEW public.points_leaderboard OWNER TO postgres;

--
-- Name: points_limits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.points_limits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    source_type character varying(50) NOT NULL,
    period_type character varying(50) NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    limit_amount integer NOT NULL,
    used_amount integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT points_limits_period_type_check CHECK (((period_type)::text = ANY ((ARRAY['daily'::character varying, 'weekly'::character varying, 'monthly'::character varying, 'yearly'::character varying])::text[])))
);


ALTER TABLE public.points_limits OWNER TO postgres;

--
-- Name: points_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.points_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    points integer NOT NULL,
    type character varying(50) NOT NULL,
    source character varying(100) NOT NULL,
    source_type character varying(50),
    description text NOT NULL,
    balance_after integer NOT NULL,
    related_id uuid,
    related_type character varying(50),
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone,
    CONSTRAINT points_records_type_check CHECK (((type)::text = ANY ((ARRAY['earned'::character varying, 'spent'::character varying, 'adjustment'::character varying])::text[])))
);


ALTER TABLE public.points_records OWNER TO postgres;

--
-- Name: TABLE points_records; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.points_records IS '积分记录表';


--
-- Name: points_rules; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.points_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    rule_type text,
    source_type text NOT NULL,
    points integer DEFAULT 0,
    daily_limit integer,
    weekly_limit integer,
    monthly_limit integer,
    yearly_limit integer,
    is_active boolean DEFAULT true,
    priority integer DEFAULT 0,
    conditions jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT points_rules_rule_type_check CHECK ((rule_type = ANY (ARRAY['earn'::text, 'spend'::text, 'limit'::text])))
);


ALTER TABLE public.points_rules OWNER TO postgres;

--
-- Name: TABLE points_rules; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.points_rules IS '积分规则表';


--
-- Name: post_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.post_tags (
    post_id integer NOT NULL,
    tag_id integer NOT NULL
);


ALTER TABLE public.post_tags OWNER TO postgres;

--
-- Name: prize_winners; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.prize_winners (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_id uuid NOT NULL,
    user_id uuid NOT NULL,
    prize_id uuid NOT NULL,
    won_at timestamp with time zone DEFAULT now() NOT NULL,
    claimed boolean DEFAULT false NOT NULL,
    claimed_at timestamp with time zone,
    shipping_info jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.prize_winners OWNER TO postgres;

--
-- Name: TABLE prize_winners; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.prize_winners IS '获奖者表，存储用户获奖记录';


--
-- Name: product_links; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.product_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    work_id uuid NOT NULL,
    order_id uuid,
    product_name text NOT NULL,
    product_url text NOT NULL,
    product_image text,
    price numeric(10,2),
    commission_rate numeric(5,2),
    click_count integer DEFAULT 0 NOT NULL,
    conversion_count integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.product_links OWNER TO postgres;

--
-- Name: TABLE product_links; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.product_links IS '产品链接表 - 作品关联的商单链接';


--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(200) NOT NULL,
    description text NOT NULL,
    points integer NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    category character varying(50) NOT NULL,
    tags text[] DEFAULT '{}'::text[],
    image_url text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    is_featured boolean DEFAULT false NOT NULL,
    max_exchange_per_user integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT products_category_check CHECK (((category)::text = ANY ((ARRAY['virtual'::character varying, 'physical'::character varying, 'service'::character varying, 'rights'::character varying])::text[]))),
    CONSTRAINT products_points_check CHECK ((points > 0)),
    CONSTRAINT products_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'sold_out'::character varying])::text[]))),
    CONSTRAINT products_stock_check CHECK ((stock >= 0))
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: TABLE products; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.products IS '积分商城商品表';


--
-- Name: promoted_works; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.promoted_works (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    work_id text NOT NULL,
    user_id uuid NOT NULL,
    package_type text NOT NULL,
    target_type text DEFAULT 'account'::text NOT NULL,
    metric_type text DEFAULT 'views'::text NOT NULL,
    start_time timestamp with time zone DEFAULT now() NOT NULL,
    end_time timestamp with time zone NOT NULL,
    target_views integer DEFAULT 0,
    actual_views integer DEFAULT 0,
    target_clicks integer DEFAULT 0,
    actual_clicks integer DEFAULT 0,
    promotion_weight numeric(10,2) DEFAULT 1.0,
    priority_score numeric(10,2) DEFAULT 0,
    display_position integer DEFAULT 0,
    is_featured boolean DEFAULT false,
    status text DEFAULT 'active'::text NOT NULL,
    daily_views integer DEFAULT 0,
    daily_clicks integer DEFAULT 0,
    total_cost numeric(10,2) DEFAULT 0,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT promoted_works_metric_type_check CHECK ((metric_type = ANY (ARRAY['views'::text, 'followers'::text, 'engagement'::text, 'heat'::text]))),
    CONSTRAINT promoted_works_package_type_check CHECK ((package_type = ANY (ARRAY['standard'::text, 'basic'::text, 'long'::text, 'custom'::text]))),
    CONSTRAINT promoted_works_status_check CHECK ((status = ANY (ARRAY['active'::text, 'paused'::text, 'completed'::text, 'expired'::text]))),
    CONSTRAINT promoted_works_target_type_check CHECK ((target_type = ANY (ARRAY['account'::text, 'product'::text, 'live'::text])))
);


ALTER TABLE public.promoted_works OWNER TO postgres;

--
-- Name: promotion_applications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.promotion_applications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    application_type text DEFAULT 'individual'::text NOT NULL,
    contact_name text NOT NULL,
    contact_phone text,
    contact_email text,
    company_name text,
    business_license text,
    company_address text,
    promotion_channels jsonb DEFAULT '[]'::jsonb,
    promotion_experience text,
    expected_monthly_budget numeric(12,2),
    social_accounts jsonb DEFAULT '[]'::jsonb,
    status text DEFAULT 'pending'::text NOT NULL,
    reviewed_by uuid,
    reviewed_at timestamp with time zone,
    review_notes text,
    rejection_reason text,
    promotion_permissions jsonb DEFAULT '{}'::jsonb,
    total_orders integer DEFAULT 0,
    total_spent numeric(12,2) DEFAULT 0,
    total_views integer DEFAULT 0,
    total_conversions integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    approved_at timestamp with time zone,
    CONSTRAINT promotion_applications_application_type_check CHECK ((application_type = ANY (ARRAY['individual'::text, 'business'::text, 'creator'::text, 'brand'::text]))),
    CONSTRAINT promotion_applications_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'reviewing'::text, 'approved'::text, 'rejected'::text, 'suspended'::text])))
);


ALTER TABLE public.promotion_applications OWNER TO postgres;

--
-- Name: promotion_applications_detail; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.promotion_applications_detail AS
 SELECT pa.id,
    pa.user_id,
    pa.application_type,
    pa.contact_name,
    pa.contact_phone,
    pa.contact_email,
    pa.company_name,
    pa.business_license,
    pa.company_address,
    pa.promotion_channels,
    pa.promotion_experience,
    pa.expected_monthly_budget,
    pa.social_accounts,
    pa.status,
    pa.reviewed_by,
    pa.reviewed_at,
    pa.review_notes,
    pa.rejection_reason,
    pa.promotion_permissions,
    pa.total_orders,
    pa.total_spent,
    pa.total_views,
    pa.total_conversions,
    pa.created_at,
    pa.updated_at,
    pa.approved_at,
    u.username AS user_username,
    u.email AS user_email,
    u.avatar_url AS user_avatar,
    reviewer.username AS reviewer_username,
    reviewer.avatar_url AS reviewer_avatar
   FROM ((public.promotion_applications pa
     LEFT JOIN public.users u ON ((pa.user_id = u.id)))
     LEFT JOIN public.users reviewer ON ((pa.reviewed_by = reviewer.id)));


ALTER VIEW public.promotion_applications_detail OWNER TO postgres;

--
-- Name: promotion_audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.promotion_audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    application_id uuid NOT NULL,
    user_id uuid NOT NULL,
    action text NOT NULL,
    previous_status text,
    new_status text,
    notes text,
    reason text,
    performed_by uuid,
    performed_by_role text DEFAULT 'admin'::text,
    changes jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT promotion_audit_logs_action_check CHECK ((action = ANY (ARRAY['submit'::text, 'review'::text, 'approve'::text, 'reject'::text, 'suspend'::text, 'reactivate'::text, 'update'::text])))
);


ALTER TABLE public.promotion_audit_logs OWNER TO postgres;

--
-- Name: promotion_audit_stats; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.promotion_audit_stats AS
 SELECT date(created_at) AS date,
    action,
    count(*) AS count
   FROM public.promotion_audit_logs
  GROUP BY (date(created_at)), action
  ORDER BY (date(created_at)) DESC, action;


ALTER VIEW public.promotion_audit_stats OWNER TO postgres;

--
-- Name: promotion_coupon_usage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.promotion_coupon_usage (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    coupon_id uuid NOT NULL,
    order_id uuid,
    used_at timestamp with time zone DEFAULT now(),
    discount_amount numeric(10,2) NOT NULL
);


ALTER TABLE public.promotion_coupon_usage OWNER TO postgres;

--
-- Name: promotion_coupons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.promotion_coupons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text,
    name text NOT NULL,
    description text,
    discount_type text DEFAULT 'percentage'::text NOT NULL,
    discount_value numeric(10,2) NOT NULL,
    max_discount numeric(10,2),
    min_order_amount numeric(10,2) DEFAULT 0,
    total_quantity integer DEFAULT '-1'::integer,
    used_quantity integer DEFAULT 0,
    per_user_limit integer DEFAULT 1,
    applicable_packages jsonb DEFAULT '[]'::jsonb,
    applicable_user_types jsonb DEFAULT '[]'::jsonb,
    start_time timestamp with time zone,
    end_time timestamp with time zone,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    created_by uuid,
    CONSTRAINT promotion_coupons_discount_type_check CHECK ((discount_type = ANY (ARRAY['percentage'::text, 'fixed'::text, 'first_order'::text])))
);


ALTER TABLE public.promotion_coupons OWNER TO postgres;

--
-- Name: promotion_notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.promotion_notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    related_id uuid,
    related_type text,
    is_read boolean DEFAULT false,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT promotion_notifications_type_check CHECK ((type = ANY (ARRAY['application_submitted'::text, 'application_approved'::text, 'application_rejected'::text, 'order_completed'::text, 'performance_alert'::text, 'system_notice'::text])))
);


ALTER TABLE public.promotion_notifications OWNER TO postgres;

--
-- Name: promotion_user_statistics; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.promotion_user_statistics AS
 SELECT user_id,
    count(*) AS total_orders,
    count(*) FILTER (WHERE (status = 'pending'::text)) AS pending_orders,
    count(*) FILTER (WHERE (status = 'paid'::text)) AS paid_orders,
    count(*) FILTER (WHERE (status = 'active'::text)) AS active_orders,
    count(*) FILTER (WHERE (status = 'completed'::text)) AS completed_orders,
    sum(final_price) AS total_spent,
    sum(actual_views) AS total_views
   FROM public.promotion_orders
  GROUP BY user_id;


ALTER VIEW public.promotion_user_statistics OWNER TO postgres;

--
-- Name: promotion_user_stats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.promotion_user_stats (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    date date NOT NULL,
    daily_orders integer DEFAULT 0,
    daily_spent numeric(12,2) DEFAULT 0,
    daily_views integer DEFAULT 0,
    daily_clicks integer DEFAULT 0,
    daily_conversions integer DEFAULT 0,
    total_orders integer DEFAULT 0,
    total_spent numeric(12,2) DEFAULT 0,
    total_views integer DEFAULT 0
);


ALTER TABLE public.promotion_user_stats OWNER TO postgres;

--
-- Name: promotion_wallet_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.promotion_wallet_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    wallet_id uuid NOT NULL,
    user_id uuid NOT NULL,
    type text NOT NULL,
    amount numeric(12,2) NOT NULL,
    balance_before numeric(12,2) NOT NULL,
    balance_after numeric(12,2) NOT NULL,
    order_id uuid,
    reference_id text,
    description text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT promotion_wallet_transactions_type_check CHECK ((type = ANY (ARRAY['recharge'::text, 'consumption'::text, 'refund'::text, 'bonus'::text, 'withdrawal'::text])))
);


ALTER TABLE public.promotion_wallet_transactions OWNER TO postgres;

--
-- Name: promotion_wallets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.promotion_wallets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    balance numeric(12,2) DEFAULT 0,
    frozen_balance numeric(12,2) DEFAULT 0,
    total_recharge numeric(12,2) DEFAULT 0,
    total_consumption numeric(12,2) DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_transaction_at timestamp with time zone
);


ALTER TABLE public.promotion_wallets OWNER TO postgres;

--
-- Name: realtime_recommendation_cache; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.realtime_recommendation_cache (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    items jsonb DEFAULT '[]'::jsonb NOT NULL,
    diversity_score numeric(3,2),
    relevance_score numeric(3,2),
    mmr_score numeric(3,2),
    generated_context jsonb DEFAULT '{}'::jsonb,
    generated_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone DEFAULT (now() + '00:05:00'::interval)
);


ALTER TABLE public.realtime_recommendation_cache OWNER TO postgres;

--
-- Name: TABLE realtime_recommendation_cache; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.realtime_recommendation_cache IS '实时推荐结果缓存表，存储生成的推荐结果';


--
-- Name: recommendation_configs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.recommendation_configs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    config_key character varying(100) NOT NULL,
    config_value jsonb NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.recommendation_configs OWNER TO postgres;

--
-- Name: TABLE recommendation_configs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.recommendation_configs IS '推荐系统配置表';


--
-- Name: recommendation_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.recommendation_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    content_id uuid NOT NULL,
    algorithm_type character varying(100) NOT NULL,
    recommendation_score numeric,
    was_clicked boolean DEFAULT false,
    was_liked boolean DEFAULT false,
    dwell_time integer DEFAULT 0,
    "position" integer DEFAULT 0,
    recommended_at timestamp with time zone DEFAULT now(),
    context jsonb DEFAULT '{}'::jsonb
);


ALTER TABLE public.recommendation_history OWNER TO postgres;

--
-- Name: TABLE recommendation_history; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.recommendation_history IS '推荐历史记录表，用于追踪推荐效果';


--
-- Name: COLUMN recommendation_history.algorithm_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recommendation_history.algorithm_type IS '使用的推荐算法类型';


--
-- Name: COLUMN recommendation_history.recommendation_score; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recommendation_history.recommendation_score IS '推荐分数';


--
-- Name: COLUMN recommendation_history.was_clicked; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recommendation_history.was_clicked IS '用户是否点击';


--
-- Name: COLUMN recommendation_history."position"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recommendation_history."position" IS '推荐内容在列表中的位置';


--
-- Name: recommendation_metrics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.recommendation_metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    recommendation_id uuid,
    user_id uuid NOT NULL,
    impression_count integer DEFAULT 0,
    click_count integer DEFAULT 0,
    like_count integer DEFAULT 0,
    share_count integer DEFAULT 0,
    comment_count integer DEFAULT 0,
    total_dwell_time integer DEFAULT 0,
    avg_dwell_time integer DEFAULT 0,
    conversion_rate numeric(5,4),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.recommendation_metrics OWNER TO postgres;

--
-- Name: TABLE recommendation_metrics; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.recommendation_metrics IS '推荐效果统计表，用于评估推荐质量';


--
-- Name: recommendation_operation_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.recommendation_operation_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    operation_type character varying(50) NOT NULL,
    item_id character varying(255) NOT NULL,
    previous_value jsonb,
    new_value jsonb,
    operated_by character varying(255) NOT NULL,
    operated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    notes text
);


ALTER TABLE public.recommendation_operation_logs OWNER TO postgres;

--
-- Name: TABLE recommendation_operation_logs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.recommendation_operation_logs IS '推荐位操作日志表';


--
-- Name: COLUMN recommendation_operation_logs.id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recommendation_operation_logs.id IS '日志主键';


--
-- Name: COLUMN recommendation_operation_logs.operation_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recommendation_operation_logs.operation_type IS '操作类型：create, update, delete, reorder, activate, deactivate';


--
-- Name: COLUMN recommendation_operation_logs.item_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recommendation_operation_logs.item_id IS '推荐项 ID';


--
-- Name: COLUMN recommendation_operation_logs.previous_value; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recommendation_operation_logs.previous_value IS '操作前的值';


--
-- Name: COLUMN recommendation_operation_logs.new_value; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recommendation_operation_logs.new_value IS '操作后的值';


--
-- Name: COLUMN recommendation_operation_logs.operated_by; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recommendation_operation_logs.operated_by IS '操作人 ID';


--
-- Name: COLUMN recommendation_operation_logs.operated_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recommendation_operation_logs.operated_at IS '操作时间';


--
-- Name: COLUMN recommendation_operation_logs.notes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.recommendation_operation_logs.notes IS '操作备注';


--
-- Name: replies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.replies (
    id integer NOT NULL,
    post_id integer,
    user_id integer,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.replies OWNER TO postgres;

--
-- Name: replies_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.replies_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.replies_id_seq OWNER TO postgres;

--
-- Name: replies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.replies_id_seq OWNED BY public.replies.id;


--
-- Name: reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reporter_id uuid NOT NULL,
    target_type character varying(20) NOT NULL,
    target_id uuid NOT NULL,
    target_author_id uuid,
    report_type character varying(30) NOT NULL,
    description text,
    screenshots jsonb DEFAULT '[]'::jsonb,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    admin_id uuid,
    admin_response text,
    action_taken character varying(30),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    resolved_at timestamp with time zone,
    CONSTRAINT reports_report_type_check CHECK (((report_type)::text = ANY ((ARRAY['spam'::character varying, 'provocative'::character varying, 'pornographic'::character varying, 'personal_attack'::character varying, 'illegal'::character varying, 'political_rumor'::character varying, 'social_rumor'::character varying, 'false_info'::character varying, 'external_link'::character varying, 'portrait'::character varying, 'privacy'::character varying, 'impersonation'::character varying, 'reputation'::character varying, 'business_reputation'::character varying, 'plagiarism'::character varying, 'trademark'::character varying, 'patent'::character varying, 'other'::character varying])::text[]))),
    CONSTRAINT reports_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'resolved'::character varying, 'rejected'::character varying])::text[]))),
    CONSTRAINT reports_target_type_check CHECK (((target_type)::text = ANY ((ARRAY['feed'::character varying, 'comment'::character varying, 'user'::character varying, 'work'::character varying])::text[])))
);


ALTER TABLE public.reports OWNER TO postgres;

--
-- Name: TABLE reports; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.reports IS '用户举报表，存储所有用户举报记录';


--
-- Name: COLUMN reports.reporter_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.reports.reporter_id IS '举报人ID';


--
-- Name: COLUMN reports.target_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.reports.target_type IS '举报目标类型：feed-动态, comment-评论, user-用户, work-作品';


--
-- Name: COLUMN reports.target_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.reports.target_id IS '举报目标ID';


--
-- Name: COLUMN reports.target_author_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.reports.target_author_id IS '被举报内容作者ID';


--
-- Name: COLUMN reports.report_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.reports.report_type IS '举报类型：spam-垃圾广告, provocative-引战, pornographic-色情, personal_attack-人身攻击, illegal-违法信息, political_rumor-涉政谣言, social_rumor-涉社会事件谣言, false_info-虚假不实信息, external_link-违法信息外链, portrait-曝光肖像, privacy-泄露隐私, impersonation-冒充身份, reputation-损害个人名誉, business_reputation-损害企业名誉, plagiarism-搬运/抄袭/洗稿, trademark-假冒商标, patent-假冒专利, other-其他';


--
-- Name: COLUMN reports.description; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.reports.description IS '举报详细描述';


--
-- Name: COLUMN reports.screenshots; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.reports.screenshots IS '举报截图URL数组';


--
-- Name: COLUMN reports.status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.reports.status IS '举报状态：pending-待处理, processing-处理中, resolved-已处理, rejected-已驳回';


--
-- Name: COLUMN reports.admin_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.reports.admin_id IS '处理该举报的管理员ID';


--
-- Name: COLUMN reports.admin_response; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.reports.admin_response IS '管理员处理回复';


--
-- Name: COLUMN reports.action_taken; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.reports.action_taken IS '处理措施：none-暂不处理, warn-警告, delete_content-删除内容, ban_user-封禁用户, ban_temp-临时封禁';


--
-- Name: revenue_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.revenue_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    amount numeric(12,2) NOT NULL,
    type text NOT NULL,
    description text,
    status text DEFAULT 'completed'::text NOT NULL,
    work_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT revenue_records_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'completed'::text, 'cancelled'::text]))),
    CONSTRAINT revenue_records_type_check CHECK ((type = ANY (ARRAY['ads'::text, 'sponsorship'::text, 'tipping'::text, 'membership'::text, 'task'::text, 'withdrawal'::text])))
);


ALTER TABLE public.revenue_records OWNER TO postgres;

--
-- Name: score_audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.score_audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    submission_id uuid NOT NULL,
    judge_id uuid NOT NULL,
    action text NOT NULL,
    old_score numeric(5,2),
    new_score numeric(5,2),
    comment text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT score_audit_logs_action_check CHECK ((action = ANY (ARRAY['score'::text, 'update_score'::text, 'delete_score'::text, 'publish'::text, 'unpublish'::text])))
);


ALTER TABLE public.score_audit_logs OWNER TO postgres;

--
-- Name: search_behavior_tracking; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.search_behavior_tracking (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    session_id uuid,
    search_query text NOT NULL,
    search_results_shown integer DEFAULT 0,
    result_clicked boolean DEFAULT false,
    clicked_result_id uuid,
    clicked_result_type character varying(50),
    click_position integer,
    time_to_click_ms integer,
    dwell_time_ms integer,
    converted boolean DEFAULT false,
    conversion_type character varying(50),
    search_context jsonb DEFAULT '{}'::jsonb,
    device_type character varying(50),
    browser_info text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.search_behavior_tracking OWNER TO postgres;

--
-- Name: TABLE search_behavior_tracking; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.search_behavior_tracking IS '搜索行为跟踪表';


--
-- Name: search_suggestions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.search_suggestions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    keyword text NOT NULL,
    category character varying(50),
    weight integer DEFAULT 1,
    is_hot boolean DEFAULT false,
    is_recommended boolean DEFAULT false,
    click_count integer DEFAULT 0,
    search_count integer DEFAULT 0,
    related_keywords text[],
    metadata jsonb DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.search_suggestions OWNER TO postgres;

--
-- Name: TABLE search_suggestions; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.search_suggestions IS '搜索建议词库表';


--
-- Name: small_traffic_exposures; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.small_traffic_exposures (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    test_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content_id uuid NOT NULL,
    exposed_at timestamp with time zone DEFAULT now(),
    clicked boolean DEFAULT false,
    liked boolean DEFAULT false,
    dwell_time integer
);


ALTER TABLE public.small_traffic_exposures OWNER TO postgres;

--
-- Name: TABLE small_traffic_exposures; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.small_traffic_exposures IS '小流量测试用户曝光记录';


--
-- Name: small_traffic_tests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.small_traffic_tests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    content_id uuid NOT NULL,
    test_status character varying(20) DEFAULT 'running'::character varying,
    start_time timestamp with time zone DEFAULT now(),
    end_time timestamp with time zone,
    sample_size integer DEFAULT 0,
    target_sample_size integer DEFAULT 100,
    exposure_count integer DEFAULT 0,
    click_count integer DEFAULT 0,
    like_count integer DEFAULT 0,
    ctr numeric(5,4),
    engagement_rate numeric(5,4),
    quality_threshold numeric(4,3) DEFAULT 0.60,
    graduation_threshold numeric(4,3) DEFAULT 0.75,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.small_traffic_tests OWNER TO postgres;

--
-- Name: TABLE small_traffic_tests; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.small_traffic_tests IS '小流量测试记录，用于新内容冷启动';


--
-- Name: small_traffic_test_analytics; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.small_traffic_test_analytics AS
 SELECT test_status,
    count(*) AS test_count,
    round((avg(ctr) * (100)::numeric), 2) AS avg_ctr_percent,
    round((avg(engagement_rate) * (100)::numeric), 2) AS avg_engagement_rate_percent,
    round(avg(sample_size), 0) AS avg_sample_size,
    round(avg((EXTRACT(epoch FROM (COALESCE(end_time, now()) - start_time)) / (3600)::numeric)), 2) AS avg_test_duration_hours
   FROM public.small_traffic_tests stt
  GROUP BY test_status;


ALTER VIEW public.small_traffic_test_analytics OWNER TO postgres;

--
-- Name: submission_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.submission_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    submission_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    parent_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.submission_comments OWNER TO postgres;

--
-- Name: TABLE submission_comments; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.submission_comments IS '作品评论表';


--
-- Name: submission_full_details; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.submission_full_details AS
 SELECT es.id,
    es.event_id,
    es.user_id,
    es.title,
    es.description,
    es.files,
    es.status,
    es.submitted_at,
    es.reviewed_at,
    es.review_notes,
    es.score,
    es.metadata,
    es.created_at,
    es.updated_at,
    es.vote_count,
    es.like_count,
    es.avg_rating,
    es.rating_count,
    es.cover_image,
    es.media_type,
    e.title AS event_title,
    e.start_time AS event_start_time,
    e.end_time AS event_end_time,
    e.location AS event_location,
    e.organizer_id AS event_organizer_id,
    e.max_participants AS event_max_participants,
    e.current_participants AS event_current_participants,
    e.status AS event_status,
    e.image_url AS event_image_url,
    u.username AS creator_name,
    u.avatar_url AS creator_avatar,
    u.email AS creator_email
   FROM ((public.event_submissions es
     JOIN public.events e ON ((es.event_id = e.id)))
     LEFT JOIN public.users u ON ((es.user_id = u.id)));


ALTER VIEW public.submission_full_details OWNER TO postgres;

--
-- Name: VIEW submission_full_details; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.submission_full_details IS '作品完整信息视图，包含活动信息、创作者信息。用于作品审核列表。';


--
-- Name: submission_likes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.submission_likes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    submission_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.submission_likes OWNER TO postgres;

--
-- Name: submission_ratings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.submission_ratings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    submission_id uuid NOT NULL,
    user_id uuid NOT NULL,
    rating integer NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT submission_ratings_rating_check CHECK (((rating >= 1) AND (rating <= 10)))
);


ALTER TABLE public.submission_ratings OWNER TO postgres;

--
-- Name: submission_score_summary; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.submission_score_summary AS
 SELECT es.id AS submission_id,
    es.event_id,
    es.user_id,
    es.work_title AS title,
    es.status,
    to_timestamp((((es.submission_date)::numeric / 1000.0))::double precision) AS published_at,
        CASE
            WHEN (es.status = 'submitted'::text) THEN true
            ELSE false
        END AS is_published,
    count(ss.id) AS score_count,
    (avg(ss.score))::numeric(5,2) AS avg_score,
    max(ss.score) AS max_score,
    min(ss.score) AS min_score,
    count(DISTINCT ss.judge_id) AS judge_count
   FROM (public.event_submissions es
     LEFT JOIN public.submission_scores ss ON ((es.id = ss.submission_id)))
  GROUP BY es.id, es.event_id, es.user_id, es.work_title, es.status, es.submission_date;


ALTER VIEW public.submission_score_summary OWNER TO postgres;

--
-- Name: VIEW submission_score_summary; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.submission_score_summary IS '作品评分汇总视图，包含评分统计信息';


--
-- Name: submission_votes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.submission_votes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    submission_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.submission_votes OWNER TO postgres;

--
-- Name: submission_with_stats; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.submission_with_stats AS
 SELECT es.id,
    es.event_id,
    es.user_id,
    es.title,
    es.description,
    es.files,
    es.status,
    es.submitted_at,
    es.reviewed_at,
    es.review_notes,
    es.score,
    es.metadata,
    es.created_at,
    es.updated_at,
    es.vote_count,
    es.like_count,
    es.avg_rating,
    es.rating_count,
    es.cover_image,
    es.media_type,
    e.title AS event_title,
    u.username AS creator_name,
    u.avatar_url AS creator_avatar
   FROM ((public.event_submissions es
     JOIN public.events e ON ((es.event_id = e.id)))
     LEFT JOIN public.users u ON ((es.user_id = u.id)));


ALTER VIEW public.submission_with_stats OWNER TO postgres;

--
-- Name: VIEW submission_with_stats; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON VIEW public.submission_with_stats IS '作品统计视图，包含基本统计信息。';


--
-- Name: task_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.task_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    task_id character varying(100) NOT NULL,
    task_type character varying(20) NOT NULL,
    task_title character varying(200) NOT NULL,
    progress integer DEFAULT 0 NOT NULL,
    target integer DEFAULT 1 NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    points_reward integer DEFAULT 0 NOT NULL,
    completed_at timestamp with time zone,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT task_records_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'completed'::character varying, 'expired'::character varying])::text[]))),
    CONSTRAINT task_records_task_type_check CHECK (((task_type)::text = ANY ((ARRAY['daily'::character varying, 'weekly'::character varying, 'monthly'::character varying, 'event'::character varying, 'achievement'::character varying])::text[])))
);


ALTER TABLE public.task_records OWNER TO postgres;

--
-- Name: TABLE task_records; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.task_records IS '任务记录表';


--
-- Name: template_favorites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.template_favorites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    template_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.template_favorites OWNER TO postgres;

--
-- Name: TABLE template_favorites; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.template_favorites IS '模板收藏表';


--
-- Name: template_likes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.template_likes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    template_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.template_likes OWNER TO postgres;

--
-- Name: TABLE template_likes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.template_likes IS '模板点赞表';


--
-- Name: tianjin_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.tianjin_templates (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    thumbnail character varying(500),
    category character varying(100),
    tags text[],
    usage_count integer DEFAULT 0,
    likes_count integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    view_count integer DEFAULT 0
);


ALTER TABLE public.tianjin_templates OWNER TO postgres;

--
-- Name: tianjin_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tianjin_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tianjin_templates_id_seq OWNER TO postgres;

--
-- Name: tianjin_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tianjin_templates_id_seq OWNED BY public.tianjin_templates.id;


--
-- Name: traffic_sources; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.traffic_sources (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid,
    source_type character varying(20) NOT NULL,
    source_name character varying(100),
    utm_source character varying(100),
    utm_medium character varying(100),
    utm_campaign character varying(100),
    referrer_url text,
    landing_page text,
    ip_address inet,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT traffic_sources_source_type_check CHECK (((source_type)::text = ANY ((ARRAY['direct'::character varying, 'search'::character varying, 'social'::character varying, 'referral'::character varying, 'email'::character varying, 'other'::character varying])::text[])))
);


ALTER TABLE public.traffic_sources OWNER TO postgres;

--
-- Name: user_achievements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.user_achievements (
    user_id uuid NOT NULL,
    achievement_id integer NOT NULL,
    progress integer DEFAULT 0,
    is_unlocked boolean DEFAULT false,
    unlocked_at bigint
);


ALTER TABLE public.user_achievements OWNER TO postgres;

--
-- Name: user_activities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.user_activities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    action_type character varying(50) NOT NULL,
    entity_type character varying(50),
    entity_id character varying(255),
    details jsonb DEFAULT '{}'::jsonb,
    ip_address character varying(45),
    user_agent text,
    created_at timestamp with time zone DEFAULT now(),
    activity_type text DEFAULT 'post'::text,
    content text,
    target_id uuid,
    target_type text,
    target_title text
);


ALTER TABLE public.user_activities OWNER TO postgres;

--
-- Name: user_ban_restrictions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.user_ban_restrictions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    disable_login boolean DEFAULT false NOT NULL,
    disable_post boolean DEFAULT false NOT NULL,
    disable_comment boolean DEFAULT false NOT NULL,
    disable_like boolean DEFAULT false NOT NULL,
    disable_follow boolean DEFAULT false NOT NULL,
    ban_reason text,
    ban_duration text DEFAULT 'permanent'::text,
    banned_at timestamp with time zone DEFAULT now() NOT NULL,
    banned_by uuid,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_ban_restrictions OWNER TO postgres;

--
-- Name: user_behavior_daily_stats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.user_behavior_daily_stats (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    stat_date date NOT NULL,
    mindmap_creates integer DEFAULT 0,
    mindmap_edits integer DEFAULT 0,
    node_creates integer DEFAULT 0,
    node_edits integer DEFAULT 0,
    ai_suggestions integer DEFAULT 0,
    stories_generated integer DEFAULT 0,
    works_published integer DEFAULT 0,
    brands_used text[] DEFAULT '{}'::text[],
    active_minutes integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_behavior_daily_stats OWNER TO postgres;

--
-- Name: TABLE user_behavior_daily_stats; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.user_behavior_daily_stats IS '用户行为每日统计表';


--
-- Name: user_behavior_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.user_behavior_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    event_type text NOT NULL,
    item_id uuid NOT NULL,
    item_type text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_behavior_events_event_type_check CHECK ((event_type = ANY (ARRAY['view'::text, 'click'::text, 'like'::text, 'share'::text, 'comment'::text, 'dwell'::text]))),
    CONSTRAINT user_behavior_events_item_type_check CHECK ((item_type = ANY (ARRAY['post'::text, 'work'::text, 'challenge'::text, 'template'::text])))
);


ALTER TABLE public.user_behavior_events OWNER TO postgres;

--
-- Name: TABLE user_behavior_events; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.user_behavior_events IS '用户实时行为事件表，用于收集和存储用户的实时行为数据';


--
-- Name: user_behaviors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.user_behaviors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    content_id uuid NOT NULL,
    behavior_type character varying(50) NOT NULL,
    behavior_value numeric DEFAULT 1.0,
    dwell_time integer DEFAULT 0,
    context jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_behaviors_behavior_type_check CHECK (((behavior_type)::text = ANY ((ARRAY['view'::character varying, 'like'::character varying, 'collect'::character varying, 'share'::character varying, 'comment'::character varying, 'click'::character varying, 'dwell'::character varying])::text[])))
);


ALTER TABLE public.user_behaviors OWNER TO postgres;

--
-- Name: TABLE user_behaviors; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.user_behaviors IS '用户行为记录表，存储用户对内容的各种交互行为';


--
-- Name: COLUMN user_behaviors.behavior_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_behaviors.behavior_type IS '行为类型: view(浏览), like(点赞), collect(收藏), share(分享), comment(评论), click(点击), dwell(停留)';


--
-- Name: COLUMN user_behaviors.behavior_value; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_behaviors.behavior_value IS '行为权重值，用于计算用户偏好';


--
-- Name: COLUMN user_behaviors.dwell_time; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_behaviors.dwell_time IS '停留时间（秒）';


--
-- Name: COLUMN user_behaviors.context; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_behaviors.context IS '行为上下文信息，如页面位置、设备类型等';


--
-- Name: user_brand_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.user_brand_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    brand_id text NOT NULL,
    brand_name text NOT NULL,
    brand_image text,
    usage_count integer DEFAULT 1 NOT NULL,
    last_used_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_brand_history OWNER TO postgres;

--
-- Name: TABLE user_brand_history; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.user_brand_history IS '用户品牌使用历史记录';


--
-- Name: COLUMN user_brand_history.user_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_brand_history.user_id IS '用户ID';


--
-- Name: COLUMN user_brand_history.brand_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_brand_history.brand_id IS '品牌ID';


--
-- Name: COLUMN user_brand_history.brand_name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_brand_history.brand_name IS '品牌名称';


--
-- Name: COLUMN user_brand_history.brand_image; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_brand_history.brand_image IS '品牌图片URL';


--
-- Name: COLUMN user_brand_history.usage_count; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_brand_history.usage_count IS '使用次数';


--
-- Name: COLUMN user_brand_history.last_used_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_brand_history.last_used_at IS '最后使用时间';


--
-- Name: user_creative_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.user_creative_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    preferred_categories text[] DEFAULT '{}'::text[],
    preferred_brands text[] DEFAULT '{}'::text[],
    preferred_themes text[] DEFAULT '{}'::text[],
    total_mindmaps integer DEFAULT 0,
    total_nodes integer DEFAULT 0,
    total_ai_suggestions integer DEFAULT 0,
    total_stories integer DEFAULT 0,
    total_published_works integer DEFAULT 0,
    creative_style_tags text[] DEFAULT '{}'::text[],
    creative_strengths text[] DEFAULT '{}'::text[],
    creative_improvements text[] DEFAULT '{}'::text[],
    most_active_hour integer,
    most_active_day text,
    last_analyzed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_creative_profiles OWNER TO postgres;

--
-- Name: TABLE user_creative_profiles; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.user_creative_profiles IS '用户创作画像表 - AI分析用户的创作偏好和风格';


--
-- Name: user_demographics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.user_demographics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    age_group character varying(20),
    gender character varying(20),
    location character varying(100),
    interests text[],
    preferred_categories uuid[],
    preferred_content_types character varying(50)[],
    onboarding_completed boolean DEFAULT false,
    onboarding_data jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_demographics OWNER TO postgres;

--
-- Name: TABLE user_demographics; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.user_demographics IS '用户人口属性信息，用于冷启动推荐';


--
-- Name: user_devices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.user_devices (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    device_type character varying(20) NOT NULL,
    device_name character varying(100),
    user_agent text,
    ip_address inet,
    first_seen_at timestamp with time zone DEFAULT now(),
    last_seen_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_devices_device_type_check CHECK (((device_type)::text = ANY ((ARRAY['desktop'::character varying, 'mobile'::character varying, 'tablet'::character varying])::text[])))
);


ALTER TABLE public.user_devices OWNER TO postgres;

--
-- Name: user_exploration_state; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.user_exploration_state (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    exploration_rate numeric(3,2) DEFAULT 0.30,
    total_interactions integer DEFAULT 0,
    exploration_count integer DEFAULT 0,
    exploitation_count integer DEFAULT 0,
    discovered_categories text[],
    discovered_tags text[],
    last_exploration_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_exploration_state OWNER TO postgres;

--
-- Name: TABLE user_exploration_state; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.user_exploration_state IS '用户探索-利用状态，记录探索偏好发现过程';


--
-- Name: user_favorites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.user_favorites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    brand_id text NOT NULL,
    brand_name text NOT NULL,
    brand_image text,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_favorites OWNER TO postgres;

--
-- Name: TABLE user_favorites; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.user_favorites IS '用户收藏的品牌';


--
-- Name: COLUMN user_favorites.user_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_favorites.user_id IS '用户ID';


--
-- Name: COLUMN user_favorites.brand_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_favorites.brand_id IS '品牌ID';


--
-- Name: COLUMN user_favorites.brand_name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_favorites.brand_name IS '品牌名称';


--
-- Name: COLUMN user_favorites.brand_image; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_favorites.brand_image IS '品牌图片URL';


--
-- Name: COLUMN user_favorites.notes; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_favorites.notes IS '用户备注';


--
-- Name: user_feedbacks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.user_feedbacks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    type character varying(50) NOT NULL,
    title character varying(200),
    content text NOT NULL,
    contact_info character varying(255),
    contact_type character varying(20),
    screenshots text[] DEFAULT '{}'::text[],
    device_info jsonb,
    browser_info character varying(255),
    page_url text,
    status character varying(20) DEFAULT 'pending'::character varying,
    priority character varying(20) DEFAULT 'normal'::character varying,
    assigned_to uuid,
    response_content text,
    responded_at timestamp with time zone,
    responded_by uuid,
    is_notified boolean DEFAULT false,
    notified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_feedbacks_contact_type_check CHECK (((contact_type)::text = ANY ((ARRAY['email'::character varying, 'phone'::character varying, 'wechat'::character varying, 'other'::character varying])::text[]))),
    CONSTRAINT user_feedbacks_priority_check CHECK (((priority)::text = ANY ((ARRAY['low'::character varying, 'normal'::character varying, 'high'::character varying, 'urgent'::character varying])::text[]))),
    CONSTRAINT user_feedbacks_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'processing'::character varying, 'resolved'::character varying, 'rejected'::character varying, 'closed'::character varying])::text[]))),
    CONSTRAINT user_feedbacks_type_check CHECK (((type)::text = ANY ((ARRAY['bug'::character varying, 'feature'::character varying, 'complaint'::character varying, 'inquiry'::character varying, 'other'::character varying])::text[])))
);


ALTER TABLE public.user_feedbacks OWNER TO postgres;

--
-- Name: user_invite_rate_limits; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.user_invite_rate_limits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id text NOT NULL,
    daily_count integer DEFAULT 0,
    weekly_count integer DEFAULT 0,
    monthly_count integer DEFAULT 0,
    last_invite_at timestamp with time zone,
    reset_daily_at timestamp with time zone DEFAULT now(),
    reset_weekly_at timestamp with time zone DEFAULT now(),
    reset_monthly_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_invite_rate_limits OWNER TO postgres;

--
-- Name: TABLE user_invite_rate_limits; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.user_invite_rate_limits IS '用户邀请频率限制表，防骚扰机制';


--
-- Name: user_mockup_configs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.user_mockup_configs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text,
    design_image_url text,
    mockup_type text,
    mockup_config jsonb,
    preview_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_mockup_configs OWNER TO postgres;

--
-- Name: TABLE user_mockup_configs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.user_mockup_configs IS '用户保存的模型预览配置';


--
-- Name: user_notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.user_notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    type character varying(50) NOT NULL,
    title character varying(200) NOT NULL,
    content text NOT NULL,
    related_id uuid,
    related_type character varying(50),
    is_read boolean DEFAULT false,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_notifications OWNER TO postgres;

--
-- Name: user_participation_details; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.user_participation_details AS
 SELECT ep.id,
    ep.user_id,
    ep.event_id,
    ep.status AS participation_status,
    ep.progress,
    ep.current_step,
    ep.submitted_work_id,
    ep.submission_date,
    ep.ranking,
    ep.award,
    ep.registration_date,
    ep.notes,
    ep.created_at,
    ep.updated_at,
    e.title AS event_title,
    e.description AS event_description,
    e.start_time AS event_start,
    e.end_time AS event_end,
    e.location AS event_location,
    e.type AS event_type,
    e.status AS event_status,
    e.image_url AS event_thumbnail,
    COALESCE(e.max_participants, 100) AS event_max_participants,
    e.current_participants AS event_current_participants
   FROM (public.event_participants ep
     JOIN public.events e ON ((ep.event_id = e.id)));


ALTER VIEW public.user_participation_details OWNER TO postgres;

--
-- Name: user_patterns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.user_patterns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    pattern_id integer,
    custom_pattern_url text,
    name text,
    category text,
    is_custom boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_patterns OWNER TO postgres;

--
-- Name: TABLE user_patterns; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.user_patterns IS '用户收藏的纹样';


--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.user_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    interests jsonb DEFAULT '{}'::jsonb,
    preference_vector public.vector(384),
    interaction_count integer DEFAULT 0,
    last_interaction_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_profiles OWNER TO postgres;

--
-- Name: TABLE user_profiles; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.user_profiles IS '用户画像表，存储用户的兴趣偏好';


--
-- Name: COLUMN user_profiles.interests; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_profiles.interests IS '用户兴趣标签及权重，格式: {"tag": weight}';


--
-- Name: COLUMN user_profiles.preference_vector; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_profiles.preference_vector IS '用户偏好向量';


--
-- Name: COLUMN user_profiles.interaction_count; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_profiles.interaction_count IS '用户总交互次数';


--
-- Name: user_realtime_features; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.user_realtime_features (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    view_count integer DEFAULT 0,
    click_count integer DEFAULT 0,
    like_count integer DEFAULT 0,
    avg_dwell_time integer DEFAULT 0,
    current_session_duration integer DEFAULT 0,
    interest_categories jsonb DEFAULT '{}'::jsonb,
    interest_tags jsonb DEFAULT '{}'::jsonb,
    interest_authors jsonb DEFAULT '{}'::jsonb,
    context_time_of_day integer,
    context_day_of_week integer,
    context_device_type text,
    context_location text,
    last_updated timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone DEFAULT (now() + '01:00:00'::interval)
);


ALTER TABLE public.user_realtime_features OWNER TO postgres;

--
-- Name: TABLE user_realtime_features; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.user_realtime_features IS '用户实时特征表，缓存用户的实时计算特征';


--
-- Name: user_search_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.user_search_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    query text NOT NULL,
    search_type character varying(50) DEFAULT 'general'::character varying,
    result_count integer DEFAULT 0,
    clicked_result_id uuid,
    clicked_result_type character varying(50),
    search_filters jsonb DEFAULT '{}'::jsonb,
    search_duration_ms integer,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_search_history OWNER TO postgres;

--
-- Name: TABLE user_search_history; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.user_search_history IS '用户搜索历史表';


--
-- Name: user_search_preferences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.user_search_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    preferred_categories text[] DEFAULT '{}'::text[],
    preferred_tags text[] DEFAULT '{}'::text[],
    preferred_authors uuid[] DEFAULT '{}'::uuid[],
    search_history_enabled boolean DEFAULT true,
    personalized_recommendations_enabled boolean DEFAULT true,
    auto_suggest_enabled boolean DEFAULT true,
    safe_search_enabled boolean DEFAULT false,
    results_per_page integer DEFAULT 20,
    default_sort_by character varying(50) DEFAULT 'relevance'::character varying,
    ui_preferences jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_search_preferences OWNER TO postgres;

--
-- Name: TABLE user_search_preferences; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.user_search_preferences IS '用户搜索偏好表';


--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.user_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    session_token text,
    ip_address text,
    user_agent text,
    last_active bigint DEFAULT (EXTRACT(epoch FROM now()))::bigint NOT NULL,
    created_at bigint DEFAULT (EXTRACT(epoch FROM now()))::bigint NOT NULL
);


ALTER TABLE public.user_sessions OWNER TO postgres;

--
-- Name: user_similarities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.user_similarities (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    similar_user_id uuid NOT NULL,
    similarity_score numeric NOT NULL,
    common_interactions integer DEFAULT 0,
    calculated_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_similarities_similarity_score_check CHECK (((similarity_score >= (0)::numeric) AND (similarity_score <= (1)::numeric)))
);


ALTER TABLE public.user_similarities OWNER TO postgres;

--
-- Name: TABLE user_similarities; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.user_similarities IS '用户相似度表，存储用户之间的相似度分数';


--
-- Name: COLUMN user_similarities.similarity_score; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_similarities.similarity_score IS '相似度分数，范围0-1';


--
-- Name: COLUMN user_similarities.common_interactions; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_similarities.common_interactions IS '共同交互的内容数量';


--
-- Name: user_status; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.user_status (
    user_id uuid NOT NULL,
    status character varying(20) DEFAULT 'offline'::character varying,
    last_seen timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_status OWNER TO postgres;

--
-- Name: user_style_presets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.user_style_presets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    styles text[],
    blend_ratio jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_style_presets OWNER TO postgres;

--
-- Name: TABLE user_style_presets; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.user_style_presets IS '用户保存的风格预设';


--
-- Name: user_sync_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.user_sync_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    sync_type text NOT NULL,
    sync_data jsonb DEFAULT '{}'::jsonb,
    synced_at timestamp with time zone DEFAULT now(),
    device_info jsonb DEFAULT '{}'::jsonb,
    ip_address inet,
    CONSTRAINT user_sync_logs_sync_type_check CHECK ((sync_type = ANY (ARRAY['profile_update'::text, 'avatar_update'::text, 'settings_update'::text, 'full_sync'::text])))
);


ALTER TABLE public.user_sync_logs OWNER TO postgres;

--
-- Name: TABLE user_sync_logs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.user_sync_logs IS '用户数据同步日志表，记录用户数据的同步历史';


--
-- Name: COLUMN user_sync_logs.sync_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_sync_logs.sync_type IS '同步类型：profile_update(资料更新), avatar_update(头像更新), settings_update(设置更新), full_sync(完整同步)';


--
-- Name: COLUMN user_sync_logs.sync_data; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_sync_logs.sync_data IS '同步的数据内容';


--
-- Name: COLUMN user_sync_logs.device_info; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_sync_logs.device_info IS '设备信息';


--
-- Name: user_tile_configs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.user_tile_configs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text,
    base_image_url text,
    tile_mode text,
    spacing integer DEFAULT 0,
    rotation integer DEFAULT 0,
    scale double precision DEFAULT 1.0,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_tile_configs OWNER TO postgres;

--
-- Name: TABLE user_tile_configs; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.user_tile_configs IS '用户保存的图案平铺配置';


--
-- Name: user_uploads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.user_uploads (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    file_url text NOT NULL,
    file_name text,
    file_type text,
    file_size integer,
    thumbnail_url text,
    title text,
    description text,
    tags text[],
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_uploads OWNER TO postgres;

--
-- Name: TABLE user_uploads; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.user_uploads IS '用户上传的作品文件';


--
-- Name: withdrawal_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.withdrawal_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    amount numeric(12,2) NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    payment_method text,
    payment_account text,
    processed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT withdrawal_records_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'rejected'::text])))
);


ALTER TABLE public.withdrawal_records OWNER TO postgres;

--
-- Name: work_bookmarks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.work_bookmarks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    work_id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at bigint DEFAULT (EXTRACT(epoch FROM now()))::bigint NOT NULL
);


ALTER TABLE public.work_bookmarks OWNER TO postgres;

--
-- Name: work_comment_likes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.work_comment_likes (
    user_id text NOT NULL,
    comment_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.work_comment_likes OWNER TO postgres;

--
-- Name: work_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.work_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    work_id uuid NOT NULL,
    user_id text NOT NULL,
    content text NOT NULL,
    parent_id uuid,
    likes_count integer DEFAULT 0,
    images text[] DEFAULT '{}'::text[],
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.work_comments OWNER TO postgres;

--
-- Name: work_favorites; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.work_favorites (
    id integer NOT NULL,
    user_id text NOT NULL,
    work_id text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.work_favorites OWNER TO postgres;

--
-- Name: work_favorites_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.work_favorites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.work_favorites_id_seq OWNER TO postgres;

--
-- Name: work_favorites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.work_favorites_id_seq OWNED BY public.work_favorites.id;


--
-- Name: work_performance_stats; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.work_performance_stats (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    submission_id uuid NOT NULL,
    event_id uuid NOT NULL,
    view_count integer DEFAULT 0,
    like_count integer DEFAULT 0,
    comment_count integer DEFAULT 0,
    share_count integer DEFAULT 0,
    avg_score numeric(5,2),
    score_count integer DEFAULT 0,
    engagement_rate numeric(5,2) GENERATED ALWAYS AS (
CASE
    WHEN (view_count > 0) THEN round(((((like_count + comment_count))::numeric / (view_count)::numeric) * (100)::numeric), 2)
    ELSE (0)::numeric
END) STORED,
    ranking integer,
    last_updated timestamp with time zone DEFAULT now()
);


ALTER TABLE public.work_performance_stats OWNER TO postgres;

--
-- Name: work_shares; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.work_shares (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sender_id uuid NOT NULL,
    receiver_id uuid NOT NULL,
    work_id uuid NOT NULL,
    work_title text NOT NULL,
    work_thumbnail text,
    work_type text,
    message text,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    read_at timestamp with time zone
);


ALTER TABLE public.work_shares OWNER TO postgres;

--
-- Name: TABLE work_shares; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.work_shares IS '存储用户之间分享作品的记录';


--
-- Name: COLUMN work_shares.sender_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.work_shares.sender_id IS '分享发送者ID';


--
-- Name: COLUMN work_shares.receiver_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.work_shares.receiver_id IS '分享接收者ID';


--
-- Name: COLUMN work_shares.work_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.work_shares.work_id IS '被分享的作品ID';


--
-- Name: COLUMN work_shares.work_title; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.work_shares.work_title IS '作品标题（冗余存储，防止作品删除后信息丢失）';


--
-- Name: COLUMN work_shares.work_thumbnail; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.work_shares.work_thumbnail IS '作品缩略图URL';


--
-- Name: COLUMN work_shares.work_type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.work_shares.work_type IS '作品类型';

