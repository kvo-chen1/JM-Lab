COPY public.memberships (id, user_id, plan_type, status, amount, start_date, end_date, payment_method, transaction_id, metadata, created_at, updated_at) FROM stdin;
775c2040-7b75-47a6-9f75-5d9778feb00a	44b4e1e2-1e70-4f44-a97f-053cd16cfd06	quarterly	active	299.00	2026-02-13 09:58:31.9514	2027-01-14 04:46:36.304477	card	TXN855682	{}	2026-02-28 06:54:35.029961	2026-02-28 06:54:35.029961
e4ac3141-42bb-4f94-9fb2-8dc88fc80d82	00e1a36a-a77b-4bcc-b604-c5655a4ce802	yearly	active	79.90	2026-02-14 19:03:57.85504	2027-01-12 14:36:18.282391	card	TXN746150	{}	2026-02-28 06:54:35.029961	2026-02-28 06:54:35.029961
226acaa4-778f-4a43-9468-6588d4cb3dbf	2689ba70-b3b9-4425-b01a-fab003b29072	yearly	active	299.00	2026-01-29 05:06:43.12399	2026-03-27 14:33:55.522229	alipay	TXN120885	{}	2026-02-28 06:54:35.029961	2026-02-28 06:54:35.029961
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--
