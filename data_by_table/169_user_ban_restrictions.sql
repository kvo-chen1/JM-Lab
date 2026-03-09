COPY public.user_ban_restrictions (id, user_id, disable_login, disable_post, disable_comment, disable_like, disable_follow, ban_reason, ban_duration, banned_at, banned_by, expires_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_behavior_daily_stats; Type: TABLE DATA; Schema: public; Owner: postgres
--
