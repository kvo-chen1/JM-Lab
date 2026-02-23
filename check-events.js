import { supabase } from './src/lib/supabase.ts';

async function checkEvents() {
  try {
    console.log('Checking events table...');
    
    // 查询所有活动
    const { data: events, error } = await supabase
      .from('events')
      .select('id, title, brand_id, organizer_id');
    
    if (error) {
      console.error('Error fetching events:', error);
      return;
    }
    
    console.log(`Found ${events.length} events:`);
    events.forEach(event => {
      console.log(`- Event ${event.id}: ${event.title}`);
      console.log(`  Brand ID: ${event.brand_id || 'null'}`);
      console.log(`  Organizer ID: ${event.organizer_id}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

checkEvents();
