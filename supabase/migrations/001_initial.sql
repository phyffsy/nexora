-- Execute no SQL Editor do Supabase, uma única vez.
create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,24}$'),
  display_name text not null check (char_length(display_name) between 1 and 80),
  avatar_url text,
  bio text check (char_length(bio) <= 240),
  created_at timestamptz not null default now()
);
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'direct' check (kind = 'direct'),
  direct_key text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (conversation_id,user_id)
);
create index conversation_members_user_idx on public.conversation_members(user_id,conversation_id);
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz
);
create index messages_conversation_created_idx on public.messages(conversation_id,created_at desc);

create or replace function public.on_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id,username,display_name)
  values(new.id,'user_' || substr(replace(new.id::text,'-',''),1,16),coalesce(nullif(left(new.raw_user_meta_data->>'full_name',80),''),'Usuário'));
  return new;
end; $$;
create trigger auth_user_profile after insert on auth.users for each row execute procedure public.on_new_user();

create or replace function public.is_conversation_member(cid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.conversation_members where conversation_id = cid and user_id = (select auth.uid()));
$$;
revoke all on function public.is_conversation_member(uuid) from public;
grant execute on function public.is_conversation_member(uuid) to authenticated;

create or replace function public.create_direct_conversation(other_user uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare current_user_id uuid := auth.uid(); cid uuid; dkey text;
begin
 if current_user_id is null or other_user is null or current_user_id = other_user then raise exception 'Contato inválido'; end if;
 if not exists(select 1 from public.profiles where id = other_user) then raise exception 'Usuário não encontrado'; end if;
 dkey := least(current_user_id::text,other_user::text) || ':' || greatest(current_user_id::text,other_user::text);
 insert into public.conversations(direct_key) values(dkey)
 on conflict(direct_key) do update set direct_key = excluded.direct_key
 returning id into cid;
 insert into public.conversation_members(conversation_id,user_id) values(cid,current_user_id),(cid,other_user) on conflict do nothing;
 return cid;
end; $$;
revoke all on function public.create_direct_conversation(uuid) from public;
grant execute on function public.create_direct_conversation(uuid) to authenticated;

create or replace function public.bump_conversation() returns trigger language plpgsql security definer set search_path = '' as $$
begin update public.conversations set updated_at = now() where id = new.conversation_id; return new; end; $$;
create trigger bump_on_message after insert on public.messages for each row execute procedure public.bump_conversation();

alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;
create policy profiles_read on public.profiles for select to authenticated using (true);
create policy profiles_update on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy conversations_read on public.conversations for select to authenticated using (public.is_conversation_member(id));
create policy memberships_read on public.conversation_members for select to authenticated using (public.is_conversation_member(conversation_id));
create policy messages_read on public.messages for select to authenticated using (public.is_conversation_member(conversation_id));
create policy messages_write on public.messages for insert to authenticated with check (sender_id = (select auth.uid()) and public.is_conversation_member(conversation_id) and deleted_at is null and edited_at is null);
-- Etapa 1: edições e exclusões não estão expostas; políticas futuras terão regras próprias.
revoke update, delete on public.messages from anon, authenticated;
revoke insert, update, delete on public.conversations, public.conversation_members from anon, authenticated;

-- Permite entrega de eventos INSERT pelo Supabase Realtime, aplicando RLS aos assinantes.
alter publication supabase_realtime add table public.messages;
