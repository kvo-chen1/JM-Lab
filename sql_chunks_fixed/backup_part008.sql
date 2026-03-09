--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;
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


--
-- Name: hot_searches trigger_update_hot_search_trend_score; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_hot_search_trend_score BEFORE UPDATE ON public.hot_searches FOR EACH ROW EXECUTE FUNCTION public.update_hot_search_trend_score();


--
-- Name: moderation_rules trigger_update_moderation_rules; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_moderation_rules BEFORE UPDATE ON public.moderation_rules FOR EACH ROW EXECUTE FUNCTION public.update_moderation_timestamp();


--
-- Name: order_applications trigger_update_order_applications_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_order_applications_updated_at BEFORE UPDATE ON public.order_applications FOR EACH ROW EXECUTE FUNCTION public.update_order_applications_updated_at();


--
-- Name: brand_task_participants trigger_update_task_participants; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_task_participants AFTER INSERT OR DELETE ON public.brand_task_participants FOR EACH ROW EXECUTE FUNCTION public.update_task_participants_count();


--
-- Name: small_traffic_exposures trigger_update_test_metrics; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_test_metrics AFTER INSERT ON public.small_traffic_exposures FOR EACH ROW EXECUTE FUNCTION public.update_small_traffic_test_metrics();


--
-- Name: user_sync_logs trigger_update_user_last_synced; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_user_last_synced AFTER INSERT ON public.user_sync_logs FOR EACH ROW EXECUTE FUNCTION public.update_user_last_synced();


--
-- Name: work_comment_likes trigger_update_work_comment_likes; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_work_comment_likes AFTER INSERT OR DELETE ON public.work_comment_likes FOR EACH ROW EXECUTE FUNCTION public.update_work_comment_likes_count();


--
-- Name: works trigger_update_works_scores; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_works_scores BEFORE UPDATE OF authenticity_score, ai_risk_score, spam_score ON public.works FOR EACH ROW EXECUTE FUNCTION public.update_works_scores_timestamp();


--
-- Name: achievement_configs update_achievement_configs_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_achievement_configs_updated_at BEFORE UPDATE ON public.achievement_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: achievements update_achievements_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_achievements_updated_at BEFORE UPDATE ON public.achievements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: admin_accounts update_admin_accounts_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_admin_accounts_updated_at BEFORE UPDATE ON public.admin_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: admin_notifications update_admin_notifications_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_admin_notifications_updated_at BEFORE UPDATE ON public.admin_notifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: admin_roles update_admin_roles_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_admin_roles_updated_at BEFORE UPDATE ON public.admin_roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ai_conversations update_ai_conversations_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON public.ai_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ai_feedback update_ai_feedback_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_ai_feedback_updated_at BEFORE UPDATE ON public.ai_feedback FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ai_platform_knowledge update_ai_platform_knowledge_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_ai_platform_knowledge_updated_at BEFORE UPDATE ON public.ai_platform_knowledge FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ai_user_memories update_ai_user_memories_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_ai_user_memories_updated_at BEFORE UPDATE ON public.ai_user_memories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ai_user_settings update_ai_user_settings_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_ai_user_settings_updated_at BEFORE UPDATE ON public.ai_user_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: alert_rules update_alert_rules_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_alert_rules_updated_at BEFORE UPDATE ON public.alert_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: brand_accounts update_brand_accounts_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_brand_accounts_updated_at BEFORE UPDATE ON public.brand_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: brand_events update_brand_events_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_brand_events_updated_at BEFORE UPDATE ON public.brand_events FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: brand_partnerships update_brand_partnerships_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_brand_partnerships_updated_at BEFORE UPDATE ON public.brand_partnerships FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: brand_ratings update_brand_ratings_timestamp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_brand_ratings_timestamp BEFORE UPDATE ON public.brand_ratings FOR EACH ROW EXECUTE FUNCTION public.update_brand_ratings_timestamp();


--
-- Name: brand_task_submissions update_brand_task_submissions_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_brand_task_submissions_updated_at BEFORE UPDATE ON public.brand_task_submissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: brand_tasks update_brand_tasks_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_brand_tasks_updated_at BEFORE UPDATE ON public.brand_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: brand_wizard_drafts update_brand_wizard_drafts_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_brand_wizard_drafts_updated_at BEFORE UPDATE ON public.brand_wizard_drafts FOR EACH ROW EXECUTE FUNCTION public.update_brand_wizard_drafts_updated_at();


--
-- Name: business_tasks update_business_tasks_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_business_tasks_updated_at BEFORE UPDATE ON public.business_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: categories update_categories_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: commercial_opportunities update_commercial_opportunities_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_commercial_opportunities_updated_at BEFORE UPDATE ON public.commercial_opportunities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: communities update_communities_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_communities_updated_at BEFORE UPDATE ON public.communities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: community_invitations update_community_invitations_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_community_invitations_updated_at BEFORE UPDATE ON public.community_invitations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: community_invite_settings update_community_invite_settings_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_community_invite_settings_updated_at BEFORE UPDATE ON public.community_invite_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: community_join_requests update_community_join_requests_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_community_join_requests_updated_at BEFORE UPDATE ON public.community_join_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: content_stats update_content_stats_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_content_stats_updated_at BEFORE UPDATE ON public.content_stats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: content_vectors update_content_vectors_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_content_vectors_updated_at BEFORE UPDATE ON public.content_vectors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: conversations update_conversations_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: copyright_assets update_copyright_assets_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_copyright_assets_updated_at BEFORE UPDATE ON public.copyright_assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_creative_profiles update_creative_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_creative_profiles_updated_at BEFORE UPDATE ON public.user_creative_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: creator_earnings update_creator_earnings_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_creator_earnings_updated_at BEFORE UPDATE ON public.creator_earnings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: creator_level_configs update_creator_level_configs_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_creator_level_configs_updated_at BEFORE UPDATE ON public.creator_level_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_behavior_daily_stats update_daily_stats_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_daily_stats_updated_at BEFORE UPDATE ON public.user_behavior_daily_stats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: direct_messages update_direct_messages_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_direct_messages_updated_at BEFORE UPDATE ON public.direct_messages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: errors update_errors_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_errors_updated_at BEFORE UPDATE ON public.errors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: event_participants update_event_participants_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_event_participants_updated_at BEFORE UPDATE ON public.event_participants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_bigint();


--
-- Name: event_prizes update_event_prizes_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_event_prizes_updated_at BEFORE UPDATE ON public.event_prizes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: event_submissions update_event_submissions_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_event_submissions_updated_at BEFORE UPDATE ON public.event_submissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column_bigint();


--
-- Name: event_works update_event_works_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_event_works_updated_at BEFORE UPDATE ON public.event_works FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: friend_requests update_friend_requests_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_friend_requests_updated_at BEFORE UPDATE ON public.friend_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: invitation_reports update_invitation_reports_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_invitation_reports_updated_at BEFORE UPDATE ON public.invitation_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ip_assets update_ip_assets_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_ip_assets_updated_at BEFORE UPDATE ON public.ip_assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ip_partnerships update_ip_partnerships_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_ip_partnerships_updated_at BEFORE UPDATE ON public.ip_partnerships FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ip_stages update_ip_stages_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_ip_stages_updated_at BEFORE UPDATE ON public.ip_stages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: membership_benefits update_membership_benefits_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_membership_benefits_updated_at BEFORE UPDATE ON public.membership_benefits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ai_messages update_message_count; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_message_count AFTER INSERT OR DELETE ON public.ai_messages FOR EACH ROW EXECUTE FUNCTION public.update_conversation_message_count();


