COPY public.community_invitations (id, community_id, inviter_id, invitee_id, invitee_email, invitee_phone, invite_code, status, message, expires_at, accepted_at, rejected_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: community_invite_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--
