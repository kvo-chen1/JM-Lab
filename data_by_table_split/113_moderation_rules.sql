COPY public.moderation_rules (id, name, rule_type, enabled, threshold, auto_action, config, created_at, updated_at) FROM stdin;
156cd1d2-ddc3-47e6-baa7-cddcb7b6e27f	敏感词检测	sensitive_words	t	1	reject	{"match_mode": "exact", "case_sensitive": false}	2026-02-24 04:05:11.208918+00	2026-02-24 04:05:11.208918+00
1ef0b7a7-5a62-4355-8f29-df3625daf1e9	垃圾内容识别	spam_detection	t	70	flag	{"check_patterns": ["repetitive", "url_spam", "short_content"]}	2026-02-24 04:05:11.208918+00	2026-02-24 04:05:11.208918+00
20e41163-d288-494d-8e0f-42d0489ef86e	AI生成内容检测	ai_generated	t	85	flag	{"min_text_length": 50}	2026-02-24 04:05:11.208918+00	2026-02-24 04:05:11.208918+00
1033079c-a5c0-4873-9638-b0ef9659bb5a	文化真实性评估	cultural_authenticity	t	60	flag	{"min_cultural_score": 30}	2026-02-24 04:05:11.208918+00	2026-02-24 04:05:11.208918+00
\.


--
-- Data for Name: new_content_boost_pool; Type: TABLE DATA; Schema: public; Owner: postgres
--
