COPY public.works_likes (user_id, work_id, created_at) FROM stdin;
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
--
-- Name: idx_points_type; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_points_type ON public.points USING btree (type);
--
-- Name: idx_points_user_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_points_user_id ON public.points USING btree (user_id);
--
-- Name: idx_post_tags_post_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_post_tags_post_id ON public.post_tags USING btree (post_id);
--
-- Name: idx_post_tags_tag_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_post_tags_tag_id ON public.post_tags USING btree (tag_id);
--
-- Name: idx_posts_community_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_posts_community_id ON public.posts USING btree (community_id);
--
-- Name: idx_posts_user_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_posts_user_id ON public.posts USING btree (user_id);
--
-- Name: idx_prize_winners_claimed; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_prize_winners_claimed ON public.prize_winners USING btree (claimed);
--
-- Name: idx_prize_winners_event_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_prize_winners_event_id ON public.prize_winners USING btree (event_id);
--
-- Name: idx_prize_winners_prize_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_prize_winners_prize_id ON public.prize_winners USING btree (prize_id);
--
-- Name: idx_prize_winners_user_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_prize_winners_user_id ON public.prize_winners USING btree (user_id);
--
-- Name: idx_product_links_order_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_product_links_order_id ON public.product_links USING btree (order_id);
--
-- Name: idx_product_links_work_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_product_links_work_id ON public.product_links USING btree (work_id);
--
-- Name: idx_products_category; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_products_category ON public.products USING btree (category);
--
-- Name: idx_products_is_featured; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_products_is_featured ON public.products USING btree (is_featured) WHERE (is_featured = true);
--
-- Name: idx_products_sort_order; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_products_sort_order ON public.products USING btree (sort_order);
--
-- Name: idx_products_status; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_products_status ON public.products USING btree (status);
--
-- Name: idx_promoted_works_active; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_promoted_works_active ON public.promoted_works USING btree (status, end_time) WHERE (status = 'active'::text);
--
-- Name: idx_promoted_works_order; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_promoted_works_order ON public.promoted_works USING btree (order_id);
--
-- Name: idx_promoted_works_status; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_promoted_works_status ON public.promoted_works USING btree (status);
--
-- Name: idx_promoted_works_user; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_promoted_works_user ON public.promoted_works USING btree (user_id);
--
-- Name: idx_promoted_works_work; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_promoted_works_work ON public.promoted_works USING btree (work_id);
--
-- Name: idx_promotion_applications_created; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_promotion_applications_created ON public.promotion_applications USING btree (created_at DESC);
--
-- Name: idx_promotion_applications_reviewed; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_promotion_applications_reviewed ON public.promotion_applications USING btree (reviewed_at DESC);
--
-- Name: idx_promotion_applications_status; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_promotion_applications_status ON public.promotion_applications USING btree (status);
--
-- Name: idx_promotion_applications_type; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_promotion_applications_type ON public.promotion_applications USING btree (application_type);
--
-- Name: idx_promotion_applications_user; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_promotion_applications_user ON public.promotion_applications USING btree (user_id);
--
-- Name: idx_promotion_audit_logs_action; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_promotion_audit_logs_action ON public.promotion_audit_logs USING btree (action);
--
-- Name: idx_promotion_audit_logs_application; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_promotion_audit_logs_application ON public.promotion_audit_logs USING btree (application_id);
--
-- Name: idx_promotion_audit_logs_created; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_promotion_audit_logs_created ON public.promotion_audit_logs USING btree (created_at DESC);
--
-- Name: idx_promotion_audit_logs_user; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_promotion_audit_logs_user ON public.promotion_audit_logs USING btree (user_id);
--
-- Name: idx_promotion_coupon_usage_coupon; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_promotion_coupon_usage_coupon ON public.promotion_coupon_usage USING btree (coupon_id);
--
-- Name: idx_promotion_coupon_usage_user; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_promotion_coupon_usage_user ON public.promotion_coupon_usage USING btree (user_id);
--
-- Name: idx_promotion_coupons_active; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_promotion_coupons_active ON public.promotion_coupons USING btree (is_active);
--
-- Name: idx_promotion_coupons_code; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_promotion_coupons_code ON public.promotion_coupons USING btree (code);
--
-- Name: idx_promotion_notifications_created; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_promotion_notifications_created ON public.promotion_notifications USING btree (created_at DESC);
--
-- Name: idx_promotion_notifications_read; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_promotion_notifications_read ON public.promotion_notifications USING btree (is_read);
--
-- Name: idx_promotion_notifications_type; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_promotion_notifications_type ON public.promotion_notifications USING btree (type);
--
-- Name: idx_promotion_notifications_user; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_promotion_notifications_user ON public.promotion_notifications USING btree (user_id);
--
-- Name: idx_promotion_orders_created; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_promotion_orders_created ON public.promotion_orders USING btree (created_at DESC);
--
-- Name: idx_promotion_orders_package; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_promotion_orders_package ON public.promotion_orders USING btree (package_type);
--
-- Name: idx_promotion_orders_status; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_promotion_orders_status ON public.promotion_orders USING btree (status);
--
-- Name: idx_promotion_orders_user; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_promotion_orders_user ON public.promotion_orders USING btree (user_id);
--
-- Name: idx_promotion_user_stats_date; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_promotion_user_stats_date ON public.promotion_user_stats USING btree (date);
--
-- Name: idx_promotion_user_stats_user; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_promotion_user_stats_user ON public.promotion_user_stats USING btree (user_id);
--
-- Name: idx_promotion_wallet_txn_type; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_promotion_wallet_txn_type ON public.promotion_wallet_transactions USING btree (type);
--
-- Name: idx_promotion_wallet_txn_user; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_promotion_wallet_txn_user ON public.promotion_wallet_transactions USING btree (user_id);
--
-- Name: idx_promotion_wallet_txn_wallet; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_promotion_wallet_txn_wallet ON public.promotion_wallet_transactions USING btree (wallet_id);
--
-- Name: idx_promotion_wallets_user; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_promotion_wallets_user ON public.promotion_wallets USING btree (user_id);
--
-- Name: idx_realtime_features_expires; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_realtime_features_expires ON public.user_realtime_features USING btree (expires_at);
--
-- Name: idx_realtime_features_user; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_realtime_features_user ON public.user_realtime_features USING btree (user_id);
--
-- Name: idx_realtime_recommendation_cache_user_generated; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_realtime_recommendation_cache_user_generated ON public.realtime_recommendation_cache USING btree (user_id, generated_at DESC);
--
-- Name: idx_rec_logs_item_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_rec_logs_item_id ON public.recommendation_operation_logs USING btree (item_id);
--
-- Name: idx_rec_logs_operated_at; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_rec_logs_operated_at ON public.recommendation_operation_logs USING btree (operated_at);
--
-- Name: idx_rec_logs_operated_by; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_rec_logs_operated_by ON public.recommendation_operation_logs USING btree (operated_by);
--
-- Name: idx_rec_logs_operation_type; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_rec_logs_operation_type ON public.recommendation_operation_logs USING btree (operation_type);
--
-- Name: idx_recommendation_cache_expires; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_recommendation_cache_expires ON public.realtime_recommendation_cache USING btree (expires_at);
--
-- Name: idx_recommendation_cache_user; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_recommendation_cache_user ON public.realtime_recommendation_cache USING btree (user_id);
--
-- Name: idx_recommendation_history_algorithm; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_recommendation_history_algorithm ON public.recommendation_history USING btree (algorithm_type, recommended_at DESC);
--
-- Name: idx_recommendation_history_content_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_recommendation_history_content_id ON public.recommendation_history USING btree (content_id, recommended_at DESC);
--
-- Name: idx_recommendation_history_user_content; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_recommendation_history_user_content ON public.recommendation_history USING btree (user_id, content_id);
--
-- Name: idx_recommendation_history_user_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_recommendation_history_user_id ON public.recommendation_history USING btree (user_id, recommended_at DESC);
--
-- Name: INDEX idx_recommendation_history_user_id; Type: COMMENT; Schema: public; Owner: postgres
--
COMMENT ON INDEX public.idx_recommendation_history_user_id IS '支持查询用户的推荐历史';
--
-- Name: idx_reports_created_at; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_reports_created_at ON public.reports USING btree (created_at DESC);
--
-- Name: idx_reports_report_type; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_reports_report_type ON public.reports USING btree (report_type);
--
-- Name: idx_reports_reporter_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_reports_reporter_id ON public.reports USING btree (reporter_id);
--
-- Name: idx_reports_status; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_reports_status ON public.reports USING btree (status);
--
-- Name: idx_reports_target_author_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_reports_target_author_id ON public.reports USING btree (target_author_id);
--
-- Name: idx_reports_target_type_target_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_reports_target_type_target_id ON public.reports USING btree (target_type, target_id);
--
-- Name: idx_reports_unique; Type: INDEX; Schema: public; Owner: postgres
--
CREATE UNIQUE INDEX idx_reports_unique ON public.reports USING btree (reporter_id, target_type, target_id);
--
-- Name: idx_revenue_records_created; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_revenue_records_created ON public.revenue_records USING btree (created_at DESC);
--
-- Name: idx_revenue_records_type; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_revenue_records_type ON public.revenue_records USING btree (type);
--
-- Name: idx_revenue_records_user; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_revenue_records_user ON public.revenue_records USING btree (user_id);
--
-- Name: idx_score_audit_logs_created; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_score_audit_logs_created ON public.score_audit_logs USING btree (created_at DESC);
--
-- Name: idx_score_audit_logs_judge; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_score_audit_logs_judge ON public.score_audit_logs USING btree (judge_id);
--
-- Name: idx_score_audit_logs_submission; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_score_audit_logs_submission ON public.score_audit_logs USING btree (submission_id);
--
-- Name: idx_search_behavior_tracking_created_at; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_search_behavior_tracking_created_at ON public.search_behavior_tracking USING btree (created_at DESC);
--
-- Name: idx_search_behavior_tracking_session_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_search_behavior_tracking_session_id ON public.search_behavior_tracking USING btree (session_id);
--
-- Name: idx_search_behavior_tracking_user_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_search_behavior_tracking_user_id ON public.search_behavior_tracking USING btree (user_id);
--
-- Name: idx_search_suggestions_category; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_search_suggestions_category ON public.search_suggestions USING btree (category);
--
-- Name: idx_search_suggestions_is_hot; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_search_suggestions_is_hot ON public.search_suggestions USING btree (is_hot) WHERE (is_hot = true);
--
-- Name: idx_search_suggestions_keyword; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_search_suggestions_keyword ON public.search_suggestions USING gin (to_tsvector('simple'::regconfig, keyword));
--
-- Name: idx_search_suggestions_weight; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_search_suggestions_weight ON public.search_suggestions USING btree (weight DESC);
--
-- Name: idx_small_traffic_content_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_small_traffic_content_id ON public.small_traffic_tests USING btree (content_id);
--
-- Name: idx_small_traffic_exposures_test_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_small_traffic_exposures_test_id ON public.small_traffic_exposures USING btree (test_id);
--
-- Name: idx_small_traffic_exposures_user_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_small_traffic_exposures_user_id ON public.small_traffic_exposures USING btree (user_id);
--
-- Name: idx_small_traffic_start_time; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_small_traffic_start_time ON public.small_traffic_tests USING btree (start_time);
--
-- Name: idx_small_traffic_test_status; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_small_traffic_test_status ON public.small_traffic_tests USING btree (test_status);
--
-- Name: idx_small_traffic_tests_content_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_small_traffic_tests_content_id ON public.small_traffic_tests USING btree (content_id);
--
-- Name: idx_stories_map_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_stories_map_id ON public.inspiration_stories USING btree (map_id);
--
-- Name: idx_submission_comments_parent; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_submission_comments_parent ON public.submission_comments USING btree (parent_id);
--
-- Name: idx_submission_comments_submission; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_submission_comments_submission ON public.submission_comments USING btree (submission_id);
--
-- Name: idx_submission_comments_user; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_submission_comments_user ON public.submission_comments USING btree (user_id);
--
-- Name: idx_submission_scores_created; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_submission_scores_created ON public.submission_scores USING btree (created_at DESC);
--
-- Name: idx_submission_scores_judge; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_submission_scores_judge ON public.submission_scores USING btree (judge_id);
--
-- Name: idx_submission_scores_submission; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_submission_scores_submission ON public.submission_scores USING btree (submission_id);
--
-- Name: idx_suggestions_node_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_suggestions_node_id ON public.inspiration_ai_suggestions USING btree (node_id);
--
-- Name: idx_task_applications_creator; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_task_applications_creator ON public.creator_task_applications USING btree (creator_id);
--
-- Name: idx_task_applications_task; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_task_applications_task ON public.creator_task_applications USING btree (task_id);
--
-- Name: idx_task_records_user_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_task_records_user_id ON public.task_records USING btree (user_id);
--
-- Name: idx_template_favorites_template_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_template_favorites_template_id ON public.template_favorites USING btree (template_id);
--
-- Name: idx_template_favorites_user_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_template_favorites_user_id ON public.template_favorites USING btree (user_id);
--
-- Name: idx_template_likes_template_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_template_likes_template_id ON public.template_likes USING btree (template_id);
--
-- Name: idx_template_likes_user_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_template_likes_user_id ON public.template_likes USING btree (user_id);
--
-- Name: idx_tianjin_templates_view_count; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_tianjin_templates_view_count ON public.tianjin_templates USING btree (view_count DESC);
--
-- Name: idx_traffic_sources_created_at; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_traffic_sources_created_at ON public.traffic_sources USING btree (created_at);
--
-- Name: idx_traffic_sources_source_type; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_traffic_sources_source_type ON public.traffic_sources USING btree (source_type);
--
-- Name: idx_traffic_sources_user_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_traffic_sources_user_id ON public.traffic_sources USING btree (user_id);
--
-- Name: idx_unique_pending_request; Type: INDEX; Schema: public; Owner: postgres
--
CREATE UNIQUE INDEX idx_unique_pending_request ON public.community_join_requests USING btree (community_id, user_id) WHERE ((status)::text = 'pending'::text);
--
-- Name: idx_user_achievements_achievement_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_achievements_achievement_id ON public.user_achievements USING btree (achievement_id);
--
-- Name: idx_user_achievements_user_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_achievements_user_id ON public.user_achievements USING btree (user_id);
--
-- Name: idx_user_activities_action_type; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_activities_action_type ON public.user_activities USING btree (action_type);
--
-- Name: idx_user_activities_activity_type; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_activities_activity_type ON public.user_activities USING btree (activity_type);
--
-- Name: idx_user_activities_created_at; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_activities_created_at ON public.user_activities USING btree (created_at);
--
-- Name: idx_user_activities_user_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_activities_user_id ON public.user_activities USING btree (user_id);
--
-- Name: idx_user_ban_restrictions_expires_at; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_ban_restrictions_expires_at ON public.user_ban_restrictions USING btree (expires_at);
--
-- Name: idx_user_ban_restrictions_user_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_ban_restrictions_user_id ON public.user_ban_restrictions USING btree (user_id);
--
-- Name: idx_user_behavior_events_event_type; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_behavior_events_event_type ON public.user_behavior_events USING btree (event_type);
--
-- Name: idx_user_behavior_events_user_created; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_behavior_events_user_created ON public.user_behavior_events USING btree (user_id, created_at DESC);
--
-- Name: idx_user_behavior_logs_action; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_behavior_logs_action ON public.user_behavior_logs USING btree (action);
--
-- Name: idx_user_behavior_logs_created_at; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_behavior_logs_created_at ON public.user_behavior_logs USING btree (created_at);
--
-- Name: idx_user_behavior_logs_promoted_work_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_behavior_logs_promoted_work_id ON public.user_behavior_logs USING btree (promoted_work_id);
--
-- Name: idx_user_behavior_logs_user_created; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_behavior_logs_user_created ON public.user_behavior_logs USING btree (user_id, created_at);
--
-- Name: idx_user_behavior_logs_user_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_behavior_logs_user_id ON public.user_behavior_logs USING btree (user_id);
--
-- Name: idx_user_behavior_logs_work_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_behavior_logs_work_id ON public.user_behavior_logs USING btree (work_id);
--
-- Name: idx_user_behaviors_behavior_type; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_behaviors_behavior_type ON public.user_behaviors USING btree (behavior_type) WHERE ((behavior_type)::text = ANY ((ARRAY['like'::character varying, 'collect'::character varying, 'share'::character varying, 'comment'::character varying])::text[]));
--
-- Name: INDEX idx_user_behaviors_behavior_type; Type: COMMENT; Schema: public; Owner: postgres
--
COMMENT ON INDEX public.idx_user_behaviors_behavior_type IS '支持按行为类型筛选高价值行为';
--
-- Name: idx_user_behaviors_content_id_behavior; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_behaviors_content_id_behavior ON public.user_behaviors USING btree (content_id, behavior_type, created_at DESC);
--
-- Name: idx_user_behaviors_unique; Type: INDEX; Schema: public; Owner: postgres
--
CREATE UNIQUE INDEX idx_user_behaviors_unique ON public.user_behaviors USING btree (user_id, content_id, behavior_type) WHERE ((behavior_type)::text = ANY ((ARRAY['like'::character varying, 'collect'::character varying])::text[]));
--
-- Name: idx_user_behaviors_user_content_behavior; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_behaviors_user_content_behavior ON public.user_behaviors USING btree (user_id, content_id, behavior_type);
--
-- Name: idx_user_behaviors_user_id_created_at; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_behaviors_user_id_created_at ON public.user_behaviors USING btree (user_id, created_at DESC);
--
-- Name: INDEX idx_user_behaviors_user_id_created_at; Type: COMMENT; Schema: public; Owner: postgres
--
COMMENT ON INDEX public.idx_user_behaviors_user_id_created_at IS '支持按用户查询行为历史，按时间倒序';
--
-- Name: idx_user_brand_history_brand_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_brand_history_brand_id ON public.user_brand_history USING btree (brand_id);
--
-- Name: idx_user_brand_history_last_used; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_brand_history_last_used ON public.user_brand_history USING btree (last_used_at DESC);
--
-- Name: idx_user_brand_history_user_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_brand_history_user_id ON public.user_brand_history USING btree (user_id);
--
-- Name: idx_user_demographics_age_group; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_demographics_age_group ON public.user_demographics USING btree (age_group);
--
-- Name: idx_user_demographics_interests; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_demographics_interests ON public.user_demographics USING gin (interests);
--
-- Name: idx_user_demographics_user_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_demographics_user_id ON public.user_demographics USING btree (user_id);
--
-- Name: idx_user_devices_device_type; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_devices_device_type ON public.user_devices USING btree (device_type);
--
-- Name: idx_user_devices_first_seen_at; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_devices_first_seen_at ON public.user_devices USING btree (first_seen_at);
--
-- Name: idx_user_devices_last_seen_at; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_devices_last_seen_at ON public.user_devices USING btree (last_seen_at);
--
-- Name: idx_user_devices_user_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_devices_user_id ON public.user_devices USING btree (user_id);
--
-- Name: idx_user_exploration_user_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_exploration_user_id ON public.user_exploration_state USING btree (user_id);
--
-- Name: idx_user_favorites_created_at; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_favorites_created_at ON public.user_favorites USING btree (created_at DESC);
--
-- Name: idx_user_favorites_user_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_favorites_user_id ON public.user_favorites USING btree (user_id);
--
-- Name: idx_user_feedbacks_assigned_to; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_feedbacks_assigned_to ON public.user_feedbacks USING btree (assigned_to);
--
-- Name: idx_user_feedbacks_created_at; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_feedbacks_created_at ON public.user_feedbacks USING btree (created_at DESC);
--
-- Name: idx_user_feedbacks_priority; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_feedbacks_priority ON public.user_feedbacks USING btree (priority);
--
-- Name: idx_user_feedbacks_status; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_feedbacks_status ON public.user_feedbacks USING btree (status);
--
-- Name: idx_user_feedbacks_type; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_feedbacks_type ON public.user_feedbacks USING btree (type);
--
-- Name: idx_user_feedbacks_user_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_feedbacks_user_id ON public.user_feedbacks USING btree (user_id);
--
-- Name: idx_user_invite_rate_limits_user_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_invite_rate_limits_user_id ON public.user_invite_rate_limits USING btree (user_id);
--
-- Name: idx_user_mockup_configs_mockup_type; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_mockup_configs_mockup_type ON public.user_mockup_configs USING btree (mockup_type);
--
-- Name: idx_user_mockup_configs_user_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_mockup_configs_user_id ON public.user_mockup_configs USING btree (user_id);
--
-- Name: idx_user_notifications_is_read; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_notifications_is_read ON public.user_notifications USING btree (is_read);
--
-- Name: idx_user_notifications_user_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_notifications_user_id ON public.user_notifications USING btree (user_id);
--
-- Name: idx_user_patterns_pattern_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_patterns_pattern_id ON public.user_patterns USING btree (pattern_id);
--
-- Name: idx_user_patterns_user_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_patterns_user_id ON public.user_patterns USING btree (user_id);
--
-- Name: idx_user_profiles_interests; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_profiles_interests ON public.user_profiles USING gin (interests);
--
-- Name: idx_user_profiles_preference_vector; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_profiles_preference_vector ON public.user_profiles USING hnsw (preference_vector public.vector_cosine_ops) WITH (m='16', ef_construction='64');
--
-- Name: idx_user_profiles_user_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles USING btree (user_id);
--
-- Name: idx_user_realtime_features_user_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_realtime_features_user_id ON public.user_realtime_features USING btree (user_id);
--
-- Name: idx_user_search_history_created_at; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_search_history_created_at ON public.user_search_history USING btree (created_at DESC);
--
-- Name: idx_user_search_history_query; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_search_history_query ON public.user_search_history USING gin (to_tsvector('simple'::regconfig, query));
--
-- Name: idx_user_search_history_search_type; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_search_history_search_type ON public.user_search_history USING btree (search_type);
--
-- Name: idx_user_search_history_user_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_search_history_user_id ON public.user_search_history USING btree (user_id);
--
-- Name: idx_user_search_preferences_user_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_search_preferences_user_id ON public.user_search_preferences USING btree (user_id);
--
-- Name: idx_user_sessions_last_active; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_sessions_last_active ON public.user_sessions USING btree (last_active DESC);
--
-- Name: idx_user_sessions_user_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions USING btree (user_id);
--
-- Name: idx_user_similarities_score; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_similarities_score ON public.user_similarities USING btree (similarity_score DESC) WHERE (similarity_score >= 0.5);
--
-- Name: idx_user_similarities_similar_user_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_similarities_similar_user_id ON public.user_similarities USING btree (similar_user_id, similarity_score DESC);
--
-- Name: idx_user_similarities_user_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_similarities_user_id ON public.user_similarities USING btree (user_id, similarity_score DESC);
--
-- Name: INDEX idx_user_similarities_user_id; Type: COMMENT; Schema: public; Owner: postgres
--
COMMENT ON INDEX public.idx_user_similarities_user_id IS '支持查找与指定用户相似的用户';
--
-- Name: idx_user_status_status; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_status_status ON public.user_status USING btree (status);
--
-- Name: idx_user_style_presets_created_at; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_style_presets_created_at ON public.user_style_presets USING btree (created_at DESC);
--
-- Name: idx_user_style_presets_user_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_style_presets_user_id ON public.user_style_presets USING btree (user_id);
--
-- Name: idx_user_sync_logs_sync_type; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_sync_logs_sync_type ON public.user_sync_logs USING btree (sync_type);
--
-- Name: idx_user_sync_logs_synced_at; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_sync_logs_synced_at ON public.user_sync_logs USING btree (synced_at);
--
-- Name: idx_user_sync_logs_user_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_sync_logs_user_id ON public.user_sync_logs USING btree (user_id);
--
-- Name: idx_user_tile_configs_user_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_tile_configs_user_id ON public.user_tile_configs USING btree (user_id);
--
-- Name: idx_user_uploads_created_at; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_uploads_created_at ON public.user_uploads USING btree (created_at DESC);
--
-- Name: idx_user_uploads_user_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_user_uploads_user_id ON public.user_uploads USING btree (user_id);
--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_users_email ON public.users USING btree (email);
--
-- Name: idx_users_email_login_code; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_users_email_login_code ON public.users USING btree (email_login_code) WHERE (email_login_code IS NOT NULL);
--
-- Name: idx_users_phone; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_users_phone ON public.users USING btree (phone);
--
-- Name: idx_users_status; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_users_status ON public.users USING btree (status);
--
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_users_username ON public.users USING btree (username);
--
-- Name: idx_withdrawal_records_user; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_withdrawal_records_user ON public.withdrawal_records USING btree (user_id);
--
-- Name: idx_work_bookmarks_user_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_work_bookmarks_user_id ON public.work_bookmarks USING btree (user_id);
--
-- Name: idx_work_bookmarks_work_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_work_bookmarks_work_id ON public.work_bookmarks USING btree (work_id);
--
-- Name: idx_work_comment_likes_comment_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_work_comment_likes_comment_id ON public.work_comment_likes USING btree (comment_id);
--
-- Name: idx_work_comment_likes_user_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_work_comment_likes_user_id ON public.work_comment_likes USING btree (user_id);
--
-- Name: idx_work_comments_created_at; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_work_comments_created_at ON public.work_comments USING btree (created_at DESC);
--
-- Name: idx_work_comments_parent_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_work_comments_parent_id ON public.work_comments USING btree (parent_id);
--
-- Name: idx_work_comments_user_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_work_comments_user_id ON public.work_comments USING btree (user_id);
--
-- Name: idx_work_comments_work_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_work_comments_work_id ON public.work_comments USING btree (work_id);
--
-- Name: idx_work_favorites_user_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_work_favorites_user_id ON public.work_favorites USING btree (user_id);
--
-- Name: idx_work_favorites_work_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_work_favorites_work_id ON public.work_favorites USING btree (work_id);
--
-- Name: idx_work_performance_stats_engagement; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_work_performance_stats_engagement ON public.work_performance_stats USING btree (engagement_rate DESC);
--
-- Name: idx_work_performance_stats_event; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_work_performance_stats_event ON public.work_performance_stats USING btree (event_id);
--
-- Name: idx_work_performance_stats_ranking; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_work_performance_stats_ranking ON public.work_performance_stats USING btree (ranking);
--
-- Name: idx_work_shares_created_at; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_work_shares_created_at ON public.work_shares USING btree (created_at DESC);
--
-- Name: idx_work_shares_is_read; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_work_shares_is_read ON public.work_shares USING btree (is_read) WHERE (is_read = false);
--
-- Name: idx_work_shares_receiver_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_work_shares_receiver_id ON public.work_shares USING btree (receiver_id);
--
-- Name: idx_work_shares_receiver_read; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_work_shares_receiver_read ON public.work_shares USING btree (receiver_id, is_read, created_at DESC);
--
-- Name: idx_work_shares_sender_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_work_shares_sender_id ON public.work_shares USING btree (sender_id);
--
-- Name: idx_work_shares_work_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_work_shares_work_id ON public.work_shares USING btree (work_id);
--
-- Name: idx_works_ai_risk_score; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_works_ai_risk_score ON public.works USING btree (ai_risk_score DESC);
--
-- Name: idx_works_authenticity_score; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_works_authenticity_score ON public.works USING btree (authenticity_score DESC);
--
-- Name: idx_works_bookmarks_user_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_works_bookmarks_user_id ON public.works_bookmarks USING btree (user_id);
--
-- Name: idx_works_bookmarks_work_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_works_bookmarks_work_id ON public.works_bookmarks USING btree (work_id);
--
-- Name: idx_works_category; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_works_category ON public.works USING btree (category);
--
-- Name: INDEX idx_works_category; Type: COMMENT; Schema: public; Owner: postgres
--
COMMENT ON INDEX public.idx_works_category IS '支持按分类筛选作品';
--
-- Name: idx_works_created_at; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_works_created_at ON public.works USING btree (created_at DESC);
--
-- Name: idx_works_creator_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_works_creator_id ON public.works USING btree (creator_id);
--
-- Name: idx_works_creator_id_created_at; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_works_creator_id_created_at ON public.works USING btree (creator_id, created_at DESC);
--
-- Name: INDEX idx_works_creator_id_created_at; Type: COMMENT; Schema: public; Owner: postgres
--
COMMENT ON INDEX public.idx_works_creator_id_created_at IS '支持按作者查询其作品';
--
-- Name: idx_works_embedding_hnsw; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_works_embedding_hnsw ON public.works USING hnsw (embedding public.vector_cosine_ops) WITH (m='16', ef_construction='64');
--
-- Name: idx_works_hot_score; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_works_hot_score ON public.works USING btree (hot_score DESC) WHERE (hot_score > (0)::numeric);
--
-- Name: INDEX idx_works_hot_score; Type: COMMENT; Schema: public; Owner: postgres
--
COMMENT ON INDEX public.idx_works_hot_score IS '支持按热度排序获取热门作品';
--
-- Name: idx_works_likes_user_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_works_likes_user_id ON public.works_likes USING btree (user_id);
--
-- Name: idx_works_likes_work_id; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_works_likes_work_id ON public.works_likes USING btree (work_id);
--
-- Name: idx_works_source; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_works_source ON public.works USING btree (source);
--
-- Name: idx_works_spam_score; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_works_spam_score ON public.works USING btree (spam_score DESC);
--
-- Name: idx_works_status; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_works_status ON public.works USING btree (status);
--
-- Name: idx_works_tags; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_works_tags ON public.works USING gin (tags);
--
-- Name: idx_works_view_count; Type: INDEX; Schema: public; Owner: postgres
--
CREATE INDEX idx_works_view_count ON public.works USING btree (view_count DESC);
--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: supabase_admin
--
CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);
--
-- Name: messages_inserted_at_topic_index; Type: INDEX; Schema: realtime; Owner: supabase_realtime_admin
--
CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));
--
-- Name: messages_2026_03_01_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--
CREATE INDEX messages_2026_03_01_inserted_at_topic_idx ON realtime.messages_2026_03_01 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));
--
-- Name: messages_2026_03_02_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--
CREATE INDEX messages_2026_03_02_inserted_at_topic_idx ON realtime.messages_2026_03_02 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));
--
-- Name: messages_2026_03_03_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--
CREATE INDEX messages_2026_03_03_inserted_at_topic_idx ON realtime.messages_2026_03_03 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));
--
-- Name: messages_2026_03_04_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--
CREATE INDEX messages_2026_03_04_inserted_at_topic_idx ON realtime.messages_2026_03_04 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));
--
-- Name: messages_2026_03_05_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--
CREATE INDEX messages_2026_03_05_inserted_at_topic_idx ON realtime.messages_2026_03_05 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));
--
-- Name: messages_2026_03_06_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--
CREATE INDEX messages_2026_03_06_inserted_at_topic_idx ON realtime.messages_2026_03_06 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));
--
-- Name: messages_2026_03_07_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--
CREATE INDEX messages_2026_03_07_inserted_at_topic_idx ON realtime.messages_2026_03_07 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));
--
-- Name: subscription_subscription_id_entity_filters_action_filter_key; Type: INDEX; Schema: realtime; Owner: supabase_admin
--
CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_action_filter_key ON realtime.subscription USING btree (subscription_id, entity, filters, action_filter);
--
-- Name: bname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--
CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);
--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--
CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);
--
-- Name: buckets_analytics_unique_name_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--
CREATE UNIQUE INDEX buckets_analytics_unique_name_idx ON storage.buckets_analytics USING btree (name) WHERE (deleted_at IS NULL);
--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--
CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);
--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--
CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");
--
-- Name: idx_objects_bucket_id_name_lower; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--
CREATE INDEX idx_objects_bucket_id_name_lower ON storage.objects USING btree (bucket_id, lower(name) COLLATE "C");
--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--
CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);
--
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--
CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id);
--
-- Name: messages_2026_03_01_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--
ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_03_01_inserted_at_topic_idx;
--
-- Name: messages_2026_03_01_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--
ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_03_01_pkey;
--
-- Name: messages_2026_03_02_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--
ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_03_02_inserted_at_topic_idx;
--
-- Name: messages_2026_03_02_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--
ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_03_02_pkey;
--
-- Name: messages_2026_03_03_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--
ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_03_03_inserted_at_topic_idx;
--
-- Name: messages_2026_03_03_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--
ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_03_03_pkey;
--
-- Name: messages_2026_03_04_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--
ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_03_04_inserted_at_topic_idx;
--
-- Name: messages_2026_03_04_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--
ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_03_04_pkey;
--
-- Name: messages_2026_03_05_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--
ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_03_05_inserted_at_topic_idx;
--
-- Name: messages_2026_03_05_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--
ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_03_05_pkey;
--
-- Name: messages_2026_03_06_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--
ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_03_06_inserted_at_topic_idx;
--
-- Name: messages_2026_03_06_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--
ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_03_06_pkey;
--
-- Name: messages_2026_03_07_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--
ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2026_03_07_inserted_at_topic_idx;
--
-- Name: messages_2026_03_07_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--
ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2026_03_07_pkey;
--
-- Name: users on_auth_user_created; Type: TRIGGER; Schema: auth; Owner: supabase_auth_admin
--
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
--
-- Name: users on_auth_user_created_points; Type: TRIGGER; Schema: auth; Owner: supabase_auth_admin
--
CREATE TRIGGER on_auth_user_created_points AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.initialize_user_points_balance();
--
-- Name: communities audit_communities_changes; Type: TRIGGER; Schema: public; Owner: postgres
--
CREATE TRIGGER audit_communities_changes AFTER INSERT OR DELETE OR UPDATE ON public.communities FOR EACH ROW EXECUTE FUNCTION public.log_audit_event();
--
-- Name: creator_earnings creator_earning_insert_sync_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--
CREATE TRIGGER creator_earning_insert_sync_trigger AFTER INSERT ON public.creator_earnings FOR EACH ROW EXECUTE FUNCTION public.on_creator_earning_insert_sync();
--
-- Name: exchange_records set_exchange_records_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--
CREATE TRIGGER set_exchange_records_updated_at BEFORE UPDATE ON public.exchange_records FOR EACH ROW EXECUTE FUNCTION public.set_exchange_records_updated_at();
--
-- Name: users set_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--
CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
--
-- Name: brand_task_submissions submission_change_sync_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--
CREATE TRIGGER submission_change_sync_trigger AFTER INSERT OR UPDATE ON public.brand_task_submissions FOR EACH ROW EXECUTE FUNCTION public.on_submission_change_sync_participant();
--
-- Name: events sync_participants_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--
CREATE TRIGGER sync_participants_trigger BEFORE INSERT OR UPDATE ON public.events FOR EACH ROW EXECUTE FUNCTION public.sync_participants_columns();
--
-- Name: creator_task_applications task_completed_revenue_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--
CREATE TRIGGER task_completed_revenue_trigger AFTER UPDATE ON public.creator_task_applications FOR EACH ROW EXECUTE FUNCTION public.on_task_completed_add_revenue();
--
-- Name: submission_comments trg_sync_comments_to_stats; Type: TRIGGER; Schema: public; Owner: postgres
--
CREATE TRIGGER trg_sync_comments_to_stats AFTER INSERT OR DELETE ON public.submission_comments FOR EACH ROW EXECUTE FUNCTION public.sync_comment_to_performance_stats();
--
-- Name: submission_likes trg_sync_likes_to_stats; Type: TRIGGER; Schema: public; Owner: postgres
--
CREATE TRIGGER trg_sync_likes_to_stats AFTER INSERT OR DELETE ON public.submission_likes FOR EACH ROW EXECUTE FUNCTION public.sync_like_to_performance_stats();
--
-- Name: submission_ratings trg_sync_ratings_to_stats; Type: TRIGGER; Schema: public; Owner: postgres
--
CREATE TRIGGER trg_sync_ratings_to_stats AFTER INSERT OR DELETE OR UPDATE ON public.submission_ratings FOR EACH ROW EXECUTE FUNCTION public.sync_rating_to_performance_stats();
--
-- Name: event_submissions trg_sync_submission_stats; Type: TRIGGER; Schema: public; Owner: postgres
--
CREATE TRIGGER trg_sync_submission_stats AFTER INSERT OR UPDATE ON public.event_submissions FOR EACH ROW EXECUTE FUNCTION public.sync_submission_to_performance_stats();
--
-- Name: submission_votes trg_sync_votes_to_stats; Type: TRIGGER; Schema: public; Owner: postgres
--
CREATE TRIGGER trg_sync_votes_to_stats AFTER INSERT OR DELETE ON public.submission_votes FOR EACH ROW EXECUTE FUNCTION public.sync_vote_to_performance_stats();
--
-- Name: home_recommendations trg_update_home_recommendations_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--
CREATE TRIGGER trg_update_home_recommendations_updated_at BEFORE UPDATE ON public.home_recommendations FOR EACH ROW EXECUTE FUNCTION public.update_home_recommendations_updated_at();
--
-- Name: small_traffic_tests trigger_evaluate_test; Type: TRIGGER; Schema: public; Owner: postgres
--
CREATE TRIGGER trigger_evaluate_test BEFORE UPDATE ON public.small_traffic_tests FOR EACH ROW EXECUTE FUNCTION public.evaluate_small_traffic_test();
--
-- Name: ai_reviews trigger_update_ai_reviews_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--
CREATE TRIGGER trigger_update_ai_reviews_updated_at BEFORE UPDATE ON public.ai_reviews FOR EACH ROW EXECUTE FUNCTION public.update_ai_reviews_updated_at();
--
-- Name: cultural_knowledge trigger_update_cultural_knowledge_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--
CREATE TRIGGER trigger_update_cultural_knowledge_updated_at BEFORE UPDATE ON public.cultural_knowledge FOR EACH ROW EXECUTE FUNCTION public.update_cultural_knowledge_updated_at();
--
-- Name: feed_collects trigger_update_feed_collects; Type: TRIGGER; Schema: public; Owner: postgres
--
CREATE TRIGGER trigger_update_feed_collects AFTER INSERT OR DELETE ON public.feed_collects FOR EACH ROW EXECUTE FUNCTION public.update_feed_collects_count();
--
-- Name: feed_comment_likes trigger_update_feed_comment_likes; Type: TRIGGER; Schema: public; Owner: postgres
--
CREATE TRIGGER trigger_update_feed_comment_likes AFTER INSERT OR DELETE ON public.feed_comment_likes FOR EACH ROW EXECUTE FUNCTION public.update_feed_comment_likes_count();
--
-- Name: feed_likes trigger_update_feed_likes; Type: TRIGGER; Schema: public; Owner: postgres
--
CREATE TRIGGER trigger_update_feed_likes AFTER INSERT OR DELETE ON public.feed_likes FOR EACH ROW EXECUTE FUNCTION public.update_feed_likes_count();
--
-- Name: feeds trigger_update_feeds_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--
CREATE TRIGGER trigger_update_feeds_updated_at BEFORE UPDATE ON public.feeds FOR EACH ROW EXECUTE FUNCTION public.update_feeds_updated_at();
--
-- Name: forbidden_words trigger_update_forbidden_words; Type: TRIGGER; Schema: public; Owner: postgres
--
CREATE TRIGGER trigger_update_forbidden_words BEFORE UPDATE ON public.forbidden_words FOR EACH ROW EXECUTE FUNCTION public.update_moderation_timestamp();
--
-- Name: generation_tasks trigger_update_generation_tasks_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--
CREATE TRIGGER trigger_update_generation_tasks_updated_at BEFORE UPDATE ON public.generation_tasks FOR EACH ROW EXECUTE FUNCTION public.update_generation_tasks_updated_at();
