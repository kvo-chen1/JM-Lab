COPY public.analytics_daily_stats (id, stat_date, new_users, active_users, total_works, total_likes, total_comments, total_shares, page_views, unique_visitors, avg_session_duration, bounce_rate, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: analytics_hourly_stats; Type: TABLE DATA; Schema: public; Owner: postgres
--
