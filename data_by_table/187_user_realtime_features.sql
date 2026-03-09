COPY public.user_realtime_features (id, user_id, view_count, click_count, like_count, avg_dwell_time, current_session_duration, interest_categories, interest_tags, interest_authors, context_time_of_day, context_day_of_week, context_device_type, context_location, last_updated, created_at, expires_at) FROM stdin;
\.


--
-- Data for Name: user_search_history; Type: TABLE DATA; Schema: public; Owner: postgres
--
