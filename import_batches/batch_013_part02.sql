COPY public.works_likes (user_id, work_id, created_at) FROM stdin;
--
CREATE POLICY lottery_activities_insert_admin ON public.lottery_activities FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.id = auth.uid()) AND ((u.role)::text = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying])::text[]))))));
--
-- Name: lottery_activities lottery_activities_select_all; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY lottery_activities_select_all ON public.lottery_activities FOR SELECT USING (true);
--
-- Name: lottery_activities lottery_activities_update_admin; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY lottery_activities_update_admin ON public.lottery_activities FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.id = auth.uid()) AND ((u.role)::text = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying])::text[]))))));
--
-- Name: lottery_prizes; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.lottery_prizes ENABLE ROW LEVEL SECURITY;
--
-- Name: lottery_prizes lottery_prizes_delete_admin; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY lottery_prizes_delete_admin ON public.lottery_prizes FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.id = auth.uid()) AND ((u.role)::text = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying])::text[]))))));
--
-- Name: lottery_prizes lottery_prizes_insert_admin; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY lottery_prizes_insert_admin ON public.lottery_prizes FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.id = auth.uid()) AND ((u.role)::text = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying])::text[]))))));
--
-- Name: lottery_prizes lottery_prizes_select_all; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY lottery_prizes_select_all ON public.lottery_prizes FOR SELECT USING (true);
--
-- Name: lottery_prizes lottery_prizes_update_admin; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY lottery_prizes_update_admin ON public.lottery_prizes FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.users u
  WHERE ((u.id = auth.uid()) AND ((u.role)::text = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying])::text[]))))));
--
-- Name: lottery_spin_records; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.lottery_spin_records ENABLE ROW LEVEL SECURITY;
--
-- Name: lottery_spin_records lottery_spin_records_all; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY lottery_spin_records_all ON public.lottery_spin_records USING (true) WITH CHECK (true);
--
-- Name: membership_benefits; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.membership_benefits ENABLE ROW LEVEL SECURITY;
--
-- Name: membership_coupon_usage; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.membership_coupon_usage ENABLE ROW LEVEL SECURITY;
--
-- Name: membership_history; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.membership_history ENABLE ROW LEVEL SECURITY;
--
-- Name: membership_orders; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.membership_orders ENABLE ROW LEVEL SECURITY;
--
-- Name: membership_usage_stats; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.membership_usage_stats ENABLE ROW LEVEL SECURITY;
--
-- Name: memberships; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
--
-- Name: messages; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
--
-- Name: moderation_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;
--
-- Name: moderation_rules; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.moderation_rules ENABLE ROW LEVEL SECURITY;
--
-- Name: new_content_boost_pool; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.new_content_boost_pool ENABLE ROW LEVEL SECURITY;
--
-- Name: new_content_boost_pool new_content_boost_pool_public_policy; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY new_content_boost_pool_public_policy ON public.new_content_boost_pool FOR SELECT USING (true);
--
-- Name: order_applications; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.order_applications ENABLE ROW LEVEL SECURITY;
--
-- Name: order_audits; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.order_audits ENABLE ROW LEVEL SECURITY;
--
-- Name: organizer_backups; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.organizer_backups ENABLE ROW LEVEL SECURITY;
--
-- Name: organizer_settings; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.organizer_settings ENABLE ROW LEVEL SECURITY;
--
-- Name: page_views; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
--
-- Name: pending_messages; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.pending_messages ENABLE ROW LEVEL SECURITY;
--
-- Name: points_records; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.points_records ENABLE ROW LEVEL SECURITY;
--
-- Name: points_rules; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.points_rules ENABLE ROW LEVEL SECURITY;
--
-- Name: post_tags; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;
--
-- Name: prize_winners; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.prize_winners ENABLE ROW LEVEL SECURITY;
--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
--
-- Name: promoted_works; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.promoted_works ENABLE ROW LEVEL SECURITY;
--
-- Name: promotion_applications; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.promotion_applications ENABLE ROW LEVEL SECURITY;
--
-- Name: promotion_audit_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.promotion_audit_logs ENABLE ROW LEVEL SECURITY;
--
-- Name: promotion_coupon_usage; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.promotion_coupon_usage ENABLE ROW LEVEL SECURITY;
--
-- Name: promotion_coupons; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.promotion_coupons ENABLE ROW LEVEL SECURITY;
--
-- Name: promotion_notifications; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.promotion_notifications ENABLE ROW LEVEL SECURITY;
--
-- Name: promotion_orders; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.promotion_orders ENABLE ROW LEVEL SECURITY;
--
-- Name: promotion_user_stats; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.promotion_user_stats ENABLE ROW LEVEL SECURITY;
--
-- Name: promotion_wallet_transactions; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.promotion_wallet_transactions ENABLE ROW LEVEL SECURITY;
--
-- Name: promotion_wallets; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.promotion_wallets ENABLE ROW LEVEL SECURITY;
--
-- Name: realtime_recommendation_cache; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.realtime_recommendation_cache ENABLE ROW LEVEL SECURITY;
--
-- Name: recommendation_configs; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.recommendation_configs ENABLE ROW LEVEL SECURITY;
--
-- Name: recommendation_history; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.recommendation_history ENABLE ROW LEVEL SECURITY;
--
-- Name: replies; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.replies ENABLE ROW LEVEL SECURITY;
--
-- Name: reports; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
--
-- Name: revenue_records; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.revenue_records ENABLE ROW LEVEL SECURITY;
--
-- Name: score_audit_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.score_audit_logs ENABLE ROW LEVEL SECURITY;
--
-- Name: search_behavior_tracking; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.search_behavior_tracking ENABLE ROW LEVEL SECURITY;
--
-- Name: search_suggestions; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.search_suggestions ENABLE ROW LEVEL SECURITY;
--
-- Name: small_traffic_exposures; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.small_traffic_exposures ENABLE ROW LEVEL SECURITY;
--
-- Name: small_traffic_exposures small_traffic_exposures_service_policy; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY small_traffic_exposures_service_policy ON public.small_traffic_exposures USING (true);
--
-- Name: small_traffic_tests; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.small_traffic_tests ENABLE ROW LEVEL SECURITY;
--
-- Name: small_traffic_tests small_traffic_tests_service_policy; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY small_traffic_tests_service_policy ON public.small_traffic_tests USING (true);
--
-- Name: submission_comments; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.submission_comments ENABLE ROW LEVEL SECURITY;
--
-- Name: submission_likes; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.submission_likes ENABLE ROW LEVEL SECURITY;
--
-- Name: submission_ratings; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.submission_ratings ENABLE ROW LEVEL SECURITY;
--
-- Name: submission_scores; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.submission_scores ENABLE ROW LEVEL SECURITY;
--
-- Name: submission_votes; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.submission_votes ENABLE ROW LEVEL SECURITY;
--
-- Name: task_records; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.task_records ENABLE ROW LEVEL SECURITY;
--
-- Name: template_favorites; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.template_favorites ENABLE ROW LEVEL SECURITY;
--
-- Name: template_likes; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.template_likes ENABLE ROW LEVEL SECURITY;
--
-- Name: traffic_sources; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.traffic_sources ENABLE ROW LEVEL SECURITY;
--
-- Name: user_achievements; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
--
-- Name: user_activities; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;
--
-- Name: user_behavior_daily_stats; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.user_behavior_daily_stats ENABLE ROW LEVEL SECURITY;
--
-- Name: user_behavior_events; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.user_behavior_events ENABLE ROW LEVEL SECURITY;
--
-- Name: user_behavior_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.user_behavior_logs ENABLE ROW LEVEL SECURITY;
--
-- Name: user_behaviors; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.user_behaviors ENABLE ROW LEVEL SECURITY;
--
-- Name: user_brand_history; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.user_brand_history ENABLE ROW LEVEL SECURITY;
--
-- Name: user_creative_profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.user_creative_profiles ENABLE ROW LEVEL SECURITY;
--
-- Name: user_demographics; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.user_demographics ENABLE ROW LEVEL SECURITY;
--
-- Name: user_demographics user_demographics_owner_policy; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY user_demographics_owner_policy ON public.user_demographics USING ((auth.uid() = user_id));
--
-- Name: user_devices; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;
--
-- Name: user_exploration_state; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.user_exploration_state ENABLE ROW LEVEL SECURITY;
--
-- Name: user_exploration_state user_exploration_state_owner_policy; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY user_exploration_state_owner_policy ON public.user_exploration_state FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: user_favorites; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
--
-- Name: user_mockup_configs; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.user_mockup_configs ENABLE ROW LEVEL SECURITY;
--
-- Name: user_notifications; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
--
-- Name: user_patterns; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.user_patterns ENABLE ROW LEVEL SECURITY;
--
-- Name: user_points_balance; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.user_points_balance ENABLE ROW LEVEL SECURITY;
--
-- Name: user_profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
--
-- Name: user_realtime_features; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.user_realtime_features ENABLE ROW LEVEL SECURITY;
--
-- Name: user_search_history; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.user_search_history ENABLE ROW LEVEL SECURITY;
--
-- Name: user_search_preferences; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.user_search_preferences ENABLE ROW LEVEL SECURITY;
--
-- Name: user_similarities; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.user_similarities ENABLE ROW LEVEL SECURITY;
--
-- Name: user_style_presets; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.user_style_presets ENABLE ROW LEVEL SECURITY;
--
-- Name: user_sync_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.user_sync_logs ENABLE ROW LEVEL SECURITY;
--
-- Name: user_tile_configs; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.user_tile_configs ENABLE ROW LEVEL SECURITY;
--
-- Name: user_uploads; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.user_uploads ENABLE ROW LEVEL SECURITY;
--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
--
-- Name: withdrawal_records; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.withdrawal_records ENABLE ROW LEVEL SECURITY;
--
-- Name: work_comment_likes; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.work_comment_likes ENABLE ROW LEVEL SECURITY;
--
-- Name: work_comments; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.work_comments ENABLE ROW LEVEL SECURITY;
--
-- Name: work_performance_stats; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.work_performance_stats ENABLE ROW LEVEL SECURITY;
--
-- Name: work_shares; Type: ROW SECURITY; Schema: public; Owner: postgres
--
ALTER TABLE public.work_shares ENABLE ROW LEVEL SECURITY;
--
-- Name: brand_partnerships 任何人可以创建品牌合作申请; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "任何人可以创建品牌合作申请" ON public.brand_partnerships FOR INSERT WITH CHECK (true);
--
-- Name: brand_events 任何人可以查看已发布的品牌活动; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "任何人可以查看已发布的品牌活动" ON public.brand_events FOR SELECT USING (((status = 'published'::text) OR (organizer_id = auth.uid())));
--
-- Name: achievement_configs 任何人可以读取成就配置; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "任何人可以读取成就配置" ON public.achievement_configs FOR SELECT USING ((is_active = true));
--
-- Name: creator_level_configs 任何人可以读取等级配置; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "任何人可以读取等级配置" ON public.creator_level_configs FOR SELECT USING ((is_active = true));
--
-- Name: brand_partnerships 允许任何人提交品牌合作申请; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "允许任何人提交品牌合作申请" ON public.brand_partnerships FOR INSERT WITH CHECK (true);
--
-- Name: brand_partnerships 允许任何人查看品牌合作申请; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "允许任何人查看品牌合作申请" ON public.brand_partnerships FOR SELECT USING (true);
--
-- Name: order_applications 允许品牌方审核申请; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "允许品牌方审核申请" ON public.order_applications FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.order_audits
  WHERE ((order_audits.id = order_applications.order_id) AND (order_audits.user_id = auth.uid())))));