--
-- Name: messages update_messages_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON public.messages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: inspiration_mindmaps update_mindmaps_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_mindmaps_updated_at BEFORE UPDATE ON public.inspiration_mindmaps FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: new_content_boost_pool update_new_content_boost_pool_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_new_content_boost_pool_updated_at BEFORE UPDATE ON public.new_content_boost_pool FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: inspiration_nodes update_nodes_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_nodes_updated_at BEFORE UPDATE ON public.inspiration_nodes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: order_executions update_order_executions_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_order_executions_updated_at BEFORE UPDATE ON public.order_executions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: organizer_settings update_organizer_settings_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_organizer_settings_updated_at BEFORE UPDATE ON public.organizer_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: pending_messages update_pending_messages_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_pending_messages_updated_at BEFORE UPDATE ON public.pending_messages FOR EACH ROW EXECUTE FUNCTION public.update_pending_messages_updated_at();


--
-- Name: points update_points_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_points_updated_at BEFORE UPDATE ON public.points FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: prize_winners update_prize_winners_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_prize_winners_updated_at BEFORE UPDATE ON public.prize_winners FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: products update_products_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_products_updated_at();


--
-- Name: promoted_works update_promoted_works_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_promoted_works_updated_at BEFORE UPDATE ON public.promoted_works FOR EACH ROW EXECUTE FUNCTION public.update_promoted_works_updated_at();


--
-- Name: promotion_applications update_promotion_applications_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_promotion_applications_updated_at BEFORE UPDATE ON public.promotion_applications FOR EACH ROW EXECUTE FUNCTION public.update_promotion_updated_at_column();


--
-- Name: promotion_coupons update_promotion_coupons_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_promotion_coupons_updated_at BEFORE UPDATE ON public.promotion_coupons FOR EACH ROW EXECUTE FUNCTION public.update_promotion_updated_at_column();


--
-- Name: promotion_orders update_promotion_orders_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_promotion_orders_updated_at BEFORE UPDATE ON public.promotion_orders FOR EACH ROW EXECUTE FUNCTION public.update_promotion_order_updated_at_column();


--
-- Name: promotion_wallets update_promotion_wallets_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_promotion_wallets_updated_at BEFORE UPDATE ON public.promotion_wallets FOR EACH ROW EXECUTE FUNCTION public.update_promotion_updated_at_column();


--
-- Name: recommendation_configs update_recommendation_configs_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_recommendation_configs_updated_at BEFORE UPDATE ON public.recommendation_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: recommendation_metrics update_recommendation_metrics_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_recommendation_metrics_updated_at BEFORE UPDATE ON public.recommendation_metrics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: replies update_replies_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_replies_updated_at BEFORE UPDATE ON public.replies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: reports update_reports_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: small_traffic_tests update_small_traffic_tests_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_small_traffic_tests_updated_at BEFORE UPDATE ON public.small_traffic_tests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: inspiration_nodes update_stats_on_node_change; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_stats_on_node_change AFTER INSERT OR DELETE OR UPDATE ON public.inspiration_nodes FOR EACH ROW EXECUTE FUNCTION public.update_mindmap_stats();


--
-- Name: submission_scores update_submission_scores_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_submission_scores_updated_at BEFORE UPDATE ON public.submission_scores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_behaviors update_user_behaviors_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_user_behaviors_updated_at BEFORE UPDATE ON public.user_behaviors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_brand_history update_user_brand_history_timestamp; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_user_brand_history_timestamp BEFORE UPDATE ON public.user_brand_history FOR EACH ROW EXECUTE FUNCTION public.update_user_brand_history_timestamp();


--
-- Name: user_demographics update_user_demographics_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_user_demographics_updated_at BEFORE UPDATE ON public.user_demographics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_exploration_state update_user_exploration_state_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_user_exploration_state_updated_at BEFORE UPDATE ON public.user_exploration_state FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_feedbacks update_user_feedbacks_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_user_feedbacks_updated_at BEFORE UPDATE ON public.user_feedbacks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_invite_rate_limits update_user_invite_rate_limits_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_user_invite_rate_limits_updated_at BEFORE UPDATE ON public.user_invite_rate_limits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_mockup_configs update_user_mockup_configs_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_user_mockup_configs_updated_at BEFORE UPDATE ON public.user_mockup_configs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_profiles update_user_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_similarities update_user_similarities_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_user_similarities_updated_at BEFORE UPDATE ON public.user_similarities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_style_presets update_user_style_presets_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_user_style_presets_updated_at BEFORE UPDATE ON public.user_style_presets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_uploads update_user_uploads_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_user_uploads_updated_at BEFORE UPDATE ON public.user_uploads FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: works work_view_revenue_trigger; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER work_view_revenue_trigger AFTER UPDATE OF view_count ON public.works FOR EACH ROW WHEN ((new.view_count > old.view_count)) EXECUTE FUNCTION public.on_work_view_add_revenue();


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: supabase_admin
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: buckets protect_buckets_delete; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects protect_objects_delete; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: admin_accounts admin_accounts_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_accounts
    ADD CONSTRAINT admin_accounts_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: admin_accounts admin_accounts_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_accounts
    ADD CONSTRAINT admin_accounts_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.admin_roles(id) ON DELETE SET NULL;


--
-- Name: admin_accounts admin_accounts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_accounts
    ADD CONSTRAINT admin_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: admin_operation_logs admin_operation_logs_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_operation_logs
    ADD CONSTRAINT admin_operation_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admin_accounts(id) ON DELETE SET NULL;


--
-- Name: ai_conversations ai_conversations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_conversations
    ADD CONSTRAINT ai_conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: ai_feedback ai_feedback_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_feedback
    ADD CONSTRAINT ai_feedback_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.ai_conversations(id) ON DELETE SET NULL;


--
-- Name: ai_feedback ai_feedback_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_feedback
    ADD CONSTRAINT ai_feedback_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.ai_messages(id) ON DELETE SET NULL;


--
-- Name: ai_feedback ai_feedback_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_feedback
    ADD CONSTRAINT ai_feedback_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: ai_messages ai_messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_messages
    ADD CONSTRAINT ai_messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.ai_conversations(id) ON DELETE CASCADE;


--
-- Name: ai_reviews ai_reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_reviews
    ADD CONSTRAINT ai_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: ai_user_memories ai_user_memories_source_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_user_memories
    ADD CONSTRAINT ai_user_memories_source_conversation_id_fkey FOREIGN KEY (source_conversation_id) REFERENCES public.ai_conversations(id) ON DELETE SET NULL;


--
-- Name: ai_user_memories ai_user_memories_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_user_memories
    ADD CONSTRAINT ai_user_memories_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: ai_user_settings ai_user_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_user_settings
    ADD CONSTRAINT ai_user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: alert_notifications alert_notifications_alert_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alert_notifications
    ADD CONSTRAINT alert_notifications_alert_id_fkey FOREIGN KEY (alert_id) REFERENCES public.alert_records(id) ON DELETE CASCADE;


