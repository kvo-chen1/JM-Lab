COPY public.works_likes (user_id, work_id, created_at) FROM stdin;
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
-- Name: direct_messages Enable read access for all users; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Enable read access for all users" ON public.direct_messages FOR SELECT USING (true);
--
-- Name: direct_messages Enable update for authenticated users; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Enable update for authenticated users" ON public.direct_messages FOR UPDATE USING ((auth.role() = 'authenticated'::text));
--
-- Name: event_works Event works are viewable by everyone; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Event works are viewable by everyone" ON public.event_works FOR SELECT USING (true);
--
-- Name: hot_searches Everyone can view hot searches; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Everyone can view hot searches" ON public.hot_searches FOR SELECT USING ((is_active = true));
--
-- Name: search_suggestions Everyone can view search suggestions; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Everyone can view search suggestions" ON public.search_suggestions FOR SELECT USING ((is_active = true));
--
-- Name: follows Follows are viewable; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Follows are viewable" ON public.follows FOR SELECT USING (true);
--
-- Name: submission_scores Judges can delete own scores; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Judges can delete own scores" ON public.submission_scores FOR DELETE USING ((auth.uid() = judge_id));
--
-- Name: submission_scores Judges can update own scores; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Judges can update own scores" ON public.submission_scores FOR UPDATE USING ((auth.uid() = judge_id));
--
-- Name: submission_likes Likes are viewable by everyone; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Likes are viewable by everyone" ON public.submission_likes FOR SELECT USING (true);
--
-- Name: messages Messages are viewable; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Messages are viewable" ON public.messages FOR SELECT USING (((receiver_id IS NULL) OR (sender_id = auth.uid()) OR (receiver_id = auth.uid())));
--
-- Name: audit_logs No public access to audit logs; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "No public access to audit logs" ON public.audit_logs USING (false);
--
-- Name: ai_platform_knowledge Only admins can modify platform knowledge; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Only admins can modify platform knowledge" ON public.ai_platform_knowledge USING ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = 'admin'::text)))));
--
-- Name: commercial_opportunities Only authenticated users can create opportunities; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Only authenticated users can create opportunities" ON public.commercial_opportunities FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));
--
-- Name: user_activities Only system can insert activities; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Only system can insert activities" ON public.user_activities FOR INSERT WITH CHECK (true);
--
-- Name: event_daily_stats Organizers can view own event stats; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Organizers can view own event stats" ON public.event_daily_stats FOR SELECT USING (((EXISTS ( SELECT 1
   FROM public.events e
  WHERE ((e.id = event_daily_stats.event_id) AND (e.organizer_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.id = auth.uid()) AND ((u.role)::text = 'admin'::text))))));
--
-- Name: work_performance_stats Organizers can view own work stats; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Organizers can view own work stats" ON public.work_performance_stats FOR SELECT USING (((EXISTS ( SELECT 1
   FROM public.events e
  WHERE ((e.id = work_performance_stats.event_id) AND (e.organizer_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.id = auth.uid()) AND ((u.role)::text = 'admin'::text))))));
--
-- Name: final_ranking_publishes Organizers can view ranking publishes; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Organizers can view ranking publishes" ON public.final_ranking_publishes FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.events e
  WHERE ((e.id = final_ranking_publishes.event_id) AND (e.organizer_id = auth.uid())))));
