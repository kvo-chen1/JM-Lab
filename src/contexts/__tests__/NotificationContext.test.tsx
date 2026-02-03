import React, { useEffect } from 'react';
import { render } from '@testing-library/react';
import { NotificationProvider, useNotifications } from '@/contexts/NotificationContext';

jest.mock('sonner', () => ({
  toast: {
    info: jest.fn(),
    warning: jest.fn(),
  },
}));

import { toast } from 'sonner';

function TriggerNotification({ priority }: { priority: 'low' | 'high' }) {
  const { addNotification } = useNotifications();

  useEffect(() => {
    addNotification({
      type: 'member_joined',
      title: '新成员加入',
      content: 'test-user 加入了社群',
      senderId: 'user-1',
      senderName: 'test-user',
      recipientId: 'user-2',
      communityId: 'community-1',
      priority,
      link: '/community',
    });
  }, [addNotification, priority]);

  return null;
}

describe('NotificationContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('addNotification uses toast.info with string title and options', () => {
    render(
      <NotificationProvider>
        <TriggerNotification priority="low" />
      </NotificationProvider>
    );

    expect(toast.info).toHaveBeenCalledTimes(1);
    const [firstArg, secondArg] = (toast.info as jest.Mock).mock.calls[0];
    expect(typeof firstArg).toBe('string');
    expect(secondArg).toEqual(
      expect.objectContaining({
        description: expect.any(String),
        duration: expect.any(Number),
        action: expect.objectContaining({
          label: expect.any(String),
          onClick: expect.any(Function),
        }),
      })
    );
  });

  test('addNotification uses toast.warning for high priority', () => {
    render(
      <NotificationProvider>
        <TriggerNotification priority="high" />
      </NotificationProvider>
    );

    expect(toast.warning).toHaveBeenCalledTimes(1);
    const [firstArg] = (toast.warning as jest.Mock).mock.calls[0];
    expect(typeof firstArg).toBe('string');
  });
});

