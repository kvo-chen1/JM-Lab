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


--
-- Name: idx_favorites_post_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_favorites_post_id ON public.favorites USING btree (post_id);


--
-- Name: idx_favorites_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_favorites_user_id ON public.favorites USING btree (user_id);


--
-- Name: idx_feed_collects_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_feed_collects_created_at ON public.feed_collects USING btree (created_at DESC);


--
-- Name: idx_feed_collects_feed_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_feed_collects_feed_id ON public.feed_collects USING btree (feed_id);


--
-- Name: idx_feed_collects_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_feed_collects_user_id ON public.feed_collects USING btree (user_id);


--
-- Name: idx_feed_comment_likes_comment_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_feed_comment_likes_comment_id ON public.feed_comment_likes USING btree (comment_id);


--
-- Name: idx_feed_comment_likes_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_feed_comment_likes_user_id ON public.feed_comment_likes USING btree (user_id);


--
-- Name: idx_feed_comments_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_feed_comments_created_at ON public.feed_comments USING btree (created_at DESC);


--
-- Name: idx_feed_comments_feed_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_feed_comments_feed_id ON public.feed_comments USING btree (feed_id);


--
-- Name: idx_feed_comments_parent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_feed_comments_parent_id ON public.feed_comments USING btree (parent_id);


--
-- Name: idx_feed_comments_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_feed_comments_user_id ON public.feed_comments USING btree (user_id);


--
-- Name: idx_feed_likes_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_feed_likes_created_at ON public.feed_likes USING btree (created_at DESC);


--
-- Name: idx_feed_likes_feed_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_feed_likes_feed_id ON public.feed_likes USING btree (feed_id);


--
-- Name: idx_feed_likes_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_feed_likes_user_id ON public.feed_likes USING btree (user_id);


--
-- Name: idx_feedback_process_logs_feedback_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_feedback_process_logs_feedback_id ON public.feedback_process_logs USING btree (feedback_id);


--
-- Name: idx_feeds_community_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_feeds_community_id ON public.feeds USING btree (community_id);


--
-- Name: idx_feeds_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_feeds_created_at ON public.feeds USING btree (created_at DESC);


--
-- Name: idx_feeds_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_feeds_user_id ON public.feeds USING btree (user_id);


--
-- Name: idx_final_ranking_publishes_event_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_final_ranking_publishes_event_id ON public.final_ranking_publishes USING btree (event_id);


--
-- Name: idx_follows_follower_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_follows_follower_id ON public.follows USING btree (follower_id);


--
-- Name: idx_follows_following_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_follows_following_id ON public.follows USING btree (following_id);


--
-- Name: idx_forbidden_words_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_forbidden_words_active ON public.forbidden_words USING btree (is_active);


--
-- Name: idx_forbidden_words_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_forbidden_words_category ON public.forbidden_words USING btree (category);


--
-- Name: idx_friend_requests_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_friend_requests_created_at ON public.friend_requests USING btree (created_at DESC);


--
-- Name: idx_friend_requests_receiver; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_friend_requests_receiver ON public.friend_requests USING btree (receiver_id);


--
-- Name: idx_friend_requests_sender; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_friend_requests_sender ON public.friend_requests USING btree (sender_id);


--
-- Name: idx_friend_requests_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_friend_requests_status ON public.friend_requests USING btree (status);


--
-- Name: idx_generation_tasks_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_generation_tasks_created_at ON public.generation_tasks USING btree (created_at DESC);


--
-- Name: idx_generation_tasks_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_generation_tasks_status ON public.generation_tasks USING btree (status);


--
-- Name: idx_generation_tasks_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_generation_tasks_user_id ON public.generation_tasks USING btree (user_id);


--
-- Name: idx_generation_tasks_user_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_generation_tasks_user_status ON public.generation_tasks USING btree (user_id, status);


--
-- Name: idx_home_recommendations_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_home_recommendations_active ON public.home_recommendations USING btree (is_active);


--
-- Name: idx_home_recommendations_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_home_recommendations_created_by ON public.home_recommendations USING btree (created_by);


--
-- Name: idx_home_recommendations_dates; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_home_recommendations_dates ON public.home_recommendations USING btree (start_date, end_date);


--
-- Name: idx_home_recommendations_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_home_recommendations_order ON public.home_recommendations USING btree (order_index);


