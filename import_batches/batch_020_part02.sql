COPY public.recommendation_configs (id, config_key, config_value, description, is_active, created_at, updated_at) FROM stdin;
18747dce-afbd-440f-b9ec-f00e29cceba7	collaborative_filtering	{"enabled": true, "max_neighbors": 50, "min_similarity": 0.3, "time_decay_days": 30}	协同过滤算法配置	t	2026-03-01 01:16:03.843671+00	2026-03-01 01:16:03.843671+00
184b5965-3328-4ef4-8b73-ffc4e91142ba	content_based	{"enabled": true, "tag_weight": 0.4, "time_weight": 0.3, "category_weight": 0.3}	基于内容的推荐配置	t	2026-03-01 01:16:03.843671+00	2026-03-01 01:16:03.843671+00
f2703b97-6847-4019-87c9-ebf06a9f3fdf	hot_recommendation	{"enabled": true, "min_interactions": 10, "time_window_hours": 72}	热门推荐配置	t	2026-03-01 01:16:03.843671+00	2026-03-01 01:16:03.843671+00
48b8dd3f-feca-4097-981d-49e22773c555	diversity	{"lambda": 0.5, "enabled": true, "max_same_author": 3, "max_same_category": 5}	多样性重排序配置	t	2026-03-01 01:16:03.843671+00	2026-03-01 01:16:03.843671+00
34a51e08-39cd-4081-9210-6872ce9e88be	cold_start	{"enabled": true, "exploration_rate": 0.2, "onboarding_questions": true}	冷启动策略配置	t	2026-03-01 01:16:03.843671+00	2026-03-01 01:16:03.843671+00
\.


--
-- Data for Name: recommendation_history; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.recommendation_history (id, user_id, content_id, algorithm_type, recommendation_score, was_clicked, was_liked, dwell_time, "position", recommended_at, context) FROM stdin;
\.


