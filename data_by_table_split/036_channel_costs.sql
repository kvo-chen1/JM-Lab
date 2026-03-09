COPY public.channel_costs (id, channel, cost_type, amount, start_date, end_date, description, metadata, created_at) FROM stdin;
68f2e891-9fd7-40f1-9ee7-886b4a2dad03	信息流广告	advertising	50000.00	2026-01-29	2026-03-30	抖音、快手信息流广告投放	{}	2026-02-28 06:54:35.029961
d6d06055-ae98-48c1-8e16-adb0074eb8c3	社交媒体	advertising	30000.00	2026-01-29	2026-03-30	微博、小红书推广	{}	2026-02-28 06:54:35.029961
abb57f84-c7d3-411f-8bb5-43e0067594db	搜索引擎	advertising	40000.00	2026-01-29	2026-03-30	百度、谷歌 SEM	{}	2026-02-28 06:54:35.029961
067a3508-14b3-4bc9-80fc-1d694b08e94e	KOL 合作	cooperation	60000.00	2026-01-29	2026-03-30	知名博主合作推广	{}	2026-02-28 06:54:35.029961
2fdb372e-4555-4892-8596-54b791a91e0e	内容营销	cooperation	20000.00	2026-01-29	2026-03-30	优质内容创作与分发	{}	2026-02-28 06:54:35.029961
\.


--
-- Data for Name: checkin_records; Type: TABLE DATA; Schema: public; Owner: postgres
--