--
-- Name: idx_home_recommendations_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_home_recommendations_type ON public.home_recommendations USING btree (item_type);


--
-- Name: idx_hot_searches_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hot_searches_category ON public.hot_searches USING btree (category);


--
-- Name: idx_hot_searches_is_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hot_searches_is_active ON public.hot_searches USING btree (is_active);


--
-- Name: idx_hot_searches_search_count; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hot_searches_search_count ON public.hot_searches USING btree (search_count DESC);


--
-- Name: idx_hot_searches_trend_score; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_hot_searches_trend_score ON public.hot_searches USING btree (trend_score DESC);


--
-- Name: idx_invitation_reports_community_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invitation_reports_community_id ON public.invitation_reports USING btree (community_id);


--
-- Name: idx_invitation_reports_reported_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invitation_reports_reported_user_id ON public.invitation_reports USING btree (reported_user_id);


--
-- Name: idx_invitation_reports_reporter_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invitation_reports_reporter_id ON public.invitation_reports USING btree (reporter_id);


--
-- Name: idx_invitation_reports_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invitation_reports_status ON public.invitation_reports USING btree (status);


--
-- Name: idx_invite_records_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invite_records_code ON public.invite_records USING btree (invite_code);


--
-- Name: idx_invite_records_inviter; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invite_records_inviter ON public.invite_records USING btree (inviter_id);


--
-- Name: idx_invite_records_inviter_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_invite_records_inviter_id ON public.invite_records USING btree (inviter_id);


--
-- Name: idx_ip_activities_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ip_activities_created_at ON public.ip_activities USING btree (created_at DESC);


--
-- Name: idx_ip_activities_is_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ip_activities_is_read ON public.ip_activities USING btree (is_read);


--
-- Name: idx_ip_activities_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ip_activities_type ON public.ip_activities USING btree (type);


--
-- Name: idx_ip_activities_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ip_activities_user_id ON public.ip_activities USING btree (user_id);


--
-- Name: idx_ip_assets_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ip_assets_created_at ON public.ip_assets USING btree (created_at DESC);


--
-- Name: idx_ip_assets_is_featured; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ip_assets_is_featured ON public.ip_assets USING btree (is_featured);


--
-- Name: idx_ip_assets_priority; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ip_assets_priority ON public.ip_assets USING btree (priority);


--
-- Name: idx_ip_assets_reviewed_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ip_assets_reviewed_at ON public.ip_assets USING btree (reviewed_at);


--
-- Name: idx_ip_assets_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ip_assets_status ON public.ip_assets USING btree (status);


--
-- Name: idx_ip_assets_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ip_assets_type ON public.ip_assets USING btree (type);


--
-- Name: idx_ip_assets_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ip_assets_user_id ON public.ip_assets USING btree (user_id);


--
-- Name: idx_ip_partnerships_ip_asset_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ip_partnerships_ip_asset_id ON public.ip_partnerships USING btree (ip_asset_id);


--
-- Name: idx_ip_partnerships_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ip_partnerships_status ON public.ip_partnerships USING btree (status);


--
-- Name: idx_ip_partnerships_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ip_partnerships_user_id ON public.ip_partnerships USING btree (user_id);


--
-- Name: idx_ip_stages_completed; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ip_stages_completed ON public.ip_stages USING btree (completed);


--
-- Name: idx_ip_stages_ip_asset_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ip_stages_ip_asset_id ON public.ip_stages USING btree (ip_asset_id);


--
-- Name: idx_likes_post_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_likes_post_id ON public.likes USING btree (post_id);


--
-- Name: idx_likes_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_likes_user_id ON public.likes USING btree (user_id);


--
-- Name: idx_lottery_activities_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lottery_activities_status ON public.lottery_activities USING btree (status);


--
-- Name: idx_lottery_activities_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lottery_activities_time ON public.lottery_activities USING btree (start_time, end_time);


--
-- Name: idx_lottery_prizes_activity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lottery_prizes_activity ON public.lottery_prizes USING btree (activity_id);


--
-- Name: idx_lottery_spin_records_activity; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lottery_spin_records_activity ON public.lottery_spin_records USING btree (activity_id);


--
-- Name: idx_lottery_spin_records_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lottery_spin_records_time ON public.lottery_spin_records USING btree (created_at);


