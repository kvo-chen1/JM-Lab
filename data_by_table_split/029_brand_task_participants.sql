COPY public.brand_task_participants (id, task_id, creator_id, status, submitted_works, approved_works, total_earnings, pending_earnings, withdrawn_earnings, application_message, portfolio_links, applied_at, approved_at, completed_at) FROM stdin;
21ace23a-1ce8-4d41-b466-3691e744fabf	ca384ac6-223d-46a8-8198-b10aedf19b9f	f3dedf79-5c5e-40fd-9513-d0fb0995d429	approved	1	1	50.00	50.00	0.00		[]	2026-02-25 11:36:37.58205+00	2026-02-25 12:22:33.397+00	\N
f61fc8e6-8b13-49a2-9267-a43d6b3246f0	9e392366-bdd8-4b4f-9b69-1a49a5515848	f3dedf79-5c5e-40fd-9513-d0fb0995d429	rejected	0	0	0.00	0.00	0.00		[]	2026-02-25 13:23:18.064639+00	\N	\N
b538ada5-4110-4e7b-99c9-8b1f603107e3	f526cc02-dfc2-49eb-9a76-acdc7917959c	f3dedf79-5c5e-40fd-9513-d0fb0995d429	approved	1	3	150.00	150.00	0.00		[]	2026-02-26 13:18:46.126505+00	2026-02-26 13:18:58.293+00	\N
\.


--
-- Data for Name: brand_task_submissions; Type: TABLE DATA; Schema: public; Owner: postgres
--
