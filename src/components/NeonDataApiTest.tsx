import React, { useState, useEffect } from 'react';
import { neonDataApiService } from '../services/neonDataApiService';

const NeonDataApiTest: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const data = await neonDataApiService.getTableData('users', {
          select: '*',
          limit: 5
        });
        setUsers(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch users');
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Neon Data API Test</h2>
      
      {loading && <p className="text-gray-600">Loading users...</p>}
      
      {error && <p className="text-red-500 mb-4">Error: {error}</p>}
      
      {!loading && !error && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Users:</h3>
          <ul className="space-y-2">
            {users.map((user, index) => (
              <li key={user.id || index} className="p-2 border rounded">
                <div className="font-medium">{user.username || 'Unknown User'}</div>
                <div className="text-sm text-gray-600">{user.email || 'No email'}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default NeonDataApiTest;
