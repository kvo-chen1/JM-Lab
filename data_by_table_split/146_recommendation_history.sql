COPY public.recommendation_history (id, user_id, content_id, algorithm_type, recommendation_score, was_clicked, was_liked, dwell_time, "position", recommended_at, context) FROM stdin;
\.


--
-- Data for Name: recommendation_metrics; Type: TABLE DATA; Schema: public; Owner: postgres
--
