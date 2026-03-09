COPY public.lottery_activities (id, name, description, status, start_time, end_time, spin_cost, daily_limit, total_limit, created_by, created_at, updated_at) FROM stdin;
3140cd84-c41c-40a7-8267-07aa7fd29975	幸运大转盘	消耗积分参与抽奖，赢取丰厚奖励	active	2026-03-01 09:33:24.332375+00	2027-03-01 09:33:24.332375+00	50	-1	-1	\N	2026-03-01 09:33:24.332375+00	2026-03-01 09:33:24.332375+00
\.


--
-- Data for Name: lottery_prizes; Type: TABLE DATA; Schema: public; Owner: postgres
--