--
-- Name: post_tags Public can view post_tags; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Public can view post_tags" ON public.post_tags FOR SELECT USING (true);
--
-- Name: submission_ratings Ratings are viewable by everyone; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Ratings are viewable by everyone" ON public.submission_ratings FOR SELECT USING (true);
--
-- Name: messages Receivers can mark read; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Receivers can mark read" ON public.messages FOR UPDATE USING ((auth.uid() = receiver_id)) WITH CHECK ((auth.uid() = receiver_id));
--
-- Name: recommendation_configs Recommendation configs are publicly viewable; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Recommendation configs are publicly viewable" ON public.recommendation_configs FOR SELECT USING (true);
--
-- Name: score_audit_logs Score audit logs are viewable by everyone; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Score audit logs are viewable by everyone" ON public.score_audit_logs FOR SELECT USING (true);
--
-- Name: messages Senders can delete messages; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Senders can delete messages" ON public.messages FOR DELETE USING ((auth.uid() = sender_id));
--
-- Name: messages Senders can update messages; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Senders can update messages" ON public.messages FOR UPDATE USING ((auth.uid() = sender_id)) WITH CHECK ((auth.uid() = sender_id));
--
-- Name: user_behavior_events Service can insert behavior events; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Service can insert behavior events" ON public.user_behavior_events FOR INSERT WITH CHECK (true);
--
-- Name: user_realtime_features Service can manage features; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Service can manage features" ON public.user_realtime_features USING (true);
--
-- Name: realtime_recommendation_cache Service can manage recommendations; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Service can manage recommendations" ON public.realtime_recommendation_cache USING (true);
--
-- Name: checkin_records Service role can manage all checkin records; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Service role can manage all checkin records" ON public.checkin_records USING (true) WITH CHECK (true);
--
-- Name: consumption_records Service role can manage all consumption records; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Service role can manage all consumption records" ON public.consumption_records USING (true) WITH CHECK (true);
--
-- Name: exchange_records Service role can manage all exchange records; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Service role can manage all exchange records" ON public.exchange_records USING (true) WITH CHECK (true);
--
-- Name: invite_records Service role can manage all invite records; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Service role can manage all invite records" ON public.invite_records USING (true) WITH CHECK (true);
--
-- Name: points_rules Service role can manage points rules; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Service role can manage points rules" ON public.points_rules USING (true) WITH CHECK (true);
--
-- Name: submission_scores Submission scores are viewable by everyone; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Submission scores are viewable by everyone" ON public.submission_scores FOR SELECT USING (true);
--
-- Name: score_audit_logs System can create audit logs; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "System can create audit logs" ON public.score_audit_logs FOR INSERT WITH CHECK (true);
--
-- Name: notifications System can insert notifications; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
--
-- Name: points_records System can insert points records; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "System can insert points records" ON public.points_records FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: drafts Users can CRUD their own drafts; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can CRUD their own drafts" ON public.drafts USING ((auth.uid() = user_id));
--
-- Name: communities Users can create communities; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can create communities" ON public.communities FOR INSERT WITH CHECK ((auth.role() = 'authenticated'::text));
--
-- Name: exchange_records Users can create exchange; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can create exchange" ON public.exchange_records FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: invite_records Users can create invites; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can create invites" ON public.invite_records FOR INSERT WITH CHECK ((auth.uid() = inviter_id));
--
-- Name: order_audits Users can create orders; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can create orders" ON public.order_audits FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: ai_reviews Users can create own AI reviews; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can create own AI reviews" ON public.ai_reviews FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: event_works Users can create own event works; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can create own event works" ON public.event_works FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: generation_tasks Users can create own generation tasks; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can create own generation tasks" ON public.generation_tasks FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: event_submissions Users can create own submissions; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can create own submissions" ON public.event_submissions FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: ip_assets Users can create their own IP assets; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can create their own IP assets" ON public.ip_assets FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: ai_conversations Users can create their own conversations; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can create their own conversations" ON public.ai_conversations FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
--
-- Name: copyright_assets Users can create their own copyright assets; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can create their own copyright assets" ON public.copyright_assets FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: ip_partnerships Users can create their own partnerships; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can create their own partnerships" ON public.ip_partnerships FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: reports Users can create their own reports; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can create their own reports" ON public.reports FOR INSERT WITH CHECK ((auth.uid() = reporter_id));
--
-- Name: work_shares Users can create their own work shares; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can create their own work shares" ON public.work_shares FOR INSERT WITH CHECK ((auth.uid() = sender_id));
--
-- Name: ai_reviews Users can delete own AI reviews; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can delete own AI reviews" ON public.ai_reviews FOR DELETE USING ((auth.uid() = user_id));
--
-- Name: bookmarks Users can delete own bookmarks; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can delete own bookmarks" ON public.bookmarks FOR DELETE USING (((auth.uid())::text = user_id));
--
-- Name: user_brand_history Users can delete own brand history; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can delete own brand history" ON public.user_brand_history FOR DELETE USING ((auth.uid() = user_id));
--
-- Name: submission_comments Users can delete own comments; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can delete own comments" ON public.submission_comments FOR DELETE USING ((auth.uid() = user_id));
--
-- Name: event_submissions Users can delete own draft submissions; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can delete own draft submissions" ON public.event_submissions FOR DELETE USING (((auth.uid() = user_id) AND (status = 'draft'::text)));
--
-- Name: brand_wizard_drafts Users can delete own drafts; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can delete own drafts" ON public.brand_wizard_drafts FOR DELETE USING ((auth.uid() = user_id));
--
-- Name: template_favorites Users can delete own favorites; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can delete own favorites" ON public.template_favorites FOR DELETE USING ((auth.uid() = user_id));
--
-- Name: user_favorites Users can delete own favorites; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can delete own favorites" ON public.user_favorites FOR DELETE USING ((auth.uid() = user_id));
--
-- Name: generation_tasks Users can delete own generation tasks; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can delete own generation tasks" ON public.generation_tasks FOR DELETE USING ((auth.uid() = user_id));
--
-- Name: likes Users can delete own likes; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can delete own likes" ON public.likes FOR DELETE USING (((auth.uid())::text = user_id));
--
-- Name: submission_likes Users can delete own likes; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can delete own likes" ON public.submission_likes FOR DELETE USING ((auth.uid() = user_id));
--
-- Name: template_likes Users can delete own likes; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can delete own likes" ON public.template_likes FOR DELETE USING ((auth.uid() = user_id));
--
-- Name: user_mockup_configs Users can delete own mockup configs; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can delete own mockup configs" ON public.user_mockup_configs FOR DELETE USING ((auth.uid() = user_id));
--
-- Name: event_notifications Users can delete own notifications; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can delete own notifications" ON public.event_notifications FOR DELETE USING ((auth.uid() = user_id));
--
-- Name: notifications Users can delete own notifications; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.id = auth.uid()) AND (u.id = notifications.user_id)))));
--
-- Name: user_patterns Users can delete own patterns; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can delete own patterns" ON public.user_patterns FOR DELETE USING ((auth.uid() = user_id));
--
-- Name: brand_ratings Users can delete own ratings; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can delete own ratings" ON public.brand_ratings FOR DELETE USING ((auth.uid() = user_id));
--
-- Name: submission_ratings Users can delete own ratings; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can delete own ratings" ON public.submission_ratings FOR DELETE USING ((auth.uid() = user_id));
--
-- Name: ai_reviews Users can delete own reviews; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can delete own reviews" ON public.ai_reviews FOR DELETE USING ((user_id = auth.uid()));
--
-- Name: user_search_history Users can delete own search history; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can delete own search history" ON public.user_search_history FOR DELETE USING ((auth.uid() = user_id));
--
-- Name: user_style_presets Users can delete own style presets; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can delete own style presets" ON public.user_style_presets FOR DELETE USING ((auth.uid() = user_id));
--
-- Name: user_tile_configs Users can delete own tile configs; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can delete own tile configs" ON public.user_tile_configs FOR DELETE USING ((auth.uid() = user_id));
--
-- Name: user_uploads Users can delete own uploads; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can delete own uploads" ON public.user_uploads FOR DELETE USING ((auth.uid() = user_id));
--
-- Name: submission_votes Users can delete own votes; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can delete own votes" ON public.submission_votes FOR DELETE USING ((auth.uid() = user_id));
--
-- Name: works_bookmarks Users can delete own works bookmarks; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can delete own works bookmarks" ON public.works_bookmarks FOR DELETE USING (((auth.uid())::text = user_id));
--
-- Name: works_likes Users can delete own works likes; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can delete own works likes" ON public.works_likes FOR DELETE USING (((auth.uid())::text = user_id));
--
-- Name: ip_assets Users can delete their own IP assets; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can delete their own IP assets" ON public.ip_assets FOR DELETE USING ((auth.uid() = user_id));
--
-- Name: ai_conversations Users can delete their own conversations; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can delete their own conversations" ON public.ai_conversations FOR DELETE TO authenticated USING ((auth.uid() = user_id));
--
-- Name: favorites Users can delete their own favorites; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can delete their own favorites" ON public.favorites FOR DELETE USING ((auth.uid() = user_id));
--
-- Name: work_shares Users can delete their own work shares; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can delete their own work shares" ON public.work_shares FOR DELETE USING (((auth.uid() = sender_id) OR (auth.uid() = receiver_id)));
--
-- Name: follows Users can follow; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can follow" ON public.follows FOR INSERT WITH CHECK ((auth.uid() = follower_id));
--
-- Name: invite_records Users can insert invite records; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can insert invite records" ON public.invite_records FOR INSERT WITH CHECK (true);
--
-- Name: user_achievements Users can insert own achievements; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can insert own achievements" ON public.user_achievements FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: user_behaviors Users can insert own behaviors; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can insert own behaviors" ON public.user_behaviors FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: bookmarks Users can insert own bookmarks; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can insert own bookmarks" ON public.bookmarks FOR INSERT WITH CHECK (((auth.uid())::text = user_id));
--
-- Name: user_brand_history Users can insert own brand history; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can insert own brand history" ON public.user_brand_history FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: checkin_records Users can insert own checkin; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can insert own checkin" ON public.checkin_records FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: checkin_records Users can insert own checkin records; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can insert own checkin records" ON public.checkin_records FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: brand_wizard_drafts Users can insert own drafts; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can insert own drafts" ON public.brand_wizard_drafts FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: exchange_records Users can insert own exchange records; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can insert own exchange records" ON public.exchange_records FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: template_favorites Users can insert own favorites; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can insert own favorites" ON public.template_favorites FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: user_favorites Users can insert own favorites; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can insert own favorites" ON public.user_favorites FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: likes Users can insert own likes; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can insert own likes" ON public.likes FOR INSERT WITH CHECK (((auth.uid())::text = user_id));
--
-- Name: template_likes Users can insert own likes; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can insert own likes" ON public.template_likes FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: user_mockup_configs Users can insert own mockup configs; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can insert own mockup configs" ON public.user_mockup_configs FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: user_patterns Users can insert own patterns; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can insert own patterns" ON public.user_patterns FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: brand_ratings Users can insert own ratings; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can insert own ratings" ON public.brand_ratings FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: ai_reviews Users can insert own reviews; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can insert own reviews" ON public.ai_reviews FOR INSERT WITH CHECK ((user_id = auth.uid()));
--
-- Name: user_search_history Users can insert own search history; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can insert own search history" ON public.user_search_history FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: user_search_preferences Users can insert own search preferences; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can insert own search preferences" ON public.user_search_preferences FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: user_style_presets Users can insert own style presets; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can insert own style presets" ON public.user_style_presets FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: user_tile_configs Users can insert own tile configs; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can insert own tile configs" ON public.user_tile_configs FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: user_uploads Users can insert own uploads; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can insert own uploads" ON public.user_uploads FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: works_bookmarks Users can insert own works bookmarks; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can insert own works bookmarks" ON public.works_bookmarks FOR INSERT WITH CHECK (((auth.uid())::text = user_id));
--
-- Name: works_likes Users can insert own works likes; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can insert own works likes" ON public.works_likes FOR INSERT WITH CHECK (((auth.uid())::text = user_id));
--
-- Name: post_tags Users can insert post_tags; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can insert post_tags" ON public.post_tags FOR INSERT TO authenticated WITH CHECK (true);
--
-- Name: user_activities Users can insert their own activities; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can insert their own activities" ON public.user_activities FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: user_behavior_logs Users can insert their own behavior logs; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can insert their own behavior logs" ON public.user_behavior_logs FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
--
-- Name: conversion_events Users can insert their own conversion events; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can insert their own conversion events" ON public.conversion_events FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
--
-- Name: favorites Users can insert their own favorites; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can insert their own favorites" ON public.favorites FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: user_sync_logs Users can insert their own sync logs; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can insert their own sync logs" ON public.user_sync_logs FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
--
-- Name: ip_stages Users can manage stages of their IP assets; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can manage stages of their IP assets" ON public.ip_stages USING ((EXISTS ( SELECT 1
   FROM public.ip_assets
  WHERE ((ip_assets.id = ip_stages.ip_asset_id) AND (ip_assets.user_id = auth.uid())))));