--
-- Data for Name: recommendation_metrics; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.recommendation_metrics (id, recommendation_id, user_id, impression_count, click_count, like_count, share_count, comment_count, total_dwell_time, avg_dwell_time, conversion_rate, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: recommendation_operation_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.recommendation_operation_logs (id, operation_type, item_id, previous_value, new_value, operated_by, operated_at, notes) FROM stdin;
\.


--
-- Data for Name: replies; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.replies (id, post_id, user_id, content, created_at) FROM stdin;
\.


--
-- Data for Name: reports; Type: TABLE DATA; Schema: public; Owner: postgres
--


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


COPY public.revenue_records (id, user_id, amount, type, description, status, work_id, created_at) FROM stdin;
07e18aa0-3600-4fe7-9f39-03c229fdec91	f3dedf79-5c5e-40fd-9513-d0fb0995d429	50.00	task	品牌任务奖励	completed	\N	2026-02-26 10:55:21.291857+00
9b3c37d1-a366-4d27-86c5-28b98957d221	f3dedf79-5c5e-40fd-9513-d0fb0995d429	50.00	task	品牌任务奖励	pending	\N	2026-02-26 13:20:56.981+00
f4deb50b-6596-4cdf-a9a2-bea33f722e8d	f3dedf79-5c5e-40fd-9513-d0fb0995d429	50.00	task	品牌任务奖励	completed	\N	2026-02-26 13:20:57.686+00
d4dee949-4369-4212-b29a-0f1d1d15d6c4	f3dedf79-5c5e-40fd-9513-d0fb0995d429	50.00	task	品牌任务奖励	pending	\N	2026-02-26 13:20:58.94+00
e85454bc-33fe-4128-b6e6-3c9b51250b3b	f3dedf79-5c5e-40fd-9513-d0fb0995d429	50.00	task	品牌任务奖励	completed	\N	2026-02-26 13:20:59.516+00
\.


--
-- Data for Name: score_audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.score_audit_logs (id, submission_id, judge_id, action, old_score, new_score, comment, created_at) FROM stdin;
19397ad1-fdce-44d4-9cb8-4b2c649578a9	427ed2f9-c598-46cc-a0e6-69f1ac914b8b	f3dedf79-5c5e-40fd-9513-d0fb0995d429	score	\N	10.00	很不错	2026-02-16 06:39:42.721867+00
\.


--
-- Data for Name: search_behavior_tracking; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.search_behavior_tracking (id, user_id, session_id, search_query, search_results_shown, result_clicked, clicked_result_id, clicked_result_type, click_position, time_to_click_ms, dwell_time_ms, converted, conversion_type, search_context, device_type, browser_info, created_at) FROM stdin;
\.


--
-- Data for Name: search_suggestions; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.search_suggestions (id, keyword, category, weight, is_hot, is_recommended, click_count, search_count, related_keywords, metadata, is_active, created_at, updated_at) FROM stdin;
8cb64677-d356-476f-8d94-ee86e12db9f3	国潮设计	design	100	t	t	0	0	\N	{}	t	2026-02-11 10:42:54.725782+00	2026-02-11 10:42:54.725782+00
0a2b189b-4bcf-4824-acab-01f5b329487a	纹样设计	design	95	t	t	0	0	\N	{}	t	2026-02-11 10:42:54.725782+00	2026-02-11 10:42:54.725782+00
9adc0c4b-bfe3-41da-beeb-39298f4e0ba2	品牌设计	design	90	t	t	0	0	\N	{}	t	2026-02-11 10:42:54.725782+00	2026-02-11 10:42:54.725782+00
b490ce0d-a11b-4f61-b7f3-5c2d0a31f7a9	非遗传承	culture	85	t	t	0	0	\N	{}	t	2026-02-11 10:42:54.725782+00	2026-02-11 10:42:54.725782+00
df707672-e93f-4ed1-a15b-5cfbf28f3d1a	插画设计	design	80	t	t	0	0	\N	{}	t	2026-02-11 10:42:54.725782+00	2026-02-11 10:42:54.725782+00
7fd86a68-e9c3-4bac-a154-49ac0842cacb	工艺创新	design	75	t	f	0	0	\N	{}	t	2026-02-11 10:42:54.725782+00	2026-02-11 10:42:54.725782+00
75540573-0a3c-459b-a2fc-294ca581b91f	老字号品牌	brand	70	t	f	0	0	\N	{}	t	2026-02-11 10:42:54.725782+00	2026-02-11 10:42:54.725782+00
c41dfd71-1553-4958-bea5-93d8e847f294	IP设计	design	65	t	t	0	0	\N	{}	t	2026-02-11 10:42:54.725782+00	2026-02-11 10:42:54.725782+00
3d462746-fe26-4f2c-890b-b8c0d722ce24	包装设计	design	60	t	f	0	0	\N	{}	t	2026-02-11 10:42:54.725782+00	2026-02-11 10:42:54.725782+00
0dc89827-2026-4350-9c23-808d8eb25f16	海报设计	design	55	f	t	0	0	\N	{}	t	2026-02-11 10:42:54.725782+00	2026-02-11 10:42:54.725782+00
8fc8c169-8023-4936-a3de-81e43e2d2312	字体设计	design	50	f	f	0	0	\N	{}	t	2026-02-11 10:42:54.725782+00	2026-02-11 10:42:54.725782+00
15d4d01b-f685-469f-a057-e4289b19a56a	标志设计	design	45	f	f	0	0	\N	{}	t	2026-02-11 10:42:54.725782+00	2026-02-11 10:42:54.725782+00
7c06de9d-6a04-4527-8b34-b7463a981d98	VI设计	design	40	f	f	0	0	\N	{}	t	2026-02-11 10:42:54.725782+00	2026-02-11 10:42:54.725782+00
d3edc6bb-0cb1-475f-8a51-52bebc2da5f9	UI设计	design	35	f	t	0	0	\N	{}	t	2026-02-11 10:42:54.725782+00	2026-02-11 10:42:54.725782+00
7d1bfaa7-4c8f-4919-9943-f4b315639f79	平面设计	design	30	f	f	0	0	\N	{}	t	2026-02-11 10:42:54.725782+00	2026-02-11 10:42:54.725782+00
30a7a653-797e-4338-8325-f3411e082700	文创产品	product	85	t	t	0	0	\N	{}	t	2026-02-11 10:42:54.725782+00	2026-02-11 10:42:54.725782+00
d25e469e-7889-444f-8b8b-f2df05607f80	天津文化	culture	80	t	t	0	0	\N	{}	t	2026-02-11 10:42:54.725782+00	2026-02-11 10:42:54.725782+00
8d87385a-3bb5-484a-b583-4195e811f2e0	民俗艺术	culture	75	f	f	0	0	\N	{}	t	2026-02-11 10:42:54.725782+00	2026-02-11 10:42:54.725782+00
5d8878f9-6725-40f1-9ff6-fd186ea4395e	传统手工艺	culture	70	f	f	0	0	\N	{}	t	2026-02-11 10:42:54.725782+00	2026-02-11 10:42:54.725782+00
83db4326-bb80-4ba6-9677-94f4452c6504	现代设计	design	65	f	t	0	0	\N	{}	t	2026-02-11 10:42:54.725782+00	2026-02-11 10:42:54.725782+00
\.


--
-- Data for Name: small_traffic_exposures; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.small_traffic_exposures (id, test_id, user_id, content_id, exposed_at, clicked, liked, dwell_time) FROM stdin;
\.


--
-- Data for Name: small_traffic_tests; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.small_traffic_tests (id, content_id, test_status, start_time, end_time, sample_size, target_sample_size, exposure_count, click_count, like_count, ctr, engagement_rate, quality_threshold, graduation_threshold, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: submission_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.submission_comments (id, submission_id, user_id, content, parent_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: submission_likes; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.submission_likes (id, submission_id, user_id, created_at) FROM stdin;
a7105fef-63e6-493e-8a35-e60529698d59	5838d36f-e6f6-4c9d-a2a6-a1c66ba205d6	f3dedf79-5c5e-40fd-9513-d0fb0995d429	2026-02-13 14:12:48.17867+00
c2e8dbc3-6b66-44d3-b213-823bb7906c58	427ed2f9-c598-46cc-a0e6-69f1ac914b8b	f3dedf79-5c5e-40fd-9513-d0fb0995d429	2026-02-16 12:41:24.092404+00
\.


--
-- Data for Name: submission_ratings; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.submission_ratings (id, submission_id, user_id, rating, comment, created_at, updated_at) FROM stdin;
ecf4fb4a-e15e-4626-b435-0320d379fe6a	5838d36f-e6f6-4c9d-a2a6-a1c66ba205d6	f3dedf79-5c5e-40fd-9513-d0fb0995d429	3	\N	2026-02-13 13:57:27.695837+00	2026-02-13 13:57:28.543446+00
\.


--
-- Data for Name: submission_scores; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.submission_scores (id, submission_id, judge_id, score, comment, created_at, updated_at) FROM stdin;
4845ff51-39ac-4076-9c95-beb6dc299ede	427ed2f9-c598-46cc-a0e6-69f1ac914b8b	f3dedf79-5c5e-40fd-9513-d0fb0995d429	10.00	很不错	2026-02-16 06:39:42.721867+00	2026-02-16 06:39:42.721867+00
\.


--
-- Data for Name: submission_votes; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.submission_votes (id, submission_id, user_id, created_at) FROM stdin;
e4b371b2-bdf2-4d36-b9bb-540a4c88bf8d	5838d36f-e6f6-4c9d-a2a6-a1c66ba205d6	f3dedf79-5c5e-40fd-9513-d0fb0995d429	2026-02-13 14:12:47.188284+00
62deb13e-bf4b-42e5-8d07-07e4afd65ab8	427ed2f9-c598-46cc-a0e6-69f1ac914b8b	f3dedf79-5c5e-40fd-9513-d0fb0995d429	2026-02-16 12:41:23.268506+00
\.


--
-- Data for Name: task_records; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.task_records (id, user_id, task_id, task_type, task_title, progress, target, status, points_reward, completed_at, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: template_favorites; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.template_favorites (id, user_id, template_id, created_at) FROM stdin;
0bdff87b-3555-4d6f-8f89-0d297c2755bd	f3dedf79-5c5e-40fd-9513-d0fb0995d429	1	2026-02-18 06:12:10.31553+00
\.


--
-- Data for Name: template_likes; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.template_likes (id, user_id, template_id, created_at) FROM stdin;
4f9470ea-963c-4b1c-94b6-68b98f7e9609	f3dedf79-5c5e-40fd-9513-d0fb0995d429	1	2026-02-18 06:12:09.626901+00
\.


--
-- Data for Name: tianjin_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.tianjin_templates (id, title, description, thumbnail, category, tags, usage_count, likes_count, is_active, created_at, updated_at, view_count) FROM stdin;
3	静海葡萄节活动模板	围绕静海葡萄节打造节庆主视觉，适配导视与物料延展。色彩鲜艳，充满丰收喜悦。	https://picsum.photos/seed/jinghai-grape-festival/800/600	节日主题	{葡萄,农业,绿色,自然}	109	67	t	2026-02-12 08:21:43.832316+00	2026-02-12 08:32:56.638022+00	280
4	海河风光模板	以海河风光为背景，适合城市宣传和旅游相关设计。展现天津现代化都市与历史文化的交融。	https://picsum.photos/seed/haihe-river/800/600	城市风光	{海河,城市,夜景,现代}	189	156	t	2026-02-12 08:21:43.913677+00	2026-02-12 08:32:56.703324+00	520
5	老字号联名模板	面向老字号品牌的联名海报与包装视觉模板。融合传统元素与现代设计语言。	https://picsum.photos/seed/laozihao-brand/800/600	品牌联名	{老字号,品牌,中式,商业}	135	98	t	2026-02-12 08:21:43.994329+00	2026-02-12 08:32:56.774003+00	380
6	夜游光影视觉模板	以海河夜景的光影氛围为主视觉，适配品牌活动海报。充满现代都市的时尚感和艺术气息。	https://picsum.photos/seed/night-light-show/800/600	夜游光影	{夜景,光影,艺术,时尚}	98	76	t	2026-02-12 08:21:44.07333+00	2026-02-12 08:32:56.839084+00	260
7	海河滨水休闲模板	展现海河滨水休闲空间的设计模板，适合城市休闲宣传。轻松愉悦的氛围，适合生活方式类内容。	https://picsum.photos/seed/haihe-leisure/800/600	城市休闲	{休闲,滨水,生活,自然}	156	112	t	2026-02-12 08:32:56.905133+00	2026-02-12 08:32:56.905133+00	340
8	北塘海鲜美食模板	以北塘渔港与海鲜元素为主，适合餐饮美食类宣传设计。色彩丰富，充满食欲感。	https://picsum.photos/seed/beitang-seafood/800/600	美食宣传	{海鲜,美食,餐饮,北塘}	178	145	t	2026-02-12 08:32:56.969502+00	2026-02-12 08:32:56.969502+00	480
9	文博展陈主题模板	适合博物馆、文化馆展览陈列的主题视觉模板。庄重典雅，突出文化底蕴。	https://picsum.photos/seed/museum-exhibition/800/600	文博展陈	{博物馆,文化,展览,艺术}	112	84	t	2026-02-12 08:32:57.033105+00	2026-02-12 08:32:57.033105+00	290
10	蓟州长城风光模板	以蓟州长城与山野风光为主视觉，适合文旅宣传类设计。展现天津的自然与历史之美。	https://picsum.photos/seed/jizhou-greatwall/800/600	历史风情	{长城,蓟州,自然,风光}	167	134	t	2026-02-12 08:32:57.096821+00	2026-02-12 08:32:57.096821+00	410
11	天津小吃宣传模板	为天津特色小吃设计的宣传模板，突出地方美食特色。狗不理、耳朵眼炸糕、十八街麻花等元素。	https://picsum.photos/seed/tianjin-snacks/800/600	美食宣传	{小吃,美食,天津特色,插画}	198	167	t	2026-02-12 08:32:57.160066+00	2026-02-12 08:32:57.160066+00	560
12	杨柳青年画主题模板	基于杨柳青年画艺术风格设计的创意模板，融合传统民俗与现代设计。	https://picsum.photos/seed/yangliuqing-painting/800/600	节日主题	{年画,杨柳青,传统,民俗}	145	123	t	2026-02-12 08:32:57.224556+00	2026-02-12 08:32:57.224556+00	380
13	天津之眼摩天轮模板	以天津之眼摩天轮为主题的视觉模板，展现天津地标建筑的浪漫与壮观。适合夜景主题和城市宣传。	https://picsum.photos/seed/tianjin-eye/800/600	城市风光	{天津之眼,摩天轮,地标,夜景}	312	245	t	2026-02-12 08:32:57.288277+00	2026-02-12 08:32:57.288277+00	680
14	意式风情区模板	展现天津意式风情区的欧式建筑与浪漫氛围，适合文化旅游和婚纱摄影类设计。	https://picsum.photos/seed/italian-style/800/600	历史风情	{意式风情区,欧式,浪漫,建筑}	198	167	t	2026-02-12 08:32:57.351788+00	2026-02-12 08:32:57.351788+00	450
15	古文化街民俗模板	以天津古文化街为背景，展现传统民俗文化和老字号商铺的热闹氛围。	https://picsum.photos/seed/ancient-culture-street/800/600	节日主题	{古文化街,民俗,传统文化,老字号}	156	134	t	2026-02-12 08:32:57.417038+00	2026-02-12 08:32:57.417038+00	380
16	瓷房子艺术模板	以天津瓷房子独特的陶瓷艺术为灵感，展现创意建筑与艺术融合的视觉风格。	https://picsum.photos/seed/porcelain-house/800/600	文博展陈	{瓷房子,艺术,建筑,创意}	134	112	t	2026-02-12 08:32:57.480088+00	2026-02-12 08:32:57.480088+00	320
17	天津港工业风模板	展现天津港的工业力量与现代物流风貌，适合工业主题和商业宣传设计。	https://picsum.photos/seed/tianjin-port/800/600	城市风光	{天津港,工业,现代,物流}	98	76	t	2026-02-12 08:32:57.543549+00	2026-02-12 08:32:57.543549+00	240
2	五大道历史风情模板	以五大道近代建筑群为视觉元素，突出天津的历史人文风貌。适合文化旅游、历史主题宣传。	https://picsum.photos/seed/wudadao-history/800/600	历史风情	{五大道,历史建筑,欧式,复古}	142	89	t	2026-02-12 08:21:43.750934+00	2026-02-12 08:32:56.574098+00	326
1	津沽文化节主题模板	融合天津传统文化元素，适用于各类文化节活动宣传设计。包含传统纹样、民俗元素和现代排版风格。	https://picsum.photos/seed/tianjin-culture-festival/800/600	节日主题	{传统文化,节日,红色,国潮}	235	128	t	2026-02-12 08:21:43.653365+00	2026-02-12 08:32:56.504303+00	454
18	盘山风景区模板	以蓟州盘山自然风景区为主题，展现天津山水之美和户外休闲氛围。	https://picsum.photos/seed/panshan-mountain/800/600	城市休闲	{盘山,自然,风景,户外}	145	123	t	2026-02-12 08:32:57.607072+00	2026-02-12 08:32:57.607072+00	360
19	独乐寺古建筑模板	以蓟州独乐寺千年古建筑为主题，展现中国传统建筑之美和佛教文化。	https://picsum.photos/seed/dule-temple/800/600	历史风情	{独乐寺,古建筑,佛教,文化}	112	98	t	2026-02-12 08:32:57.675527+00	2026-02-12 08:32:57.675527+00	290
20	泥人张彩塑模板	以天津泥人张彩塑艺术为主题，展现民间传统工艺的独特魅力。	https://picsum.photos/seed/nirenzhang/800/600	文博展陈	{泥人张,彩塑,非遗,民间艺术}	178	156	t	2026-02-12 08:32:57.738528+00	2026-02-12 08:32:57.738528+00	420
21	风筝魏风筝模板	以天津风筝魏传统风筝技艺为主题，展现风筝在蓝天中翱翔的美感。	https://picsum.photos/seed/kite-weifamily/800/600	城市休闲	{风筝魏,风筝,非遗,传统}	134	112	t	2026-02-12 08:32:57.801067+00	2026-02-12 08:32:57.801067+00	320
22	狗不理包子制作模板	展现狗不理包子制作过程的美食文化，突出天津传统小吃的匠心工艺。	https://picsum.photos/seed/goubuli-making/800/600	美食宣传	{狗不理,包子,美食,工艺}	267	234	t	2026-02-12 08:32:57.864274+00	2026-02-12 08:32:57.864274+00	580
23	天津相声文化模板	以天津相声艺术为主题，展现曲艺表演的魅力和传统文化氛围。	https://picsum.photos/seed/xiangsheng-culture/800/600	节日主题	{相声,曲艺,表演,文化}	189	167	t	2026-02-12 08:32:57.930306+00	2026-02-12 08:32:57.930306+00	420
24	天津大学校园模板	展现天津大学百年名校的校园风光和学术氛围，适合教育主题设计。	https://picsum.photos/seed/tju-campus/800/600	城市风光	{天津大学,校园,教育,学术}	156	134	t	2026-02-12 08:32:57.993851+00	2026-02-12 08:32:57.993851+00	360
25	南开大学风光模板	以南开大学为主题，展现百年学府的历史底蕴和优美校园环境。	https://picsum.photos/seed/nankai-campus/800/600	城市风光	{南开大学,校园,教育,历史}	145	123	t	2026-02-12 08:32:58.057466+00	2026-02-12 08:32:58.057466+00	340
26	滨海新区现代建筑模板	展现天津滨海新区的现代化建筑风貌和城市发展成就。	https://picsum.photos/seed/binhai-modern/800/600	城市风光	{滨海新区,现代,建筑,发展}	123	98	t	2026-02-12 08:32:58.120759+00	2026-02-12 08:32:58.120759+00	290
27	天津博物馆文化模板	以天津博物馆为主题，展现城市历史文化和艺术珍藏的庄重氛围。	https://picsum.photos/seed/tianjin-museum/800/600	文博展陈	{博物馆,文化,历史,艺术}	134	112	t	2026-02-12 08:32:58.183313+00	2026-02-12 08:32:58.183313+00	320
28	天津大剧院艺术模板	展现天津大剧院的现代建筑美学和高端艺术演出氛围。	https://picsum.photos/seed/grand-theatre/800/600	文博展陈	{大剧院,艺术,建筑,演出}	112	98	t	2026-02-12 08:32:58.245859+00	2026-02-12 08:32:58.245859+00	280
29	天津鼓楼模板	以天津鼓楼历史建筑为主题，展现老城厢的历史文化风貌。	https://picsum.photos/seed/tianjin-drum-tower/800/600	历史风情	{鼓楼,历史,建筑,文化}	145	123	t	2026-02-12 08:32:58.308166+00	2026-02-12 08:32:58.308166+00	340
30	天津解放桥模板	以天津解放桥为主题，展现这座百年铁桥的历史价值和工业美学。	https://picsum.photos/seed/jiefang-bridge/800/600	历史风情	{解放桥,桥梁,历史,地标}	178	156	t	2026-02-12 08:32:58.371326+00	2026-02-12 08:32:58.371326+00	420
31	天津利顺德大饭店模板	以天津利顺德大饭店为主题，展现百年历史酒店的欧式典雅和名人文化。	https://picsum.photos/seed/astor-hotel/800/600	历史风情	{利顺德,酒店,历史,欧式}	123	112	t	2026-02-12 08:32:58.434321+00	2026-02-12 08:32:58.434321+00	290
32	滨海新区夜景模板	展现天津滨海新区璀璨夜景和现代化都市的繁华氛围。	https://picsum.photos/seed/binhai-night/800/600	夜游光影	{滨海新区,夜景,现代,繁华}	189	167	t	2026-02-12 08:32:58.496774+00	2026-02-12 08:32:58.496774+00	450
\.


--
-- Data for Name: traffic_sources; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.user_achievements (user_id, achievement_id, progress, is_unlocked, unlocked_at) FROM stdin;
f3dedf79-5c5e-40fd-9513-d0fb0995d429	3	0	f	\N
f3dedf79-5c5e-40fd-9513-d0fb0995d429	4	0	f	\N
f3dedf79-5c5e-40fd-9513-d0fb0995d429	5	0	f	\N
f3dedf79-5c5e-40fd-9513-d0fb0995d429	6	0	f	\N
478c134c-c5c2-4c01-827b-d142352d4873	3	0	f	\N
478c134c-c5c2-4c01-827b-d142352d4873	4	0	f	\N
478c134c-c5c2-4c01-827b-d142352d4873	5	0	f	\N
478c134c-c5c2-4c01-827b-d142352d4873	6	0	f	\N
06dbee08-83b6-4d14-a5c1-d0794c8a168e	1	100	t	1770730054700
06dbee08-83b6-4d14-a5c1-d0794c8a168e	2	20	f	\N
06dbee08-83b6-4d14-a5c1-d0794c8a168e	3	6	f	\N
06dbee08-83b6-4d14-a5c1-d0794c8a168e	4	0	f	\N
06dbee08-83b6-4d14-a5c1-d0794c8a168e	5	0	f	\N
06dbee08-83b6-4d14-a5c1-d0794c8a168e	6	0	f	\N
f3dedf79-5c5e-40fd-9513-d0fb0995d429	1	100	t	1770730998175
00e1a36a-a77b-4bcc-b604-c5655a4ce802	1	100	t	1770733860100
00e1a36a-a77b-4bcc-b604-c5655a4ce802	2	20	f	\N
00e1a36a-a77b-4bcc-b604-c5655a4ce802	3	3	f	\N
00e1a36a-a77b-4bcc-b604-c5655a4ce802	4	0	f	\N
00e1a36a-a77b-4bcc-b604-c5655a4ce802	5	0	f	\N
00e1a36a-a77b-4bcc-b604-c5655a4ce802	6	0	f	\N
78340927-c853-4978-a90f-f54d7c6883d2	1	0	f	\N
78340927-c853-4978-a90f-f54d7c6883d2	2	0	f	\N
78340927-c853-4978-a90f-f54d7c6883d2	3	0	f	\N
78340927-c853-4978-a90f-f54d7c6883d2	4	0	f	\N
78340927-c853-4978-a90f-f54d7c6883d2	5	0	f	\N
78340927-c853-4978-a90f-f54d7c6883d2	6	0	f	\N
478c134c-c5c2-4c01-827b-d142352d4873	1	100	t	1770816764321
f3dedf79-5c5e-40fd-9513-d0fb0995d429	2	100	t	1770823754639
478c134c-c5c2-4c01-827b-d142352d4873	2	100	t	1771806333520
\.


--
-- Data for Name: user_activities; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.user_activities (id, user_id, action_type, entity_type, entity_id, details, ip_address, user_agent, created_at, activity_type, content, target_id, target_type, target_title) FROM stdin;
3b549b70-78d1-43d1-8811-8dede6e3e10b	a6f38aa1-7281-49f2-b565-2aa93ee89905	create_post	post	81	{"title": "1", "content": "11"}	\N	\N	2026-02-07 14:26:49.470453+00	post	发布了新作品《1》	\N	\N	\N
bcb314f7-c5ee-4b8e-888f-91b0fab758e6	a6f38aa1-7281-49f2-b565-2aa93ee89905	create_post	post	82	{"title": "1", "content": "1"}	\N	\N	2026-02-07 14:33:58.527389+00	post	发布了新作品《1》	\N	\N	\N
e2cf5a12-81df-4666-9851-575ffa3e3ca0	a6f38aa1-7281-49f2-b565-2aa93ee89905	create_post	post	83	{"title": "1", "content": "1"}	\N	\N	2026-02-07 14:55:37.25403+00	post	发布了新作品《1》	\N	\N	\N
0a3d524a-ce6c-472a-9f5e-fa5dc6e8a3d5	a6f38aa1-7281-49f2-b565-2aa93ee89905	create_post	post	84	{"title": "1", "content": "1"}	\N	\N	2026-02-07 14:56:05.811459+00	post	发布了新作品《1》	\N	\N	\N
\.


--
-- Data for Name: user_ban_restrictions; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.user_ban_restrictions (id, user_id, disable_login, disable_post, disable_comment, disable_like, disable_follow, ban_reason, ban_duration, banned_at, banned_by, expires_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_behavior_daily_stats; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.user_behavior_daily_stats (id, user_id, stat_date, mindmap_creates, mindmap_edits, node_creates, node_edits, ai_suggestions, stories_generated, works_published, brands_used, active_minutes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_behavior_events; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.user_behavior_events (id, user_id, event_type, item_id, item_type, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: user_behavior_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.user_behavior_logs (id, user_id, action, work_id, promoted_work_id, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: user_behaviors; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.user_behaviors (id, user_id, content_id, behavior_type, behavior_value, dwell_time, context, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_brand_history; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.user_brand_history (id, user_id, brand_id, brand_name, brand_image, usage_count, last_used_at, created_at) FROM stdin;
0f7f909e-f501-4c41-a359-39428ef51f71	00e1a36a-a77b-4bcc-b604-c5655a4ce802	guifaxiang	桂发祥十八街麻花	https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=SDXL%2C%20Tianjin%20Guifaxiang%20Shibajie%20mahua%2C%20traditional%20Chinese%20snack%20photography%2C%20red%20and%20gold%20accents%2C%20studio%20lighting%2C%20high%20detail%2C%20cultural%20motif&image_size=landscape_16_9	3	2026-03-04 07:37:45.418923+00	2026-03-04 05:26:11.535292+00
\.


--
-- Data for Name: user_creative_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.user_creative_profiles (id, user_id, preferred_categories, preferred_brands, preferred_themes, total_mindmaps, total_nodes, total_ai_suggestions, total_stories, total_published_works, creative_style_tags, creative_strengths, creative_improvements, most_active_hour, most_active_day, last_analyzed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_demographics; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.user_demographics (id, user_id, age_group, gender, location, interests, preferred_categories, preferred_content_types, onboarding_completed, onboarding_data, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_devices; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.user_devices (id, user_id, device_type, device_name, user_agent, ip_address, first_seen_at, last_seen_at, created_at, updated_at) FROM stdin;
d8837494-1ce0-4c25-a792-b37210ea6c72	78340927-c853-4978-a90f-f54d7c6883d2	desktop	桌面端	\N	\N	1970-01-21 11:50:44.084+00	2026-02-27 10:00:12.652+00	2026-02-27 10:00:14.165458+00	2026-02-27 10:00:14.165458+00
4890a4c6-714a-4d4f-80b6-63d00b29edc1	16781e4a-3941-476f-855e-f5e9f9de8576	desktop	桌面端	\N	\N	1970-01-21 11:51:33.87+00	2026-02-27 10:00:12.653+00	2026-02-27 10:00:14.165458+00	2026-02-27 10:00:14.165458+00
62b2d936-4931-4926-ba3c-c8a8c635b354	d0f6c86d-27ad-416f-a57a-992948c1a2a7	desktop	桌面端	\N	\N	2026-02-20 13:07:27.323678+00	2026-02-27 10:00:12.653+00	2026-02-27 10:00:14.165458+00	2026-02-27 10:00:14.165458+00
8f2f3405-c642-426a-9972-e68cbf253829	45713305-2bc4-48ad-8733-265a379be671	mobile	移动端	\N	\N	2026-02-20 13:13:39.096662+00	2026-02-27 10:00:12.653+00	2026-02-27 10:00:14.165458+00	2026-02-27 10:00:14.165458+00
22123ae9-5895-499f-bc2b-7fd41aa9ba42	44b4e1e2-1e70-4f44-a97f-053cd16cfd06	mobile	移动端	\N	\N	2026-02-21 00:48:00.524408+00	2026-02-27 10:00:12.653+00	2026-02-27 10:00:14.165458+00	2026-02-27 10:00:14.165458+00
341a97b0-325b-4842-9af6-16e52152f8bb	00e1a36a-a77b-4bcc-b604-c5655a4ce802	mobile	移动端	\N	\N	1970-01-21 11:50:43.971+00	2026-02-27 10:00:12.653+00	2026-02-27 10:00:14.165458+00	2026-02-27 10:00:14.165458+00
8f2e3538-dd0c-4cc9-a48e-997dd0381f69	f3dedf79-5c5e-40fd-9513-d0fb0995d429	mobile	移动端	\N	\N	1970-01-21 11:50:45.346+00	2026-02-27 10:00:12.653+00	2026-02-27 10:00:14.165458+00	2026-02-27 10:00:14.165458+00
dfc152ef-7c78-4579-80be-37f22b24666c	06dbee08-83b6-4d14-a5c1-d0794c8a168e	desktop	桌面端	\N	\N	1970-01-21 11:50:43.68+00	2026-02-27 10:00:12.653+00	2026-02-27 10:00:14.165458+00	2026-02-27 10:00:14.165458+00
2bd4c66e-81b4-4468-88eb-956a78fe3115	2689ba70-b3b9-4425-b01a-fab003b29072	mobile	移动端	\N	\N	2026-02-26 05:56:30.175206+00	2026-02-27 10:00:12.653+00	2026-02-27 10:00:14.165458+00	2026-02-27 10:00:14.165458+00
fa4be13b-1e50-4931-8cdb-9ce40b4e38e8	478c134c-c5c2-4c01-827b-d142352d4873	mobile	移动端	\N	\N	1970-01-21 11:51:26.131+00	2026-02-27 10:00:12.653+00	2026-02-27 10:00:14.165458+00	2026-02-27 10:00:14.165458+00
\.


--
-- Data for Name: user_exploration_state; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.user_exploration_state (id, user_id, exploration_rate, total_interactions, exploration_count, exploitation_count, discovered_categories, discovered_tags, last_exploration_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_favorites; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.user_favorites (id, user_id, brand_id, brand_name, brand_image, notes, created_at) FROM stdin;
\.


--
-- Data for Name: user_feedbacks; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.user_feedbacks (id, user_id, type, title, content, contact_info, contact_type, screenshots, device_info, browser_info, page_url, status, priority, assigned_to, response_content, responded_at, responded_by, is_notified, notified_at, created_at, updated_at) FROM stdin;
9636ce03-a4e2-4a7a-917e-8a9ffb77af78	\N	bug	REFERENCE_ERROR	1		phone	{}	\N	\N	http://localhost:3005/	pending	normal	\N	\N	\N	\N	f	\N	2026-02-17 04:27:11.846769+00	2026-02-26 14:55:58.729709+00
94f68397-6d99-4442-8c5f-1ef8ecb2289b	\N	bug	REFERENCE_ERROR	1	15305924639	phone	{}	\N	\N	http://localhost:3005/admin	pending	normal	\N	\N	\N	\N	f	\N	2026-02-17 04:43:17.886217+00	2026-02-26 14:55:58.729709+00
c6db3dee-a0ab-4c18-9255-d34a835d0fa3	\N	bug	NETWORK_ERROR	无法发送私信	16954369888	phone	{}	\N	\N	https://www.jinmai-lab.tech/square/3eb5baba-2dcb-44e6-b342-6957dcb83c26	pending	normal	\N	\N	\N	\N	f	\N	2026-02-24 12:26:30.9054+00	2026-02-26 14:55:58.729709+00
6fc13753-fa9a-4479-96fd-008831ed242d	\N	bug	NETWORK_ERROR	111	15305924639	phone	{}	\N	\N	http://localhost:3005/feed	pending	normal	\N	\N	\N	\N	f	\N	2026-02-24 13:14:11.157468+00	2026-02-26 14:55:58.729709+00
e5e8f678-536b-475a-9a0f-db88edab6451	\N	bug	NETWORK_ERROR	2222	15305924639	phone	{}	\N	\N	https://www.jinmai-lab.tech/	pending	normal	\N	\N	\N	\N	f	\N	2026-02-24 13:14:59.659784+00	2026-02-26 14:55:58.729709+00
670b4d70-cf7b-4836-a5a6-d96862abf8ee	\N	bug	NETWORK_ERROR	1111		phone	{}	\N	\N	http://localhost:3005/post/69153c64-9afc-42ea-b0c9-57cd6e625bd9	pending	normal	\N	\N	\N	\N	f	\N	2026-02-26 14:49:55.701897+00	2026-02-26 14:55:58.729709+00
5e9d36ab-a314-4ce1-bcd7-02757d9fbd43	\N	bug	NETWORK_ERROR	11		phone	{}	\N	\N	http://localhost:3005/post/69153c64-9afc-42ea-b0c9-57cd6e625bd9	pending	normal	\N	\N	\N	\N	f	\N	2026-02-26 15:02:37.134534+00	2026-02-26 15:02:37.134534+00
5908f25c-2a0d-42c0-b74a-b73e84fe4b52	\N	bug	NETWORK_ERROR	1		phone	{}	\N	\N	http://localhost:3005/post/69153c64-9afc-42ea-b0c9-57cd6e625bd9	pending	normal	\N	\N	\N	\N	f	\N	2026-02-26 15:07:09.203027+00	2026-02-26 15:07:09.203027+00
a7cd6f25-8595-4db0-a6c6-8707ef428d54	f3dedf79-5c5e-40fd-9513-d0fb0995d429	bug	NETWORK_ERROR	1	153059246369kvo@gmail.com	email	{}	\N	\N	http://localhost:3005/feed	pending	normal	\N	\N	\N	\N	f	\N	2026-02-26 15:11:38.628803+00	2026-02-26 15:11:38.628803+00
\.


--
-- Data for Name: user_invite_rate_limits; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.user_invite_rate_limits (id, user_id, daily_count, weekly_count, monthly_count, last_invite_at, reset_daily_at, reset_weekly_at, reset_monthly_at, created_at, updated_at) FROM stdin;
f7b06283-4051-4848-902c-1505477dca84	f3dedf79-5c5e-40fd-9513-d0fb0995d429	0	0	5	2026-02-18 10:03:58.674164+00	2026-03-04 06:21:24.486959+00	2026-03-04 10:36:16.513796+00	2026-03-20 09:24:50.69971+00	2026-02-18 09:24:50.625123+00	2026-03-03 06:21:24.486959+00
0bea8e24-16cc-4569-a225-6210130482de	00e1a36a-a77b-4bcc-b604-c5655a4ce802	0	0	0	\N	2026-02-25 12:42:19.171624+00	2026-02-27 06:33:16.316004+00	2026-03-22 06:33:16.316004+00	2026-02-20 06:21:50.021979+00	2026-02-24 12:42:19.171624+00
249f10ce-d50c-4830-b7d8-aa17ab057a31	478c134c-c5c2-4c01-827b-d142352d4873	0	0	0	\N	2026-02-26 06:56:16.587902+00	2026-03-04 06:56:16.587902+00	2026-03-27 06:56:16.587902+00	2026-02-25 06:56:16.285842+00	2026-02-25 06:56:16.587902+00
00a6cc78-08b3-4101-9724-ec44454c837a	2689ba70-b3b9-4425-b01a-fab003b29072	0	0	0	\N	2026-02-27 06:32:27.107345+00	2026-03-05 06:32:27.107345+00	2026-03-28 06:32:27.107345+00	2026-02-26 06:31:28.077762+00	2026-02-26 06:32:27.107345+00
\.


--
-- Data for Name: user_mockup_configs; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.user_mockup_configs (id, user_id, name, design_image_url, mockup_type, mockup_config, preview_url, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.user_notifications (id, user_id, type, title, content, related_id, related_type, is_read, read_at, created_at) FROM stdin;
\.


--
-- Data for Name: user_patterns; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.user_patterns (id, user_id, pattern_id, custom_pattern_url, name, category, is_custom, created_at) FROM stdin;
\.


--
-- Data for Name: user_points_balance; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.user_points_balance (id, user_id, balance, total_earned, total_spent, version, last_updated_at, created_at) FROM stdin;
6b43ef14-9b44-487d-af98-c005176924fe	78340927-c853-4978-a90f-f54d7c6883d2	0	0	0	1	2026-02-09 13:35:14.567744+00	2026-02-09 13:35:14.567744+00
2be87ae3-9693-4f19-a8d0-e0a7be2da029	f3dedf79-5c5e-40fd-9513-d0fb0995d429	415	3565	3150	13	2026-03-03 07:49:37.792772+00	2026-02-09 13:50:00.328661+00
8862edf3-bb16-441b-a3c6-cd656e5f6ad6	478c134c-c5c2-4c01-827b-d142352d4873	10	10	0	3	2026-02-12 05:23:38.612729+00	2026-02-10 01:14:42.520808+00
4bee1e6d-d4b4-4faf-8d4a-1990c6eefad5	d0f6c86d-27ad-416f-a57a-992948c1a2a7	0	0	0	1	2026-02-20 13:07:27.323678+00	2026-02-20 13:07:27.323678+00
eabc661a-f5d3-4a99-baee-172e476ca56f	45713305-2bc4-48ad-8733-265a379be671	5	5	0	2	2026-02-20 13:32:13.581119+00	2026-02-20 13:13:39.096662+00
097393a2-b0e6-4bbe-9c4c-2c5778e46868	44b4e1e2-1e70-4f44-a97f-053cd16cfd06	0	0	0	1	2026-02-21 00:48:00.524408+00	2026-02-21 00:48:00.524408+00
44e760ce-dbe2-429a-9f77-40d5c1fba8fa	00e1a36a-a77b-4bcc-b604-c5655a4ce802	40	40	0	7	2026-02-24 12:23:26.402139+00	2026-02-09 13:33:17.840534+00
03286f74-f839-48d7-87d8-e20ec5f06687	06dbee08-83b6-4d14-a5c1-d0794c8a168e	35	35	0	6	2026-02-26 13:20:50.336301+00	2026-02-09 13:28:31.944407+00
\.


--
-- Data for Name: user_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.user_profiles (id, user_id, interests, preference_vector, interaction_count, last_interaction_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_realtime_features; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.user_realtime_features (id, user_id, view_count, click_count, like_count, avg_dwell_time, current_session_duration, interest_categories, interest_tags, interest_authors, context_time_of_day, context_day_of_week, context_device_type, context_location, last_updated, created_at, expires_at) FROM stdin;
\.


--
-- Data for Name: user_search_history; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.user_search_history (id, user_id, query, search_type, result_count, clicked_result_id, clicked_result_type, search_filters, search_duration_ms, ip_address, user_agent, created_at) FROM stdin;
37d30e13-c4b0-4b5a-9fc6-66a7048d9a31	478c134c-c5c2-4c01-827b-d142352d4873	海河	general	0	\N	\N	{}	\N	\N	\N	2026-02-11 11:12:36.468808+00
972421d2-bcaf-4a51-bf7c-6099c4be3c0c	478c134c-c5c2-4c01-827b-d142352d4873	老k	general	0	\N	\N	{}	\N	\N	\N	2026-02-11 13:14:41.74104+00
d5747e13-39bc-44c4-8a11-7b21177b3cde	478c134c-c5c2-4c01-827b-d142352d4873	老字号	general	0	\N	\N	{}	\N	\N	\N	2026-02-11 13:15:11.771838+00
127c1fec-1d9e-4ad9-a7fe-95b9186f966e	478c134c-c5c2-4c01-827b-d142352d4873	纹样设计	general	0	\N	\N	{}	\N	\N	\N	2026-02-11 13:15:20.780528+00
9d80cabd-f56b-4252-81ec-c8496b7aa63f	00e1a36a-a77b-4bcc-b604-c5655a4ce802	海河	general	0	\N	\N	{}	\N	\N	\N	2026-02-13 12:19:21.873751+00
0c36560b-9caa-42b4-9efd-d83d8813ad63	478c134c-c5c2-4c01-827b-d142352d4873	海河	general	0	\N	\N	{}	\N	\N	\N	2026-02-13 13:29:20.763822+00
c48a1939-31d1-4c90-a3fd-588fe94a44d0	00e1a36a-a77b-4bcc-b604-c5655a4ce802	夕阳西下	general	0	\N	\N	{}	\N	\N	\N	2026-02-13 13:29:54.264278+00
39dae6d1-e01d-400e-9eb9-17fd4a932a19	478c134c-c5c2-4c01-827b-d142352d4873	杨柳青	general	0	\N	\N	{}	\N	\N	\N	2026-02-13 13:29:55.260694+00
2b2a5890-809b-45b0-882e-523195e47e4a	00e1a36a-a77b-4bcc-b604-c5655a4ce802	海河	general	0	\N	\N	{}	\N	\N	\N	2026-02-13 13:30:14.678021+00
11ebfea3-bdc1-4b7a-bd26-218a3d3a9ac9	f3dedf79-5c5e-40fd-9513-d0fb0995d429	IP设计	general	0	\N	\N	{}	\N	\N	\N	2026-02-19 08:32:47.600281+00
78c2da53-ad8f-4090-aef2-d96179d541f4	f3dedf79-5c5e-40fd-9513-d0fb0995d429	海河	general	0	\N	\N	{}	\N	\N	\N	2026-02-19 08:37:33.067635+00
68855bbc-d621-41e4-8572-c3f7f1f23267	f3dedf79-5c5e-40fd-9513-d0fb0995d429	海河	general	0	\N	\N	{}	\N	\N	\N	2026-02-22 13:20:43.149242+00
8db7e29b-78af-45ed-83b8-1f829ede1d13	78340927-c853-4978-a90f-f54d7c6883d2	国潮设计	general	0	\N	\N	{}	\N	\N	\N	2026-02-22 13:29:25.073058+00
f57a7cf5-bdf2-482b-9e1a-f89b787ace02	f3dedf79-5c5e-40fd-9513-d0fb0995d429	海河	general	0	\N	\N	{}	\N	\N	\N	2026-02-22 13:29:35.346305+00
50a24b5a-5c84-418a-9a2e-0ac4f7a8b99c	78340927-c853-4978-a90f-f54d7c6883d2	纹样设计	general	0	\N	\N	{}	\N	\N	\N	2026-02-22 13:29:42.535421+00
60b74c2f-ffd8-4a12-803d-e9331c43fd50	f3dedf79-5c5e-40fd-9513-d0fb0995d429	海河	general	0	\N	\N	{}	\N	\N	\N	2026-02-22 13:29:49.587452+00
35566381-6a3d-40b1-ab44-56efde84deff	f3dedf79-5c5e-40fd-9513-d0fb0995d429	海河	general	0	\N	\N	{}	\N	\N	\N	2026-02-22 13:43:30.165502+00
c94eb476-e153-4b57-90eb-96158971e898	f3dedf79-5c5e-40fd-9513-d0fb0995d429	海河	general	0	\N	\N	{}	\N	\N	\N	2026-02-23 02:03:49.130916+00
b2748958-bec8-420f-a8a0-beae1946f8cf	f3dedf79-5c5e-40fd-9513-d0fb0995d429	纹样设计	general	0	\N	\N	{}	\N	\N	\N	2026-02-23 07:22:44.608944+00
62c912a2-10c4-4085-8db2-d41b512ae34a	f3dedf79-5c5e-40fd-9513-d0fb0995d429	海河	general	0	\N	\N	{}	\N	\N	\N	2026-02-23 07:37:27.161817+00
b683de6b-7a86-41e0-a60f-3dd1eeefc3f0	f3dedf79-5c5e-40fd-9513-d0fb0995d429	海河	general	0	\N	\N	{}	\N	\N	\N	2026-02-23 07:39:41.714935+00
9b8d3ae3-ead9-4e87-84e1-325be960a566	f3dedf79-5c5e-40fd-9513-d0fb0995d429	海河	general	0	\N	\N	{}	\N	\N	\N	2026-02-23 07:47:07.913664+00
fdbc4f5e-7983-477a-a5d5-e6c58bc2a528	f3dedf79-5c5e-40fd-9513-d0fb0995d429	海河	general	0	\N	\N	{}	\N	\N	\N	2026-02-23 08:35:44.598365+00
875eaba9-0da0-4395-9e16-c0c6032937f1	f3dedf79-5c5e-40fd-9513-d0fb0995d429	海河	general	0	\N	\N	{}	\N	\N	\N	2026-02-23 08:38:26.24219+00
6ffa62a6-0de7-48ac-bb1d-a9274048bd32	f3dedf79-5c5e-40fd-9513-d0fb0995d429	海河	general	0	\N	\N	{}	\N	\N	\N	2026-02-23 08:42:35.122669+00
deaa39c1-a4cb-4765-a196-ef749103f3b4	f3dedf79-5c5e-40fd-9513-d0fb0995d429	海河	general	0	\N	\N	{}	\N	\N	\N	2026-02-23 08:47:47.517321+00
50bea0c6-f5e8-463b-9d47-89dab5329153	f3dedf79-5c5e-40fd-9513-d0fb0995d429	海河	general	0	\N	\N	{}	\N	\N	\N	2026-02-23 08:52:58.844073+00
e7cd02ad-c9ab-4761-9ed2-a59821613c11	f3dedf79-5c5e-40fd-9513-d0fb0995d429	海河	general	0	\N	\N	{}	\N	\N	\N	2026-02-23 09:05:50.981193+00
af41d910-7f23-4830-bb05-6d21d5792fc9	f3dedf79-5c5e-40fd-9513-d0fb0995d429	AI	general	0	\N	\N	{}	\N	\N	\N	2026-02-23 09:06:29.38502+00
5a659180-0083-4b31-9df3-cfb85eb94498	f3dedf79-5c5e-40fd-9513-d0fb0995d429	海河	general	0	\N	\N	{}	\N	\N	\N	2026-02-23 09:07:12.99382+00
64ef285d-d5fd-47e4-8e72-ef9bc8dc8e78	f3dedf79-5c5e-40fd-9513-d0fb0995d429	海河	general	0	\N	\N	{}	\N	\N	\N	2026-02-23 09:32:59.650091+00
8d89aa9d-2ba6-4518-9347-85e78c69e11b	f3dedf79-5c5e-40fd-9513-d0fb0995d429	海河	general	0	\N	\N	{}	\N	\N	\N	2026-02-23 09:38:54.693053+00
e1b29f11-0645-4c6e-8428-1adf458980bc	f3dedf79-5c5e-40fd-9513-d0fb0995d429	海河	general	0	\N	\N	{}	\N	\N	\N	2026-02-23 09:41:25.372456+00
5ba1a4ec-0334-413e-880e-a79f71b02ffa	f3dedf79-5c5e-40fd-9513-d0fb0995d429	国潮设计	general	0	\N	\N	{}	\N	\N	\N	2026-02-23 10:36:45.305362+00
5702c297-0ce8-47aa-9c19-b2ec8158d269	f3dedf79-5c5e-40fd-9513-d0fb0995d429	国潮设计	general	0	\N	\N	{}	\N	\N	\N	2026-02-23 13:06:14.896042+00
c662e654-c5f9-45e4-a31f-88c24549809a	f3dedf79-5c5e-40fd-9513-d0fb0995d429	品牌设计	general	0	\N	\N	{}	\N	\N	\N	2026-02-27 01:49:03.484838+00
9dcf7cb5-35a3-4994-953a-d6c1e6b0b9ff	00e1a36a-a77b-4bcc-b604-c5655a4ce802	海河	general	0	\N	\N	{}	\N	\N	\N	2026-03-02 15:07:50.451892+00
827e7607-f2fb-41cc-ac93-dfbf3e8145d9	f3dedf79-5c5e-40fd-9513-d0fb0995d429	国潮设计	general	0	\N	\N	{}	\N	\N	\N	2026-03-03 10:32:28.429413+00
\.


--
-- Data for Name: user_search_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.user_search_preferences (id, user_id, preferred_categories, preferred_tags, preferred_authors, search_history_enabled, personalized_recommendations_enabled, auto_suggest_enabled, safe_search_enabled, results_per_page, default_sort_by, ui_preferences, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.user_sessions (id, user_id, session_token, ip_address, user_agent, last_active, created_at) FROM stdin;
\.


--
-- Data for Name: user_similarities; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.user_similarities (id, user_id, similar_user_id, similarity_score, common_interactions, calculated_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_status; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.user_status (user_id, status, last_seen, updated_at) FROM stdin;
d0f6c86d-27ad-416f-a57a-992948c1a2a7	online	2026-02-23 01:17:21.529+00	2026-02-23 01:17:21.529+00
2689ba70-b3b9-4425-b01a-fab003b29072	online	2026-02-27 08:10:33.998+00	2026-02-27 08:10:33.998+00
478c134c-c5c2-4c01-827b-d142352d4873	online	2026-03-03 11:03:04.582+00	2026-03-03 11:03:04.582+00
06dbee08-83b6-4d14-a5c1-d0794c8a168e	online	2026-03-02 11:38:09.644+00	2026-03-02 11:38:09.644+00
00e1a36a-a77b-4bcc-b604-c5655a4ce802	online	2026-03-04 07:29:30.255+00	2026-03-04 07:29:30.255+00
44b4e1e2-1e70-4f44-a97f-053cd16cfd06	offline	2026-02-21 00:50:06.441+00	2026-02-21 00:50:06.441+00
45713305-2bc4-48ad-8733-265a379be671	online	2026-02-20 13:31:31.773+00	2026-02-20 13:31:31.773+00
78340927-c853-4978-a90f-f54d7c6883d2	offline	2026-02-23 13:11:13.08+00	2026-02-23 13:11:13.08+00
f3dedf79-5c5e-40fd-9513-d0fb0995d429	online	2026-03-04 13:08:01.74+00	2026-03-04 13:08:01.74+00
\.


--
-- Data for Name: user_style_presets; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.user_style_presets (id, user_id, name, styles, blend_ratio, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: user_sync_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.user_sync_logs (id, user_id, sync_type, sync_data, synced_at, device_info, ip_address) FROM stdin;
\.


--
-- Data for Name: user_tile_configs; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.user_tile_configs (id, user_id, name, base_image_url, tile_mode, spacing, rotation, scale, created_at) FROM stdin;
\.


--
-- Data for Name: user_uploads; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.user_uploads (id, user_id, file_url, file_name, file_type, file_size, thumbnail_url, title, description, tags, created_at, updated_at) FROM stdin;
470f5ec8-ba72-4c8a-817f-672de0f0963a	f3dedf79-5c5e-40fd-9513-d0fb0995d429	https://pptqdicaaewtnaiflfcs.supabase.co/storage/v1/object/public/works/user-uploads/1771382565454-0h0rptivrub.jpg	22.jpg	image/jpeg	8036	https://pptqdicaaewtnaiflfcs.supabase.co/storage/v1/object/public/works/user-uploads/1771382565454-0h0rptivrub.jpg	22.jpg	\N	{}	2026-02-18 02:42:47.316133+00	2026-02-18 02:42:47.316133+00
8a114323-4a0f-4e75-ba57-5838626b4b97	f3dedf79-5c5e-40fd-9513-d0fb0995d429	https://pptqdicaaewtnaiflfcs.supabase.co/storage/v1/object/public/works/user-uploads/1771382992104-9zkh6jp2pal.jpg	22.jpg	image/jpeg	8036	https://pptqdicaaewtnaiflfcs.supabase.co/storage/v1/object/public/works/user-uploads/1771382992104-9zkh6jp2pal.jpg	22.jpg	\N	{}	2026-02-18 02:49:53.719133+00	2026-02-18 02:49:53.719133+00
fe6de654-c0be-476c-b31f-bd5411592280	f3dedf79-5c5e-40fd-9513-d0fb0995d429	https://pptqdicaaewtnaiflfcs.supabase.co/storage/v1/object/public/works/user-uploads/1771767177151-uv1aevjiw.jpg	22.jpg	image/jpeg	8036	https://pptqdicaaewtnaiflfcs.supabase.co/storage/v1/object/public/works/user-uploads/1771767177151-uv1aevjiw.jpg	22.jpg	\N	{}	2026-02-22 13:32:57.747191+00	2026-02-22 13:32:57.747191+00
92057257-5253-4436-8291-a4d7d3f1525e	f3dedf79-5c5e-40fd-9513-d0fb0995d429	https://pptqdicaaewtnaiflfcs.supabase.co/storage/v1/object/public/works/user-uploads/1771767216108-mqq3c4xwdt.png	555.png	image/png	49029	https://pptqdicaaewtnaiflfcs.supabase.co/storage/v1/object/public/works/user-uploads/1771767216108-mqq3c4xwdt.png	555.png	\N	{}	2026-02-22 13:33:36.59413+00	2026-02-22 13:33:36.59413+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.withdrawal_records (id, user_id, amount, status, payment_method, payment_account, processed_at, created_at) FROM stdin;
\.


--
-- Data for Name: work_bookmarks; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.work_bookmarks (id, work_id, user_id, created_at) FROM stdin;
\.


--
-- Data for Name: work_comment_likes; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.work_comment_likes (user_id, comment_id, created_at) FROM stdin;
\.


--
-- Data for Name: work_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.work_favorites (id, user_id, work_id, created_at) FROM stdin;
\.


--
-- Data for Name: work_performance_stats; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.work_performance_stats (id, submission_id, event_id, view_count, like_count, comment_count, share_count, avg_score, score_count, ranking, last_updated) FROM stdin;
df276c53-568f-4fe3-b8b1-2a3b55adff24	427ed2f9-c598-46cc-a0e6-69f1ac914b8b	665f1aab-e2ec-49b8-a691-f0134fac9861	0	1	0	1	0.00	0	\N	2026-02-26 01:41:05.816502+00
7a82ead9-c3c2-4415-b4e2-40d2c02aec94	5838d36f-e6f6-4c9d-a2a6-a1c66ba205d6	f1251821-5738-48ed-91b7-5d4b59287219	0	1	0	1	3.00	1	\N	2026-02-26 01:41:05.816502+00
2b5fac40-6487-4f56-ada1-2aed64064bd7	2fba426f-d820-4c19-bf28-5a7190bec997	7fba402a-ca0f-4164-9715-f739e5e88fb3	0	0	0	0	0.00	0	\N	2026-02-27 03:10:31.47243+00
\.


--
-- Data for Name: work_shares; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.work_shares (id, sender_id, receiver_id, work_id, work_title, work_thumbnail, work_type, message, is_read, created_at, read_at) FROM stdin;
\.


--
-- Data for Name: works; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.works_bookmarks (user_id, work_id, created_at) FROM stdin;
\.


--
-- Data for Name: works_likes; Type: TABLE DATA; Schema: public; Owner: postgres
--