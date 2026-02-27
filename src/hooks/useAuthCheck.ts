import { useState, useCallback, useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';

interface UseAuthCheckReturn {
  isLoginModalOpen: boolean;
  openLoginModal: (title?: string, description?: string) => void;
  closeLoginModal: () => void;
  checkAuth: () => boolean;
  loginModalTitle: string;
  loginModalDescription: string;
}

export function useAuthCheck(): UseAuthCheckReturn {
  const { isAuthenticated } = useContext(AuthContext);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginModalTitle, setLoginModalTitle] = useState('需要登录');
  const [loginModalDescription, setLoginModalDescription] = useState('请先登录后再进行此操作');

  const openLoginModal = useCallback((title?: string, description?: string) => {
    if (title) setLoginModalTitle(title);
    if (description) setLoginModalDescription(description);
    setIsLoginModalOpen(true);
  }, []);

  const closeLoginModal = useCallback(() => {
    setIsLoginModalOpen(false);
  }, []);

  const checkAuth = useCallback((): boolean => {
    if (!isAuthenticated) {
      openLoginModal();
      return false;
    }
    return true;
  }, [isAuthenticated, openLoginModal]);

  return {
    isLoginModalOpen,
    openLoginModal,
    closeLoginModal,
    checkAuth,
    loginModalTitle,
    loginModalDescription
  };
}
