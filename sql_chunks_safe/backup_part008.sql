
--
-- Name: brand_task_analytics brand_task_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_task_analytics
    ADD CONSTRAINT brand_task_analytics_pkey PRIMARY KEY (id);


--
-- Name: brand_task_analytics brand_task_analytics_task_id_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_task_analytics
    ADD CONSTRAINT brand_task_analytics_task_id_date_key UNIQUE (task_id, date);


--
-- Name: brand_task_participants brand_task_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_task_participants
    ADD CONSTRAINT brand_task_participants_pkey PRIMARY KEY (id);


--
-- Name: brand_task_participants brand_task_participants_task_id_creator_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_task_participants
    ADD CONSTRAINT brand_task_participants_task_id_creator_id_key UNIQUE (task_id, creator_id);


--
-- Name: brand_task_submissions brand_task_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_task_submissions
    ADD CONSTRAINT brand_task_submissions_pkey PRIMARY KEY (id);


--
-- Name: brand_tasks brand_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_tasks
    ADD CONSTRAINT brand_tasks_pkey PRIMARY KEY (id);


--
-- Name: brand_transactions brand_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_transactions
    ADD CONSTRAINT brand_transactions_pkey PRIMARY KEY (id);


--
-- Name: brand_wizard_drafts brand_wizard_drafts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_wizard_drafts
    ADD CONSTRAINT brand_wizard_drafts_pkey PRIMARY KEY (id);


--
-- Name: business_tasks business_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_tasks
    ADD CONSTRAINT business_tasks_pkey PRIMARY KEY (id);


--
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: channel_costs channel_costs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.channel_costs
    ADD CONSTRAINT channel_costs_pkey PRIMARY KEY (id);


--
-- Name: checkin_records checkin_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.checkin_records
    ADD CONSTRAINT checkin_records_pkey PRIMARY KEY (id);


--
-- Name: checkin_records checkin_records_user_id_checkin_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.checkin_records
    ADD CONSTRAINT checkin_records_user_id_checkin_date_key UNIQUE (user_id, checkin_date);


--
-- Name: cold_start_recommendation_logs cold_start_recommendation_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cold_start_recommendation_logs
    ADD CONSTRAINT cold_start_recommendation_logs_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: commercial_opportunities commercial_opportunities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commercial_opportunities
    ADD CONSTRAINT commercial_opportunities_pkey PRIMARY KEY (id);


--
-- Name: communities communities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.communities
    ADD CONSTRAINT communities_pkey PRIMARY KEY (id);


--
-- Name: community_announcements community_announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_announcements
    ADD CONSTRAINT community_announcements_pkey PRIMARY KEY (id);


--
-- Name: community_invitation_history community_invitation_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_invitation_history
    ADD CONSTRAINT community_invitation_history_pkey PRIMARY KEY (id);


--
-- Name: community_invitations community_invitations_invite_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_invitations
    ADD CONSTRAINT community_invitations_invite_code_key UNIQUE (invite_code);


--
-- Name: community_invitations community_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_invitations
    ADD CONSTRAINT community_invitations_pkey PRIMARY KEY (id);


--
-- Name: community_invite_settings community_invite_settings_community_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_invite_settings
    ADD CONSTRAINT community_invite_settings_community_id_key UNIQUE (community_id);


--
-- Name: community_invite_settings community_invite_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_invite_settings
    ADD CONSTRAINT community_invite_settings_pkey PRIMARY KEY (id);


--
-- Name: community_join_requests community_join_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_join_requests
    ADD CONSTRAINT community_join_requests_pkey PRIMARY KEY (id);


--
-- Name: community_members community_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_members
    ADD CONSTRAINT community_members_pkey PRIMARY KEY (community_id, user_id);


--
-- Name: community_posts community_posts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_posts
    ADD CONSTRAINT community_posts_pkey PRIMARY KEY (id);


--
-- Name: consumption_records consumption_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consumption_records
    ADD CONSTRAINT consumption_records_pkey PRIMARY KEY (id);


--
-- Name: content_quality_assessments content_quality_assessments_content_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.content_quality_assessments
    ADD CONSTRAINT content_quality_assessments_content_id_key UNIQUE (content_id);


--
-- Name: content_quality_assessments content_quality_assessments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.content_quality_assessments
    ADD CONSTRAINT content_quality_assessments_pkey PRIMARY KEY (id);


--
-- Name: content_stats content_stats_content_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.content_stats
    ADD CONSTRAINT content_stats_content_id_key UNIQUE (content_id);


--
-- Name: content_stats content_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.content_stats
    ADD CONSTRAINT content_stats_pkey PRIMARY KEY (id);


--
-- Name: content_vectors content_vectors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.content_vectors
    ADD CONSTRAINT content_vectors_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: conversion_events conversion_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversion_events
    ADD CONSTRAINT conversion_events_pkey PRIMARY KEY (id);


--
-- Name: copyright_assets copyright_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.copyright_assets
    ADD CONSTRAINT copyright_assets_pkey PRIMARY KEY (id);


--
-- Name: creator_earnings creator_earnings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.creator_earnings
    ADD CONSTRAINT creator_earnings_pkey PRIMARY KEY (id);


--
-- Name: creator_level_configs creator_level_configs_level_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.creator_level_configs
    ADD CONSTRAINT creator_level_configs_level_key UNIQUE (level);


--
-- Name: creator_level_configs creator_level_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.creator_level_configs
    ADD CONSTRAINT creator_level_configs_pkey PRIMARY KEY (id);


--
-- Name: creator_revenue creator_revenue_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.creator_revenue
    ADD CONSTRAINT creator_revenue_pkey PRIMARY KEY (id);


--
-- Name: creator_revenue creator_revenue_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.creator_revenue
    ADD CONSTRAINT creator_revenue_user_id_key UNIQUE (user_id);


--
-- Name: creator_task_applications creator_task_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.creator_task_applications
    ADD CONSTRAINT creator_task_applications_pkey PRIMARY KEY (id);


--
-- Name: creator_task_applications creator_task_applications_task_id_creator_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.creator_task_applications
    ADD CONSTRAINT creator_task_applications_task_id_creator_id_key UNIQUE (task_id, creator_id);


--
-- Name: cultural_knowledge cultural_knowledge_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cultural_knowledge
    ADD CONSTRAINT cultural_knowledge_pkey PRIMARY KEY (id);


--
-- Name: direct_messages direct_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.direct_messages
    ADD CONSTRAINT direct_messages_pkey PRIMARY KEY (id);


--
-- Name: drafts drafts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drafts
    ADD CONSTRAINT drafts_pkey PRIMARY KEY (id);


--
-- Name: errors errors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.errors
    ADD CONSTRAINT errors_pkey PRIMARY KEY (id);


--
-- Name: event_bookmarks event_bookmarks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_bookmarks
    ADD CONSTRAINT event_bookmarks_pkey PRIMARY KEY (user_id, event_id);


--
-- Name: event_daily_stats event_daily_stats_event_id_stat_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_daily_stats
    ADD CONSTRAINT event_daily_stats_event_id_stat_date_key UNIQUE (event_id, stat_date);


--
-- Name: event_daily_stats event_daily_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_daily_stats
    ADD CONSTRAINT event_daily_stats_pkey PRIMARY KEY (id);


--
-- Name: event_likes event_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_likes
    ADD CONSTRAINT event_likes_pkey PRIMARY KEY (user_id, event_id);


--
-- Name: event_notifications event_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_notifications
    ADD CONSTRAINT event_notifications_pkey PRIMARY KEY (id);


--
-- Name: event_participants event_participants_event_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_participants
    ADD CONSTRAINT event_participants_event_id_user_id_key UNIQUE (event_id, user_id);


--
-- Name: event_participants event_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_participants
    ADD CONSTRAINT event_participants_pkey PRIMARY KEY (id);


--
-- Name: event_prizes event_prizes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_prizes
    ADD CONSTRAINT event_prizes_pkey PRIMARY KEY (id);


