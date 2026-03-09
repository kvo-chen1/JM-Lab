COPY public.points_rules (id, name, description, rule_type, source_type, points, daily_limit, weekly_limit, monthly_limit, yearly_limit, is_active, priority, conditions, created_at, updated_at) FROM stdin;
73683564-fb04-4dca-95f1-facfb6c06987	每日签到	每日签到获得基础积分	earn	checkin	5	1	\N	\N	\N	t	100	{}	2026-02-08 15:54:22.04437+00	2026-02-08 15:54:22.04437+00
5f4a5fa5-fc00-41f7-8a3d-5c9b40ef10dd	连续3天签到奖励	连续签到3天额外奖励	earn	checkin	10	1	\N	\N	\N	t	90	{}	2026-02-08 15:54:22.04437+00	2026-02-08 15:54:22.04437+00
a236126e-0d29-4b8b-beb3-738168d8785a	连续7天签到奖励	连续签到7天额外奖励	earn	checkin	30	1	\N	\N	\N	t	80	{}	2026-02-08 15:54:22.04437+00	2026-02-08 15:54:22.04437+00
b6d4e8ec-bfa0-4a3c-8c1c-530717c789f2	连续30天签到奖励	连续签到30天超级奖励	earn	checkin	100	1	\N	\N	\N	t	70	{}	2026-02-08 15:54:22.04437+00	2026-02-08 15:54:22.04437+00
c98b8162-2c3c-4b88-90d9-d36d27ca9273	任务完成	完成任务获得积分	earn	task	10	10	\N	\N	\N	t	100	{}	2026-02-08 15:54:22.04437+00	2026-02-08 15:54:22.04437+00
df99daab-c2fc-42a7-931e-0a9855787e43	成就解锁	解锁成就获得积分	earn	achievement	50	\N	\N	\N	\N	t	100	{}	2026-02-08 15:54:22.04437+00	2026-02-08 15:54:22.04437+00
72b01888-7566-4638-be63-cfa563c6bdde	发布作品	发布新作品获得积分	earn	achievement	50	\N	\N	\N	\N	t	80	{}	2026-02-09 08:48:13.903635+00	2026-02-09 08:48:13.903635+00
760db05c-824d-47ba-bdc6-369c4ae356c7	作品被点赞	作品被点赞获得积分	earn	achievement	5	100	\N	\N	\N	t	70	{}	2026-02-09 08:48:13.903635+00	2026-02-09 08:48:13.903635+00
64567d64-054f-42b4-9f3b-0773429b30fd	邀请好友	邀请新用户注册	earn	invite	100	\N	\N	\N	\N	t	60	{}	2026-02-09 08:48:13.903635+00	2026-02-09 08:48:13.903635+00
4c361bf9-31ef-425b-8a4a-1f87091b2cd3	消费返积分	消费金额按比例返积分	earn	consumption	10	\N	\N	\N	\N	t	50	{}	2026-02-09 08:48:13.903635+00	2026-02-09 08:48:13.903635+00
\.


--
-- Data for Name: post_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--
