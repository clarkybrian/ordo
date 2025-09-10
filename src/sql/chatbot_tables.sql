-- Table pour stocker les messages du chatbot
create table if not exists public.chatbot_messages (
  id uuid not null primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  content text not null,
  is_user boolean not null default false,
  created_at timestamp with time zone not null default now(),
  session_id uuid not null -- Pour regrouper les messages par conversation
);

-- Créer un index pour accélérer la recherche par utilisateur
create index if not exists chatbot_messages_user_id_idx on public.chatbot_messages (user_id);

-- Créer un index pour accélérer la recherche par session
create index if not exists chatbot_messages_session_id_idx on public.chatbot_messages (session_id);

-- Enable RLS
alter table public.chatbot_messages enable row level security;

-- Créer des politiques pour sécuriser la table
create policy "Users can view their own messages" 
  on public.chatbot_messages for select 
  using (auth.uid() = user_id);

create policy "Users can insert their own messages" 
  on public.chatbot_messages for insert 
  with check (auth.uid() = user_id);

-- Cette table ne devrait pas être modifiable une fois créée
create policy "Messages cannot be updated" 
  on public.chatbot_messages for update 
  using (false);

-- Table pour stocker les sessions du chatbot
create table if not exists public.chatbot_sessions (
  id uuid not null primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- Créer un index pour accélérer la recherche par utilisateur
create index if not exists chatbot_sessions_user_id_idx on public.chatbot_sessions (user_id);

-- Enable RLS
alter table public.chatbot_sessions enable row level security;

-- Créer des politiques pour sécuriser la table
create policy "Users can view their own sessions" 
  on public.chatbot_sessions for select 
  using (auth.uid() = user_id);

create policy "Users can insert their own sessions" 
  on public.chatbot_sessions for insert 
  with check (auth.uid() = user_id);

create policy "Users can update their own sessions" 
  on public.chatbot_sessions for update 
  using (auth.uid() = user_id);

create policy "Users can delete their own sessions" 
  on public.chatbot_sessions for delete 
  using (auth.uid() = user_id);

-- Fonction pour mettre à jour la date de mise à jour
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger pour mettre à jour la date de mise à jour automatiquement
create trigger set_updated_at
  before update on public.chatbot_sessions
  for each row
  execute procedure public.handle_updated_at();
