
INSERT INTO public.users (id, email, username, role, created_at, updated_at)
VALUES (
  '32505ad9-c738-46ca-b92e-9859eec7666e',
  'user_32505ad9@example.com', -- Placeholder email
  'Current User',
  'user',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;