--
-- Name: event_submissions event_submissions_event_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_submissions
    ADD CONSTRAINT event_submissions_event_id_user_id_key UNIQUE (event_id, user_id);


--
-- Name: event_submissions event_submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_submissions
    ADD CONSTRAINT event_submissions_pkey PRIMARY KEY (id);


--
-- Name: event_works event_works_event_id_work_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_works
    ADD CONSTRAINT event_works_event_id_work_id_key UNIQUE (event_id, work_id);


--
-- Name: event_works event_works_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_works
    ADD CONSTRAINT event_works_pkey PRIMARY KEY (id);


--
-- Name: events events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: exchange_records exchange_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exchange_records
    ADD CONSTRAINT exchange_records_pkey PRIMARY KEY (id);


--
-- Name: favorites favorites_new_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_new_pkey PRIMARY KEY (id);


--
-- Name: favorites favorites_new_user_id_post_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.favorites
    ADD CONSTRAINT favorites_new_user_id_post_id_key UNIQUE (user_id, post_id);


--
-- Name: feed_collects feed_collects_feed_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feed_collects
    ADD CONSTRAINT feed_collects_feed_id_user_id_key UNIQUE (feed_id, user_id);


--
-- Name: feed_collects feed_collects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feed_collects
    ADD CONSTRAINT feed_collects_pkey PRIMARY KEY (id);


--
-- Name: feed_comment_likes feed_comment_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feed_comment_likes
    ADD CONSTRAINT feed_comment_likes_pkey PRIMARY KEY (user_id, comment_id);


--
-- Name: feed_comments feed_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feed_comments
    ADD CONSTRAINT feed_comments_pkey PRIMARY KEY (id);


--
-- Name: feed_likes feed_likes_feed_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feed_likes
    ADD CONSTRAINT feed_likes_feed_id_user_id_key UNIQUE (feed_id, user_id);


--
-- Name: feed_likes feed_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feed_likes
    ADD CONSTRAINT feed_likes_pkey PRIMARY KEY (id);


--
-- Name: feedback_process_logs feedback_process_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback_process_logs
    ADD CONSTRAINT feedback_process_logs_pkey PRIMARY KEY (id);


--
-- Name: feeds feeds_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feeds
    ADD CONSTRAINT feeds_pkey PRIMARY KEY (id);


--
-- Name: final_ranking_publishes final_ranking_publishes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.final_ranking_publishes
    ADD CONSTRAINT final_ranking_publishes_pkey PRIMARY KEY (id);


--
-- Name: follows follows_follower_id_following_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_follower_id_following_id_key UNIQUE (follower_id, following_id);


--
-- Name: follows follows_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_pkey PRIMARY KEY (id);


--
-- Name: forbidden_words forbidden_words_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forbidden_words
    ADD CONSTRAINT forbidden_words_pkey PRIMARY KEY (id);


--
-- Name: forbidden_words forbidden_words_word_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forbidden_words
    ADD CONSTRAINT forbidden_words_word_key UNIQUE (word);


--
-- Name: friend_requests friend_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friend_requests
    ADD CONSTRAINT friend_requests_pkey PRIMARY KEY (id);


--
-- Name: friend_requests friend_requests_sender_id_receiver_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friend_requests
    ADD CONSTRAINT friend_requests_sender_id_receiver_id_key UNIQUE (sender_id, receiver_id);


--
-- Name: friends friends_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friends
    ADD CONSTRAINT friends_pkey PRIMARY KEY (id);


--
-- Name: friends friends_user_id_friend_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friends
    ADD CONSTRAINT friends_user_id_friend_id_key UNIQUE (user_id, friend_id);


--
-- Name: generation_tasks generation_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.generation_tasks
    ADD CONSTRAINT generation_tasks_pkey PRIMARY KEY (id);


--
-- Name: home_recommendations home_recommendations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.home_recommendations
    ADD CONSTRAINT home_recommendations_pkey PRIMARY KEY (id);


--
-- Name: hot_searches hot_searches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hot_searches
    ADD CONSTRAINT hot_searches_pkey PRIMARY KEY (id);


--
-- Name: hot_searches hot_searches_query_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hot_searches
    ADD CONSTRAINT hot_searches_query_key UNIQUE (query);


--
-- Name: content_vectors idx_content_vectors_item; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.content_vectors
    ADD CONSTRAINT idx_content_vectors_item UNIQUE (item_id, item_type);


--
-- Name: realtime_recommendation_cache idx_recommendation_cache_user_expires; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.realtime_recommendation_cache
    ADD CONSTRAINT idx_recommendation_cache_user_expires UNIQUE (user_id, expires_at);


--
-- Name: user_behavior_events idx_user_behavior_events_user_id_created_at; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_behavior_events
    ADD CONSTRAINT idx_user_behavior_events_user_id_created_at UNIQUE (user_id, created_at, id);


--
-- Name: inspiration_ai_suggestions inspiration_ai_suggestions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspiration_ai_suggestions
    ADD CONSTRAINT inspiration_ai_suggestions_pkey PRIMARY KEY (id);


--
-- Name: inspiration_mindmaps inspiration_mindmaps_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspiration_mindmaps
    ADD CONSTRAINT inspiration_mindmaps_pkey PRIMARY KEY (id);


--
-- Name: inspiration_nodes inspiration_nodes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspiration_nodes
    ADD CONSTRAINT inspiration_nodes_pkey PRIMARY KEY (id);


--
-- Name: inspiration_stories inspiration_stories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspiration_stories
    ADD CONSTRAINT inspiration_stories_pkey PRIMARY KEY (id);


--
-- Name: invitation_reports invitation_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invitation_reports
    ADD CONSTRAINT invitation_reports_pkey PRIMARY KEY (id);


--
-- Name: invite_records invite_records_invite_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invite_records
    ADD CONSTRAINT invite_records_invite_code_key UNIQUE (invite_code);


--
-- Name: invite_records invite_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invite_records
    ADD CONSTRAINT invite_records_pkey PRIMARY KEY (id);


--
-- Name: ip_activities ip_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ip_activities
    ADD CONSTRAINT ip_activities_pkey PRIMARY KEY (id);


--
-- Name: ip_assets ip_assets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ip_assets
    ADD CONSTRAINT ip_assets_pkey PRIMARY KEY (id);


--
-- Name: ip_partnerships ip_partnerships_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ip_partnerships
    ADD CONSTRAINT ip_partnerships_pkey PRIMARY KEY (id);


--
-- Name: ip_stages ip_stages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ip_stages
    ADD CONSTRAINT ip_stages_pkey PRIMARY KEY (id);


--
-- Name: likes likes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_pkey PRIMARY KEY (user_id, post_id);


--
-- Name: lottery_activities lottery_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lottery_activities
    ADD CONSTRAINT lottery_activities_pkey PRIMARY KEY (id);


--
-- Name: lottery_prizes lottery_prizes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lottery_prizes
    ADD CONSTRAINT lottery_prizes_pkey PRIMARY KEY (id);


--
-- Name: lottery_spin_records lottery_spin_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lottery_spin_records
    ADD CONSTRAINT lottery_spin_records_pkey PRIMARY KEY (id);


--
-- Name: membership_benefits_config membership_benefits_config_level_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.membership_benefits_config
    ADD CONSTRAINT membership_benefits_config_level_key UNIQUE (level);


--
-- Name: membership_benefits_config membership_benefits_config_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.membership_benefits_config
    ADD CONSTRAINT membership_benefits_config_pkey PRIMARY KEY (id);


--
-- Name: membership_benefits membership_benefits_membership_level_benefit_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.membership_benefits
    ADD CONSTRAINT membership_benefits_membership_level_benefit_key UNIQUE (membership_level, benefit);


--
-- Name: membership_benefits membership_benefits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.membership_benefits
    ADD CONSTRAINT membership_benefits_pkey PRIMARY KEY (id);