--
-- Name: idx_lottery_spin_records_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_lottery_spin_records_user ON public.lottery_spin_records USING btree (user_id);


--
-- Name: idx_membership_history_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_membership_history_created_at ON public.membership_history USING btree (created_at DESC);


--
-- Name: idx_membership_history_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_membership_history_user_id ON public.membership_history USING btree (user_id);


--
-- Name: idx_membership_orders_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_membership_orders_created_at ON public.membership_orders USING btree (created_at DESC);


--
-- Name: idx_membership_orders_payment_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_membership_orders_payment_code ON public.membership_orders USING btree (payment_code);


--
-- Name: idx_membership_orders_payment_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_membership_orders_payment_type ON public.membership_orders USING btree (payment_type);


--
-- Name: idx_membership_orders_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_membership_orders_status ON public.membership_orders USING btree (status);


--
-- Name: idx_membership_orders_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_membership_orders_user_id ON public.membership_orders USING btree (user_id);


--
-- Name: idx_membership_orders_verified_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_membership_orders_verified_by ON public.membership_orders USING btree (verified_by);


--
-- Name: idx_membership_usage_stats_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_membership_usage_stats_date ON public.membership_usage_stats USING btree (stat_date);


--
-- Name: idx_membership_usage_stats_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_membership_usage_stats_user_id ON public.membership_usage_stats USING btree (user_id);


--
-- Name: idx_memberships_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_memberships_created_at ON public.memberships USING btree (created_at);


--
-- Name: idx_memberships_plan_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_memberships_plan_type ON public.memberships USING btree (plan_type);


--
-- Name: idx_memberships_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_memberships_status ON public.memberships USING btree (status);


--
-- Name: idx_memberships_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_memberships_user_id ON public.memberships USING btree (user_id);


--
-- Name: idx_messages_channel_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_channel_id ON public.messages USING btree (channel_id);


--
-- Name: idx_messages_community_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_community_id ON public.messages USING btree (community_id);


--
-- Name: idx_messages_conversation_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_conversation_id ON public.messages USING btree (conversation_id);


--
-- Name: idx_messages_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_created_at ON public.messages USING btree (created_at);


--
-- Name: idx_messages_receiver_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_receiver_id ON public.messages USING btree (receiver_id);


--
-- Name: idx_messages_receiver_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_receiver_read ON public.messages USING btree (receiver_id, is_read);


--
-- Name: idx_messages_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_role ON public.messages USING btree (role);


--
-- Name: idx_messages_sender_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_sender_id ON public.messages USING btree (sender_id);


--
-- Name: idx_messages_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_status ON public.messages USING btree (status);


--
-- Name: idx_messages_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_user_id ON public.messages USING btree (user_id);


--
-- Name: idx_metrics_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_metrics_created ON public.recommendation_metrics USING btree (created_at);


--
-- Name: idx_metrics_recommendation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_metrics_recommendation ON public.recommendation_metrics USING btree (recommendation_id);


--
-- Name: idx_metrics_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_metrics_user ON public.recommendation_metrics USING btree (user_id);


--
-- Name: idx_mindmaps_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mindmaps_created_at ON public.inspiration_mindmaps USING btree (created_at DESC);


--
-- Name: idx_mindmaps_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_mindmaps_user_id ON public.inspiration_mindmaps USING btree (user_id);


--
-- Name: idx_moderation_logs_action; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_moderation_logs_action ON public.moderation_logs USING btree (action);


--
-- Name: idx_moderation_logs_content; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_moderation_logs_content ON public.moderation_logs USING btree (content_id, content_type);


--
-- Name: idx_moderation_logs_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_moderation_logs_created ON public.moderation_logs USING btree (created_at DESC);


--
-- Name: idx_moderation_logs_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_moderation_logs_user ON public.moderation_logs USING btree (user_id);


--
-- Name: idx_moderation_rules_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_moderation_rules_type ON public.moderation_rules USING btree (rule_type);


--
-- Name: idx_new_content_boost_end_time; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_new_content_boost_end_time ON public.new_content_boost_pool USING btree (boost_end_time);


--
-- Name: idx_new_content_boost_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_new_content_boost_status ON public.new_content_boost_pool USING btree (current_status);


