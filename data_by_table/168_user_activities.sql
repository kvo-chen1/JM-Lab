COPY public.user_activities (id, user_id, action_type, entity_type, entity_id, details, ip_address, user_agent, created_at, activity_type, content, target_id, target_type, target_title) FROM stdin;
3b549b70-78d1-43d1-8811-8dede6e3e10b	a6f38aa1-7281-49f2-b565-2aa93ee89905	create_post	post	81	{"title": "1", "content": "11"}	\N	\N	2026-02-07 14:26:49.470453+00	post	发布了新作品《1》	\N	\N	\N
bcb314f7-c5ee-4b8e-888f-91b0fab758e6	a6f38aa1-7281-49f2-b565-2aa93ee89905	create_post	post	82	{"title": "1", "content": "1"}	\N	\N	2026-02-07 14:33:58.527389+00	post	发布了新作品《1》	\N	\N	\N
e2cf5a12-81df-4666-9851-575ffa3e3ca0	a6f38aa1-7281-49f2-b565-2aa93ee89905	create_post	post	83	{"title": "1", "content": "1"}	\N	\N	2026-02-07 14:55:37.25403+00	post	发布了新作品《1》	\N	\N	\N
0a3d524a-ce6c-472a-9f5e-fa5dc6e8a3d5	a6f38aa1-7281-49f2-b565-2aa93ee89905	create_post	post	84	{"title": "1", "content": "1"}	\N	\N	2026-02-07 14:56:05.811459+00	post	发布了新作品《1》	\N	\N	\N
\.


--
-- Data for Name: user_ban_restrictions; Type: TABLE DATA; Schema: public; Owner: postgres
--
