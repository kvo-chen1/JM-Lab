# Data Integrity & Real-time Architecture

## 1. Data Source Truth
All frontend components and dashboards now fetch data exclusively from real-time APIs.
- **Mock Data**: Explicitly disabled (`src/config/mockDataConfig.ts`).
- **Caching**: Disabled for critical user data (User Profile, Wallet, Stats) in `UserService` (`src/services/apiService.ts`).
- **Implementation**: `useCreateStore` and `CanvasArea` refactored to use `apiService` instead of local simulation.

## 2. End-to-End Consistency
- **Authentication**: All API requests carry `Authorization: Bearer <token>` via `DataConsistencyCheck` middleware.
- **Verification**: `X-Request-Signature` and `X-Request-Timestamp` are included in all requests for tamper-proofing.
- **Middleware**: `src/lib/setupApi.ts` registers a consistency check middleware to enforce identity headers.

## 3. Audit Logging
Every critical write operation is logged to the backend audit system via `historyService`.
- **Scope**:
  - Work Creation (`create_work`)
  - Event Submission (`submit_event_work`)
  - Event Registration (`register_event`)
  - Community Publishing (`publish_work_community`)
  - Explore Publishing (`publish_work_explore`)
  - Likes/Comments (`like_work`, `comment_work`)
- **Storage**: Logs are synced to Supabase `user_history` table.

## 4. Monitoring & Verification Plan
- **Real-time Monitoring**: Backend logs (`backendLogService`) should be ingested by a monitoring system (e.g., ELK, Splunk) to detect anomalies (e.g., >100 updates/min per user).
- **Sampling Verification**:
  - A script `scripts/verify-data-integrity.js` (recommended) should be run periodically.
  - Logic: Fetch 10% of active users -> Compare `frontend_view_data` (simulated fetch) vs `db_row`.

## 5. Development Guidelines
- **No Mocks**: Do not use `setTimeout` or local state to simulate server success. Always await `apiService` calls.
- **No Client Cache for Status**: User status (VIP, Balance, etc.) must always be fresh. Use `{ cache: { enabled: false } }`.
