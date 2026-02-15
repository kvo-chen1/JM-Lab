import { supabase } from '@/lib/supabase';

export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: number;
  endDate: number;
  location?: string;
  organizerId?: string;
  requirements?: string;
  rewards?: string;
  visibility: string;
  status: string;
  registrationDeadline?: number;
  reviewStartDate?: number; // 评审开始时间
  resultDate?: number; // 结果公布时间
  phaseStatus?: string; // 活动阶段状态: registration, review, completed
  maxParticipants?: number;
  createdAt: number;
  updatedAt: number;
  publishedAt?: number;
  imageUrl?: string;
  category?: string;
  tags: string[];
  platformEventId?: string;
}

export const eventService = {
  // Get all published events
  async getPublishedEvents(): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('visibility', 'public')
      .eq('status', 'published')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch events:', error);
      return [];
    }

    return (data || []).map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      startDate: item.start_date,
      endDate: item.end_date,
      location: item.location,
      organizerId: item.organizer_id,
      requirements: item.requirements,
      rewards: item.rewards,
      visibility: item.visibility,
      status: item.status,
      registrationDeadline: item.registration_deadline,
      reviewStartDate: item.review_start_date,
      resultDate: item.result_date,
      phaseStatus: item.phase_status,
      maxParticipants: item.max_participants,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      publishedAt: item.published_at,
      imageUrl: item.image_url,
      category: item.category,
      tags: item.tags || [],
      platformEventId: item.platform_event_id
    }));
  },

  // Get a single event by ID
  async getEventById(eventId: string): Promise<Event | null> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (error || !data) {
      console.error('Failed to fetch event:', error);
      return null;
    }

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      startDate: data.start_date,
      endDate: data.end_date,
      location: data.location,
      organizerId: data.organizer_id,
      requirements: data.requirements,
      rewards: data.rewards,
      visibility: data.visibility,
      status: data.status,
      registrationDeadline: data.registration_deadline,
      reviewStartDate: data.review_start_date,
      resultDate: data.result_date,
      phaseStatus: data.phase_status,
      maxParticipants: data.max_participants,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      publishedAt: data.published_at,
      imageUrl: data.image_url,
      category: data.category,
      tags: data.tags || [],
      platformEventId: data.platform_event_id
    };
  },

  // Format event for display
  formatEventForDisplay(event: Event): {
    id: string;
    title: string;
    desc: string;
    deadline: string;
    organizer: string;
    prize: string;
    status: 'ongoing' | 'upcoming' | 'ended';
    category: string;
  } {
    const now = Date.now();
    const endDate = event.endDate;
    const startDate = event.startDate;
    
    let status: 'ongoing' | 'upcoming' | 'ended' = 'ongoing';
    if (now > endDate) {
      status = 'ended';
    } else if (now < startDate) {
      status = 'upcoming';
    }

    return {
      id: event.id,
      title: event.title,
      desc: event.description,
      deadline: new Date(endDate).toISOString().split('T')[0],
      organizer: '津脉平台',
      prize: event.rewards || '丰厚奖品',
      status,
      category: event.category || '创意活动'
    };
  }
};
