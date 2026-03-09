COPY public.recommendation_configs (id, config_key, config_value, description, is_active, created_at, updated_at) FROM stdin;
18747dce-afbd-440f-b9ec-f00e29cceba7	collaborative_filtering	{"enabled": true, "max_neighbors": 50, "min_similarity": 0.3, "time_decay_days": 30}	协同过滤算法配置	t	2026-03-01 01:16:03.843671+00	2026-03-01 01:16:03.843671+00
184b5965-3328-4ef4-8b73-ffc4e91142ba	content_based	{"enabled": true, "tag_weight": 0.4, "time_weight": 0.3, "category_weight": 0.3}	基于内容的推荐配置	t	2026-03-01 01:16:03.843671+00	2026-03-01 01:16:03.843671+00
f2703b97-6847-4019-87c9-ebf06a9f3fdf	hot_recommendation	{"enabled": true, "min_interactions": 10, "time_window_hours": 72}	热门推荐配置	t	2026-03-01 01:16:03.843671+00	2026-03-01 01:16:03.843671+00
48b8dd3f-feca-4097-981d-49e22773c555	diversity	{"lambda": 0.5, "enabled": true, "max_same_author": 3, "max_same_category": 5}	多样性重排序配置	t	2026-03-01 01:16:03.843671+00	2026-03-01 01:16:03.843671+00
34a51e08-39cd-4081-9210-6872ce9e88be	cold_start	{"enabled": true, "exploration_rate": 0.2, "onboarding_questions": true}	冷启动策略配置	t	2026-03-01 01:16:03.843671+00	2026-03-01 01:16:03.843671+00
\.


--
-- Data for Name: recommendation_history; Type: TABLE DATA; Schema: public; Owner: postgres
--
