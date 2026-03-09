COPY public.realtime_recommendation_cache (id, user_id, items, diversity_score, relevance_score, mmr_score, generated_context, generated_at, expires_at) FROM stdin;
\.


--
-- Data for Name: recommendation_configs; Type: TABLE DATA; Schema: public; Owner: postgres
--
