COPY public.admin_notifications (id, title, content, type, target, target_users, status, scheduled_at, sent_at, recipients_count, read_count, click_count, created_at, updated_at) FROM stdin;
6f86df57-c118-41c6-b90c-bc44fbd2262e	1	11	system	all	{}	sent	\N	2026-02-25 01:46:42.696+00	9	0	0	2026-02-25 01:46:39.305+00	2026-02-25 01:46:43.326096+00
42dd92eb-3902-423d-af3b-98680311081f	2	2	system	all	{}	sent	\N	2026-02-25 02:17:24.83+00	9	0	0	2026-02-25 02:17:22.489+00	2026-02-25 02:17:25.379853+00
\.


--
-- Data for Name: admin_operation_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--
