COPY public.recommendation_metrics (id, recommendation_id, user_id, impression_count, click_count, like_count, share_count, comment_count, total_dwell_time, avg_dwell_time, conversion_rate, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: recommendation_operation_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--
