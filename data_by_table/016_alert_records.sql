COPY public.alert_records (id, rule_id, metric_type, threshold, actual_value, severity, message, status, acknowledged_by, acknowledged_at, resolved_at, resolved_reason, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: alert_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--