--
-- Name: alert_records alert_records_acknowledged_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alert_records
    ADD CONSTRAINT alert_records_acknowledged_by_fkey FOREIGN KEY (acknowledged_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: alert_records alert_records_rule_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alert_records
    ADD CONSTRAINT alert_records_rule_id_fkey FOREIGN KEY (rule_id) REFERENCES public.alert_rules(id) ON DELETE CASCADE;


--
-- Name: alert_rules alert_rules_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alert_rules
    ADD CONSTRAINT alert_rules_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: api_usage api_usage_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.api_usage
    ADD CONSTRAINT api_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: audit_logs audit_logs_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES auth.users(id);


--
-- Name: blind_box_sales blind_box_sales_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.blind_box_sales
    ADD CONSTRAINT blind_box_sales_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: brand_accounts brand_accounts_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_accounts
    ADD CONSTRAINT brand_accounts_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brand_partnerships(id);


--
-- Name: brand_accounts brand_accounts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_accounts
    ADD CONSTRAINT brand_accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: brand_events brand_events_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_events
    ADD CONSTRAINT brand_events_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brand_partnerships(id);


--
-- Name: brand_events brand_events_organizer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_events
    ADD CONSTRAINT brand_events_organizer_id_fkey FOREIGN KEY (organizer_id) REFERENCES public.users(id);


--
-- Name: brand_events brand_events_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_events
    ADD CONSTRAINT brand_events_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--
-- Name: brand_partnerships brand_partnerships_applicant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_partnerships
    ADD CONSTRAINT brand_partnerships_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES public.users(id);


--
-- Name: brand_partnerships brand_partnerships_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_partnerships
    ADD CONSTRAINT brand_partnerships_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--
-- Name: brand_ratings brand_ratings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_ratings
    ADD CONSTRAINT brand_ratings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: brand_task_analytics brand_task_analytics_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_task_analytics
    ADD CONSTRAINT brand_task_analytics_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.brand_tasks(id) ON DELETE CASCADE;


--
-- Name: brand_task_participants brand_task_participants_creator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_task_participants
    ADD CONSTRAINT brand_task_participants_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: brand_task_participants brand_task_participants_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_task_participants
    ADD CONSTRAINT brand_task_participants_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.brand_tasks(id) ON DELETE CASCADE;


--
-- Name: brand_task_submissions brand_task_submissions_creator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_task_submissions
    ADD CONSTRAINT brand_task_submissions_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: brand_task_submissions brand_task_submissions_participant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_task_submissions
    ADD CONSTRAINT brand_task_submissions_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.brand_task_participants(id) ON DELETE CASCADE;


--
-- Name: brand_task_submissions brand_task_submissions_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_task_submissions
    ADD CONSTRAINT brand_task_submissions_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--
-- Name: brand_task_submissions brand_task_submissions_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_task_submissions
    ADD CONSTRAINT brand_task_submissions_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.brand_tasks(id) ON DELETE CASCADE;


--
-- Name: brand_task_submissions brand_task_submissions_work_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_task_submissions
    ADD CONSTRAINT brand_task_submissions_work_id_fkey FOREIGN KEY (work_id) REFERENCES public.works(id) ON DELETE SET NULL;


--
-- Name: brand_tasks brand_tasks_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_tasks
    ADD CONSTRAINT brand_tasks_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brand_partnerships(id);


--
-- Name: brand_tasks brand_tasks_publisher_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_tasks
    ADD CONSTRAINT brand_tasks_publisher_id_fkey FOREIGN KEY (publisher_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: brand_tasks brand_tasks_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_tasks
    ADD CONSTRAINT brand_tasks_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--
-- Name: brand_transactions brand_transactions_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_transactions
    ADD CONSTRAINT brand_transactions_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.brand_accounts(id) ON DELETE CASCADE;


--
-- Name: brand_transactions brand_transactions_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_transactions
    ADD CONSTRAINT brand_transactions_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.brand_partnerships(id);


--
-- Name: brand_transactions brand_transactions_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_transactions
    ADD CONSTRAINT brand_transactions_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.brand_task_submissions(id);


--
-- Name: brand_transactions brand_transactions_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_transactions
    ADD CONSTRAINT brand_transactions_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.brand_tasks(id);


--
-- Name: brand_transactions brand_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_transactions
    ADD CONSTRAINT brand_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: brand_wizard_drafts brand_wizard_drafts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.brand_wizard_drafts
    ADD CONSTRAINT brand_wizard_drafts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: business_tasks business_tasks_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.business_tasks
    ADD CONSTRAINT business_tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: checkin_records checkin_records_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.checkin_records
    ADD CONSTRAINT checkin_records_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: cold_start_recommendation_logs cold_start_recommendation_logs_content_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cold_start_recommendation_logs
    ADD CONSTRAINT cold_start_recommendation_logs_content_id_fkey FOREIGN KEY (content_id) REFERENCES public.posts(id) ON DELETE SET NULL;


--
-- Name: cold_start_recommendation_logs cold_start_recommendation_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cold_start_recommendation_logs
    ADD CONSTRAINT cold_start_recommendation_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: comments comments_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: comments comments_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.comments(id) ON DELETE CASCADE;


--
-- Name: comments comments_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: comments comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: commercial_opportunities commercial_opportunities_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.commercial_opportunities
    ADD CONSTRAINT commercial_opportunities_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: community_announcements community_announcements_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_announcements
    ADD CONSTRAINT community_announcements_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;


--
-- Name: community_invitation_history community_invitation_history_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_invitation_history
    ADD CONSTRAINT community_invitation_history_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;


--
-- Name: community_invitations community_invitations_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_invitations
    ADD CONSTRAINT community_invitations_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;


--
-- Name: community_invite_settings community_invite_settings_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_invite_settings
    ADD CONSTRAINT community_invite_settings_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;


--
-- Name: community_join_requests community_join_requests_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_join_requests
    ADD CONSTRAINT community_join_requests_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;


--
-- Name: community_members community_members_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.community_members
    ADD CONSTRAINT community_members_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;


--
-- Name: consumption_records consumption_records_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consumption_records
    ADD CONSTRAINT consumption_records_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: content_quality_assessments content_quality_assessments_content_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.content_quality_assessments
    ADD CONSTRAINT content_quality_assessments_content_id_fkey FOREIGN KEY (content_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: conversion_events conversion_events_promoted_work_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversion_events
    ADD CONSTRAINT conversion_events_promoted_work_id_fkey FOREIGN KEY (promoted_work_id) REFERENCES public.promoted_works(id) ON DELETE CASCADE;


--
-- Name: conversion_events conversion_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversion_events
    ADD CONSTRAINT conversion_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: copyright_assets copyright_assets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.copyright_assets
    ADD CONSTRAINT copyright_assets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: creator_earnings creator_earnings_creator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.creator_earnings
    ADD CONSTRAINT creator_earnings_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: creator_earnings creator_earnings_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.creator_earnings
    ADD CONSTRAINT creator_earnings_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.brand_task_submissions(id);


--
-- Name: creator_earnings creator_earnings_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.creator_earnings
    ADD CONSTRAINT creator_earnings_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.brand_tasks(id) ON DELETE CASCADE;


--
-- Name: creator_revenue creator_revenue_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.creator_revenue
    ADD CONSTRAINT creator_revenue_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: creator_task_applications creator_task_applications_creator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.creator_task_applications
    ADD CONSTRAINT creator_task_applications_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: creator_task_applications creator_task_applications_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.creator_task_applications
    ADD CONSTRAINT creator_task_applications_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.business_tasks(id) ON DELETE CASCADE;


--
-- Name: cultural_knowledge cultural_knowledge_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cultural_knowledge
    ADD CONSTRAINT cultural_knowledge_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: direct_messages direct_messages_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.direct_messages
    ADD CONSTRAINT direct_messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: direct_messages direct_messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.direct_messages
    ADD CONSTRAINT direct_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: drafts drafts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.drafts
    ADD CONSTRAINT drafts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: event_bookmarks event_bookmarks_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_bookmarks
    ADD CONSTRAINT event_bookmarks_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_daily_stats event_daily_stats_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_daily_stats
    ADD CONSTRAINT event_daily_stats_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_likes event_likes_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_likes
    ADD CONSTRAINT event_likes_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_notifications event_notifications_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_notifications
    ADD CONSTRAINT event_notifications_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_notifications event_notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_notifications
    ADD CONSTRAINT event_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: event_participants event_participants_submitted_work_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_participants
    ADD CONSTRAINT event_participants_submitted_work_id_fkey FOREIGN KEY (submitted_work_id) REFERENCES public.works(id) ON DELETE SET NULL;


--
-- Name: event_prizes event_prizes_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_prizes
    ADD CONSTRAINT event_prizes_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_submissions event_submissions_participation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_submissions
    ADD CONSTRAINT event_submissions_participation_id_fkey FOREIGN KEY (participation_id) REFERENCES public.event_participants(id) ON DELETE SET NULL;


--
-- Name: event_works event_works_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_works
    ADD CONSTRAINT event_works_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_works event_works_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_works
    ADD CONSTRAINT event_works_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: events events_final_ranking_published_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.events
    ADD CONSTRAINT events_final_ranking_published_by_fkey FOREIGN KEY (final_ranking_published_by) REFERENCES auth.users(id);


--
-- Name: exchange_records exchange_records_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.exchange_records
    ADD CONSTRAINT exchange_records_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: feed_comment_likes feed_comment_likes_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feed_comment_likes
    ADD CONSTRAINT feed_comment_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.feed_comments(id) ON DELETE CASCADE;


--
-- Name: feed_comments feed_comments_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feed_comments
    ADD CONSTRAINT feed_comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.feed_comments(id) ON DELETE CASCADE;


--
-- Name: feedback_process_logs feedback_process_logs_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback_process_logs
    ADD CONSTRAINT feedback_process_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admin_accounts(id) ON DELETE SET NULL;


--
-- Name: feedback_process_logs feedback_process_logs_feedback_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.feedback_process_logs
    ADD CONSTRAINT feedback_process_logs_feedback_id_fkey FOREIGN KEY (feedback_id) REFERENCES public.user_feedbacks(id) ON DELETE CASCADE;


--
-- Name: final_ranking_publishes final_ranking_publishes_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.final_ranking_publishes
    ADD CONSTRAINT final_ranking_publishes_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: final_ranking_publishes final_ranking_publishes_published_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.final_ranking_publishes
    ADD CONSTRAINT final_ranking_publishes_published_by_fkey FOREIGN KEY (published_by) REFERENCES auth.users(id);


--
-- Name: event_submissions fk_event_submissions_event; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_submissions
    ADD CONSTRAINT fk_event_submissions_event FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: event_submissions fk_event_submissions_user; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_submissions
    ADD CONSTRAINT fk_event_submissions_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: event_works fk_event_works_work; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.event_works
    ADD CONSTRAINT fk_event_works_work FOREIGN KEY (work_id) REFERENCES public.works(id) ON DELETE CASCADE;


--
-- Name: friend_requests friend_requests_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friend_requests
    ADD CONSTRAINT friend_requests_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: friend_requests friend_requests_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.friend_requests
    ADD CONSTRAINT friend_requests_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: generation_tasks generation_tasks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.generation_tasks
    ADD CONSTRAINT generation_tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: inspiration_ai_suggestions inspiration_ai_suggestions_node_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspiration_ai_suggestions
    ADD CONSTRAINT inspiration_ai_suggestions_node_id_fkey FOREIGN KEY (node_id) REFERENCES public.inspiration_nodes(id) ON DELETE CASCADE;


--
-- Name: inspiration_mindmaps inspiration_mindmaps_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspiration_mindmaps
    ADD CONSTRAINT inspiration_mindmaps_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: inspiration_nodes inspiration_nodes_map_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspiration_nodes
    ADD CONSTRAINT inspiration_nodes_map_id_fkey FOREIGN KEY (map_id) REFERENCES public.inspiration_mindmaps(id) ON DELETE CASCADE;


--
-- Name: inspiration_nodes inspiration_nodes_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspiration_nodes
    ADD CONSTRAINT inspiration_nodes_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.inspiration_nodes(id) ON DELETE CASCADE;


--
-- Name: inspiration_stories inspiration_stories_map_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inspiration_stories
    ADD CONSTRAINT inspiration_stories_map_id_fkey FOREIGN KEY (map_id) REFERENCES public.inspiration_mindmaps(id) ON DELETE CASCADE;


--
-- Name: invitation_reports invitation_reports_community_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invitation_reports
    ADD CONSTRAINT invitation_reports_community_id_fkey FOREIGN KEY (community_id) REFERENCES public.communities(id) ON DELETE CASCADE;


--
-- Name: invitation_reports invitation_reports_invitation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invitation_reports
    ADD CONSTRAINT invitation_reports_invitation_id_fkey FOREIGN KEY (invitation_id) REFERENCES public.community_invitations(id) ON DELETE SET NULL;


--
-- Name: invite_records invite_records_invitee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invite_records
    ADD CONSTRAINT invite_records_invitee_id_fkey FOREIGN KEY (invitee_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: invite_records invite_records_inviter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invite_records
    ADD CONSTRAINT invite_records_inviter_id_fkey FOREIGN KEY (inviter_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: ip_activities ip_activities_ip_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ip_activities
    ADD CONSTRAINT ip_activities_ip_asset_id_fkey FOREIGN KEY (ip_asset_id) REFERENCES public.ip_assets(id) ON DELETE CASCADE;


--
-- Name: ip_activities ip_activities_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ip_activities
    ADD CONSTRAINT ip_activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: ip_assets ip_assets_original_work_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ip_assets
    ADD CONSTRAINT ip_assets_original_work_id_fkey FOREIGN KEY (original_work_id) REFERENCES public.works(id) ON DELETE SET NULL;


--
-- Name: ip_assets ip_assets_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ip_assets
    ADD CONSTRAINT ip_assets_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: ip_assets ip_assets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ip_assets
    ADD CONSTRAINT ip_assets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: ip_partnerships ip_partnerships_ip_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ip_partnerships
    ADD CONSTRAINT ip_partnerships_ip_asset_id_fkey FOREIGN KEY (ip_asset_id) REFERENCES public.ip_assets(id) ON DELETE CASCADE;


--
-- Name: ip_partnerships ip_partnerships_opportunity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ip_partnerships
    ADD CONSTRAINT ip_partnerships_opportunity_id_fkey FOREIGN KEY (opportunity_id) REFERENCES public.commercial_opportunities(id) ON DELETE SET NULL;


--
-- Name: ip_partnerships ip_partnerships_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ip_partnerships
    ADD CONSTRAINT ip_partnerships_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: ip_stages ip_stages_ip_asset_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ip_stages
    ADD CONSTRAINT ip_stages_ip_asset_id_fkey FOREIGN KEY (ip_asset_id) REFERENCES public.ip_assets(id) ON DELETE CASCADE;


--
-- Name: likes likes_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.likes
    ADD CONSTRAINT likes_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: lottery_activities lottery_activities_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lottery_activities
    ADD CONSTRAINT lottery_activities_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);


--
-- Name: lottery_prizes lottery_prizes_activity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lottery_prizes
    ADD CONSTRAINT lottery_prizes_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.lottery_activities(id) ON DELETE CASCADE;


--
-- Name: lottery_spin_records lottery_spin_records_activity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lottery_spin_records
    ADD CONSTRAINT lottery_spin_records_activity_id_fkey FOREIGN KEY (activity_id) REFERENCES public.lottery_activities(id) ON DELETE CASCADE;


--
-- Name: lottery_spin_records lottery_spin_records_prize_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lottery_spin_records
    ADD CONSTRAINT lottery_spin_records_prize_id_fkey FOREIGN KEY (prize_id) REFERENCES public.lottery_prizes(id);


--
-- Name: lottery_spin_records lottery_spin_records_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.lottery_spin_records
    ADD CONSTRAINT lottery_spin_records_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id);


--
-- Name: membership_coupon_usage membership_coupon_usage_coupon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.membership_coupon_usage
    ADD CONSTRAINT membership_coupon_usage_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.membership_coupons(id);


--
-- Name: membership_coupon_usage membership_coupon_usage_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.membership_coupon_usage
    ADD CONSTRAINT membership_coupon_usage_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.membership_orders(id);


--
-- Name: membership_coupon_usage membership_coupon_usage_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.membership_coupon_usage
    ADD CONSTRAINT membership_coupon_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: membership_history membership_history_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.membership_history
    ADD CONSTRAINT membership_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.membership_orders(id);


--
-- Name: membership_history membership_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.membership_history
    ADD CONSTRAINT membership_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: membership_orders membership_orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.membership_orders
    ADD CONSTRAINT membership_orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: membership_orders membership_orders_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.membership_orders
    ADD CONSTRAINT membership_orders_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id);


--
-- Name: membership_usage_stats membership_usage_stats_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.membership_usage_stats
    ADD CONSTRAINT membership_usage_stats_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: memberships memberships_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.memberships
    ADD CONSTRAINT memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: messages messages_conversation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: moderation_logs moderation_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.moderation_logs
    ADD CONSTRAINT moderation_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: new_content_boost_pool new_content_boost_pool_content_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.new_content_boost_pool
    ADD CONSTRAINT new_content_boost_pool_content_id_fkey FOREIGN KEY (content_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: order_applications order_applications_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_applications
    ADD CONSTRAINT order_applications_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.order_audits(id) ON DELETE CASCADE;


--
-- Name: order_execution_clicks order_execution_clicks_execution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_execution_clicks
    ADD CONSTRAINT order_execution_clicks_execution_id_fkey FOREIGN KEY (execution_id) REFERENCES public.order_executions(id) ON DELETE CASCADE;


--
-- Name: order_execution_clicks order_execution_clicks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_execution_clicks
    ADD CONSTRAINT order_execution_clicks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: order_execution_daily_stats order_execution_daily_stats_execution_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_execution_daily_stats
    ADD CONSTRAINT order_execution_daily_stats_execution_id_fkey FOREIGN KEY (execution_id) REFERENCES public.order_executions(id) ON DELETE CASCADE;


--
-- Name: order_executions order_executions_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_executions
    ADD CONSTRAINT order_executions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.order_audits(id) ON DELETE SET NULL;


--
-- Name: order_executions order_executions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_executions
    ADD CONSTRAINT order_executions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: order_executions order_executions_work_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_executions
    ADD CONSTRAINT order_executions_work_id_fkey FOREIGN KEY (work_id) REFERENCES public.works(id) ON DELETE SET NULL;


--
-- Name: organizer_backups organizer_backups_organizer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizer_backups
    ADD CONSTRAINT organizer_backups_organizer_id_fkey FOREIGN KEY (organizer_id) REFERENCES public.brand_partnerships(id) ON DELETE CASCADE;


--
-- Name: organizer_settings organizer_settings_organizer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizer_settings
    ADD CONSTRAINT organizer_settings_organizer_id_fkey FOREIGN KEY (organizer_id) REFERENCES public.brand_partnerships(id) ON DELETE CASCADE;


--
-- Name: page_views page_views_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.page_views
    ADD CONSTRAINT page_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: pending_messages pending_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pending_messages
    ADD CONSTRAINT pending_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: points_records points_records_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.points_records
    ADD CONSTRAINT points_records_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: posts posts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: prize_winners prize_winners_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prize_winners
    ADD CONSTRAINT prize_winners_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: prize_winners prize_winners_prize_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prize_winners
    ADD CONSTRAINT prize_winners_prize_id_fkey FOREIGN KEY (prize_id) REFERENCES public.event_prizes(id) ON DELETE CASCADE;


--
-- Name: prize_winners prize_winners_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prize_winners
    ADD CONSTRAINT prize_winners_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: product_links product_links_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_links
    ADD CONSTRAINT product_links_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.order_audits(id) ON DELETE SET NULL;


--
-- Name: product_links product_links_work_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_links
    ADD CONSTRAINT product_links_work_id_fkey FOREIGN KEY (work_id) REFERENCES public.works(id) ON DELETE CASCADE;


--
-- Name: promoted_works promoted_works_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promoted_works
    ADD CONSTRAINT promoted_works_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.promotion_orders(id) ON DELETE CASCADE;


--
-- Name: promoted_works promoted_works_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promoted_works
    ADD CONSTRAINT promoted_works_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: promotion_applications promotion_applications_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_applications
    ADD CONSTRAINT promotion_applications_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--
-- Name: promotion_applications promotion_applications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_applications
    ADD CONSTRAINT promotion_applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: promotion_audit_logs promotion_audit_logs_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_audit_logs
    ADD CONSTRAINT promotion_audit_logs_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.promotion_applications(id) ON DELETE CASCADE;


--
-- Name: promotion_audit_logs promotion_audit_logs_performed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_audit_logs
    ADD CONSTRAINT promotion_audit_logs_performed_by_fkey FOREIGN KEY (performed_by) REFERENCES public.users(id);


--
-- Name: promotion_audit_logs promotion_audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_audit_logs
    ADD CONSTRAINT promotion_audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: promotion_coupon_usage promotion_coupon_usage_coupon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_coupon_usage
    ADD CONSTRAINT promotion_coupon_usage_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.promotion_coupons(id) ON DELETE CASCADE;


--
-- Name: promotion_coupon_usage promotion_coupon_usage_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_coupon_usage
    ADD CONSTRAINT promotion_coupon_usage_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: promotion_coupons promotion_coupons_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_coupons
    ADD CONSTRAINT promotion_coupons_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: promotion_notifications promotion_notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_notifications
    ADD CONSTRAINT promotion_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: promotion_orders promotion_orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_orders
    ADD CONSTRAINT promotion_orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: promotion_user_stats promotion_user_stats_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_user_stats
    ADD CONSTRAINT promotion_user_stats_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: promotion_wallet_transactions promotion_wallet_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_wallet_transactions
    ADD CONSTRAINT promotion_wallet_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: promotion_wallet_transactions promotion_wallet_transactions_wallet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_wallet_transactions
    ADD CONSTRAINT promotion_wallet_transactions_wallet_id_fkey FOREIGN KEY (wallet_id) REFERENCES public.promotion_wallets(id) ON DELETE CASCADE;


--
-- Name: promotion_wallets promotion_wallets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.promotion_wallets
    ADD CONSTRAINT promotion_wallets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: realtime_recommendation_cache realtime_recommendation_cache_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.realtime_recommendation_cache
    ADD CONSTRAINT realtime_recommendation_cache_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: recommendation_history recommendation_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recommendation_history
    ADD CONSTRAINT recommendation_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: recommendation_metrics recommendation_metrics_recommendation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recommendation_metrics
    ADD CONSTRAINT recommendation_metrics_recommendation_id_fkey FOREIGN KEY (recommendation_id) REFERENCES public.realtime_recommendation_cache(id);


--
-- Name: recommendation_metrics recommendation_metrics_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recommendation_metrics
    ADD CONSTRAINT recommendation_metrics_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: reports reports_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: reports reports_reporter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reports reports_target_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_target_author_id_fkey FOREIGN KEY (target_author_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: revenue_records revenue_records_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.revenue_records
    ADD CONSTRAINT revenue_records_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: revenue_records revenue_records_work_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.revenue_records
    ADD CONSTRAINT revenue_records_work_id_fkey FOREIGN KEY (work_id) REFERENCES public.works(id) ON DELETE SET NULL;


--
-- Name: score_audit_logs score_audit_logs_judge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.score_audit_logs
    ADD CONSTRAINT score_audit_logs_judge_id_fkey FOREIGN KEY (judge_id) REFERENCES auth.users(id);


--
-- Name: score_audit_logs score_audit_logs_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.score_audit_logs
    ADD CONSTRAINT score_audit_logs_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.event_submissions(id) ON DELETE CASCADE;


--
-- Name: search_behavior_tracking search_behavior_tracking_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.search_behavior_tracking
    ADD CONSTRAINT search_behavior_tracking_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: small_traffic_exposures small_traffic_exposures_content_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.small_traffic_exposures
    ADD CONSTRAINT small_traffic_exposures_content_id_fkey FOREIGN KEY (content_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: small_traffic_exposures small_traffic_exposures_test_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.small_traffic_exposures
    ADD CONSTRAINT small_traffic_exposures_test_id_fkey FOREIGN KEY (test_id) REFERENCES public.small_traffic_tests(id) ON DELETE CASCADE;


--
-- Name: small_traffic_exposures small_traffic_exposures_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.small_traffic_exposures
    ADD CONSTRAINT small_traffic_exposures_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: small_traffic_tests small_traffic_tests_content_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.small_traffic_tests
    ADD CONSTRAINT small_traffic_tests_content_id_fkey FOREIGN KEY (content_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- Name: submission_comments submission_comments_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submission_comments
    ADD CONSTRAINT submission_comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.submission_comments(id) ON DELETE CASCADE;


--
-- Name: submission_comments submission_comments_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submission_comments
    ADD CONSTRAINT submission_comments_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.event_submissions(id) ON DELETE CASCADE;


--
-- Name: submission_comments submission_comments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submission_comments
    ADD CONSTRAINT submission_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: submission_likes submission_likes_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submission_likes
    ADD CONSTRAINT submission_likes_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.event_submissions(id) ON DELETE CASCADE;


--
-- Name: submission_likes submission_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submission_likes
    ADD CONSTRAINT submission_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: submission_ratings submission_ratings_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submission_ratings
    ADD CONSTRAINT submission_ratings_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.event_submissions(id) ON DELETE CASCADE;


--
-- Name: submission_ratings submission_ratings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submission_ratings
    ADD CONSTRAINT submission_ratings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: submission_scores submission_scores_judge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submission_scores
    ADD CONSTRAINT submission_scores_judge_id_fkey FOREIGN KEY (judge_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: submission_scores submission_scores_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submission_scores
    ADD CONSTRAINT submission_scores_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.event_submissions(id) ON DELETE CASCADE;


--
-- Name: submission_votes submission_votes_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submission_votes
    ADD CONSTRAINT submission_votes_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.event_submissions(id) ON DELETE CASCADE;


--
-- Name: submission_votes submission_votes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.submission_votes
    ADD CONSTRAINT submission_votes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: task_records task_records_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.task_records
    ADD CONSTRAINT task_records_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: template_favorites template_favorites_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.template_favorites
    ADD CONSTRAINT template_favorites_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.tianjin_templates(id) ON DELETE CASCADE;


--
-- Name: template_favorites template_favorites_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.template_favorites
    ADD CONSTRAINT template_favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: template_likes template_likes_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.template_likes
    ADD CONSTRAINT template_likes_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.tianjin_templates(id) ON DELETE CASCADE;


--
-- Name: template_likes template_likes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.template_likes
    ADD CONSTRAINT template_likes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: traffic_sources traffic_sources_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.traffic_sources
    ADD CONSTRAINT traffic_sources_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: user_achievements user_achievements_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_activities user_activities_target_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_activities
    ADD CONSTRAINT user_activities_target_id_fkey FOREIGN KEY (target_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_ban_restrictions user_ban_restrictions_banned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_ban_restrictions
    ADD CONSTRAINT user_ban_restrictions_banned_by_fkey FOREIGN KEY (banned_by) REFERENCES public.users(id);


--
-- Name: user_ban_restrictions user_ban_restrictions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_ban_restrictions
    ADD CONSTRAINT user_ban_restrictions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_behavior_daily_stats user_behavior_daily_stats_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_behavior_daily_stats
    ADD CONSTRAINT user_behavior_daily_stats_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_behavior_events user_behavior_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_behavior_events
    ADD CONSTRAINT user_behavior_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_behavior_logs user_behavior_logs_promoted_work_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_behavior_logs
    ADD CONSTRAINT user_behavior_logs_promoted_work_id_fkey FOREIGN KEY (promoted_work_id) REFERENCES public.promoted_works(id) ON DELETE SET NULL;


--
-- Name: user_behavior_logs user_behavior_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_behavior_logs
    ADD CONSTRAINT user_behavior_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_behavior_logs user_behavior_logs_work_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_behavior_logs
    ADD CONSTRAINT user_behavior_logs_work_id_fkey FOREIGN KEY (work_id) REFERENCES public.works(id) ON DELETE CASCADE;


--
-- Name: user_behaviors user_behaviors_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_behaviors
    ADD CONSTRAINT user_behaviors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_brand_history user_brand_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_brand_history
    ADD CONSTRAINT user_brand_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_creative_profiles user_creative_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_creative_profiles
    ADD CONSTRAINT user_creative_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_demographics user_demographics_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_demographics
    ADD CONSTRAINT user_demographics_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_devices user_devices_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_devices
    ADD CONSTRAINT user_devices_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_exploration_state user_exploration_state_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_exploration_state
    ADD CONSTRAINT user_exploration_state_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_favorites user_favorites_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_favorites
    ADD CONSTRAINT user_favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_feedbacks user_feedbacks_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_feedbacks
    ADD CONSTRAINT user_feedbacks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.admin_accounts(id) ON DELETE SET NULL;


--
-- Name: user_feedbacks user_feedbacks_responded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_feedbacks
    ADD CONSTRAINT user_feedbacks_responded_by_fkey FOREIGN KEY (responded_by) REFERENCES public.admin_accounts(id) ON DELETE SET NULL;


--
-- Name: user_feedbacks user_feedbacks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_feedbacks
    ADD CONSTRAINT user_feedbacks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: user_mockup_configs user_mockup_configs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_mockup_configs
    ADD CONSTRAINT user_mockup_configs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_notifications user_notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_notifications
    ADD CONSTRAINT user_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_patterns user_patterns_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_patterns
    ADD CONSTRAINT user_patterns_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_points_balance user_points_balance_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_points_balance
    ADD CONSTRAINT user_points_balance_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_profiles user_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_realtime_features user_realtime_features_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_realtime_features
    ADD CONSTRAINT user_realtime_features_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_search_history user_search_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_search_history
    ADD CONSTRAINT user_search_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_search_preferences user_search_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_search_preferences
    ADD CONSTRAINT user_search_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_similarities user_similarities_similar_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_similarities
    ADD CONSTRAINT user_similarities_similar_user_id_fkey FOREIGN KEY (similar_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_similarities user_similarities_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_similarities
    ADD CONSTRAINT user_similarities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_status user_status_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_status
    ADD CONSTRAINT user_status_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_style_presets user_style_presets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_style_presets
    ADD CONSTRAINT user_style_presets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_sync_logs user_sync_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sync_logs
    ADD CONSTRAINT user_sync_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_tile_configs user_tile_configs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_tile_configs
    ADD CONSTRAINT user_tile_configs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_uploads user_uploads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_uploads
    ADD CONSTRAINT user_uploads_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: withdrawal_records withdrawal_records_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.withdrawal_records
    ADD CONSTRAINT withdrawal_records_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: work_bookmarks work_bookmarks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_bookmarks
    ADD CONSTRAINT work_bookmarks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: work_bookmarks work_bookmarks_work_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_bookmarks
    ADD CONSTRAINT work_bookmarks_work_id_fkey FOREIGN KEY (work_id) REFERENCES public.works(id) ON DELETE CASCADE;


--
-- Name: work_comment_likes work_comment_likes_comment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_comment_likes
    ADD CONSTRAINT work_comment_likes_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.work_comments(id) ON DELETE CASCADE;


--
-- Name: work_comments work_comments_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_comments
    ADD CONSTRAINT work_comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.work_comments(id) ON DELETE CASCADE;


--
-- Name: work_comments work_comments_work_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_comments
    ADD CONSTRAINT work_comments_work_id_fkey FOREIGN KEY (work_id) REFERENCES public.works(id) ON DELETE CASCADE;


--
-- Name: work_performance_stats work_performance_stats_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_performance_stats
    ADD CONSTRAINT work_performance_stats_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;


--
-- Name: work_performance_stats work_performance_stats_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_performance_stats
    ADD CONSTRAINT work_performance_stats_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.event_submissions(id) ON DELETE CASCADE;


--
-- Name: work_shares work_shares_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_shares
    ADD CONSTRAINT work_shares_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: work_shares work_shares_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.work_shares
    ADD CONSTRAINT work_shares_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: works works_creator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.works
    ADD CONSTRAINT works_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: works works_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.works
    ADD CONSTRAINT works_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: vector_indexes vector_indexes_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id);


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: admin_notifications Admin can delete notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin can delete notifications" ON public.admin_notifications FOR DELETE USING (true);


--
-- Name: admin_notifications Admin can insert notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin can insert notifications" ON public.admin_notifications FOR INSERT WITH CHECK (true);


--
-- Name: forbidden_words Admin can manage forbidden words; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin can manage forbidden words" ON public.forbidden_words USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'admin'::text)))));


--
-- Name: moderation_rules Admin can manage moderation rules; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin can manage moderation rules" ON public.moderation_rules USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'admin'::text)))));


--
-- Name: admin_notifications Admin can update notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin can update notifications" ON public.admin_notifications FOR UPDATE USING (true);


--
-- Name: moderation_logs Admin can view moderation logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin can view moderation logs" ON public.moderation_logs FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'admin'::text)))));


--
-- Name: admin_notifications Admin can view notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin can view notifications" ON public.admin_notifications FOR SELECT USING (true);


--
-- Name: order_audits Admins can audit orders; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can audit orders" ON public.order_audits FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = auth.uid()) AND ((users.raw_user_meta_data ->> 'role'::text) = 'admin'::text)))));


--
-- Name: user_sync_logs Admins can cleanup sync logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can cleanup sync logs" ON public.user_sync_logs FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'admin'::text)))));


--
-- Name: ai_feedback Admins can delete feedback; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can delete feedback" ON public.ai_feedback FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.admin_accounts
  WHERE (admin_accounts.id = auth.uid()))));


--
-- Name: reports Admins can delete reports; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can delete reports" ON public.reports FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'admin'::text)))));


--
-- Name: alert_rules Admins can manage all alert rules; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage all alert rules" ON public.alert_rules TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying])::text[])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying])::text[]))))));


--
-- Name: products Admins can manage products; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can manage products" ON public.products USING ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = auth.uid()) AND ((users.raw_user_meta_data ->> 'role'::text) = 'admin'::text)))));


--
-- Name: alert_records Admins can update alert records; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update alert records" ON public.alert_records FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying])::text[])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying])::text[]))))));


--
-- Name: ip_assets Admins can update all IP assets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update all IP assets" ON public.ip_assets FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = auth.uid()) AND ((users.raw_user_meta_data ->> 'role'::text) = 'admin'::text)))));


--
-- Name: ai_feedback Admins can update feedback; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update feedback" ON public.ai_feedback FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.admin_accounts
  WHERE (admin_accounts.id = auth.uid()))));


--
-- Name: reports Admins can update reports; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update reports" ON public.reports FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'admin'::text)))));


--
-- Name: ip_assets Admins can view all IP assets; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all IP assets" ON public.ip_assets FOR SELECT USING ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = auth.uid()) AND ((users.raw_user_meta_data ->> 'role'::text) = 'admin'::text)))));


--
-- Name: alert_notifications Admins can view all alert notifications; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all alert notifications" ON public.alert_notifications FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying])::text[]))))));


--
-- Name: alert_records Admins can view all alert records; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all alert records" ON public.alert_records FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying])::text[]))))));


--
-- Name: user_behavior_logs Admins can view all behavior logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all behavior logs" ON public.user_behavior_logs FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'admin'::text)))));


--
-- Name: blind_box_sales Admins can view all blind_box_sales; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all blind_box_sales" ON public.blind_box_sales FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'admin'::text)))));


--
-- Name: channel_costs Admins can view all channel_costs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all channel_costs" ON public.channel_costs FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'admin'::text)))));


--
-- Name: conversion_events Admins can view all conversion events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all conversion events" ON public.conversion_events FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'admin'::text)))));


--
-- Name: order_audits Admins can view all orders; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all orders" ON public.order_audits FOR SELECT USING ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = auth.uid()) AND ((users.raw_user_meta_data ->> 'role'::text) = 'admin'::text)))));


--
-- Name: reports Admins can view all reports; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all reports" ON public.reports FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'admin'::text)))));


--
-- Name: memberships Admins can view all revenue data; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all revenue data" ON public.memberships FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'admin'::text)))));


--
-- Name: user_sync_logs Admins can view all sync logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all sync logs" ON public.user_sync_logs FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'admin'::text)))));


--
-- Name: organizer_backups Allow admin full access to organizer_backups; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow admin full access to organizer_backups" ON public.organizer_backups TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND (users.is_admin = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND (users.is_admin = true)))));


--
-- Name: organizer_settings Allow admin full access to organizer_settings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow admin full access to organizer_settings" ON public.organizer_settings TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND (users.is_admin = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND (users.is_admin = true)))));


--
-- Name: user_points_balance Allow all authenticated users to view balance; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all authenticated users to view balance" ON public.user_points_balance FOR SELECT TO authenticated USING (true);


--
-- Name: points_records Allow all authenticated users to view points records; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all authenticated users to view points records" ON public.points_records FOR SELECT TO authenticated USING (true);


--
-- Name: event_bookmarks Allow all operations on event_bookmarks; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all operations on event_bookmarks" ON public.event_bookmarks USING (true) WITH CHECK (true);


--
-- Name: event_likes Allow all operations on event_likes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all operations on event_likes" ON public.event_likes USING (true) WITH CHECK (true);


--
-- Name: feed_collects Allow all operations on feed_collects; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all operations on feed_collects" ON public.feed_collects USING (true) WITH CHECK (true);


--
-- Name: feed_comment_likes Allow all operations on feed_comment_likes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all operations on feed_comment_likes" ON public.feed_comment_likes USING (true) WITH CHECK (true);


--
-- Name: feed_comments Allow all operations on feed_comments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all operations on feed_comments" ON public.feed_comments USING (true) WITH CHECK (true);


--
-- Name: feed_likes Allow all operations on feed_likes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all operations on feed_likes" ON public.feed_likes USING (true) WITH CHECK (true);


--
-- Name: feeds Allow all operations on feeds; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all operations on feeds" ON public.feeds USING (true) WITH CHECK (true);


--
-- Name: page_views Allow all operations on page_views; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all operations on page_views" ON public.page_views USING (true) WITH CHECK (true);


--
-- Name: template_favorites Allow all operations on template_favorites; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all operations on template_favorites" ON public.template_favorites USING (true) WITH CHECK (true);


--
-- Name: template_likes Allow all operations on template_likes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all operations on template_likes" ON public.template_likes USING (true) WITH CHECK (true);


--
-- Name: traffic_sources Allow all operations on traffic_sources; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all operations on traffic_sources" ON public.traffic_sources USING (true) WITH CHECK (true);


--
-- Name: user_activities Allow all operations on user_activities; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all operations on user_activities" ON public.user_activities USING (true) WITH CHECK (true);


--
-- Name: user_devices Allow all operations on user_devices; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all operations on user_devices" ON public.user_devices USING (true) WITH CHECK (true);


--
-- Name: work_comment_likes Allow all operations on work_comment_likes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all operations on work_comment_likes" ON public.work_comment_likes USING (true) WITH CHECK (true);


--
-- Name: work_comments Allow all operations on work_comments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all operations on work_comments" ON public.work_comments USING (true) WITH CHECK (true);


--
-- Name: events Allow all users read; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all users read" ON public.events FOR SELECT TO authenticated, anon USING (true);


--
-- Name: bookmarks Allow all users to view bookmarks; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all users to view bookmarks" ON public.bookmarks FOR SELECT USING (true);


--
-- Name: users Allow all users to view profiles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow all users to view profiles" ON public.users FOR SELECT USING (true);


--
-- Name: user_points_balance Allow anon users to view balance; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow anon users to view balance" ON public.user_points_balance FOR SELECT TO anon USING (true);


--
-- Name: points_records Allow anon users to view points records; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow anon users to view points records" ON public.points_records FOR SELECT TO anon USING (true);


--
-- Name: events Allow authenticated delete; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated delete" ON public.events FOR DELETE TO authenticated USING (true);


--
-- Name: cultural_knowledge Allow authenticated delete knowledge; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated delete knowledge" ON public.cultural_knowledge FOR DELETE TO authenticated USING (true);


--
-- Name: communities Allow authenticated insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated insert" ON public.communities FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: events Allow authenticated insert; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated insert" ON public.events FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: cultural_knowledge Allow authenticated insert knowledge; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated insert knowledge" ON public.cultural_knowledge FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: cultural_knowledge Allow authenticated read all knowledge; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated read all knowledge" ON public.cultural_knowledge FOR SELECT TO authenticated USING (true);


--
-- Name: communities Allow authenticated select; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated select" ON public.communities FOR SELECT TO authenticated USING (true);


--
-- Name: events Allow authenticated to view all events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated to view all events" ON public.events FOR SELECT TO authenticated USING (true);


--
-- Name: events Allow authenticated update; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated update" ON public.events FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: cultural_knowledge Allow authenticated update knowledge; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated update knowledge" ON public.cultural_knowledge FOR UPDATE TO authenticated USING (true);


--
-- Name: communities Allow authenticated users to create communities; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated users to create communities" ON public.communities FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: bookmarks Allow authenticated users to delete bookmarks; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated users to delete bookmarks" ON public.bookmarks FOR DELETE USING (((auth.uid())::text = user_id));


--
-- Name: bookmarks Allow authenticated users to insert bookmarks; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated users to insert bookmarks" ON public.bookmarks FOR INSERT WITH CHECK (((auth.uid())::text = user_id));


--
-- Name: organizer_backups Allow organizers to create own backups; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow organizers to create own backups" ON public.organizer_backups FOR INSERT TO authenticated WITH CHECK ((organizer_id IN ( SELECT brand_partnerships.id
   FROM public.brand_partnerships
  WHERE ((brand_partnerships.applicant_id = auth.uid()) AND (brand_partnerships.status = 'approved'::text)))));


