-- HOMORA foundation schema. Apply with Supabase CLI or the SQL editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  username text unique check (username is null or username ~ '^[a-zA-Z0-9_.-]{2,30}$'),
  avatar_url text,
  bio text check (bio is null or char_length(bio) <= 500),
  city text,
  role text not null default 'buyer' check (role in ('buyer','seller','agent','business')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.create_profile_for_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile after insert on auth.users
for each row execute procedure public.create_profile_for_user();

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(title) between 5 and 120),
  description text not null check (char_length(description) between 10 and 8000),
  transaction_type text not null check (transaction_type in ('buy','rent')),
  property_type text not null check (property_type in ('house','apartment','land','commercial','office','shop','other')),
  price numeric(14,2) not null check (price > 0),
  currency text not null default 'GBP' check (currency ~ '^[A-Z]{3}$'),
  city text not null check (char_length(city) between 1 and 100),
  neighborhood text check (neighborhood is null or char_length(neighborhood) <= 100),
  bedrooms integer check (bedrooms is null or bedrooms >= 0),
  bathrooms integer check (bathrooms is null or bathrooms >= 0),
  size_sqft integer check (size_sqft is null or size_sqft > 0),
  amenities text[] not null default '{}',
  image_urls text[] not null default '{}',
  video_url text,
  status text not null default 'pending_review' check (status in ('draft','pending_review','published','under_offer','rented','sold','unavailable')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists properties_public_search_idx on public.properties(status, transaction_type, property_type, price, created_at desc);
create index if not exists properties_city_idx on public.properties using gin (to_tsvector('simple', coalesce(city,'') || ' ' || coalesce(neighborhood,'') || ' ' || title));

create or replace function public.guard_listing_status_changes()
returns trigger language plpgsql set search_path = public
as $$
begin
  if auth.uid() is not null and current_user <> 'service_role' and new.status is distinct from old.status then
    if old.status in ('draft','pending_review','sold') then
      raise exception 'Listing publication and removal decisions require moderation.';
    end if;
    if old.status = 'published' and new.status not in ('under_offer','rented','sold','unavailable') then
      raise exception 'That listing status change is not allowed.';
    end if;
    if old.status = 'under_offer' and new.status not in ('published','sold','unavailable') then
      raise exception 'That listing status change is not allowed.';
    end if;
    if old.status = 'rented' and new.status not in ('published','unavailable') then
      raise exception 'That listing status change is not allowed.';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists guard_property_status on public.properties;
create trigger guard_property_status before update of status on public.properties
for each row execute function public.guard_listing_status_changes();

create or replace function public.validate_https_property_media()
returns trigger language plpgsql set search_path = public
as $$
declare media_url text;
begin
  if cardinality(new.image_urls) > 12 then
    raise exception 'A listing can include up to twelve image URLs.';
  end if;
  foreach media_url in array new.image_urls loop
    if media_url !~ '^https://[^[:space:]]+$' then
      raise exception 'Property image URLs must use HTTPS.';
    end if;
  end loop;
  if new.video_url is not null and new.video_url !~ '^https://[^[:space:]]+$' then
    raise exception 'Property video URLs must use HTTPS.';
  end if;
  return new;
end;
$$;
drop trigger if exists validate_property_media on public.properties;
create trigger validate_property_media before insert or update of image_urls, video_url on public.properties
for each row execute function public.validate_https_property_media();

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  caption text not null check (char_length(caption) between 1 and 1800),
  media_url text,
  post_type text not null default 'story' check (post_type in ('story','property','business','development')),
  status text not null default 'pending_review' check (status in ('pending_review','published','removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists posts_feed_idx on public.posts(status, created_at desc);

create or replace function public.validate_https_post_media()
returns trigger language plpgsql set search_path = public
as $$
begin
  if new.media_url is not null and new.media_url !~ '^https://[^[:space:]]+$' then
    raise exception 'Post media URLs must use HTTPS.';
  end if;
  return new;
end;
$$;
drop trigger if exists validate_post_media on public.posts;
create trigger validate_post_media before insert or update of media_url on public.posts
for each row execute function public.validate_https_post_media();

create table if not exists public.likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1200),
  created_at timestamptz not null default now()
);
create table if not exists public.favorites (
  property_id uuid not null references public.properties(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (property_id, user_id)
);
create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  message text not null default '' check (char_length(message) <= 2000),
  status text not null default 'new' check (status in ('new','responded','closed')),
  created_at timestamptz not null default now()
);

-- Private buyer and seller conversations attached to published listings.
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(property_id, buyer_id),
  check (buyer_id <> seller_id)
);
create index if not exists conversations_buyer_updated_idx on public.conversations(buyer_id, updated_at desc);
create index if not exists conversations_seller_updated_idx on public.conversations(seller_id, updated_at desc);
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists messages_conversation_created_idx on public.messages(conversation_id, created_at);
create or replace function public.touch_conversation_on_message()
returns trigger language plpgsql security definer set search_path = public
as $$ begin update public.conversations set updated_at = new.created_at where id = new.conversation_id; return new; end; $$;
drop trigger if exists touch_conversation_on_message on public.messages;
create trigger touch_conversation_on_message after insert on public.messages for each row execute function public.touch_conversation_on_message();

alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.posts enable row level security;
alter table public.likes enable row level security;
alter table public.comments enable row level security;
alter table public.favorites enable row level security;
alter table public.enquiries enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy "Public profiles are readable" on public.profiles for select using (true);
create policy "Members update own profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "Members create own profile" on public.profiles for insert with check (id = auth.uid());
create policy "Published properties and owner listings are readable" on public.properties for select using (status = 'published' or owner_id = auth.uid());
create policy "Members create own listings" on public.properties for insert with check (owner_id = auth.uid() and status in ('draft','pending_review'));
create policy "Owners update own listings" on public.properties for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "Owners delete own unpublished listings" on public.properties for delete using (owner_id = auth.uid() and status in ('draft','pending_review'));
create policy "Published posts and own submissions are readable" on public.posts for select using (status = 'published' or author_id = auth.uid());
create policy "Members submit own posts for review" on public.posts for insert with check (author_id = auth.uid() and status = 'pending_review');
create policy "Authors update own pending posts" on public.posts for update using (author_id = auth.uid() and status = 'pending_review') with check (author_id = auth.uid() and status = 'pending_review');
create policy "Authors delete own posts" on public.posts for delete using (author_id = auth.uid());
create policy "Likes on public posts are readable" on public.likes for select using (exists(select 1 from public.posts p where p.id = post_id and p.status = 'published'));
create policy "Members like public posts" on public.likes for insert with check (user_id = auth.uid() and exists(select 1 from public.posts p where p.id = post_id and p.status = 'published'));
create policy "Members remove own likes" on public.likes for delete using (user_id = auth.uid());
create policy "Comments on public posts are readable" on public.comments for select using (exists(select 1 from public.posts p where p.id = post_id and p.status = 'published'));
create policy "Members comment on public posts" on public.comments for insert with check (author_id = auth.uid() and exists(select 1 from public.posts p where p.id = post_id and p.status = 'published'));
create policy "Authors update own comments" on public.comments for update using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "Authors delete own comments" on public.comments for delete using (author_id = auth.uid());
create policy "Members read own favorites" on public.favorites for select using (user_id = auth.uid());
create policy "Members save public properties" on public.favorites for insert with check (user_id = auth.uid() and exists(select 1 from public.properties p where p.id = property_id and p.status = 'published'));
create policy "Members remove own favorites" on public.favorites for delete using (user_id = auth.uid());
create policy "Enquiry participants can read" on public.enquiries for select using (buyer_id = auth.uid() or exists(select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid()));
create policy "Members enquire about published listings" on public.enquiries for insert with check (buyer_id = auth.uid() and exists(select 1 from public.properties p where p.id = property_id and p.status = 'published' and p.owner_id <> auth.uid()));
create policy "Buyers update own enquiries" on public.enquiries for update using (buyer_id = auth.uid()) with check (buyer_id = auth.uid());
create policy "Participants read conversations" on public.conversations for select using (buyer_id = auth.uid() or seller_id = auth.uid());
create policy "Buyers start conversations on published listings" on public.conversations for insert with check (buyer_id = auth.uid() and buyer_id <> seller_id and exists(select 1 from public.properties p where p.id = property_id and p.owner_id = seller_id and p.status = 'published'));
create policy "Participants read messages" on public.messages for select using (exists(select 1 from public.conversations c where c.id = conversation_id and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())));
create policy "Participants send messages" on public.messages for insert with check (sender_id = auth.uid() and exists(select 1 from public.conversations c where c.id = conversation_id and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())));

grant usage on schema public to anon, authenticated;
grant select on public.profiles, public.properties, public.posts, public.likes, public.comments to anon, authenticated;
grant insert, update on public.profiles to authenticated;
grant insert, update, delete on public.properties to authenticated;
grant insert, update, delete on public.posts to authenticated;
grant select, insert, delete on public.likes to authenticated;
grant select, insert, update, delete on public.comments to authenticated;
grant select, insert, delete on public.favorites to authenticated;
grant select, insert, update on public.enquiries to authenticated;
grant select, insert on public.conversations to authenticated;
grant select, insert on public.messages to authenticated;

do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null;
end $$;
