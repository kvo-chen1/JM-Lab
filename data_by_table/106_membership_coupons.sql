COPY public.membership_coupons (id, code, name, description, discount_type, discount_value, min_purchase_amount, max_discount_amount, applicable_plans, usage_limit, usage_count, valid_from, valid_until, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: membership_history; Type: TABLE DATA; Schema: public; Owner: postgres
--