--
-- Name: order_applications 允许品牌方查看商单申请; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "允许品牌方查看商单申请" ON public.order_applications FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.order_audits
  WHERE ((order_audits.id = order_applications.order_id) AND (order_audits.user_id = auth.uid())))));
--
-- Name: promotion_orders 允许所有操作; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "允许所有操作" ON public.promotion_orders USING (true) WITH CHECK (true);
--
-- Name: event_prizes 允许查看活动奖品; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "允许查看活动奖品" ON public.event_prizes FOR SELECT USING (true);
--
-- Name: order_applications 允许用户创建申请; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "允许用户创建申请" ON public.order_applications FOR INSERT WITH CHECK (((auth.uid())::text = (creator_id)::text));
--
-- Name: order_applications 允许用户删除自己的申请; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "允许用户删除自己的申请" ON public.order_applications FOR DELETE USING (((auth.uid())::text = (creator_id)::text));
--
-- Name: prize_winners 允许用户更新自己的领奖状态; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "允许用户更新自己的领奖状态" ON public.prize_winners FOR UPDATE USING (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.events e
  WHERE ((e.id = prize_winners.event_id) AND (e.organizer_id = auth.uid()))))));
--
-- Name: order_applications 允许用户查看自己的申请; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "允许用户查看自己的申请" ON public.order_applications FOR SELECT USING (((auth.uid())::text = (creator_id)::text));
--
-- Name: prize_winners 允许用户查看自己的获奖记录; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "允许用户查看自己的获奖记录" ON public.prize_winners FOR SELECT USING (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.events e
  WHERE ((e.id = prize_winners.event_id) AND (e.organizer_id = auth.uid()))))));
--
-- Name: brand_partnerships 允许管理员更新品牌合作申请; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "允许管理员更新品牌合作申请" ON public.brand_partnerships FOR UPDATE USING (true);
--
-- Name: admin_operation_logs 允许管理员查看操作日志; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "允许管理员查看操作日志" ON public.admin_operation_logs FOR SELECT USING (public.is_active_admin(auth.uid()));
--
-- Name: admin_accounts 允许管理员查看管理员账号; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "允许管理员查看管理员账号" ON public.admin_accounts FOR SELECT USING (public.is_active_admin(auth.uid()));
--
-- Name: admin_roles 允许管理员查看角色; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "允许管理员查看角色" ON public.admin_roles FOR SELECT USING (public.is_active_admin(auth.uid()));
--
-- Name: event_prizes 允许组织者创建奖品; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "允许组织者创建奖品" ON public.event_prizes FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.events e
  WHERE ((e.id = event_prizes.event_id) AND (e.organizer_id = auth.uid())))));
--
-- Name: prize_winners 允许组织者创建获奖记录; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "允许组织者创建获奖记录" ON public.prize_winners FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.events e
  WHERE ((e.id = prize_winners.event_id) AND (e.organizer_id = auth.uid())))));
