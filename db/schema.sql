-- Supabase/Postgres schema for Claddie KENYA storefront

-- products table
CREATE TABLE IF NOT EXISTS products (
  id text PRIMARY KEY,
  name text NOT NULL,
  audience text NOT NULL,
  shoetype text NOT NULL,
  category text NOT NULL,
  description text,
  price integer NOT NULL,
  stock integer NOT NULL,
  sizes text[],
  colors text[],
  images text[],
  instagramurl text,
  featured boolean DEFAULT false,
  createdat timestamptz DEFAULT now()
);

-- users table
CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  password text NOT NULL,
  createdat timestamptz DEFAULT now()
);

-- orders table
CREATE TABLE IF NOT EXISTS orders (
  id text PRIMARY KEY,
  reference text NOT NULL,
  invoicereference text,
  createdat timestamptz DEFAULT now(),
  status text NOT NULL,
  customer jsonb NOT NULL,
  items jsonb NOT NULL,
  total integer NOT NULL,
  userid text REFERENCES users(id)
);

-- invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id text PRIMARY KEY,
  reference text NOT NULL,
  orderreference text NOT NULL,
  createdat timestamptz DEFAULT now(),
  customer jsonb NOT NULL,
  items jsonb NOT NULL,
  total integer NOT NULL
);

-- settings (singleton)
CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL
);

-- messages for customer support/chat
CREATE TABLE IF NOT EXISTS messages (
  id text PRIMARY KEY,
  threadid text NOT NULL,
  sendertype text NOT NULL,
  sendername text NOT NULL,
  customerlabel text,
  orderreference text,
  message text NOT NULL,
  createdat timestamptz DEFAULT now()
);
