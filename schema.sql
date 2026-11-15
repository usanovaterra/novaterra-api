-- Novaterra — estructura de la base de datos (Supabase / PostgreSQL)
-- Pega TODO esto en Supabase → SQL Editor → y dale "Run".
-- Crea las 4 tablas donde vivirán tus datos (permanentes).

create table if not exists usuarios (
  id      text primary key,
  email   text unique not null,
  nombre  text,
  salt    text not null,
  hash    text not null,
  creado  timestamptz default now()
);

create table if not exists negocios (
  id          text primary key,
  usuario_id  text not null,
  nombre      text not null,
  tipo        text,
  frase       text,
  creado      timestamptz default now()
);

create table if not exists clientes (
  id          text primary key,
  negocio_id  text not null,
  nombre      text not null,
  total       numeric default 0,
  abonos      jsonb default '[]',
  creado      timestamptz default now()
);

create table if not exists suscripciones (
  usuario_id  text primary key,
  plan        text,
  codigo      text,
  desde       timestamptz,
  vence       timestamptz
);
