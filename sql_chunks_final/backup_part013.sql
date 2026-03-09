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
