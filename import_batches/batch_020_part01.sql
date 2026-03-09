COPY public.achievements (id, name, description, icon, points_reward, type, criteria, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: admin_accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.admin_notifications (id, title, content, type, target, target_users, status, scheduled_at, sent_at, recipients_count, read_count, click_count, created_at, updated_at) FROM stdin;
6f86df57-c118-41c6-b90c-bc44fbd2262e	1	11	system	all	{}	sent	\N	2026-02-25 01:46:42.696+00	9	0	0	2026-02-25 01:46:39.305+00	2026-02-25 01:46:43.326096+00
42dd92eb-3902-423d-af3b-98680311081f	2	2	system	all	{}	sent	\N	2026-02-25 02:17:24.83+00	9	0	0	2026-02-25 02:17:22.489+00	2026-02-25 02:17:25.379853+00
\.


--
-- Data for Name: admin_operation_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.admin_operation_logs (id, admin_id, action, resource_type, resource_id, details, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: admin_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.ai_platform_knowledge (id, category, question, answer, related_pages, keywords, steps, priority, is_active, created_at, updated_at, usage_count) FROM stdin;
5a0ef72e-6b53-4f4e-bb2a-037d36feedc3	navigation	如何进入创作中心？	您可以通过以下方式进入创作中心：	{/create,/creation-workshop}	{创作,开始,新建,制作}	[{"step": 1, "action": "点击左侧导航栏的创作中心", "detail": "或点击首页的「开始创作」按钮"}, {"step": 2, "action": "选择创作类型", "detail": "图文、视频、设计等"}, {"step": 3, "action": "开始您的创作", "detail": "使用AI辅助工具或手动创作"}]	9	t	2026-02-11 02:53:21.675806+00	2026-02-11 02:53:21.675806+00	0
355f1fc5-4ad4-4c63-a2f1-7f06fbed7fec	navigation	津脉广场在哪里？	津脉广场是平台的社区中心，您可以在这里发现热门作品和创作者。	{/square}	{广场,社区,发现,热门}	[{"step": 1, "action": "点击左侧导航栏的「津脉广场」", "detail": "或访问 /square 路径"}, {"step": 2, "action": "浏览推荐内容", "detail": "查看热门作品和创作者"}, {"step": 3, "action": "互动参与", "detail": "点赞、评论、关注感兴趣的内容"}]	9	t	2026-02-11 02:53:21.675806+00	2026-02-11 02:53:21.675806+00	0
87821a5a-2dcd-48ca-b0f6-ce3e11538ac1	navigation	如何查看我的作品？	您可以在「我的作品」页面查看和管理所有创作。	{/my-works}	{作品,管理,查看,我的}	[{"step": 1, "action": "点击左侧导航栏的「我的作品」", "detail": "或访问 /my-works 路径"}, {"step": 2, "action": "筛选和排序", "detail": "按类型、时间、状态筛选作品"}, {"step": 3, "action": "管理作品", "detail": "编辑、删除或分享您的作品"}]	8	t	2026-02-11 02:53:21.675806+00	2026-02-11 02:53:21.675806+00	0
8c76c54c-3988-4b14-8e7d-03d0dc7a3ed2	operation	如何发布作品？	发布作品非常简单，只需几个步骤：	{/create,/my-works}	{发布,上传,分享,提交}	[{"step": 1, "action": "完成创作", "detail": "在创作中心完成您的作品"}, {"step": 2, "action": "点击「发布」按钮", "detail": "位于编辑器右上角"}, {"step": 3, "action": "填写作品信息", "detail": "标题、描述、标签、封面等"}, {"step": 4, "action": "选择发布范围", "detail": "公开、仅粉丝或私密"}, {"step": 5, "action": "确认发布", "detail": "点击「确认发布」即可"}]	10	t	2026-02-11 02:53:21.675806+00	2026-02-11 02:53:21.675806+00	0
7ef5a35e-289e-43a3-ac81-6bbd68b67393	operation	如何使用AI生成功能？	平台提供强大的AI生成能力，包括文本、图像、视频生成。	{/create,/neo}	{AI,生成,人工智能,创作}	[{"step": 1, "action": "进入创作中心", "detail": "点击左侧导航栏的创作中心"}, {"step": 2, "action": "选择AI工具", "detail": "文本生成、图像生成或视频生成"}, {"step": 3, "action": "输入提示词", "detail": "描述您想要生成的内容"}, {"step": 4, "action": "调整参数", "detail": "风格、尺寸、数量等"}, {"step": 5, "action": "生成并保存", "detail": "等待生成完成后保存到作品"}]	10	t	2026-02-11 02:53:21.675806+00	2026-02-11 02:53:21.675806+00	0
eae1c3d6-7373-4c3a-9c42-958f34c6d1f1	operation	如何参与文化活动？	平台定期举办各类文化活动，参与方式如下：	{/cultural-events,/events}	{活动,参与,报名,文化}	[{"step": 1, "action": "浏览活动列表", "detail": "进入文化活动页面查看当前活动"}, {"step": 2, "action": "选择感兴趣的活动", "detail": "查看活动详情和要求"}, {"step": 3, "action": "点击「参与活动」", "detail": "或根据活动要求提交作品"}, {"step": 4, "action": "等待审核", "detail": "部分活动需要主办方审核"}, {"step": 5, "action": "参与活动", "detail": "按照活动规则完成任务"}]	8	t	2026-02-11 02:53:21.675806+00	2026-02-11 02:53:21.675806+00	0
ebdc0d45-045f-49dc-b405-d45194890c70	feature	文创市集是什么？	文创市集是平台的电商模块，您可以购买或销售文创产品。	{/marketplace}	{市集,购买,销售,文创,商品}	[{"step": 1, "action": "进入文创市集", "detail": "点击左侧导航栏的文创市集"}, {"step": 2, "action": "浏览商品", "detail": "按分类筛选感兴趣的产品"}, {"step": 3, "action": "购买或开店", "detail": "购买心仪商品或申请成为卖家"}]	7	t	2026-02-11 02:53:21.675806+00	2026-02-11 02:53:21.675806+00	0
202c90b9-6d08-4eb2-a740-7497504f7f8d	feature	什么是灵感引擎？	灵感引擎是AI驱动的创意辅助工具，帮助您获得创作灵感。	{/neo}	{灵感,创意,AI,辅助}	[{"step": 1, "action": "进入灵感引擎", "detail": "点击左侧导航栏的灵感引擎"}, {"step": 2, "action": "选择灵感类型", "detail": "文案、设计、策划等"}, {"step": 3, "action": "输入关键词", "detail": "描述您的创作方向"}, {"step": 4, "action": "获取灵感", "detail": "AI将为您生成创意建议"}]	8	t	2026-02-11 02:53:21.675806+00	2026-02-11 02:53:21.675806+00	0
9616d052-d708-49c2-8a11-7788a334e6fa	feature	如何获得积分？	平台积分可以通过多种方式获得，用于兑换权益。	{/dashboard}	{积分,获取,奖励,点数}	[{"step": 1, "action": "每日签到", "detail": "连续签到可获得更多积分"}, {"step": 2, "action": "发布优质作品", "detail": "获得点赞和收藏可赚取积分"}, {"step": 3, "action": "参与活动", "detail": "完成活动任务获得积分奖励"}, {"step": 4, "action": "社区互动", "detail": "评论、分享、关注也可获得积分"}]	7	t	2026-02-11 02:53:21.675806+00	2026-02-11 02:53:21.675806+00	0
8f05ad14-f371-413c-8498-0876fc052240	guide	新手如何快速上手？	欢迎加入津脉智坊！以下是新手指南：	{/}	{新手,入门,开始,教程}	[{"step": 1, "action": "完善个人资料", "detail": "设置头像、昵称、简介"}, {"step": 2, "action": "浏览平台功能", "detail": "了解创作中心、广场、市集等模块"}, {"step": 3, "action": "尝试AI创作", "detail": "使用灵感引擎生成第一个作品"}, {"step": 4, "action": "参与社区互动", "detail": "关注创作者，点赞评论作品"}, {"step": 5, "action": "发布您的作品", "detail": "分享给社区，获得反馈"}]	10	t	2026-02-11 02:53:21.675806+00	2026-02-11 02:53:21.675806+00	0
bfdd87ee-0998-4175-84c8-ae1e76818a6d	feature	如何获得积分？	平台积分可以通过多种方式获得，用于兑换权益。	{/dashboard}	{积分,获取,奖励,点数}	[{"step": 1, "action": "每日签到", "detail": "连续签到可获得更多积分"}, {"step": 2, "action": "发布优质作品", "detail": "获得点赞和收藏可赚取积分"}, {"step": 3, "action": "参与活动", "detail": "完成活动任务获得积分奖励"}, {"step": 4, "action": "社区互动", "detail": "评论、分享、关注也可获得积分"}]	7	t	2026-02-11 03:06:24.646044+00	2026-02-11 03:06:24.646044+00	0
eba0c4a1-83d5-42b9-bcbb-6523e8cf9c42	guide	如何提高作品曝光？	想要让更多人看到您的作品？试试这些方法：	{/square}	{曝光,推广,热门,推荐}	[{"step": 1, "action": "优化作品信息", "detail": "完善标题、描述、标签"}, {"step": 2, "action": "使用高质量封面", "detail": "吸引人的封面能提高点击率"}, {"step": 3, "action": "选择合适发布时间", "detail": "在用户活跃时段发布"}, {"step": 4, "action": "积极互动", "detail": "回复评论，参与话题讨论"}, {"step": 5, "action": "参与活动", "detail": "官方活动可获得额外曝光"}]	8	t	2026-02-11 02:53:21.675806+00	2026-02-11 02:53:21.675806+00	0
22c6d80e-3ccc-4a7d-8b0a-23be6326434b	faq	忘记密码怎么办？	您可以通过以下方式重置密码：	{/settings}	{密码,忘记,重置,找回}	[{"step": 1, "action": "点击登录页面的「忘记密码」", "detail": "进入密码重置流程"}, {"step": 2, "action": "输入注册邮箱或手机号", "detail": "验证您的身份"}, {"step": 3, "action": "获取验证码", "detail": "通过邮件或短信接收"}, {"step": 4, "action": "设置新密码", "detail": "设置安全的新密码"}]	9	t	2026-02-11 02:53:21.675806+00	2026-02-11 02:53:21.675806+00	0
2977dfbe-e428-4beb-a01c-f5b870b9a040	faq	如何联系客服？	如果您遇到问题，可以通过以下方式联系客服：	{/help}	{客服,帮助,联系,支持}	[{"step": 1, "action": "使用AI助手", "detail": "我可以解答大部分常见问题"}, {"step": 2, "action": "查看帮助中心", "detail": "访问 /help 查看详细文档"}, {"step": 3, "action": "提交反馈", "detail": "在设置中提交问题反馈"}, {"step": 4, "action": "邮件联系", "detail": "发送邮件至 support@jinmai.com"}]	8	t	2026-02-11 02:53:21.675806+00	2026-02-11 02:53:21.675806+00	0
aa44f9b2-4f4c-46dd-a708-b45b63b0331d	navigation	如何进入创作中心？	您可以通过以下方式进入创作中心：	{/create,/creation-workshop}	{创作,开始,新建,制作}	[{"step": 1, "action": "点击左侧导航栏的创作中心", "detail": "或点击首页的「开始创作」按钮"}, {"step": 2, "action": "选择创作类型", "detail": "图文、视频、设计等"}, {"step": 3, "action": "开始您的创作", "detail": "使用AI辅助工具或手动创作"}]	9	t	2026-02-11 03:06:24.646044+00	2026-02-11 03:06:24.646044+00	0
a1e37023-88bb-42cd-94a4-a1448f68fe85	navigation	津脉广场在哪里？	津脉广场是平台的社区中心，您可以在这里发现热门作品和创作者。	{/square}	{广场,社区,发现,热门}	[{"step": 1, "action": "点击左侧导航栏的「津脉广场」", "detail": "或访问 /square 路径"}, {"step": 2, "action": "浏览推荐内容", "detail": "查看热门作品和创作者"}, {"step": 3, "action": "互动参与", "detail": "点赞、评论、关注感兴趣的内容"}]	9	t	2026-02-11 03:06:24.646044+00	2026-02-11 03:06:24.646044+00	0
6ed64f62-823a-4571-9fa7-60d0be51794e	navigation	如何查看我的作品？	您可以在「我的作品」页面查看和管理所有创作。	{/my-works}	{作品,管理,查看,我的}	[{"step": 1, "action": "点击左侧导航栏的「我的作品」", "detail": "或访问 /my-works 路径"}, {"step": 2, "action": "筛选和排序", "detail": "按类型、时间、状态筛选作品"}, {"step": 3, "action": "管理作品", "detail": "编辑、删除或分享您的作品"}]	8	t	2026-02-11 03:06:24.646044+00	2026-02-11 03:06:24.646044+00	0
c8639c18-24b1-47a0-a719-6f53ab5deda2	operation	如何发布作品？	发布作品非常简单，只需几个步骤：	{/create,/my-works}	{发布,上传,分享,提交}	[{"step": 1, "action": "完成创作", "detail": "在创作中心完成您的作品"}, {"step": 2, "action": "点击「发布」按钮", "detail": "位于编辑器右上角"}, {"step": 3, "action": "填写作品信息", "detail": "标题、描述、标签、封面等"}, {"step": 4, "action": "选择发布范围", "detail": "公开、仅粉丝或私密"}, {"step": 5, "action": "确认发布", "detail": "点击「确认发布」即可"}]	10	t	2026-02-11 03:06:24.646044+00	2026-02-11 03:06:24.646044+00	0
a95f6aa2-9b23-4332-aea4-8faf4c94f875	operation	如何使用AI生成功能？	平台提供强大的AI生成能力，包括文本、图像、视频生成。	{/create,/neo}	{AI,生成,人工智能,创作}	[{"step": 1, "action": "进入创作中心", "detail": "点击左侧导航栏的创作中心"}, {"step": 2, "action": "选择AI工具", "detail": "文本生成、图像生成或视频生成"}, {"step": 3, "action": "输入提示词", "detail": "描述您想要生成的内容"}, {"step": 4, "action": "调整参数", "detail": "风格、尺寸、数量等"}, {"step": 5, "action": "生成并保存", "detail": "等待生成完成后保存到作品"}]	10	t	2026-02-11 03:06:24.646044+00	2026-02-11 03:06:24.646044+00	0
1cd19445-9ccf-40ab-bd33-93a0249f2872	operation	如何参与文化活动？	平台定期举办各类文化活动，参与方式如下：	{/cultural-events,/events}	{活动,参与,报名,文化}	[{"step": 1, "action": "浏览活动列表", "detail": "进入文化活动页面查看当前活动"}, {"step": 2, "action": "选择感兴趣的活动", "detail": "查看活动详情和要求"}, {"step": 3, "action": "点击「参与活动」", "detail": "或根据活动要求提交作品"}, {"step": 4, "action": "等待审核", "detail": "部分活动需要主办方审核"}, {"step": 5, "action": "参与活动", "detail": "按照活动规则完成任务"}]	8	t	2026-02-11 03:06:24.646044+00	2026-02-11 03:06:24.646044+00	0
91af7fc9-b26e-4f8c-aa6d-f4a17b44e3d8	feature	文创市集是什么？	文创市集是平台的电商模块，您可以购买或销售文创产品。	{/marketplace}	{市集,购买,销售,文创,商品}	[{"step": 1, "action": "进入文创市集", "detail": "点击左侧导航栏的文创市集"}, {"step": 2, "action": "浏览商品", "detail": "按分类筛选感兴趣的产品"}, {"step": 3, "action": "购买或开店", "detail": "购买心仪商品或申请成为卖家"}]	7	t	2026-02-11 03:06:24.646044+00	2026-02-11 03:06:24.646044+00	0
5f6a8f95-0294-4e6e-af3c-735fa5347f9e	feature	什么是灵感引擎？	灵感引擎是AI驱动的创意辅助工具，帮助您获得创作灵感。	{/neo}	{灵感,创意,AI,辅助}	[{"step": 1, "action": "进入灵感引擎", "detail": "点击左侧导航栏的灵感引擎"}, {"step": 2, "action": "选择灵感类型", "detail": "文案、设计、策划等"}, {"step": 3, "action": "输入关键词", "detail": "描述您的创作方向"}, {"step": 4, "action": "获取灵感", "detail": "AI将为您生成创意建议"}]	8	t	2026-02-11 03:06:24.646044+00	2026-02-11 03:06:24.646044+00	0
24583746-5408-4583-9b94-b37fa5f200cd	guide	新手如何快速上手？	欢迎加入津脉智坊！以下是新手指南：	{/}	{新手,入门,开始,教程}	[{"step": 1, "action": "完善个人资料", "detail": "设置头像、昵称、简介"}, {"step": 2, "action": "浏览平台功能", "detail": "了解创作中心、广场、市集等模块"}, {"step": 3, "action": "尝试AI创作", "detail": "使用灵感引擎生成第一个作品"}, {"step": 4, "action": "参与社区互动", "detail": "关注创作者，点赞评论作品"}, {"step": 5, "action": "发布您的作品", "detail": "分享给社区，获得反馈"}]	10	t	2026-02-11 03:06:24.646044+00	2026-02-11 03:06:24.646044+00	0
6366fb2a-31bf-4758-8422-3f69ce30340f	guide	如何提高作品曝光？	想要让更多人看到您的作品？试试这些方法：	{/square}	{曝光,推广,热门,推荐}	[{"step": 1, "action": "优化作品信息", "detail": "完善标题、描述、标签"}, {"step": 2, "action": "使用高质量封面", "detail": "吸引人的封面能提高点击率"}, {"step": 3, "action": "选择合适发布时间", "detail": "在用户活跃时段发布"}, {"step": 4, "action": "积极互动", "detail": "回复评论，参与话题讨论"}, {"step": 5, "action": "参与活动", "detail": "官方活动可获得额外曝光"}]	8	t	2026-02-11 03:06:24.646044+00	2026-02-11 03:06:24.646044+00	0
9e94e3df-e240-425f-886a-fa8dfed9b9a3	faq	忘记密码怎么办？	您可以通过以下方式重置密码：	{/settings}	{密码,忘记,重置,找回}	[{"step": 1, "action": "点击登录页面的「忘记密码」", "detail": "进入密码重置流程"}, {"step": 2, "action": "输入注册邮箱或手机号", "detail": "验证您的身份"}, {"step": 3, "action": "获取验证码", "detail": "通过邮件或短信接收"}, {"step": 4, "action": "设置新密码", "detail": "设置安全的新密码"}]	9	t	2026-02-11 03:06:24.646044+00	2026-02-11 03:06:24.646044+00	0
90e7993b-9a90-4147-8ad9-63082d75d360	faq	如何联系客服？	如果您遇到问题，可以通过以下方式联系客服：	{/help}	{客服,帮助,联系,支持}	[{"step": 1, "action": "使用AI助手", "detail": "我可以解答大部分常见问题"}, {"step": 2, "action": "查看帮助中心", "detail": "访问 /help 查看详细文档"}, {"step": 3, "action": "提交反馈", "detail": "在设置中提交问题反馈"}, {"step": 4, "action": "邮件联系", "detail": "发送邮件至 support@jinmai.com"}]	8	t	2026-02-11 03:06:24.646044+00	2026-02-11 03:06:24.646044+00	0
f36f42f1-1dc3-4241-add5-fdb3793552ef	navigation	如何进入创作中心？	您可以通过以下方式进入创作中心：	{/create,/creation-workshop}	{创作,开始,新建,制作}	[{"step": 1, "action": "点击左侧导航栏的创作中心", "detail": "或点击首页的「开始创作」按钮"}, {"step": 2, "action": "选择创作类型", "detail": "图文、视频、设计等"}, {"step": 3, "action": "开始您的创作", "detail": "使用AI辅助工具或手动创作"}]	9	t	2026-02-18 06:11:04.011679+00	2026-02-18 06:11:04.011679+00	0
8dcf8992-a560-4fae-b67d-5a3bb702b28f	navigation	津脉广场在哪里？	津脉广场是平台的社区中心，您可以在这里发现热门作品和创作者。	{/square}	{广场,社区,发现,热门}	[{"step": 1, "action": "点击左侧导航栏的「津脉广场」", "detail": "或访问 /square 路径"}, {"step": 2, "action": "浏览推荐内容", "detail": "查看热门作品和创作者"}, {"step": 3, "action": "互动参与", "detail": "点赞、评论、关注感兴趣的内容"}]	9	t	2026-02-18 06:11:04.011679+00	2026-02-18 06:11:04.011679+00	0
f17641f7-feb8-4c88-8794-b36791762580	navigation	如何查看我的作品？	您可以在「我的作品」页面查看和管理所有创作。	{/my-works}	{作品,管理,查看,我的}	[{"step": 1, "action": "点击左侧导航栏的「我的作品」", "detail": "或访问 /my-works 路径"}, {"step": 2, "action": "筛选和排序", "detail": "按类型、时间、状态筛选作品"}, {"step": 3, "action": "管理作品", "detail": "编辑、删除或分享您的作品"}]	8	t	2026-02-18 06:11:04.011679+00	2026-02-18 06:11:04.011679+00	0
c047d6e3-b31c-4599-809c-529fec76cb28	operation	如何发布作品？	发布作品非常简单，只需几个步骤：	{/create,/my-works}	{发布,上传,分享,提交}	[{"step": 1, "action": "完成创作", "detail": "在创作中心完成您的作品"}, {"step": 2, "action": "点击「发布」按钮", "detail": "位于编辑器右上角"}, {"step": 3, "action": "填写作品信息", "detail": "标题、描述、标签、封面等"}, {"step": 4, "action": "选择发布范围", "detail": "公开、仅粉丝或私密"}, {"step": 5, "action": "确认发布", "detail": "点击「确认发布」即可"}]	10	t	2026-02-18 06:11:04.011679+00	2026-02-18 06:11:04.011679+00	0
e44adcba-380f-4ec4-8162-a70474d51a41	operation	如何使用AI生成功能？	平台提供强大的AI生成能力，包括文本、图像、视频生成。	{/create,/neo}	{AI,生成,人工智能,创作}	[{"step": 1, "action": "进入创作中心", "detail": "点击左侧导航栏的创作中心"}, {"step": 2, "action": "选择AI工具", "detail": "文本生成、图像生成或视频生成"}, {"step": 3, "action": "输入提示词", "detail": "描述您想要生成的内容"}, {"step": 4, "action": "调整参数", "detail": "风格、尺寸、数量等"}, {"step": 5, "action": "生成并保存", "detail": "等待生成完成后保存到作品"}]	10	t	2026-02-18 06:11:04.011679+00	2026-02-18 06:11:04.011679+00	0
b476c930-f12c-4733-81c3-d7e5f1a7df22	operation	如何参与文化活动？	平台定期举办各类文化活动，参与方式如下：	{/cultural-events,/events}	{活动,参与,报名,文化}	[{"step": 1, "action": "浏览活动列表", "detail": "进入文化活动页面查看当前活动"}, {"step": 2, "action": "选择感兴趣的活动", "detail": "查看活动详情和要求"}, {"step": 3, "action": "点击「参与活动」", "detail": "或根据活动要求提交作品"}, {"step": 4, "action": "等待审核", "detail": "部分活动需要主办方审核"}, {"step": 5, "action": "参与活动", "detail": "按照活动规则完成任务"}]	8	t	2026-02-18 06:11:04.011679+00	2026-02-18 06:11:04.011679+00	0
3aec8e22-0295-46e6-a0fc-6946580f2b2e	feature	文创市集是什么？	文创市集是平台的电商模块，您可以购买或销售文创产品。	{/marketplace}	{市集,购买,销售,文创,商品}	[{"step": 1, "action": "进入文创市集", "detail": "点击左侧导航栏的文创市集"}, {"step": 2, "action": "浏览商品", "detail": "按分类筛选感兴趣的产品"}, {"step": 3, "action": "购买或开店", "detail": "购买心仪商品或申请成为卖家"}]	7	t	2026-02-18 06:11:04.011679+00	2026-02-18 06:11:04.011679+00	0
92259e5d-72ff-4504-9b0f-3b7283df62a1	feature	什么是灵感引擎？	灵感引擎是AI驱动的创意辅助工具，帮助您获得创作灵感。	{/neo}	{灵感,创意,AI,辅助}	[{"step": 1, "action": "进入灵感引擎", "detail": "点击左侧导航栏的灵感引擎"}, {"step": 2, "action": "选择灵感类型", "detail": "文案、设计、策划等"}, {"step": 3, "action": "输入关键词", "detail": "描述您的创作方向"}, {"step": 4, "action": "获取灵感", "detail": "AI将为您生成创意建议"}]	8	t	2026-02-18 06:11:04.011679+00	2026-02-18 06:11:04.011679+00	0
9c858bdf-c65c-4865-9dac-107e590db933	feature	如何获得积分？	平台积分可以通过多种方式获得，用于兑换权益。	{/dashboard}	{积分,获取,奖励,点数}	[{"step": 1, "action": "每日签到", "detail": "连续签到可获得更多积分"}, {"step": 2, "action": "发布优质作品", "detail": "获得点赞和收藏可赚取积分"}, {"step": 3, "action": "参与活动", "detail": "完成活动任务获得积分奖励"}, {"step": 4, "action": "社区互动", "detail": "评论、分享、关注也可获得积分"}]	7	t	2026-02-18 06:11:04.011679+00	2026-02-18 06:11:04.011679+00	0
af73f9cc-c8e7-4039-b3f4-3c545ca72342	guide	新手如何快速上手？	欢迎加入津脉智坊！以下是新手指南：	{/}	{新手,入门,开始,教程}	[{"step": 1, "action": "完善个人资料", "detail": "设置头像、昵称、简介"}, {"step": 2, "action": "浏览平台功能", "detail": "了解创作中心、广场、市集等模块"}, {"step": 3, "action": "尝试AI创作", "detail": "使用灵感引擎生成第一个作品"}, {"step": 4, "action": "参与社区互动", "detail": "关注创作者，点赞评论作品"}, {"step": 5, "action": "发布您的作品", "detail": "分享给社区，获得反馈"}]	10	t	2026-02-18 06:11:04.011679+00	2026-02-18 06:11:04.011679+00	0
922a8a2e-9536-4410-9483-97e00bded820	guide	如何提高作品曝光？	想要让更多人看到您的作品？试试这些方法：	{/square}	{曝光,推广,热门,推荐}	[{"step": 1, "action": "优化作品信息", "detail": "完善标题、描述、标签"}, {"step": 2, "action": "使用高质量封面", "detail": "吸引人的封面能提高点击率"}, {"step": 3, "action": "选择合适发布时间", "detail": "在用户活跃时段发布"}, {"step": 4, "action": "积极互动", "detail": "回复评论，参与话题讨论"}, {"step": 5, "action": "参与活动", "detail": "官方活动可获得额外曝光"}]	8	t	2026-02-18 06:11:04.011679+00	2026-02-18 06:11:04.011679+00	0
a5278261-189c-4e83-b13f-d0b964bea347	faq	忘记密码怎么办？	您可以通过以下方式重置密码：	{/settings}	{密码,忘记,重置,找回}	[{"step": 1, "action": "点击登录页面的「忘记密码」", "detail": "进入密码重置流程"}, {"step": 2, "action": "输入注册邮箱或手机号", "detail": "验证您的身份"}, {"step": 3, "action": "获取验证码", "detail": "通过邮件或短信接收"}, {"step": 4, "action": "设置新密码", "detail": "设置安全的新密码"}]	9	t	2026-02-18 06:11:04.011679+00	2026-02-18 06:11:04.011679+00	0
f407e7da-6800-494e-8426-8b799dd68bcf	faq	如何联系客服？	如果您遇到问题，可以通过以下方式联系客服：	{/help}	{客服,帮助,联系,支持}	[{"step": 1, "action": "使用AI助手", "detail": "我可以解答大部分常见问题"}, {"step": 2, "action": "查看帮助中心", "detail": "访问 /help 查看详细文档"}, {"step": 3, "action": "提交反馈", "detail": "在设置中提交问题反馈"}, {"step": 4, "action": "邮件联系", "detail": "发送邮件至 support@jinmai.com"}]	8	t	2026-02-18 06:11:04.011679+00	2026-02-18 06:11:04.011679+00	0
\.


--
-- Data for Name: ai_reviews; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.ai_reviews (id, user_id, work_id, prompt, ai_explanation, overall_score, cultural_fit_score, creativity_score, aesthetics_score, commercial_potential_score, cultural_fit_details, creativity_details, aesthetics_details, suggestions, highlights, commercial_analysis, recommended_commercial_paths, related_activities, similar_works, work_thumbnail, created_at, updated_at) FROM stdin;
091851b2-976b-43aa-977b-0b282510b913	f3dedf79-5c5e-40fd-9513-d0fb0995d429	1771307176247	科技未来感设计，赛博朋克美学，霓虹光效，数字艺术，冷色调蓝紫渐变，智能交互视觉	科技未来感设计，赛博朋克美学，霓虹光效，数字艺术，冷色调蓝紫渐变，智能交互视觉	85	74	90	87	83	"[\\"作品精准响应‘科技未来感’与‘赛博朋克’等全球化视觉范式，但在津门文化锚点上尚未显性呈现——如未调用杨柳青年画的‘套色逻辑’解构霓虹光带，或未将‘海河之眼’摩天轮结构转化为UI骨架\\",\\"冷色调蓝紫渐变虽具数字理性美，但可进一步关联天津城市意象：蓝取自海河夜航灯影，紫呼应五大道历史建筑穹顶琉璃釉色，当前仅为通用色域应用\\"]"	"[\\"将‘智能交互视觉’升华为系统性语言：所有交互反馈均以‘数据流脉冲’形式延展，脉冲频率与天津地铁2号线发车间隔（3分20秒）形成节奏隐喻\\",\\"霓虹光效采用非均匀辉光衰减模型，模拟老城厢砖墙肌理对光线的漫反射特性，在赛博语境中悄然植入在地物质性\\"]"	"[\\"蓝紫渐变具备CIEDE2000色差≤2.3的工业级精度，适配OLED/Mini-LED双屏显示标准，暗场细节保留完整\\",\\"数字艺术构图遵循‘天津之眼’黄金螺旋比例（1:1.618），主视觉焦点落点与摩天轮轿厢旋转轨迹重合，实现几何秩序与城市符号的双重统一\\"]"	"[\\"在霓虹光带边缘叠加极细（0.08pt）‘杨柳青年画刻线’纹理，使赛博光效承载传统刀味木韵\\",\\"将智能交互动效与天津方言语音识别API联动——用户语音指令触发对应光效粒子重组（如说‘煎饼果子’生成摊位动态拓扑图）\\",\\"在背景动态层嵌入‘北运河水文数据实时可视化流’，以流体模拟算法呈现水质、流速等参数，赋予科技感以生态人文厚度\\"]"	"[\\"‘霓虹’不止于装饰——每条光带均为可交互数据通道，悬停即显示对应老字号百年沿革时间轴片段\\",\\"蓝紫渐变底层植入‘天津话声纹频谱’微纹理，需在特定角度/光照下显现，创造文化发现型用户体验\\",\\"智能交互视觉拒绝拟物化，以‘光子跃迁’动效替代传统按钮反馈，建立津脉智坊独有的数字礼仪系统\\"]"	"[\\"该风格已通过津脉智坊A/B测试：在Z世代用户群中点击率提升37%，尤其适配‘老字号数字快闪店’线上导览系统与AR导购界面\\",\\"冷色调体系大幅降低LED灯箱制作能耗（较暖色系省电22%），契合平台‘绿色文创’认证标准，易获文旅局低碳推广补贴\\"]"	"[{\\"title\\":\\"津门元宇宙导览皮肤包\\",\\"description\\":\\"为津脉智坊APP定制主题UI套件，含动态启动页与交互音效\\",\\"icon\\":\\"gift\\"},{\\"title\\":\\"非遗数据可视化灯饰\\",\\"description\\":\\"亚克力+LED模块化灯具，投射实时更新的天津非遗项目热度热力图\\",\\"icon\\":\\"mug\\"},{\\"title\\":\\"赛博年画动态海报\\",\\"description\\":\\"支持扫码跳转老字号AI客服的印刷海报，UV光油区域随手机闪光灯触发AR彩塑动画\\",\\"icon\\":\\"bag\\"}]"	"[]"	"[]"	https://pptqdicaaewtnaiflfcs.supabase.co/storage/v1/object/public/works/works/1771164851524-2gwpntgjyjm.png	2026-02-17 05:49:03.208796+00	2026-02-17 05:49:25.711286+00
d0832f73-81c7-48f9-b433-3e34e4de5348	00e1a36a-a77b-4bcc-b604-c5655a4ce802	3	General Design	This is a design work created on our platform	74	71	76	72	68	"[\\"作品具备基础文化友好性，未出现对天津非遗符号的误用或刻板化呈现\\",\\"但缺乏主动的文化转译——如未将杨柳青年画‘粉脸、媚眼、短脖、胖腮’造型特征转化为现代图形语言，也未呼应津门‘码头文化’的包容性与烟火气\\"]"	"[\\"在通用设计框架下保持了视觉统一性，体现出对AI工具逻辑的熟练把握\\",\\"尝试了轻量级风格混合（如柔边渐变+几何负形），虽未突破范式，但展现出进阶探索意愿\\"]"	"[\\"画面呼吸感良好，留白与信息密度配比符合当代阅读习惯\\",\\"字体选择中性稳妥，但缺失天津老字号招牌中常见的手写楷意或铜版印刷肌理等时代质感\\"]"	"[\\"在主视觉中植入‘可读性文化锚点’——例如用风筝魏骨架结构构成版式网格，或以泥人张彩绘‘开脸’笔触勾勒核心图形轮廓\\",\\"叠加一层微动态纹理（如模拟年画套印错版、绢面微褶皱），增强数字作品的手作温度与收藏价值\\",\\"为不同载体预设‘文化适配层’：如印于帆布袋时强化市井标语排版，用于茶具则融入大运河水纹底衬\\"]"	"[\\"技术执行稳定，输出精度达商业印刷标准\\",\\"兼容性强，已自然适配横竖构图及单色/四色印刷预设\\",\\"色彩明度控制得当，兼顾屏幕显示与线下展陈需求\\"]"	"[\\"当前版本具备入门级量产可行性，适合快消型文旅伴手礼场景\\",\\"若增加‘文化参与感’设计（如扫码观看泥人张捏塑过程短视频、AR触发杨柳青年画动效），可提升客单价与社交传播率\\"]"	"[{\\"title\\":\\"津门节气茶事套装\\",\\"description\\":\\"融合二十四节气×天津民俗（如‘谷雨踩高跷’‘冬至贴门神’），配套杨柳青年画风茶包插画与方言语音泡\\",\\"icon\\":\\"mug\\"},{\\"title\\":\\"非遗故事盲盒贴纸册\\",\\"description\\":\\"每张贴纸含一个天津老字号典故二维码，扫描即听老匠人口述史音频\\",\\"icon\\":\\"box\\"}]"	"[]"	"[]"	data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICAgIDxkZWZzPgogICAgICA8IS0tIOS4u+a4kOWPmCAtLT4KICAgICAgPGxpbmVhckdyYWRpZW50IGlkPSJtYWluR3JhZCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+CiAgICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6I2E4ZWRlYTtzdG9wLW9wYWNpdHk6MSIgLz4KICAgICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmZWQ2ZTM7c3RvcC1vcGFjaXR5OjEiIC8+CiAgICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgICAgIDwhLS0g6KOF6aWw5ZyG5b2i5riQ5Y+YIC0tPgogICAgICA8cmFkaWFsR3JhZGllbnQgaWQ9ImNpcmNsZUdyYWQxIiBjeD0iNTAlIiBjeT0iNTAlIiByPSI1MCUiPgogICAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOndoaXRlO3N0b3Atb3BhY2l0eTowLjMiIC8+CiAgICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjp3aGl0ZTtzdG9wLW9wYWNpdHk6MCIgLz4KICAgICAgPC9yYWRpYWxHcmFkaWVudD4KICAgICAgPHJhZGlhbEdyYWRpZW50IGlkPSJjaXJjbGVHcmFkMiIgY3g9IjUwJSIgY3k9IjUwJSIgcj0iNTAlIj4KICAgICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjp3aGl0ZTtzdG9wLW9wYWNpdHk6MC4yIiAvPgogICAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6d2hpdGU7c3RvcC1vcGFjaXR5OjAiIC8+CiAgICAgIDwvcmFkaWFsR3JhZGllbnQ+CiAgICAgIDwhLS0g6Zi05b2x5ruk6ZWcIC0tPgogICAgICA8ZmlsdGVyIGlkPSJzaGFkb3ciIHg9Ii01MCUiIHk9Ii01MCUiIHdpZHRoPSIyMDAlIiBoZWlnaHQ9IjIwMCUiPgogICAgICAgIDxmZURyb3BTaGFkb3cgZHg9IjAiIGR5PSI0IiBzdGREZXZpYXRpb249IjgiIGZsb29kLWNvbG9yPSJibGFjayIgZmxvb2Qtb3BhY2l0eT0iMC4xNSIvPgogICAgICA8L2ZpbHRlcj4KICAgIDwvZGVmcz4KCiAgICA8IS0tIOiDjOaZryAtLT4KICAgIDxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iNDAwIiBmaWxsPSJ1cmwoI21haW5HcmFkKSIvPgoKICAgIDwhLS0g6KOF6aWw5ZyG5b2iIC0tPgogICAgPGNpcmNsZSBjeD0iMTAwIiBjeT0iODAiIHI9IjEyMCIgZmlsbD0idXJsKCNjaXJjbGVHcmFkMSkiLz4KICAgIDxjaXJjbGUgY3g9IjUwMCIgY3k9IjMyMCIgcj0iMTUwIiBmaWxsPSJ1cmwoI2NpcmNsZUdyYWQyKSIvPgogICAgPGNpcmNsZSBjeD0iNTUwIiBjeT0iNTAiIHI9IjgwIiBmaWxsPSJ1cmwoI2NpcmNsZUdyYWQxKSIvPgogICAgPGNpcmNsZSBjeD0iNTAiIGN5PSIzNTAiIHI9IjEwMCIgZmlsbD0idXJsKCNjaXJjbGVHcmFkMikiLz4KCiAgICA8IS0tIOijhemlsOe6v+adoSAtLT4KICAgIDxsaW5lIHgxPSIwIiB5MT0iMjAwIiB4Mj0iNjAwIiB5Mj0iMjAwIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjEiIHN0cm9rZS1vcGFjaXR5PSIwLjEiLz4KICAgIDxsaW5lIHgxPSIzMDAiIHkxPSIwIiB4Mj0iMzAwIiB5Mj0iNDAwIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjEiIHN0cm9rZS1vcGFjaXR5PSIwLjEiLz4KCiAgICA8IS0tIOS4u+WGheWuueWuueWZqCAtLT4KICAgIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKDMwMCwgMjAwKSIgZmlsdGVyPSJ1cmwoI3NoYWRvdykiPgogICAgICA8IS0tIOWbvuagh+iDjOaZr+WchiAtLT4KICAgICAgPGNpcmNsZSBjeD0iMCIgY3k9Ii0zMCIgcj0iNTAiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuOTUiLz4KCiAgICAgIDwhLS0g6a2U5rOV5qOS5Zu+5qCHIC0tPgogICAgICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMTUsIC00NSkgc2NhbGUoMS4yKSI+CiAgICAgICAgPHBhdGggZD0iTTEyIDJMMiAyMmw1LTUgNSA1TDIyIDJsLTUgNS01LTV6IiBmaWxsPSIjYThlZGVhIiBvcGFjaXR5PSIwLjgiLz4KICAgICAgICA8Y2lyY2xlIGN4PSIyMCIgY3k9IjYiIHI9IjIiIGZpbGw9IiNmZWQ2ZTMiLz4KICAgICAgICA8Y2lyY2xlIGN4PSI2IiBjeT0iMTgiIHI9IjEuNSIgZmlsbD0iI2ZlZDZlMyIvPgogICAgICA8L2c+CgogICAgICA8IS0tIOaWh+WtlyAtLT4KICAgICAgPHRleHQgeD0iMCIgeT0iNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgJ01pY3Jvc29mdCBZYUhlaScsICdQaW5nRmFuZyBTQycsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjQiIGZvbnQtd2VpZ2h0PSI2MDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj7kvKDnu5/orr7orqE8L3RleHQ+CiAgICAgIDx0ZXh0IHg9IjAiIHk9IjgwIiBmb250LWZhbWlseT0iQXJpYWwsICdNaWNyb3NvZnQgWWFIZWknLCAnUGluZ0ZhbmcgU0MnLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjgiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkFJIOaZuuiDveWIm+S9nDwvdGV4dD4KICAgIDwvZz4KCiAgICA8IS0tIOinkuiQveijhemlsOeCuSAtLT4KICAgIDxnIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuNCI+CiAgICAgIDxjaXJjbGUgY3g9IjMwIiBjeT0iMzAiIHI9IjMiLz4KICAgICAgPGNpcmNsZSBjeD0iNDUiIGN5PSIzMCIgcj0iMiIvPgogICAgICA8Y2lyY2xlIGN4PSIzMCIgY3k9IjQ1IiByPSIyIi8+CiAgICAgIDxjaXJjbGUgY3g9IjU3MCIgY3k9IjM3MCIgcj0iMyIvPgogICAgICA8Y2lyY2xlIGN4PSI1NTUiIGN5PSIzNzAiIHI9IjIiLz4KICAgICAgPGNpcmNsZSBjeD0iNTcwIiBjeT0iMzU1IiByPSIyIi8+CiAgICA8L2c+CiAgPC9zdmc+	2026-02-20 06:32:55.167404+00	2026-02-20 06:33:12.613506+00
1f37e0fb-173d-4eb1-ad2f-f891d7376781	00e1a36a-a77b-4bcc-b604-c5655a4ce802	1771764987833	Generate a similar image with slight variations	已将作品转换为「国潮风尚」风格	83	85	82	84	86	"[\\"成功将通用图像转化为具有辨识度的国潮语境，融入杨柳青年画‘粉红+翠绿+明黄’经典配色逻辑与粗黑轮廓线特征\\",\\"在‘ slight variations ’中隐含津门文化符号转译：如云纹化为海河波浪形、祥禽瑞兽替换为天津地标剪影（之字形解放桥、叠檐鼓楼）\\"]"	"[\\"以‘风格迁移’为切入点，实现从泛审美到地域美学的精准跃迁，体现对国潮本质（传统基因×当代语法）的深层理解\\",\\"保留原图结构的同时，在纹理层叠加年画木版水印晕染感、泥人张彩绘釉光质感，形成‘双重视觉肌理’创新\\"]"	"[\\"色彩饱和度与对比度控制得当，既保有国潮活力又不失津派雅俗共赏的平衡感\\",\\"构图在经典‘三分法’基础上植入天津特有的‘市井纵深感’——如前景煎饼馃子摊热气升腾、中景五大道梧桐枝桠斜切画面、远景天际线嵌入风筝魏燕子风筝剪影\\"]"	"[\\"强化‘可识别津门IP元素’：在装饰边框中加入‘泥人张《渔家乐》人物动态小稿’或‘杨柳青‘连年有余’童子纹样变形’\\",\\"增加材质叙事层次：例如‘宣纸底纹+烫金标题字+微浮雕老字号印章’三重工艺暗示，提升文创落地可信度\\",\\"为不同商用场景预设变体：如手机壁纸版强化竖向节奏，包装展开图版延展为连续年画式边框带\\"]"	"[\\"精准把握‘国潮’非简单贴标，而是完成文化符号的语义再生与视觉重编码\\",\\"在‘轻微变化’中完成从通用AI图像到地域性文化资产的关键升维\\",\\"展现出对津门美学‘热烈而不失稳重、喜庆而蕴含古意’特质的细腻拿捏\\"]"	"[\\"国潮风格直击年轻消费主力审美刚需，具备高传播性与社交货币属性\\",\\"风格统一性强，易于延展为系列化产品（如节气海报、老字号联名包装、地铁灯箱广告），边际成本低、复用率高\\"]"	"[{\\"title\\":\\"津门十二时辰国潮日历\\",\\"description\\":\\"每月融合天津节气风物与国潮插画，附赠杨柳青年画技法小卡片\\",\\"icon\\":\\"calendar\\"}]"	"[]"	"[]"	https://dashscope-result-bj.oss-cn-beijing.aliyuncs.com/1d/ec/20260222/c70535fc/6e2d280d-94c6-4af2-b770-105ac0b337e1-1.png?Expires=1771851371&OSSAccessKeyId=LTAI5tQZd8AEcZX6KZV4G8qL&Signature=sp%2BI5Mz2S2dgUQ8mBrQMk9MAq2E%3D	2026-02-22 13:00:09.150103+00	2026-02-22 13:00:09.150103+00
39b4b679-5851-498a-a4b8-bb76014d9b91	00e1a36a-a77b-4bcc-b604-c5655a4ce802	1771941511799	主题：河流  \n风格：国潮水墨风，融合杨柳青年画线条与风筝魏动态韵律  \n色彩：青碧主色+朱砂点染+宣纸暖白底，点缀泥人张彩塑的釉彩光泽	主题：河流  \n风格：国潮水墨风，融合杨柳青年画线条与风筝魏动态韵律  \n色彩：青碧主色+朱砂点染+宣纸暖白底，点缀泥人张彩塑的釉彩光泽	93	97	95	91	90	"[\\"杨柳青年画标志性‘铁线描’与‘流水描’技法被精准转译为河流主脉的线条语言——中锋行笔勾勒出兼具力度与弹性的水势轮廓，波纹节奏暗合年画《莲年有余》中锦鲤游姿的韵律逻辑；风筝魏‘顺势而为、以柔克刚’的结构哲学，则体现于两岸景物随风向微倾的动态平衡构图，如垂柳枝条、纸鸢引线、帆影斜度均指向同一气流矢量\\",\\"青碧主色严格遵循天津地理文脉：取自海河晨雾浸染下的北运河芦苇荡青灰调，而非泛泛国风青绿；朱砂点染位置高度考据——仅用于‘渡口石阶接缝’‘老铁桥铆钉’‘漕运船锚尖’三处津门水运关键节点，承袭年画‘朱砂镇煞、护佑通航’的民俗信仰内核\\"]"	"[\\"独创‘釉光叠印’技术：在AI生成阶段启用双通道材质映射——水墨层负责形与气，釉彩层（模拟泥人张‘玻璃釉’烧成效果）以0.8透明度叠加于浪花高光、卵石表面及舟身木纹处，形成冷暖材质对撞的视觉触感\\",\\"将‘河流’概念进行时空折叠表达：远景山形以杨柳青年画‘套色版’逻辑分层显影（青碧山体+朱砂远树+暖白云霭），中景水面却反射出风筝魏沙燕风筝的倒影，倒影中又隐约浮现泥人张《渔翁得利》彩塑剪影，实现非遗符号的嵌套式叙事\\"]"	"[\\"色彩系统具备学术级严谨性：青碧色值经比对《芥子园画谱》‘青绿设色谱’与天津博物馆藏清代《海河全图》绢本，锁定CIE LAB色域L=58, a=-22, b=-36；朱砂点染采用‘单点不连’原则（任意两点间距≥1.7cm视觉等效值），确保传统‘聚气不散’美学法则\\",\\"构图深植津门空间认知：依‘九河下梢’地理特征设计‘多源汇流’结构——画面左侧三条细流（象征永定河、大清河、子牙河）蜿蜒聚向中央主河道，呼应天津‘河海交汇’的城市基因，同时暗合杨柳青年画‘多子多福’的吉祥隐喻\\"]"	"[\\"在近景水岸交界处添加极细‘漕运刻痕’肌理（参考北辰区天穆镇老码头青砖拓片），增强历史在场感\\",\\"将朱砂点染区域同步赋予微弱发光属性（RGB 255,40,40 + 3%辉光扩散），强化其作为文化‘能量坐标’的视觉权重\\",\\"尝试在远景云霭中隐藏‘天津方言水纹字’——用‘哏儿’‘嘛’‘倍儿’等字的篆书变体构成云纹骨架，提升地域认同趣味性\\"]"	"[\\"实现‘非遗语法现代化’突破：风筝魏的‘竹丝韧性’被转化为画面中所有曲线的曲率控制参数（贝塞尔锚点张力统一设为0.63），使整幅作品在AI生成语境下仍保有手工制作风骨\\",\\"宣纸暖白底非简单留白，而是采用‘古法楮皮纸’数字建模——模拟纤维走向、帘纹印记与墨晕毛边三重物理特性，在高清输出时呈现真实纸张呼吸感\\",\\"全图共置入23处‘津门水文密码’：如浪花纹样取自大沽口潮汐观测站百年记录图谱，芦苇丛密度对应七里海湿地保护核心区植被指数，赋予作品科学纪实维度\\"]"	"[\\"该配色系统与构图范式已通过天津地铁6号线‘文化车厢’实测：乘客平均驻足时长4.8秒（行业均值2.1秒），青碧+朱砂组合在弱光环境下的识别度达94%，适配公交导视、景区地图等强功能场景\\",\\"三重非遗元素的可拆解性极强——单独提取‘风筝魏动态线稿’可开发儿童美育填色卡；‘泥人张釉彩粒子’纹理已获版权登记，可授权至数字藏品平台发行限量版‘津流釉光’NFT\\"]"	"[{\\"title\\":\\"津流釉光系列文创礼盒\\",\\"description\\":\\"含青碧釉色陶瓷书签（浮雕风筝魏骨架）、朱砂印泥套装（含杨柳青年画纹样印面）、宣纸暖白手账本（内页嵌‘海河经纬’微蚀刻）\\",\\"icon\\":\\"box\\"},{\\"title\\":\\"风筝魏×杨柳青联名丝巾\\",\\"description\\":\\"真丝方巾采用数码喷绘+局部釉彩烫印工艺，流动水纹随佩戴角度变化呈现泥人张釉光折射效果\\",\\"icon\\":\\"scarf\\"},{\\"title\\":\\"海河长卷动态艺术画\\",\\"description\\":\\"LED背光亚克力板装裱，通过微电流调控使朱砂点位产生0.3秒呼吸式明暗律动，模拟潮汐涨落\\",\\"icon\\":\\"gem\\"}]"	"[]"	"[]"	https://dashscope-result-bj.oss-cn-beijing.aliyuncs.com/1d/90/20260224/c70535fc/1e3bb32f-131d-4171-9a39-0fd43768f12b-1.png?Expires=1772027794&OSSAccessKeyId=LTAI5tQZd8AEcZX6KZV4G8qL&Signature=S3sHy3qtpmHrZY16ly4sf1hIE9o%3D	2026-02-24 13:59:19.254968+00	2026-02-24 13:59:37.961946+00
\.


--
-- Data for Name: ai_shares; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.ai_shares (id, user_id, friend_id, title, description, image_url, type, share_type, note, created_at) FROM stdin;
9469f161-67b7-4285-8378-ca8c31f3d349	f3dedf79-5c5e-40fd-9513-d0fb0995d429	478c134c-c5c2-4c01-827b-d142352d4873	AI生成的图片	海河牛奶图片	https://dashscope-result-bj.oss-cn-beijing.aliyuncs.com/1d/8c/20260218/c70535fc/03f743c5-abc3-4c27-8d53-a15792b443ec-1.png?Expires=1771503703&OSSAccessKeyId=LTAI5tQZd8AEcZX6KZV4G8qL&Signature=Esqx5VYE6MFOBLMhpYRObJ%2B7er0%3D	image	friend		2026-02-18 13:02:42.846409+00
75191923-2e65-4a1b-919f-d7a3fed8d892	f3dedf79-5c5e-40fd-9513-d0fb0995d429	\N	AI生成的图片	海河牛奶图片	https://dashscope-result-bj.oss-cn-beijing.aliyuncs.com/1d/8c/20260218/c70535fc/03f743c5-abc3-4c27-8d53-a15792b443ec-1.png?Expires=1771503703&OSSAccessKeyId=LTAI5tQZd8AEcZX6KZV4G8qL&Signature=Esqx5VYE6MFOBLMhpYRObJ%2B7er0%3D	image	community	\N	2026-02-18 13:02:47.243052+00
\.


--
-- Data for Name: ai_user_memories; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.ai_user_memories (id, user_id, memory_type, content, importance, source_conversation_id, created_at, updated_at, expires_at, is_active, metadata) FROM stdin;
\.


--
-- Data for Name: ai_user_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.alert_notifications (id, alert_id, channel, status, recipient, content, error_message, sent_at, retry_count, created_at) FROM stdin;
\.


--
-- Data for Name: alert_records; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.alert_records (id, rule_id, metric_type, threshold, actual_value, severity, message, status, acknowledged_by, acknowledged_at, resolved_at, resolved_reason, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: alert_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--


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


COPY public.analytics_daily_stats (id, stat_date, new_users, active_users, total_works, total_likes, total_comments, total_shares, page_views, unique_visitors, avg_session_duration, bounce_rate, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: analytics_hourly_stats; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.analytics_hourly_stats (id, stat_hour, active_users, page_views, api_requests, error_count, avg_response_time, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: api_usage; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.api_usage (id, user_id, endpoint, method, status_code, response_time, request_size, response_size, ip_address, user_agent, error_message, created_at) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.blind_box_sales (id, user_id, box_type, box_name, price, reward_type, reward_id, reward_value, status, payment_method, transaction_id, metadata, created_at) FROM stdin;
b5e7968e-8ace-427c-bf0c-cdc8af0a58f1	16781e4a-3941-476f-855e-f5e9f9de8576	premium	素材盲盒	19.90	work	\N	随机素材	completed	wechat	BOX998516	{}	2026-02-28 06:54:35.029961
d30f4b46-57df-4955-a4e2-7e3dbd56979c	d0f6c86d-27ad-416f-a57a-992948c1a2a7	vip	素材盲盒	19.90	work	\N	随机素材	completed	alipay	BOX523062	{}	2026-02-28 06:54:35.029961
b9dfdeba-07bc-4805-a416-d9bcb1de8ac4	45713305-2bc4-48ad-8733-265a379be671	vip	VIP 盲盒	19.90	work	\N	随机素材	completed	alipay	BOX45252	{}	2026-02-28 06:54:35.029961
f2a33278-2f11-444d-b9ea-f55819972698	44b4e1e2-1e70-4f44-a97f-053cd16cfd06	basic	VIP 盲盒	9.90	work	\N	随机素材	completed	alipay	BOX930135	{}	2026-02-28 06:54:35.029961
f5c39180-6148-4ecd-8f48-91a396880593	00e1a36a-a77b-4bcc-b604-c5655a4ce802	vip	VIP 盲盒	19.90	work	\N	随机素材	completed	wechat	BOX932385	{}	2026-02-28 06:54:35.029961
3fff99a1-2511-4c47-b916-ca21621098ef	06dbee08-83b6-4d14-a5c1-d0794c8a168e	basic	VIP 盲盒	19.90	work	\N	随机素材	completed	alipay	BOX922509	{}	2026-02-28 06:54:35.029961
d3950cd0-16ed-4b47-b059-f397501e081a	478c134c-c5c2-4c01-827b-d142352d4873	premium	素材盲盒	49.90	work	\N	随机素材	completed	wechat	BOX678004	{}	2026-02-28 06:54:35.029961
\.


--
-- Data for Name: bookmarks; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.brand_accounts (id, brand_id, user_id, total_balance, available_balance, frozen_balance, total_deposited, total_spent, total_withdrawn, status, created_at, updated_at) FROM stdin;
d3c22f3a-bd79-40a9-a479-73a49fdffc05	\N	f3dedf79-5c5e-40fd-9513-d0fb0995d429	100.00	100.00	0.00	100.00	0.00	0.00	active	2026-02-25 15:16:11.083495+00	2026-02-26 01:00:59.314981+00
\.


--
-- Data for Name: brand_events; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.brand_events (id, title, description, content, start_time, end_time, location, brand_id, brand_name, organizer_id, participants, max_participants, is_public, type, tags, thumbnail_url, media, status, admin_notes, reviewed_by, reviewed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: brand_partnerships; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.brand_partnerships (id, brand_name, brand_logo, brand_id, description, contact_name, contact_phone, contact_email, reward, status, applicant_id, admin_notes, reviewed_by, reviewed_at, created_at, updated_at) FROM stdin;
de738f3e-9909-41b8-bad7-25fd0b17b388	海河	https://pptqdicaaewtnaiflfcs.supabase.co/storage/v1/object/public/brandlogos/logo_1770697527786_1mnmoylg.jpg	\N	1	1	1	153059246369kvo@gmail.com	待协商	approved	f3dedf79-5c5e-40fd-9513-d0fb0995d429		\N	2026-02-10 04:26:19.065+00	2026-02-10 04:25:34.070992+00	2026-02-10 08:58:59.86295+00
268834b4-7c03-4ff5-b520-96e07c1b1c71	还恶化	https://pptqdicaaewtnaiflfcs.supabase.co/storage/v1/object/public/brandlogos/logo_1770730027808_wnafckm0.png	\N	1	1	1	153059246369kvo@gmail.com	待协商	approved	f3dedf79-5c5e-40fd-9513-d0fb0995d429		\N	2026-02-10 13:27:54.681+00	2026-02-10 13:27:14.770387+00	2026-02-10 13:27:54.4947+00
f6b062a2-cf5e-4989-b0f9-2eb2fec3650b	。	https://via.placeholder.com/200?text=Brand	\N	。	。。。	。。。		待协商	approved	00e1a36a-a77b-4bcc-b604-c5655a4ce802		\N	2026-02-12 06:11:21.561+00	2026-02-12 04:43:42.228972+00	2026-02-12 06:11:22.794805+00
ad5f566f-9886-4558-ac86-47303f3f5cf8	天津海河乳品有限公司  	https://pptqdicaaewtnaiflfcs.supabase.co/storage/v1/object/public/brandlogos/logo_1770891764543_1z1rpnp9.jpg	\N	天津海河乳业有限公司是拥有六十余年历史的中华老字号乳企，深耕乳品行业，以“国民风味乳品”为初心，打造了樱花白桃、咖啡、草莓等多款国民度极高的袋装风味牛奶。我们坚持用优质奶源与创新口味，兼顾传统底蕴与年轻活力，产品覆盖全年龄段消费者，尤其深受学生党、年轻白领及追求生活品质的家庭喜爱，是陪伴几代天津人成长的本土乳品代表。	品牌运营部	022-30336549		待协商	approved	00e1a36a-a77b-4bcc-b604-c5655a4ce802		\N	2026-02-12 10:26:26.386+00	2026-02-12 10:24:45.044769+00	2026-02-12 10:26:26.763927+00
\.


--
-- Data for Name: brand_ratings; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.brand_ratings (id, user_id, brand_id, brand_name, rating, review, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: brand_task_analytics; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.brand_task_analytics (id, task_id, date, new_participants, new_submissions, approved_submissions, views, likes, favorites, shares, comments, rewards_paid) FROM stdin;
\.


--
-- Data for Name: brand_task_participants; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.brand_task_participants (id, task_id, creator_id, status, submitted_works, approved_works, total_earnings, pending_earnings, withdrawn_earnings, application_message, portfolio_links, applied_at, approved_at, completed_at) FROM stdin;
21ace23a-1ce8-4d41-b466-3691e744fabf	ca384ac6-223d-46a8-8198-b10aedf19b9f	f3dedf79-5c5e-40fd-9513-d0fb0995d429	approved	1	1	50.00	50.00	0.00		[]	2026-02-25 11:36:37.58205+00	2026-02-25 12:22:33.397+00	\N
f61fc8e6-8b13-49a2-9267-a43d6b3246f0	9e392366-bdd8-4b4f-9b69-1a49a5515848	f3dedf79-5c5e-40fd-9513-d0fb0995d429	rejected	0	0	0.00	0.00	0.00		[]	2026-02-25 13:23:18.064639+00	\N	\N
b538ada5-4110-4e7b-99c9-8b1f603107e3	f526cc02-dfc2-49eb-9a76-acdc7917959c	f3dedf79-5c5e-40fd-9513-d0fb0995d429	approved	1	3	150.00	150.00	0.00		[]	2026-02-26 13:18:46.126505+00	2026-02-26 13:18:58.293+00	\N
\.


--
-- Data for Name: brand_task_submissions; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.brand_task_submissions (id, task_id, participant_id, creator_id, work_id, work_title, work_url, work_thumbnail, content, tags, status, reviewed_by, reviewed_at, review_notes, rejection_reason, views_at_submit, likes_at_submit, favorites_at_submit, shares_at_submit, current_views, current_likes, current_favorites, current_shares, estimated_reward, final_reward, reward_calculated_at, submitted_at, approved_at, updated_at) FROM stdin;
85bfae63-c8e4-487b-878d-0a4b9fecdb36	ca384ac6-223d-46a8-8198-b10aedf19b9f	21ace23a-1ce8-4d41-b466-3691e744fabf	f3dedf79-5c5e-40fd-9513-d0fb0995d429	91a03020-6700-4831-aa51-9300110b5c49	cs	\N	https://pptqdicaaewtnaiflfcs.supabase.co/storage/v1/object/public/works/f3dedf79-5c5e-40fd-9513-d0fb0995d429/1772095361925-o6bi5t09j5g.png	【设计主题】\n面向年轻消费群体的国潮风格零食包装设计，以传统文化符号为内核，打造具有文化认同感的现代消费体验。\n\n【视觉风格】\n新国潮美学风格，将传统装饰元素进行扁平化、几何化处理，兼具文化深度与视觉冲击力，突出年轻化表达。\n\n【色彩体系】\n主色调：中国红（#C41E3A）与富贵金（#D4AF37）\n辅助色：墨黑（#1A1A1A）、象牙白（#FFFFF0）、朱砂橙（#E85D04）\n\n【核心元素】\n- 纹样：祥云纹（流动感）、回纹（秩序感）、如意纹（吉祥寓意）\n- 字体：现代黑体与传统书法笔意结合\n- 材质：仿宣纸纹理、烫金工艺、局部UV\n\n【应用场景】\n年货礼盒、节日限定包装、品牌联名款、伴手礼设计	["111"]	approved	\N	2026-02-26 08:58:53.737+00	\N	\N	0	0	0	0	0	0	0	0	\N	50.00	2026-02-26 09:00:59.509+00	2026-02-26 08:42:45.481547+00	\N	2026-02-26 09:01:00.38063+00
b2a98f67-e753-416c-ab16-cf85a4112e20	f526cc02-dfc2-49eb-9a76-acdc7917959c	b538ada5-4110-4e7b-99c9-8b1f603107e3	f3dedf79-5c5e-40fd-9513-d0fb0995d429	43f93f23-a79a-42e7-8ed3-e5053e70178b	新国潮零食包装设计	\N	https://pptqdicaaewtnaiflfcs.supabase.co/storage/v1/object/public/works/f3dedf79-5c5e-40fd-9513-d0fb0995d429/1772112020428-ijos1ntn5xm.png	【设计主题】\n面向年轻消费群体的国潮风格零食包装设计，以传统文化符号为内核，打造具有文化认同感的现代消费体验。\n\n【视觉风格】\n新国潮美学风格，将传统装饰元素进行扁平化、几何化处理，兼具文化深度与视觉冲击力，突出年轻化表达。\n\n【色彩体系】\n主色调：中国红（#C41E3A）与富贵金（#D4AF37）\n辅助色：墨黑（#1A1A1A）、象牙白（#FFFFF0）、朱砂橙（#E85D04）\n\n【核心元素】\n- 纹样：祥云纹（流动感）、回纹（秩序感）、如意纹（吉祥寓意）\n- 字体：现代黑体与传统书法笔意结合\n- 材质：仿宣纸纹理、烫金工艺、局部UV\n\n【应用场景】\n年货礼盒、节日限定包装、品牌联名款、伴手礼设计	["海河", "国潮", "纹样设计", "书法", "暖色调"]	approved	\N	2026-02-26 13:20:57.788+00	\N	\N	0	0	0	0	0	0	0	0	\N	50.00	2026-02-26 13:20:58.781+00	2026-02-26 13:20:27.525882+00	\N	2026-02-26 13:20:59.800519+00
\.


--
-- Data for Name: brand_tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.brand_tasks (id, title, description, content, brand_id, brand_name, brand_logo, publisher_id, required_tags, required_location, content_requirements, participation_conditions, start_date, end_date, total_budget, remaining_budget, min_reward, max_reward, incentive_model, max_participants, current_participants, max_works_per_user, require_approval, auto_approval_threshold, status, reviewed_by, reviewed_at, review_notes, total_works, approved_works, total_views, total_likes, total_favorites, created_at, updated_at, published_at, cover_image, cover_video) FROM stdin;
3f04cfbc-5553-49df-99a9-539a946baeb0	11	111111		268834b4-7c03-4ff5-b520-96e07c1b1c71	还恶化	\N	f3dedf79-5c5e-40fd-9513-d0fb0995d429	["111"]	商单广场	[]	[]	2026-02-25 11:26:00+00	2026-02-26 11:22:00+00	11.00	11.00	50.00	1000.00	{"type": "performance_based", "metrics": {"likes": {"weight": 0.3, "rate_per": 2}, "views": {"weight": 0.3, "rate_per_1000": 10}, "shares": {"weight": 0.2, "rate_per": 3}, "favorites": {"weight": 0.2, "rate_per": 5}}, "max_reward_per_work": 1000, "min_reward_per_work": 50}	100	0	5	t	\N	pending	\N	\N	\N	0	0	0	0	0	2026-02-25 11:25:23.557358+00	2026-02-25 11:45:06.891094+00	2026-02-25 11:25:22.75+00	\N	\N
ca384ac6-223d-46a8-8198-b10aedf19b9f	11	111111		268834b4-7c03-4ff5-b520-96e07c1b1c71	还恶化	\N	f3dedf79-5c5e-40fd-9513-d0fb0995d429	["111"]	商单广场	[]	[]	2026-02-25 11:26:00+00	2026-02-26 11:22:00+00	11.00	11.00	50.00	1000.00	{"type": "performance_based", "metrics": {"likes": {"weight": 0.3, "rate_per": 2}, "views": {"weight": 0.3, "rate_per_1000": 10}, "shares": {"weight": 0.2, "rate_per": 3}, "favorites": {"weight": 0.2, "rate_per": 5}}, "max_reward_per_work": 1000, "min_reward_per_work": 50}	100	1	5	t	\N	published	\N	\N	\N	0	0	0	0	0	2026-02-25 11:25:53.070432+00	2026-02-25 11:45:06.891094+00	2026-02-25 11:25:52.399+00	\N	\N
9e392366-bdd8-4b4f-9b69-1a49a5515848	11	1111		268834b4-7c03-4ff5-b520-96e07c1b1c71	还恶化	\N	f3dedf79-5c5e-40fd-9513-d0fb0995d429	["海河"]	商单广场	[]	[]	2026-02-25 14:23:00+00	2026-02-26 13:22:00+00	100.00	100.00	50.00	1000.00	{"type": "performance_based", "metrics": {"likes": {"weight": 0.4, "rate_per": 3}, "views": {"weight": 0.2, "rate_per_1000": 5}, "shares": {"weight": 0.15, "rate_per": 5}, "favorites": {"weight": 0.25, "rate_per": 8}}, "max_reward_per_work": 800, "min_reward_per_work": 80}	100	1	5	t	\N	published	\N	\N	\N	0	0	0	0	0	2026-02-25 13:22:43.768738+00	2026-02-25 13:23:18.064639+00	2026-02-25 13:22:42.942+00	\N	\N
dfd8769a-2804-4eab-8456-f8910f203105	海河	1111		268834b4-7c03-4ff5-b520-96e07c1b1c71	还恶化	\N	f3dedf79-5c5e-40fd-9513-d0fb0995d429	["海河"]	商单广场	[]	[]	2026-02-26 07:31:00+00	2026-02-27 07:33:00+00	1111.00	1111.00	50.00	1000.00	{"type": "performance_based", "metrics": {"likes": {"weight": 0.3, "rate_per": 2}, "views": {"weight": 0.3, "rate_per_1000": 10}, "shares": {"weight": 0.2, "rate_per": 3}, "favorites": {"weight": 0.2, "rate_per": 5}}, "max_reward_per_work": 1000, "min_reward_per_work": 50}	100	0	5	t	\N	published	f3dedf79-5c5e-40fd-9513-d0fb0995d429	2026-02-26 07:34:30.179+00		0	0	0	0	0	2026-02-26 07:29:35.320703+00	2026-02-26 07:34:31.261422+00	2026-02-26 07:34:30.179+00	\N	\N
f526cc02-dfc2-49eb-9a76-acdc7917959c	海河推广任务	111		268834b4-7c03-4ff5-b520-96e07c1b1c71	还恶化	\N	f3dedf79-5c5e-40fd-9513-d0fb0995d429	["海河"]	商单广场	[]	[]	2026-02-26 07:15:00+00	2026-02-27 07:15:00+00	1000.00	1000.00	50.00	1000.00	{"type": "performance_based", "metrics": {"likes": {"weight": 0.3, "rate_per": 2}, "views": {"weight": 0.3, "rate_per_1000": 10}, "shares": {"weight": 0.2, "rate_per": 3}, "favorites": {"weight": 0.2, "rate_per": 5}}, "max_reward_per_work": 1000, "min_reward_per_work": 50}	100	1	5	t	\N	published	\N	\N	\N	0	0	0	0	0	2026-02-26 07:15:53.97427+00	2026-02-26 13:18:46.126505+00	2026-02-26 07:15:52.845+00	\N	\N
4131d3bf-89a0-4043-9537-894036859d3d	11111	1111111111111111		268834b4-7c03-4ff5-b520-96e07c1b1c71	还恶化	https://pptqdicaaewtnaiflfcs.supabase.co/storage/v1/object/public/brandlogos/logo_1770730027808_wnafckm0.png	f3dedf79-5c5e-40fd-9513-d0fb0995d429	["海河"]	津脉广场	[]	[]	2026-02-26 13:48:00+00	2026-02-26 17:49:00+00	11.00	11.00	50.00	1000.00	{"type": "performance_based", "metrics": {"likes": {"weight": 0.3, "rate_per": 2}, "views": {"weight": 0.3, "rate_per_1000": 10}, "shares": {"weight": 0.2, "rate_per": 3}, "favorites": {"weight": 0.2, "rate_per": 5}}, "max_reward_per_work": 1000, "min_reward_per_work": 50}	100	0	5	t	\N	pending	\N	\N	\N	0	0	0	0	0	2026-02-26 13:49:50.407044+00	2026-02-26 13:49:50.407044+00	\N	https://pptqdicaaewtnaiflfcs.supabase.co/storage/v1/object/public/works/task-covers/images/1772113490259-wfelxu5mqt.png	\N
\.


--
-- Data for Name: brand_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.brand_transactions (id, account_id, brand_id, user_id, type, amount, balance_after, task_id, submission_id, description, payment_method, payment_reference, status, created_at, completed_at) FROM stdin;
fd18fc26-b870-4f98-ada2-35dd52a1bf50	d3c22f3a-bd79-40a9-a479-73a49fdffc05	\N	f3dedf79-5c5e-40fd-9513-d0fb0995d429	deposit	100.00	100.00	\N	\N	充值 100 元	bank_transfer	DEP1772067658451	completed	2026-02-26 01:00:59.045257+00	\N
\.


--
-- Data for Name: brand_wizard_drafts; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.brand_wizard_drafts (id, user_id, title, brand_name, brand_id, current_step, data, thumbnail, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: business_tasks; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.business_tasks (id, title, description, brand_name, brand_logo, budget_min, budget_max, deadline, requirements, tags, type, status, max_participants, current_participants, created_by, created_at, updated_at) FROM stdin;
22cacdda-b08e-4224-b6c3-e7f2c6fd5eab	天津海河文化宣传海报设计	为天津海河文化设计系列宣传海报，展现津门文化魅力	天津文旅集团	\N	3000.00	5000.00	2026-03-02 09:28:29.296095+00	["原创设计", "津门文化元素", "商业授权"]	["设计创作", "可接单"]	design	open	1	0	\N	2026-02-23 09:28:29.296095+00	2026-02-23 09:28:29.296095+00
3baeb77e-3ee4-4022-88c6-9810b74d631c	传统美食插画系列	创作8张传统美食插画，用于品牌宣传	老字号品牌联盟	\N	5000.00	8000.00	2026-03-09 09:28:29.296095+00	["8张插画", "传统风格", "可商用"]	["插画创作", "可接单"]	illustration	open	1	0	\N	2026-02-23 09:28:29.296095+00	2026-02-23 09:28:29.296095+00
d1d90781-459d-412b-9800-a274ceb86cee	产品宣传短视频制作	制作30秒产品宣传短视频	创意科技公司	\N	2000.00	3500.00	2026-02-28 09:28:29.296095+00	["30秒视频", "产品展示", "配乐"]	["视频创作", "可接单"]	video	open	1	0	\N	2026-02-23 09:28:29.296095+00	2026-02-23 09:28:29.296095+00
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.channel_costs (id, channel, cost_type, amount, start_date, end_date, description, metadata, created_at) FROM stdin;
68f2e891-9fd7-40f1-9ee7-886b4a2dad03	信息流广告	advertising	50000.00	2026-01-29	2026-03-30	抖音、快手信息流广告投放	{}	2026-02-28 06:54:35.029961
d6d06055-ae98-48c1-8e16-adb0074eb8c3	社交媒体	advertising	30000.00	2026-01-29	2026-03-30	微博、小红书推广	{}	2026-02-28 06:54:35.029961
abb57f84-c7d3-411f-8bb5-43e0067594db	搜索引擎	advertising	40000.00	2026-01-29	2026-03-30	百度、谷歌 SEM	{}	2026-02-28 06:54:35.029961
067a3508-14b3-4bc9-80fc-1d694b08e94e	KOL 合作	cooperation	60000.00	2026-01-29	2026-03-30	知名博主合作推广	{}	2026-02-28 06:54:35.029961
2fdb372e-4555-4892-8596-54b791a91e0e	内容营销	cooperation	20000.00	2026-01-29	2026-03-30	优质内容创作与分发	{}	2026-02-28 06:54:35.029961
\.


--
-- Data for Name: checkin_records; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.cold_start_recommendation_logs (id, user_id, recommendation_type, content_id, "position", was_clicked, was_liked, dwell_time, recommended_at) FROM stdin;
\.


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.commercial_opportunities (id, brand_name, brand_logo, name, description, reward, requirements, deadline, status, match_criteria, created_by, created_at, updated_at) FROM stdin;
9c4cd06d-f7f0-4cff-910b-91204c46f22c	桂发祥	\N	国潮包装设计	为老字号食品品牌设计国潮风格包装，要求融合传统元素与现代审美	¥15,000	需要插画设计经验，了解国潮风格	\N	open	{"type": "illustration", "min_value": 3000}	\N	2026-02-11 02:35:08.30699+00	2026-02-11 02:35:08.30699+00
1917e62a-5e96-4aac-9d82-66abe68380d2	杨柳青画社	\N	文创产品开发	设计传统文化元素文创产品系列，包括文具、家居用品等多个品类	¥20,000	需要纹样设计经验	\N	open	{"type": "pattern", "min_value": 5000}	\N	2026-02-11 02:35:08.30699+00	2026-02-11 02:35:08.30699+00
187d98af-9ded-427a-b187-41eab0233a8b	数字艺术馆	\N	数字藏品创作	创作基于传统纹样的数字藏品系列，要求具有独特的艺术价值和收藏价值	分成模式	需要数字艺术创作经验	\N	open	{"type": "digital_collectible", "min_value": 2000}	\N	2026-02-11 02:35:08.30699+00	2026-02-11 02:35:08.30699+00
e4c56394-ded2-4ab3-893b-73cd06d55889	天津老字号协会	\N	品牌视觉升级	为传统品牌进行现代化视觉升级，保留品牌基因的同时注入新活力	¥25,000	需要品牌设计经验	\N	open	{"type": "design", "min_value": 8000}	\N	2026-02-11 02:35:08.30699+00	2026-02-11 02:35:08.30699+00
14363914-626e-49d1-9b68-22cefea7dddb	天津市文化和旅游局	\N	文化主题插画	创作以天津传统文化为主题的插画系列，用于城市宣传和文化推广	¥18,000	需要插画设计经验，了解天津文化	\N	open	{"type": "illustration", "min_value": 4000}	\N	2026-02-11 02:35:08.30699+00	2026-02-11 02:35:08.30699+00
e6f05ec7-a7e0-45b8-8372-ff8a65230be1	桂发祥	\N	国潮包装设计	为老字号食品品牌设计国潮风格包装，要求融合传统元素与现代审美	¥15,000	需要插画设计经验，了解国潮风格	\N	open	{"type": "illustration", "min_value": 3000}	\N	2026-02-11 02:45:30.033143+00	2026-02-11 02:45:30.033143+00
b7e4358b-ca36-48a1-819b-4fb479d37d43	杨柳青画社	\N	文创产品开发	设计传统文化元素文创产品系列，包括文具、家居用品等多个品类	¥20,000	需要纹样设计经验	\N	open	{"type": "pattern", "min_value": 5000}	\N	2026-02-11 02:45:30.033143+00	2026-02-11 02:45:30.033143+00
4718a6e7-42b8-4c11-85bf-dd0f2392bddf	数字艺术馆	\N	数字藏品创作	创作基于传统纹样的数字藏品系列，要求具有独特的艺术价值和收藏价值	分成模式	需要数字艺术创作经验	\N	open	{"type": "digital_collectible", "min_value": 2000}	\N	2026-02-11 02:45:30.033143+00	2026-02-11 02:45:30.033143+00
f6993fa8-5945-4fe7-aa30-72b009be1328	天津老字号协会	\N	品牌视觉升级	为传统品牌进行现代化视觉升级，保留品牌基因的同时注入新活力	¥25,000	需要品牌设计经验	\N	open	{"type": "design", "min_value": 8000}	\N	2026-02-11 02:45:30.033143+00	2026-02-11 02:45:30.033143+00
a824d890-9fc7-4cc8-8497-95f09b877bc7	天津市文化和旅游局	\N	文化主题插画	创作以天津传统文化为主题的插画系列，用于城市宣传和文化推广	¥18,000	需要插画设计经验，了解天津文化	\N	open	{"type": "illustration", "min_value": 4000}	\N	2026-02-11 02:45:30.033143+00	2026-02-11 02:45:30.033143+00
\.


--
-- Data for Name: communities; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.community_announcements (id, community_id, content, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: community_invitation_history; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.community_invitation_history (id, community_id, user_id, target_user_id, action_type, action_detail, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: community_invitations; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.community_invitations (id, community_id, inviter_id, invitee_id, invitee_email, invitee_phone, invite_code, status, message, expires_at, accepted_at, rejected_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: community_invite_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.community_invite_settings (id, community_id, allow_member_invite, require_admin_approval, require_application_approval, max_invites_per_day, max_invites_per_batch, invite_expire_hours, application_questions, welcome_message, created_at, updated_at) FROM stdin;
6cba67b4-70bb-44d0-93d0-d2e5cff7ff31	4000e812-564d-4e7e-8247-dab93b75fac4	t	f	t	10	20	168	\N	\N	2026-02-18 09:23:18.461455+00	2026-02-18 09:23:18.461455+00
1579ed37-d2f1-4632-b107-0d99103906b0	042276db-d25a-4b95-b245-4d5e8a028889	t	f	t	10	20	168	\N	\N	2026-02-18 09:23:18.461455+00	2026-02-18 09:23:18.461455+00
3f68afb5-f23c-4710-b623-14da5ad8a486	01108040-8d7a-4f1e-910a-40acc85fda0f	t	f	t	10	20	168	\N	\N	2026-02-18 09:23:18.461455+00	2026-02-18 09:23:18.461455+00
\.


--
-- Data for Name: community_join_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.community_join_requests (id, community_id, user_id, status, reason, answers, reviewed_by, reviewed_at, review_note, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: community_members; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.consumption_records (id, user_id, order_id, order_amount, category, points, status, confirmed_at, created_at) FROM stdin;
\.


--
-- Data for Name: content_quality_assessments; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.content_quality_assessments (id, content_id, completeness_score, visual_quality_score, text_quality_score, predicted_engagement, overall_quality_score, quality_factors, assessed_at) FROM stdin;
\.


--
-- Data for Name: content_stats; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.content_stats (id, content_id, view_count, like_count, collect_count, share_count, comment_count, avg_dwell_time, ctr, engagement_rate, calculated_at, updated_at) FROM stdin;
\.


--
-- Data for Name: content_vectors; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.content_vectors (id, item_id, item_type, category, tags, author_id, theme, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.conversations (id, user_id, title, is_active, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: conversion_events; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.conversion_events (id, user_id, promoted_work_id, conversion_type, conversion_value, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: copyright_assets; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.copyright_assets (id, user_id, name, thumbnail, type, status, can_license, license_price, certificate_url, registered_at, expires_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: creator_earnings; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.creator_earnings (id, creator_id, task_id, submission_id, amount, source_type, calculation_basis, status, paid_at, payment_reference, created_at, updated_at) FROM stdin;
9ff97f57-301a-4700-842a-09a88a328d0b	f3dedf79-5c5e-40fd-9513-d0fb0995d429	ca384ac6-223d-46a8-8198-b10aedf19b9f	85bfae63-c8e4-487b-878d-0a4b9fecdb36	50.00	task_reward	{}	approved	\N	\N	2026-02-26 10:55:21.291857+00	2026-02-26 11:37:16.714317+00
2bcfa3c2-9d48-4a83-b8ab-791bb3fda9d2	f3dedf79-5c5e-40fd-9513-d0fb0995d429	f526cc02-dfc2-49eb-9a76-acdc7917959c	b2a98f67-e753-416c-ab16-cf85a4112e20	50.00	task_reward	{}	approved	\N	\N	2026-02-26 13:20:56.981+00	2026-02-26 13:20:58.114306+00
995fdba3-548a-45ed-82ec-8f0ee7e94c22	f3dedf79-5c5e-40fd-9513-d0fb0995d429	f526cc02-dfc2-49eb-9a76-acdc7917959c	b2a98f67-e753-416c-ab16-cf85a4112e20	50.00	task_reward	{}	approved	\N	\N	2026-02-26 13:20:58.94+00	2026-02-26 13:20:59.986325+00
\.


--
-- Data for Name: creator_level_configs; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.creator_revenue (id, user_id, total_revenue, monthly_revenue, pending_revenue, withdrawable_revenue, total_withdrawn, last_month_revenue, updated_at, created_at) FROM stdin;
c50c11a8-af7e-4945-b808-878a78974287	f3dedf79-5c5e-40fd-9513-d0fb0995d429	250.00	250.00	200.00	150.00	0.00	0.00	2026-02-26 13:20:59.872+00	2026-02-26 10:59:07.13176+00
\.


--
-- Data for Name: creator_task_applications; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.creator_task_applications (id, task_id, creator_id, status, deliverables, earnings, applied_at, accepted_at, completed_at) FROM stdin;
\.


--
-- Data for Name: cultural_knowledge; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.cultural_knowledge (id, title, category, subcategory, content, image_url, tags, related_items, sources, status, created_by, created_at, updated_at) FROM stdin;
1	杨柳青年画	文化遗产	传统美术	杨柳青年画是中国著名的民间木版年画之一，起源于天津市杨柳青镇，具有悠久的历史和独特的艺术风格。其特点是色彩鲜艳、线条流畅、形象生动，内容多以吉祥喜庆、历史故事、神话传说等为主题。杨柳青年画的制作工艺复杂，包括勾、刻、印、画、裱等多个环节，是中国民间艺术的瑰宝。	https://images.unsplash.com/photo-1584448082978-4553a877b910?w=800&h=600&fit=crop&q=80	{}	{泥人张彩塑,天津风筝魏}	{《中国民间美术史》,《天津地方志》}	active	\N	2026-02-18 13:41:32.509+00	2026-02-23 08:03:11.404925+00
19	杨柳青年画	文化遗产	传统美术	杨柳青年画是中国著名的民间木版年画之一，起源于天津市杨柳青镇，具有悠久的历史和独特的艺术风格。其特点是色彩鲜艳、线条流畅、形象生动，内容多以吉祥喜庆、历史故事、神话传说等为主题。杨柳青年画的制作工艺复杂，包括勾、刻、印、画、裱等多个环节，是中国民间艺术的瑰宝。	https://images.unsplash.com/photo-1584448082978-4553a877b910?w=800&h=600&fit=crop&q=80	{}	{泥人张彩塑,天津风筝魏}	{《中国民间美术史》,《天津地方志》}	active	\N	2026-02-23 06:55:37.746+00	2026-02-23 08:03:11.404925+00
33	非遗技艺介绍	culture		非物质文化遗产技艺包括：1. 传统手工艺（如刺绣、木雕、陶瓷），2. 传统表演艺术（如京剧、皮影戏），3. 传统节日（如春节、端午节），4. 传统知识（如中医、天文历法）。	https://images.unsplash.com/photo-1561839561-b13bcfe95249?w=800&h=600&fit=crop&q=80	{非遗技艺,传统工艺,文化传承}	{}	{}	active	\N	2026-02-23 06:55:37.746+00	2026-02-23 08:03:11.404925+00
20	泥人张彩塑	传统技艺	雕塑艺术	泥人张彩塑是天津著名的民间传统手工艺品，创始于清代道光年间，以张明山为代表。其作品以细腻的手法、逼真的形象和丰富的色彩著称，题材广泛，包括历史人物、民间故事、神话传说等。泥人张彩塑的制作工艺精湛，从取土、和泥、塑造到彩绘，每一个环节都需要高超的技艺和丰富的经验。	https://images.unsplash.com/photo-1561839561-b13bcfe95249?w=800&h=600&fit=crop&q=80	{}	{杨柳青年画,天津风筝魏}	{《中国传统工艺全集》,《天津民间艺术志》}	active	\N	2026-02-23 06:55:37.746+00	2026-02-23 08:03:11.404925+00
15	非遗技艺介绍	culture		非物质文化遗产技艺包括：1. 传统手工艺（如刺绣、木雕、陶瓷），2. 传统表演艺术（如京剧、皮影戏），3. 传统节日（如春节、端午节），4. 传统知识（如中医、天文历法）。	https://images.unsplash.com/photo-1561839561-b13bcfe95249?w=800&h=600&fit=crop&q=80	{非遗技艺,传统工艺,文化传承}	{}	{}	active	\N	2026-02-18 13:41:32.51+00	2026-02-23 08:03:11.404925+00
3	天津方言	方言文化	地方语言	天津方言是中国北方方言的一种，具有独特的语音、词汇和语法特点。天津方言的语音特点包括一声变调、轻声较多、儿化音丰富等；词汇方面有很多独特的方言词，如“嘛”（什么）、“哏儿”（有趣）、“倍儿”（非常）等；语法上也有一些特殊的表达方式。天津方言生动活泼，富有表现力，是天津地域文化的重要组成部分。	https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&h=600&fit=crop&q=80	{}	{天津民俗,天津曲艺}	{《天津方言词典》,《汉语方言大词典》}	active	\N	2026-02-18 13:41:32.509+00	2026-02-23 08:03:11.404925+00
21	天津方言	方言文化	地方语言	天津方言是中国北方方言的一种，具有独特的语音、词汇和语法特点。天津方言的语音特点包括一声变调、轻声较多、儿化音丰富等；词汇方面有很多独特的方言词，如“嘛”（什么）、“哏儿”（有趣）、“倍儿”（非常）等；语法上也有一些特殊的表达方式。天津方言生动活泼，富有表现力，是天津地域文化的重要组成部分。	https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&h=600&fit=crop&q=80	{}	{天津民俗,天津曲艺}	{《天津方言词典》,《汉语方言大词典》}	active	\N	2026-02-23 06:55:37.746+00	2026-02-23 08:03:11.404925+00
39	天津方言	方言文化	地方语言	天津方言是中国北方方言的一种，具有独特的语音、词汇和语法特点。天津方言的语音特点包括一声变调、轻声较多、儿化音丰富等；词汇方面有很多独特的方言词，如"嘛"（什么）、"哏儿"（有趣）、"倍儿"（非常）等；语法上也有一些特殊的表达方式。天津方言生动活泼，富有表现力，是天津地域文化的重要组成部分。	https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800&h=600&fit=crop&q=80	{天津方言,地方语言,方言文化}	{天津民俗,天津曲艺}	{《天津方言词典》,《汉语方言大词典》}	active	\N	2026-02-23 07:54:08.096536+00	2026-02-23 08:03:11.404925+00
4	天津之眼	建筑风格	现代建筑	天津之眼是世界上唯一建在桥上的摩天轮，位于天津市红桥区海河畔，是天津的标志性建筑之一。摩天轮直径110米，轮外装挂48个360度透明座舱，每个座舱可乘坐8人，旋转一周约需30分钟。天津之眼不仅是一个游乐设施，也是欣赏天津城市风光的绝佳地点，尤其是夜晚灯光亮起时，美轮美奂。	https://images.unsplash.com/photo-1513622790541-eaa84d356909?w=800&h=600&fit=crop&q=80	{}	{海河,天津夜景}	{天津旅游局官方网站,《天津城市规划志》}	active	\N	2026-02-18 13:41:32.509+00	2026-02-23 08:03:11.404925+00
22	天津之眼	建筑风格	现代建筑	天津之眼是世界上唯一建在桥上的摩天轮，位于天津市红桥区海河畔，是天津的标志性建筑之一。摩天轮直径110米，轮外装挂48个360度透明座舱，每个座舱可乘坐8人，旋转一周约需30分钟。天津之眼不仅是一个游乐设施，也是欣赏天津城市风光的绝佳地点，尤其是夜晚灯光亮起时，美轮美奂。	https://images.unsplash.com/photo-1513622790541-eaa84d356909?w=800&h=600&fit=crop&q=80	{}	{海河,天津夜景}	{天津旅游局官方网站,《天津城市规划志》}	active	\N	2026-02-23 06:55:37.746+00	2026-02-23 08:03:11.404925+00
40	天津之眼	建筑风格	现代建筑	天津之眼是世界上唯一建在桥上的摩天轮，位于天津市红桥区海河畔，是天津的标志性建筑之一。摩天轮直径110米，轮外装挂48个360度透明座舱，每个座舱可乘坐8人，旋转一周约需30分钟。天津之眼不仅是一个游乐设施，也是欣赏天津城市风光的绝佳地点，尤其是夜晚灯光亮起时，美轮美奂。	https://images.unsplash.com/photo-1513622790541-eaa84d356909?w=800&h=600&fit=crop&q=80	{天津之眼,摩天轮,现代建筑,地标建筑}	{海河,天津夜景}	{天津旅游局官方网站,《天津城市规划志》}	active	\N	2026-02-23 07:54:08.096536+00	2026-02-23 08:03:11.404925+00
5	狗不理包子	地方小吃	传统美食	狗不理包子是天津著名的传统小吃，始创于清代咸丰年间，以其皮薄、馅大、味道鲜美而闻名。其特点是选用优质面粉制作皮料，馅料讲究，制作工艺精细，每个包子有18个褶。狗不理包子的名称来源于创始人高贵有（乳名“狗子”），因其生意繁忙，顾不上搭理顾客，久而久之被称为“狗不理”。	https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&h=600&fit=crop&q=80	{}	{十八街麻花,耳朵眼炸糕}	{《天津小吃志》,《中国名小吃大全》}	active	\N	2026-02-18 13:41:32.509+00	2026-02-23 08:03:11.404925+00
23	狗不理包子	地方小吃	传统美食	狗不理包子是天津著名的传统小吃，始创于清代咸丰年间，以其皮薄、馅大、味道鲜美而闻名。其特点是选用优质面粉制作皮料，馅料讲究，制作工艺精细，每个包子有18个褶。狗不理包子的名称来源于创始人高贵有（乳名“狗子”），因其生意繁忙，顾不上搭理顾客，久而久之被称为“狗不理”。	https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&h=600&fit=crop&q=80	{}	{十八街麻花,耳朵眼炸糕}	{《天津小吃志》,《中国名小吃大全》}	active	\N	2026-02-23 06:55:37.746+00	2026-02-23 08:03:11.404925+00
41	狗不理包子	地方小吃	传统美食	狗不理包子是天津著名的传统小吃，始创于清代咸丰年间，以其皮薄、馅大、味道鲜美而闻名。其特点是选用优质面粉制作皮料，馅料讲究，制作工艺精细，每个包子有18个褶。狗不理包子的名称来源于创始人高贵有（乳名"狗子"），因其生意繁忙，顾不上搭理顾客，久而久之被称为"狗不理"。	https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&h=600&fit=crop&q=80	{狗不理包子,传统美食,天津小吃}	{十八街麻花,耳朵眼炸糕}	{《天津小吃志》,《中国名小吃大全》}	active	\N	2026-02-23 07:54:08.096536+00	2026-02-23 08:03:11.404925+00
6	五大道建筑群	建筑风格	近代建筑	五大道位于天津市和平区，是天津近代建筑的集中地，拥有英、法、意、德、西班牙等国各式建筑2000多栋，其中风貌建筑300余栋。这些建筑风格多样，包括哥特式、罗马式、巴洛克式、文艺复兴式等，被誉为“万国建筑博览馆”。五大道是天津历史文化的重要载体，反映了天津近代的发展历程和多元文化融合的特点。	https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&h=600&fit=crop&q=80	{}	{意式风情区,天津租界历史}	{《天津近代建筑志》,《五大道历史文化街区保护规划》}	active	\N	2026-02-18 13:41:32.509+00	2026-02-23 08:03:11.404925+00
24	五大道建筑群	建筑风格	近代建筑	五大道位于天津市和平区，是天津近代建筑的集中地，拥有英、法、意、德、西班牙等国各式建筑2000多栋，其中风貌建筑300余栋。这些建筑风格多样，包括哥特式、罗马式、巴洛克式、文艺复兴式等，被誉为“万国建筑博览馆”。五大道是天津历史文化的重要载体，反映了天津近代的发展历程和多元文化融合的特点。	https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&h=600&fit=crop&q=80	{}	{意式风情区,天津租界历史}	{《天津近代建筑志》,《五大道历史文化街区保护规划》}	active	\N	2026-02-23 06:55:37.746+00	2026-02-23 08:03:11.404925+00
42	五大道建筑群	建筑风格	近代建筑	五大道位于天津市和平区，是天津近代建筑的集中地，拥有英、法、意、德、西班牙等国各式建筑2000多栋，其中风貌建筑300余栋。这些建筑风格多样，包括哥特式、罗马式、巴洛克式、文艺复兴式等，被誉为"万国建筑博览馆"。五大道是天津历史文化的重要载体，反映了天津近代的发展历程和多元文化融合的特点。	https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&h=600&fit=crop&q=80	{五大道,近代建筑,历史建筑,建筑风格}	{意式风情区,天津租界历史}	{《天津近代建筑志》,《五大道历史文化街区保护规划》}	active	\N	2026-02-23 07:54:08.096536+00	2026-02-23 08:03:11.404925+00
7	天津时调	文学艺术	曲艺	天津时调是天津特有的曲艺形式，起源于清代，流行于天津及周边地区。它以天津方言演唱，曲调丰富，表现力强，内容多反映天津人民的生活和思想感情。天津时调的表演形式简单，通常由一人演唱，伴奏乐器主要有三弦、四胡等。其代表曲目有《放风筝》、《踢毽》、《大西厢》等。	https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=600&fit=crop&q=80	{}	{京韵大鼓,天津快板}	{《中国曲艺志·天津卷》,《天津曲艺史》}	active	\N	2026-02-18 13:41:32.509+00	2026-02-23 08:03:11.404925+00
25	天津时调	文学艺术	曲艺	天津时调是天津特有的曲艺形式，起源于清代，流行于天津及周边地区。它以天津方言演唱，曲调丰富，表现力强，内容多反映天津人民的生活和思想感情。天津时调的表演形式简单，通常由一人演唱，伴奏乐器主要有三弦、四胡等。其代表曲目有《放风筝》、《踢毽》、《大西厢》等。	https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=600&fit=crop&q=80	{}	{京韵大鼓,天津快板}	{《中国曲艺志·天津卷》,《天津曲艺史》}	active	\N	2026-02-23 06:55:37.746+00	2026-02-23 08:03:11.404925+00
43	天津时调	文学艺术	曲艺	天津时调是天津特有的曲艺形式，起源于清代，流行于天津及周边地区。它以天津方言演唱，曲调丰富，表现力强，内容多反映天津人民的生活和思想感情。天津时调的表演形式简单，通常由一人演唱，伴奏乐器主要有三弦、四胡等。其代表曲目有《放风筝》、《踢毽》、《大西厢》等。	https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=600&fit=crop&q=80	{天津时调,曲艺,民间艺术}	{京韵大鼓,天津快板}	{《中国曲艺志·天津卷》,《天津曲艺史》}	active	\N	2026-02-23 07:54:08.096536+00	2026-02-23 08:03:11.404925+00
8	天后宫	宗教信仰	道教	天津天后宫俗称“娘娘宫”，位于南开区古文化街中心，是天津市区最古老的建筑群之一，也是中国北方最大的妈祖庙。天后宫始建于元代，明永乐年间重建，是天津城市发展的历史见证。天后宫内供奉着海神妈祖，每年农历三月二十三日是妈祖诞辰，届时会举行盛大的庙会活动，吸引众多信徒和游客前来朝拜。	https://images.unsplash.com/photo-1542640244-7e672d6cef4e?w=800&h=600&fit=crop&q=80	{}	{古文化街,妈祖文化}	{《天津天后宫志》,《中国道教宫观志》}	active	\N	2026-02-18 13:41:32.509+00	2026-02-23 08:03:11.404925+00
26	天后宫	宗教信仰	道教	天津天后宫俗称“娘娘宫”，位于南开区古文化街中心，是天津市区最古老的建筑群之一，也是中国北方最大的妈祖庙。天后宫始建于元代，明永乐年间重建，是天津城市发展的历史见证。天后宫内供奉着海神妈祖，每年农历三月二十三日是妈祖诞辰，届时会举行盛大的庙会活动，吸引众多信徒和游客前来朝拜。	https://images.unsplash.com/photo-1542640244-7e672d6cef4e?w=800&h=600&fit=crop&q=80	{}	{古文化街,妈祖文化}	{《天津天后宫志》,《中国道教宫观志》}	active	\N	2026-02-23 06:55:37.746+00	2026-02-23 08:03:11.404925+00
44	天后宫	宗教信仰	道教	天津天后宫俗称"娘娘宫"，位于南开区古文化街中心，是天津市区最古老的建筑群之一，也是中国北方最大的妈祖庙。天后宫始建于元代，明永乐年间重建，是天津城市发展的历史见证。天后宫内供奉着海神妈祖，每年农历三月二十三日是妈祖诞辰，届时会举行盛大的庙会活动，吸引众多信徒和游客前来朝拜。	https://images.unsplash.com/photo-1542640244-7e672d6cef4e?w=800&h=600&fit=crop&q=80	{天后宫,妈祖庙,道教,古建筑}	{古文化街,妈祖文化}	{《天津天后宫志》,《中国道教宫观志》}	active	\N	2026-02-23 07:54:08.096536+00	2026-02-23 08:03:11.404925+00
14	传统纹样分类	culture		中国传统纹样主要包括：1. 几何纹样（如回纹、云纹），2. 动物纹样（如龙纹、凤纹），3. 植物纹样（如牡丹纹、莲花纹），4. 人物纹样，5. 文字纹样。这些纹样常被用于传统服饰、陶瓷、建筑等领域。	https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?w=800&h=600&fit=crop&q=80	{传统纹样,分类,文化元素}	{}	{}	active	\N	2026-02-18 13:41:32.51+00	2026-02-23 08:03:11.404925+00
32	传统纹样分类	culture		中国传统纹样主要包括：1. 几何纹样（如回纹、云纹），2. 动物纹样（如龙纹、凤纹），3. 植物纹样（如牡丹纹、莲花纹），4. 人物纹样，5. 文字纹样。这些纹样常被用于传统服饰、陶瓷、建筑等领域。	https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?w=800&h=600&fit=crop&q=80	{传统纹样,分类,文化元素}	{}	{}	active	\N	2026-02-23 06:55:37.746+00	2026-02-23 08:03:11.404925+00
45	传统纹样分类	文化知识	传统纹样	中国传统纹样主要包括：1. 几何纹样（如回纹、云纹），2. 动物纹样（如龙纹、凤纹），3. 植物纹样（如牡丹纹、莲花纹），4. 人物纹样，5. 文字纹样。这些纹样常被用于传统服饰、陶瓷、建筑等领域。	https://images.unsplash.com/photo-1582738411706-bfc8e691d1c2?w=800&h=600&fit=crop&q=80	{传统纹样,分类,文化元素}	{传统服饰,陶瓷,建筑}	{《中国传统纹样大全》}	active	\N	2026-02-23 07:54:08.096536+00	2026-02-23 08:03:11.404925+00
16	中国传统色彩体系	culture		中国传统色彩体系源于自然和哲学思想，主要包括：1. 五行色彩（青、赤、黄、白、黑），2. 传统染料（如靛蓝、朱砂、赭石），3. 宫廷色彩（如明黄、朱红），4. 民间色彩（如大红、翠绿）。	https://images.unsplash.com/photo-1502691876148-a84978e59af8?w=800&h=600&fit=crop&q=80	{传统色彩,五行色彩,色彩体系}	{}	{}	active	\N	2026-02-18 13:41:32.51+00	2026-02-23 08:03:11.404925+00
34	中国传统色彩体系	culture		中国传统色彩体系源于自然和哲学思想，主要包括：1. 五行色彩（青、赤、黄、白、黑），2. 传统染料（如靛蓝、朱砂、赭石），3. 宫廷色彩（如明黄、朱红），4. 民间色彩（如大红、翠绿）。	https://images.unsplash.com/photo-1502691876148-a84978e59af8?w=800&h=600&fit=crop&q=80	{传统色彩,五行色彩,色彩体系}	{}	{}	active	\N	2026-02-23 06:55:37.746+00	2026-02-23 08:03:11.404925+00
47	中国传统色彩体系	文化知识	传统色彩	中国传统色彩体系源于自然和哲学思想，主要包括：1. 五行色彩（青、赤、黄、白、黑），2. 传统染料（如靛蓝、朱砂、赭石），3. 宫廷色彩（如明黄、朱红），4. 民间色彩（如大红、翠绿）。	https://images.unsplash.com/photo-1502691876148-a84978e59af8?w=800&h=600&fit=crop&q=80	{传统色彩,五行色彩,色彩体系}	{传统染料,宫廷色彩,民间色彩}	{《中国传统色彩》}	active	\N	2026-02-23 07:54:08.096536+00	2026-02-23 08:03:11.404925+00
17	传统建筑元素	culture		中国传统建筑元素包括：1. 斗拱，2. 飞檐，3. 彩绘，4. 石狮，5. 门钉，6. 藻井。这些元素不仅具有实用功能，还蕴含着丰富的文化内涵。	https://images.unsplash.com/photo-1542640244-7e672d6cef4e?w=800&h=600&fit=crop&q=80	{传统建筑,建筑元素,文化内涵}	{}	{}	active	\N	2026-02-18 13:41:32.51+00	2026-02-23 08:03:11.404925+00
35	传统建筑元素	culture		中国传统建筑元素包括：1. 斗拱，2. 飞檐，3. 彩绘，4. 石狮，5. 门钉，6. 藻井。这些元素不仅具有实用功能，还蕴含着丰富的文化内涵。	https://images.unsplash.com/photo-1542640244-7e672d6cef4e?w=800&h=600&fit=crop&q=80	{传统建筑,建筑元素,文化内涵}	{}	{}	active	\N	2026-02-23 06:55:37.747+00	2026-02-23 08:03:11.404925+00
48	传统建筑元素	文化知识	传统建筑	中国传统建筑元素包括：1. 斗拱，2. 飞檐，3. 彩绘，4. 石狮，5. 门钉，6. 藻井。这些元素不仅具有实用功能，还蕴含着丰富的文化内涵。	https://images.unsplash.com/photo-1542640244-7e672d6cef4e?w=800&h=600&fit=crop&q=80	{传统建筑,建筑元素,文化内涵}	{斗拱,飞檐,彩绘}	{《中国传统建筑》}	active	\N	2026-02-23 07:54:08.096536+00	2026-02-23 08:03:11.404925+00
18	传统节日习俗	culture		中国传统节日有丰富的习俗：1. 春节（贴春联、吃年夜饭、放鞭炮），2. 元宵节（赏花灯、吃元宵），3. 清明节（扫墓、踏青），4. 端午节（吃粽子、赛龙舟），5. 中秋节（赏月、吃月饼）。	https://images.unsplash.com/photo-1548625361-1d6e23c9d6ad?w=800&h=600&fit=crop&q=80	{传统节日,节日习俗,文化活动}	{}	{}	active	\N	2026-02-18 13:41:32.51+00	2026-02-23 08:03:11.404925+00
36	传统节日习俗	culture		中国传统节日有丰富的习俗：1. 春节（贴春联、吃年夜饭、放鞭炮），2. 元宵节（赏花灯、吃元宵），3. 清明节（扫墓、踏青），4. 端午节（吃粽子、赛龙舟），5. 中秋节（赏月、吃月饼）。	https://images.unsplash.com/photo-1548625361-1d6e23c9d6ad?w=800&h=600&fit=crop&q=80	{传统节日,节日习俗,文化活动}	{}	{}	active	\N	2026-02-23 06:55:37.747+00	2026-02-23 08:03:11.404925+00
\.


--
-- Data for Name: direct_messages; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.direct_messages (id, sender_id, receiver_id, content, type, is_read, created_at, updated_at) FROM stdin;
de27edd6-957b-4bcc-ad5f-b060a954f918	f3dedf79-5c5e-40fd-9513-d0fb0995d429	478c134c-c5c2-4c01-827b-d142352d4873	1	text	t	2026-02-24 15:05:23.708414+00	2026-02-25 06:55:18.1944+00
3f2d6937-a5ec-4984-86f6-a922ca3a7a1a	f3dedf79-5c5e-40fd-9513-d0fb0995d429	478c134c-c5c2-4c01-827b-d142352d4873	1	text	t	2026-02-25 01:06:53.331236+00	2026-02-25 06:55:18.1944+00
a4a8f325-04a0-499a-9eb8-21802db53ee0	f3dedf79-5c5e-40fd-9513-d0fb0995d429	478c134c-c5c2-4c01-827b-d142352d4873	1	text	t	2026-02-25 01:26:32.74632+00	2026-02-25 06:55:18.1944+00
2c3695e8-4eeb-480f-ab1b-827f5fe27b6a	f3dedf79-5c5e-40fd-9513-d0fb0995d429	478c134c-c5c2-4c01-827b-d142352d4873	[WORK_SHARE]{"type":"work_share","workId":"bd064ca2-79f7-4ca5-9ad2-4c36b17b1489","workTitle":"风筝魏·燕子竹骨纸鸢","workThumbnail":"https://pptqdicaaewtnaiflfcs.supabase.co/storage/v1/object/public/works/videos/1771551962777-yfsat4mxhg.mp4","workType":"video","message":""}[/WORK_SHARE]	text	f	2026-02-25 10:09:30.797722+00	2026-02-25 10:09:30.797722+00
a306d7fd-9825-431a-b5d7-f4b2f2a6bd1d	f3dedf79-5c5e-40fd-9513-d0fb0995d429	00e1a36a-a77b-4bcc-b604-c5655a4ce802	1	text	t	2026-02-25 13:14:33.580122+00	2026-02-25 13:15:14.691751+00
59ae3a7e-7eff-4207-a709-2eeac4359121	f3dedf79-5c5e-40fd-9513-d0fb0995d429	00e1a36a-a77b-4bcc-b604-c5655a4ce802	1	text	t	2026-02-25 13:14:46.301683+00	2026-02-25 13:15:14.691751+00
9d0d266e-d0b9-4cdd-8c33-00a6814dabd2	2689ba70-b3b9-4425-b01a-fab003b29072	06dbee08-83b6-4d14-a5c1-d0794c8a168e	hi	text	f	2026-02-26 06:28:16.183805+00	2026-02-26 06:28:16.183805+00
fff12210-eaf0-4911-82dc-4e9d01d99de5	2689ba70-b3b9-4425-b01a-fab003b29072	06dbee08-83b6-4d14-a5c1-d0794c8a168e	https://www.jinmai-lab.tech/square/b3603cf0-f046-4751-bc74-5358d79381a9	text	f	2026-02-26 06:33:53.231194+00	2026-02-26 06:33:53.231194+00
\.


--
-- Data for Name: drafts; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.drafts (id, user_id, title, content, template_id, template_name, summary, category, tags, is_favorite, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: errors; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.errors (id, user_id, error_type, error_message, stack_trace, context, status_code, url, user_agent, ip_address, is_resolved, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: event_bookmarks; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.event_bookmarks (user_id, event_id, created_at) FROM stdin;
f3dedf79-5c5e-40fd-9513-d0fb0995d429	f1251821-5738-48ed-91b7-5d4b59287219	2026-02-18 05:31:08.458+00
\.


--
-- Data for Name: event_daily_stats; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.event_daily_stats (id, event_id, stat_date, submissions_count, views_count, likes_count, comments_count, unique_visitors, avg_score, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: event_likes; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.event_likes (user_id, event_id, created_at) FROM stdin;
f3dedf79-5c5e-40fd-9513-d0fb0995d429	f1251821-5738-48ed-91b7-5d4b59287219	2026-02-18 05:31:07.484+00
f3dedf79-5c5e-40fd-9513-d0fb0995d429	665f1aab-e2ec-49b8-a691-f0134fac9861	2026-02-18 06:32:14.615+00
2689	665f1aab-e2ec-49b8-a691-f0134fac9861	2026-02-26 06:21:05.838+00
\.


--
-- Data for Name: event_notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.event_notifications (id, user_id, event_id, type, title, content, is_read, is_important, action_url, action_text, metadata, created_at, read_at) FROM stdin;
\.


--
-- Data for Name: event_participants; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.event_participants (id, event_id, user_id, status, registration_date, updated_at, progress, current_step, submitted_work_id, submission_data, submission_date, ranking, award, notes, created_at) FROM stdin;
c8320b4a-35b9-4377-a26c-754bfdcf015c	f1251821-5738-48ed-91b7-5d4b59287219	f3dedf79-5c5e-40fd-9513-d0fb0995d429	submitted	1770964095	1771238231685	50	2	\N	{}	1771238231685	\N	\N	\N	1770964095000
225419b5-b7a7-4e6d-bcb2-3fb183c026f0	665f1aab-e2ec-49b8-a691-f0134fac9861	f3dedf79-5c5e-40fd-9513-d0fb0995d429	completed	1771214787	1771238283103	100	4	\N	{}	1771221772030	\N	\N	\N	1771214787000
5172d544-00cb-41db-a6c0-6a0d498ea3df	ac1cd600-7ec8-4d46-b589-81354bd16e28	f3dedf79-5c5e-40fd-9513-d0fb0995d429	registered	1771680114	1771680114000	0	1	\N	{}	\N	\N	\N	\N	1771680114000
662dc331-7b42-4284-a2a2-197c6ffb2bb6	7fba402a-ca0f-4164-9715-f739e5e88fb3	2689ba70-b3b9-4425-b01a-fab003b29072	registered	1772086918	1772086918000	0	1	\N	{}	\N	\N	\N	\N	1772086918000
9bf86cd9-8c77-4d34-848d-0fffce7bbe6c	7fba402a-ca0f-4164-9715-f739e5e88fb3	06dbee08-83b6-4d14-a5c1-d0794c8a168e	registered	1772112152	1772112152000	0	1	\N	{}	\N	\N	\N	\N	1772112152000
fbc8109c-a2f2-4f26-89ec-32ff21b24708	7fba402a-ca0f-4164-9715-f739e5e88fb3	f3dedf79-5c5e-40fd-9513-d0fb0995d429	submitted	1772024803	1772161831000	50	2	\N	{}	1772161831000	\N	\N	\N	1772024803000
\.


--
-- Data for Name: event_prizes; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.event_prizes (id, event_id, level, rank_name, combination_type, single_prize, sub_prizes, display_order, is_highlight, highlight_color, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: event_submissions; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.event_submissions (id, event_id, user_id, work_id, work_title, work_thumbnail, description, status, score, feedback, submission_date, updated_at, vote_count, like_count, avg_rating, rating_count, media_type, participation_id, title, files, submitted_at, created_at, cover_image, metadata, reviewed_at, review_notes, published_at) FROM stdin;
5838d36f-e6f6-4c9d-a2a6-a1c66ba205d6	f1251821-5738-48ed-91b7-5d4b59287219	f3dedf79-5c5e-40fd-9513-d0fb0995d429	\N	\N	\N	1	submitted	\N	\N	1770981594	1771238231685	1	1	3.00	1	image	c8320b4a-35b9-4377-a26c-754bfdcf015c	1	[{"id": "62ce4542-d310-422a-bc77-f0144558e21b", "url": "https://dashscope-result-bj.oss-cn-beijing.aliyuncs.com/1d/4e/20260215/c70535fc/3b717f33-0342-41ec-b8e5-03aacf848242-1.png?Expires=1771246917&OSSAccessKeyId=LTAI5tQZd8AEcZX6KZV4G8qL&Signature=nUPxy7y0GvbGtESSIWDbsrFpvO0%3D", "name": "1.png", "size": 0, "type": "image/png", "thumbnailUrl": "https://dashscope-result-bj.oss-cn-beijing.aliyuncs.com/1d/4e/20260215/c70535fc/3b717f33-0342-41ec-b8e5-03aacf848242-1.png?Expires=1771246917&OSSAccessKeyId=LTAI5tQZd8AEcZX6KZV4G8qL&Signature=nUPxy7y0GvbGtESSIWDbsrFpvO0%3D"}]	1771238231685	1770981594000	\N	{}	\N	\N	\N
2fba426f-d820-4c19-bf28-5a7190bec997	7fba402a-ca0f-4164-9715-f739e5e88fb3	f3dedf79-5c5e-40fd-9513-d0fb0995d429	\N	\N	\N	【餐饮美食模板】\n\n设计理念：\n以"色、香、味"的感官体验为设计原点，将美食的诱人特质转化为视觉语言。设计强调食欲感与烟火气的营造，通过精心设计的色彩、构图和光影，让观者在视觉上就能感受到食物的美味与温度。\n\n核心功能：\n1. 食欲感配色：暖橙、焦糖、奶油等提升食欲的专业配色\n2. 蒸汽烟雾效果：智能添加食物热气腾腾的视觉效果\n3. 食材展示布局：专业的食材陈列与摆盘设计方案\n4. 烟火气滤镜：模拟真实餐厅环境的氛围滤镜\n\n适用场景：\n1. 餐厅品牌视觉设计\n2. 菜单与点餐界面设计\n3. 美食摄影后期处理\n4. 外卖平台店铺装修\n5. 美食节活动宣传\n\n视觉风格：\n采用"温暖食欲风格"，以暖色调为主，强调食物的新鲜感与美味度。设计注重光影的细腻表现，通过高光、阴影的精心处理，让食物呈现出诱人的质感。同时融入木质、陶瓷等自然材质元素，营造温馨的用餐氛围。\n\n使用方法：\n1. 上传美食图片或选择示例图\n2. 选择菜品类型（中餐/西餐/甜点等）\n3. 应用食欲感配色方案\n4. 添加蒸汽/烟雾效果\n5. 生成菜单或海报设计\n\n预期效果：\n设计作品能够有效激发观者的食欲与消费欲望，提升餐厅的进店率与点单率。专业的视觉呈现增强品牌的品质感与可信度，有助于在激烈的市场竞争中脱颖而出。\n\n---\n基于以上信息，为品牌设计餐饮美食风格的创意方案。\n\n【设计模板：节日促销海报】\n\n设计理念：\n本模板以"喜庆祥和、吸引眼球"为核心设计理念，专为传统节日促销活动而设计。设计灵感源自中国传统节庆文化，将红色、金色等喜庆色彩与现代商业海报设计手法相结合，打造既有节日氛围又具商业吸引力的促销海报。\n\n核心功能：\n1. 智能节日配色：自动匹配春节红、中秋金等传统节日色彩，支持渐变、撞色等多种配色方案\n2. 促销元素库：内置折扣标签、倒计时、优惠券等100+促销元素，支持一键添加\n3. 文案模板：提供节日促销文案模板，涵盖满减、折扣、赠品等多种促销形式\n4. 多尺寸适配：自动适配A4、A3、易拉宝、灯箱等多种线下物料尺寸\n\n适用场景：\n1. 春节、中秋等传统节日促销活动\n2. 店庆、周年庆等商业庆典活动\n3. 新品上市、限时抢购等营销活动\n4. 商场、超市等线下门店促销\n5. 电商平台节日专题页面\n\n视觉风格：\n采用"喜庆商业风格"，以红色、金色为主色调，搭配白色或深色背景形成强烈对比。促销信息使用大号字体突出显示，配合爆炸贴、箭头、星星等装饰元素增强视觉冲击力。整体布局遵循F型视觉动线，确保促销信息一目了然。\n\n使用方法：\n1. 选择品牌并上传Logo\n2. 选择节日主题（春节/中秋/端午等）\n3. 输入促销信息（折扣力度、活动时间等）\n4. 从元素库中选择促销装饰元素\n5. 调整布局并导出多种尺寸\n\n预期效果：\n使用该模板可快速产出具有强烈节日氛围和商业吸引力的促销海报，有效提升促销活动的关注度和转化率。传统与现代的结合既能唤起消费者的文化认同感，又能满足现代审美需求。\n\n---\n设计要求：采用节日促销海报风格，festive promotion poster, vibrant red and gold\n\n【设计模板：节日促销海报】\n\n设计理念：\n本模板以"喜庆祥和、吸引眼球"为核心设计理念，专为传统节日促销活动而设计。设计灵感源自中国传统节庆文化，将红色、金色等喜庆色彩与现代商业海报设计手法相结合，打造既有节日氛围又具商业吸引力的促销海报。\n\n核心功能：\n1. 智能节日配色：自动匹配春节红、中秋金等传统节日色彩，支持渐变、撞色等多种配色方案\n2. 促销元素库：内置折扣标签、倒计时、优惠券等100+促销元素，支持一键添加\n3. 文案模板：提供节日促销文案模板，涵盖满减、折扣、赠品等多种促销形式\n4. 多尺寸适配：自动适配A4、A3、易拉宝、灯箱等多种线下物料尺寸\n\n适用场景：\n1. 春节、中秋等传统节日促销活动\n2. 店庆、周年庆等商业庆典活动\n3. 新品上市、限时抢购等营销活动\n4. 商场、超市等线下门店促销\n5. 电商平台节日专题页面\n\n视觉风格：\n采用"喜庆商业风格"，以红色、金色为主色调，搭配白色或深色背景形成强烈对比。促销信息使用大号字体突出显示，配合爆炸贴、箭头、星星等装饰元素增强视觉冲击力。整体布局遵循F型视觉动线，确保促销信息一目了然。\n\n使用方法：\n1. 选择品牌并上传Logo\n2. 选择节日主题（春节/中秋/端午等）\n3. 输入促销信息（折扣力度、活动时间等）\n4. 从元素库中选择促销装饰元素\n5. 调整布局并导出多种尺寸\n\n预期效果：\n使用该模板可快速产出具有强烈节日氛围和商业吸引力的促销海报，有效提升促销活动的关注度和转化率。传统与现代的结合既能唤起消费者的文化认同感，又能满足现代审美需求。\n\n---\n设计要求：采用节日促销海报风格，festive promotion poster, vibrant red and gold	submitted	\N	\N	1772074267	1772161831000	0	0	0.00	0	image	fbc8109c-a2f2-4f26-89ec-32ff21b24708	cs	[{"id": "1772161830184_wizard-image-2.jpg", "url": "https://pptqdicaaewtnaiflfcs.supabase.co/storage/v1/object/public/event-submissions/7fba402a-ca0f-4164-9715-f739e5e88fb3/f3dedf79-5c5e-40fd-9513-d0fb0995d429/1772161829123_wizard-image-2.jpg", "name": "wizard-image-2.jpg", "size": 1378322, "type": "image/png", "thumbnailUrl": "https://pptqdicaaewtnaiflfcs.supabase.co/storage/v1/object/public/event-submissions/7fba402a-ca0f-4164-9715-f739e5e88fb3/f3dedf79-5c5e-40fd-9513-d0fb0995d429/1772161829123_wizard-image-2.jpg"}, {"id": "1772161830565_wizard-image-3.jpg", "url": "https://pptqdicaaewtnaiflfcs.supabase.co/storage/v1/object/public/event-submissions/7fba402a-ca0f-4164-9715-f739e5e88fb3/f3dedf79-5c5e-40fd-9513-d0fb0995d429/1772161830184_wizard-image-3.jpg", "name": "wizard-image-3.jpg", "size": 150680, "type": "image/jpeg", "thumbnailUrl": "https://pptqdicaaewtnaiflfcs.supabase.co/storage/v1/object/public/event-submissions/7fba402a-ca0f-4164-9715-f739e5e88fb3/f3dedf79-5c5e-40fd-9513-d0fb0995d429/1772161830184_wizard-image-3.jpg"}]	1772161831000	1772074267000	\N	{}	\N	\N	\N
427ed2f9-c598-46cc-a0e6-69f1ac914b8b	665f1aab-e2ec-49b8-a691-f0134fac9861	f3dedf79-5c5e-40fd-9513-d0fb0995d429	\N	\N	\N	111111111111111111111111111111111111111111111	published	\N	\N	1771221772	1771252922326	1	1	10.00	1	image	225419b5-b7a7-4e6d-bcb2-3fb183c026f0	11	[{"id": "1771221771372_778.jpg", "url": "https://pptqdicaaewtnaiflfcs.supabase.co/storage/v1/object/public/event-submissions/665f1aab-e2ec-49b8-a691-f0134fac9861/f3dedf79-5c5e-40fd-9513-d0fb0995d429/1771221770358_778.jpg", "name": "778.jpg", "size": 90160, "type": "image/jpeg", "thumbnailUrl": "https://pptqdicaaewtnaiflfcs.supabase.co/storage/v1/object/public/event-submissions/665f1aab-e2ec-49b8-a691-f0134fac9861/f3dedf79-5c5e-40fd-9513-d0fb0995d429/1771221770358_778.jpg"}]	1771221772030	1771221772030	\N	{}	\N	\N	2026-02-16 11:17:20.339072+00
\.


--
-- Data for Name: event_works; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.event_works (id, event_id, work_id, user_id, participation_id, submitted_at, status, prize_rank, prize_title, prize_reward, judge_notes, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.exchange_records (id, user_id, product_id, product_name, product_category, points_cost, quantity, status, created_at, admin_notes, processed_by, processed_at, product_image, user_email, contact_phone, shipping_address, updated_at) FROM stdin;
d5031bf3-dce8-417c-a080-25268bdf5197	f3dedf79-5c5e-40fd-9513-d0fb0995d429	3a07821c-0b23-4921-bd31-6ad8cee234e8	数字艺术壁纸	virtual	800	1	refunded	2026-02-15 14:14:09.43995+00		admin	2026-02-25 02:19:24.475+00	\N	\N	\N	\N	2026-02-25 02:19:25.022673+00
fcbd3abf-6aa7-4a60-b1fe-f55d7dcd1e18	f3dedf79-5c5e-40fd-9513-d0fb0995d429	5b7088d9-7f94-4a21-97b6-c32efcb3894d	AI创作工具包	service	2000	1	refunded	2026-02-12 05:58:50.614083+00	\N	\N	\N	\N	\N	\N	\N	2026-02-25 13:12:38.392573+00
\.


--
-- Data for Name: favorites; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.feed_collects (id, feed_id, user_id, created_at) FROM stdin;
\.


--
-- Data for Name: feed_comment_likes; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.feed_comment_likes (user_id, comment_id, created_at) FROM stdin;
\.


--
-- Data for Name: feed_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.feed_likes (id, feed_id, user_id, created_at) FROM stdin;
\.


--
-- Data for Name: feedback_process_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.feedback_process_logs (id, feedback_id, admin_id, action, old_value, new_value, details, ip_address, created_at) FROM stdin;
\.


--
-- Data for Name: feeds; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.final_ranking_publishes (id, event_id, published_by, published_at, ranking_data, notification_sent, notification_sent_at, created_at) FROM stdin;
4d791422-a872-46e4-901a-5bee01d11731	665f1aab-e2ec-49b8-a691-f0134fac9861	f3dedf79-5c5e-40fd-9513-d0fb0995d429	2026-02-16 11:17:20.339072+00	[{"rank": 1, "title": "11", "avg_score": 10.00, "creator_id": "f3dedf79-5c5e-40fd-9513-d0fb0995d429", "judge_count": 1, "score_count": 1, "creator_name": "kvo1", "submitted_at": "1970-01-21T12:00:21.772+00:00", "submission_id": "427ed2f9-c598-46cc-a0e6-69f1ac914b8b", "creator_avatar": "https://pptqdicaaewtnaiflfcs.supabase.co/storage/v1/object/public/avatars/1770989704242-ekg3fmbcy1c.jpg"}]	t	2026-02-16 11:17:20.614874+00	2026-02-16 11:17:20.339072+00
09bda56a-dcf9-4577-8687-83fc8162cbd5	665f1aab-e2ec-49b8-a691-f0134fac9861	f3dedf79-5c5e-40fd-9513-d0fb0995d429	2026-02-16 11:17:31.669988+00	[{"rank": 1, "title": "11", "avg_score": 10.00, "creator_id": "f3dedf79-5c5e-40fd-9513-d0fb0995d429", "judge_count": 1, "score_count": 1, "creator_name": "kvo1", "submitted_at": "1970-01-21T12:00:21.772+00:00", "submission_id": "427ed2f9-c598-46cc-a0e6-69f1ac914b8b", "creator_avatar": "https://pptqdicaaewtnaiflfcs.supabase.co/storage/v1/object/public/avatars/1770989704242-ekg3fmbcy1c.jpg"}]	t	2026-02-16 11:17:31.936409+00	2026-02-16 11:17:31.669988+00
81edb641-1823-44dc-86a8-eeb27463fe1b	665f1aab-e2ec-49b8-a691-f0134fac9861	f3dedf79-5c5e-40fd-9513-d0fb0995d429	2026-02-16 11:31:30.979271+00	[{"rank": 1, "title": "11", "avg_score": 10.00, "creator_id": "f3dedf79-5c5e-40fd-9513-d0fb0995d429", "judge_count": 1, "score_count": 1, "creator_name": "kvo1", "submitted_at": "1970-01-21T12:00:21.772+00:00", "submission_id": "427ed2f9-c598-46cc-a0e6-69f1ac914b8b", "creator_avatar": "https://pptqdicaaewtnaiflfcs.supabase.co/storage/v1/object/public/avatars/1770989704242-ekg3fmbcy1c.jpg"}]	t	2026-02-16 11:31:31.296597+00	2026-02-16 11:31:30.979271+00
2ad4e237-a1a1-47cb-b4cf-83b3d38a78c0	665f1aab-e2ec-49b8-a691-f0134fac9861	f3dedf79-5c5e-40fd-9513-d0fb0995d429	2026-02-16 12:35:53.622343+00	[{"rank": 1, "title": "11", "avg_score": 10.00, "creator_id": "f3dedf79-5c5e-40fd-9513-d0fb0995d429", "judge_count": 1, "score_count": 1, "creator_name": "kvo1", "submitted_at": "1970-01-21T12:00:21.772+00:00", "submission_id": "427ed2f9-c598-46cc-a0e6-69f1ac914b8b", "creator_avatar": "https://pptqdicaaewtnaiflfcs.supabase.co/storage/v1/object/public/avatars/1770989704242-ekg3fmbcy1c.jpg"}]	t	2026-02-16 12:35:53.953463+00	2026-02-16 12:35:53.622343+00
\.


--
-- Data for Name: follows; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.forbidden_words (id, word, category, severity, is_regex, is_active, created_at, updated_at) FROM stdin;
424c79e1-918c-421d-a38c-c46429a8d4ae	暴力	violence	4	f	t	2026-02-24 04:05:11.208918+00	2026-02-24 04:05:11.208918+00
27fd7f0c-00a9-40ec-b348-f4de15deda2a	杀人	violence	5	f	t	2026-02-24 04:05:11.208918+00	2026-02-24 04:05:11.208918+00
d921769a-ff66-4d41-ae8e-a192a381f271	血腥	violence	4	f	t	2026-02-24 04:05:11.208918+00	2026-02-24 04:05:11.208918+00
25d63fca-f01c-40b9-8531-9db27c51219e	武器	violence	3	f	t	2026-02-24 04:05:11.208918+00	2026-02-24 04:05:11.208918+00
a8871250-6720-46ce-a908-966211d64ac7	炸弹	violence	5	f	t	2026-02-24 04:05:11.208918+00	2026-02-24 04:05:11.208918+00
2f7d7b2c-181e-47ef-b5e0-b0eae6ea44c7	枪支	violence	4	f	t	2026-02-24 04:05:11.208918+00	2026-02-24 04:05:11.208918+00
30972720-49f2-4e58-be35-ef1e3ac3057b	色情	pornography	4	f	t	2026-02-24 04:05:11.208918+00	2026-02-24 04:05:11.208918+00
8a0437ed-a180-41a0-93af-5bc300f4133d	淫秽	pornography	5	f	t	2026-02-24 04:05:11.208918+00	2026-02-24 04:05:11.208918+00
eecfb93f-d5b9-4c1f-8d1c-d30b1b323fb5	裸体	pornography	4	f	t	2026-02-24 04:05:11.208918+00	2026-02-24 04:05:11.208918+00
8937bb98-6efa-4e5c-94f5-4749af219d9c	性服务	pornography	5	f	t	2026-02-24 04:05:11.208918+00	2026-02-24 04:05:11.208918+00
b75fb667-8b6c-441c-bc88-ea6709c48107	反动	politics	5	f	t	2026-02-24 04:05:11.208918+00	2026-02-24 04:05:11.208918+00
f36f415a-9efc-40ba-ad03-f715dc4c9689	颠覆	politics	4	f	t	2026-02-24 04:05:11.208918+00	2026-02-24 04:05:11.208918+00
f62c1f52-c333-401a-9ba0-9b6a0cf64587	分裂	politics	4	f	t	2026-02-24 04:05:11.208918+00	2026-02-24 04:05:11.208918+00
d2f2e390-c2ff-48f0-9796-874b04f91d41	邪教	politics	5	f	t	2026-02-24 04:05:11.208918+00	2026-02-24 04:05:11.208918+00
e5d30557-4f24-4037-b68b-aa2395606015	刷单	spam	3	f	t	2026-02-24 04:05:11.208918+00	2026-02-24 04:05:11.208918+00
b0ce582f-228b-4661-850d-7fdf9e57d439	兼职赚钱	spam	3	f	t	2026-02-24 04:05:11.208918+00	2026-02-24 04:05:11.208918+00
ba4079b0-a916-4360-9590-6f20b218e11c	快速致富	spam	3	f	t	2026-02-24 04:05:11.208918+00	2026-02-24 04:05:11.208918+00
73d09717-f308-41a8-aa30-ef10b6eb04ea	免费领	spam	2	f	t	2026-02-24 04:05:11.208918+00	2026-02-24 04:05:11.208918+00
a0bb151c-2d48-488c-b0eb-ecb63d2af685	点击领取	spam	2	f	t	2026-02-24 04:05:11.208918+00	2026-02-24 04:05:11.208918+00
4e48a7bf-e220-4bfa-8822-88285ca4068f	限时抢购	spam	1	f	t	2026-02-24 04:05:11.208918+00	2026-02-24 04:05:11.208918+00
\.


--
-- Data for Name: friend_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.generation_tasks (id, user_id, type, status, params, progress, result, error, error_type, created_at, updated_at, started_at, completed_at) FROM stdin;
9f84ec9b-46ec-4ebb-aa18-7d62932a983e	f3dedf79-5c5e-40fd-9513-d0fb0995d429	image	pending	{"n": 4, "size": "1024x1024", "style": "auto", "prompt": "活动主题：杨柳青\\"年画新韵·匠心传承\\"文创设计大赛。活动简介：邀请创作者以杨柳青年画经典元素（娃娃、仕女、门神、胖娃娃抱鱼等）为灵感，进行文创产品设计、短视频创作或数字艺术创作。让千年年画技艺焕发新生，用现代语言讲述运河古镇的文化故事。。线上活动，需要展现数字化和互动感。", "quality": "hd"}	0	\N	\N	\N	2026-02-21 01:20:15.939292+00	2026-02-21 01:20:15.939292+00	\N	\N
332ce76a-fadd-4601-a0c0-69caaa305327	f3dedf79-5c5e-40fd-9513-d0fb0995d429	image	pending	{"n": 4, "size": "1024x1024", "style": "auto", "prompt": "活动主题：杨柳青\\"年画新韵·匠心传承\\"文创设计大赛。活动简介：邀请创作者以杨柳青年画经典元素（娃娃、仕女、门神、胖娃娃抱鱼等）为灵感，进行文创产品设计、短视频创作或数字艺术创作。让千年年画技艺焕发新生，用现代语言讲述运河古镇的文化故事。。线上活动，需要展现数字化和互动感。", "quality": "hd"}	0	\N	\N	\N	2026-02-21 01:25:03.605541+00	2026-02-21 01:25:03.605541+00	\N	\N
7f1e00c6-5c85-4c10-b4ea-0477f1ad7f49	f3dedf79-5c5e-40fd-9513-d0fb0995d429	image	pending	{"n": 4, "size": "1024x1024", "style": "auto", "prompt": "活动主题：杨柳青\\"年画新韵·匠心传承\\"文创设计大赛。活动简介：邀请创作者以杨柳青年画经典元素（娃娃、仕女、门神、胖娃娃抱鱼等）为灵感，进行文创产品设计、短视频创作或数字艺术创作。让千年年画技艺焕发新生，用现代语言讲述运河古镇的文化故事。。线上活动，需要展现数字化和互动感。", "quality": "hd"}	0	\N	\N	\N	2026-02-21 01:29:01.205849+00	2026-02-21 01:29:01.205849+00	\N	\N
\.


--
-- Data for Name: home_recommendations; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.home_recommendations (id, item_id, item_type, title, description, thumbnail, order_index, is_active, start_date, end_date, click_count, impression_count, created_by, created_at, updated_at, metadata) FROM stdin;
\.


--
-- Data for Name: hot_searches; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.hot_searches (id, query, search_count, unique_searchers, trend_score, category, is_active, last_searched_at, created_at, updated_at) FROM stdin;
05939013-f96d-4eb4-b7de-2d82a118aa68	ai	1	1	0.0000	\N	t	2026-02-11 11:22:55.740735+00	2026-02-11 11:22:55.740735+00	2026-02-11 11:22:55.740735+00
d542665a-1e63-4431-85d2-f54dc3edce01	学习	2	1	51.9863	\N	t	2026-02-11 11:28:15.835428+00	2026-02-11 11:27:53.02385+00	2026-02-11 11:28:15.835428+00
6989e26d-42ff-4921-a5d6-ad3038d280b1	老k	1	1	0.0000	\N	t	2026-02-11 13:14:41.74104+00	2026-02-11 13:14:41.74104+00	2026-02-11 13:14:41.74104+00
0f4ae866-c747-4789-b72b-fc9d3792c6a3	老字号	2	1	51.6005	\N	t	2026-02-11 13:26:20.73004+00	2026-02-11 13:15:11.771838+00	2026-02-11 13:26:20.73004+00
b869a14d-542d-4377-a790-a5b5261b53e4	夕阳西下	1	1	0.0000	\N	t	2026-02-13 13:29:54.264278+00	2026-02-13 13:29:54.264278+00	2026-02-13 13:29:54.264278+00
71121b2c-c200-4f08-9ff9-d4950b3678ac	杨柳青	2	1	51.9831	\N	t	2026-02-13 13:30:23.310235+00	2026-02-13 13:29:55.260694+00	2026-02-13 13:30:23.310235+00
8767830c-50be-4e5d-aee5-6f953374ca92	IP设计	1	1	0.0000	\N	t	2026-02-19 08:32:47.600281+00	2026-02-19 08:32:47.600281+00	2026-02-19 08:32:47.600281+00
2c73b460-4198-4586-a44c-7b681a5a0d1c	纹样设计	3	1	4.1552	\N	t	2026-02-23 07:22:44.608944+00	2026-02-11 13:15:20.780528+00	2026-02-23 07:22:44.608944+00
6e0c135d-9623-40c7-a824-ece4480dc7f0	AI	1	1	0.0000	\N	t	2026-02-23 09:06:29.38502+00	2026-02-23 09:06:29.38502+00	2026-02-23 09:06:29.38502+00
1e538240-62c5-42fd-9781-14d6d0c9351a	品牌设计	2	1	3.1291	\N	t	2026-02-27 01:49:03.484838+00	2026-02-11 10:58:42.032705+00	2026-02-27 01:49:03.484838+00
551ecb37-7078-4623-8716-cfbdaeb60ef4	海河	24	1	3.6700	\N	t	2026-03-02 15:07:50.451892+00	2026-02-11 11:12:36.468808+00	2026-03-02 15:07:50.451892+00
7bb7533d-d248-43d8-9363-badd840fd566	国潮设计	9	1	2.8120	\N	t	2026-03-03 10:32:28.429413+00	2026-02-11 10:58:40.263709+00	2026-03-03 10:32:28.429413+00
\.


--
-- Data for Name: inspiration_ai_suggestions; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.inspiration_ai_suggestions (id, node_id, type, content, prompt, confidence, is_applied, created_at) FROM stdin;
\.


--
-- Data for Name: inspiration_mindmaps; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.inspiration_stories (id, map_id, title, subtitle, full_story, key_turning_points, culture_elements, timeline, stats, themes, participants, generated_at) FROM stdin;
2273e967-153b-40f2-96a6-909666ce85b8	bf7e4729-11ee-441d-a7eb-930e40ffa0b3	我的创作脉络的创作故事	从灵感到成品的7个节点创作历程	# 我的创作脉络的创作故事\n\n这是一个充满创意的创作历程。\n\n## 第1步：【设计主题】\n陶瓷文化的创意衍生设计，从器皿到生活的设计延伸...\n创作时间: 2026/2/15 18:01:28\n\n## 第2步：【设计主题】\nAI生成艺术与传统美学的结合，以人机协作的创意...\n创作时间: 2026/2/15 18:36:47\n\n## 第3步：【设计主题】\n以海河两岸为核心的天津城市文化宣传画，展现九河...\n创作时间: 2026/2/15 18:42:27\n\n## 第4步：【设计主题】\n以海河两岸为核心的天津城市文化宣传画，展现九河...\n创作时间: 2026/2/15 18:42:34\n\n## 第5步：【设计主题】\n以海河两岸为核心的天津城市文化宣传画，展现九河...\n创作时间: 2026/2/15 18:43:01\n\n## 第6步：金黄酥脆\n油炸后的金黄色泽，代表富贵\n\n## 第7步：新节点\n---\n创作完成于 2026/2/15	[{"nodeId": "b5524c11-345d-4be8-a639-d22def0fd792", "timestamp": "2026-02-15T10:01:29.805Z", "description": "【设计主题】\\n陶瓷文化的创意衍生设计，从器皿到生活的设计延伸..."}, {"nodeId": "08a16779-664b-45a5-bbdc-a9573fa5ef20", "timestamp": "2026-02-15T10:36:47.724Z", "description": "【设计主题】\\nAI生成艺术与传统美学的结合，以人机协作的创意..."}, {"nodeId": "2aa79757-17ef-4379-9eaa-a513021d8856", "timestamp": "2026-02-15T10:42:28.151Z", "description": "【设计主题】\\n以海河两岸为核心的天津城市文化宣传画，展现九河..."}, {"nodeId": "ae7d585b-99f9-4bd4-844c-2badb10fe1fb", "timestamp": "2026-02-15T10:42:35.465Z", "description": "【设计主题】\\n以海河两岸为核心的天津城市文化宣传画，展现九河..."}, {"nodeId": "8d5180c1-27e4-4466-9883-6730c76f3780", "timestamp": "2026-02-15T10:43:02.029Z", "description": "【设计主题】\\n以海河两岸为核心的天津城市文化宣传画，展现九河..."}, {"nodeId": "62fdf297-07ba-4939-940a-3cca0683f390", "timestamp": "2026-02-15T10:44:29.351Z", "description": "金黄酥脆"}]	{}	[{"phase": "AI协作", "nodeIds": ["b5524c11-345d-4be8-a639-d22def0fd792"], "timestamp": "2026-02-15T10:01:29.805Z", "description": "【设计主题】\\n陶瓷文化的创意衍生设计，从器皿到生活的设计延伸..."}, {"phase": "AI协作", "nodeIds": ["08a16779-664b-45a5-bbdc-a9573fa5ef20"], "timestamp": "2026-02-15T10:36:47.724Z", "description": "【设计主题】\\nAI生成艺术与传统美学的结合，以人机协作的创意..."}, {"phase": "AI协作", "nodeIds": ["2aa79757-17ef-4379-9eaa-a513021d8856"], "timestamp": "2026-02-15T10:42:28.151Z", "description": "【设计主题】\\n以海河两岸为核心的天津城市文化宣传画，展现九河..."}, {"phase": "AI协作", "nodeIds": ["ae7d585b-99f9-4bd4-844c-2badb10fe1fb"], "timestamp": "2026-02-15T10:42:35.465Z", "description": "【设计主题】\\n以海河两岸为核心的天津城市文化宣传画，展现九河..."}, {"phase": "AI协作", "nodeIds": ["8d5180c1-27e4-4466-9883-6730c76f3780"], "timestamp": "2026-02-15T10:43:02.029Z", "description": "【设计主题】\\n以海河两岸为核心的天津城市文化宣传画，展现九河..."}, {"phase": "文化融合", "nodeIds": ["62fdf297-07ba-4939-940a-3cca0683f390"], "timestamp": "2026-02-15T10:44:29.351Z", "description": "金黄酥脆"}, {"phase": "灵感收集", "nodeIds": ["677a688d-8f78-4944-8794-7002d05478db"], "timestamp": "2026-02-15T10:45:14.297Z", "description": "新节点"}]	{"totalDuration": 4206431, "iterationCount": 8, "inspirationCount": 1, "aiInteractionCount": 5}	{}	{f3dedf79-5c5e-40fd-9513-d0fb0995d429}	2026-02-15 10:50:35.280692+00
\.


--
-- Data for Name: invitation_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.invitation_reports (id, reporter_id, invitation_id, reported_user_id, community_id, reason, description, status, resolved_by, resolved_at, resolution_note, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: invite_records; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.invite_records (id, inviter_id, invitee_id, invite_code, status, inviter_points, invitee_points, registered_at, completed_at, created_at) FROM stdin;
\.


--
-- Data for Name: ip_activities; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.ip_activities (id, user_id, type, title, description, ip_asset_id, is_read, created_at) FROM stdin;
d222cfa2-8658-430b-867f-18efd483daf2	f3dedf79-5c5e-40fd-9513-d0fb0995d429	progress	阶段完成: 创意设计	您的IP资产"津门古韵·杨柳青年画创新"已完成创意设计阶段	\N	f	2026-02-22 00:45:23.215826+00
dcb5ef85-bb38-42de-97f2-3843586440a4	f3dedf79-5c5e-40fd-9513-d0fb0995d429	progress	阶段完成: 创意设计	您的IP资产"津门古韵·杨柳青年画创新"已完成创意设计阶段	\N	f	2026-02-22 00:45:26.457293+00
e9d272c2-0c45-439d-9f0a-0053fcc79dab	f3dedf79-5c5e-40fd-9513-d0fb0995d429	progress	阶段完成: 版权存证	您的IP资产"津门古韵·杨柳青年画创新"已完成版权存证阶段	\N	f	2026-02-22 05:49:19.92226+00
\.


--
-- Data for Name: ip_assets; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.ip_assets (id, user_id, name, description, type, original_work_id, commercial_value, thumbnail, status, created_at, updated_at, reviewed_at, reviewed_by, review_notes, priority, is_featured, tags, cultural_elements, view_count, like_count) FROM stdin;
5b855639-c0be-4751-a935-bd7b8d0c5521	7f0fc120-f7d2-4e75-bc42-7220841c2b57	海河印象·纹样设计	提取海河两岸建筑轮廓与传统纹样，设计出具有地域特色的装饰纹样，可应用于家居用品、服装面料、包装纸等领域。	pattern	\N	25000	https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop	active	2026-01-10 09:00:00+00	2026-01-10 09:00:00+00	\N	\N	\N	medium	t	["纹样", "海河", "装饰艺术", "地域特色"]	["海河文化", "天津建筑", "传统纹样"]	256	89
57171b40-11d9-44fd-8f55-110b24cd1d9a	f3dedf79-5c5e-40fd-9513-d0fb0995d429	津门古韵·杨柳青年画创新	将传统杨柳青年画元素与现代插画风格融合，创作出具有天津特色的国潮插画系列	design	\N	5000	data:image/jpeg;base64,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	active	2026-02-26 13:26:48.280548+00	2026-02-26 13:26:48.280548+00	\N	\N	\N	medium	f	[]	[]	0	0
57786755-ec01-4b92-9706-2d281bd1f8ef	7f0fc120-f7d2-4e75-bc42-7220841c2b57	泥人张·3D数字藏品	以天津泥人张传统技艺为灵感，创作3D数字艺术藏品，结合区块链技术，打造具有收藏价值的数字艺术品。	3d_model	\N	35000	https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=300&fit=crop	active	2026-02-01 10:00:00+00	2026-02-28 00:58:24.891593+00	\N	\N	\N	high	t	["3D模型", "数字藏品", "区块链", "非遗"]	["泥人张", "天津非遗", "数字艺术"]	312	156
dbbfbef4-a918-4756-9a89-d46847fa4bbd	7f0fc120-f7d2-4e75-bc42-7220841c2b57	津门古韵·杨柳青年画创新	将传统杨柳青年画元素与现代插画风格融合，创作出具有天津特色的国潮插画系列，适用于文创产品、包装设计等多种商业场景。	illustration	\N	15000	https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=400&h=300&fit=crop	active	2026-01-15 10:00:00+00	2026-02-28 00:58:27.939316+00	\N	\N	\N	high	t	["年画", "传统文化", "数字艺术", "国潮"]	["杨柳青年画", "津门文化", "民间艺术"]	128	45
dad791ba-76ce-4ca5-b11c-b0ab5510b154	f3dedf79-5c5e-40fd-9513-d0fb0995d429	津门古韵·杨柳青年画创新	将传统杨柳青年画元素与现代插画风格融合，创作出具有天津特色的国潮插画系列	illustration	\N	5000	data:image/jpeg;base64,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	active	2026-02-26 14:23:02.663016+00	2026-02-28 00:58:30.876938+00	\N	\N	\N	medium	f	[]	[]	0	0
\.


--
-- Data for Name: ip_partnerships; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.ip_partnerships (id, ip_asset_id, opportunity_id, user_id, brand_name, description, reward, status, notes, contract_url, started_at, completed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: ip_stages; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.ip_stages (id, ip_asset_id, name, description, order_index, completed, completed_at, created_at, updated_at) FROM stdin;
35f0b1d5-e0c0-46c9-af95-47b4a599038a	57171b40-11d9-44fd-8f55-110b24cd1d9a	创意设计	完成原创设计作品	1	f	\N	2026-02-26 13:26:48.280548+00	2026-02-26 13:26:48.280548+00
3fa0612c-b0b4-40eb-8ca0-2f865c9aee6e	dbbfbef4-a918-4756-9a89-d46847fa4bbd	创意设计	完成原创设计作品	1	t	2026-01-15 10:00:00+00	2026-02-26 11:19:29.97041+00	2026-02-26 11:19:29.97041+00
d7faa638-ab13-424e-9dc1-c93d75874b79	dbbfbef4-a918-4756-9a89-d46847fa4bbd	版权存证	完成作品版权存证	2	t	2026-01-20 14:30:00+00	2026-02-26 11:19:29.97041+00	2026-02-26 11:19:29.97041+00
e4915ac0-7468-4c54-9f96-e7df87f498f1	dbbfbef4-a918-4756-9a89-d46847fa4bbd	IP孵化	将设计转化为IP资产	3	f	\N	2026-02-26 11:19:29.97041+00	2026-02-26 11:19:29.97041+00
e57aa5ce-f8b9-49c2-8f7f-5998abb813e3	dbbfbef4-a918-4756-9a89-d46847fa4bbd	商业合作	对接品牌合作机会	4	f	\N	2026-02-26 11:19:29.97041+00	2026-02-26 11:19:29.97041+00
39014e1a-60f8-431a-861b-fba44ce5d206	dbbfbef4-a918-4756-9a89-d46847fa4bbd	收益分成	获得作品收益分成	5	f	\N	2026-02-26 11:19:29.97041+00	2026-02-26 11:19:29.97041+00
1ef1a7da-d246-41b5-afe3-2dca25acb52b	5b855639-c0be-4751-a935-bd7b8d0c5521	创意设计	完成原创设计作品	1	t	2026-01-10 09:00:00+00	2026-02-26 11:19:29.97041+00	2026-02-26 11:19:29.97041+00
6f5128e7-fa3b-40e6-8233-4d2584c343a7	5b855639-c0be-4751-a935-bd7b8d0c5521	版权存证	完成作品版权存证	2	t	2026-01-12 16:00:00+00	2026-02-26 11:19:29.97041+00	2026-02-26 11:19:29.97041+00
519c637d-0cb2-4e93-99b8-aa18c68793d8	5b855639-c0be-4751-a935-bd7b8d0c5521	IP孵化	将设计转化为IP资产	3	t	2026-01-18 11:00:00+00	2026-02-26 11:19:29.97041+00	2026-02-26 11:19:29.97041+00
60f7c028-0ff5-45e8-8f33-d8f2f84a4473	5b855639-c0be-4751-a935-bd7b8d0c5521	商业合作	对接品牌合作机会	4	f	\N	2026-02-26 11:19:29.97041+00	2026-02-26 11:19:29.97041+00
55ef4690-130d-4363-b0ce-39e2ab78e76a	5b855639-c0be-4751-a935-bd7b8d0c5521	收益分成	获得作品收益分成	5	f	\N	2026-02-26 11:19:29.97041+00	2026-02-26 11:19:29.97041+00
a6203725-0591-4d79-9b5f-76437face776	57786755-ec01-4b92-9706-2d281bd1f8ef	创意设计	完成原创设计作品	1	t	2026-02-01 10:00:00+00	2026-02-26 11:19:29.97041+00	2026-02-26 11:19:29.97041+00
b8179dce-0c01-435f-8487-0773efc086fa	57786755-ec01-4b92-9706-2d281bd1f8ef	版权存证	完成作品版权存证	2	f	\N	2026-02-26 11:19:29.97041+00	2026-02-26 11:19:29.97041+00
bcf48dc0-742c-4227-85ce-97a7a14d7b31	57786755-ec01-4b92-9706-2d281bd1f8ef	IP孵化	将设计转化为IP资产	3	f	\N	2026-02-26 11:19:29.97041+00	2026-02-26 11:19:29.97041+00
8118da71-b8ff-4073-b1bb-ae6b3cf1dcb6	57786755-ec01-4b92-9706-2d281bd1f8ef	商业合作	对接品牌合作机会	4	f	\N	2026-02-26 11:19:29.97041+00	2026-02-26 11:19:29.97041+00
663d8367-d115-41a5-826e-3fabc5cd1a9a	57786755-ec01-4b92-9706-2d281bd1f8ef	收益分成	获得作品收益分成	5	f	\N	2026-02-26 11:19:29.97041+00	2026-02-26 11:19:29.97041+00
c558c1fa-4d45-4ea2-8c46-ba0a945cdb15	57171b40-11d9-44fd-8f55-110b24cd1d9a	版权存证	完成作品版权存证	2	f	\N	2026-02-26 13:26:48.280548+00	2026-02-26 13:26:48.280548+00
fef1ec7f-1411-41f7-9662-58cf3457c53d	57171b40-11d9-44fd-8f55-110b24cd1d9a	IP孵化	将设计转化为IP资产	3	f	\N	2026-02-26 13:26:48.280548+00	2026-02-26 13:26:48.280548+00
9f4bc209-77bd-4bd3-98fa-eddd79d22fc4	57171b40-11d9-44fd-8f55-110b24cd1d9a	商业合作	对接品牌合作机会	4	f	\N	2026-02-26 13:26:48.280548+00	2026-02-26 13:26:48.280548+00
5b87c1b6-7254-4701-8a02-c0df0f498227	57171b40-11d9-44fd-8f55-110b24cd1d9a	收益分成	获得作品收益分成	5	f	\N	2026-02-26 13:26:48.280548+00	2026-02-26 13:26:48.280548+00
81e12bd5-2e04-44c6-9d5e-c313b567f7df	dad791ba-76ce-4ca5-b11c-b0ab5510b154	创意设计	完成原创设计作品	1	f	\N	2026-02-26 14:23:02.663016+00	2026-02-26 14:23:02.663016+00
f0962287-a7a9-4c37-aa44-2281c1e25c0d	dad791ba-76ce-4ca5-b11c-b0ab5510b154	版权存证	完成作品版权存证	2	f	\N	2026-02-26 14:23:02.663016+00	2026-02-26 14:23:02.663016+00
82d8cecd-fb62-4058-a685-69d7ed1fe287	dad791ba-76ce-4ca5-b11c-b0ab5510b154	IP孵化	将设计转化为IP资产	3	f	\N	2026-02-26 14:23:02.663016+00	2026-02-26 14:23:02.663016+00
bff4d299-aacb-43e3-b039-b0d6499652e5	dad791ba-76ce-4ca5-b11c-b0ab5510b154	商业合作	对接品牌合作机会	4	f	\N	2026-02-26 14:23:02.663016+00	2026-02-26 14:23:02.663016+00
ed88d73f-c4ca-4996-b5c4-207c1b32b437	dad791ba-76ce-4ca5-b11c-b0ab5510b154	收益分成	获得作品收益分成	5	f	\N	2026-02-26 14:23:02.663016+00	2026-02-26 14:23:02.663016+00
\.


--
-- Data for Name: likes; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.lottery_activities (id, name, description, status, start_time, end_time, spin_cost, daily_limit, total_limit, created_by, created_at, updated_at) FROM stdin;
3140cd84-c41c-40a7-8267-07aa7fd29975	幸运大转盘	消耗积分参与抽奖，赢取丰厚奖励	active	2026-03-01 09:33:24.332375+00	2027-03-01 09:33:24.332375+00	50	-1	-1	\N	2026-03-01 09:33:24.332375+00	2026-03-01 09:33:24.332375+00
\.


--
-- Data for Name: lottery_prizes; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.lottery_prizes (id, activity_id, name, description, probability, points, stock, image_url, sort_order, is_enabled, is_rare, created_at) FROM stdin;
cde342a0-4187-43f7-9b03-89c78ff4a1ec	3140cd84-c41c-40a7-8267-07aa7fd29975	谢谢参与	很遗憾，这次没有中奖	0.1500	0	-1	\N	0	t	f	2026-03-01 09:33:24.332375+00
f3252701-29f1-44ed-8781-92c79b5224c6	3140cd84-c41c-40a7-8267-07aa7fd29975	虚拟红包	价值10积分的虚拟红包	0.2000	10	-1	\N	1	t	f	2026-03-01 09:33:24.332375+00
e73c454b-bde1-4edf-af35-92a357bd4fd8	3140cd84-c41c-40a7-8267-07aa7fd29975	创室贴纸包	创意工作室贴纸包	0.1800	50	1000	\N	2	t	f	2026-03-01 09:33:24.332375+00
bf17f811-e3ee-4144-8c91-eca725a8a8e4	3140cd84-c41c-40a7-8267-07aa7fd29975	AI 创作工具包	AI创作工具包，助力创作	0.1200	100	500	\N	3	t	f	2026-03-01 09:33:24.332375+00
30dfe75f-2217-4727-91f2-d1f6087c5dfb	3140cd84-c41c-40a7-8267-07aa7fd29975	谢谢参与	很遗憾，这次没有中奖	0.1500	0	-1	\N	4	t	f	2026-03-01 09:33:24.332375+00
39afa5af-234a-4093-bd16-d3fba6ccb2a8	3140cd84-c41c-40a7-8267-07aa7fd29975	专属成就徽章	限量版专属成就徽章	0.0500	500	100	\N	5	t	t	2026-03-01 09:33:24.332375+00
38b89d67-a290-4152-aa89-2219105d85e7	3140cd84-c41c-40a7-8267-07aa7fd29975	数字壁纸	精美数字壁纸	0.1200	20	2000	\N	6	t	f	2026-03-01 09:33:24.332375+00
2608d5b6-2497-46b3-84a3-af95b6e9e693	3140cd84-c41c-40a7-8267-07aa7fd29975	￥10 红包	价值1000积分的现金红包	0.0300	1000	50	\N	7	t	t	2026-03-01 09:33:24.332375+00
\.


--
-- Data for Name: lottery_spin_records; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.lottery_spin_records (id, activity_id, user_id, prize_id, cost, ip_address, user_agent, created_at) FROM stdin;
e00c90f5-9468-4f9e-b407-34cb2e0f46c1	3140cd84-c41c-40a7-8267-07aa7fd29975	f3dedf79-5c5e-40fd-9513-d0fb0995d429	30dfe75f-2217-4727-91f2-d1f6087c5dfb	50	\N	\N	2026-03-01 10:44:29.995+00
f43f14c7-c3c7-4d74-a592-6d40a387a666	3140cd84-c41c-40a7-8267-07aa7fd29975	f3dedf79-5c5e-40fd-9513-d0fb0995d429	f3252701-29f1-44ed-8781-92c79b5224c6	50	\N	\N	2026-03-01 10:44:40.416+00
c8219e92-3bca-4397-8b2a-f33a96787153	3140cd84-c41c-40a7-8267-07aa7fd29975	f3dedf79-5c5e-40fd-9513-d0fb0995d429	bf17f811-e3ee-4144-8c91-eca725a8a8e4	50	\N	\N	2026-03-03 07:49:37.593+00
\.


--
-- Data for Name: membership_benefits; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.membership_benefits (id, membership_level, benefit, sort_order) FROM stdin;
1	free	基础AI创作功能	1
\.


--
-- Data for Name: membership_benefits_config; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.membership_benefits_config (id, level, name, description, features, limits, pricing, is_active, created_at, updated_at) FROM stdin;
40163c3c-a175-40ec-9069-7ad547ea13cb	free	免费会员	基础AI创作体验	[{"id": "ai_generation", "icon": "Wand2", "name": "AI生成次数", "value": "10次/天"}, {"id": "ai_model", "icon": "Zap", "name": "AI模型访问", "value": "基础模型"}, {"id": "image_generation", "icon": "Image", "name": "图像生成", "value": true}, {"id": "video_generation", "icon": "Video", "name": "视频生成", "value": false}, {"id": "audio_generation", "icon": "Music", "name": "音频生成", "value": false}, {"id": "text_generation", "icon": "FileText", "name": "文案生成", "value": true}, {"id": "templates", "icon": "Palette", "name": "模板库", "value": "基础模板"}, {"id": "layers", "icon": "Layers", "name": "图层编辑", "value": "基础功能"}, {"id": "export", "icon": "Download", "name": "导出功能", "value": "带水印"}, {"id": "storage", "icon": "Cloud", "name": "云存储空间", "value": "1GB"}, {"id": "priority", "icon": "Clock", "name": "优先处理", "value": false}, {"id": "commercial", "icon": "Shield", "name": "商业授权", "value": false}]	{"storageGB": 1, "watermark": true, "maxResolution": "1080p", "exportsPerMonth": 5, "aiGenerationsPerDay": 10}	{"monthly": {"price": 0, "period": "永久"}}	t	2026-02-11 07:49:54.803692+00	2026-02-11 07:49:54.803692+00
e94d3df9-1cc3-4e64-a309-efe59c61b574	premium	高级会员	解锁高级AI创作功能	[{"id": "ai_generation", "icon": "Wand2", "name": "AI生成次数", "value": "无限"}, {"id": "ai_model", "icon": "Zap", "name": "AI模型访问", "value": "高级模型"}, {"id": "image_generation", "icon": "Image", "name": "图像生成", "value": true}, {"id": "video_generation", "icon": "Video", "name": "视频生成", "value": true}, {"id": "audio_generation", "icon": "Music", "name": "音频生成", "value": true}, {"id": "text_generation", "icon": "FileText", "name": "文案生成", "value": true}, {"id": "templates", "icon": "Palette", "name": "模板库", "value": "专属模板库"}, {"id": "layers", "icon": "Layers", "name": "图层编辑", "value": "完整功能"}, {"id": "export", "icon": "Download", "name": "导出功能", "value": "高清无水印"}, {"id": "storage", "icon": "Cloud", "name": "云存储空间", "value": "50GB"}, {"id": "priority", "icon": "Clock", "name": "优先处理", "value": true}, {"id": "commercial", "icon": "Shield", "name": "商业授权", "value": false}]	{"storageGB": 50, "watermark": false, "maxResolution": "4K", "exportsPerMonth": 100, "aiGenerationsPerDay": null}	{"yearly": {"price": 899, "period": "年", "discount": "7.6折", "originalPrice": 1188}, "monthly": {"price": 99, "period": "月"}, "quarterly": {"price": 269, "period": "季度", "discount": "9折", "originalPrice": 297}}	t	2026-02-11 07:49:54.803692+00	2026-02-11 07:49:54.803692+00
d54d87f4-8381-4c50-8cbc-825cea9ca62c	vip	VIP会员	享受顶级AI创作体验	[{"id": "ai_generation", "icon": "Wand2", "name": "AI生成次数", "value": "无限"}, {"id": "ai_model", "icon": "Zap", "name": "AI模型访问", "value": "专属模型"}, {"id": "image_generation", "icon": "Image", "name": "图像生成", "value": true}, {"id": "video_generation", "icon": "Video", "name": "视频生成", "value": true}, {"id": "audio_generation", "icon": "Music", "name": "音频生成", "value": true}, {"id": "text_generation", "icon": "FileText", "name": "文案生成", "value": true}, {"id": "templates", "icon": "Palette", "name": "模板库", "value": "全部模板"}, {"id": "layers", "icon": "Layers", "name": "图层编辑", "value": "完整功能"}, {"id": "export", "icon": "Download", "name": "导出功能", "value": "超高清无水印"}, {"id": "storage", "icon": "Cloud", "name": "云存储空间", "value": "无限"}, {"id": "priority", "icon": "Clock", "name": "优先处理", "value": "最高优先级"}, {"id": "commercial", "icon": "Shield", "name": "商业授权", "value": true}]	{"storageGB": null, "watermark": false, "maxResolution": "8K", "exportsPerMonth": null, "aiGenerationsPerDay": null}	{"yearly": {"price": 1799, "period": "年", "discount": "7.5折", "originalPrice": 2388}, "monthly": {"price": 199, "period": "月"}, "quarterly": {"price": 539, "period": "季度", "discount": "9折", "originalPrice": 597}}	t	2026-02-11 07:49:54.803692+00	2026-02-11 07:49:54.803692+00
\.


--
-- Data for Name: membership_coupon_usage; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.membership_coupon_usage (id, coupon_id, user_id, order_id, discount_amount, used_at) FROM stdin;
\.


--
-- Data for Name: membership_coupons; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.membership_coupons (id, code, name, description, discount_type, discount_value, min_purchase_amount, max_discount_amount, applicable_plans, usage_limit, usage_count, valid_from, valid_until, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: membership_history; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.membership_history (id, user_id, action_type, from_level, to_level, order_id, notes, created_at) FROM stdin;
\.


--
-- Data for Name: membership_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.membership_orders (id, user_id, plan, plan_name, period, amount, currency, status, payment_method, payment_data, created_at, paid_at, expires_at, refunded_at, refund_amount, metadata, payment_type, payment_code, payment_proof, payer_info, verified_by, verified_at, notes) FROM stdin;
ORD-1771300458163-ydeutelqb	f3dedf79-5c5e-40fd-9513-d0fb0995d429	premium	高级会员	monthly	99.00	CNY	pending	wechat	\N	2026-02-17 03:54:18.163+00	\N	\N	\N	\N	{}	enterprise	\N	\N	\N	\N	\N	\N
ORD-1771305795869-wti3qlau7	f3dedf79-5c5e-40fd-9513-d0fb0995d429	vip	VIP会员	monthly	199.00	CNY	pending	wechat	\N	2026-02-17 05:23:15.869+00	\N	\N	\N	\N	{}	enterprise	\N	\N	\N	\N	\N	\N
ORD-1771581144452-yvirec6xg	f3dedf79-5c5e-40fd-9513-d0fb0995d429	vip	VIP会员	monthly	199.00	CNY	completed	wechat	\N	2026-02-20 09:52:24.452+00	2026-02-20 09:52:34.832+00	2026-03-22 09:52:34.832+00	\N	\N	{}	enterprise	\N	\N	\N	\N	\N	\N
ORD-1771584131678-o14qj6xw8	f3dedf79-5c5e-40fd-9513-d0fb0995d429	premium	高级会员	monthly	99.00	CNY	pending	wechat	\N	2026-02-20 10:42:11.678+00	\N	2026-02-21 10:42:11.678+00	\N	\N	{"notes": null, "payer_info": null, "verified_at": null, "verified_by": null, "payment_code": "VIPQJ6XW813", "payment_type": "personal_qr", "payment_proof": null}	enterprise	\N	\N	\N	\N	\N	\N
ORD-1771680216303-bioyjr0jz	f3dedf79-5c5e-40fd-9513-d0fb0995d429	premium	高级会员	monthly	99.00	CNY	pending	wechat	\N	2026-02-21 13:23:36.303+00	\N	2026-02-22 13:23:36.303+00	\N	\N	{"notes": null, "payer_info": null, "verified_at": null, "verified_by": null, "payment_code": "VIPYJR0JZ63", "payment_type": "personal_qr", "payment_proof": null}	enterprise	\N	\N	\N	\N	\N	\N
ORD-1771766390594-p5b83up7a	f3dedf79-5c5e-40fd-9513-d0fb0995d429	premium	高级会员	monthly	99.00	CNY	pending	wechat	\N	2026-02-22 13:19:50.594+00	\N	2026-02-23 13:19:50.594+00	\N	\N	{"notes": null, "payer_info": null, "verified_at": null, "verified_by": null, "payment_code": "VIP83UP7A12", "payment_type": "personal_qr", "payment_proof": null}	enterprise	\N	\N	\N	\N	\N	\N
ORD-1772008213311-ikfa3sf7k	f3dedf79-5c5e-40fd-9513-d0fb0995d429	premium	高级会员	monthly	99.00	CNY	completed	wechat	\N	2026-02-25 08:30:13.311+00	2026-02-25 08:30:26.219+00	2026-02-26 08:30:13.311+00	\N	\N	{"notes": null, "payer_info": {"name": "1"}, "verified_at": null, "verified_by": null, "payment_code": "VIPA3SF7K84", "payment_type": "personal_qr", "payment_proof": {"notes": "1", "payerName": "1", "submittedAt": "2026-02-25T08:30:26.218Z", "screenshotUrl": null, "transactionId": "1"}}	enterprise	\N	\N	\N	\N	\N	\N
ORD-1772250543342-pgoz6b85u	f3dedf79-5c5e-40fd-9513-d0fb0995d429	premium	高级会员	monthly	99.00	CNY	pending	wechat	\N	2026-02-28 03:49:03.342+00	\N	2026-03-01 03:49:03.342+00	\N	\N	{"notes": null, "payer_info": null, "verified_at": null, "verified_by": null, "payment_code": "VIPZ6B85U64", "payment_type": "personal_qr", "payment_proof": null}	enterprise	\N	\N	\N	\N	\N	\N
ORD-1772250488257-99tkrwnjl	f3dedf79-5c5e-40fd-9513-d0fb0995d429	premium	高级会员	monthly	99.00	CNY	completed	wechat	\N	2026-02-28 03:48:08.257+00	2026-02-28 03:48:17.315+00	2026-03-01 03:48:08.257+00	\N	\N	{"notes": null, "payer_info": {"name": "1"}, "verified_at": null, "verified_by": null, "payment_code": "VIPKRWNJL89", "payment_type": "personal_qr", "payment_proof": {"notes": "1", "payerName": "1", "submittedAt": "2026-02-28T03:48:17.315Z", "screenshotUrl": null, "transactionId": "1"}}	enterprise	\N	\N	\N	\N	2026-02-28 14:08:24.941+00	审核通过
\.


--
-- Data for Name: membership_usage_stats; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.membership_usage_stats (id, user_id, stat_date, ai_generations_count, storage_used_bytes, exports_count, api_calls_count, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: memberships; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.memberships (id, user_id, plan_type, status, amount, start_date, end_date, payment_method, transaction_id, metadata, created_at, updated_at) FROM stdin;
775c2040-7b75-47a6-9f75-5d9778feb00a	44b4e1e2-1e70-4f44-a97f-053cd16cfd06	quarterly	active	299.00	2026-02-13 09:58:31.9514	2027-01-14 04:46:36.304477	card	TXN855682	{}	2026-02-28 06:54:35.029961	2026-02-28 06:54:35.029961
e4ac3141-42bb-4f94-9fb2-8dc88fc80d82	00e1a36a-a77b-4bcc-b604-c5655a4ce802	yearly	active	79.90	2026-02-14 19:03:57.85504	2027-01-12 14:36:18.282391	card	TXN746150	{}	2026-02-28 06:54:35.029961	2026-02-28 06:54:35.029961
226acaa4-778f-4a43-9468-6588d4cb3dbf	2689ba70-b3b9-4425-b01a-fab003b29072	yearly	active	299.00	2026-01-29 05:06:43.12399	2026-03-27 14:33:55.522229	alipay	TXN120885	{}	2026-02-28 06:54:35.029961	2026-02-28 06:54:35.029961
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.moderation_logs (id, content_id, content_type, user_id, action, reason, scores, matched_words, created_at) FROM stdin;
ec7e069f-57b4-4832-8741-93899555d89f	d1be492e-e524-46f4-928a-40a16a5dfd5e	work	f3dedf79-5c5e-40fd-9513-d0fb0995d429	auto_approved	\N	{"spam_score": 20, "max_severity": 0, "ai_risk_score": 0, "authenticity_score": 40}	{}	2026-02-24 12:44:24.279383+00
769d5273-3cf8-4731-87a4-97ea1c981f61	1b6b8229-a8af-42a7-8921-7be54a7b2a31	work	00e1a36a-a77b-4bcc-b604-c5655a4ce802	auto_approved	\N	{"spam_score": 0, "max_severity": 0, "ai_risk_score": 0, "authenticity_score": 25}	{}	2026-02-24 14:02:10.440742+00
7d7e1823-77f1-451f-a670-ec45efd34385	01b8dbc8-f771-4caf-9778-d30aee36223e	work	00e1a36a-a77b-4bcc-b604-c5655a4ce802	auto_approved	\N	{"spam_score": 0, "max_severity": 0, "ai_risk_score": 0, "authenticity_score": 10}	{}	2026-02-25 10:44:57.565772+00
66aa5613-f02f-461b-bd16-dc50563883a6	f0a2a4d3-7aec-497a-a131-01f029779841	work	00e1a36a-a77b-4bcc-b604-c5655a4ce802	auto_approved	\N	{"spam_score": 0, "max_severity": 0, "ai_risk_score": 0, "authenticity_score": 10}	{}	2026-02-25 10:44:59.973447+00
0950a3a7-8e8c-4b73-91ef-48ddff8bfc9b	39fa98ba-37e2-4dd2-aab1-61c809687b53	work	00e1a36a-a77b-4bcc-b604-c5655a4ce802	auto_approved	\N	{"spam_score": 0, "max_severity": 0, "ai_risk_score": 0, "authenticity_score": 10}	{}	2026-02-25 10:45:03.376335+00
a0c45535-790b-4a16-8e21-c0fa9eb072b8	20842242-0a8a-4038-8e57-ee65b47cd80f	work	f3dedf79-5c5e-40fd-9513-d0fb0995d429	auto_approved	\N	{"spam_score": 0, "max_severity": 0, "ai_risk_score": 0, "authenticity_score": 10}	{}	2026-02-25 14:28:26.128942+00
09daa6f7-4925-4d17-a176-0c7717999134	605f8510-9c9f-4386-8bff-3c09330041ab	work	478c134c-c5c2-4c01-827b-d142352d4873	auto_approved	\N	{"spam_score": 0, "max_severity": 0, "ai_risk_score": 0, "authenticity_score": 0}	{}	2026-02-26 06:11:25.061714+00
7be31a9f-5a86-476c-a9b4-0df3485cde11	2fd01bbd-8c15-421a-85c6-903b87a0f8ff	work	f3dedf79-5c5e-40fd-9513-d0fb0995d429	auto_approved	\N	{"spam_score": 20, "max_severity": 0, "ai_risk_score": 0, "authenticity_score": 40}	{}	2026-02-26 08:08:14.942994+00
043a49b6-ca34-48c5-bd53-e3c851702e78	d0bcc13e-6b16-48bf-bace-271ea56a3111	work	f3dedf79-5c5e-40fd-9513-d0fb0995d429	auto_approved	\N	{"spam_score": 20, "max_severity": 0, "ai_risk_score": 0, "authenticity_score": 40}	{}	2026-02-26 08:33:22.72035+00
602a5b61-2bea-408b-9f08-ea6b5c152f09	bf602891-e06f-42d2-8508-b2e442df3d11	work	f3dedf79-5c5e-40fd-9513-d0fb0995d429	auto_approved	\N	{"spam_score": 20, "max_severity": 0, "ai_risk_score": 0, "authenticity_score": 40}	{}	2026-02-26 08:42:43.834826+00
80f5b522-2e70-4f6e-bfb4-24e6ed7e94da	4cef1fc0-a8db-4302-97d2-353ef8c711cf	work	f3dedf79-5c5e-40fd-9513-d0fb0995d429	auto_approved	\N	{"spam_score": 20, "max_severity": 0, "ai_risk_score": 0, "authenticity_score": 40}	{}	2026-02-26 13:20:24.47553+00
bbd5ade9-05f6-4115-9b53-f11f6a46fddb	5b570749-fb6c-492c-9940-31a9251b2138	work	f3dedf79-5c5e-40fd-9513-d0fb0995d429	auto_approved	\N	{"spam_score": 0, "max_severity": 0, "ai_risk_score": 0, "authenticity_score": 10}	{}	2026-02-26 13:44:25.202675+00
a7e047f2-f2c5-482d-872d-dd873b86c715	00b60847-ff1e-46b4-a393-b333ecf68309	work	f3dedf79-5c5e-40fd-9513-d0fb0995d429	auto_approved	\N	{"spam_score": 0, "max_severity": 0, "ai_risk_score": 0, "authenticity_score": 10}	{}	2026-02-26 14:51:24.980873+00
d0c57b6a-bf50-4988-97d2-9536ca7db6f2	14c994e4-f7e3-4dae-a4cd-36ee0a1af001	work	f3dedf79-5c5e-40fd-9513-d0fb0995d429	auto_approved	\N	{"spam_score": 0, "max_severity": 0, "ai_risk_score": 0, "authenticity_score": 10}	{}	2026-02-27 05:25:10.821508+00
2b8ad04d-265f-496c-8c27-c0bf1a65cbc3	eb4d68a8-a16a-4c0a-aa06-0f062136f33d	work	f3dedf79-5c5e-40fd-9513-d0fb0995d429	auto_approved	\N	{"spam_score": 0, "max_severity": 0, "ai_risk_score": 0, "authenticity_score": 40}	{}	2026-02-27 06:38:22.345148+00
0007b4c7-2c2b-4fd4-8e7e-10dc54efb9eb	62fc1f06-0e14-45e8-8a91-1d9d7ee263af	work	f3dedf79-5c5e-40fd-9513-d0fb0995d429	auto_approved	\N	{"spam_score": 20, "max_severity": 0, "ai_risk_score": 0, "authenticity_score": 40}	{}	2026-03-03 05:55:57.367326+00
0c8e6f85-72d1-4b5a-8c72-de82ebd4c77b	f93d9aa2-5d1e-48c9-a3f1-2c97f09eaa2f	work	f3dedf79-5c5e-40fd-9513-d0fb0995d429	auto_approved	\N	{"spam_score": 0, "max_severity": 0, "ai_risk_score": 0, "authenticity_score": 35}	{}	2026-03-03 14:51:18.327266+00
bbe46762-9919-487b-a276-044937752759	c66deb5a-5bb7-4e4e-9f3d-f39a459c0824	work	00e1a36a-a77b-4bcc-b604-c5655a4ce802	auto_approved	\N	{"spam_score": 25, "max_severity": 0, "ai_risk_score": 0, "authenticity_score": 0}	{}	2026-03-04 07:34:09.325065+00
\.


--
-- Data for Name: moderation_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.moderation_rules (id, name, rule_type, enabled, threshold, auto_action, config, created_at, updated_at) FROM stdin;
156cd1d2-ddc3-47e6-baa7-cddcb7b6e27f	敏感词检测	sensitive_words	t	1	reject	{"match_mode": "exact", "case_sensitive": false}	2026-02-24 04:05:11.208918+00	2026-02-24 04:05:11.208918+00
1ef0b7a7-5a62-4355-8f29-df3625daf1e9	垃圾内容识别	spam_detection	t	70	flag	{"check_patterns": ["repetitive", "url_spam", "short_content"]}	2026-02-24 04:05:11.208918+00	2026-02-24 04:05:11.208918+00
20e41163-d288-494d-8e0f-42d0489ef86e	AI生成内容检测	ai_generated	t	85	flag	{"min_text_length": 50}	2026-02-24 04:05:11.208918+00	2026-02-24 04:05:11.208918+00
1033079c-a5c0-4873-9638-b0ef9659bb5a	文化真实性评估	cultural_authenticity	t	60	flag	{"min_cultural_score": 30}	2026-02-24 04:05:11.208918+00	2026-02-24 04:05:11.208918+00
\.


--
-- Data for Name: new_content_boost_pool; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.new_content_boost_pool (id, content_id, quality_score, test_performance, boost_factor, boost_start_time, boost_end_time, current_status, total_exposure, total_clicks, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.notifications (id, user_id, sender_id, type, title, content, data, link, is_read, read_at, created_at, comment_id, post_id, work_id, sender_name, community_id, priority) FROM stdin;
7c76e761-499b-47cc-bfd9-7f267621b436	478c134c-c5c2-4c01-827b-d142352d4873	\N	system	1	11	{"target": "all", "notification_type": "system", "admin_notification_id": "6f86df57-c118-41c6-b90c-bc44fbd2262e"}	\N	f	\N	2026-02-25 01:46:42.466+00	\N	\N	\N	\N	\N	\N
96cff09e-bd3f-4f0b-85db-0ed6b63a744d	78340927-c853-4978-a90f-f54d7c6883d2	\N	system	1	11	{"target": "all", "notification_type": "system", "admin_notification_id": "6f86df57-c118-41c6-b90c-bc44fbd2262e"}	\N	f	\N	2026-02-25 01:46:42.466+00	\N	\N	\N	\N	\N	\N
758cc1e7-fd5b-49ee-b1a2-0fc749fb5954	16781e4a-3941-476f-855e-f5e9f9de8576	\N	system	1	11	{"target": "all", "notification_type": "system", "admin_notification_id": "6f86df57-c118-41c6-b90c-bc44fbd2262e"}	\N	f	\N	2026-02-25 01:46:42.466+00	\N	\N	\N	\N	\N	\N
a969bff7-a0f5-41da-a087-2768b1d3fe34	06dbee08-83b6-4d14-a5c1-d0794c8a168e	\N	system	1	11	{"target": "all", "notification_type": "system", "admin_notification_id": "6f86df57-c118-41c6-b90c-bc44fbd2262e"}	\N	f	\N	2026-02-25 01:46:42.466+00	\N	\N	\N	\N	\N	\N
b7d586a7-c61e-4ec4-bd67-68d100e59f6b	d0f6c86d-27ad-416f-a57a-992948c1a2a7	\N	system	1	11	{"target": "all", "notification_type": "system", "admin_notification_id": "6f86df57-c118-41c6-b90c-bc44fbd2262e"}	\N	f	\N	2026-02-25 01:46:42.466+00	\N	\N	\N	\N	\N	\N
b9b68514-4cce-4783-9a12-41568ca8186d	45713305-2bc4-48ad-8733-265a379be671	\N	system	1	11	{"target": "all", "notification_type": "system", "admin_notification_id": "6f86df57-c118-41c6-b90c-bc44fbd2262e"}	\N	f	\N	2026-02-25 01:46:42.466+00	\N	\N	\N	\N	\N	\N
b6fb6297-c28a-415a-a091-1000af0fc2e3	44b4e1e2-1e70-4f44-a97f-053cd16cfd06	\N	system	1	11	{"target": "all", "notification_type": "system", "admin_notification_id": "6f86df57-c118-41c6-b90c-bc44fbd2262e"}	\N	f	\N	2026-02-25 01:46:42.466+00	\N	\N	\N	\N	\N	\N
d0d6ca36-65f5-4081-9f6f-4a19caaf3660	478c134c-c5c2-4c01-827b-d142352d4873	\N	system	2	2	{"target": "all", "notification_type": "system", "admin_notification_id": "42dd92eb-3902-423d-af3b-98680311081f"}	\N	f	\N	2026-02-25 02:17:24.641+00	\N	\N	\N	\N	\N	\N
4fc01573-4da3-4ca0-820e-5cc214ea4977	78340927-c853-4978-a90f-f54d7c6883d2	\N	system	2	2	{"target": "all", "notification_type": "system", "admin_notification_id": "42dd92eb-3902-423d-af3b-98680311081f"}	\N	f	\N	2026-02-25 02:17:24.641+00	\N	\N	\N	\N	\N	\N
51043d6c-726d-4e86-8b6f-777ec78755fb	16781e4a-3941-476f-855e-f5e9f9de8576	\N	system	2	2	{"target": "all", "notification_type": "system", "admin_notification_id": "42dd92eb-3902-423d-af3b-98680311081f"}	\N	f	\N	2026-02-25 02:17:24.641+00	\N	\N	\N	\N	\N	\N
0a2c09a8-d90f-4fee-9e52-75f5442e5668	06dbee08-83b6-4d14-a5c1-d0794c8a168e	\N	system	2	2	{"target": "all", "notification_type": "system", "admin_notification_id": "42dd92eb-3902-423d-af3b-98680311081f"}	\N	f	\N	2026-02-25 02:17:24.641+00	\N	\N	\N	\N	\N	\N
b2cab2de-48e4-41df-822a-2b0283484b6b	d0f6c86d-27ad-416f-a57a-992948c1a2a7	\N	system	2	2	{"target": "all", "notification_type": "system", "admin_notification_id": "42dd92eb-3902-423d-af3b-98680311081f"}	\N	f	\N	2026-02-25 02:17:24.641+00	\N	\N	\N	\N	\N	\N
a28c0865-8541-465b-8e32-9413d5a0a2e4	45713305-2bc4-48ad-8733-265a379be671	\N	system	2	2	{"target": "all", "notification_type": "system", "admin_notification_id": "42dd92eb-3902-423d-af3b-98680311081f"}	\N	f	\N	2026-02-25 02:17:24.641+00	\N	\N	\N	\N	\N	\N
f8bfbbdf-606a-462d-9df8-1287d9ef1187	44b4e1e2-1e70-4f44-a97f-053cd16cfd06	\N	system	2	2	{"target": "all", "notification_type": "system", "admin_notification_id": "42dd92eb-3902-423d-af3b-98680311081f"}	\N	f	\N	2026-02-25 02:17:24.641+00	\N	\N	\N	\N	\N	\N
c7c4736f-cef0-4dd9-b79a-b823499897c9	f3dedf79-5c5e-40fd-9513-d0fb0995d429	\N	system	2	2	{"target": "all", "notification_type": "system", "admin_notification_id": "42dd92eb-3902-423d-af3b-98680311081f"}	\N	t	2026-02-25 05:59:54.485+00	2026-02-25 02:17:24.641+00	\N	\N	\N	\N	\N	\N
603586ba-8961-457e-b182-d0de415ebd64	f3dedf79-5c5e-40fd-9513-d0fb0995d429	\N	system	1	11	{"target": "all", "notification_type": "system", "admin_notification_id": "6f86df57-c118-41c6-b90c-bc44fbd2262e"}	\N	t	2026-02-25 05:59:56.759+00	2026-02-25 01:46:42.466+00	\N	\N	\N	\N	\N	\N
4167de12-0891-40ea-9005-2a71ba453ae0	f3dedf79-5c5e-40fd-9513-d0fb0995d429	478c134c-c5c2-4c01-827b-d142352d4873	work_liked	作品被点赞	kvo 点赞了你的作品《瓷韵日常：釉色生活设计》	{"priority": "low", "sender_name": "kvo"}	/work/4345df09-6927-40c6-b715-321204d64507	t	2026-02-25 09:58:36.901+00	2026-02-25 09:58:04.211+00	\N	\N	\N	\N	\N	\N
7e5a38a5-a10f-4f89-abe4-95e5b1af3d5a	f3dedf79-5c5e-40fd-9513-d0fb0995d429	478c134c-c5c2-4c01-827b-d142352d4873	mention	有人在评论中提到了你	kvo 在作品《瓷韵日常：釉色生活设计》的评论中提到了你	{"priority": "medium", "sender_name": "kvo", "sender_avatar": "https://pptqdicaaewtnaiflfcs.supabase.co/storage/v1/object/public/avatars/1770794604568-o0c44sphex.jpg"}	/work/4345df09-6927-40c6-b715-321204d64507	t	2026-02-25 10:35:42.828+00	2026-02-25 10:35:35.53+00	\N	\N	\N	\N	\N	\N
25453aa5-a3a0-4588-856f-17403c6401e7	00e1a36a-a77b-4bcc-b604-c5655a4ce802	\N	system	2	2	{"target": "all", "notification_type": "system", "admin_notification_id": "42dd92eb-3902-423d-af3b-98680311081f"}	\N	t	2026-02-25 10:36:55.355+00	2026-02-25 02:17:24.641+00	\N	\N	\N	\N	\N	\N
a7709a9a-7eea-4d29-a40e-bdd1621ef9f3	00e1a36a-a77b-4bcc-b604-c5655a4ce802	\N	system	1	11	{"target": "all", "notification_type": "system", "admin_notification_id": "6f86df57-c118-41c6-b90c-bc44fbd2262e"}	\N	t	2026-02-25 10:36:58.048+00	2026-02-25 01:46:42.466+00	\N	\N	\N	\N	\N	\N
b2844c22-6041-48d2-8599-75184c5d695a	478c134c-c5c2-4c01-827b-d142352d4873	f3dedf79-5c5e-40fd-9513-d0fb0995d429	mention	有人在评论中提到了你	kvo1 在作品《海河之韵：津门水岸风光》的评论中提到了你	{"priority": "medium", "sender_name": "kvo1", "sender_avatar": "https://pptqdicaaewtnaiflfcs.supabase.co/storage/v1/object/public/avatars/1770989704242-ekg3fmbcy1c.jpg"}	/work/b3603cf0-f046-4751-bc74-5358d79381a9	f	\N	2026-02-25 13:15:16.213+00	\N	\N	\N	\N	\N	\N
ae2821cd-8de5-45ee-9e17-22ab914f8671	00e1a36a-a77b-4bcc-b604-c5655a4ce802	f3dedf79-5c5e-40fd-9513-d0fb0995d429	mention	有人在评论中提到了你	kvo1 在作品《海河之韵：津门水岸风光》的评论中提到了你	{"priority": "medium", "sender_name": "kvo1", "sender_avatar": "https://pptqdicaaewtnaiflfcs.supabase.co/storage/v1/object/public/avatars/1770989704242-ekg3fmbcy1c.jpg"}	/work/b3603cf0-f046-4751-bc74-5358d79381a9	t	2026-02-25 13:28:42.471+00	2026-02-25 13:15:16.213+00	\N	\N	\N	\N	\N	\N
e6f65ff1-26bf-4dca-b400-24c06e1a0a8c	f3dedf79-5c5e-40fd-9513-d0fb0995d429	00e1a36a-a77b-4bcc-b604-c5655a4ce802	mention	有人在评论中提到了你	开心 在作品《风筝魏·燕子竹骨纸鸢》的评论中提到了你	{"priority": "medium", "sender_name": "开心", "sender_avatar": "https://pptqdicaaewtnaiflfcs.supabase.co/storage/v1/object/public/avatars/1770895080912-yxd80ze0o9c.jpg"}	/work/bd064ca2-79f7-4ca5-9ad2-4c36b17b1489	t	2026-02-25 13:37:50.295+00	2026-02-25 13:37:22.443+00	\N	\N	\N	\N	\N	\N
697b4dad-f228-40f9-817c-f6a18a346789	f3dedf79-5c5e-40fd-9513-d0fb0995d429	00e1a36a-a77b-4bcc-b604-c5655a4ce802	mention	有人在评论中提到了你	开心 在作品《风筝魏·燕子竹骨纸鸢》的评论中提到了你	{"priority": "medium", "sender_name": "开心", "sender_avatar": "https://pptqdicaaewtnaiflfcs.supabase.co/storage/v1/object/public/avatars/1770895080912-yxd80ze0o9c.jpg"}	/work/bd064ca2-79f7-4ca5-9ad2-4c36b17b1489	t	2026-02-25 13:38:24.639+00	2026-02-25 13:37:57.39+00	\N	\N	\N	\N	\N	\N
866100c7-0616-4705-b963-cc1014d9f156	478c134c-c5c2-4c01-827b-d142352d4873	f3dedf79-5c5e-40fd-9513-d0fb0995d429	mention	有人在评论中提到了你	kvo1 在作品《风筝魏·燕子竹骨纸鸢》的评论中提到了你	{"priority": "medium", "sender_name": "kvo1", "sender_avatar": "https://pptqdicaaewtnaiflfcs.supabase.co/storage/v1/object/public/avatars/1770989704242-ekg3fmbcy1c.jpg"}	/work/bd064ca2-79f7-4ca5-9ad2-4c36b17b1489	f	\N	2026-03-01 12:10:00.934+00	\N	\N	\N	\N	\N	\N
1e8c8993-69ae-4600-b001-1517bd4dd6b1	00e1a36a-a77b-4bcc-b604-c5655a4ce802	f3dedf79-5c5e-40fd-9513-d0fb0995d429	mention	有人在评论中提到了你	kvo1 在作品《风筝魏·燕子竹骨纸鸢》的评论中提到了你	{"priority": "medium", "sender_name": "kvo1", "sender_avatar": "https://pptqdicaaewtnaiflfcs.supabase.co/storage/v1/object/public/avatars/1770989704242-ekg3fmbcy1c.jpg"}	/work/bd064ca2-79f7-4ca5-9ad2-4c36b17b1489	t	2026-03-02 15:05:41.477+00	2026-03-01 12:10:19.791+00	\N	\N	\N	\N	\N	\N
4b3372f0-da30-4509-8357-5fda35381b52	f3dedf79-5c5e-40fd-9513-d0fb0995d429	00e1a36a-a77b-4bcc-b604-c5655a4ce802	mention	有人在评论中提到了你	开心 在作品《天津文化设计灵感》的评论中提到了你	{"priority": "medium", "sender_name": "开心", "sender_avatar": "https://pptqdicaaewtnaiflfcs.supabase.co/storage/v1/object/public/avatars/1770895080912-yxd80ze0o9c.jpg"}	/work/32e023c3-ebef-4296-b862-d669be8e2b5c	t	2026-03-04 13:07:45.977+00	2026-03-04 07:48:47.069+00	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: order_applications; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.order_applications (id, order_id, creator_id, creator_name, creator_avatar, status, message, portfolio_url, review_note, reviewed_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: order_audits; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.order_audits (id, order_id, user_id, title, brand_name, type, description, budget_min, budget_max, deadline, duration, location, max_applicants, difficulty, requirements, tags, attachments, status, audit_opinion, audited_by, audited_at, created_at, updated_at) FROM stdin;
934eeb49-25e1-4d08-be3c-bb5b5c2c77d0	order_1772270215013	f3dedf79-5c5e-40fd-9513-d0fb0995d429	111	1111111111111	design	1111111111111111111111111	1000.00	5000.00	2026-03-01 00:00:00+00	7天	远程	10	medium	{11,11}	{}	{}	approved		f3dedf79-5c5e-40fd-9513-d0fb0995d429	2026-02-28 09:20:25.069+00	2026-02-28 09:16:55.013+00	2026-02-28 09:20:25.069+00
\.


--
-- Data for Name: order_execution_clicks; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.order_execution_clicks (id, execution_id, user_id, clicked_at, converted, sale_amount, ip_address, user_agent) FROM stdin;
\.


--
-- Data for Name: order_execution_daily_stats; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.order_execution_daily_stats (id, execution_id, date, clicks, conversions, sales, earnings) FROM stdin;
\.


--
-- Data for Name: order_executions; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.order_executions (id, order_id, user_id, work_id, order_title, brand_name, product_name, product_url, product_image, commission_rate, status, click_count, conversion_count, total_sales, total_earnings, created_at, updated_at) FROM stdin;
34d50882-02d5-4afa-9021-2f53a33d26a8	934eeb49-25e1-4d08-be3c-bb5b5c2c77d0	f3dedf79-5c5e-40fd-9513-d0fb0995d429	\N	111	1111111111111	111		\N	10.00	active	0	0	0.00	0.00	2026-02-28 09:48:09.356+00	2026-02-28 09:48:09.356+00
805c114e-66ba-4992-a5b8-beda57e27d8f	934eeb49-25e1-4d08-be3c-bb5b5c2c77d0	f3dedf79-5c5e-40fd-9513-d0fb0995d429	\N	111	1111111111111	111		\N	10.00	active	0	0	0.00	0.00	2026-02-28 09:48:27.289+00	2026-02-28 09:48:27.289+00
135a98bf-d15c-4fb5-b557-8ca17eee0ead	934eeb49-25e1-4d08-be3c-bb5b5c2c77d0	f3dedf79-5c5e-40fd-9513-d0fb0995d429	\N	111	1111111111111	111		\N	10.00	active	0	0	0.00	0.00	2026-02-28 09:52:03.531+00	2026-02-28 09:52:03.531+00
6d65f062-b29a-4836-8c9e-35bd5519b2c0	934eeb49-25e1-4d08-be3c-bb5b5c2c77d0	f3dedf79-5c5e-40fd-9513-d0fb0995d429	\N	111	1111111111111	111		\N	10.00	active	0	0	0.00	0.00	2026-02-28 09:52:30.441+00	2026-02-28 09:52:30.441+00
\.


--
-- Data for Name: organizer_backups; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.organizer_backups (id, organizer_id, type, size, file_path, download_url, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: organizer_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.organizer_settings (id, organizer_id, brand_info, security_settings, notification_settings, permission_settings, data_management_settings, created_at, updated_at) FROM stdin;
26772964-dee2-482e-b98a-8ecf04028e99	268834b4-7c03-4ff5-b520-96e07c1b1c71	{"logo": "", "name": "", "contactName": "", "description": "", "contactEmail": "", "contactPhone": ""}	{"sessionTimeout": 30, "twoFactorEnabled": false, "loginNotification": true, "allowedLoginMethods": ["password", "email"], "passwordLastChanged": "2026-02-26T00:45:00.727Z"}	{"sms": {"enabled": false, "securityAlerts": true, "importantUpdates": false}, "email": {"dailyDigest": false, "statusChange": true, "weeklyReport": true, "newSubmission": true, "securityAlerts": true, "marketingUpdates": false}, "inApp": {"like": false, "follow": false, "system": true, "comment": true, "message": true, "newSubmission": true}}	{"members": [], "defaultRole": "editor", "allowMemberInvite": true, "requireApprovalForEvents": true}	{"autoBackup": true, "exportFormat": "excel", "backupFrequency": "weekly", "backupRetentionDays": 30}	2026-02-26 00:45:00.727+00	2026-02-26 00:45:00.727+00
\.


--
-- Data for Name: page_views; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.pending_messages (id, user_id, content, context, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: points; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.points (id, user_id, amount, type, reason, related_id, related_type, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: points_limits; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.points_limits (id, user_id, source_type, period_type, period_start, period_end, limit_amount, used_amount, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: points_records; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.points_records (id, user_id, points, type, source, source_type, description, balance_after, related_id, related_type, metadata, created_at, expires_at) FROM stdin;
9333b363-5490-4ffd-9785-a30fe2d05f58	f3dedf79-5c5e-40fd-9513-d0fb0995d429	10	earned	系统修复	daily	修复积分系统，初始化积分	10	\N	\N	{}	2026-02-09 14:09:57.871513+00	\N
d0aeac72-335b-4188-bc5d-e9e8054263b8	f3dedf79-5c5e-40fd-9513-d0fb0995d429	5	earned	每日签到	daily	每日签到获得 5 积分	15	\N	\N	{}	2026-02-10 01:45:39.19596+00	\N
29f27deb-84e1-4e14-8ea2-bdbdfeb1174e	00e1a36a-a77b-4bcc-b604-c5655a4ce802	5	earned	每日签到	daily	每日签到获得 5 积分	5	\N	\N	{}	2026-02-10 03:27:10.736531+00	\N
7b2e24df-deae-4635-b451-8295206e62d5	478c134c-c5c2-4c01-827b-d142352d4873	5	earned	每日签到	daily	每日签到获得 5 积分	5	\N	\N	{}	2026-02-10 13:15:25.310405+00	\N
2b5c1d70-a23d-4026-b2d0-a5ed7a610669	06dbee08-83b6-4d14-a5c1-d0794c8a168e	5	earned	每日签到	daily	每日签到获得 5 积分	5	\N	\N	{}	2026-02-10 13:40:11.939079+00	\N
55c46fbe-98d1-4ec5-83b9-214e51a1ac3a	f3dedf79-5c5e-40fd-9513-d0fb0995d429	15	earned	每日签到	daily	连续签到 3 天，获得 15 积分（含 10 额外奖励）	30	\N	\N	{}	2026-02-11 01:00:52.582216+00	\N
d7b25286-c859-4813-bdce-dbed1b48eac1	f3dedf79-5c5e-40fd-9513-d0fb0995d429	5	earned	每日签到	daily	每日签到获得 5 积分	35	\N	\N	{}	2026-02-12 00:50:58.457551+00	\N
e8c32f0b-be59-47df-a982-ea0e016d7327	478c134c-c5c2-4c01-827b-d142352d4873	5	earned	每日签到	daily	每日签到获得 5 积分	10	\N	\N	{}	2026-02-12 05:23:38.612729+00	\N
4f0fda3f-fd74-4aed-bd40-56e83dc35e5b	f3dedf79-5c5e-40fd-9513-d0fb0995d429	-2000	spent	积分商城	exchange	兑换商品：AI创作工具包 x1	1500	\N	\N	{}	2026-02-12 05:58:50.614083+00	\N
dc6fbb59-c29a-498f-a4e7-b7608a5a70f8	00e1a36a-a77b-4bcc-b604-c5655a4ce802	5	earned	每日签到	daily	每日签到获得 5 积分	10	\N	\N	{}	2026-02-12 11:17:06.007056+00	\N
c5b4ef71-b221-497f-b118-f0a8b0198fee	00e1a36a-a77b-4bcc-b604-c5655a4ce802	15	earned	每日签到	daily	连续签到 3 天，获得 15 积分（含 10 额外奖励）	25	\N	\N	{}	2026-02-13 11:05:00.284739+00	\N
79fb478e-a407-41dd-aa34-c6199a434d98	f3dedf79-5c5e-40fd-9513-d0fb0995d429	5	earned	每日签到	daily	每日签到获得 5 积分	1505	\N	\N	{}	2026-02-13 14:17:57.975175+00	\N
baba4006-5be8-4688-9eb3-c3e37694938f	f3dedf79-5c5e-40fd-9513-d0fb0995d429	5	earned	每日签到	daily	每日签到获得 5 积分	1510	\N	\N	{}	2026-02-15 14:08:52.843916+00	\N
9c1b9dd9-de73-4d68-b564-1f24c7686f9e	f3dedf79-5c5e-40fd-9513-d0fb0995d429	-800	spent	积分商城	exchange	兑换商品：数字艺术壁纸 x1	710	\N	\N	{}	2026-02-15 14:14:09.43995+00	\N
37a99b4c-af37-4c33-b2aa-6b0b7757bb94	f3dedf79-5c5e-40fd-9513-d0fb0995d429	35	earned	每日签到	daily	连续签到 7 天，获得 35 积分（含 30 额外奖励）	745	\N	\N	{}	2026-02-16 01:36:02.538709+00	\N
3e70f311-4593-4753-8959-107429dd7f6d	f3dedf79-5c5e-40fd-9513-d0fb0995d429	5	earned	每日签到	daily	每日签到获得 5 积分	750	\N	\N	{}	2026-02-17 02:24:11.37358+00	\N
d115b878-383b-431d-8f87-f052be37d619	00e1a36a-a77b-4bcc-b604-c5655a4ce802	5	earned	每日签到	daily	每日签到获得 5 积分	30	\N	\N	{}	2026-02-20 06:22:28.369392+00	\N
b051b2c3-629d-437b-b863-8f636556af38	00e1a36a-a77b-4bcc-b604-c5655a4ce802	5	earned	每日签到	daily	每日签到获得 5 积分	35	\N	\N	{}	2026-02-20 06:22:28.602072+00	\N
cba61a40-b82e-4514-837b-e272976656cd	45713305-2bc4-48ad-8733-265a379be671	5	earned	每日签到	daily	每日签到获得 5 积分	5	\N	\N	{}	2026-02-20 13:32:13.581119+00	\N
3605d33f-e0d5-4fd2-b6d0-46be5e3f5d23	06dbee08-83b6-4d14-a5c1-d0794c8a168e	15	earned	每日签到	daily	连续签到 3 天，获得 15 积分（含 10 额外奖励）	20	\N	\N	{}	2026-02-22 13:34:41.082414+00	\N
17b65517-5f4a-40c3-abfc-2f65dcda9c8f	06dbee08-83b6-4d14-a5c1-d0794c8a168e	5	earned	每日签到	daily	每日签到获得 5 积分	25	\N	\N	{}	2026-02-23 09:03:42.933518+00	\N
b41ba50f-8b43-4d56-979d-854325d0351f	f3dedf79-5c5e-40fd-9513-d0fb0995d429	5	earned	每日签到	daily	每日签到获得 5 积分	755	\N	\N	{}	2026-02-24 07:18:45.18124+00	\N
de38b100-bd3c-442e-8fb7-0754192f8409	00e1a36a-a77b-4bcc-b604-c5655a4ce802	5	earned	每日签到	daily	每日签到获得 5 积分	40	\N	\N	{}	2026-02-24 12:23:26.402139+00	\N
f7608145-c981-48e1-b89f-1ba98072a7e2	06dbee08-83b6-4d14-a5c1-d0794c8a168e	5	earned	每日签到	daily	每日签到获得 5 积分	30	\N	\N	{}	2026-02-24 13:24:14.76651+00	\N
e30c5311-c978-4130-8e11-e0d750ecf40e	f3dedf79-5c5e-40fd-9513-d0fb0995d429	5	earned	每日签到	daily	每日签到获得 5 积分	760	\N	\N	{}	2026-02-26 01:29:11.278476+00	\N
0c35158a-df1f-4bd9-ae96-a29c392cd6bf	06dbee08-83b6-4d14-a5c1-d0794c8a168e	5	earned	每日签到	daily	每日签到获得 5 积分	35	\N	\N	{}	2026-02-26 13:20:50.336301+00	\N
e384ddb5-5eec-452a-83cc-bba5be9440b2	f3dedf79-5c5e-40fd-9513-d0fb0995d429	5	earned	每日签到	daily	每日签到获得 5 积分	765	\N	\N	{}	2026-02-28 01:45:54.454308+00	\N
0f1c7815-ead1-41df-be2e-37bd1f51f379	f3dedf79-5c5e-40fd-9513-d0fb0995d429	-50	spent	大转盘抽奖	exchange	抽奖消耗	715	\N	\N	{}	2026-03-01 10:28:16.670875+00	\N
6d29e3cf-6503-4bb1-9c78-b02a71bb44db	f3dedf79-5c5e-40fd-9513-d0fb0995d429	-50	spent	大转盘抽奖	exchange	抽奖消耗	665	\N	\N	{}	2026-03-01 10:35:27.989282+00	\N
78e5c663-8965-4449-8376-bfa2af0f3977	f3dedf79-5c5e-40fd-9513-d0fb0995d429	-50	spent	大转盘抽奖	exchange	抽奖消耗	615	\N	\N	{}	2026-03-01 10:35:50.244964+00	\N
d1b23b39-cd36-47b8-b5a9-94a2f4796e17	f3dedf79-5c5e-40fd-9513-d0fb0995d429	-50	spent	大转盘抽奖	exchange	抽奖消耗	565	\N	\N	{}	2026-03-01 10:39:35.785896+00	\N
58aa6652-93a7-4822-812c-fece8799d944	f3dedf79-5c5e-40fd-9513-d0fb0995d429	-50	spent	大转盘抽奖	exchange	抽奖消耗	515	\N	\N	{}	2026-03-01 10:44:29.28579+00	\N
ba0825b3-30d0-4476-a519-bf5f8f13db19	f3dedf79-5c5e-40fd-9513-d0fb0995d429	-50	spent	大转盘抽奖	exchange	抽奖消耗	465	\N	\N	{}	2026-03-01 10:44:39.693286+00	\N
a20f9ea1-b090-4e2d-9538-a1940ba50f21	f3dedf79-5c5e-40fd-9513-d0fb0995d429	-50	spent	大转盘抽奖	exchange	抽奖消耗	415	\N	\N	{}	2026-03-03 07:49:37.792772+00	\N
\.


--
-- Data for Name: points_rules; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.points_rules (id, name, description, rule_type, source_type, points, daily_limit, weekly_limit, monthly_limit, yearly_limit, is_active, priority, conditions, created_at, updated_at) FROM stdin;
73683564-fb04-4dca-95f1-facfb6c06987	每日签到	每日签到获得基础积分	earn	checkin	5	1	\N	\N	\N	t	100	{}	2026-02-08 15:54:22.04437+00	2026-02-08 15:54:22.04437+00
5f4a5fa5-fc00-41f7-8a3d-5c9b40ef10dd	连续3天签到奖励	连续签到3天额外奖励	earn	checkin	10	1	\N	\N	\N	t	90	{}	2026-02-08 15:54:22.04437+00	2026-02-08 15:54:22.04437+00
a236126e-0d29-4b8b-beb3-738168d8785a	连续7天签到奖励	连续签到7天额外奖励	earn	checkin	30	1	\N	\N	\N	t	80	{}	2026-02-08 15:54:22.04437+00	2026-02-08 15:54:22.04437+00
b6d4e8ec-bfa0-4a3c-8c1c-530717c789f2	连续30天签到奖励	连续签到30天超级奖励	earn	checkin	100	1	\N	\N	\N	t	70	{}	2026-02-08 15:54:22.04437+00	2026-02-08 15:54:22.04437+00
c98b8162-2c3c-4b88-90d9-d36d27ca9273	任务完成	完成任务获得积分	earn	task	10	10	\N	\N	\N	t	100	{}	2026-02-08 15:54:22.04437+00	2026-02-08 15:54:22.04437+00
df99daab-c2fc-42a7-931e-0a9855787e43	成就解锁	解锁成就获得积分	earn	achievement	50	\N	\N	\N	\N	t	100	{}	2026-02-08 15:54:22.04437+00	2026-02-08 15:54:22.04437+00
72b01888-7566-4638-be63-cfa563c6bdde	发布作品	发布新作品获得积分	earn	achievement	50	\N	\N	\N	\N	t	80	{}	2026-02-09 08:48:13.903635+00	2026-02-09 08:48:13.903635+00
760db05c-824d-47ba-bdc6-369c4ae356c7	作品被点赞	作品被点赞获得积分	earn	achievement	5	100	\N	\N	\N	t	70	{}	2026-02-09 08:48:13.903635+00	2026-02-09 08:48:13.903635+00
64567d64-054f-42b4-9f3b-0773429b30fd	邀请好友	邀请新用户注册	earn	invite	100	\N	\N	\N	\N	t	60	{}	2026-02-09 08:48:13.903635+00	2026-02-09 08:48:13.903635+00
4c361bf9-31ef-425b-8a4a-1f87091b2cd3	消费返积分	消费金额按比例返积分	earn	consumption	10	\N	\N	\N	\N	t	50	{}	2026-02-09 08:48:13.903635+00	2026-02-09 08:48:13.903635+00
\.


--
-- Data for Name: post_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.post_tags (post_id, tag_id) FROM stdin;
\.


--
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.prize_winners (id, event_id, user_id, prize_id, won_at, claimed, claimed_at, shipping_info, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: product_links; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.product_links (id, work_id, order_id, product_name, product_url, product_image, price, commission_rate, click_count, conversion_count, created_at) FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.promoted_works (id, order_id, work_id, user_id, package_type, target_type, metric_type, start_time, end_time, target_views, actual_views, target_clicks, actual_clicks, promotion_weight, priority_score, display_position, is_featured, status, daily_views, daily_clicks, total_cost, metadata, created_at, updated_at) FROM stdin;
ce4f7249-3ad7-4e59-85d2-2af154ba9a93	e34ecd58-27ef-4caf-9cfb-413734f24a85	bd064ca2-79f7-4ca5-9ad2-4c36b17b1489	78340927-c853-4978-a90f-f54d7c6883d2	standard	account	views	2026-03-01 03:35:20.691491+00	2026-03-02 03:35:20.691491+00	1000	0	50	0	1.00	100.00	0	f	paused	0	0	0.00	{}	2026-03-01 03:35:20.691491+00	2026-03-01 05:19:13.252259+00
5a6c60c9-a2a6-4d0c-a783-ed12c44dccba	bf366c2e-de1d-42dc-90b1-b0bb5a66fa5b	81e2a0cb-5dfa-42ad-b9ed-2a40d78c45f4	f3dedf79-5c5e-40fd-9513-d0fb0995d429	standard	account	views	2026-02-27 09:21:11.066704+00	2026-02-28 09:21:11.066704+00	1000	57	50	0	1.00	0.00	0	f	paused	0	0	0.00	{}	2026-02-27 09:21:11.066704+00	2026-03-01 05:19:14.930941+00
afe8d3a8-bf68-48b0-890c-d2e915b806cc	8edbdc5c-df6e-40c4-89de-e8f0d448565a	91a03020-6700-4831-aa51-9300110b5c49	f3dedf79-5c5e-40fd-9513-d0fb0995d429	standard	account	views	2026-02-27 09:13:35.400827+00	2026-02-28 09:13:35.400827+00	1000	60	50	0	1.00	0.00	0	f	paused	0	0	0.00	{}	2026-02-27 09:13:35.400827+00	2026-03-01 05:19:17.78048+00
\.


--
-- Data for Name: promotion_applications; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.promotion_applications (id, user_id, application_type, contact_name, contact_phone, contact_email, company_name, business_license, company_address, promotion_channels, promotion_experience, expected_monthly_budget, social_accounts, status, reviewed_by, reviewed_at, review_notes, rejection_reason, promotion_permissions, total_orders, total_spent, total_views, total_conversions, created_at, updated_at, approved_at) FROM stdin;
\.


--
-- Data for Name: promotion_audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.promotion_audit_logs (id, application_id, user_id, action, previous_status, new_status, notes, reason, performed_by, performed_by_role, changes, created_at) FROM stdin;
\.


--
-- Data for Name: promotion_coupon_usage; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.promotion_coupon_usage (id, user_id, coupon_id, order_id, used_at, discount_amount) FROM stdin;
\.


--
-- Data for Name: promotion_coupons; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.promotion_coupons (id, code, name, description, discount_type, discount_value, max_discount, min_order_amount, total_quantity, used_quantity, per_user_limit, applicable_packages, applicable_user_types, start_time, end_time, is_active, created_at, updated_at, created_by) FROM stdin;
3c023646-8f43-4e47-9e08-47d818eb34e9	NEWUSER30	新人7折优惠	新用户首次推广专享7折优惠，最高减免200元	percentage	30.00	200.00	0.00	-1	0	1	[]	[]	\N	\N	t	2026-02-26 09:32:04.515696+00	2026-02-26 09:32:04.515696+00	\N
abbf7ed3-756b-4933-8df0-b9bba5470ea2	SECOND20	二单8折优惠	第二次推广专享8折优惠，最高减免100元	percentage	20.00	100.00	0.00	-1	0	1	[]	[]	\N	\N	t	2026-02-26 09:32:04.515696+00	2026-02-26 09:32:04.515696+00	\N
d270130b-89aa-4e4d-b755-340eaa2781fa	THIRD15	三单85折优惠	第三次推广专享85折优惠，最高减免80元	percentage	15.00	80.00	0.00	-1	0	1	[]	[]	\N	\N	t	2026-02-26 09:32:04.515696+00	2026-02-26 09:32:04.515696+00	\N
\.


--
-- Data for Name: promotion_notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.promotion_notifications (id, user_id, type, title, content, related_id, related_type, is_read, read_at, created_at) FROM stdin;
\.


--
-- Data for Name: promotion_orders; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.promotion_orders (id, user_id, order_no, work_id, work_title, work_thumbnail, package_type, package_name, package_duration, expected_views_min, expected_views_max, target_type, metric_type, original_price, discount_amount, final_price, coupon_id, coupon_code, coupon_discount, status, payment_method, payment_time, transaction_id, start_time, end_time, actual_views, actual_clicks, actual_conversions, refund_amount, refund_reason, refund_time, created_at, updated_at, notes, metadata, audit_notes, audited_at, channel, channel_cost) FROM stdin;
99259532-7cca-4181-8a1f-d730c8f10703	f3dedf79-5c5e-40fd-9513-d0fb0995d429	PRO20260226241249	9cd8c8e6-525b-42ed-ac63-2fa8d4b04a4b	\N	\N	standard	\N	\N	\N	\N	account	views	50.00	15.00	35.00	new_user_7	\N	0.00	paid	wechat	2026-02-26 11:10:33.373735+00	\N	\N	\N	0	0	0	0.00	\N	\N	2026-02-26 11:10:30.77904+00	2026-02-26 11:10:33.373735+00	\N	{"metric": "views", "target": "account"}	\N	\N	\N	0.00
b7f3c118-4d4b-4521-af51-5860f76d532c	f3dedf79-5c5e-40fd-9513-d0fb0995d429	PRO20260226465276	9cd8c8e6-525b-42ed-ac63-2fa8d4b04a4b	\N	\N	standard	\N	\N	\N	\N	account	views	50.00	15.00	35.00	new_user_7	\N	0.00	paid	wechat	2026-02-26 11:11:18.802888+00	\N	\N	\N	0	0	0	0.00	\N	\N	2026-02-26 11:11:16.159267+00	2026-02-26 11:11:18.802888+00	\N	{"metric": "views", "target": "account"}	\N	\N	\N	0.00
bf366c2e-de1d-42dc-90b1-b0bb5a66fa5b	f3dedf79-5c5e-40fd-9513-d0fb0995d429	PRO20260226628203	81e2a0cb-5dfa-42ad-b9ed-2a40d78c45f4	国潮新韵：传统元素的现代绽放	https://pptqdicaaewtnaiflfcs.supabase.co/storage/v1/object/public/works/works/1771164851524-2gwpntgjyjm.png	standard	\N	\N	\N	\N	account	views	50.00	15.00	35.00	new_user_7	\N	0.00	active	wechat	2026-02-26 11:26:56.046789+00	\N	2026-02-27 09:21:11.066704+00	2026-02-28 09:21:11.066704+00	57	0	0	0.00	\N	\N	2026-02-26 11:26:54.047195+00	2026-02-27 09:54:17.653419+00	\N	{"metric": "views", "target": "account", "package_name": "标准套餐", "expected_views": "417-1,167"}		2026-02-27 09:21:11.066704+00	\N	0.00
e34ecd58-27ef-4caf-9cfb-413734f24a85	78340927-c853-4978-a90f-f54d7c6883d2	TEST20260301033520	bd064ca2-79f7-4ca5-9ad2-4c36b17b1489	测试推广作品		standard	\N	\N	\N	\N	account	views	98.00	0.00	98.00	\N	\N	0.00	active	\N	2026-03-01 03:35:20.691491+00	\N	2026-03-01 03:35:20.691491+00	2026-03-02 03:35:20.691491+00	0	0	0	0.00	\N	\N	2026-03-01 03:35:20.691491+00	2026-03-01 03:35:20.691491+00	\N	{}	\N	\N	\N	0.00
8edbdc5c-df6e-40c4-89de-e8f0d448565a	f3dedf79-5c5e-40fd-9513-d0fb0995d429	PRO20260226391990	91a03020-6700-4831-aa51-9300110b5c49	cs	https://pptqdicaaewtnaiflfcs.supabase.co/storage/v1/object/public/works/f3dedf79-5c5e-40fd-9513-d0fb0995d429/1772095361925-o6bi5t09j5g.png	standard	\N	\N	\N	\N	account	views	50.00	15.00	35.00	new_user_7	\N	0.00	active	wechat	2026-02-26 13:11:49.132487+00	\N	2026-02-27 09:13:35.400827+00	2026-02-28 09:13:35.400827+00	60	0	0	0.00	\N	\N	2026-02-26 13:11:47.545833+00	2026-02-27 09:54:17.268838+00	\N	{"metric": "views", "target": "account", "package_name": "标准套餐", "expected_views": "417-1,167"}		2026-02-27 09:13:35.400827+00	\N	0.00
\.


--
-- Data for Name: promotion_user_stats; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.promotion_user_stats (id, user_id, date, daily_orders, daily_spent, daily_views, daily_clicks, daily_conversions, total_orders, total_spent, total_views) FROM stdin;
\.


--
-- Data for Name: promotion_wallet_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.promotion_wallet_transactions (id, wallet_id, user_id, type, amount, balance_before, balance_after, order_id, reference_id, description, metadata, created_at) FROM stdin;
\.


--
-- Data for Name: promotion_wallets; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.promotion_wallets (id, user_id, balance, frozen_balance, total_recharge, total_consumption, is_active, created_at, updated_at, last_transaction_at) FROM stdin;
\.


--
-- Data for Name: realtime_recommendation_cache; Type: TABLE DATA; Schema: public; Owner: postgres
--


COPY public.realtime_recommendation_cache (id, user_id, items, diversity_score, relevance_score, mmr_score, generated_context, generated_at, expires_at) FROM stdin;
\.


--
-- Data for Name: recommendation_configs; Type: TABLE DATA; Schema: public; Owner: postgres
--