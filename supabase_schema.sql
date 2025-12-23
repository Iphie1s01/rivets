-- Create Projects Table
create table projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text not null default 'New Project',
  current_code text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create Messages Table
create table messages (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table projects enable row level security;
alter table messages enable row level security;

-- Policies for Projects
create policy "Users can view their own projects" 
  on projects for select 
  using (auth.uid() = user_id);

create policy "Users can insert their own projects" 
  on projects for insert 
  with check (auth.uid() = user_id);

create policy "Users can update their own projects" 
  on projects for update 
  using (auth.uid() = user_id);

create policy "Users can delete their own projects" 
  on projects for delete 
  using (auth.uid() = user_id);

-- Policies for Messages
create policy "Users can view messages for their projects" 
  on messages for select 
  using (exists (
    select 1 from projects 
    where projects.id = messages.project_id 
    and projects.user_id = auth.uid()
  ));

create policy "Users can insert messages for their projects" 
  on messages for insert 
  with check (exists (
    select 1 from projects 
    where projects.id = messages.project_id 
    and projects.user_id = auth.uid()
  ));
