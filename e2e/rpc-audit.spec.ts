import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Load env vars
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY; // Use service role if available for cleanup, else anon

if (!supabaseUrl || !supabaseKey) {
  console.warn('Skipping RPC tests: Supabase credentials not found');
} else {
  const supabase = createClient(supabaseUrl, supabaseKey);

  test.describe('Supabase RPC & Transaction Consistency', () => {
    let testUserId: string;

    test.beforeAll(async () => {
      // Create a temp user for testing
      const email = `test_rpc_${Date.now()}@example.com`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password: 'Password123!',
      });
      if (error) throw error;
      testUserId = data.user!.id;
    });

    test('should execute create_post_transaction RPC successfully', async () => {
      // 1. Get initial stats
      const { data: userBefore } = await supabase
        .from('users')
        .select('posts_count')
        .eq('id', testUserId)
        .single();
      
      const initialCount = userBefore?.posts_count || 0;

      // 2. Call RPC
      const { data: post, error } = await supabase.rpc('create_post_transaction', {
        p_title: 'RPC Test Post',
        p_content: 'Content created via RPC transaction',
        p_community_id: null, // Optional
        p_author_id: testUserId,
        p_images: []
      });

      expect(error).toBeNull();
      expect(post).toBeDefined();
      expect(post.id).toBeDefined();
      expect(post.title).toBe('RPC Test Post');

      // 3. Verify User Stats incremented (Transaction check)
      const { data: userAfter } = await supabase
        .from('users')
        .select('posts_count')
        .eq('id', testUserId)
        .single();
      
      expect(userAfter?.posts_count).toBe(initialCount + 1);
    });

    test.afterAll(async () => {
      // Cleanup
      if (testUserId) {
        // Only works if using service_role key, otherwise RLS might block deleting user
        await supabase.from('users').delete().eq('id', testUserId);
      }
    });
  });
}