--
-- Name: ip_activities Users can manage their own activities; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can manage their own activities" ON public.ip_activities USING ((auth.uid() = user_id));
--
-- Name: friends Users can manage their own friends; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can manage their own friends" ON public.friends USING ((user_id = (COALESCE(current_setting('request.jwt.claim.sub'::text, true), current_setting('request.jwt.claim.userId'::text, true)))::uuid));
--
-- Name: ai_messages Users can only access messages in their conversations; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can only access messages in their conversations" ON public.ai_messages USING ((EXISTS ( SELECT 1
   FROM public.ai_conversations
  WHERE ((ai_conversations.id = ai_messages.conversation_id) AND (ai_conversations.user_id = auth.uid())))));
--
-- Name: ai_conversations Users can only access their own conversations; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can only access their own conversations" ON public.ai_conversations USING ((user_id = auth.uid()));
--
-- Name: ai_user_memories Users can only access their own memories; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can only access their own memories" ON public.ai_user_memories USING ((user_id = auth.uid()));
--
-- Name: ai_user_settings Users can only access their own settings; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can only access their own settings" ON public.ai_user_settings USING ((user_id = auth.uid()));
--
-- Name: friend_requests Users can send friend requests; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can send friend requests" ON public.friend_requests FOR INSERT WITH CHECK ((auth.uid() = sender_id));
--
-- Name: messages Users can send messages; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK ((auth.uid() = sender_id));
--
-- Name: follows Users can unfollow; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can unfollow" ON public.follows FOR DELETE USING ((auth.uid() = follower_id));
--
-- Name: user_achievements Users can update own achievements; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can update own achievements" ON public.user_achievements FOR UPDATE USING ((auth.uid() = user_id));
--
-- Name: user_brand_history Users can update own brand history; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can update own brand history" ON public.user_brand_history FOR UPDATE USING ((auth.uid() = user_id));
--
-- Name: submission_comments Users can update own comments; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can update own comments" ON public.submission_comments FOR UPDATE USING ((auth.uid() = user_id));
--
-- Name: event_submissions Users can update own draft submissions; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can update own draft submissions" ON public.event_submissions FOR UPDATE USING (((auth.uid() = user_id) AND (status = 'draft'::text)));
--
-- Name: brand_wizard_drafts Users can update own drafts; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can update own drafts" ON public.brand_wizard_drafts FOR UPDATE USING ((auth.uid() = user_id));
--
-- Name: user_favorites Users can update own favorites; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can update own favorites" ON public.user_favorites FOR UPDATE USING ((auth.uid() = user_id));
--
-- Name: friend_requests Users can update own friend requests; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can update own friend requests" ON public.friend_requests FOR UPDATE USING (((auth.uid() = sender_id) OR (auth.uid() = receiver_id)));
--
-- Name: generation_tasks Users can update own generation tasks; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can update own generation tasks" ON public.generation_tasks FOR UPDATE USING ((auth.uid() = user_id));
--
-- Name: user_mockup_configs Users can update own mockup configs; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can update own mockup configs" ON public.user_mockup_configs FOR UPDATE USING ((auth.uid() = user_id));
--
-- Name: event_notifications Users can update own notifications; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can update own notifications" ON public.event_notifications FOR UPDATE USING ((auth.uid() = user_id));
--
-- Name: notifications Users can update own notifications; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.id = auth.uid()) AND (u.id = notifications.user_id)))));
--
-- Name: user_patterns Users can update own patterns; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can update own patterns" ON public.user_patterns FOR UPDATE USING ((auth.uid() = user_id));
--
-- Name: user_profiles Users can update own profile; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING ((auth.uid() = user_id));
--
-- Name: brand_ratings Users can update own ratings; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can update own ratings" ON public.brand_ratings FOR UPDATE USING ((auth.uid() = user_id));
--
-- Name: submission_ratings Users can update own ratings; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can update own ratings" ON public.submission_ratings FOR UPDATE USING ((auth.uid() = user_id));
--
-- Name: ai_reviews Users can update own reviews; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can update own reviews" ON public.ai_reviews FOR UPDATE USING ((user_id = auth.uid()));
--
-- Name: user_search_preferences Users can update own search preferences; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can update own search preferences" ON public.user_search_preferences FOR UPDATE USING ((auth.uid() = user_id));
--
-- Name: user_style_presets Users can update own style presets; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can update own style presets" ON public.user_style_presets FOR UPDATE USING ((auth.uid() = user_id));
--
-- Name: user_tile_configs Users can update own tile configs; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can update own tile configs" ON public.user_tile_configs FOR UPDATE USING ((auth.uid() = user_id));
--
-- Name: user_uploads Users can update own uploads; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can update own uploads" ON public.user_uploads FOR UPDATE USING ((auth.uid() = user_id));
--
-- Name: work_shares Users can update received work shares; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can update received work shares" ON public.work_shares FOR UPDATE USING ((auth.uid() = receiver_id)) WITH CHECK ((auth.uid() = receiver_id));
--
-- Name: ip_assets Users can update their own IP assets; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can update their own IP assets" ON public.ip_assets FOR UPDATE USING ((auth.uid() = user_id));
--
-- Name: ai_conversations Users can update their own conversations; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can update their own conversations" ON public.ai_conversations FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
--
-- Name: copyright_assets Users can update their own copyright assets; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can update their own copyright assets" ON public.copyright_assets FOR UPDATE USING ((auth.uid() = user_id));
--
-- Name: order_audits Users can update their own orders; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can update their own orders" ON public.order_audits FOR UPDATE USING (((auth.uid() = user_id) AND (status = 'pending'::text)));
--
-- Name: ip_partnerships Users can update their own partnerships; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can update their own partnerships" ON public.ip_partnerships FOR UPDATE USING ((auth.uid() = user_id));
--
-- Name: task_records Users can upsert own tasks; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can upsert own tasks" ON public.task_records USING ((auth.uid() = user_id));
--
-- Name: user_activities Users can view all activities; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view all activities" ON public.user_activities FOR SELECT USING (true);
--
-- Name: brand_ratings Users can view all ratings; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view all ratings" ON public.brand_ratings FOR SELECT USING (true);
--
-- Name: ai_reviews Users can view own AI reviews; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view own AI reviews" ON public.ai_reviews FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: user_achievements Users can view own achievements; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view own achievements" ON public.user_achievements FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: search_behavior_tracking Users can view own behavior tracking; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view own behavior tracking" ON public.search_behavior_tracking FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: user_behaviors Users can view own behaviors; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view own behaviors" ON public.user_behaviors FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: bookmarks Users can view own bookmarks; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view own bookmarks" ON public.bookmarks FOR SELECT USING (((auth.uid())::text = user_id));
--
-- Name: user_brand_history Users can view own brand history; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view own brand history" ON public.user_brand_history FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: checkin_records Users can view own checkin; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view own checkin" ON public.checkin_records FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: checkin_records Users can view own checkin records; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view own checkin records" ON public.checkin_records FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: consumption_records Users can view own consumption; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view own consumption" ON public.consumption_records FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: consumption_records Users can view own consumption records; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view own consumption records" ON public.consumption_records FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: membership_coupon_usage Users can view own coupon usage; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view own coupon usage" ON public.membership_coupon_usage FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: user_creative_profiles Users can view own creative profile; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view own creative profile" ON public.user_creative_profiles FOR SELECT USING ((user_id = auth.uid()));
--
-- Name: user_behavior_daily_stats Users can view own daily stats; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view own daily stats" ON public.user_behavior_daily_stats FOR SELECT USING ((user_id = auth.uid()));
--
-- Name: brand_wizard_drafts Users can view own drafts; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view own drafts" ON public.brand_wizard_drafts FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: exchange_records Users can view own exchange; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view own exchange" ON public.exchange_records FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: exchange_records Users can view own exchange records; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view own exchange records" ON public.exchange_records FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: template_favorites Users can view own favorites; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view own favorites" ON public.template_favorites FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: user_favorites Users can view own favorites; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view own favorites" ON public.user_favorites FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: friend_requests Users can view own friend requests; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view own friend requests" ON public.friend_requests FOR SELECT USING (((auth.uid() = sender_id) OR (auth.uid() = receiver_id)));
--
-- Name: generation_tasks Users can view own generation tasks; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view own generation tasks" ON public.generation_tasks FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: membership_history Users can view own history; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view own history" ON public.membership_history FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: invite_records Users can view own invite records; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view own invite records" ON public.invite_records FOR SELECT USING ((auth.uid() = inviter_id));
--
-- Name: invite_records Users can view own invites; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view own invites" ON public.invite_records FOR SELECT USING (((auth.uid() = inviter_id) OR (auth.uid() = invitee_id)));
--
-- Name: likes Users can view own likes; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view own likes" ON public.likes FOR SELECT USING (((auth.uid())::text = user_id));
--
-- Name: template_likes Users can view own likes; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view own likes" ON public.template_likes FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: user_mockup_configs Users can view own mockup configs; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view own mockup configs" ON public.user_mockup_configs FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: event_notifications Users can view own notifications; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view own notifications" ON public.event_notifications FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: notifications Users can view own notifications; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.id = auth.uid()) AND (u.id = notifications.user_id)))));
--
-- Name: membership_orders Users can view own orders; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view own orders" ON public.membership_orders FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: user_patterns Users can view own patterns; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view own patterns" ON public.user_patterns FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: user_profiles Users can view own profile; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: recommendation_history Users can view own recommendation history; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view own recommendation history" ON public.recommendation_history FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: ai_reviews Users can view own reviews; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view own reviews" ON public.ai_reviews FOR SELECT USING ((user_id = auth.uid()));
--
-- Name: user_search_history Users can view own search history; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view own search history" ON public.user_search_history FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: user_search_preferences Users can view own search preferences; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view own search preferences" ON public.user_search_preferences FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: user_similarities Users can view own similarities; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view own similarities" ON public.user_similarities FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: user_style_presets Users can view own style presets; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view own style presets" ON public.user_style_presets FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: event_submissions Users can view own submissions; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view own submissions" ON public.event_submissions FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: task_records Users can view own tasks; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view own tasks" ON public.task_records FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: user_tile_configs Users can view own tile configs; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view own tile configs" ON public.user_tile_configs FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: user_uploads Users can view own uploads; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view own uploads" ON public.user_uploads FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: membership_usage_stats Users can view own usage stats; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view own usage stats" ON public.membership_usage_stats FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: works_bookmarks Users can view own works bookmarks; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view own works bookmarks" ON public.works_bookmarks FOR SELECT USING (((auth.uid())::text = user_id));
--
-- Name: works_likes Users can view own works likes; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view own works likes" ON public.works_likes FOR SELECT USING (((auth.uid())::text = user_id));
--
-- Name: ip_stages Users can view stages of their IP assets; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view stages of their IP assets" ON public.ip_stages FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.ip_assets
  WHERE ((ip_assets.id = ip_stages.ip_asset_id) AND (ip_assets.user_id = auth.uid())))));