--
-- Name: membership_coupon_usage membership_coupon_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.membership_coupon_usage
    ADD CONSTRAINT membership_coupon_usage_pkey PRIMARY KEY (id);


--
-- Name: membership_coupons membership_coupons_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.membership_coupons
    ADD CONSTRAINT membership_coupons_code_key UNIQUE (code);


--
-- Name: membership_coupons membership_coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.membership_coupons
    ADD CONSTRAINT membership_coupons_pkey PRIMARY KEY (id);


--
-- Name: membership_history membership_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.membership_history
    ADD CONSTRAINT membership_history_pkey PRIMARY KEY (id);


--
-- Name: membership_orders membership_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.membership_orders
    ADD CONSTRAINT membership_orders_pkey PRIMARY KEY (id);


--
-- Name: membership_usage_stats membership_usage_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.membership_usage_stats
    ADD CONSTRAINT membership_usage_stats_pkey PRIMARY KEY (id);


--
-- Name: membership_usage_stats membership_usage_stats_user_id_stat_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.membership_usage_stats
    ADD CONSTRAINT membership_usage_stats_user_id_stat_date_key UNIQUE (user_id, stat_date);


--
-- Name: memberships memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.memberships
    ADD CONSTRAINT memberships_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey1; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey1 PRIMARY KEY (id);


--
-- Name: moderation_logs moderation_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.moderation_logs
    ADD CONSTRAINT moderation_logs_pkey PRIMARY KEY (id);


--
-- Name: moderation_rules moderation_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.moderation_rules
    ADD CONSTRAINT moderation_rules_pkey PRIMARY KEY (id);


--
-- Name: new_content_boost_pool new_content_boost_pool_content_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.new_content_boost_pool
    ADD CONSTRAINT new_content_boost_pool_content_id_key UNIQUE (content_id);


--
-- Name: new_content_boost_pool new_content_boost_pool_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.new_content_boost_pool
    ADD CONSTRAINT new_content_boost_pool_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: order_applications order_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_applications
    ADD CONSTRAINT order_applications_pkey PRIMARY KEY (id);


--
-- Name: order_audits order_audits_order_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_audits
    ADD CONSTRAINT order_audits_order_id_key UNIQUE (order_id);


--
-- Name: order_audits order_audits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_audits
    ADD CONSTRAINT order_audits_pkey PRIMARY KEY (id);


--
-- Name: order_execution_clicks order_execution_clicks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_execution_clicks
    ADD CONSTRAINT order_execution_clicks_pkey PRIMARY KEY (id);


--
-- Name: order_execution_daily_stats order_execution_daily_stats_execution_id_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_execution_daily_stats
    ADD CONSTRAINT order_execution_daily_stats_execution_id_date_key UNIQUE (execution_id, date);


--
-- Name: order_execution_daily_stats order_execution_daily_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_execution_daily_stats
    ADD CONSTRAINT order_execution_daily_stats_pkey PRIMARY KEY (id);


--
-- Name: order_executions order_executions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_executions
    ADD CONSTRAINT order_executions_pkey PRIMARY KEY (id);


--
-- Name: organizer_backups organizer_backups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizer_backups
    ADD CONSTRAINT organizer_backups_pkey PRIMARY KEY (id);


--
-- Name: organizer_settings organizer_settings_organizer_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizer_settings
    ADD CONSTRAINT organizer_settings_organizer_id_key UNIQUE (organizer_id);


--
-- Name: organizer_settings organizer_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizer_settings
    ADD CONSTRAINT organizer_settings_pkey PRIMARY KEY (id);


--
-- Name: page_views page_views_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.page_views
    ADD CONSTRAINT page_views_pkey PRIMARY KEY (id);


--
-- Name: pending_messages pending_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pending_messages
    ADD CONSTRAINT pending_messages_pkey PRIMARY KEY (id);


--
-- Name: pending_messages pending_messages_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pending_messages
    ADD CONSTRAINT pending_messages_user_id_key UNIQUE (user_id);


--
-- Name: points_limits points_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.points_limits
    ADD CONSTRAINT points_limits_pkey PRIMARY KEY (id);


--
-- Name: points_limits points_limits_user_id_source_type_period_type_period_start_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.points_limits
    ADD CONSTRAINT points_limits_user_id_source_type_period_type_period_start_key UNIQUE (user_id, source_type, period_type, period_start);


--
-- Name: points points_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.points
    ADD CONSTRAINT points_pkey PRIMARY KEY (id);


--
-- Name: points_records points_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.points_records
    ADD CONSTRAINT points_records_pkey PRIMARY KEY (id);


--
-- Name: points_rules points_rules_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.points_rules
    ADD CONSTRAINT points_rules_pkey PRIMARY KEY (id);


