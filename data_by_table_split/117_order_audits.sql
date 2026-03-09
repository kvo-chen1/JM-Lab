COPY public.order_audits (id, order_id, user_id, title, brand_name, type, description, budget_min, budget_max, deadline, duration, location, max_applicants, difficulty, requirements, tags, attachments, status, audit_opinion, audited_by, audited_at, created_at, updated_at) FROM stdin;
934eeb49-25e1-4d08-be3c-bb5b5c2c77d0	order_1772270215013	f3dedf79-5c5e-40fd-9513-d0fb0995d429	111	1111111111111	design	1111111111111111111111111	1000.00	5000.00	2026-03-01 00:00:00+00	7天	远程	10	medium	{11,11}	{}	{}	approved		f3dedf79-5c5e-40fd-9513-d0fb0995d429	2026-02-28 09:20:25.069+00	2026-02-28 09:16:55.013+00	2026-02-28 09:20:25.069+00
\.


--
-- Data for Name: order_execution_clicks; Type: TABLE DATA; Schema: public; Owner: postgres
--
