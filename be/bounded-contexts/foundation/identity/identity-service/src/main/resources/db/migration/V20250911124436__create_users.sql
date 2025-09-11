-- Migration: create_users
create extension if not exists pgcrypto;
create extension if not exists citext;

create table if not exists users (
    id uuid primary key default gen_random_uuid(),
    email citext not null unique,
    password_hash text not null,
    name text,
    created_at timestamptz default now()
);