--
-- Name: idx_nodes_map_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nodes_map_id ON public.inspiration_nodes USING btree (map_id);


--
-- Name: idx_nodes_parent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_nodes_parent_id ON public.inspiration_nodes USING btree (parent_id);


--
-- Name: idx_notifications_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at DESC);


--
-- Name: idx_notifications_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_type ON public.notifications USING btree (type);


--
-- Name: idx_notifications_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);


--
-- Name: idx_notifications_user_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_user_read ON public.notifications USING btree (user_id, is_read);


--
-- Name: idx_order_applications_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_applications_created_at ON public.order_applications USING btree (created_at);


--
-- Name: idx_order_applications_creator_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_applications_creator_id ON public.order_applications USING btree (creator_id);


--
-- Name: idx_order_applications_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_applications_order_id ON public.order_applications USING btree (order_id);


--
-- Name: idx_order_applications_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_applications_status ON public.order_applications USING btree (status);


--
-- Name: idx_order_audits_brand_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_audits_brand_name ON public.order_audits USING btree (brand_name);


--
-- Name: idx_order_audits_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_audits_created_at ON public.order_audits USING btree (created_at DESC);


--
-- Name: idx_order_audits_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_audits_status ON public.order_audits USING btree (status);


--
-- Name: idx_order_audits_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_audits_type ON public.order_audits USING btree (type);


--
-- Name: idx_order_audits_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_audits_user_id ON public.order_audits USING btree (user_id);


--
-- Name: idx_order_execution_clicks_clicked_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_execution_clicks_clicked_at ON public.order_execution_clicks USING btree (clicked_at DESC);


--
-- Name: idx_order_execution_clicks_execution_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_execution_clicks_execution_id ON public.order_execution_clicks USING btree (execution_id);


--
-- Name: idx_order_execution_clicks_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_execution_clicks_user_id ON public.order_execution_clicks USING btree (user_id);


--
-- Name: idx_order_execution_daily_stats_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_execution_daily_stats_date ON public.order_execution_daily_stats USING btree (date DESC);


--
-- Name: idx_order_execution_daily_stats_execution_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_execution_daily_stats_execution_id ON public.order_execution_daily_stats USING btree (execution_id);


--
-- Name: idx_order_executions_brand_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_executions_brand_name ON public.order_executions USING btree (brand_name);


--
-- Name: idx_order_executions_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_executions_created_at ON public.order_executions USING btree (created_at DESC);


--
-- Name: idx_order_executions_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_executions_order_id ON public.order_executions USING btree (order_id);


--
-- Name: idx_order_executions_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_executions_status ON public.order_executions USING btree (status);


--
-- Name: idx_order_executions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_executions_user_id ON public.order_executions USING btree (user_id);


--
-- Name: idx_organizer_backups_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_organizer_backups_created_at ON public.organizer_backups USING btree (created_at DESC);


--
-- Name: idx_organizer_backups_organizer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_organizer_backups_organizer_id ON public.organizer_backups USING btree (organizer_id);


--
-- Name: idx_organizer_settings_organizer_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_organizer_settings_organizer_id ON public.organizer_settings USING btree (organizer_id);


--
-- Name: idx_page_views_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_page_views_created_at ON public.page_views USING btree (created_at);


--
-- Name: idx_page_views_page_path; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_page_views_page_path ON public.page_views USING btree (page_path);


--
-- Name: idx_page_views_session_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_page_views_session_id ON public.page_views USING btree (session_id);


--
-- Name: idx_page_views_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_page_views_user_id ON public.page_views USING btree (user_id);


--
-- Name: idx_pending_messages_updated_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pending_messages_updated_at ON public.pending_messages USING btree (updated_at);


--
-- Name: idx_pending_messages_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pending_messages_user_id ON public.pending_messages USING btree (user_id);


--
-- Name: idx_points_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_points_created_at ON public.points USING btree (created_at);


--
-- Name: idx_points_records_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_points_records_created_at ON public.points_records USING btree (created_at DESC);


--
-- Name: idx_points_records_source_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_points_records_source_type ON public.points_records USING btree (source_type);


--
-- Name: idx_points_records_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_points_records_type ON public.points_records USING btree (type);


--
-- Name: idx_points_records_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_points_records_user_id ON public.points_records USING btree (user_id);