--
-- Name: ip_assets Users can view their own IP assets; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view their own IP assets" ON public.ip_assets FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: ip_activities Users can view their own activities; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view their own activities" ON public.ip_activities FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: user_activities Users can view their own activities; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view their own activities" ON public.user_activities FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: user_behavior_events Users can view their own behavior events; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view their own behavior events" ON public.user_behavior_events FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: user_behavior_logs Users can view their own behavior logs; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view their own behavior logs" ON public.user_behavior_logs FOR SELECT TO authenticated USING ((auth.uid() = user_id));
--
-- Name: blind_box_sales Users can view their own blind_box_sales; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view their own blind_box_sales" ON public.blind_box_sales FOR SELECT TO authenticated USING ((auth.uid() = user_id));
--
-- Name: ai_conversations Users can view their own conversations; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view their own conversations" ON public.ai_conversations FOR SELECT TO authenticated USING ((auth.uid() = user_id));
--
-- Name: copyright_assets Users can view their own copyright assets; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view their own copyright assets" ON public.copyright_assets FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: favorites Users can view their own favorites; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view their own favorites" ON public.favorites FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: user_realtime_features Users can view their own features; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view their own features" ON public.user_realtime_features FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: friends Users can view their own friends; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view their own friends" ON public.friends FOR SELECT USING ((user_id = (COALESCE(current_setting('request.jwt.claim.sub'::text, true), current_setting('request.jwt.claim.userId'::text, true)))::uuid));
--
-- Name: memberships Users can view their own memberships; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view their own memberships" ON public.memberships FOR SELECT TO authenticated USING ((auth.uid() = user_id));
--
-- Name: order_audits Users can view their own orders; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view their own orders" ON public.order_audits FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: ip_partnerships Users can view their own partnerships; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view their own partnerships" ON public.ip_partnerships FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: realtime_recommendation_cache Users can view their own recommendations; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view their own recommendations" ON public.realtime_recommendation_cache FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: reports Users can view their own reports; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view their own reports" ON public.reports FOR SELECT USING ((auth.uid() = reporter_id));
--
-- Name: user_sync_logs Users can view their own sync logs; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view their own sync logs" ON public.user_sync_logs FOR SELECT TO authenticated USING ((auth.uid() = user_id));
--
-- Name: work_shares Users can view their own work shares; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Users can view their own work shares" ON public.work_shares FOR SELECT USING (((auth.uid() = sender_id) OR (auth.uid() = receiver_id)));
--
-- Name: submission_votes Votes are viewable by everyone; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "Votes are viewable by everyone" ON public.submission_votes FOR SELECT USING (true);
--
-- Name: achievement_configs; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.achievement_configs ENABLE ROW LEVEL SECURITY;
--
-- Name: achievements; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
--
-- Name: admin_notifications; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
--
-- Name: ai_conversations; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
--
-- Name: ai_feedback; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;
--
-- Name: ai_messages; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
--
-- Name: ai_platform_knowledge; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.ai_platform_knowledge ENABLE ROW LEVEL SECURITY;
--
-- Name: ai_reviews; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.ai_reviews ENABLE ROW LEVEL SECURITY;
--
-- Name: ai_user_memories; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.ai_user_memories ENABLE ROW LEVEL SECURITY;
--
-- Name: ai_user_settings; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.ai_user_settings ENABLE ROW LEVEL SECURITY;
--
-- Name: alert_notifications; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.alert_notifications ENABLE ROW LEVEL SECURITY;
--
-- Name: alert_records; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.alert_records ENABLE ROW LEVEL SECURITY;
--
-- Name: alert_rules; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;
--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
--
-- Name: blind_box_sales; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.blind_box_sales ENABLE ROW LEVEL SECURITY;
--
-- Name: brand_accounts; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.brand_accounts ENABLE ROW LEVEL SECURITY;
--
-- Name: brand_events; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.brand_events ENABLE ROW LEVEL SECURITY;
--
-- Name: brand_partnerships; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.brand_partnerships ENABLE ROW LEVEL SECURITY;
--
-- Name: brand_ratings; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.brand_ratings ENABLE ROW LEVEL SECURITY;
--
-- Name: brand_task_analytics; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.brand_task_analytics ENABLE ROW LEVEL SECURITY;
--
-- Name: brand_task_submissions; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.brand_task_submissions ENABLE ROW LEVEL SECURITY;
--
-- Name: brand_transactions; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.brand_transactions ENABLE ROW LEVEL SECURITY;
--
-- Name: brand_wizard_drafts; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.brand_wizard_drafts ENABLE ROW LEVEL SECURITY;
--
-- Name: business_tasks; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.business_tasks ENABLE ROW LEVEL SECURITY;
--
-- Name: categories; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
--
-- Name: channel_costs; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.channel_costs ENABLE ROW LEVEL SECURITY;
--
-- Name: checkin_records; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.checkin_records ENABLE ROW LEVEL SECURITY;
--
-- Name: cold_start_recommendation_logs cold_start_logs_service_policy; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY cold_start_logs_service_policy ON public.cold_start_recommendation_logs USING (true);
--
-- Name: cold_start_recommendation_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.cold_start_recommendation_logs ENABLE ROW LEVEL SECURITY;
--
-- Name: commercial_opportunities; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.commercial_opportunities ENABLE ROW LEVEL SECURITY;
--
-- Name: community_announcements; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.community_announcements ENABLE ROW LEVEL SECURITY;
--
-- Name: community_invitations; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.community_invitations ENABLE ROW LEVEL SECURITY;
--
-- Name: community_invitations community_invitations_insert_policy; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY community_invitations_insert_policy ON public.community_invitations FOR INSERT WITH CHECK (((inviter_id = (auth.uid())::text) AND (EXISTS ( SELECT 1
   FROM public.community_members
  WHERE (((community_members.community_id)::text = (community_invitations.community_id)::text) AND (community_members.user_id = (auth.uid())::text))))));
