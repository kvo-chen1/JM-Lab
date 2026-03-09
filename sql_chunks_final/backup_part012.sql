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
