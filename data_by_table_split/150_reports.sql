COPY public.reports (id, reporter_id, target_type, target_id, target_author_id, report_type, description, screenshots, status, admin_id, admin_response, action_taken, created_at, updated_at, resolved_at) FROM stdin;
d2fccaed-1ce5-417b-a3bc-e222ef588ae8	f3dedf79-5c5e-40fd-9513-d0fb0995d429	work	b2967029-bd9d-4372-a891-bfba98d522f2	\N	plagiarism	搬运/抄袭我的原创作品	[]	pending	\N	\N	\N	2026-02-27 09:17:46.537861+00	2026-02-27 09:17:46.537861+00	\N
67c7f547-2836-47ef-b8b6-88ea3f4d82fe	f3dedf79-5c5e-40fd-9513-d0fb0995d429	work	96f1dd22-5f74-456f-a3a0-e48026d8f7de	\N	portrait	未经授权使用我的肖像	[]	pending	\N	\N	\N	2026-02-27 09:17:46.537861+00	2026-02-27 09:17:46.537861+00	\N
ebef2da6-5cf6-4863-ab78-84184dee6354	f3dedf79-5c5e-40fd-9513-d0fb0995d429	work	534369f5-2767-41c8-a407-7c554168a5b3	\N	privacy	泄露个人隐私信息	[]	processing	\N	\N	\N	2026-02-27 09:17:46.537861+00	2026-02-27 09:17:46.537861+00	\N
1073cbcb-f4b7-4263-9137-087ee37eee4b	f3dedf79-5c5e-40fd-9513-d0fb0995d429	work	1ba20fa8-8b46-4cf2-9b86-7d9452bec3e5	\N	trademark	假冒商标	[]	resolved	\N	\N	\N	2026-02-27 09:17:46.537861+00	2026-02-27 09:17:46.537861+00	\N
b04d2fd3-c7ae-44f7-bac8-6dc49de031b3	f3dedf79-5c5e-40fd-9513-d0fb0995d429	work	05821019-38f5-4148-9ea9-3601ef865192	\N	reputation	损害个人名誉	[]	rejected	\N	\N	\N	2026-02-27 09:17:46.537861+00	2026-02-27 09:17:46.537861+00	\N
\.


--
-- Data for Name: revenue_records; Type: TABLE DATA; Schema: public; Owner: postgres
--
