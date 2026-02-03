
import { useEffect, useState, useContext } from 'react';
import { presenceService, UserPresence } from '../services/presenceService';
import { AuthContext } from '../contexts/authContext';

export const usePresence = () => {
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const { user } = useContext(AuthContext);

  // Initialize service when user changes
  useEffect(() => {
    if (user?.id) {
      presenceService.initialize({
        id: user.id,
        username: user.username,
        avatar: user.avatar
      });
    }
    return () => {
      // We don't necessarily want to cleanup on unmount of the hook, 
      // as other components might be using it.
      // Cleanup should happen on logout or app unmount.
    };
  }, [user?.id, user?.username, user?.avatar]);

  useEffect(() => {
    const unsubscribe = presenceService.subscribe((users) => {
      setOnlineUsers(users);
    });
    return unsubscribe;
  }, []);

  const isUserOnline = (userId: string) => {
    return onlineUsers.some(u => u.user_id === userId);
  };

  return { onlineUsers, isUserOnline };
};
