COPY public.ai_feedback (id, user_id, user_name, user_avatar, session_id, conversation_id, message_id, rating, feedback_type, comment, ai_model, ai_response, user_query, created_at, updated_at, is_read, tags, metadata) FROM stdin;
a4d49123-b830-4cc9-833b-cda2ccf52e05	f3dedf79-5c5e-40fd-9513-d0fb0995d429	kvo1	\N	acb0af80-4366-4820-b9b5-1b8cc9011554	acb0af80-4366-4820-b9b5-1b8cc9011554	\N	4	helpfulness		qwen	你好！我是津小脉，很高兴为你服务。你现在在「津脉广场」页面，有什么可以帮助你的吗？你可以问我关于平台使用、创作技巧、文化知识等方面的问题，我会尽力为你解答。	你好	2026-02-26 14:19:08.789155+00	2026-02-26 14:19:08.789155+00	f	{}	{}
\.


--
-- Data for Name: ai_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--
