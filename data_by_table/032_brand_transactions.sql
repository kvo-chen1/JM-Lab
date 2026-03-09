COPY public.brand_transactions (id, account_id, brand_id, user_id, type, amount, balance_after, task_id, submission_id, description, payment_method, payment_reference, status, created_at, completed_at) FROM stdin;
fd18fc26-b870-4f98-ada2-35dd52a1bf50	d3c22f3a-bd79-40a9-a479-73a49fdffc05	\N	f3dedf79-5c5e-40fd-9513-d0fb0995d429	deposit	100.00	100.00	\N	\N	充值 100 元	bank_transfer	DEP1772067658451	completed	2026-02-26 01:00:59.045257+00	\N
\.


--
-- Data for Name: brand_wizard_drafts; Type: TABLE DATA; Schema: public; Owner: postgres
--