--
-- Name: organizer_backups Allow organizers to delete own backups; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow organizers to delete own backups" ON public.organizer_backups FOR DELETE TO authenticated USING ((organizer_id IN ( SELECT brand_partnerships.id
   FROM public.brand_partnerships
  WHERE ((brand_partnerships.applicant_id = auth.uid()) AND (brand_partnerships.status = 'approved'::text)))));


--
-- Name: organizer_settings Allow organizers to insert own settings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow organizers to insert own settings" ON public.organizer_settings FOR INSERT TO authenticated WITH CHECK ((organizer_id IN ( SELECT brand_partnerships.id
   FROM public.brand_partnerships
  WHERE ((brand_partnerships.applicant_id = auth.uid()) AND (brand_partnerships.status = 'approved'::text)))));


--
-- Name: organizer_backups Allow organizers to read own backups; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow organizers to read own backups" ON public.organizer_backups FOR SELECT TO authenticated USING ((organizer_id IN ( SELECT brand_partnerships.id
   FROM public.brand_partnerships
  WHERE ((brand_partnerships.applicant_id = auth.uid()) AND (brand_partnerships.status = 'approved'::text)))));


--
-- Name: organizer_settings Allow organizers to read own settings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow organizers to read own settings" ON public.organizer_settings FOR SELECT TO authenticated USING ((organizer_id IN ( SELECT brand_partnerships.id
   FROM public.brand_partnerships
  WHERE ((brand_partnerships.applicant_id = auth.uid()) AND (brand_partnerships.status = 'approved'::text)))));


