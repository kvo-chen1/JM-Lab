
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Setup Supabase Client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Skipping Full System Tests: Supabase credentials not found');
} else {
  const supabase = createClient(supabaseUrl, supabaseKey);

  test.describe('Core Modules Integration Test', () => {
    let testUserId: string;

    test.beforeAll(async () => {
      // 1. Create Test User
      const email = `test_full_${Date.now()}@example.com`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password: 'Password123!',
      });
      if (error) throw error;
      testUserId = data.user!.id;
    });

    test('Analytics Module: Real Data Access', async () => {
      // 1. Create some interactions
      await supabase.from('posts').insert({
        author_id: testUserId,
        title: 'Analytics Test Post',
        content: 'Testing analytics data flow',
        status: 'published'
      });

      // 2. Query Analytics (Simulate Service Logic)
      const { data: posts } = await supabase
        .from('posts')
        .select('id')
        .eq('author_id', testUserId);
      
      expect(posts?.length).toBeGreaterThan(0);
    });

    test('Event Module: Concurrency Registration', async () => {
      // 1. Create Event
      const { data: event } = await supabase.from('events').insert({
        title: 'Concurrency Test Event',
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 86400000).toISOString(),
        location: 'Online',
        organizer_id: testUserId,
        max_participants: 1
      }).select().single();

      expect(event).toBeDefined();

      // 2. Register (RPC Transaction)
      const { data: result, error } = await supabase.rpc('register_for_event_transaction', {
        p_event_id: event.id,
        p_user_id: testUserId
      });

      expect(error).toBeNull();
      expect(result.success).toBe(true);

      // 3. Try Register Again (Should Fail)
      const { data: result2, error: error2 } = await supabase.rpc('register_for_event_transaction', {
        p_event_id: event.id,
        p_user_id: testUserId
      });
      
      // Depending on RPC implementation, it might throw error or return success: false
      if (error2) {
        expect(error2.message).toContain('already registered');
      } else {
        expect(result2.success).toBe(false);
      }
    });

    test('Creation Center: Draft Sync', async () => {
      // 1. Create Draft via API (Simulating Cloud Sync)
      const draftId = `draft_${Date.now()}`;
      const { error } = await supabase.from('drafts').insert({
        id: draftId,
        user_id: testUserId,
        title: 'Cloud Sync Draft',
        content: 'This is synced content'
      });
      expect(error).toBeNull();

      // 2. Verify existence
      const { data: draft } = await supabase
        .from('drafts')
        .select('*')
        .eq('id', draftId)
        .single();
      
      expect(draft.title).toBe('Cloud Sync Draft');
    });

    test.afterAll(async () => {
      // Cleanup
      if (testUserId) {
        // Cascade delete should handle related data if set up, otherwise manual cleanup
        await supabase.from('users').delete().eq('id', testUserId);
      }
    });
  });
}