--
-- Name: community_invitations community_invitations_select_policy; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY community_invitations_select_policy ON public.community_invitations FOR SELECT USING (((inviter_id = (auth.uid())::text) OR (invitee_id = (auth.uid())::text) OR (EXISTS ( SELECT 1
   FROM public.community_members
  WHERE (((community_members.community_id)::text = (community_invitations.community_id)::text) AND (community_members.user_id = (auth.uid())::text) AND ((community_members.role)::text = ANY ((ARRAY['owner'::character varying, 'admin'::character varying])::text[])))))));
--
-- Name: community_invitations community_invitations_update_policy; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY community_invitations_update_policy ON public.community_invitations FOR UPDATE USING (((inviter_id = (auth.uid())::text) OR (invitee_id = (auth.uid())::text) OR (EXISTS ( SELECT 1
   FROM public.community_members
  WHERE (((community_members.community_id)::text = (community_invitations.community_id)::text) AND (community_members.user_id = (auth.uid())::text) AND ((community_members.role)::text = ANY ((ARRAY['owner'::character varying, 'admin'::character varying])::text[])))))));
--
-- Name: community_invite_settings; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.community_invite_settings ENABLE ROW LEVEL SECURITY;
--
-- Name: community_invite_settings community_invite_settings_modify_policy; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY community_invite_settings_modify_policy ON public.community_invite_settings USING ((EXISTS ( SELECT 1
   FROM public.community_members
  WHERE (((community_members.community_id)::text = (community_invite_settings.community_id)::text) AND (community_members.user_id = (auth.uid())::text) AND ((community_members.role)::text = ANY ((ARRAY['owner'::character varying, 'admin'::character varying])::text[]))))));
