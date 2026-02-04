
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface UserPresence {
  user_id: string;
  username?: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  last_seen: string;
  online_at: string;
}

class PresenceService {
  private channel: RealtimeChannel | null = null;
  private onlineUsers: Map<string, UserPresence> = new Map();
  private listeners: Set<(users: UserPresence[]) => void> = new Set();
  private userId: string | null = null;

  initialize(user: { id: string; username?: string; avatar?: string }) {
    if (this.userId === user.id && this.channel) return;
    this.userId = user.id;

    if (this.channel) {
      this.channel.unsubscribe();
    }

    this.channel = supabase.channel('global_presence', {
      config: {
        presence: {
          key: user.id,
        },
      },
    });

    this.channel
      .on('presence', { event: 'sync' }, () => {
        const state = this.channel?.presenceState() || {};
        this.updateOnlineUsers(state);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        // console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status, err) => {
        if (status === 'SUBSCRIBED') {
          await this.channel?.track({
            user_id: user.id,
            username: user.username || 'User',
            avatar: user.avatar || '',
            status: 'online',
            online_at: new Date().toISOString(),
            last_seen: new Date().toISOString()
          });
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('Presence channel error:', status, err);
          // 简单的重连逻辑
          setTimeout(() => {
            console.log('Attempting to reconnect presence channel...');
            this.reconnect(user);
          }, 5000);
        }
      });
  }

  async reconnect(user: { id: string; username?: string; avatar?: string }) {
    await this.cleanup();
    this.initialize(user);
  }

  private updateOnlineUsers(state: Record<string, any[]>) {
    this.onlineUsers.clear();
    Object.values(state).forEach((presences) => {
      presences.forEach((presence: any) => {
        if (presence.user_id) {
          this.onlineUsers.set(presence.user_id, {
            user_id: presence.user_id,
            username: presence.username,
            avatar: presence.avatar,
            status: presence.status || 'online',
            last_seen: presence.last_seen || new Date().toISOString(),
            online_at: presence.online_at || new Date().toISOString()
          });
        }
      });
    });
    this.notifyListeners();
  }

  subscribe(callback: (users: UserPresence[]) => void) {
    this.listeners.add(callback);
    callback(Array.from(this.onlineUsers.values()));
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners() {
    const users = Array.from(this.onlineUsers.values());
    this.listeners.forEach((listener) => listener(users));
  }

  getOnlineUsers() {
    return Array.from(this.onlineUsers.values());
  }

  isUserOnline(userId: string) {
    return this.onlineUsers.has(userId);
  }

  async cleanup() {
    if (this.channel) {
      await this.channel.unsubscribe();
      this.channel = null;
    }
    this.userId = null;
    this.onlineUsers.clear();
  }
}

export const presenceService = new PresenceService();
