create table if not exists bookmarks (
  user_id uuid references public.users(id) on delete cascade,
  post_id integer references public.posts(id) on delete cascade,
  created_at timestamp with time zone default now(),
  primary key (user_id, post_id)
);
