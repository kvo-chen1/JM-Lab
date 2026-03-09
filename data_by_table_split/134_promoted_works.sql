COPY public.promoted_works (id, order_id, work_id, user_id, package_type, target_type, metric_type, start_time, end_time, target_views, actual_views, target_clicks, actual_clicks, promotion_weight, priority_score, display_position, is_featured, status, daily_views, daily_clicks, total_cost, metadata, created_at, updated_at) FROM stdin;
ce4f7249-3ad7-4e59-85d2-2af154ba9a93	e34ecd58-27ef-4caf-9cfb-413734f24a85	bd064ca2-79f7-4ca5-9ad2-4c36b17b1489	78340927-c853-4978-a90f-f54d7c6883d2	standard	account	views	2026-03-01 03:35:20.691491+00	2026-03-02 03:35:20.691491+00	1000	0	50	0	1.00	100.00	0	f	paused	0	0	0.00	{}	2026-03-01 03:35:20.691491+00	2026-03-01 05:19:13.252259+00
5a6c60c9-a2a6-4d0c-a783-ed12c44dccba	bf366c2e-de1d-42dc-90b1-b0bb5a66fa5b	81e2a0cb-5dfa-42ad-b9ed-2a40d78c45f4	f3dedf79-5c5e-40fd-9513-d0fb0995d429	standard	account	views	2026-02-27 09:21:11.066704+00	2026-02-28 09:21:11.066704+00	1000	57	50	0	1.00	0.00	0	f	paused	0	0	0.00	{}	2026-02-27 09:21:11.066704+00	2026-03-01 05:19:14.930941+00
afe8d3a8-bf68-48b0-890c-d2e915b806cc	8edbdc5c-df6e-40c4-89de-e8f0d448565a	91a03020-6700-4831-aa51-9300110b5c49	f3dedf79-5c5e-40fd-9513-d0fb0995d429	standard	account	views	2026-02-27 09:13:35.400827+00	2026-02-28 09:13:35.400827+00	1000	60	50	0	1.00	0.00	0	f	paused	0	0	0.00	{}	2026-02-27 09:13:35.400827+00	2026-03-01 05:19:17.78048+00
\.


--
-- Data for Name: promotion_applications; Type: TABLE DATA; Schema: public; Owner: postgres
--