--
-- Name: post_tags post_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.post_tags
    ADD CONSTRAINT post_tags_pkey PRIMARY KEY (post_id, tag_id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: prize_winners prize_winners_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prize_winners
    ADD CONSTRAINT prize_winners_pkey PRIMARY KEY (id);


--
-- Name: product_links product_links_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_links
    ADD CONSTRAINT product_links_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: promoted_works promoted_works_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promoted_works
    ADD CONSTRAINT promoted_works_pkey PRIMARY KEY (id);


--
-- Name: promotion_applications promotion_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_applications
    ADD CONSTRAINT promotion_applications_pkey PRIMARY KEY (id);


--
-- Name: promotion_applications promotion_applications_user_id_status_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_applications
    ADD CONSTRAINT promotion_applications_user_id_status_key UNIQUE (user_id, status);


--
-- Name: promotion_audit_logs promotion_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_audit_logs
    ADD CONSTRAINT promotion_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: promotion_coupon_usage promotion_coupon_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_coupon_usage
    ADD CONSTRAINT promotion_coupon_usage_pkey PRIMARY KEY (id);


--
-- Name: promotion_coupon_usage promotion_coupon_usage_user_id_order_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_coupon_usage
    ADD CONSTRAINT promotion_coupon_usage_user_id_order_id_key UNIQUE (user_id, order_id);


--
-- Name: promotion_coupons promotion_coupons_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_coupons
    ADD CONSTRAINT promotion_coupons_code_key UNIQUE (code);


--
-- Name: promotion_coupons promotion_coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_coupons
    ADD CONSTRAINT promotion_coupons_pkey PRIMARY KEY (id);


--
-- Name: promotion_notifications promotion_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_notifications
    ADD CONSTRAINT promotion_notifications_pkey PRIMARY KEY (id);


--
-- Name: promotion_orders promotion_orders_order_no_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_orders
    ADD CONSTRAINT promotion_orders_order_no_key UNIQUE (order_no);


--
-- Name: promotion_orders promotion_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_orders
    ADD CONSTRAINT promotion_orders_pkey PRIMARY KEY (id);


--
-- Name: promotion_user_stats promotion_user_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_user_stats
    ADD CONSTRAINT promotion_user_stats_pkey PRIMARY KEY (id);


--
-- Name: promotion_user_stats promotion_user_stats_user_id_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_user_stats
    ADD CONSTRAINT promotion_user_stats_user_id_date_key UNIQUE (user_id, date);


--
-- Name: promotion_wallet_transactions promotion_wallet_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_wallet_transactions
    ADD CONSTRAINT promotion_wallet_transactions_pkey PRIMARY KEY (id);


--
-- Name: promotion_wallets promotion_wallets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_wallets
    ADD CONSTRAINT promotion_wallets_pkey PRIMARY KEY (id);


--
-- Name: promotion_wallets promotion_wallets_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_wallets
    ADD CONSTRAINT promotion_wallets_user_id_key UNIQUE (user_id);


--
-- Name: realtime_recommendation_cache realtime_recommendation_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.realtime_recommendation_cache
    ADD CONSTRAINT realtime_recommendation_cache_pkey PRIMARY KEY (id);


--
-- Name: recommendation_configs recommendation_configs_config_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recommendation_configs
    ADD CONSTRAINT recommendation_configs_config_key_key UNIQUE (config_key);


--
-- Name: recommendation_configs recommendation_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recommendation_configs
    ADD CONSTRAINT recommendation_configs_pkey PRIMARY KEY (id);


--
-- Name: recommendation_history recommendation_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recommendation_history
    ADD CONSTRAINT recommendation_history_pkey PRIMARY KEY (id);


--
-- Name: recommendation_metrics recommendation_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recommendation_metrics
    ADD CONSTRAINT recommendation_metrics_pkey PRIMARY KEY (id);


--
-- Name: recommendation_operation_logs recommendation_operation_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recommendation_operation_logs
    ADD CONSTRAINT recommendation_operation_logs_pkey PRIMARY KEY (id);


--
-- Name: replies replies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.replies
    ADD CONSTRAINT replies_pkey PRIMARY KEY (id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: revenue_records revenue_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.revenue_records
    ADD CONSTRAINT revenue_records_pkey PRIMARY KEY (id);


--
-- Name: score_audit_logs score_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.score_audit_logs
    ADD CONSTRAINT score_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: search_behavior_tracking search_behavior_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.search_behavior_tracking
    ADD CONSTRAINT search_behavior_tracking_pkey PRIMARY KEY (id);


--
-- Name: search_suggestions search_suggestions_keyword_category_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.search_suggestions
    ADD CONSTRAINT search_suggestions_keyword_category_key UNIQUE (keyword, category);


--
-- Name: search_suggestions search_suggestions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.search_suggestions
    ADD CONSTRAINT search_suggestions_pkey PRIMARY KEY (id);


--
-- Name: small_traffic_exposures small_traffic_exposures_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.small_traffic_exposures
    ADD CONSTRAINT small_traffic_exposures_pkey PRIMARY KEY (id);


--
-- Name: small_traffic_exposures small_traffic_exposures_test_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.small_traffic_exposures
    ADD CONSTRAINT small_traffic_exposures_test_id_user_id_key UNIQUE (test_id, user_id);


--
-- Name: small_traffic_tests small_traffic_tests_content_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.small_traffic_tests
    ADD CONSTRAINT small_traffic_tests_content_id_key UNIQUE (content_id);


--
-- Name: small_traffic_tests small_traffic_tests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.small_traffic_tests
    ADD CONSTRAINT small_traffic_tests_pkey PRIMARY KEY (id);


--
-- Name: submission_comments submission_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submission_comments
    ADD CONSTRAINT submission_comments_pkey PRIMARY KEY (id);


--
-- Name: submission_likes submission_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submission_likes
    ADD CONSTRAINT submission_likes_pkey PRIMARY KEY (id);


--
-- Name: submission_likes submission_likes_submission_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submission_likes
    ADD CONSTRAINT submission_likes_submission_id_user_id_key UNIQUE (submission_id, user_id);


--
-- Name: submission_ratings submission_ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submission_ratings
    ADD CONSTRAINT submission_ratings_pkey PRIMARY KEY (id);


--
-- Name: submission_ratings submission_ratings_submission_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submission_ratings
    ADD CONSTRAINT submission_ratings_submission_id_user_id_key UNIQUE (submission_id, user_id);


--
-- Name: submission_scores submission_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submission_scores
    ADD CONSTRAINT submission_scores_pkey PRIMARY KEY (id);


--
-- Name: submission_scores submission_scores_submission_id_judge_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submission_scores
    ADD CONSTRAINT submission_scores_submission_id_judge_id_key UNIQUE (submission_id, judge_id);


--
-- Name: submission_votes submission_votes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submission_votes
    ADD CONSTRAINT submission_votes_pkey PRIMARY KEY (id);


--
-- Name: submission_votes submission_votes_submission_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submission_votes
    ADD CONSTRAINT submission_votes_submission_id_user_id_key UNIQUE (submission_id, user_id);


--
-- Name: task_records task_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_records
    ADD CONSTRAINT task_records_pkey PRIMARY KEY (id);


--
-- Name: task_records task_records_user_id_task_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_records
    ADD CONSTRAINT task_records_user_id_task_id_key UNIQUE (user_id, task_id);


--
-- Name: template_favorites template_favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.template_favorites
    ADD CONSTRAINT template_favorites_pkey PRIMARY KEY (id);


--
-- Name: template_favorites template_favorites_user_id_template_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.template_favorites
    ADD CONSTRAINT template_favorites_user_id_template_id_key UNIQUE (user_id, template_id);


--
-- Name: template_likes template_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.template_likes
    ADD CONSTRAINT template_likes_pkey PRIMARY KEY (id);


--
-- Name: template_likes template_likes_user_id_template_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.template_likes
    ADD CONSTRAINT template_likes_user_id_template_id_key UNIQUE (user_id, template_id);


--
-- Name: tianjin_templates tianjin_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tianjin_templates
    ADD CONSTRAINT tianjin_templates_pkey PRIMARY KEY (id);


--
-- Name: traffic_sources traffic_sources_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.traffic_sources
    ADD CONSTRAINT traffic_sources_pkey PRIMARY KEY (id);


--
-- Name: home_recommendations unique_item; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.home_recommendations
    ADD CONSTRAINT unique_item UNIQUE (item_id, item_type);


--
-- Name: user_achievements user_achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_pkey PRIMARY KEY (user_id, achievement_id);


--
-- Name: user_activities user_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_activities
    ADD CONSTRAINT user_activities_pkey PRIMARY KEY (id);


--
-- Name: user_ban_restrictions user_ban_restrictions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_ban_restrictions
    ADD CONSTRAINT user_ban_restrictions_pkey PRIMARY KEY (id);


--
-- Name: user_ban_restrictions user_ban_restrictions_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_ban_restrictions
    ADD CONSTRAINT user_ban_restrictions_user_id_key UNIQUE (user_id);


--
-- Name: user_behavior_daily_stats user_behavior_daily_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_behavior_daily_stats
    ADD CONSTRAINT user_behavior_daily_stats_pkey PRIMARY KEY (id);


--
-- Name: user_behavior_daily_stats user_behavior_daily_stats_user_id_stat_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_behavior_daily_stats
    ADD CONSTRAINT user_behavior_daily_stats_user_id_stat_date_key UNIQUE (user_id, stat_date);


--
-- Name: user_behavior_events user_behavior_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_behavior_events
    ADD CONSTRAINT user_behavior_events_pkey PRIMARY KEY (id);


--
-- Name: user_behavior_logs user_behavior_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_behavior_logs
    ADD CONSTRAINT user_behavior_logs_pkey PRIMARY KEY (id);


--
-- Name: user_behaviors user_behaviors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_behaviors
    ADD CONSTRAINT user_behaviors_pkey PRIMARY KEY (id);


--
-- Name: user_brand_history user_brand_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_brand_history
    ADD CONSTRAINT user_brand_history_pkey PRIMARY KEY (id);


--
-- Name: user_brand_history user_brand_history_user_id_brand_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_brand_history
    ADD CONSTRAINT user_brand_history_user_id_brand_id_key UNIQUE (user_id, brand_id);


--
-- Name: user_creative_profiles user_creative_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_creative_profiles
    ADD CONSTRAINT user_creative_profiles_pkey PRIMARY KEY (id);


--
-- Name: user_creative_profiles user_creative_profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_creative_profiles
    ADD CONSTRAINT user_creative_profiles_user_id_key UNIQUE (user_id);


--
-- Name: user_demographics user_demographics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_demographics
    ADD CONSTRAINT user_demographics_pkey PRIMARY KEY (id);


--
-- Name: user_demographics user_demographics_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_demographics
    ADD CONSTRAINT user_demographics_user_id_key UNIQUE (user_id);


--
-- Name: user_devices user_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_devices
    ADD CONSTRAINT user_devices_pkey PRIMARY KEY (id);


--
-- Name: user_exploration_state user_exploration_state_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_exploration_state
    ADD CONSTRAINT user_exploration_state_pkey PRIMARY KEY (id);


--
-- Name: user_exploration_state user_exploration_state_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_exploration_state
    ADD CONSTRAINT user_exploration_state_user_id_key UNIQUE (user_id);


--
-- Name: user_favorites user_favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT user_favorites_pkey PRIMARY KEY (id);


--
-- Name: user_favorites user_favorites_user_id_brand_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT user_favorites_user_id_brand_id_key UNIQUE (user_id, brand_id);


--
-- Name: user_feedbacks user_feedbacks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_feedbacks
    ADD CONSTRAINT user_feedbacks_pkey PRIMARY KEY (id);


--
-- Name: user_invite_rate_limits user_invite_rate_limits_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_invite_rate_limits
    ADD CONSTRAINT user_invite_rate_limits_pkey PRIMARY KEY (id);


--
-- Name: user_invite_rate_limits user_invite_rate_limits_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_invite_rate_limits
    ADD CONSTRAINT user_invite_rate_limits_user_id_key UNIQUE (user_id);


--
-- Name: user_mockup_configs user_mockup_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_mockup_configs
    ADD CONSTRAINT user_mockup_configs_pkey PRIMARY KEY (id);


--
-- Name: user_notifications user_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_notifications
    ADD CONSTRAINT user_notifications_pkey PRIMARY KEY (id);


--
-- Name: user_patterns user_patterns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_patterns
    ADD CONSTRAINT user_patterns_pkey PRIMARY KEY (id);


--
-- Name: user_points_balance user_points_balance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_points_balance
    ADD CONSTRAINT user_points_balance_pkey PRIMARY KEY (id);


--
-- Name: user_points_balance user_points_balance_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_points_balance
    ADD CONSTRAINT user_points_balance_user_id_key UNIQUE (user_id);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- Name: user_profiles user_profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);


--
-- Name: user_realtime_features user_realtime_features_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_realtime_features
    ADD CONSTRAINT user_realtime_features_pkey PRIMARY KEY (id);


--
-- Name: user_realtime_features user_realtime_features_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_realtime_features
    ADD CONSTRAINT user_realtime_features_user_id_key UNIQUE (user_id);


--
-- Name: user_search_history user_search_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_search_history
    ADD CONSTRAINT user_search_history_pkey PRIMARY KEY (id);


--
-- Name: user_search_preferences user_search_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_search_preferences
    ADD CONSTRAINT user_search_preferences_pkey PRIMARY KEY (id);


--
-- Name: user_search_preferences user_search_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_search_preferences
    ADD CONSTRAINT user_search_preferences_user_id_key UNIQUE (user_id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_key UNIQUE (user_id);


--
-- Name: user_similarities user_similarities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_similarities
    ADD CONSTRAINT user_similarities_pkey PRIMARY KEY (id);


--
-- Name: user_similarities user_similarities_user_id_similar_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_similarities
    ADD CONSTRAINT user_similarities_user_id_similar_user_id_key UNIQUE (user_id, similar_user_id);


--
-- Name: user_status user_status_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_status
    ADD CONSTRAINT user_status_pkey PRIMARY KEY (user_id);


--
-- Name: user_style_presets user_style_presets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_style_presets
    ADD CONSTRAINT user_style_presets_pkey PRIMARY KEY (id);


--
-- Name: user_sync_logs user_sync_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sync_logs
    ADD CONSTRAINT user_sync_logs_pkey PRIMARY KEY (id);


--
-- Name: user_tile_configs user_tile_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_tile_configs
    ADD CONSTRAINT user_tile_configs_pkey PRIMARY KEY (id);


--
-- Name: user_uploads user_uploads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_uploads
    ADD CONSTRAINT user_uploads_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_github_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_github_id_key UNIQUE (github_id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: withdrawal_records withdrawal_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.withdrawal_records
    ADD CONSTRAINT withdrawal_records_pkey PRIMARY KEY (id);


--
-- Name: work_bookmarks work_bookmarks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_bookmarks
    ADD CONSTRAINT work_bookmarks_pkey PRIMARY KEY (id);


--
-- Name: work_bookmarks work_bookmarks_work_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_bookmarks
    ADD CONSTRAINT work_bookmarks_work_id_user_id_key UNIQUE (work_id, user_id);


--
-- Name: work_comment_likes work_comment_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_comment_likes
    ADD CONSTRAINT work_comment_likes_pkey PRIMARY KEY (user_id, comment_id);


--
-- Name: work_comments work_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_comments
    ADD CONSTRAINT work_comments_pkey PRIMARY KEY (id);


--
-- Name: work_favorites work_favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_favorites
    ADD CONSTRAINT work_favorites_pkey PRIMARY KEY (id);


--
-- Name: work_favorites work_favorites_user_id_work_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_favorites
    ADD CONSTRAINT work_favorites_user_id_work_id_key UNIQUE (user_id, work_id);


--
-- Name: work_performance_stats work_performance_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_performance_stats
    ADD CONSTRAINT work_performance_stats_pkey PRIMARY KEY (id);


--
-- Name: work_performance_stats work_performance_stats_submission_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_performance_stats
    ADD CONSTRAINT work_performance_stats_submission_id_key UNIQUE (submission_id);


--
-- Name: work_shares work_shares_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_shares
    ADD CONSTRAINT work_shares_pkey PRIMARY KEY (id);


--
-- Name: works_bookmarks works_bookmarks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.works_bookmarks
    ADD CONSTRAINT works_bookmarks_pkey PRIMARY KEY (user_id, work_id);


--
-- Name: works_likes works_likes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.works_likes
    ADD CONSTRAINT works_likes_pkey PRIMARY KEY (user_id, work_id);


--
-- Name: works works_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.works
    ADD CONSTRAINT works_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_03_01 messages_2026_03_01_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2026_03_01
    ADD CONSTRAINT messages_2026_03_01_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_03_02 messages_2026_03_02_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2026_03_02
    ADD CONSTRAINT messages_2026_03_02_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_03_03 messages_2026_03_03_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2026_03_03
    ADD CONSTRAINT messages_2026_03_03_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_03_04 messages_2026_03_04_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2026_03_04
    ADD CONSTRAINT messages_2026_03_04_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_03_05 messages_2026_03_05_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2026_03_05
    ADD CONSTRAINT messages_2026_03_05_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_03_06 messages_2026_03_06_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2026_03_06
    ADD CONSTRAINT messages_2026_03_06_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2026_03_07 messages_2026_03_07_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2026_03_07
    ADD CONSTRAINT messages_2026_03_07_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: buckets_vectors buckets_vectors_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets_vectors
    ADD CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: vector_indexes vector_indexes_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_idempotency_key_key; Type: CONSTRAINT; Schema: supabase_migrations; Owner: postgres
--

ALTER TABLE ONLY supabase_migrations.schema_migrations
    ADD CONSTRAINT schema_migrations_idempotency_key_key UNIQUE (idempotency_key);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: postgres
--

ALTER TABLE ONLY supabase_migrations.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: custom_oauth_providers_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_created_at_idx ON auth.custom_oauth_providers USING btree (created_at);


--
-- Name: custom_oauth_providers_enabled_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_enabled_idx ON auth.custom_oauth_providers USING btree (enabled);


--
-- Name: custom_oauth_providers_identifier_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_identifier_idx ON auth.custom_oauth_providers USING btree (identifier);


--
-- Name: custom_oauth_providers_provider_type_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX custom_oauth_providers_provider_type_idx ON auth.custom_oauth_providers USING btree (provider_type);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_oauth_client_states_created_at; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: idx_achievement_configs_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_achievement_configs_category ON public.achievement_configs USING btree (category);


--
-- Name: idx_achievement_configs_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_achievement_configs_is_active ON public.achievement_configs USING btree (is_active);


--
-- Name: idx_achievement_configs_rarity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_achievement_configs_rarity ON public.achievement_configs USING btree (rarity);


--
-- Name: idx_achievements_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_achievements_is_active ON public.achievements USING btree (is_active);


--
-- Name: idx_achievements_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_achievements_type ON public.achievements USING btree (type);


--
-- Name: idx_admin_notifications_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admin_notifications_created_at ON public.admin_notifications USING btree (created_at DESC);


--
-- Name: idx_admin_notifications_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admin_notifications_status ON public.admin_notifications USING btree (status);


--
-- Name: idx_admin_notifications_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admin_notifications_type ON public.admin_notifications USING btree (type);


--
-- Name: idx_ai_conversations_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_conversations_updated_at ON public.ai_conversations USING btree (updated_at DESC);


--
-- Name: idx_ai_conversations_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_conversations_user_id ON public.ai_conversations USING btree (user_id);


--
-- Name: idx_ai_feedback_conversation_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_feedback_conversation_id ON public.ai_feedback USING btree (conversation_id);


--
-- Name: idx_ai_feedback_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_feedback_created_at ON public.ai_feedback USING btree (created_at DESC);


--
-- Name: idx_ai_feedback_feedback_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_feedback_feedback_type ON public.ai_feedback USING btree (feedback_type);


--
-- Name: idx_ai_feedback_is_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_feedback_is_read ON public.ai_feedback USING btree (is_read);


--
-- Name: idx_ai_feedback_rating; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_feedback_rating ON public.ai_feedback USING btree (rating);


--
-- Name: idx_ai_feedback_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_feedback_user_id ON public.ai_feedback USING btree (user_id);


--
-- Name: idx_ai_messages_conversation_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_messages_conversation_id ON public.ai_messages USING btree (conversation_id);


--
-- Name: idx_ai_messages_timestamp; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_messages_timestamp ON public.ai_messages USING btree ("timestamp" DESC);


--
-- Name: idx_ai_platform_knowledge_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_platform_knowledge_category ON public.ai_platform_knowledge USING btree (category);


--
-- Name: idx_ai_platform_knowledge_keywords; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_platform_knowledge_keywords ON public.ai_platform_knowledge USING gin (keywords);


--
-- Name: idx_ai_reviews_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_reviews_created ON public.ai_reviews USING btree (created_at DESC);


--
-- Name: idx_ai_reviews_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_reviews_created_at ON public.ai_reviews USING btree (created_at DESC);


--
-- Name: idx_ai_reviews_overall_score; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_reviews_overall_score ON public.ai_reviews USING btree (overall_score DESC);


--
-- Name: idx_ai_reviews_score; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_reviews_score ON public.ai_reviews USING btree (overall_score DESC);


--
-- Name: idx_ai_reviews_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_reviews_user ON public.ai_reviews USING btree (user_id);


--
-- Name: idx_ai_reviews_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_reviews_user_id ON public.ai_reviews USING btree (user_id);


--
-- Name: idx_ai_reviews_work; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_reviews_work ON public.ai_reviews USING btree (work_id);


--
-- Name: idx_ai_reviews_work_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_reviews_work_id ON public.ai_reviews USING btree (work_id);


--
-- Name: idx_ai_user_memories_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_user_memories_type ON public.ai_user_memories USING btree (memory_type);


--
-- Name: idx_ai_user_memories_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_user_memories_user_id ON public.ai_user_memories USING btree (user_id);


--
-- Name: idx_alert_notifications_alert_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alert_notifications_alert_id ON public.alert_notifications USING btree (alert_id);


--
-- Name: idx_alert_notifications_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alert_notifications_status ON public.alert_notifications USING btree (status);


--
-- Name: idx_alert_records_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alert_records_created_at ON public.alert_records USING btree (created_at);


--
-- Name: idx_alert_records_metric_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alert_records_metric_created ON public.alert_records USING btree (metric_type, created_at);


--
-- Name: idx_alert_records_rule_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alert_records_rule_id ON public.alert_records USING btree (rule_id);


--
-- Name: idx_alert_records_severity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alert_records_severity ON public.alert_records USING btree (severity);


--
-- Name: idx_alert_records_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alert_records_status ON public.alert_records USING btree (status);


--
-- Name: idx_alert_rules_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alert_rules_created_by ON public.alert_rules USING btree (created_by);


--
-- Name: idx_alert_rules_enabled; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alert_rules_enabled ON public.alert_rules USING btree (enabled);


--
-- Name: idx_alert_rules_metric; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_alert_rules_metric ON public.alert_rules USING btree (metric_type);


--
-- Name: idx_analytics_daily_stats_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_analytics_daily_stats_created_at ON public.analytics_daily_stats USING btree (created_at);


--
-- Name: idx_analytics_daily_stats_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_analytics_daily_stats_date ON public.analytics_daily_stats USING btree (stat_date);


--
-- Name: idx_analytics_hourly_stats_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_analytics_hourly_stats_created_at ON public.analytics_hourly_stats USING btree (created_at);


--
-- Name: idx_analytics_hourly_stats_hour; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_analytics_hourly_stats_hour ON public.analytics_hourly_stats USING btree (stat_hour);


--
-- Name: idx_api_usage_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_api_usage_created_at ON public.api_usage USING btree (created_at);


--
-- Name: idx_api_usage_endpoint; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_api_usage_endpoint ON public.api_usage USING btree (endpoint);


--
-- Name: idx_api_usage_status_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_api_usage_status_code ON public.api_usage USING btree (status_code);


--
-- Name: idx_api_usage_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_api_usage_user_id ON public.api_usage USING btree (user_id);


--
-- Name: idx_behavior_events_item; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_behavior_events_item ON public.user_behavior_events USING btree (item_id, item_type);


--
-- Name: idx_behavior_events_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_behavior_events_type ON public.user_behavior_events USING btree (event_type);


--
-- Name: idx_behavior_events_user_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_behavior_events_user_time ON public.user_behavior_events USING btree (user_id, created_at DESC);


--
-- Name: idx_blind_box_sales_box_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_blind_box_sales_box_type ON public.blind_box_sales USING btree (box_type);


--
-- Name: idx_blind_box_sales_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_blind_box_sales_created_at ON public.blind_box_sales USING btree (created_at);


--
-- Name: idx_blind_box_sales_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_blind_box_sales_status ON public.blind_box_sales USING btree (status);


--
-- Name: idx_blind_box_sales_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_blind_box_sales_user_id ON public.blind_box_sales USING btree (user_id);


--
-- Name: idx_bookmarks_post_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookmarks_post_id ON public.bookmarks USING btree (post_id);


--
-- Name: idx_bookmarks_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookmarks_user_id ON public.bookmarks USING btree (user_id);


--
-- Name: idx_brand_accounts_brand; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_brand_accounts_brand ON public.brand_accounts USING btree (brand_id);


--
-- Name: idx_brand_accounts_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_brand_accounts_user ON public.brand_accounts USING btree (user_id);


--
-- Name: idx_brand_events_brand; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_brand_events_brand ON public.brand_events USING btree (brand_id);


--
-- Name: idx_brand_events_organizer; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_brand_events_organizer ON public.brand_events USING btree (organizer_id);


--
-- Name: idx_brand_events_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_brand_events_status ON public.brand_events USING btree (status);


--
-- Name: idx_brand_partnerships_applicant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_brand_partnerships_applicant ON public.brand_partnerships USING btree (applicant_id);


--
-- Name: idx_brand_partnerships_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_brand_partnerships_status ON public.brand_partnerships USING btree (status);


--
-- Name: idx_brand_ratings_brand_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_brand_ratings_brand_id ON public.brand_ratings USING btree (brand_id);


--
-- Name: idx_brand_ratings_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_brand_ratings_created_at ON public.brand_ratings USING btree (created_at DESC);


--
-- Name: idx_brand_ratings_rating; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_brand_ratings_rating ON public.brand_ratings USING btree (rating);


--
-- Name: idx_brand_ratings_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_brand_ratings_user_id ON public.brand_ratings USING btree (user_id);


--
-- Name: idx_brand_task_analytics_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_brand_task_analytics_date ON public.brand_task_analytics USING btree (date);


--
-- Name: idx_brand_task_analytics_task; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_brand_task_analytics_task ON public.brand_task_analytics USING btree (task_id);


--
-- Name: idx_brand_task_participants_creator; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_brand_task_participants_creator ON public.brand_task_participants USING btree (creator_id);


--
-- Name: idx_brand_task_participants_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_brand_task_participants_status ON public.brand_task_participants USING btree (status);


--
-- Name: idx_brand_task_participants_task; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_brand_task_participants_task ON public.brand_task_participants USING btree (task_id);


--
-- Name: idx_brand_task_submissions_creator; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_brand_task_submissions_creator ON public.brand_task_submissions USING btree (creator_id);


--
-- Name: idx_brand_task_submissions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_brand_task_submissions_status ON public.brand_task_submissions USING btree (status);


--
-- Name: idx_brand_task_submissions_task; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_brand_task_submissions_task ON public.brand_task_submissions USING btree (task_id);


--
-- Name: idx_brand_task_submissions_work; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_brand_task_submissions_work ON public.brand_task_submissions USING btree (work_id);


--
-- Name: idx_brand_tasks_brand; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_brand_tasks_brand ON public.brand_tasks USING btree (brand_id);


--
-- Name: idx_brand_tasks_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_brand_tasks_created ON public.brand_tasks USING btree (created_at DESC);


--
-- Name: idx_brand_tasks_dates; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_brand_tasks_dates ON public.brand_tasks USING btree (start_date, end_date);


--
-- Name: idx_brand_tasks_publisher; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_brand_tasks_publisher ON public.brand_tasks USING btree (publisher_id);


--
-- Name: idx_brand_tasks_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_brand_tasks_status ON public.brand_tasks USING btree (status);


--
-- Name: idx_brand_transactions_account; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_brand_transactions_account ON public.brand_transactions USING btree (account_id);


--
-- Name: idx_brand_transactions_brand; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_brand_transactions_brand ON public.brand_transactions USING btree (brand_id);


--
-- Name: idx_brand_transactions_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_brand_transactions_created ON public.brand_transactions USING btree (created_at DESC);


--
-- Name: idx_brand_transactions_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_brand_transactions_type ON public.brand_transactions USING btree (type);


--
-- Name: idx_brand_wizard_drafts_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_brand_wizard_drafts_updated_at ON public.brand_wizard_drafts USING btree (updated_at DESC);


--
-- Name: idx_brand_wizard_drafts_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_brand_wizard_drafts_user_id ON public.brand_wizard_drafts USING btree (user_id);


--
-- Name: idx_business_tasks_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_business_tasks_created ON public.business_tasks USING btree (created_at DESC);


--
-- Name: idx_business_tasks_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_business_tasks_status ON public.business_tasks USING btree (status);


--
-- Name: idx_business_tasks_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_business_tasks_type ON public.business_tasks USING btree (type);


--
-- Name: idx_categories_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_categories_name ON public.categories USING btree (name);


--
-- Name: idx_channel_costs_channel; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_channel_costs_channel ON public.channel_costs USING btree (channel);


--
-- Name: idx_channel_costs_start_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_channel_costs_start_date ON public.channel_costs USING btree (start_date);


--
-- Name: idx_checkin_records_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_checkin_records_date ON public.checkin_records USING btree (checkin_date);


--
-- Name: idx_checkin_records_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_checkin_records_user_id ON public.checkin_records USING btree (user_id);


--
-- Name: idx_cold_start_logs_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cold_start_logs_time ON public.cold_start_recommendation_logs USING btree (recommended_at);


--
-- Name: idx_cold_start_logs_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cold_start_logs_type ON public.cold_start_recommendation_logs USING btree (recommendation_type);


--
-- Name: idx_cold_start_logs_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cold_start_logs_user_id ON public.cold_start_recommendation_logs USING btree (user_id);


--
-- Name: idx_comments_post_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comments_post_id ON public.comments USING btree (post_id);


--
-- Name: idx_comments_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_comments_user_id ON public.comments USING btree (user_id);


--
-- Name: idx_commercial_opportunities_deadline; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_commercial_opportunities_deadline ON public.commercial_opportunities USING btree (deadline);


--
-- Name: idx_commercial_opportunities_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_commercial_opportunities_status ON public.commercial_opportunities USING btree (status);


--
-- Name: idx_communities_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_communities_created_at ON public.communities USING btree (created_at);


--
-- Name: idx_communities_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_communities_name ON public.communities USING btree (name);


--
-- Name: idx_communities_tags; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_communities_tags ON public.communities USING gin (tags);


--
-- Name: idx_community_invitation_history_action_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_community_invitation_history_action_type ON public.community_invitation_history USING btree (action_type);


--
-- Name: idx_community_invitation_history_community_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_community_invitation_history_community_id ON public.community_invitation_history USING btree (community_id);


--
-- Name: idx_community_invitation_history_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_community_invitation_history_created_at ON public.community_invitation_history USING btree (created_at);


--
-- Name: idx_community_invitation_history_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_community_invitation_history_user_id ON public.community_invitation_history USING btree (user_id);


--
-- Name: idx_community_invitations_community_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_community_invitations_community_id ON public.community_invitations USING btree (community_id);


--
-- Name: idx_community_invitations_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_community_invitations_created_at ON public.community_invitations USING btree (created_at);


--
-- Name: idx_community_invitations_invite_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_community_invitations_invite_code ON public.community_invitations USING btree (invite_code);


--
-- Name: idx_community_invitations_invitee_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_community_invitations_invitee_id ON public.community_invitations USING btree (invitee_id);


--
-- Name: idx_community_invitations_inviter_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_community_invitations_inviter_id ON public.community_invitations USING btree (inviter_id);


--
-- Name: idx_community_invitations_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_community_invitations_status ON public.community_invitations USING btree (status);


--
-- Name: idx_community_join_requests_community_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_community_join_requests_community_id ON public.community_join_requests USING btree (community_id);


--
-- Name: idx_community_join_requests_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_community_join_requests_created_at ON public.community_join_requests USING btree (created_at);


--
-- Name: idx_community_join_requests_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_community_join_requests_status ON public.community_join_requests USING btree (status);


--
-- Name: idx_community_join_requests_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_community_join_requests_user_id ON public.community_join_requests USING btree (user_id);


--
-- Name: idx_community_members_community_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_community_members_community_id ON public.community_members USING btree (community_id);


--
-- Name: idx_community_members_last_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_community_members_last_active ON public.community_members USING btree (community_id, last_active);


--
-- Name: idx_community_members_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_community_members_user_id ON public.community_members USING btree (user_id);


--
-- Name: idx_community_posts_community_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_community_posts_community_id ON public.community_posts USING btree (community_id);


--
-- Name: idx_community_posts_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_community_posts_user_id ON public.community_posts USING btree (user_id);


--
-- Name: idx_consumption_records_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_consumption_records_user_id ON public.consumption_records USING btree (user_id);


--
-- Name: idx_consumption_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_consumption_user_id ON public.consumption_records USING btree (user_id);


--
-- Name: idx_content_quality_assessments_content_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_content_quality_assessments_content_id ON public.content_quality_assessments USING btree (content_id);


--
-- Name: idx_content_quality_content_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_content_quality_content_id ON public.content_quality_assessments USING btree (content_id);


--
-- Name: idx_content_quality_score; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_content_quality_score ON public.content_quality_assessments USING btree (overall_quality_score DESC);


--
-- Name: idx_content_stats_content_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_content_stats_content_id ON public.content_stats USING btree (content_id);


--
-- Name: idx_content_stats_engagement; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_content_stats_engagement ON public.content_stats USING btree (engagement_rate DESC) WHERE (engagement_rate > (0)::numeric);


--
-- Name: idx_content_vectors_author; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_content_vectors_author ON public.content_vectors USING btree (author_id);


--
-- Name: idx_content_vectors_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_content_vectors_category ON public.content_vectors USING btree (category);


--
-- Name: idx_content_vectors_tags; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_content_vectors_tags ON public.content_vectors USING gin (tags);


--
-- Name: idx_conversations_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_conversations_created_at ON public.conversations USING btree (created_at);


--
-- Name: idx_conversations_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_conversations_user_id ON public.conversations USING btree (user_id);


--
-- Name: idx_conversion_events_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_conversion_events_created_at ON public.conversion_events USING btree (created_at);


--
-- Name: idx_conversion_events_promoted_work_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_conversion_events_promoted_work_id ON public.conversion_events USING btree (promoted_work_id);


--
-- Name: idx_conversion_events_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_conversion_events_type ON public.conversion_events USING btree (conversion_type);


--
-- Name: idx_conversion_events_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_conversion_events_user_id ON public.conversion_events USING btree (user_id);


--
-- Name: idx_copyright_assets_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_copyright_assets_status ON public.copyright_assets USING btree (status);


--
-- Name: idx_copyright_assets_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_copyright_assets_user_id ON public.copyright_assets USING btree (user_id);


--
-- Name: idx_creative_profiles_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_creative_profiles_user_id ON public.user_creative_profiles USING btree (user_id);


--
-- Name: idx_creator_earnings_creator; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_creator_earnings_creator ON public.creator_earnings USING btree (creator_id);


--
-- Name: idx_creator_earnings_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_creator_earnings_status ON public.creator_earnings USING btree (status);


--
-- Name: idx_creator_earnings_task; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_creator_earnings_task ON public.creator_earnings USING btree (task_id);


--
-- Name: idx_creator_level_configs_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_creator_level_configs_is_active ON public.creator_level_configs USING btree (is_active);


--
-- Name: idx_creator_level_configs_level; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_creator_level_configs_level ON public.creator_level_configs USING btree (level);


--
-- Name: idx_creator_revenue_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_creator_revenue_user ON public.creator_revenue USING btree (user_id);


--
-- Name: idx_cultural_knowledge_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cultural_knowledge_category ON public.cultural_knowledge USING btree (category);


--
-- Name: idx_cultural_knowledge_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cultural_knowledge_created_at ON public.cultural_knowledge USING btree (created_at DESC);


--
-- Name: idx_cultural_knowledge_search; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cultural_knowledge_search ON public.cultural_knowledge USING gin (to_tsvector('simple'::regconfig, (((title)::text || ' '::text) || COALESCE(content, ''::text))));


--
-- Name: idx_cultural_knowledge_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cultural_knowledge_status ON public.cultural_knowledge USING btree (status);


--
-- Name: idx_daily_stats_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_daily_stats_date ON public.user_behavior_daily_stats USING btree (stat_date);


--
-- Name: idx_daily_stats_user_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_daily_stats_user_date ON public.user_behavior_daily_stats USING btree (user_id, stat_date);


--
-- Name: idx_direct_messages_conversation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_direct_messages_conversation ON public.direct_messages USING btree (sender_id, receiver_id);


--
-- Name: idx_direct_messages_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_direct_messages_created_at ON public.direct_messages USING btree (created_at DESC);


--
-- Name: idx_direct_messages_receiver; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_direct_messages_receiver ON public.direct_messages USING btree (receiver_id);


--
-- Name: idx_direct_messages_sender; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_direct_messages_sender ON public.direct_messages USING btree (sender_id);


--
-- Name: idx_drafts_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_drafts_updated_at ON public.drafts USING btree (updated_at);


--
-- Name: idx_drafts_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_drafts_user_id ON public.drafts USING btree (user_id);


--
-- Name: idx_errors_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_errors_created_at ON public.errors USING btree (created_at);


--
-- Name: idx_errors_error_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_errors_error_type ON public.errors USING btree (error_type);


--
-- Name: idx_errors_is_resolved; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_errors_is_resolved ON public.errors USING btree (is_resolved);


--
-- Name: idx_errors_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_errors_user_id ON public.errors USING btree (user_id);


--
-- Name: idx_event_bookmarks_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_bookmarks_event_id ON public.event_bookmarks USING btree (event_id);


--
-- Name: idx_event_bookmarks_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_bookmarks_user_id ON public.event_bookmarks USING btree (user_id);


--
-- Name: idx_event_daily_stats_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_daily_stats_date ON public.event_daily_stats USING btree (stat_date);


--
-- Name: idx_event_daily_stats_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_daily_stats_event_id ON public.event_daily_stats USING btree (event_id);


--
-- Name: idx_event_likes_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_likes_event_id ON public.event_likes USING btree (event_id);


--
-- Name: idx_event_likes_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_likes_user_id ON public.event_likes USING btree (user_id);


--
-- Name: idx_event_notifications_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_notifications_created ON public.event_notifications USING btree (created_at DESC);


--
-- Name: idx_event_notifications_event; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_notifications_event ON public.event_notifications USING btree (event_id);


--
-- Name: idx_event_notifications_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_notifications_read ON public.event_notifications USING btree (is_read);


--
-- Name: idx_event_notifications_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_notifications_user ON public.event_notifications USING btree (user_id);


--
-- Name: idx_event_participants_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_participants_event_id ON public.event_participants USING btree (event_id);


--
-- Name: idx_event_participants_progress; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_participants_progress ON public.event_participants USING btree (progress);


--
-- Name: idx_event_participants_step; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_participants_step ON public.event_participants USING btree (current_step);


--
-- Name: idx_event_participants_submission; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_participants_submission ON public.event_participants USING btree (submitted_work_id);


--
-- Name: idx_event_participants_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_participants_user_id ON public.event_participants USING btree (user_id);


--
-- Name: idx_event_prizes_display_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_prizes_display_order ON public.event_prizes USING btree (display_order);


--
-- Name: idx_event_prizes_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_prizes_event_id ON public.event_prizes USING btree (event_id);


--
-- Name: idx_event_prizes_level; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_prizes_level ON public.event_prizes USING btree (level);


--
-- Name: idx_event_prizes_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_prizes_status ON public.event_prizes USING btree (status);


--
-- Name: idx_event_submissions_event; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_submissions_event ON public.event_submissions USING btree (event_id);


--
-- Name: idx_event_submissions_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_submissions_event_id ON public.event_submissions USING btree (event_id);


--
-- Name: idx_event_submissions_participation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_submissions_participation ON public.event_submissions USING btree (participation_id);


--
-- Name: idx_event_submissions_reviewed_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_submissions_reviewed_at ON public.event_submissions USING btree (reviewed_at DESC);


--
-- Name: idx_event_submissions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_submissions_status ON public.event_submissions USING btree (status);


--
-- Name: idx_event_submissions_submitted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_submissions_submitted_at ON public.event_submissions USING btree (submitted_at DESC);


--
-- Name: idx_event_submissions_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_submissions_user ON public.event_submissions USING btree (user_id);


--
-- Name: idx_event_submissions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_submissions_user_id ON public.event_submissions USING btree (user_id);


--
-- Name: idx_event_works_event; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_works_event ON public.event_works USING btree (event_id);


--
-- Name: idx_event_works_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_event_works_user ON public.event_works USING btree (user_id);


--
-- Name: idx_events_brand_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_events_brand_id ON public.events USING btree (brand_id);


--
-- Name: idx_events_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_events_category ON public.events USING btree (category);


--
-- Name: idx_events_organizer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_events_organizer_id ON public.events USING btree (organizer_id);


--
-- Name: idx_events_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_events_status ON public.events USING btree (status);


--
-- Name: idx_exchange_records_processed_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_exchange_records_processed_at ON public.exchange_records USING btree (processed_at);


--
-- Name: idx_exchange_records_status_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_exchange_records_status_created_at ON public.exchange_records USING btree (status, created_at DESC);


--
-- Name: idx_exchange_records_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_exchange_records_user_id ON public.exchange_records USING btree (user_id);


--
-- Name: idx_exchange_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_exchange_user_id ON public.exchange_records USING btree (user_id);