--
-- Name: event_prizes 允许组织者删除奖品; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "允许组织者删除奖品" ON public.event_prizes FOR DELETE USING ((EXISTS ( SELECT 1
   FROM public.events e
  WHERE ((e.id = event_prizes.event_id) AND (e.organizer_id = auth.uid())))));
--
-- Name: event_prizes 允许组织者更新奖品; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "允许组织者更新奖品" ON public.event_prizes FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.events e
  WHERE ((e.id = event_prizes.event_id) AND (e.organizer_id = auth.uid())))));
--
-- Name: admin_accounts 允许超级管理员管理管理员账号; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "允许超级管理员管理管理员账号" ON public.admin_accounts USING (public.is_super_admin(auth.uid(), 'admin:manage'::text));
--
-- Name: admin_roles 允许超级管理员管理角色; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "允许超级管理员管理角色" ON public.admin_roles USING (public.is_super_admin(auth.uid(), 'role:manage'::text));
--
-- Name: brand_task_submissions 创作者提交作品; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "创作者提交作品" ON public.brand_task_submissions FOR INSERT WITH CHECK ((creator_id = auth.uid()));
--
-- Name: brand_task_participants 创作者更新自己的参与; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "创作者更新自己的参与" ON public.brand_task_participants FOR UPDATE USING ((creator_id = auth.uid()));
--
-- Name: brand_task_submissions 创作者更新自己的提交; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "创作者更新自己的提交" ON public.brand_task_submissions FOR UPDATE USING ((creator_id = auth.uid()));
--
-- Name: brand_task_participants 创作者申请参与; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "创作者申请参与" ON public.brand_task_participants FOR INSERT WITH CHECK ((creator_id = auth.uid()));
--
-- Name: brand_transactions 创建自己的交易记录; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "创建自己的交易记录" ON public.brand_transactions FOR INSERT WITH CHECK ((user_id = auth.uid()));
--
-- Name: brand_accounts 创建自己的品牌账户; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "创建自己的品牌账户" ON public.brand_accounts FOR INSERT WITH CHECK ((user_id = auth.uid()));
--
-- Name: brand_tasks 发布者创建任务; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "发布者创建任务" ON public.brand_tasks FOR INSERT WITH CHECK ((publisher_id = auth.uid()));
--
-- Name: brand_tasks 发布者删除自己的任务; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "发布者删除自己的任务" ON public.brand_tasks FOR DELETE USING ((publisher_id = auth.uid()));
--
-- Name: brand_tasks 发布者更新自己的任务; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "发布者更新自己的任务" ON public.brand_tasks FOR UPDATE USING ((publisher_id = auth.uid()));
--
-- Name: brand_tasks 发布者查看自己的任务; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "发布者查看自己的任务" ON public.brand_tasks FOR SELECT USING ((publisher_id = auth.uid()));
--
-- Name: achievement_configs 只有管理员可以修改成就配置; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "只有管理员可以修改成就配置" ON public.achievement_configs USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying])::text[])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying])::text[]))))));
--
-- Name: creator_level_configs 只有管理员可以修改等级配置; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "只有管理员可以修改等级配置" ON public.creator_level_configs USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying])::text[])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND ((users.role)::text = ANY ((ARRAY['admin'::character varying, 'super_admin'::character varying])::text[]))))));
--
-- Name: brand_events 品牌方可以创建活动; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "品牌方可以创建活动" ON public.brand_events FOR INSERT WITH CHECK (true);
--
-- Name: brand_events 品牌方可以更新自己的活动; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "品牌方可以更新自己的活动" ON public.brand_events FOR UPDATE USING ((organizer_id = auth.uid()));
--
-- Name: brand_transactions 更新自己的交易记录; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "更新自己的交易记录" ON public.brand_transactions FOR UPDATE USING ((user_id = auth.uid()));
--
-- Name: brand_accounts 更新自己的品牌账户; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "更新自己的品牌账户" ON public.brand_accounts FOR UPDATE USING ((user_id = auth.uid()));
--
-- Name: brand_task_participants 查看任务参与者; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "查看任务参与者" ON public.brand_task_participants FOR SELECT USING (((creator_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.brand_tasks
  WHERE ((brand_tasks.id = brand_task_participants.task_id) AND (brand_tasks.publisher_id = auth.uid()))))));
--
-- Name: brand_task_submissions 查看任务提交; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "查看任务提交" ON public.brand_task_submissions FOR SELECT USING (((creator_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.brand_tasks
  WHERE ((brand_tasks.id = brand_task_submissions.task_id) AND (brand_tasks.publisher_id = auth.uid()))))));
--
-- Name: brand_task_analytics 查看任务统计; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "查看任务统计" ON public.brand_task_analytics FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.brand_tasks
  WHERE ((brand_tasks.id = brand_task_analytics.task_id) AND (brand_tasks.publisher_id = auth.uid())))));
--
-- Name: brand_tasks 查看已发布品牌任务; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "查看已发布品牌任务" ON public.brand_tasks FOR SELECT USING ((status = 'published'::text));
--
-- Name: business_tasks 查看开放商单任务; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "查看开放商单任务" ON public.business_tasks FOR SELECT USING ((status = 'open'::text));
--
-- Name: brand_transactions 查看自己的交易记录; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "查看自己的交易记录" ON public.brand_transactions FOR SELECT USING ((user_id = auth.uid()));
--
-- Name: brand_accounts 查看自己的品牌账户; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "查看自己的品牌账户" ON public.brand_accounts FOR SELECT USING ((user_id = auth.uid()));
--
-- Name: creator_earnings 查看自己的收益; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "查看自己的收益" ON public.creator_earnings FOR SELECT USING ((creator_id = auth.uid()));
--
-- Name: promotion_applications 用户创建推广申请; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "用户创建推广申请" ON public.promotion_applications FOR INSERT WITH CHECK ((user_id = auth.uid()));
--
-- Name: withdrawal_records 用户创建提现申请; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "用户创建提现申请" ON public.withdrawal_records FOR INSERT WITH CHECK ((user_id = auth.uid()));
--
-- Name: pending_messages 用户只能删除自己的待发送消息; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "用户只能删除自己的待发送消息" ON public.pending_messages FOR DELETE USING ((user_id = auth.uid()));
--
-- Name: pending_messages 用户只能插入自己的待发送消息; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "用户只能插入自己的待发送消息" ON public.pending_messages FOR INSERT WITH CHECK ((user_id = auth.uid()));
--
-- Name: pending_messages 用户只能更新自己的待发送消息; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "用户只能更新自己的待发送消息" ON public.pending_messages FOR UPDATE USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));
--
-- Name: pending_messages 用户只能查看自己的待发送消息; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "用户只能查看自己的待发送消息" ON public.pending_messages FOR SELECT USING ((user_id = auth.uid()));
--
-- Name: user_feedbacks 用户提交反馈; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "用户提交反馈" ON public.user_feedbacks FOR INSERT WITH CHECK ((((auth.uid() IS NOT NULL) AND (user_id = auth.uid())) OR ((auth.uid() IS NULL) AND (user_id IS NULL))));
--
-- Name: promotion_applications 用户更新自己的推广申请; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "用户更新自己的推广申请" ON public.promotion_applications FOR UPDATE USING (((user_id = auth.uid()) AND (status = 'pending'::text)));
--
-- Name: user_notifications 用户更新自己的通知; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "用户更新自己的通知" ON public.user_notifications FOR UPDATE USING ((auth.uid() = user_id));
--
-- Name: promotion_notifications 用户更新自己的通知状态; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "用户更新自己的通知状态" ON public.promotion_notifications FOR UPDATE USING ((user_id = auth.uid()));
--
-- Name: promotion_coupons 用户查看有效优惠券; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "用户查看有效优惠券" ON public.promotion_coupons FOR SELECT USING ((is_active = true));
--
-- Name: promotion_wallet_transactions 用户查看自己的交易记录; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "用户查看自己的交易记录" ON public.promotion_wallet_transactions FOR SELECT USING ((user_id = auth.uid()));
--
-- Name: creator_task_applications 用户查看自己的任务申请; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "用户查看自己的任务申请" ON public.creator_task_applications FOR SELECT USING ((creator_id = auth.uid()));
--
-- Name: promotion_coupon_usage 用户查看自己的优惠券使用记录; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "用户查看自己的优惠券使用记录" ON public.promotion_coupon_usage FOR SELECT USING ((user_id = auth.uid()));
--
-- Name: user_feedbacks 用户查看自己的反馈; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "用户查看自己的反馈" ON public.user_feedbacks FOR SELECT USING (((auth.uid() = user_id) OR (EXISTS ( SELECT 1
   FROM public.admin_accounts
  WHERE ((admin_accounts.user_id = auth.uid()) AND ((admin_accounts.status)::text = 'active'::text))))));
