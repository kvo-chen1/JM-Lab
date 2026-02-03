
import { historyService } from '../historyService';
import { supabase } from '@/lib/supabaseClient';

// Mock Supabase
jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: jest.fn()
    },
    from: jest.fn()
  }
}));

// Mock Crypto
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-session-id',
    subtle: {
      digest: jest.fn().mockResolvedValue(new ArrayBuffer(32))
    }
  }
});

// Mock TextEncoder
if (typeof TextEncoder === 'undefined') {
    (global as any).TextEncoder = class {
        encode(str: string) { return new Uint8Array(str.length); }
    };
}

// Mock IndexedDB
const indexedDBMock = {
  open: jest.fn().mockImplementation(() => {
    const request: any = {
      result: {
        createObjectStore: jest.fn().mockReturnValue({
          createIndex: jest.fn()
        }),
        transaction: jest.fn().mockReturnValue({
          objectStore: jest.fn().mockReturnValue({
            add: jest.fn().mockImplementation(() => {
                const req: any = {};
                setTimeout(() => req.onsuccess && req.onsuccess(), 0);
                return req;
            }),
            getAll: jest.fn().mockImplementation(() => {
                const req: any = { result: [] };
                setTimeout(() => req.onsuccess && req.onsuccess(), 0);
                return req;
            }),
            delete: jest.fn(),
            openCursor: jest.fn().mockImplementation(() => {
                const req: any = {};
                setTimeout(() => req.onsuccess && req.onsuccess({ target: { result: null } }), 0); // End cursor
                return req;
            })
          })
        }),
        objectStoreNames: {
            contains: jest.fn().mockReturnValue(true)
        }
      }
    };
    
    // Simulate async success
    setTimeout(() => {
      if (request.onsuccess) {
        request.onsuccess({ target: request });
      }
    }, 0);
    
    return request;
  })
};
Object.defineProperty(window, 'indexedDB', { value: indexedDBMock });

describe('HistoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'test-user-id' } }
    });
    // Reset session storage
    sessionStorage.clear();
  });

  it('should record history successfully', async () => {
    const insertMock = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({
      insert: insertMock
    });

    await historyService.record('test_action', { foo: 'bar' });

    expect(supabase.from).toHaveBeenCalledWith('user_history');
    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'test-user-id',
      action_type: 'test_action',
      content: { foo: 'bar' }
    }));
  });

  it('should use provided userId if available', async () => {
    const insertMock = jest.fn().mockResolvedValue({ error: null });
    (supabase.from as jest.Mock).mockReturnValue({
      insert: insertMock
    });

    await historyService.record('test_action', { foo: 'bar' }, 'explicit-user-id');

    expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
      user_id: 'explicit-user-id'
    }));
  });
});
