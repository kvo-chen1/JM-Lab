
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
    // Realtime 功能已禁用 - 本地开发环境不支持 WebSocket
    // Realtime disabled - WebSocket not supported in local dev environment
    if (this.userId === user.id) return;
    this.userId = user.id;
    console.log('[PresenceService] Realtime presence skipped (not supported in local environment)');
  }

  async reconnect(user: { id: string; username?: string; avatar?: string }) {
    // Realtime 功能已禁用
    console.log('[PresenceService] Reconnect skipped (realtime not supported)');
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
