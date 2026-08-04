-- Run this once in Supabase: SQL Editor > New query.
create extension if not exists pgcrypto;

create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  student_name text not null,
  admission_number text not null unique,
  class_division text not null,
  roll_number text not null,
  date_of_birth date not null,
  blood_group text not null,
  address text not null,
  parent_name text not null,
  phone_number text not null,
  emergency_contact text not null,
  transport_details text,
  photo_url text,
  edit_token text not null unique,
  status text not null default 'pending' check (status in ('pending', 'approved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.students enable row level security;
-- No browser-facing policy is intentionally created. The server uses the service-role key.

insert into storage.buckets (id, name, public) values ('student-photos', 'student-photos', true)
on conflict (id) do update set public = true;