--
-- Name: community_invite_settings community_invite_settings_select_policy; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY community_invite_settings_select_policy ON public.community_invite_settings FOR SELECT USING (true);
--
-- Name: community_join_requests; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.community_join_requests ENABLE ROW LEVEL SECURITY;
--
-- Name: community_join_requests community_join_requests_insert_policy; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY community_join_requests_insert_policy ON public.community_join_requests FOR INSERT WITH CHECK ((user_id = (auth.uid())::text));
--
-- Name: community_join_requests community_join_requests_select_policy; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY community_join_requests_select_policy ON public.community_join_requests FOR SELECT USING (((user_id = (auth.uid())::text) OR (EXISTS ( SELECT 1
   FROM public.community_members
  WHERE (((community_members.community_id)::text = (community_join_requests.community_id)::text) AND (community_members.user_id = (auth.uid())::text) AND ((community_members.role)::text = ANY ((ARRAY['owner'::character varying, 'admin'::character varying, 'moderator'::character varying])::text[])))))));
--
-- Name: community_join_requests community_join_requests_update_policy; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY community_join_requests_update_policy ON public.community_join_requests FOR UPDATE USING (((user_id = (auth.uid())::text) OR (EXISTS ( SELECT 1
   FROM public.community_members
  WHERE (((community_members.community_id)::text = (community_join_requests.community_id)::text) AND (community_members.user_id = (auth.uid())::text) AND ((community_members.role)::text = ANY ((ARRAY['owner'::character varying, 'admin'::character varying, 'moderator'::character varying])::text[])))))));
