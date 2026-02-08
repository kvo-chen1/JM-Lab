import { useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return {
    user: context.user,
    isAuthenticated: context.isAuthenticated,
    login: context.login,
    logout: context.logout,
    register: context.register,
    updateUser: context.updateUser,
    isLoading: context.isLoading,
  };
}

export default useAuth;
