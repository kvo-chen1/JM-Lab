COPY public.promotion_audit_logs (id, application_id, user_id, action, previous_status, new_status, notes, reason, performed_by, performed_by_role, changes, created_at) FROM stdin;
\.


--
-- Data for Name: promotion_coupon_usage; Type: TABLE DATA; Schema: public; Owner: postgres
--
