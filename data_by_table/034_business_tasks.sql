COPY public.business_tasks (id, title, description, brand_name, brand_logo, budget_min, budget_max, deadline, requirements, tags, type, status, max_participants, current_participants, created_by, created_at, updated_at) FROM stdin;
22cacdda-b08e-4224-b6c3-e7f2c6fd5eab	天津海河文化宣传海报设计	为天津海河文化设计系列宣传海报，展现津门文化魅力	天津文旅集团	\N	3000.00	5000.00	2026-03-02 09:28:29.296095+00	["原创设计", "津门文化元素", "商业授权"]	["设计创作", "可接单"]	design	open	1	0	\N	2026-02-23 09:28:29.296095+00	2026-02-23 09:28:29.296095+00
3baeb77e-3ee4-4022-88c6-9810b74d631c	传统美食插画系列	创作8张传统美食插画，用于品牌宣传	老字号品牌联盟	\N	5000.00	8000.00	2026-03-09 09:28:29.296095+00	["8张插画", "传统风格", "可商用"]	["插画创作", "可接单"]	illustration	open	1	0	\N	2026-02-23 09:28:29.296095+00	2026-02-23 09:28:29.296095+00
d1d90781-459d-412b-9800-a274ceb86cee	产品宣传短视频制作	制作30秒产品宣传短视频	创意科技公司	\N	2000.00	3500.00	2026-02-28 09:28:29.296095+00	["30秒视频", "产品展示", "配乐"]	["视频创作", "可接单"]	video	open	1	0	\N	2026-02-23 09:28:29.296095+00	2026-02-23 09:28:29.296095+00
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--
