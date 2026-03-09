COPY public.alert_rules (id, name, description, metric_type, threshold, operator, time_window, severity, enabled, notify_channels, notify_targets, created_by, created_at, updated_at) FROM stdin;
dd8c61b7-cadc-4f5e-9344-079014ae3707	用户增长下降预警	当用户增长率下降超过20%时触发	users	-20.00	lt	60	warning	t	{dashboard}	{}	\N	2026-03-03 09:37:01.833167+00	2026-03-03 09:37:01.833167+00
9715bfd5-f1f0-4b80-bc33-3567af8a9142	浏览量异常下降	当浏览量下降超过30%时触发	views	-30.00	lt	60	warning	t	{dashboard}	{}	\N	2026-03-03 09:37:01.833167+00	2026-03-03 09:37:01.833167+00
d57e208d-07c1-45fc-9c06-01cd4887dce9	服务器CPU过高	当服务器CPU使用率超过80%时触发	server_cpu	80.00	gt	5	critical	t	{dashboard,email}	{}	\N	2026-03-03 09:37:01.833167+00	2026-03-03 09:37:01.833167+00
9971ca79-2d54-437b-a3db-d7476ad2bd35	错误率过高	当系统错误率超过5%时触发	error_rate	5.00	gt	10	error	t	{dashboard,email}	{}	\N	2026-03-03 09:37:01.833167+00	2026-03-03 09:37:01.833167+00
9d1837ed-ba0c-4c92-9661-28efd214e432	响应时间过长	当API响应时间超过2秒时触发	response_time	2000.00	gt	5	warning	t	{dashboard}	{}	\N	2026-03-03 09:37:01.833167+00	2026-03-03 09:37:01.833167+00
\.


--
-- Data for Name: analytics_daily_stats; Type: TABLE DATA; Schema: public; Owner: postgres
--
