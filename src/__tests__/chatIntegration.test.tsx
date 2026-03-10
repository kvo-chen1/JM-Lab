import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '@/contexts/authContext';
import { useChatStore } from '@/stores/chatStore';
import Square from '@/pages/Square';

// Mock dependencies
jest.mock('@/stores/chatStore');
jest.mock('@/services/postService');
jest.mock('@/lib/apiClient');
jest.mock('@/mock/works');

const mockUseChatStore = useChatStore as jest.MockedFunction<typeof useChatStore>;

describe('Chat Integration Tests', () => {
  const mockUser = {
    id: 'user-1',
    username: 'Test User',
    avatar_url: 'https://example.com/avatar.jpg'
  };

  const mockMessages = [
    {
      id: 'msg-1',
      sender_id: 'user-2',
      content: 'Hello from another user!',
      status: 'sent',
      type: 'text',
      created_at: new Date().toISOString(),
      sender: {
        id: 'user-2',
        username: 'Another User',
        avatar_url: 'https://example.com/avatar2.jpg'
      }
    },
    {
      id: 'msg-2',
      sender_id: 'user-1',
      content: 'Hello back!',
      status: 'read',
      type: 'text',
      created_at: new Date().toISOString(),
      sender: mockUser
    }
  ];

  const mockChatStore = {
    messages: mockMessages,
    isLoading: false,
    error: null,
    sendMessage: jest.fn().mockResolvedValue(mockMessages[1]),
    sendCrossPageMessage: jest.fn().mockResolvedValue(mockMessages[1]),
    subscribeToCrossPageMessages: jest.fn(),
    unsubscribeCrossPage: jest.fn(),
    resendFailedMessages: jest.fn().mockResolvedValue(undefined),
    updateMessageStatus: jest.fn(),
    setActiveChannel: jest.fn(),
    fetchMessages: jest.fn().mockResolvedValue(undefined),
    addMessage: jest.fn(),
    setMessages: jest.fn(),
    subscribeToChannel: jest.fn(),
    unsubscribe: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseChatStore.mockReturnValue(mockChatStore as any);
  });

  test('renders chat button on Square page', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Square />
        </AuthProvider>
      </BrowserRouter>
    );

    // Check if chat button is rendered
    const chatButton = screen.getByRole('button', { name: /comments/i });
    expect(chatButton).toBeInTheDocument();
  });

  test('opens chat interface when chat button is clicked', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Square />
        </AuthProvider>
      </BrowserRouter>
    );

    // Click chat button
    const chatButton = screen.getByRole('button', { name: /comments/i });
    fireEvent.click(chatButton);

    // Check if chat interface is open
    expect(screen.getByText('社区聊天')).toBeInTheDocument();
    expect(screen.getByText('实时消息')).toBeInTheDocument();
  });

  test('displays messages in chat interface', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Square />
        </AuthProvider>
      </BrowserRouter>
    );

    // Open chat interface
    const chatButton = screen.getByRole('button', { name: /comments/i });
    fireEvent.click(chatButton);

    // Check if messages are displayed
    expect(screen.getByText('Hello from another user!')).toBeInTheDocument();
    expect(screen.getByText('Hello back!')).toBeInTheDocument();
  });

  test('sends message when form is submitted', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Square />
        </AuthProvider>
      </BrowserRouter>
    );

    // Open chat interface
    const chatButton = screen.getByRole('button', { name: /comments/i });
    fireEvent.click(chatButton);

    // Type message
    const messageInput = screen.getByPlaceholderText('发送消息到社区...');
    fireEvent.change(messageInput, { target: { value: 'Test message' } });

    // Submit message
    const sendButton = screen.getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);

    // Wait for message to be sent
    await waitFor(() => {
      expect(mockChatStore.sendMessage).toHaveBeenCalledWith('user-1', 'Test message', expect.any(Object));
      expect(mockChatStore.sendCrossPageMessage).toHaveBeenCalledWith('user-1', 'Test message', 'community', expect.any(Object));
    });
  });

  test('shows message status indicators', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Square />
        </AuthProvider>
      </BrowserRouter>
    );

    // Open chat interface
    const chatButton = screen.getByRole('button', { name: /comments/i });
    fireEvent.click(chatButton);

    // Check if message status indicators are displayed
    expect(screen.getByText('Hello from another user!')).toBeInTheDocument();
    expect(screen.getByText('Hello back!')).toBeInTheDocument();
  });

  test('handles failed messages', async () => {
    // Update mock to include a failed message
    const failedMessage = {
      ...mockMessages[1],
      status: 'failed'
    };

    mockUseChatStore.mockReturnValue({
      ...mockChatStore,
      messages: [mockMessages[0], failedMessage]
    } as any);

    render(
      <BrowserRouter>
        <AuthProvider>
          <Square />
        </AuthProvider>
      </BrowserRouter>
    );

    // Open chat interface
    const chatButton = screen.getByRole('button', { name: /comments/i });
    fireEvent.click(chatButton);

    // Check if failed message indicator is displayed
    expect(screen.getByText('部分消息发送失败')).toBeInTheDocument();

    // Click retry button
    const retryButton = screen.getByText('重试');
    fireEvent.click(retryButton);

    // Wait for retry to be called
    await waitFor(() => {
      expect(mockChatStore.resendFailedMessages).toHaveBeenCalled();
    });
  });

  test('shows new message notification', () => {
    // Update mock to include unread messages
    const unreadMessage = {
      ...mockMessages[0],
      status: 'sent'
    };

    mockUseChatStore.mockReturnValue({
      ...mockChatStore,
      messages: [unreadMessage, mockMessages[1]]
    } as any);

    render(
      <BrowserRouter>
        <AuthProvider>
          <Square />
        </AuthProvider>
      </BrowserRouter>
    );

    // Check if new message notification is displayed
    expect(screen.getByText('1')).toBeInTheDocument();
  });
});
