COPY public.search_behavior_tracking (id, user_id, session_id, search_query, search_results_shown, result_clicked, clicked_result_id, clicked_result_type, click_position, time_to_click_ms, dwell_time_ms, converted, conversion_type, search_context, device_type, browser_info, created_at) FROM stdin;
\.


--
-- Data for Name: search_suggestions; Type: TABLE DATA; Schema: public; Owner: postgres
--
