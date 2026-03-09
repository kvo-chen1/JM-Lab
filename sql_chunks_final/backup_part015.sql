

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


--
-- Name: FUNCTION gen_salt(text, integer); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.gen_salt(text, integer) FROM postgres;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO dashboard_user;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION extensions.grant_pg_cron_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO dashboard_user;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.grant_pg_graphql_access() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION grant_pg_net_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION extensions.grant_pg_net_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO dashboard_user;


--
-- Name: FUNCTION hmac(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.hmac(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION hmac(text, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.hmac(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO dashboard_user;


--
-- Name: FUNCTION pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) FROM postgres;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO dashboard_user;


--
-- Name: FUNCTION pgp_armor_headers(text, OUT key text, OUT value text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO dashboard_user;


--
-- Name: FUNCTION pgp_key_id(bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_key_id(bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO dashboard_user;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO dashboard_user;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) FROM postgres;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO dashboard_user;


--
-- Name: FUNCTION pgrst_ddl_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_ddl_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgrst_drop_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_drop_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.set_graphql_placeholder() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_generate_v1(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v1mc(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v1mc() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v3(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v4(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v4() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO dashboard_user;


--
-- Name: FUNCTION uuid_generate_v5(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO dashboard_user;


--
-- Name: FUNCTION uuid_nil(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_nil() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_dns(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_dns() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_oid(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_oid() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_url(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_url() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO dashboard_user;


--
-- Name: FUNCTION uuid_ns_x500(); Type: ACL; Schema: extensions; Owner: postgres
--

REVOKE ALL ON FUNCTION extensions.uuid_ns_x500() FROM postgres;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO dashboard_user;


--
-- Name: FUNCTION graphql("operationName" text, query text, variables jsonb, extensions jsonb); Type: ACL; Schema: graphql_public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO postgres;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO anon;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO authenticated;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO service_role;


--
-- Name: FUNCTION pg_reload_conf(); Type: ACL; Schema: pg_catalog; Owner: supabase_admin
--

GRANT ALL ON FUNCTION pg_catalog.pg_reload_conf() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION get_auth(p_usename text); Type: ACL; Schema: pgbouncer; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION pgbouncer.get_auth(p_usename text) FROM PUBLIC;
GRANT ALL ON FUNCTION pgbouncer.get_auth(p_usename text) TO pgbouncer;


--
-- Name: FUNCTION add_revenue_record(p_user_id uuid, p_amount numeric, p_type text, p_description text, p_work_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.add_revenue_record(p_user_id uuid, p_amount numeric, p_type text, p_description text, p_work_id uuid) TO anon;
GRANT ALL ON FUNCTION public.add_revenue_record(p_user_id uuid, p_amount numeric, p_type text, p_description text, p_work_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.add_revenue_record(p_user_id uuid, p_amount numeric, p_type text, p_description text, p_work_id uuid) TO service_role;


--
-- Name: FUNCTION add_test_revenue_record(p_user_id uuid, p_amount numeric, p_type text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.add_test_revenue_record(p_user_id uuid, p_amount numeric, p_type text) TO anon;
GRANT ALL ON FUNCTION public.add_test_revenue_record(p_user_id uuid, p_amount numeric, p_type text) TO authenticated;
GRANT ALL ON FUNCTION public.add_test_revenue_record(p_user_id uuid, p_amount numeric, p_type text) TO service_role;


--
-- Name: FUNCTION aggregate_user_realtime_features(p_user_id uuid, p_time_window interval); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.aggregate_user_realtime_features(p_user_id uuid, p_time_window interval) TO anon;
GRANT ALL ON FUNCTION public.aggregate_user_realtime_features(p_user_id uuid, p_time_window interval) TO authenticated;
GRANT ALL ON FUNCTION public.aggregate_user_realtime_features(p_user_id uuid, p_time_window interval) TO service_role;


--
-- Name: FUNCTION audit_promotion_application(p_application_id uuid, p_action text, p_notes text, p_reason text, p_performed_by uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.audit_promotion_application(p_application_id uuid, p_action text, p_notes text, p_reason text, p_performed_by uuid) TO anon;
GRANT ALL ON FUNCTION public.audit_promotion_application(p_application_id uuid, p_action text, p_notes text, p_reason text, p_performed_by uuid) TO authenticated;
GRANT ALL ON FUNCTION public.audit_promotion_application(p_application_id uuid, p_action text, p_notes text, p_reason text, p_performed_by uuid) TO service_role;


--
-- Name: FUNCTION audit_promotion_order(p_order_id uuid, p_approved boolean, p_notes text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.audit_promotion_order(p_order_id uuid, p_approved boolean, p_notes text) TO anon;
GRANT ALL ON FUNCTION public.audit_promotion_order(p_order_id uuid, p_approved boolean, p_notes text) TO authenticated;
GRANT ALL ON FUNCTION public.audit_promotion_order(p_order_id uuid, p_approved boolean, p_notes text) TO service_role;


--
-- Name: FUNCTION batch_publish_scores(p_submission_ids uuid[], p_published_by uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.batch_publish_scores(p_submission_ids uuid[], p_published_by uuid) TO anon;
GRANT ALL ON FUNCTION public.batch_publish_scores(p_submission_ids uuid[], p_published_by uuid) TO authenticated;
GRANT ALL ON FUNCTION public.batch_publish_scores(p_submission_ids uuid[], p_published_by uuid) TO service_role;


--
-- Name: FUNCTION binary_quantize(public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.binary_quantize(public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.binary_quantize(public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.binary_quantize(public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.binary_quantize(public.halfvec) TO service_role;


--
-- Name: FUNCTION binary_quantize(public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.binary_quantize(public.vector) TO postgres;
GRANT ALL ON FUNCTION public.binary_quantize(public.vector) TO anon;
GRANT ALL ON FUNCTION public.binary_quantize(public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.binary_quantize(public.vector) TO service_role;


--
-- Name: FUNCTION calculate_content_hot_score(p_view_count integer, p_like_count integer, p_collect_count integer, p_share_count integer, p_comment_count integer, p_created_at timestamp with time zone); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.calculate_content_hot_score(p_view_count integer, p_like_count integer, p_collect_count integer, p_share_count integer, p_comment_count integer, p_created_at timestamp with time zone) TO anon;
GRANT ALL ON FUNCTION public.calculate_content_hot_score(p_view_count integer, p_like_count integer, p_collect_count integer, p_share_count integer, p_comment_count integer, p_created_at timestamp with time zone) TO authenticated;
GRANT ALL ON FUNCTION public.calculate_content_hot_score(p_view_count integer, p_like_count integer, p_collect_count integer, p_share_count integer, p_comment_count integer, p_created_at timestamp with time zone) TO service_role;


--
-- Name: FUNCTION calculate_content_scores(p_work_id uuid, p_content text, p_title text, p_description text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.calculate_content_scores(p_work_id uuid, p_content text, p_title text, p_description text) TO anon;
GRANT ALL ON FUNCTION public.calculate_content_scores(p_work_id uuid, p_content text, p_title text, p_description text) TO authenticated;
GRANT ALL ON FUNCTION public.calculate_content_scores(p_work_id uuid, p_content text, p_title text, p_description text) TO service_role;


--
-- Name: FUNCTION calculate_work_reward(p_views integer, p_likes integer, p_favorites integer, p_shares integer, p_incentive_model jsonb); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.calculate_work_reward(p_views integer, p_likes integer, p_favorites integer, p_shares integer, p_incentive_model jsonb) TO anon;
GRANT ALL ON FUNCTION public.calculate_work_reward(p_views integer, p_likes integer, p_favorites integer, p_shares integer, p_incentive_model jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.calculate_work_reward(p_views integer, p_likes integer, p_favorites integer, p_shares integer, p_incentive_model jsonb) TO service_role;


--
-- Name: FUNCTION can_edit_event(p_event_id uuid, p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.can_edit_event(p_event_id uuid, p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.can_edit_event(p_event_id uuid, p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.can_edit_event(p_event_id uuid, p_user_id uuid) TO service_role;


--
-- Name: FUNCTION check_invite_rate_limit(p_user_id text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.check_invite_rate_limit(p_user_id text) TO anon;
GRANT ALL ON FUNCTION public.check_invite_rate_limit(p_user_id text) TO authenticated;
GRANT ALL ON FUNCTION public.check_invite_rate_limit(p_user_id text) TO service_role;


--
-- Name: FUNCTION check_points_limit(p_user_id uuid, p_source_type character varying, p_points integer, p_period_type character varying); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.check_points_limit(p_user_id uuid, p_source_type character varying, p_points integer, p_period_type character varying) TO anon;
GRANT ALL ON FUNCTION public.check_points_limit(p_user_id uuid, p_source_type character varying, p_points integer, p_period_type character varying) TO authenticated;
GRANT ALL ON FUNCTION public.check_points_limit(p_user_id uuid, p_source_type character varying, p_points integer, p_period_type character varying) TO service_role;


--
-- Name: FUNCTION cleanup_expired_backups(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.cleanup_expired_backups() TO anon;
GRANT ALL ON FUNCTION public.cleanup_expired_backups() TO authenticated;
GRANT ALL ON FUNCTION public.cleanup_expired_backups() TO service_role;


--
-- Name: FUNCTION cleanup_expired_invitations(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.cleanup_expired_invitations() TO anon;
GRANT ALL ON FUNCTION public.cleanup_expired_invitations() TO authenticated;
GRANT ALL ON FUNCTION public.cleanup_expired_invitations() TO service_role;


--
-- Name: FUNCTION cleanup_expired_recommendations(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.cleanup_expired_recommendations() TO anon;
GRANT ALL ON FUNCTION public.cleanup_expired_recommendations() TO authenticated;
GRANT ALL ON FUNCTION public.cleanup_expired_recommendations() TO service_role;


--
-- Name: FUNCTION cleanup_old_brand_wizard_drafts(days integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.cleanup_old_brand_wizard_drafts(days integer) TO anon;
GRANT ALL ON FUNCTION public.cleanup_old_brand_wizard_drafts(days integer) TO authenticated;
GRANT ALL ON FUNCTION public.cleanup_old_brand_wizard_drafts(days integer) TO service_role;


--
-- Name: FUNCTION cleanup_old_generation_tasks(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.cleanup_old_generation_tasks() TO anon;
GRANT ALL ON FUNCTION public.cleanup_old_generation_tasks() TO authenticated;
GRANT ALL ON FUNCTION public.cleanup_old_generation_tasks() TO service_role;


--
-- Name: FUNCTION cleanup_old_search_history(p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.cleanup_old_search_history(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.cleanup_old_search_history(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.cleanup_old_search_history(p_user_id uuid) TO service_role;


--
-- Name: FUNCTION cleanup_old_sync_logs(p_retention_days integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.cleanup_old_sync_logs(p_retention_days integer) TO anon;
GRANT ALL ON FUNCTION public.cleanup_old_sync_logs(p_retention_days integer) TO authenticated;
GRANT ALL ON FUNCTION public.cleanup_old_sync_logs(p_retention_days integer) TO service_role;


--
-- Name: FUNCTION cosine_distance(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.cosine_distance(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.cosine_distance(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.cosine_distance(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.cosine_distance(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION cosine_distance(public.sparsevec, public.sparsevec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.cosine_distance(public.sparsevec, public.sparsevec) TO postgres;
GRANT ALL ON FUNCTION public.cosine_distance(public.sparsevec, public.sparsevec) TO anon;
GRANT ALL ON FUNCTION public.cosine_distance(public.sparsevec, public.sparsevec) TO authenticated;
GRANT ALL ON FUNCTION public.cosine_distance(public.sparsevec, public.sparsevec) TO service_role;


--
-- Name: FUNCTION cosine_distance(public.vector, public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.cosine_distance(public.vector, public.vector) TO postgres;
GRANT ALL ON FUNCTION public.cosine_distance(public.vector, public.vector) TO anon;
GRANT ALL ON FUNCTION public.cosine_distance(public.vector, public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.cosine_distance(public.vector, public.vector) TO service_role;


--
-- Name: FUNCTION create_ip_asset_with_stages(p_user_id uuid, p_name character varying, p_description text, p_type character varying, p_original_work_id uuid, p_commercial_value integer, p_thumbnail text, p_status character varying); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.create_ip_asset_with_stages(p_user_id uuid, p_name character varying, p_description text, p_type character varying, p_original_work_id uuid, p_commercial_value integer, p_thumbnail text, p_status character varying) TO anon;
GRANT ALL ON FUNCTION public.create_ip_asset_with_stages(p_user_id uuid, p_name character varying, p_description text, p_type character varying, p_original_work_id uuid, p_commercial_value integer, p_thumbnail text, p_status character varying) TO authenticated;
GRANT ALL ON FUNCTION public.create_ip_asset_with_stages(p_user_id uuid, p_name character varying, p_description text, p_type character varying, p_original_work_id uuid, p_commercial_value integer, p_thumbnail text, p_status character varying) TO service_role;


--
-- Name: FUNCTION create_organizer_backup(p_organizer_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.create_organizer_backup(p_organizer_id uuid) TO anon;
GRANT ALL ON FUNCTION public.create_organizer_backup(p_organizer_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.create_organizer_backup(p_organizer_id uuid) TO service_role;


--
-- Name: FUNCTION create_post_transaction(p_title text, p_content text, p_community_id uuid, p_author_id uuid, p_images jsonb); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.create_post_transaction(p_title text, p_content text, p_community_id uuid, p_author_id uuid, p_images jsonb) TO anon;
GRANT ALL ON FUNCTION public.create_post_transaction(p_title text, p_content text, p_community_id uuid, p_author_id uuid, p_images jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.create_post_transaction(p_title text, p_content text, p_community_id uuid, p_author_id uuid, p_images jsonb) TO service_role;


--
-- Name: FUNCTION create_promo_order(p_user_id uuid, p_work_id text, p_package_type text, p_target_type text, p_metric_type text, p_original_price numeric, p_discount_amount numeric, p_final_price numeric, p_coupon_id uuid, p_metadata jsonb); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.create_promo_order(p_user_id uuid, p_work_id text, p_package_type text, p_target_type text, p_metric_type text, p_original_price numeric, p_discount_amount numeric, p_final_price numeric, p_coupon_id uuid, p_metadata jsonb) TO anon;
GRANT ALL ON FUNCTION public.create_promo_order(p_user_id uuid, p_work_id text, p_package_type text, p_target_type text, p_metric_type text, p_original_price numeric, p_discount_amount numeric, p_final_price numeric, p_coupon_id uuid, p_metadata jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.create_promo_order(p_user_id uuid, p_work_id text, p_package_type text, p_target_type text, p_metric_type text, p_original_price numeric, p_discount_amount numeric, p_final_price numeric, p_coupon_id uuid, p_metadata jsonb) TO service_role;


--
-- Name: FUNCTION create_promotion_order(p_user_id uuid, p_work_id text, p_package_type text, p_target_type text, p_metric_type text, p_original_price numeric, p_discount_amount numeric, p_final_price numeric, p_coupon_id text, p_metadata jsonb); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.create_promotion_order(p_user_id uuid, p_work_id text, p_package_type text, p_target_type text, p_metric_type text, p_original_price numeric, p_discount_amount numeric, p_final_price numeric, p_coupon_id text, p_metadata jsonb) TO anon;
GRANT ALL ON FUNCTION public.create_promotion_order(p_user_id uuid, p_work_id text, p_package_type text, p_target_type text, p_metric_type text, p_original_price numeric, p_discount_amount numeric, p_final_price numeric, p_coupon_id text, p_metadata jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.create_promotion_order(p_user_id uuid, p_work_id text, p_package_type text, p_target_type text, p_metric_type text, p_original_price numeric, p_discount_amount numeric, p_final_price numeric, p_coupon_id text, p_metadata jsonb) TO service_role;


--
-- Name: FUNCTION create_test_promotion_data(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.create_test_promotion_data() TO anon;
GRANT ALL ON FUNCTION public.create_test_promotion_data() TO authenticated;
GRANT ALL ON FUNCTION public.create_test_promotion_data() TO service_role;


--
-- Name: FUNCTION evaluate_small_traffic_test(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.evaluate_small_traffic_test() TO anon;
GRANT ALL ON FUNCTION public.evaluate_small_traffic_test() TO authenticated;
GRANT ALL ON FUNCTION public.evaluate_small_traffic_test() TO service_role;


--
-- Name: FUNCTION exchange_product(p_user_id uuid, p_product_id uuid, p_quantity integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.exchange_product(p_user_id uuid, p_product_id uuid, p_quantity integer) TO anon;
GRANT ALL ON FUNCTION public.exchange_product(p_user_id uuid, p_product_id uuid, p_quantity integer) TO authenticated;
GRANT ALL ON FUNCTION public.exchange_product(p_user_id uuid, p_product_id uuid, p_quantity integer) TO service_role;


--
-- Name: FUNCTION exec_sql(sql text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.exec_sql(sql text) TO anon;
GRANT ALL ON FUNCTION public.exec_sql(sql text) TO authenticated;
GRANT ALL ON FUNCTION public.exec_sql(sql text) TO service_role;


--
-- Name: FUNCTION execute_sql(sql text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.execute_sql(sql text) TO anon;
GRANT ALL ON FUNCTION public.execute_sql(sql text) TO authenticated;
GRANT ALL ON FUNCTION public.execute_sql(sql text) TO service_role;


--
-- Name: FUNCTION export_organizer_data(p_organizer_id uuid, p_type text, p_format text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.export_organizer_data(p_organizer_id uuid, p_type text, p_format text) TO anon;
GRANT ALL ON FUNCTION public.export_organizer_data(p_organizer_id uuid, p_type text, p_format text) TO authenticated;
GRANT ALL ON FUNCTION public.export_organizer_data(p_organizer_id uuid, p_type text, p_format text) TO service_role;


--
-- Name: FUNCTION generate_promotion_order_no(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.generate_promotion_order_no() TO anon;
GRANT ALL ON FUNCTION public.generate_promotion_order_no() TO authenticated;
GRANT ALL ON FUNCTION public.generate_promotion_order_no() TO service_role;


--
-- Name: FUNCTION get_active_alerts(p_limit integer, p_offset integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_active_alerts(p_limit integer, p_offset integer) TO anon;
GRANT ALL ON FUNCTION public.get_active_alerts(p_limit integer, p_offset integer) TO authenticated;
GRANT ALL ON FUNCTION public.get_active_alerts(p_limit integer, p_offset integer) TO service_role;


--
-- Name: FUNCTION get_ai_feedback_list(p_rating integer, p_feedback_type text, p_is_read boolean, p_search_query text, p_start_date timestamp with time zone, p_end_date timestamp with time zone, p_limit integer, p_offset integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_ai_feedback_list(p_rating integer, p_feedback_type text, p_is_read boolean, p_search_query text, p_start_date timestamp with time zone, p_end_date timestamp with time zone, p_limit integer, p_offset integer) TO anon;
GRANT ALL ON FUNCTION public.get_ai_feedback_list(p_rating integer, p_feedback_type text, p_is_read boolean, p_search_query text, p_start_date timestamp with time zone, p_end_date timestamp with time zone, p_limit integer, p_offset integer) TO authenticated;
GRANT ALL ON FUNCTION public.get_ai_feedback_list(p_rating integer, p_feedback_type text, p_is_read boolean, p_search_query text, p_start_date timestamp with time zone, p_end_date timestamp with time zone, p_limit integer, p_offset integer) TO service_role;


--
-- Name: FUNCTION get_ai_feedback_stats(p_start_date timestamp with time zone, p_end_date timestamp with time zone); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_ai_feedback_stats(p_start_date timestamp with time zone, p_end_date timestamp with time zone) TO anon;
GRANT ALL ON FUNCTION public.get_ai_feedback_stats(p_start_date timestamp with time zone, p_end_date timestamp with time zone) TO authenticated;
GRANT ALL ON FUNCTION public.get_ai_feedback_stats(p_start_date timestamp with time zone, p_end_date timestamp with time zone) TO service_role;


--
-- Name: FUNCTION get_ai_review_detail(p_review_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_ai_review_detail(p_review_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_ai_review_detail(p_review_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_ai_review_detail(p_review_id uuid) TO service_role;


--
-- Name: FUNCTION get_ai_review_detail(p_review_id uuid, p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_ai_review_detail(p_review_id uuid, p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_ai_review_detail(p_review_id uuid, p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_ai_review_detail(p_review_id uuid, p_user_id uuid) TO service_role;


--
-- Name: FUNCTION get_alert_stats(p_start_date timestamp with time zone, p_end_date timestamp with time zone); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_alert_stats(p_start_date timestamp with time zone, p_end_date timestamp with time zone) TO anon;
GRANT ALL ON FUNCTION public.get_alert_stats(p_start_date timestamp with time zone, p_end_date timestamp with time zone) TO authenticated;
GRANT ALL ON FUNCTION public.get_alert_stats(p_start_date timestamp with time zone, p_end_date timestamp with time zone) TO service_role;


--
-- Name: FUNCTION get_auth_users_info(user_ids uuid[]); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_auth_users_info(user_ids uuid[]) TO anon;
GRANT ALL ON FUNCTION public.get_auth_users_info(user_ids uuid[]) TO authenticated;
GRANT ALL ON FUNCTION public.get_auth_users_info(user_ids uuid[]) TO service_role;


--
-- Name: FUNCTION get_brand_events(p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_brand_events(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_brand_events(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_brand_events(p_user_id uuid) TO service_role;


--
-- Name: FUNCTION get_brand_task_stats(p_task_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_brand_task_stats(p_task_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_brand_task_stats(p_task_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_brand_task_stats(p_task_id uuid) TO service_role;


--
-- Name: FUNCTION get_community_invite_stats(p_community_id character varying); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_community_invite_stats(p_community_id character varying) TO anon;
GRANT ALL ON FUNCTION public.get_community_invite_stats(p_community_id character varying) TO authenticated;
GRANT ALL ON FUNCTION public.get_community_invite_stats(p_community_id character varying) TO service_role;


--
-- Name: FUNCTION get_default_lottery_activity_id(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_default_lottery_activity_id() TO anon;
GRANT ALL ON FUNCTION public.get_default_lottery_activity_id() TO authenticated;
GRANT ALL ON FUNCTION public.get_default_lottery_activity_id() TO service_role;


--
-- Name: FUNCTION get_exchange_stats(p_user_id uuid, p_start_date date, p_end_date date); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_exchange_stats(p_user_id uuid, p_start_date date, p_end_date date) TO anon;
GRANT ALL ON FUNCTION public.get_exchange_stats(p_user_id uuid, p_start_date date, p_end_date date) TO authenticated;
GRANT ALL ON FUNCTION public.get_exchange_stats(p_user_id uuid, p_start_date date, p_end_date date) TO service_role;


--
-- Name: FUNCTION get_feedback_stats(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_feedback_stats() TO anon;
GRANT ALL ON FUNCTION public.get_feedback_stats() TO authenticated;
GRANT ALL ON FUNCTION public.get_feedback_stats() TO service_role;


--
-- Name: FUNCTION get_final_ranking(p_event_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_final_ranking(p_event_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_final_ranking(p_event_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_final_ranking(p_event_id uuid) TO service_role;


--
-- Name: FUNCTION get_ip_asset_details(p_asset_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_ip_asset_details(p_asset_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_ip_asset_details(p_asset_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_ip_asset_details(p_asset_id uuid) TO service_role;


--
-- Name: FUNCTION get_lottery_activity_stats(p_activity_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_lottery_activity_stats(p_activity_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_lottery_activity_stats(p_activity_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_lottery_activity_stats(p_activity_id uuid) TO service_role;


--
-- Name: FUNCTION get_lottery_daily_stats(p_activity_id uuid, p_days integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_lottery_daily_stats(p_activity_id uuid, p_days integer) TO anon;
GRANT ALL ON FUNCTION public.get_lottery_daily_stats(p_activity_id uuid, p_days integer) TO authenticated;
GRANT ALL ON FUNCTION public.get_lottery_daily_stats(p_activity_id uuid, p_days integer) TO service_role;


--
-- Name: FUNCTION get_lottery_hourly_stats(p_activity_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_lottery_hourly_stats(p_activity_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_lottery_hourly_stats(p_activity_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_lottery_hourly_stats(p_activity_id uuid) TO service_role;


--
-- Name: FUNCTION get_lottery_top_prizes(p_activity_id uuid, p_limit integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_lottery_top_prizes(p_activity_id uuid, p_limit integer) TO anon;
GRANT ALL ON FUNCTION public.get_lottery_top_prizes(p_activity_id uuid, p_limit integer) TO authenticated;
GRANT ALL ON FUNCTION public.get_lottery_top_prizes(p_activity_id uuid, p_limit integer) TO service_role;


--
-- Name: FUNCTION get_organizer_dashboard_stats(p_organizer_id uuid, p_start_date date, p_end_date date); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_organizer_dashboard_stats(p_organizer_id uuid, p_start_date date, p_end_date date) TO anon;
GRANT ALL ON FUNCTION public.get_organizer_dashboard_stats(p_organizer_id uuid, p_start_date date, p_end_date date) TO authenticated;
GRANT ALL ON FUNCTION public.get_organizer_dashboard_stats(p_organizer_id uuid, p_start_date date, p_end_date date) TO service_role;


--
-- Name: FUNCTION get_pending_promotion_applications_count(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_pending_promotion_applications_count() TO anon;
GRANT ALL ON FUNCTION public.get_pending_promotion_applications_count() TO authenticated;
GRANT ALL ON FUNCTION public.get_pending_promotion_applications_count() TO service_role;


--
-- Name: FUNCTION get_personalized_suggestions(p_user_id uuid, p_query text, p_limit integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_personalized_suggestions(p_user_id uuid, p_query text, p_limit integer) TO anon;
GRANT ALL ON FUNCTION public.get_personalized_suggestions(p_user_id uuid, p_query text, p_limit integer) TO authenticated;
GRANT ALL ON FUNCTION public.get_personalized_suggestions(p_user_id uuid, p_query text, p_limit integer) TO service_role;


--
-- Name: FUNCTION get_products(p_category character varying, p_status character varying, p_search text, p_limit integer, p_offset integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_products(p_category character varying, p_status character varying, p_search text, p_limit integer, p_offset integer) TO anon;
GRANT ALL ON FUNCTION public.get_products(p_category character varying, p_status character varying, p_search text, p_limit integer, p_offset integer) TO authenticated;
GRANT ALL ON FUNCTION public.get_products(p_category character varying, p_status character varying, p_search text, p_limit integer, p_offset integer) TO service_role;


--
-- Name: FUNCTION get_promotion_debug_info(p_promoted_work_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_promotion_debug_info(p_promoted_work_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_promotion_debug_info(p_promoted_work_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_promotion_debug_info(p_promoted_work_id uuid) TO service_role;


--
-- Name: FUNCTION get_promotion_user_stats(p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_promotion_user_stats(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_promotion_user_stats(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_promotion_user_stats(p_user_id uuid) TO service_role;


--
-- Name: FUNCTION get_score_audit_logs(p_submission_id uuid, p_limit integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_score_audit_logs(p_submission_id uuid, p_limit integer) TO anon;
GRANT ALL ON FUNCTION public.get_score_audit_logs(p_submission_id uuid, p_limit integer) TO authenticated;
GRANT ALL ON FUNCTION public.get_score_audit_logs(p_submission_id uuid, p_limit integer) TO service_role;


--
-- Name: FUNCTION get_square_works_with_promotion(p_limit integer, p_offset integer, p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_square_works_with_promotion(p_limit integer, p_offset integer, p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_square_works_with_promotion(p_limit integer, p_offset integer, p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_square_works_with_promotion(p_limit integer, p_offset integer, p_user_id uuid) TO service_role;


--
-- Name: FUNCTION get_submission_score_stats(p_submission_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_submission_score_stats(p_submission_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_submission_score_stats(p_submission_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_submission_score_stats(p_submission_id uuid) TO service_role;


--
-- Name: FUNCTION get_submission_scores(p_submission_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_submission_scores(p_submission_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_submission_scores(p_submission_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_submission_scores(p_submission_id uuid) TO service_role;


--
-- Name: FUNCTION get_template_favorite_count(template_id integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_template_favorite_count(template_id integer) TO anon;
GRANT ALL ON FUNCTION public.get_template_favorite_count(template_id integer) TO authenticated;
GRANT ALL ON FUNCTION public.get_template_favorite_count(template_id integer) TO service_role;


--
-- Name: FUNCTION get_template_like_count(template_id integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_template_like_count(template_id integer) TO anon;
GRANT ALL ON FUNCTION public.get_template_like_count(template_id integer) TO authenticated;
GRANT ALL ON FUNCTION public.get_template_like_count(template_id integer) TO service_role;


--
-- Name: FUNCTION get_unread_message_count(p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_unread_message_count(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_unread_message_count(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_unread_message_count(p_user_id uuid) TO service_role;


--
-- Name: FUNCTION get_unread_notification_count(p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_unread_notification_count(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_unread_notification_count(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_unread_notification_count(p_user_id uuid) TO service_role;


--
-- Name: TABLE generation_tasks; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.generation_tasks TO anon;
GRANT ALL ON TABLE public.generation_tasks TO authenticated;
GRANT ALL ON TABLE public.generation_tasks TO service_role;


--
-- Name: FUNCTION get_user_active_generation_tasks(p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_active_generation_tasks(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_user_active_generation_tasks(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_active_generation_tasks(p_user_id uuid) TO service_role;


--
-- Name: FUNCTION get_user_ai_reviews(p_limit integer, p_offset integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_ai_reviews(p_limit integer, p_offset integer) TO anon;
GRANT ALL ON FUNCTION public.get_user_ai_reviews(p_limit integer, p_offset integer) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_ai_reviews(p_limit integer, p_offset integer) TO service_role;


--
-- Name: FUNCTION get_user_ai_reviews(p_user_id uuid, p_limit integer, p_offset integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_ai_reviews(p_user_id uuid, p_limit integer, p_offset integer) TO anon;
GRANT ALL ON FUNCTION public.get_user_ai_reviews(p_user_id uuid, p_limit integer, p_offset integer) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_ai_reviews(p_user_id uuid, p_limit integer, p_offset integer) TO service_role;


--
-- Name: FUNCTION get_user_conversations(p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_conversations(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_user_conversations(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_conversations(p_user_id uuid) TO service_role;


--
-- Name: FUNCTION get_user_conversations(p_user_id uuid, p_limit integer, p_offset integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_conversations(p_user_id uuid, p_limit integer, p_offset integer) TO anon;
GRANT ALL ON FUNCTION public.get_user_conversations(p_user_id uuid, p_limit integer, p_offset integer) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_conversations(p_user_id uuid, p_limit integer, p_offset integer) TO service_role;


--
-- Name: FUNCTION get_user_events_simple(p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_events_simple(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_user_events_simple(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_events_simple(p_user_id uuid) TO service_role;


--
-- Name: FUNCTION get_user_exchange_records_with_products(p_user_id uuid, p_limit integer, p_offset integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_exchange_records_with_products(p_user_id uuid, p_limit integer, p_offset integer) TO anon;
GRANT ALL ON FUNCTION public.get_user_exchange_records_with_products(p_user_id uuid, p_limit integer, p_offset integer) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_exchange_records_with_products(p_user_id uuid, p_limit integer, p_offset integer) TO service_role;


--
-- Name: FUNCTION get_user_generation_history(p_user_id uuid, p_limit integer, p_offset integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_generation_history(p_user_id uuid, p_limit integer, p_offset integer) TO anon;
GRANT ALL ON FUNCTION public.get_user_generation_history(p_user_id uuid, p_limit integer, p_offset integer) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_generation_history(p_user_id uuid, p_limit integer, p_offset integer) TO service_role;


--
-- Name: FUNCTION get_user_interactions(p_user_id uuid, p_submission_ids uuid[]); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_interactions(p_user_id uuid, p_submission_ids uuid[]) TO anon;
GRANT ALL ON FUNCTION public.get_user_interactions(p_user_id uuid, p_submission_ids uuid[]) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_interactions(p_user_id uuid, p_submission_ids uuid[]) TO service_role;


--
-- Name: FUNCTION get_user_ip_assets(p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_ip_assets(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_user_ip_assets(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_ip_assets(p_user_id uuid) TO service_role;


--
-- Name: FUNCTION get_user_ip_stats(p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_ip_stats(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_user_ip_stats(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_ip_stats(p_user_id uuid) TO service_role;


--
-- Name: FUNCTION get_user_memories(p_user_id uuid, p_memory_type text, p_limit integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_memories(p_user_id uuid, p_memory_type text, p_limit integer) TO anon;
GRANT ALL ON FUNCTION public.get_user_memories(p_user_id uuid, p_memory_type text, p_limit integer) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_memories(p_user_id uuid, p_memory_type text, p_limit integer) TO service_role;


--
-- Name: FUNCTION get_user_participation_stats(p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_participation_stats(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_user_participation_stats(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_participation_stats(p_user_id uuid) TO service_role;


--
-- Name: FUNCTION get_user_points_stats(p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_points_stats(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_user_points_stats(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_points_stats(p_user_id uuid) TO service_role;


--
-- Name: FUNCTION get_user_preferences(p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_preferences(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_user_preferences(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_preferences(p_user_id uuid) TO service_role;


--
-- Name: FUNCTION get_user_sync_status(p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_sync_status(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.get_user_sync_status(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_sync_status(p_user_id uuid) TO service_role;


--
-- Name: FUNCTION get_works_for_scoring(p_event_id uuid, p_status text, p_score_status text, p_search_query text, p_sort_by text, p_sort_order text, p_page integer, p_limit integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_works_for_scoring(p_event_id uuid, p_status text, p_score_status text, p_search_query text, p_sort_by text, p_sort_order text, p_page integer, p_limit integer) TO anon;
GRANT ALL ON FUNCTION public.get_works_for_scoring(p_event_id uuid, p_status text, p_score_status text, p_search_query text, p_sort_by text, p_sort_order text, p_page integer, p_limit integer) TO authenticated;
GRANT ALL ON FUNCTION public.get_works_for_scoring(p_event_id uuid, p_status text, p_score_status text, p_search_query text, p_sort_by text, p_sort_order text, p_page integer, p_limit integer) TO service_role;


--
-- Name: FUNCTION halfvec_accum(double precision[], public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_accum(double precision[], public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_accum(double precision[], public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_accum(double precision[], public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_accum(double precision[], public.halfvec) TO service_role;


--
-- Name: FUNCTION halfvec_add(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_add(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_add(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_add(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_add(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION halfvec_avg(double precision[]); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_avg(double precision[]) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_avg(double precision[]) TO anon;
GRANT ALL ON FUNCTION public.halfvec_avg(double precision[]) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_avg(double precision[]) TO service_role;


--
-- Name: FUNCTION halfvec_cmp(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_cmp(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_cmp(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_cmp(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_cmp(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION halfvec_combine(double precision[], double precision[]); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_combine(double precision[], double precision[]) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_combine(double precision[], double precision[]) TO anon;
GRANT ALL ON FUNCTION public.halfvec_combine(double precision[], double precision[]) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_combine(double precision[], double precision[]) TO service_role;


--
-- Name: FUNCTION halfvec_concat(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_concat(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_concat(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_concat(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_concat(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION halfvec_eq(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_eq(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_eq(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_eq(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_eq(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION halfvec_ge(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_ge(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_ge(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_ge(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_ge(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION halfvec_gt(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_gt(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_gt(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_gt(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_gt(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION halfvec_l2_squared_distance(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_l2_squared_distance(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_l2_squared_distance(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_l2_squared_distance(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_l2_squared_distance(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION halfvec_le(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_le(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_le(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_le(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_le(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION halfvec_lt(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_lt(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_lt(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_lt(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_lt(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION halfvec_mul(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_mul(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_mul(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_mul(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_mul(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION halfvec_ne(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_ne(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_ne(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_ne(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_ne(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION halfvec_negative_inner_product(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_negative_inner_product(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_negative_inner_product(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_negative_inner_product(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_negative_inner_product(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION halfvec_spherical_distance(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_spherical_distance(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_spherical_distance(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_spherical_distance(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_spherical_distance(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION halfvec_sub(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.halfvec_sub(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.halfvec_sub(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.halfvec_sub(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.halfvec_sub(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION hamming_distance(bit, bit); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.hamming_distance(bit, bit) TO postgres;
GRANT ALL ON FUNCTION public.hamming_distance(bit, bit) TO anon;
GRANT ALL ON FUNCTION public.hamming_distance(bit, bit) TO authenticated;
GRANT ALL ON FUNCTION public.hamming_distance(bit, bit) TO service_role;


--
-- Name: FUNCTION handle_new_user(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.handle_new_user() TO anon;
GRANT ALL ON FUNCTION public.handle_new_user() TO authenticated;
GRANT ALL ON FUNCTION public.handle_new_user() TO service_role;


--
-- Name: FUNCTION has_feedback_manage_permission(p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.has_feedback_manage_permission(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.has_feedback_manage_permission(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.has_feedback_manage_permission(p_user_id uuid) TO service_role;


--
-- Name: FUNCTION hnsw_bit_support(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.hnsw_bit_support(internal) TO postgres;
GRANT ALL ON FUNCTION public.hnsw_bit_support(internal) TO anon;
GRANT ALL ON FUNCTION public.hnsw_bit_support(internal) TO authenticated;
GRANT ALL ON FUNCTION public.hnsw_bit_support(internal) TO service_role;


--
-- Name: FUNCTION hnsw_halfvec_support(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.hnsw_halfvec_support(internal) TO postgres;
GRANT ALL ON FUNCTION public.hnsw_halfvec_support(internal) TO anon;
GRANT ALL ON FUNCTION public.hnsw_halfvec_support(internal) TO authenticated;
GRANT ALL ON FUNCTION public.hnsw_halfvec_support(internal) TO service_role;


--
-- Name: FUNCTION hnsw_sparsevec_support(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.hnsw_sparsevec_support(internal) TO postgres;
GRANT ALL ON FUNCTION public.hnsw_sparsevec_support(internal) TO anon;
GRANT ALL ON FUNCTION public.hnsw_sparsevec_support(internal) TO authenticated;
GRANT ALL ON FUNCTION public.hnsw_sparsevec_support(internal) TO service_role;


--
-- Name: FUNCTION hnswhandler(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.hnswhandler(internal) TO postgres;
GRANT ALL ON FUNCTION public.hnswhandler(internal) TO anon;
GRANT ALL ON FUNCTION public.hnswhandler(internal) TO authenticated;
GRANT ALL ON FUNCTION public.hnswhandler(internal) TO service_role;


--
-- Name: FUNCTION increment_click_count(p_execution_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.increment_click_count(p_execution_id uuid) TO anon;
GRANT ALL ON FUNCTION public.increment_click_count(p_execution_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.increment_click_count(p_execution_id uuid) TO service_role;


--
-- Name: FUNCTION increment_conversion(p_execution_id uuid, p_sale_amount numeric, p_earnings numeric); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.increment_conversion(p_execution_id uuid, p_sale_amount numeric, p_earnings numeric) TO anon;
GRANT ALL ON FUNCTION public.increment_conversion(p_execution_id uuid, p_sale_amount numeric, p_earnings numeric) TO authenticated;
GRANT ALL ON FUNCTION public.increment_conversion(p_execution_id uuid, p_sale_amount numeric, p_earnings numeric) TO service_role;


--
-- Name: FUNCTION increment_invite_count(p_user_id text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.increment_invite_count(p_user_id text) TO anon;
GRANT ALL ON FUNCTION public.increment_invite_count(p_user_id text) TO authenticated;
GRANT ALL ON FUNCTION public.increment_invite_count(p_user_id text) TO service_role;


--
-- Name: FUNCTION increment_promotion_clicks(p_work_id uuid, p_click_count integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.increment_promotion_clicks(p_work_id uuid, p_click_count integer) TO anon;
GRANT ALL ON FUNCTION public.increment_promotion_clicks(p_work_id uuid, p_click_count integer) TO authenticated;
GRANT ALL ON FUNCTION public.increment_promotion_clicks(p_work_id uuid, p_click_count integer) TO service_role;


--
-- Name: FUNCTION increment_promotion_views(p_work_id uuid, p_view_count integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.increment_promotion_views(p_work_id uuid, p_view_count integer) TO anon;
GRANT ALL ON FUNCTION public.increment_promotion_views(p_work_id uuid, p_view_count integer) TO authenticated;
GRANT ALL ON FUNCTION public.increment_promotion_views(p_work_id uuid, p_view_count integer) TO service_role;


--
-- Name: FUNCTION increment_recommendation_click(p_item_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.increment_recommendation_click(p_item_id uuid) TO anon;
GRANT ALL ON FUNCTION public.increment_recommendation_click(p_item_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.increment_recommendation_click(p_item_id uuid) TO service_role;


--
-- Name: FUNCTION increment_recommendation_impression(p_item_id uuid, p_count integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.increment_recommendation_impression(p_item_id uuid, p_count integer) TO anon;
GRANT ALL ON FUNCTION public.increment_recommendation_impression(p_item_id uuid, p_count integer) TO authenticated;
GRANT ALL ON FUNCTION public.increment_recommendation_impression(p_item_id uuid, p_count integer) TO service_role;


--
-- Name: FUNCTION increment_work_view_count(work_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.increment_work_view_count(work_id uuid) TO anon;
GRANT ALL ON FUNCTION public.increment_work_view_count(work_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.increment_work_view_count(work_id uuid) TO service_role;


--
-- Name: FUNCTION initialize_user_points_balance(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.initialize_user_points_balance() TO anon;
GRANT ALL ON FUNCTION public.initialize_user_points_balance() TO authenticated;
GRANT ALL ON FUNCTION public.initialize_user_points_balance() TO service_role;


--
-- Name: FUNCTION inner_product(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.inner_product(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.inner_product(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.inner_product(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.inner_product(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION inner_product(public.sparsevec, public.sparsevec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.inner_product(public.sparsevec, public.sparsevec) TO postgres;
GRANT ALL ON FUNCTION public.inner_product(public.sparsevec, public.sparsevec) TO anon;
GRANT ALL ON FUNCTION public.inner_product(public.sparsevec, public.sparsevec) TO authenticated;
GRANT ALL ON FUNCTION public.inner_product(public.sparsevec, public.sparsevec) TO service_role;


--
-- Name: FUNCTION inner_product(public.vector, public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.inner_product(public.vector, public.vector) TO postgres;
GRANT ALL ON FUNCTION public.inner_product(public.vector, public.vector) TO anon;
GRANT ALL ON FUNCTION public.inner_product(public.vector, public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.inner_product(public.vector, public.vector) TO service_role;


--
-- Name: FUNCTION is_active_admin(p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.is_active_admin(p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.is_active_admin(p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.is_active_admin(p_user_id uuid) TO service_role;


--
-- Name: FUNCTION is_super_admin(p_user_id uuid, required_permission text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.is_super_admin(p_user_id uuid, required_permission text) TO anon;
GRANT ALL ON FUNCTION public.is_super_admin(p_user_id uuid, required_permission text) TO authenticated;
GRANT ALL ON FUNCTION public.is_super_admin(p_user_id uuid, required_permission text) TO service_role;


--
-- Name: FUNCTION ivfflat_bit_support(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.ivfflat_bit_support(internal) TO postgres;
GRANT ALL ON FUNCTION public.ivfflat_bit_support(internal) TO anon;
GRANT ALL ON FUNCTION public.ivfflat_bit_support(internal) TO authenticated;
GRANT ALL ON FUNCTION public.ivfflat_bit_support(internal) TO service_role;


--
-- Name: FUNCTION ivfflat_halfvec_support(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.ivfflat_halfvec_support(internal) TO postgres;
GRANT ALL ON FUNCTION public.ivfflat_halfvec_support(internal) TO anon;
GRANT ALL ON FUNCTION public.ivfflat_halfvec_support(internal) TO authenticated;
GRANT ALL ON FUNCTION public.ivfflat_halfvec_support(internal) TO service_role;


--
-- Name: FUNCTION ivfflathandler(internal); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.ivfflathandler(internal) TO postgres;
GRANT ALL ON FUNCTION public.ivfflathandler(internal) TO anon;
GRANT ALL ON FUNCTION public.ivfflathandler(internal) TO authenticated;
GRANT ALL ON FUNCTION public.ivfflathandler(internal) TO service_role;


--
-- Name: FUNCTION jaccard_distance(bit, bit); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.jaccard_distance(bit, bit) TO postgres;
GRANT ALL ON FUNCTION public.jaccard_distance(bit, bit) TO anon;
GRANT ALL ON FUNCTION public.jaccard_distance(bit, bit) TO authenticated;
GRANT ALL ON FUNCTION public.jaccard_distance(bit, bit) TO service_role;


--
-- Name: FUNCTION l1_distance(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.l1_distance(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.l1_distance(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.l1_distance(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.l1_distance(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION l1_distance(public.sparsevec, public.sparsevec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.l1_distance(public.sparsevec, public.sparsevec) TO postgres;
GRANT ALL ON FUNCTION public.l1_distance(public.sparsevec, public.sparsevec) TO anon;
GRANT ALL ON FUNCTION public.l1_distance(public.sparsevec, public.sparsevec) TO authenticated;
GRANT ALL ON FUNCTION public.l1_distance(public.sparsevec, public.sparsevec) TO service_role;


--
-- Name: FUNCTION l1_distance(public.vector, public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.l1_distance(public.vector, public.vector) TO postgres;
GRANT ALL ON FUNCTION public.l1_distance(public.vector, public.vector) TO anon;
GRANT ALL ON FUNCTION public.l1_distance(public.vector, public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.l1_distance(public.vector, public.vector) TO service_role;


--
-- Name: FUNCTION l2_distance(public.halfvec, public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.l2_distance(public.halfvec, public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.l2_distance(public.halfvec, public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.l2_distance(public.halfvec, public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.l2_distance(public.halfvec, public.halfvec) TO service_role;


--
-- Name: FUNCTION l2_distance(public.sparsevec, public.sparsevec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.l2_distance(public.sparsevec, public.sparsevec) TO postgres;
GRANT ALL ON FUNCTION public.l2_distance(public.sparsevec, public.sparsevec) TO anon;
GRANT ALL ON FUNCTION public.l2_distance(public.sparsevec, public.sparsevec) TO authenticated;
GRANT ALL ON FUNCTION public.l2_distance(public.sparsevec, public.sparsevec) TO service_role;


--
-- Name: FUNCTION l2_distance(public.vector, public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.l2_distance(public.vector, public.vector) TO postgres;
GRANT ALL ON FUNCTION public.l2_distance(public.vector, public.vector) TO anon;
GRANT ALL ON FUNCTION public.l2_distance(public.vector, public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.l2_distance(public.vector, public.vector) TO service_role;


--
-- Name: FUNCTION l2_norm(public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.l2_norm(public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.l2_norm(public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.l2_norm(public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.l2_norm(public.halfvec) TO service_role;


--
-- Name: FUNCTION l2_norm(public.sparsevec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.l2_norm(public.sparsevec) TO postgres;
GRANT ALL ON FUNCTION public.l2_norm(public.sparsevec) TO anon;
GRANT ALL ON FUNCTION public.l2_norm(public.sparsevec) TO authenticated;
GRANT ALL ON FUNCTION public.l2_norm(public.sparsevec) TO service_role;


--
-- Name: FUNCTION l2_normalize(public.halfvec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.l2_normalize(public.halfvec) TO postgres;
GRANT ALL ON FUNCTION public.l2_normalize(public.halfvec) TO anon;
GRANT ALL ON FUNCTION public.l2_normalize(public.halfvec) TO authenticated;
GRANT ALL ON FUNCTION public.l2_normalize(public.halfvec) TO service_role;


--
-- Name: FUNCTION l2_normalize(public.sparsevec); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.l2_normalize(public.sparsevec) TO postgres;
GRANT ALL ON FUNCTION public.l2_normalize(public.sparsevec) TO anon;
GRANT ALL ON FUNCTION public.l2_normalize(public.sparsevec) TO authenticated;
GRANT ALL ON FUNCTION public.l2_normalize(public.sparsevec) TO service_role;


--
-- Name: FUNCTION l2_normalize(public.vector); Type: ACL; Schema: public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION public.l2_normalize(public.vector) TO postgres;
GRANT ALL ON FUNCTION public.l2_normalize(public.vector) TO anon;
GRANT ALL ON FUNCTION public.l2_normalize(public.vector) TO authenticated;
GRANT ALL ON FUNCTION public.l2_normalize(public.vector) TO service_role;


--
-- Name: FUNCTION log_audit_event(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.log_audit_event() TO anon;
GRANT ALL ON FUNCTION public.log_audit_event() TO authenticated;
GRANT ALL ON FUNCTION public.log_audit_event() TO service_role;


--
-- Name: FUNCTION log_comment_activity(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.log_comment_activity() TO anon;
GRANT ALL ON FUNCTION public.log_comment_activity() TO authenticated;
GRANT ALL ON FUNCTION public.log_comment_activity() TO service_role;


--
-- Name: FUNCTION log_feedback_process(p_feedback_id uuid, p_admin_id uuid, p_action character varying, p_old_value text, p_new_value text, p_details jsonb); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.log_feedback_process(p_feedback_id uuid, p_admin_id uuid, p_action character varying, p_old_value text, p_new_value text, p_details jsonb) TO anon;
GRANT ALL ON FUNCTION public.log_feedback_process(p_feedback_id uuid, p_admin_id uuid, p_action character varying, p_old_value text, p_new_value text, p_details jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.log_feedback_process(p_feedback_id uuid, p_admin_id uuid, p_action character varying, p_old_value text, p_new_value text, p_details jsonb) TO service_role;


--
-- Name: FUNCTION log_like_activity(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.log_like_activity() TO anon;
GRANT ALL ON FUNCTION public.log_like_activity() TO authenticated;
GRANT ALL ON FUNCTION public.log_like_activity() TO service_role;


--
-- Name: FUNCTION log_post_activity(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.log_post_activity() TO anon;
GRANT ALL ON FUNCTION public.log_post_activity() TO authenticated;
GRANT ALL ON FUNCTION public.log_post_activity() TO service_role;


--
-- Name: FUNCTION log_promotion_audit(p_application_id uuid, p_user_id uuid, p_action text, p_previous_status text, p_new_status text, p_notes text, p_reason text, p_performed_by uuid, p_changes jsonb); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.log_promotion_audit(p_application_id uuid, p_user_id uuid, p_action text, p_previous_status text, p_new_status text, p_notes text, p_reason text, p_performed_by uuid, p_changes jsonb) TO anon;
GRANT ALL ON FUNCTION public.log_promotion_audit(p_application_id uuid, p_user_id uuid, p_action text, p_previous_status text, p_new_status text, p_notes text, p_reason text, p_performed_by uuid, p_changes jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.log_promotion_audit(p_application_id uuid, p_user_id uuid, p_action text, p_previous_status text, p_new_status text, p_notes text, p_reason text, p_performed_by uuid, p_changes jsonb) TO service_role;


--
-- Name: FUNCTION mark_ai_feedback_as_read(p_feedback_id uuid, p_admin_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.mark_ai_feedback_as_read(p_feedback_id uuid, p_admin_id uuid) TO anon;
GRANT ALL ON FUNCTION public.mark_ai_feedback_as_read(p_feedback_id uuid, p_admin_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.mark_ai_feedback_as_read(p_feedback_id uuid, p_admin_id uuid) TO service_role;


--
-- Name: FUNCTION moderate_content(p_content_id uuid, p_content_type text, p_title text, p_description text, p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.moderate_content(p_content_id uuid, p_content_type text, p_title text, p_description text, p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.moderate_content(p_content_id uuid, p_content_type text, p_title text, p_description text, p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.moderate_content(p_content_id uuid, p_content_type text, p_title text, p_description text, p_user_id uuid) TO service_role;


--
-- Name: FUNCTION notify_ranking_participants(p_event_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.notify_ranking_participants(p_event_id uuid) TO anon;
GRANT ALL ON FUNCTION public.notify_ranking_participants(p_event_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.notify_ranking_participants(p_event_id uuid) TO service_role;


--
-- Name: FUNCTION on_creator_earning_insert_sync(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.on_creator_earning_insert_sync() TO anon;
GRANT ALL ON FUNCTION public.on_creator_earning_insert_sync() TO authenticated;
GRANT ALL ON FUNCTION public.on_creator_earning_insert_sync() TO service_role;


--
-- Name: FUNCTION on_submission_change_sync_participant(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.on_submission_change_sync_participant() TO anon;
GRANT ALL ON FUNCTION public.on_submission_change_sync_participant() TO authenticated;
GRANT ALL ON FUNCTION public.on_submission_change_sync_participant() TO service_role;


--
-- Name: FUNCTION on_task_completed_add_revenue(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.on_task_completed_add_revenue() TO anon;
GRANT ALL ON FUNCTION public.on_task_completed_add_revenue() TO authenticated;
GRANT ALL ON FUNCTION public.on_task_completed_add_revenue() TO service_role;


--
-- Name: FUNCTION on_work_view_add_revenue(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.on_work_view_add_revenue() TO anon;
GRANT ALL ON FUNCTION public.on_work_view_add_revenue() TO authenticated;
GRANT ALL ON FUNCTION public.on_work_view_add_revenue() TO service_role;


--
-- Name: FUNCTION pay_promotion_order(p_order_id uuid, p_payment_method text, p_transaction_id text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.pay_promotion_order(p_order_id uuid, p_payment_method text, p_transaction_id text) TO anon;
GRANT ALL ON FUNCTION public.pay_promotion_order(p_order_id uuid, p_payment_method text, p_transaction_id text) TO authenticated;
GRANT ALL ON FUNCTION public.pay_promotion_order(p_order_id uuid, p_payment_method text, p_transaction_id text) TO service_role;


--
-- Name: FUNCTION publish_final_ranking(p_event_id uuid, p_published_by uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.publish_final_ranking(p_event_id uuid, p_published_by uuid) TO anon;
GRANT ALL ON FUNCTION public.publish_final_ranking(p_event_id uuid, p_published_by uuid) TO authenticated;
GRANT ALL ON FUNCTION public.publish_final_ranking(p_event_id uuid, p_published_by uuid) TO service_role;


--
-- Name: FUNCTION publish_score(p_submission_id uuid, p_publish boolean, p_published_by uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.publish_score(p_submission_id uuid, p_publish boolean, p_published_by uuid) TO anon;
GRANT ALL ON FUNCTION public.publish_score(p_submission_id uuid, p_publish boolean, p_published_by uuid) TO authenticated;
GRANT ALL ON FUNCTION public.publish_score(p_submission_id uuid, p_publish boolean, p_published_by uuid) TO service_role;


--
-- Name: FUNCTION record_membership_history(p_user_id uuid, p_action_type character varying, p_from_level character varying, p_to_level character varying, p_order_id text, p_notes text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.record_membership_history(p_user_id uuid, p_action_type character varying, p_from_level character varying, p_to_level character varying, p_order_id text, p_notes text) TO anon;
GRANT ALL ON FUNCTION public.record_membership_history(p_user_id uuid, p_action_type character varying, p_from_level character varying, p_to_level character varying, p_order_id text, p_notes text) TO authenticated;
GRANT ALL ON FUNCTION public.record_membership_history(p_user_id uuid, p_action_type character varying, p_from_level character varying, p_to_level character varying, p_order_id text, p_notes text) TO service_role;


--
-- Name: FUNCTION record_promotion_click(p_promoted_work_id uuid, p_viewer_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.record_promotion_click(p_promoted_work_id uuid, p_viewer_id uuid) TO anon;
GRANT ALL ON FUNCTION public.record_promotion_click(p_promoted_work_id uuid, p_viewer_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.record_promotion_click(p_promoted_work_id uuid, p_viewer_id uuid) TO service_role;


--
-- Name: FUNCTION record_promotion_view(p_promoted_work_id uuid, p_viewer_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.record_promotion_view(p_promoted_work_id uuid, p_viewer_id uuid) TO anon;
GRANT ALL ON FUNCTION public.record_promotion_view(p_promoted_work_id uuid, p_viewer_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.record_promotion_view(p_promoted_work_id uuid, p_viewer_id uuid) TO service_role;


--
-- Name: FUNCTION record_search_history(p_user_id uuid, p_query text, p_search_type character varying, p_result_count integer, p_filters jsonb); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.record_search_history(p_user_id uuid, p_query text, p_search_type character varying, p_result_count integer, p_filters jsonb) TO anon;
GRANT ALL ON FUNCTION public.record_search_history(p_user_id uuid, p_query text, p_search_type character varying, p_result_count integer, p_filters jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.record_search_history(p_user_id uuid, p_query text, p_search_type character varying, p_result_count integer, p_filters jsonb) TO service_role;


--
-- Name: FUNCTION register_for_event_transaction(p_event_id uuid, p_user_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.register_for_event_transaction(p_event_id uuid, p_user_id uuid) TO anon;
GRANT ALL ON FUNCTION public.register_for_event_transaction(p_event_id uuid, p_user_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.register_for_event_transaction(p_event_id uuid, p_user_id uuid) TO service_role;


--
-- Name: FUNCTION rls_auto_enable(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.rls_auto_enable() TO anon;
GRANT ALL ON FUNCTION public.rls_auto_enable() TO authenticated;
GRANT ALL ON FUNCTION public.rls_auto_enable() TO service_role;


--
-- Name: FUNCTION save_ai_review(p_work_id uuid, p_work_type text, p_work_title text, p_work_description text, p_work_thumbnail text, p_prompt text, p_overall_score integer, p_cultural_fit jsonb, p_creativity jsonb, p_aesthetics jsonb, p_commercial_potential jsonb, p_highlights text[], p_suggestions text[]); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.save_ai_review(p_work_id uuid, p_work_type text, p_work_title text, p_work_description text, p_work_thumbnail text, p_prompt text, p_overall_score integer, p_cultural_fit jsonb, p_creativity jsonb, p_aesthetics jsonb, p_commercial_potential jsonb, p_highlights text[], p_suggestions text[]) TO anon;
GRANT ALL ON FUNCTION public.save_ai_review(p_work_id uuid, p_work_type text, p_work_title text, p_work_description text, p_work_thumbnail text, p_prompt text, p_overall_score integer, p_cultural_fit jsonb, p_creativity jsonb, p_aesthetics jsonb, p_commercial_potential jsonb, p_highlights text[], p_suggestions text[]) TO authenticated;
GRANT ALL ON FUNCTION public.save_ai_review(p_work_id uuid, p_work_type text, p_work_title text, p_work_description text, p_work_thumbnail text, p_prompt text, p_overall_score integer, p_cultural_fit jsonb, p_creativity jsonb, p_aesthetics jsonb, p_commercial_potential jsonb, p_highlights text[], p_suggestions text[]) TO service_role;


--
-- Name: FUNCTION save_ai_review(p_user_id uuid, p_work_id text, p_prompt text, p_ai_explanation text, p_overall_score integer, p_cultural_fit_score integer, p_creativity_score integer, p_aesthetics_score integer, p_commercial_potential_score integer, p_cultural_fit_details jsonb, p_creativity_details jsonb, p_aesthetics_details jsonb, p_suggestions jsonb, p_highlights jsonb, p_commercial_analysis jsonb, p_recommended_commercial_paths jsonb, p_related_activities jsonb, p_similar_works jsonb, p_work_thumbnail text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.save_ai_review(p_user_id uuid, p_work_id text, p_prompt text, p_ai_explanation text, p_overall_score integer, p_cultural_fit_score integer, p_creativity_score integer, p_aesthetics_score integer, p_commercial_potential_score integer, p_cultural_fit_details jsonb, p_creativity_details jsonb, p_aesthetics_details jsonb, p_suggestions jsonb, p_highlights jsonb, p_commercial_analysis jsonb, p_recommended_commercial_paths jsonb, p_related_activities jsonb, p_similar_works jsonb, p_work_thumbnail text) TO anon;
GRANT ALL ON FUNCTION public.save_ai_review(p_user_id uuid, p_work_id text, p_prompt text, p_ai_explanation text, p_overall_score integer, p_cultural_fit_score integer, p_creativity_score integer, p_aesthetics_score integer, p_commercial_potential_score integer, p_cultural_fit_details jsonb, p_creativity_details jsonb, p_aesthetics_details jsonb, p_suggestions jsonb, p_highlights jsonb, p_commercial_analysis jsonb, p_recommended_commercial_paths jsonb, p_related_activities jsonb, p_similar_works jsonb, p_work_thumbnail text) TO authenticated;
GRANT ALL ON FUNCTION public.save_ai_review(p_user_id uuid, p_work_id text, p_prompt text, p_ai_explanation text, p_overall_score integer, p_cultural_fit_score integer, p_creativity_score integer, p_aesthetics_score integer, p_commercial_potential_score integer, p_cultural_fit_details jsonb, p_creativity_details jsonb, p_aesthetics_details jsonb, p_suggestions jsonb, p_highlights jsonb, p_commercial_analysis jsonb, p_recommended_commercial_paths jsonb, p_related_activities jsonb, p_similar_works jsonb, p_work_thumbnail text) TO service_role;


--
-- Name: FUNCTION search_platform_knowledge(p_query text, p_category text, p_limit integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.search_platform_knowledge(p_query text, p_category text, p_limit integer) TO anon;
GRANT ALL ON FUNCTION public.search_platform_knowledge(p_query text, p_category text, p_limit integer) TO authenticated;
GRANT ALL ON FUNCTION public.search_platform_knowledge(p_query text, p_category text, p_limit integer) TO service_role;