--
-- Name: consumption_records; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.consumption_records ENABLE ROW LEVEL SECURITY;
--
-- Name: content_quality_assessments; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.content_quality_assessments ENABLE ROW LEVEL SECURITY;
--
-- Name: content_quality_assessments content_quality_public_policy; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY content_quality_public_policy ON public.content_quality_assessments FOR SELECT USING (true);
--
-- Name: content_stats; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.content_stats ENABLE ROW LEVEL SECURITY;
--
-- Name: conversations; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
--
-- Name: conversion_events; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.conversion_events ENABLE ROW LEVEL SECURITY;
--
-- Name: copyright_assets; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.copyright_assets ENABLE ROW LEVEL SECURITY;
--
-- Name: creator_earnings; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.creator_earnings ENABLE ROW LEVEL SECURITY;
--
-- Name: creator_level_configs; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.creator_level_configs ENABLE ROW LEVEL SECURITY;
--
-- Name: creator_revenue; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.creator_revenue ENABLE ROW LEVEL SECURITY;
--
-- Name: creator_task_applications; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.creator_task_applications ENABLE ROW LEVEL SECURITY;
--
-- Name: cultural_knowledge; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.cultural_knowledge ENABLE ROW LEVEL SECURITY;
--
-- Name: drafts; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.drafts ENABLE ROW LEVEL SECURITY;
--
-- Name: errors; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.errors ENABLE ROW LEVEL SECURITY;
--
-- Name: event_bookmarks; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.event_bookmarks ENABLE ROW LEVEL SECURITY;
--
-- Name: event_daily_stats; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.event_daily_stats ENABLE ROW LEVEL SECURITY;
--
-- Name: event_likes; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.event_likes ENABLE ROW LEVEL SECURITY;
--
-- Name: event_notifications; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.event_notifications ENABLE ROW LEVEL SECURITY;
--
-- Name: event_prizes; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.event_prizes ENABLE ROW LEVEL SECURITY;
--
-- Name: event_submissions; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.event_submissions ENABLE ROW LEVEL SECURITY;
--
-- Name: event_submissions event_submissions_admin_delete; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY event_submissions_admin_delete ON public.event_submissions FOR DELETE USING ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = auth.uid()) AND (((users.raw_user_meta_data ->> 'role'::text) = ANY (ARRAY['admin'::text, 'moderator'::text])) OR ((users.raw_user_meta_data ->> 'is_admin'::text) = 'true'::text))))));
--
-- Name: event_submissions event_submissions_admin_update; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY event_submissions_admin_update ON public.event_submissions FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM auth.users
  WHERE ((users.id = auth.uid()) AND (((users.raw_user_meta_data ->> 'role'::text) = ANY (ARRAY['admin'::text, 'moderator'::text, 'organizer'::text])) OR ((users.raw_user_meta_data ->> 'is_admin'::text) = 'true'::text))))));
