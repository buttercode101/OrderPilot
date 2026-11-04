-- OrderPilot multi-tenant application schema.
CREATE TABLE IF NOT EXISTS businesses (
 id text PRIMARY KEY, owner_user_id text NOT NULL, name text NOT NULL DEFAULT '',
 owner_name text NOT NULL DEFAULT '', trade text NOT NULL DEFAULT 'other',
 phone text NOT NULL DEFAULT '', currency text NOT NULL DEFAULT 'ZAR',
 validity_days integer NOT NULL DEFAULT 14, created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT businesses_currency_check CHECK(currency IN ('ZAR','USD','GBP','EUR')),
 CONSTRAINT businesses_trade_check CHECK(trade IN ('catering','cleaning','handyman','painting','events','other')),
 CONSTRAINT businesses_validity_days_check CHECK(validity_days BETWEEN 1 AND 90),
 CONSTRAINT businesses_id_owner_user_id_key UNIQUE(id,owner_user_id)
);
CREATE TABLE IF NOT EXISTS business_memberships (
 business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
 user_id text NOT NULL, role text NOT NULL DEFAULT 'member', created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(business_id,user_id), CHECK(role IN ('owner','admin','member'))
);
CREATE INDEX IF NOT EXISTS business_memberships_user_idx ON business_memberships(user_id,business_id);
CREATE TABLE IF NOT EXISTS customers (
 id text PRIMARY KEY, business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
 name text NOT NULL DEFAULT '', phone text NOT NULL DEFAULT '', email text NOT NULL DEFAULT '',
 notes text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(business_id,id)
);
CREATE INDEX IF NOT EXISTS customers_business_name_idx ON customers(business_id,name);
CREATE TABLE IF NOT EXISTS price_book_items (
 id text PRIMARY KEY, business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
 name text NOT NULL, category text NOT NULL DEFAULT '', unit text NOT NULL,
 unit_price numeric(14,2) NOT NULL, currency text NOT NULL DEFAULT 'ZAR',
 hints text[] NOT NULL DEFAULT '{}', soft_hints text[] NOT NULL DEFAULT '{}',
 is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(business_id,id), CHECK(unit IN ('person','each','hour','job','day','room')),
 CHECK(unit_price >= 0), CHECK(currency IN ('ZAR','USD','GBP','EUR'))
);
CREATE INDEX IF NOT EXISTS price_book_business_active_idx ON price_book_items(business_id,is_active,name);
CREATE TABLE IF NOT EXISTS enquiries (
 id text PRIMARY KEY, business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
 customer_id text, created_by text NOT NULL, source text NOT NULL, raw_message text NOT NULL DEFAULT '',
 customer_name text NOT NULL DEFAULT '', contact text NOT NULL DEFAULT '', service text NOT NULL DEFAULT '',
 quantity numeric(14,3), quantity_label text NOT NULL DEFAULT '', when_text text NOT NULL DEFAULT '',
 location text NOT NULL DEFAULT '', notes text NOT NULL DEFAULT '', status text NOT NULL DEFAULT 'needs-info',
 lines_custom boolean NOT NULL DEFAULT false, forced_ready boolean NOT NULL DEFAULT false,
 custom_message text, custom_follow_up text, extra_questions jsonb NOT NULL DEFAULT '[]',
 sent_at timestamptz, follow_up_on date, paid_at timestamptz, currency text NOT NULL DEFAULT 'ZAR',
 payload jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(business_id,id), FOREIGN KEY(business_id,customer_id) REFERENCES customers(business_id,id) ON DELETE SET NULL (customer_id),
 CHECK(source IN ('paste','form','sample')), CHECK(status IN ('needs-info','ready','sent','won','paid','lost')),
 CHECK(jsonb_typeof(extra_questions)='array'), CHECK(jsonb_typeof(payload)='object'),
 CHECK(currency IN ('ZAR','USD','GBP','EUR'))
);
CREATE INDEX IF NOT EXISTS enquiries_business_status_idx ON enquiries(business_id,status,updated_at DESC);
CREATE INDEX IF NOT EXISTS enquiries_followup_idx ON enquiries(business_id,follow_up_on) WHERE follow_up_on IS NOT NULL;
CREATE TABLE IF NOT EXISTS quotes (
 id text PRIMARY KEY, business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
 enquiry_id text NOT NULL, customer_id text, quote_number text NOT NULL, version integer NOT NULL DEFAULT 1,
 status text NOT NULL DEFAULT 'draft', currency text NOT NULL, business_snapshot jsonb NOT NULL DEFAULT '{}',
 customer_snapshot jsonb NOT NULL DEFAULT '{}', subtotal numeric(14,2) NOT NULL DEFAULT 0,
 tax_amount numeric(14,2) NOT NULL DEFAULT 0, total numeric(14,2) NOT NULL DEFAULT 0,
 valid_until date, issued_at timestamptz, accepted_at timestamptz, rejected_at timestamptz,
 created_by text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(business_id,id), UNIQUE(business_id,quote_number,version),
 FOREIGN KEY(business_id,enquiry_id) REFERENCES enquiries(business_id,id) ON DELETE CASCADE,
 FOREIGN KEY(business_id,customer_id) REFERENCES customers(business_id,id) ON DELETE SET NULL (customer_id),
 CHECK(version>0), CHECK(status IN ('draft','sent','accepted','rejected','expired','cancelled','paid')),
 CHECK(currency IN ('ZAR','USD','GBP','EUR')), CHECK(subtotal>=0 AND tax_amount>=0 AND total>=0)
);
CREATE INDEX IF NOT EXISTS quotes_business_status_idx ON quotes(business_id,status,created_at DESC);
CREATE TABLE IF NOT EXISTS quote_items (
 id text PRIMARY KEY, business_id text NOT NULL, quote_id text NOT NULL, price_book_item_id text,
 label text NOT NULL, category text NOT NULL DEFAULT '', quantity numeric(14,3) NOT NULL,
 unit text NOT NULL, unit_price numeric(14,2) NOT NULL, line_total numeric(14,2) NOT NULL,
 assumed boolean NOT NULL DEFAULT false, sort_order integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(business_id,quote_id) REFERENCES quotes(business_id,id) ON DELETE CASCADE,
 FOREIGN KEY(business_id,price_book_item_id) REFERENCES price_book_items(business_id,id) ON DELETE SET NULL (price_book_item_id),
 CHECK(quantity>0), CHECK(unit_price>=0 AND line_total>=0), CHECK(unit IN ('person','each','hour','job','day','room'))
);
CREATE INDEX IF NOT EXISTS quote_items_quote_order_idx ON quote_items(quote_id,sort_order);
CREATE TABLE IF NOT EXISTS follow_ups (
 id text PRIMARY KEY, business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
 enquiry_id text, quote_id text, scheduled_for timestamptz NOT NULL, status text NOT NULL DEFAULT 'pending',
 note text NOT NULL DEFAULT '', completed_at timestamptz, created_by text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(business_id,enquiry_id) REFERENCES enquiries(business_id,id) ON DELETE CASCADE,
 FOREIGN KEY(business_id,quote_id) REFERENCES quotes(business_id,id) ON DELETE CASCADE,
 CHECK(status IN ('pending','completed','dismissed','overdue'))
);
CREATE INDEX IF NOT EXISTS followups_due_idx ON follow_ups(business_id,status,scheduled_for);
CREATE TABLE IF NOT EXISTS payments (
 id text PRIMARY KEY, business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
 quote_id text NOT NULL, amount numeric(14,2) NOT NULL, currency text NOT NULL,
 method text NOT NULL DEFAULT 'other', reference text NOT NULL DEFAULT '', paid_at timestamptz NOT NULL,
 recorded_by text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(business_id,quote_id) REFERENCES quotes(business_id,id) ON DELETE CASCADE,
 CHECK(amount>0), CHECK(currency IN ('ZAR','USD','GBP','EUR')), CHECK(method IN ('cash','eft','card','payment-link','other'))
);
CREATE INDEX IF NOT EXISTS payments_quote_idx ON payments(business_id,quote_id,paid_at DESC);
CREATE TABLE IF NOT EXISTS activity_events (
 id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, business_id text NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
 actor_user_id text NOT NULL, entity_type text NOT NULL, entity_id text NOT NULL, action text NOT NULL,
 before_data jsonb, after_data jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS activity_events_business_time_idx ON activity_events(business_id,created_at DESC);
