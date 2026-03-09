

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