--
-- Name: organizer_settings Allow organizers to update own settings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow organizers to update own settings" ON public.organizer_settings FOR UPDATE TO authenticated USING ((organizer_id IN ( SELECT brand_partnerships.id
   FROM public.brand_partnerships
  WHERE ((brand_partnerships.applicant_id = auth.uid()) AND (brand_partnerships.status = 'approved'::text))))) WITH CHECK ((organizer_id IN ( SELECT brand_partnerships.id
   FROM public.brand_partnerships
  WHERE ((brand_partnerships.applicant_id = auth.uid()) AND (brand_partnerships.status = 'approved'::text)))));


--
-- Name: communities Allow public access to communities; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public access to communities" ON public.communities FOR SELECT USING (true);


--
-- Name: membership_benefits Allow public access to membership benefits; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public access to membership benefits" ON public.membership_benefits FOR SELECT USING (true);


--
-- Name: communities Allow public insert to communities; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public insert to communities" ON public.communities FOR INSERT WITH CHECK (true);


--
-- Name: cultural_knowledge Allow public read active knowledge; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read active knowledge" ON public.cultural_knowledge FOR SELECT USING (((status)::text = 'active'::text));


--
-- Name: users Allow users to insert own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow users to insert own profile" ON public.users FOR INSERT WITH CHECK ((auth.uid() = id));