--
-- Name: promotion_audit_logs 用户查看自己的审核记录; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "用户查看自己的审核记录" ON public.promotion_audit_logs FOR SELECT USING ((user_id = auth.uid()));
--
-- Name: promotion_applications 用户查看自己的推广申请; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "用户查看自己的推广申请" ON public.promotion_applications FOR SELECT USING ((user_id = auth.uid()));
--
-- Name: promotion_user_stats 用户查看自己的推广统计; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "用户查看自己的推广统计" ON public.promotion_user_stats FOR SELECT USING ((user_id = auth.uid()));
--
-- Name: promotion_notifications 用户查看自己的推广通知; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "用户查看自己的推广通知" ON public.promotion_notifications FOR SELECT USING ((user_id = auth.uid()));
--
-- Name: promotion_wallets 用户查看自己的推广金账户; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "用户查看自己的推广金账户" ON public.promotion_wallets FOR SELECT USING ((user_id = auth.uid()));
--
-- Name: withdrawal_records 用户查看自己的提现记录; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "用户查看自己的提现记录" ON public.withdrawal_records FOR SELECT USING ((user_id = auth.uid()));
--
-- Name: creator_revenue 用户查看自己的收入; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "用户查看自己的收入" ON public.creator_revenue FOR SELECT USING ((user_id = auth.uid()));
--
-- Name: revenue_records 用户查看自己的收入明细; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "用户查看自己的收入明细" ON public.revenue_records FOR SELECT USING ((user_id = auth.uid()));
--
-- Name: user_notifications 用户查看自己的通知; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "用户查看自己的通知" ON public.user_notifications FOR SELECT USING ((auth.uid() = user_id));
--
-- Name: creator_task_applications 用户申请任务; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "用户申请任务" ON public.creator_task_applications FOR INSERT WITH CHECK ((creator_id = auth.uid()));
--
-- Name: brand_partnerships 申请人可以查看自己的申请; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "申请人可以查看自己的申请" ON public.brand_partnerships FOR SELECT USING (((applicant_id = auth.uid()) OR (status = 'approved'::text)));
--
-- Name: brand_partnerships 管理员可以更新品牌合作申请; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "管理员可以更新品牌合作申请" ON public.brand_partnerships FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND (users.is_admin = true)))));
--
-- Name: brand_events 管理员可以更新所有品牌活动; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "管理员可以更新所有品牌活动" ON public.brand_events FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND (users.is_admin = true)))));
--
-- Name: brand_partnerships 管理员可以查看所有品牌合作申请; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "管理员可以查看所有品牌合作申请" ON public.brand_partnerships FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND (users.is_admin = true)))));
--
-- Name: brand_events 管理员可以查看所有品牌活动; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "管理员可以查看所有品牌活动" ON public.brand_events FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.users
  WHERE ((users.id = auth.uid()) AND (users.is_admin = true)))));