--
-- Name: event_submissions event_submissions_delete_own; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY event_submissions_delete_own ON public.event_submissions FOR DELETE USING (((auth.uid() = user_id) AND (status = 'draft'::text)));
--
-- Name: event_submissions event_submissions_insert_own; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY event_submissions_insert_own ON public.event_submissions FOR INSERT WITH CHECK ((auth.uid() = user_id));
--
-- Name: event_submissions event_submissions_select_all; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY event_submissions_select_all ON public.event_submissions FOR SELECT USING (true);
--
-- Name: event_submissions event_submissions_update_own; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY event_submissions_update_own ON public.event_submissions FOR UPDATE USING (((auth.uid() = user_id) AND (status = ANY (ARRAY['draft'::text, 'submitted'::text, 'under_review'::text]))));
--
-- Name: event_works; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.event_works ENABLE ROW LEVEL SECURITY;
--
-- Name: events; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
--
-- Name: exchange_records; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.exchange_records ENABLE ROW LEVEL SECURITY;
--
-- Name: favorites; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
--
-- Name: feed_collects; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.feed_collects ENABLE ROW LEVEL SECURITY;
--
-- Name: feed_comment_likes; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.feed_comment_likes ENABLE ROW LEVEL SECURITY;
--
-- Name: feed_comments; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.feed_comments ENABLE ROW LEVEL SECURITY;
--
-- Name: feed_likes; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.feed_likes ENABLE ROW LEVEL SECURITY;
--
-- Name: feeds; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.feeds ENABLE ROW LEVEL SECURITY;
--
-- Name: final_ranking_publishes; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.final_ranking_publishes ENABLE ROW LEVEL SECURITY;
--
-- Name: follows; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
--
-- Name: forbidden_words; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.forbidden_words ENABLE ROW LEVEL SECURITY;
--
-- Name: friend_requests; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
--
-- Name: generation_tasks; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.generation_tasks ENABLE ROW LEVEL SECURITY;
--
-- Name: hot_searches; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.hot_searches ENABLE ROW LEVEL SECURITY;
--
-- Name: invitation_reports; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.invitation_reports ENABLE ROW LEVEL SECURITY;
--
-- Name: invitation_reports invitation_reports_insert_policy; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY invitation_reports_insert_policy ON public.invitation_reports FOR INSERT WITH CHECK ((reporter_id = (auth.uid())::text));
--
-- Name: invitation_reports invitation_reports_select_policy; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY invitation_reports_select_policy ON public.invitation_reports FOR SELECT USING (((reporter_id = (auth.uid())::text) OR (EXISTS ( SELECT 1
   FROM public.community_members
  WHERE (((community_members.community_id)::text = (invitation_reports.community_id)::text) AND (community_members.user_id = (auth.uid())::text) AND ((community_members.role)::text = ANY ((ARRAY['owner'::character varying, 'admin'::character varying])::text[])))))));
--
-- Name: invite_records; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.invite_records ENABLE ROW LEVEL SECURITY;
--
-- Name: ip_activities; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.ip_activities ENABLE ROW LEVEL SECURITY;
--
-- Name: ip_partnerships; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.ip_partnerships ENABLE ROW LEVEL SECURITY;
--
-- Name: lottery_activities; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.lottery_activities ENABLE ROW LEVEL SECURITY;
--
-- Name: lottery_activities lottery_activities_delete_admin; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY lottery_activities_delete_admin ON public.lottery_activities FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.id = auth.uid()) AND ((u.role)::text = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying])::text[]))))));
--
-- Name: lottery_activities lottery_activities_insert_admin; Type: POLICY; Schema: public; Owner: postgres