--
-- Name: users Allow users to update own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow users to update own profile" ON public.users FOR UPDATE USING ((auth.uid() = id));


--
-- Name: ai_feedback Anyone can insert feedback; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can insert feedback" ON public.ai_feedback FOR INSERT WITH CHECK (true);


--
-- Name: ai_platform_knowledge Anyone can read platform knowledge; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can read platform knowledge" ON public.ai_platform_knowledge FOR SELECT USING ((is_active = true));


--
-- Name: points_rules Anyone can view active points rules; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view active points rules" ON public.points_rules FOR SELECT USING ((is_active = true));


--
-- Name: products Anyone can view active products; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (((status)::text = 'active'::text));


--
-- Name: points_rules Anyone can view active rules; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view active rules" ON public.points_rules FOR SELECT USING ((is_active = true));


--
-- Name: order_audits Anyone can view approved orders; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view approved orders" ON public.order_audits FOR SELECT TO authenticated USING ((status = 'approved'::text));


--
-- Name: ai_feedback Anyone can view feedback; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view feedback" ON public.ai_feedback FOR SELECT USING (true);


--
-- Name: submission_comments Authenticated users can create comments; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can create comments" ON public.submission_comments FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: submission_likes Authenticated users can create own likes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can create own likes" ON public.submission_likes FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: submission_ratings Authenticated users can create own ratings; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can create own ratings" ON public.submission_ratings FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: submission_votes Authenticated users can create own votes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can create own votes" ON public.submission_votes FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: submission_scores Authenticated users can create scores; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can create scores" ON public.submission_scores FOR INSERT WITH CHECK ((auth.uid() = judge_id));


--
-- Name: commercial_opportunities Authenticated users can view open opportunities; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can view open opportunities" ON public.commercial_opportunities FOR SELECT USING ((auth.role() = 'authenticated'::text));


--
-- Name: submission_comments Comments are viewable by everyone; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Comments are viewable by everyone" ON public.submission_comments FOR SELECT USING (true);


--
-- Name: communities Communities are viewable by everyone; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Communities are viewable by everyone" ON public.communities FOR SELECT USING (true);


--
-- Name: content_stats Content stats are publicly viewable; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Content stats are publicly viewable" ON public.content_stats FOR SELECT USING (true);


--
-- Name: communities Creator can update community; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Creator can update community" ON public.communities FOR UPDATE USING ((auth.uid() = creator_id));


--
-- Name: direct_messages Enable insert for authenticated users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable insert for authenticated users" ON public.direct_messages FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));


--