--
-- Name: feedback_process_logs 管理员查看处理日志; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "管理员查看处理日志" ON public.feedback_process_logs FOR SELECT USING (public.is_active_admin(auth.uid()));
--
-- Name: user_feedbacks 管理员管理反馈; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "管理员管理反馈" ON public.user_feedbacks USING (public.has_feedback_manage_permission(auth.uid()));
--
-- Name: user_notifications 系统插入通知; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "系统插入通知" ON public.user_notifications FOR INSERT WITH CHECK (true);
--
-- Name: promoted_works 系统管理推广作品; Type: POLICY; Schema: public; Owner: postgres
--
CREATE POLICY "系统管理推广作品" ON public.promoted_works USING (true) WITH CHECK (true);
--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: supabase_realtime_admin
--
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;
--
-- Name: objects Allow all reads from works; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "Allow all reads from works" ON storage.objects FOR SELECT USING ((bucket_id = 'works'::text));
--
-- Name: objects Allow all uploads to works; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "Allow all uploads to works" ON storage.objects FOR INSERT WITH CHECK ((bucket_id = 'works'::text));
--
-- Name: objects Allow authenticated delete on 1oj01fe_0; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "Allow authenticated delete on 1oj01fe_0" ON storage.objects FOR DELETE TO authenticated USING ((bucket_id = 'avatars'::text));
--
-- Name: objects Allow authenticated delete on 1oj01fe_1; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "Allow authenticated delete on 1oj01fe_1" ON storage.objects FOR SELECT TO authenticated USING ((bucket_id = 'avatars'::text));
--
-- Name: objects Allow authenticated delete on ai-generations; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "Allow authenticated delete on ai-generations" ON storage.objects FOR DELETE TO authenticated USING ((bucket_id = 'ai-generations'::text));
--
-- Name: objects Allow authenticated delete on brandlogos; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "Allow authenticated delete on brandlogos" ON storage.objects FOR DELETE TO authenticated USING ((bucket_id = 'brandlogos'::text));
--
-- Name: objects Allow authenticated delete on business-licenses; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "Allow authenticated delete on business-licenses" ON storage.objects FOR DELETE TO authenticated USING ((bucket_id = 'business-licenses'::text));
--
-- Name: objects Allow authenticated delete on works 1vgtc2_0; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "Allow authenticated delete on works 1vgtc2_0" ON storage.objects FOR DELETE USING (((bucket_id = 'works'::text) AND (auth.role() = 'authenticated'::text)));
--
-- Name: objects Allow authenticated delete own files; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "Allow authenticated delete own files" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'payments'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));
--
-- Name: objects Allow authenticated update on ai-generations; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "Allow authenticated update on ai-generations" ON storage.objects FOR UPDATE TO authenticated USING ((bucket_id = 'ai-generations'::text)) WITH CHECK ((bucket_id = 'ai-generations'::text));
--
-- Name: objects Allow authenticated update on brandlogos; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "Allow authenticated update on brandlogos" ON storage.objects FOR UPDATE TO authenticated USING ((bucket_id = 'brandlogos'::text)) WITH CHECK ((bucket_id = 'brandlogos'::text));
--
-- Name: objects Allow authenticated update on business-licenses; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "Allow authenticated update on business-licenses" ON storage.objects FOR UPDATE TO authenticated USING ((bucket_id = 'business-licenses'::text)) WITH CHECK ((bucket_id = 'business-licenses'::text));
--
-- Name: objects Allow authenticated upload to ai-generations; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "Allow authenticated upload to ai-generations" ON storage.objects FOR INSERT TO authenticated WITH CHECK ((bucket_id = 'ai-generations'::text));
--
-- Name: objects Allow authenticated upload to avatars 1oj01fe_0; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "Allow authenticated upload to avatars 1oj01fe_0" ON storage.objects FOR INSERT TO authenticated WITH CHECK ((bucket_id = 'avatars'::text));
--
-- Name: objects Allow authenticated upload to brandlogos; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "Allow authenticated upload to brandlogos" ON storage.objects FOR INSERT TO authenticated WITH CHECK ((bucket_id = 'brandlogos'::text));
--
-- Name: objects Allow authenticated upload to business-licenses; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "Allow authenticated upload to business-licenses" ON storage.objects FOR INSERT TO authenticated WITH CHECK ((bucket_id = 'business-licenses'::text));
--
-- Name: objects Allow authenticated upload to images; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "Allow authenticated upload to images" ON storage.objects FOR INSERT TO authenticated WITH CHECK ((bucket_id = 'images'::text));
--
-- Name: objects Allow authenticated upload to works; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "Allow authenticated upload to works" ON storage.objects FOR INSERT TO authenticated WITH CHECK ((bucket_id = 'works'::text));
--
-- Name: objects Allow authenticated uploads; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "Allow authenticated uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK ((bucket_id = 'payments'::text));
--
-- Name: objects Allow authenticated users to delete cultural-assets; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "Allow authenticated users to delete cultural-assets" ON storage.objects FOR DELETE TO authenticated USING ((bucket_id = 'cultural-assets'::text));
--
-- Name: objects Allow authenticated users to update cultural-assets; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "Allow authenticated users to update cultural-assets" ON storage.objects FOR UPDATE TO authenticated USING ((bucket_id = 'cultural-assets'::text));
--
-- Name: objects Allow authenticated users to upload comment-images; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "Allow authenticated users to upload comment-images" ON storage.objects FOR INSERT TO authenticated WITH CHECK ((bucket_id = 'comment-images'::text));
--
-- Name: objects Allow authenticated users to upload cultural-assets; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "Allow authenticated users to upload cultural-assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK ((bucket_id = 'cultural-assets'::text));
--
-- Name: objects Allow authenticated users to upload videos; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "Allow authenticated users to upload videos" ON storage.objects FOR INSERT TO authenticated WITH CHECK ((bucket_id = 'works'::text));
--
-- Name: objects Allow public access mxcidd_0; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "Allow public access mxcidd_0" ON storage.objects FOR SELECT USING ((bucket_id = 'brandlogos'::text));
--
-- Name: objects Allow public read; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "Allow public read" ON storage.objects FOR SELECT TO anon USING ((bucket_id = 'payments'::text));
--
-- Name: objects Allow public read access on comment-images; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "Allow public read access on comment-images" ON storage.objects FOR SELECT USING ((bucket_id = 'comment-images'::text));
--
-- Name: objects Allow public read access on cultural-assets bucket; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "Allow public read access on cultural-assets bucket" ON storage.objects FOR SELECT USING ((bucket_id = 'cultural-assets'::text));
--
-- Name: objects Allow public read from ai-generations; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "Allow public read from ai-generations" ON storage.objects FOR SELECT USING ((bucket_id = 'ai-generations'::text));
--
-- Name: objects Allow public read from brandlogos; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "Allow public read from brandlogos" ON storage.objects FOR SELECT USING ((bucket_id = 'brandlogos'::text));
--
-- Name: objects Allow public read from business-licenses; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "Allow public read from business-licenses" ON storage.objects FOR SELECT USING ((bucket_id = 'business-licenses'::text));
--
-- Name: objects Allow public read from images; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "Allow public read from images" ON storage.objects FOR SELECT USING ((bucket_id = 'images'::text));
--
-- Name: objects Allow public read from works; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "Allow public read from works" ON storage.objects FOR SELECT USING ((bucket_id = 'works'::text));
--
-- Name: objects Allow public read on avatars 1oj01fe_0; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "Allow public read on avatars 1oj01fe_0" ON storage.objects FOR SELECT USING ((bucket_id = 'avatars'::text));
--
-- Name: objects Allow public read on works 1vgtc2_0; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "Allow public read on works 1vgtc2_0" ON storage.objects FOR SELECT USING ((bucket_id = 'works'::text));
--
-- Name: objects Allow uploads; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "Allow uploads" ON storage.objects FOR INSERT WITH CHECK ((bucket_id = 'community-images'::text));
--
-- Name: objects Allow users to delete their own comment-images; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "Allow users to delete their own comment-images" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'comment-images'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));
--
-- Name: objects Authenticated users can upload images; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "Authenticated users can upload images" ON storage.objects FOR INSERT WITH CHECK (((bucket_id = 'community-images'::text) AND (auth.role() = 'authenticated'::text)));
--
-- Name: objects Public Access; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ((bucket_id = 'community-images'::text));
--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--
ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;
--
-- Name: buckets_vectors; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--
ALTER TABLE storage.buckets_vectors ENABLE ROW LEVEL SECURITY;
--
-- Name: objects event_submissions_delete 1gip910_0; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "event_submissions_delete 1gip910_0" ON storage.objects FOR DELETE USING ((bucket_id = 'event-submissions'::text));
--
-- Name: objects event_submissions_delete 1gip910_1; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "event_submissions_delete 1gip910_1" ON storage.objects FOR SELECT USING ((bucket_id = 'event-submissions'::text));
--
-- Name: objects event_submissions_insert 1gip910_0; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "event_submissions_insert 1gip910_0" ON storage.objects FOR INSERT WITH CHECK ((bucket_id = 'event-submissions'::text));
--
-- Name: objects event_submissions_select 1gip910_0; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "event_submissions_select 1gip910_0" ON storage.objects FOR SELECT USING ((bucket_id = 'event-submissions'::text));
--
-- Name: objects event_submissions_updat 1gip910_0; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "event_submissions_updat 1gip910_0" ON storage.objects FOR UPDATE USING ((bucket_id = 'event-submissions'::text));
--
-- Name: objects event_submissions_updat 1gip910_1; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "event_submissions_updat 1gip910_1" ON storage.objects FOR SELECT USING ((bucket_id = 'event-submissions'::text));
--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--
ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;
--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
--
-- Name: objects public delete mxcidd_0; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "public delete mxcidd_0" ON storage.objects FOR DELETE USING ((bucket_id = 'brandlogos'::text));
--
-- Name: objects public delete mxcidd_1; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "public delete mxcidd_1" ON storage.objects FOR SELECT USING ((bucket_id = 'brandlogos'::text));
--
-- Name: objects public update mxcidd_0; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "public update mxcidd_0" ON storage.objects FOR UPDATE USING ((bucket_id = 'brandlogos'::text));
--
-- Name: objects public update mxcidd_1; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "public update mxcidd_1" ON storage.objects FOR SELECT USING ((bucket_id = 'brandlogos'::text));
--
-- Name: objects public upload mxcidd_0; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "public upload mxcidd_0" ON storage.objects FOR INSERT WITH CHECK ((bucket_id = 'brandlogos'::text));
--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--
ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;
--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--
ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;
--
-- Name: vector_indexes; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--
ALTER TABLE storage.vector_indexes ENABLE ROW LEVEL SECURITY;
--
-- Name: objects 允许上传; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "允许上传" ON storage.objects FOR INSERT WITH CHECK ((bucket_id = 'community-images'::text));
--
-- Name: objects 允许上传 1sthiho_0; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "允许上传 1sthiho_0" ON storage.objects FOR INSERT TO authenticated WITH CHECK ((bucket_id = 'community-images'::text));
--
-- Name: objects 允许公开访问品牌Logo; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "允许公开访问品牌Logo" ON storage.objects FOR SELECT USING ((bucket_id = 'brand-logos'::text));
--
-- Name: objects 允许认证用户上传品牌Logo; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "允许认证用户上传品牌Logo" ON storage.objects FOR INSERT TO authenticated WITH CHECK ((bucket_id = 'brand-logos'::text));
--
-- Name: objects 允许认证用户删除自己的品牌Logo; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "允许认证用户删除自己的品牌Logo" ON storage.objects FOR DELETE TO authenticated USING (((bucket_id = 'brand-logos'::text) AND (owner = auth.uid())));
--
-- Name: objects 允许认证用户更新自己的品牌Logo; Type: POLICY; Schema: storage; Owner: supabase_storage_admin
--
CREATE POLICY "允许认证用户更新自己的品牌Logo" ON storage.objects FOR UPDATE TO authenticated USING (((bucket_id = 'brand-logos'::text) AND (owner = auth.uid())));
--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: postgres
--
CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');
ALTER PUBLICATION supabase_realtime OWNER TO postgres;
--
-- Name: supabase_realtime_messages_publication; Type: PUBLICATION; Schema: -; Owner: supabase_admin
--
CREATE PUBLICATION supabase_realtime_messages_publication WITH (publish = 'insert, update, delete, truncate');
ALTER PUBLICATION supabase_realtime_messages_publication OWNER TO supabase_admin;
--
-- Name: supabase_realtime feed_collects; Type: PUBLICATION TABLE; Schema: public; Owner: postgres
--
ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.feed_collects;
--
-- Name: supabase_realtime feed_comment_likes; Type: PUBLICATION TABLE; Schema: public; Owner: postgres
--
ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.feed_comment_likes;
--
-- Name: supabase_realtime feed_comments; Type: PUBLICATION TABLE; Schema: public; Owner: postgres
--
ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.feed_comments;
--
-- Name: supabase_realtime feed_likes; Type: PUBLICATION TABLE; Schema: public; Owner: postgres
--
ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.feed_likes;
--
-- Name: supabase_realtime feeds; Type: PUBLICATION TABLE; Schema: public; Owner: postgres
--
ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.feeds;
--
-- Name: supabase_realtime points_records; Type: PUBLICATION TABLE; Schema: public; Owner: postgres
--
ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.points_records;
--
-- Name: supabase_realtime work_comment_likes; Type: PUBLICATION TABLE; Schema: public; Owner: postgres
--
ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.work_comment_likes;
--
-- Name: supabase_realtime work_comments; Type: PUBLICATION TABLE; Schema: public; Owner: postgres
--
ALTER PUBLICATION supabase_realtime ADD TABLE ONLY public.work_comments;
--
-- Name: supabase_realtime_messages_publication messages; Type: PUBLICATION TABLE; Schema: realtime; Owner: supabase_admin
--
ALTER PUBLICATION supabase_realtime_messages_publication ADD TABLE ONLY realtime.messages;
--
-- Name: SCHEMA auth; Type: ACL; Schema: -; Owner: supabase_admin
--
GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON SCHEMA auth TO dashboard_user;
GRANT USAGE ON SCHEMA auth TO postgres;
--
-- Name: SCHEMA extensions; Type: ACL; Schema: -; Owner: postgres
--
GRANT USAGE ON SCHEMA extensions TO anon;
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;
GRANT ALL ON SCHEMA extensions TO dashboard_user;
--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--
GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;
--
-- Name: SCHEMA realtime; Type: ACL; Schema: -; Owner: supabase_admin
--
GRANT USAGE ON SCHEMA realtime TO postgres;
GRANT USAGE ON SCHEMA realtime TO anon;
GRANT USAGE ON SCHEMA realtime TO authenticated;
GRANT USAGE ON SCHEMA realtime TO service_role;
GRANT ALL ON SCHEMA realtime TO supabase_realtime_admin;
--
-- Name: SCHEMA storage; Type: ACL; Schema: -; Owner: supabase_admin
--
GRANT USAGE ON SCHEMA storage TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA storage TO anon;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO service_role;
GRANT ALL ON SCHEMA storage TO supabase_storage_admin WITH GRANT OPTION;
GRANT ALL ON SCHEMA storage TO dashboard_user;
--
-- Name: SCHEMA vault; Type: ACL; Schema: -; Owner: supabase_admin
--
GRANT USAGE ON SCHEMA vault TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA vault TO service_role;
--
-- Name: FUNCTION halfvec_in(cstring, oid, integer); Type: ACL; Schema: public; Owner: supabase_admin
--
GRANT ALL ON FUNCTION public.halfvec_in(cstring, oid, integer) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_in(cstring, oid, integer) TO anon;
GRANT ALL ON FUNCTION public.halfvec_in(cstring, oid, integer) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_in(cstring, oid, integer) TO service_role;
--
-- Name: FUNCTION halfvec_out(public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--
GRANT ALL ON FUNCTION public.halfvec_out(public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_out(public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_out(public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_out(public.halfvec) TO service_role;
--
-- Name: FUNCTION halfvec_recv(internal, oid, integer); Type: ACL; Schema: public; Owner: supabase_admin
--
GRANT ALL ON FUNCTION public.halfvec_recv(internal, oid, integer) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_recv(internal, oid, integer) TO anon;
GRANT ALL ON FUNCTION public.halfvec_recv(internal, oid, integer) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_recv(internal, oid, integer) TO service_role;
--
-- Name: FUNCTION halfvec_send(public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--
GRANT ALL ON FUNCTION public.halfvec_send(public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_send(public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_send(public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_send(public.halfvec) TO service_role;
--
-- Name: FUNCTION halfvec_typmod_in(cstring[]); Type: ACL; Schema: public; Owner: supabase_admin
--
GRANT ALL ON FUNCTION public.halfvec_typmod_in(cstring[]) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_typmod_in(cstring[]) TO anon;
GRANT ALL ON FUNCTION public.halfvec_typmod_in(cstring[]) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_typmod_in(cstring[]) TO service_role;
--
-- Name: FUNCTION sparsevec_in(cstring, oid, integer); Type: ACL; Schema: public; Owner: supabase_admin
--
GRANT ALL ON FUNCTION public.sparsevec_in(cstring, oid, integer) TO postgres;
GRANT ALL ON FUNCTION public.sparsevec_in(cstring, oid, integer) TO anon;
GRANT ALL ON FUNCTION public.sparsevec_in(cstring, oid, integer) TO authenticated;
GRANT ALL ON FUNCTION public.sparsevec_in(cstring, oid, integer) TO service_role;
--
-- Name: FUNCTION sparsevec_out(public.sparsevec); Type: ACL; Schema: public; Owner: supabase_admin
--
GRANT ALL ON FUNCTION public.sparsevec_out(public.sparsevec) TO postgres;
GRANT ALL ON FUNCTION public.sparsevec_out(public.sparsevec) TO anon;
GRANT ALL ON FUNCTION public.sparsevec_out(public.sparsevec) TO authenticated;
GRANT ALL ON FUNCTION public.sparsevec_out(public.sparsevec) TO service_role;
--
-- Name: FUNCTION sparsevec_recv(internal, oid, integer); Type: ACL; Schema: public; Owner: supabase_admin
--
GRANT ALL ON FUNCTION public.sparsevec_recv(internal, oid, integer) TO postgres;
GRANT ALL ON FUNCTION public.sparsevec_recv(internal, oid, integer) TO anon;
GRANT ALL ON FUNCTION public.sparsevec_recv(internal, oid, integer) TO authenticated;
GRANT ALL ON FUNCTION public.sparsevec_recv(internal, oid, integer) TO service_role;
--
-- Name: FUNCTION sparsevec_send(public.sparsevec); Type: ACL; Schema: public; Owner: supabase_admin
--
GRANT ALL ON FUNCTION public.sparsevec_send(public.sparsevec) TO postgres;
GRANT ALL ON FUNCTION public.sparsevec_send(public.sparsevec) TO anon;
GRANT ALL ON FUNCTION public.sparsevec_send(public.sparsevec) TO authenticated;
GRANT ALL ON FUNCTION public.sparsevec_send(public.sparsevec) TO service_role;
--
-- Name: FUNCTION sparsevec_typmod_in(cstring[]); Type: ACL; Schema: public; Owner: supabase_admin
--
GRANT ALL ON FUNCTION public.sparsevec_typmod_in(cstring[]) TO postgres;
GRANT ALL ON FUNCTION public.sparsevec_typmod_in(cstring[]) TO anon;
GRANT ALL ON FUNCTION public.sparsevec_typmod_in(cstring[]) TO authenticated;
GRANT ALL ON FUNCTION public.sparsevec_typmod_in(cstring[]) TO service_role;
--
-- Name: FUNCTION vector_in(cstring, oid, integer); Type: ACL; Schema: public; Owner: supabase_admin
--
GRANT ALL ON FUNCTION public.vector_in(cstring, oid, integer) TO postgres;
GRANT ALL ON FUNCTION public.vector_in(cstring, oid, integer) TO anon;
GRANT ALL ON FUNCTION public.vector_in(cstring, oid, integer) TO authenticated;
GRANT ALL ON FUNCTION public.vector_in(cstring, oid, integer) TO service_role;
--
-- Name: FUNCTION vector_out(public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--
GRANT ALL ON FUNCTION public.vector_out(public.vector) TO postgres;
GRANT ALL ON FUNCTION public.vector_out(public.vector) TO anon;
GRANT ALL ON FUNCTION public.vector_out(public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.vector_out(public.vector) TO service_role;
--
-- Name: FUNCTION vector_recv(internal, oid, integer); Type: ACL; Schema: public; Owner: supabase_admin
--
GRANT ALL ON FUNCTION public.vector_recv(internal, oid, integer) TO postgres;
GRANT ALL ON FUNCTION public.vector_recv(internal, oid, integer) TO anon;
GRANT ALL ON FUNCTION public.vector_recv(internal, oid, integer) TO authenticated;
GRANT ALL ON FUNCTION public.vector_recv(internal, oid, integer) TO service_role;
--
-- Name: FUNCTION vector_send(public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--
GRANT ALL ON FUNCTION public.vector_send(public.vector) TO postgres;
GRANT ALL ON FUNCTION public.vector_send(public.vector) TO anon;
GRANT ALL ON FUNCTION public.vector_send(public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.vector_send(public.vector) TO service_role;
--
-- Name: FUNCTION vector_typmod_in(cstring[]); Type: ACL; Schema: public; Owner: supabase_admin
--
GRANT ALL ON FUNCTION public.vector_typmod_in(cstring[]) TO postgres;
GRANT ALL ON FUNCTION public.vector_typmod_in(cstring[]) TO anon;
GRANT ALL ON FUNCTION public.vector_typmod_in(cstring[]) TO authenticated;
GRANT ALL ON FUNCTION public.vector_typmod_in(cstring[]) TO service_role;
--
-- Name: FUNCTION array_to_halfvec(real[], integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--
GRANT ALL ON FUNCTION public.array_to_halfvec(real[], integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.array_to_halfvec(real[], integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.array_to_halfvec(real[], integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.array_to_halfvec(real[], integer, boolean) TO service_role;
--
-- Name: FUNCTION array_to_sparsevec(real[], integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--
GRANT ALL ON FUNCTION public.array_to_sparsevec(real[], integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.array_to_sparsevec(real[], integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.array_to_sparsevec(real[], integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.array_to_sparsevec(real[], integer, boolean) TO service_role;
--
-- Name: FUNCTION array_to_vector(real[], integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--
GRANT ALL ON FUNCTION public.array_to_vector(real[], integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.array_to_vector(real[], integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.array_to_vector(real[], integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.array_to_vector(real[], integer, boolean) TO service_role;
--
-- Name: FUNCTION array_to_halfvec(double precision[], integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--
GRANT ALL ON FUNCTION public.array_to_halfvec(double precision[], integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.array_to_halfvec(double precision[], integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.array_to_halfvec(double precision[], integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.array_to_halfvec(double precision[], integer, boolean) TO service_role;
--
-- Name: FUNCTION array_to_sparsevec(double precision[], integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--
GRANT ALL ON FUNCTION public.array_to_sparsevec(double precision[], integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.array_to_sparsevec(double precision[], integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.array_to_sparsevec(double precision[], integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.array_to_sparsevec(double precision[], integer, boolean) TO service_role;
--
-- Name: FUNCTION array_to_vector(double precision[], integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--
GRANT ALL ON FUNCTION public.array_to_vector(double precision[], integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.array_to_vector(double precision[], integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.array_to_vector(double precision[], integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.array_to_vector(double precision[], integer, boolean) TO service_role;
--
-- Name: FUNCTION array_to_halfvec(integer[], integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--
GRANT ALL ON FUNCTION public.array_to_halfvec(integer[], integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.array_to_halfvec(integer[], integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.array_to_halfvec(integer[], integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.array_to_halfvec(integer[], integer, boolean) TO service_role;
--
-- Name: FUNCTION array_to_sparsevec(integer[], integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--
GRANT ALL ON FUNCTION public.array_to_sparsevec(integer[], integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.array_to_sparsevec(integer[], integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.array_to_sparsevec(integer[], integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.array_to_sparsevec(integer[], integer, boolean) TO service_role;
--
-- Name: FUNCTION array_to_vector(integer[], integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--
GRANT ALL ON FUNCTION public.array_to_vector(integer[], integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.array_to_vector(integer[], integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.array_to_vector(integer[], integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.array_to_vector(integer[], integer, boolean) TO service_role;
--
-- Name: FUNCTION array_to_halfvec(numeric[], integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--
GRANT ALL ON FUNCTION public.array_to_halfvec(numeric[], integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.array_to_halfvec(numeric[], integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.array_to_halfvec(numeric[], integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.array_to_halfvec(numeric[], integer, boolean) TO service_role;
--
-- Name: FUNCTION array_to_sparsevec(numeric[], integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--
GRANT ALL ON FUNCTION public.array_to_sparsevec(numeric[], integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.array_to_sparsevec(numeric[], integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.array_to_sparsevec(numeric[], integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.array_to_sparsevec(numeric[], integer, boolean) TO service_role;
--
-- Name: FUNCTION array_to_vector(numeric[], integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--
GRANT ALL ON FUNCTION public.array_to_vector(numeric[], integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.array_to_vector(numeric[], integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.array_to_vector(numeric[], integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.array_to_vector(numeric[], integer, boolean) TO service_role;
--
-- Name: FUNCTION halfvec_to_float4(public.halfvec, integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--
GRANT ALL ON FUNCTION public.halfvec_to_float4(public.halfvec, integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_to_float4(public.halfvec, integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.halfvec_to_float4(public.halfvec, integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_to_float4(public.halfvec, integer, boolean) TO service_role;
--
-- Name: FUNCTION halfvec(public.halfvec, integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--
GRANT ALL ON FUNCTION public.halfvec(public.halfvec, integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.halfvec(public.halfvec, integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.halfvec(public.halfvec, integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec(public.halfvec, integer, boolean) TO service_role;
--
-- Name: FUNCTION halfvec_to_sparsevec(public.halfvec, integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--
GRANT ALL ON FUNCTION public.halfvec_to_sparsevec(public.halfvec, integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_to_sparsevec(public.halfvec, integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.halfvec_to_sparsevec(public.halfvec, integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_to_sparsevec(public.halfvec, integer, boolean) TO service_role;
--
-- Name: FUNCTION halfvec_to_vector(public.halfvec, integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--
GRANT ALL ON FUNCTION public.halfvec_to_vector(public.halfvec, integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_to_vector(public.halfvec, integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.halfvec_to_vector(public.halfvec, integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_to_vector(public.halfvec, integer, boolean) TO service_role;
--
-- Name: FUNCTION sparsevec_to_halfvec(public.sparsevec, integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--
GRANT ALL ON FUNCTION public.sparsevec_to_halfvec(public.sparsevec, integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.sparsevec_to_halfvec(public.sparsevec, integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.sparsevec_to_halfvec(public.sparsevec, integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.sparsevec_to_halfvec(public.sparsevec, integer, boolean) TO service_role;
--
-- Name: FUNCTION sparsevec(public.sparsevec, integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--
GRANT ALL ON FUNCTION public.sparsevec(public.sparsevec, integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.sparsevec(public.sparsevec, integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.sparsevec(public.sparsevec, integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.sparsevec(public.sparsevec, integer, boolean) TO service_role;
--
-- Name: FUNCTION sparsevec_to_vector(public.sparsevec, integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--
GRANT ALL ON FUNCTION public.sparsevec_to_vector(public.sparsevec, integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.sparsevec_to_vector(public.sparsevec, integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.sparsevec_to_vector(public.sparsevec, integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.sparsevec_to_vector(public.sparsevec, integer, boolean) TO service_role;
--
-- Name: FUNCTION vector_to_float4(public.vector, integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--
GRANT ALL ON FUNCTION public.vector_to_float4(public.vector, integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.vector_to_float4(public.vector, integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.vector_to_float4(public.vector, integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.vector_to_float4(public.vector, integer, boolean) TO service_role;
--
-- Name: FUNCTION vector_to_halfvec(public.vector, integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--
GRANT ALL ON FUNCTION public.vector_to_halfvec(public.vector, integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.vector_to_halfvec(public.vector, integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.vector_to_halfvec(public.vector, integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.vector_to_halfvec(public.vector, integer, boolean) TO service_role;
--
-- Name: FUNCTION vector_to_sparsevec(public.vector, integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--
GRANT ALL ON FUNCTION public.vector_to_sparsevec(public.vector, integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.vector_to_sparsevec(public.vector, integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.vector_to_sparsevec(public.vector, integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.vector_to_sparsevec(public.vector, integer, boolean) TO service_role;
--
-- Name: FUNCTION vector(public.vector, integer, boolean); Type: ACL; Schema: public; Owner: supabase_admin
--
GRANT ALL ON FUNCTION public.vector(public.vector, integer, boolean) TO postgres;
GRANT ALL ON FUNCTION public.vector(public.vector, integer, boolean) TO anon;
GRANT ALL ON FUNCTION public.vector(public.vector, integer, boolean) TO authenticated;
GRANT ALL ON FUNCTION public.vector(public.vector, integer, boolean) TO service_role;
--
-- Name: FUNCTION email(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--
GRANT ALL ON FUNCTION auth.email() TO dashboard_user;
--
-- Name: FUNCTION jwt(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--
GRANT ALL ON FUNCTION auth.jwt() TO postgres;
GRANT ALL ON FUNCTION auth.jwt() TO dashboard_user;
--
-- Name: FUNCTION role(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--
GRANT ALL ON FUNCTION auth.role() TO dashboard_user;
--
-- Name: FUNCTION uid(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--
GRANT ALL ON FUNCTION auth.uid() TO dashboard_user;
--
-- Name: FUNCTION armor(bytea); Type: ACL; Schema: extensions; Owner: postgres
--
REVOKE ALL ON FUNCTION extensions.armor(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO dashboard_user;
--
-- Name: FUNCTION armor(bytea, text[], text[]); Type: ACL; Schema: extensions; Owner: postgres
--
REVOKE ALL ON FUNCTION extensions.armor(bytea, text[], text[]) FROM postgres;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO dashboard_user;
--
-- Name: FUNCTION crypt(text, text); Type: ACL; Schema: extensions; Owner: postgres
--
REVOKE ALL ON FUNCTION extensions.crypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO dashboard_user;
--
-- Name: FUNCTION dearmor(text); Type: ACL; Schema: extensions; Owner: postgres
--
REVOKE ALL ON FUNCTION extensions.dearmor(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO dashboard_user;
--
-- Name: FUNCTION decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--
REVOKE ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO dashboard_user;
--
-- Name: FUNCTION decrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--
REVOKE ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;
--
-- Name: FUNCTION digest(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--
REVOKE ALL ON FUNCTION extensions.digest(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO dashboard_user;
--
-- Name: FUNCTION digest(text, text); Type: ACL; Schema: extensions; Owner: postgres
--
REVOKE ALL ON FUNCTION extensions.digest(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO dashboard_user;
--
-- Name: FUNCTION encrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--
REVOKE ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO dashboard_user;
--
-- Name: FUNCTION encrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--
REVOKE ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;
--
-- Name: FUNCTION gen_random_bytes(integer); Type: ACL; Schema: extensions; Owner: postgres
--
REVOKE ALL ON FUNCTION extensions.gen_random_bytes(integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO dashboard_user;
--
-- Name: FUNCTION gen_random_uuid(); Type: ACL; Schema: extensions; Owner: postgres
--
REVOKE ALL ON FUNCTION extensions.gen_random_uuid() FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO dashboard_user;
--
-- Name: FUNCTION gen_salt(text); Type: ACL; Schema: extensions; Owner: postgres
--
REVOKE ALL ON FUNCTION extensions.gen_salt(text) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO dashboard_user;
