COPY public.exchange_records (id, user_id, product_id, product_name, product_category, points_cost, quantity, status, created_at, admin_notes, processed_by, processed_at, product_image, user_email, contact_phone, shipping_address, updated_at) FROM stdin;
d5031bf3-dce8-417c-a080-25268bdf5197	f3dedf79-5c5e-40fd-9513-d0fb0995d429	3a07821c-0b23-4921-bd31-6ad8cee234e8	数字艺术壁纸	virtual	800	1	refunded	2026-02-15 14:14:09.43995+00		admin	2026-02-25 02:19:24.475+00	\N	\N	\N	\N	2026-02-25 02:19:25.022673+00
fcbd3abf-6aa7-4a60-b1fe-f55d7dcd1e18	f3dedf79-5c5e-40fd-9513-d0fb0995d429	5b7088d9-7f94-4a21-97b6-c32efcb3894d	AI创作工具包	service	2000	1	refunded	2026-02-12 05:58:50.614083+00	\N	\N	\N	\N	\N	\N	\N	2026-02-25 13:12:38.392573+00
\.


--
-- Data for Name: favorites; Type: TABLE DATA; Schema: public; Owner: postgres
--
