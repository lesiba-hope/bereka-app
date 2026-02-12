-- ============================================================================
-- Bereka: Initial Schema
-- Lightning micro-task marketplace powered by LNbits + Supabase
-- ============================================================================

-- ============================================
-- 1. Profiles
-- ============================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  updated_at TIMESTAMPTZ,
  username TEXT UNIQUE,
  bio TEXT,
  role TEXT CHECK (role IN ('worker', 'client', 'admin')) DEFAULT 'worker',
  skills TEXT[] DEFAULT '{}',
  avatar_url TEXT,
  lnbits_id TEXT,
  lnbits_admin_key TEXT,  -- Sensitive: hidden via profiles_public view
  lnbits_invoice_key TEXT,
  CONSTRAINT username_length CHECK (char_length(username) >= 3)
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- 2. Job Categories
-- ============================================
CREATE TABLE job_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE job_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read categories"
  ON job_categories FOR SELECT USING (true);

INSERT INTO job_categories (name) VALUES
  ('Development'),
  ('Design'),
  ('Writing & Translation'),
  ('Marketing'),
  ('Data Entry'),
  ('Testing & QA'),
  ('Research'),
  ('Video & Animation'),
  ('Community Management'),
  ('Other')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 3. Jobs
-- ============================================
CREATE TABLE jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID REFERENCES profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  budget_sats BIGINT NOT NULL CHECK (budget_sats > 0),
  status TEXT CHECK (status IN (
    'OPEN', 'FUNDED', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'DISPUTED', 'CANCELLED'
  )) DEFAULT 'OPEN',
  category TEXT,
  deadline TIMESTAMPTZ,
  worker_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Jobs are viewable by everyone"
  ON jobs FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create jobs"
  ON jobs FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their own jobs"
  ON jobs FOR UPDATE USING (auth.uid() = creator_id);

-- ============================================
-- 4. Applications
-- ============================================
CREATE TABLE applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) NOT NULL,
  worker_id UUID REFERENCES profiles(id) NOT NULL,
  cover_letter TEXT,
  status TEXT CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')) DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Applicants can view their own applications"
  ON applications FOR SELECT USING (auth.uid() = worker_id);

CREATE POLICY "Creators can view applications for their jobs"
  ON applications FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs WHERE jobs.id = applications.job_id AND jobs.creator_id = auth.uid()
    )
  );

CREATE POLICY "Workers can create applications"
  ON applications FOR INSERT WITH CHECK (auth.uid() = worker_id);

CREATE POLICY "Creators can update applications on their jobs"
  ON applications FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM jobs WHERE jobs.id = applications.job_id AND jobs.creator_id = auth.uid()
    )
  );

-- ============================================
-- 5. Submissions
-- ============================================
CREATE TABLE submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) NOT NULL,
  worker_id UUID REFERENCES profiles(id) NOT NULL,
  content TEXT,
  attachments TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Submissions viewable by creator and worker"
  ON submissions FOR SELECT USING (
    auth.uid() = worker_id
    OR EXISTS (
      SELECT 1 FROM jobs WHERE jobs.id = submissions.job_id AND jobs.creator_id = auth.uid()
    )
  );

CREATE POLICY "Workers can create submissions"
  ON submissions FOR INSERT WITH CHECK (auth.uid() = worker_id);

-- ============================================
-- 6. Ledger Accounts
-- ============================================
-- NULLS NOT DISTINCT ensures only one row per (NULL, type) for platform accounts
CREATE TABLE accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  type TEXT CHECK (type IN ('AVAILABLE', 'ESCROW', 'PLATFORM_FEES', 'EXTERNAL_DEPOSITS')) NOT NULL,
  balance_sats BIGINT DEFAULT 0 CHECK (balance_sats >= 0 OR user_id IS NULL),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE NULLS NOT DISTINCT (user_id, type)
);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own accounts"
  ON accounts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all accounts"
  ON accounts FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- ============================================
-- 7. Ledger Entries (double-entry bookkeeping)
-- ============================================
CREATE TABLE ledger_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  debit_account_id UUID REFERENCES accounts(id) NOT NULL,
  credit_account_id UUID REFERENCES accounts(id) NOT NULL,
  amount_sats BIGINT NOT NULL CHECK (amount_sats > 0),
  reference_type TEXT NOT NULL,
  reference_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ledger_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ledger entries"
  ON ledger_entries FOR SELECT USING (
    EXISTS (SELECT 1 FROM accounts WHERE accounts.id = ledger_entries.debit_account_id AND accounts.user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM accounts WHERE accounts.id = ledger_entries.credit_account_id AND accounts.user_id = auth.uid())
  );

CREATE POLICY "Admins can view all ledger entries"
  ON ledger_entries FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- ============================================
-- 8. Payment Intents (Lightning invoices for top-ups)
-- ============================================
CREATE TABLE payment_intents (
  payment_hash TEXT PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) NOT NULL,
  amount_sats BIGINT NOT NULL,
  payment_request TEXT NOT NULL,
  status TEXT CHECK (status IN ('PENDING', 'COMPLETED')) DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ
);

ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own payment intents"
  ON payment_intents FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- 9. Payment Events (idempotency for payment processing)
-- ============================================
CREATE TABLE payment_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL,
  payment_hash TEXT UNIQUE NOT NULL,
  amount_sats BIGINT,
  status TEXT,
  processed_at TIMESTAMPTZ DEFAULT now(),
  raw_payload JSONB
);

ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all payment events"
  ON payment_events FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- ============================================
-- 10. Disputes
-- ============================================
CREATE TABLE disputes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) NOT NULL,
  opened_by UUID REFERENCES auth.users NOT NULL,
  reason TEXT NOT NULL,
  evidence_urls TEXT[] DEFAULT '{}',
  status TEXT CHECK (status IN ('OPEN', 'RESOLVED')) DEFAULT 'OPEN',
  resolution TEXT,
  resolved_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dispute parties can view"
  ON disputes FOR SELECT USING (
    opened_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = disputes.job_id
      AND (jobs.creator_id = auth.uid() OR jobs.worker_id = auth.uid())
    )
  );

CREATE POLICY "Job parties can create disputes"
  ON disputes FOR INSERT WITH CHECK (
    opened_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = disputes.job_id
      AND (jobs.creator_id = auth.uid() OR jobs.worker_id = auth.uid())
    )
  );

CREATE POLICY "Admins can view all disputes"
  ON disputes FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Admins can update disputes"
  ON disputes FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- ============================================
-- 11. Escrow Holds
-- ============================================
CREATE TABLE escrow_holds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID REFERENCES jobs(id) NOT NULL UNIQUE,
  amount_sats BIGINT NOT NULL CHECK (amount_sats > 0),
  status TEXT CHECK (status IN ('HELD', 'RELEASED', 'REFUNDED')) DEFAULT 'HELD',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE escrow_holds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Job parties can view escrow holds"
  ON escrow_holds FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM jobs
      WHERE jobs.id = escrow_holds.job_id
      AND (jobs.creator_id = auth.uid() OR jobs.worker_id = auth.uid())
    )
  );

-- ============================================
-- 12. Views
-- ============================================
-- profiles_public hides sensitive LNbits keys from the frontend
CREATE OR REPLACE VIEW profiles_public WITH (security_invoker = true) AS
SELECT
  id,
  updated_at,
  username,
  bio,
  role,
  skills,
  avatar_url,
  lnbits_id,
  (lnbits_admin_key IS NOT NULL) AS has_wallet
FROM profiles;

GRANT SELECT ON profiles_public TO authenticated;
GRANT SELECT ON profiles_public TO anon;

-- ============================================
-- 13. Functions
-- ============================================

-- Auto-create AVAILABLE and ESCROW accounts when a profile is inserted
CREATE OR REPLACE FUNCTION create_user_accounts()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.accounts (user_id, type, balance_sats)
  VALUES (NEW.id, 'AVAILABLE', 0), (NEW.id, 'ESCROW', 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Increment balance (used for top-ups)
CREATE OR REPLACE FUNCTION increment_balance(account_id UUID, amount BIGINT)
RETURNS VOID AS $$
BEGIN
  UPDATE accounts SET balance_sats = balance_sats + amount WHERE id = account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Move funds between accounts with row-level locking and ledger entry
CREATE OR REPLACE FUNCTION move_funds(
  from_account_id UUID,
  to_account_id UUID,
  amount BIGINT,
  ref_type TEXT,
  ref_id TEXT
) RETURNS VOID AS $$
DECLARE
  current_bal BIGINT;
BEGIN
  SELECT balance_sats INTO current_bal FROM accounts WHERE id = from_account_id FOR UPDATE;

  IF current_bal < amount THEN
    RAISE EXCEPTION 'Insufficient funds';
  END IF;

  UPDATE accounts SET balance_sats = balance_sats - amount WHERE id = from_account_id;
  UPDATE accounts SET balance_sats = balance_sats + amount WHERE id = to_account_id;

  INSERT INTO ledger_entries (debit_account_id, credit_account_id, amount_sats, reference_type, reference_id)
  VALUES (from_account_id, to_account_id, amount, ref_type, ref_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Get account ID by user and type
CREATE OR REPLACE FUNCTION get_account_id(target_user_id UUID, account_type TEXT)
RETURNS UUID AS $$
DECLARE
  acc_id UUID;
BEGIN
  SELECT id INTO acc_id FROM accounts WHERE user_id = target_user_id AND type = account_type;
  RETURN acc_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Process external Lightning deposit with double-entry accounting
CREATE OR REPLACE FUNCTION process_external_deposit(
  p_user_id UUID,
  p_amount_sats BIGINT,
  p_payment_hash TEXT
)
RETURNS JSON AS $$
DECLARE
  v_external_deposit_account UUID;
  v_user_available_account UUID;
BEGIN
  SELECT id INTO v_external_deposit_account
  FROM accounts WHERE user_id IS NULL AND type = 'EXTERNAL_DEPOSITS' LIMIT 1;

  SELECT id INTO v_user_available_account
  FROM accounts WHERE user_id = p_user_id AND type = 'AVAILABLE';

  IF v_external_deposit_account IS NULL OR v_user_available_account IS NULL THEN
    RAISE EXCEPTION 'Account not found';
  END IF;

  -- Double-entry: debit EXTERNAL_DEPOSITS (decrease), credit user AVAILABLE (increase)
  INSERT INTO ledger_entries (debit_account_id, credit_account_id, amount_sats, reference_type, reference_id)
  VALUES (v_external_deposit_account, v_user_available_account, p_amount_sats, 'DEPOSIT', p_payment_hash);

  UPDATE accounts SET balance_sats = balance_sats + p_amount_sats WHERE id = v_user_available_account;
  UPDATE accounts SET balance_sats = balance_sats - p_amount_sats WHERE id = v_external_deposit_account;

  RETURN json_build_object('success', true, 'amount', p_amount_sats);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Atomic payout: transfer funds from escrow to worker + platform fee
-- Idempotent: returns early if job is already COMPLETED
CREATE OR REPLACE FUNCTION atomic_payout(
  p_job_id UUID,
  p_creator_id UUID,
  p_worker_id UUID,
  p_budget_sats BIGINT
)
RETURNS JSON AS $$
DECLARE
  v_job_status TEXT;
  v_fee BIGINT;
  v_payout BIGINT;
  v_creator_escrow UUID;
  v_worker_available UUID;
  v_platform_fee UUID;
BEGIN
  -- Idempotency: check if already completed
  SELECT status INTO v_job_status FROM jobs WHERE id = p_job_id;
  IF v_job_status = 'COMPLETED' THEN
    RETURN json_build_object('success', true, 'already_completed', true);
  END IF;

  v_fee := FLOOR(p_budget_sats * 0.05);
  v_payout := p_budget_sats - v_fee;

  SELECT id INTO v_creator_escrow FROM accounts WHERE user_id = p_creator_id AND type = 'ESCROW';
  SELECT id INTO v_worker_available FROM accounts WHERE user_id = p_worker_id AND type = 'AVAILABLE';
  SELECT id INTO v_platform_fee FROM accounts WHERE user_id IS NULL AND type = 'PLATFORM_FEES' LIMIT 1;

  IF v_creator_escrow IS NULL OR v_worker_available IS NULL THEN
    RAISE EXCEPTION 'Account not found';
  END IF;

  PERFORM move_funds(v_creator_escrow, v_worker_available, v_payout, 'PAYOUT', p_job_id::TEXT);

  IF v_platform_fee IS NOT NULL AND v_fee > 0 THEN
    PERFORM move_funds(v_creator_escrow, v_platform_fee, v_fee, 'PLATFORM_FEE', p_job_id::TEXT);
  END IF;

  UPDATE escrow_holds SET status = 'RELEASED' WHERE job_id = p_job_id;
  UPDATE jobs SET status = 'COMPLETED' WHERE id = p_job_id;

  RETURN json_build_object('success', true, 'payout', v_payout, 'fee', v_fee);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Atomic dispute resolution
CREATE OR REPLACE FUNCTION atomic_dispute_payout(
  p_job_id UUID,
  p_resolution TEXT,  -- 'REFUND', 'PAY_WORKER', 'SPLIT'
  p_admin_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_job RECORD;
  v_escrow_hold RECORD;
  v_creator_escrow UUID;
  v_creator_available UUID;
  v_worker_available UUID;
  v_platform_fee UUID;
  v_fee BIGINT;
  v_payout BIGINT;
  v_half BIGINT;
BEGIN
  SELECT * INTO v_job FROM jobs WHERE id = p_job_id;
  IF v_job IS NULL THEN RAISE EXCEPTION 'Job not found'; END IF;

  SELECT * INTO v_escrow_hold FROM escrow_holds WHERE job_id = p_job_id AND status = 'HELD';
  IF v_escrow_hold IS NULL THEN RAISE EXCEPTION 'No active escrow hold found'; END IF;

  SELECT id INTO v_creator_escrow FROM accounts WHERE user_id = v_job.creator_id AND type = 'ESCROW';
  SELECT id INTO v_creator_available FROM accounts WHERE user_id = v_job.creator_id AND type = 'AVAILABLE';
  SELECT id INTO v_worker_available FROM accounts WHERE user_id = v_job.worker_id AND type = 'AVAILABLE';
  SELECT id INTO v_platform_fee FROM accounts WHERE user_id IS NULL AND type = 'PLATFORM_FEES' LIMIT 1;

  IF p_resolution = 'REFUND' THEN
    PERFORM move_funds(v_creator_escrow, v_creator_available, v_escrow_hold.amount_sats, 'DISPUTE_REFUND', p_job_id::TEXT);
    UPDATE jobs SET status = 'CANCELLED' WHERE id = p_job_id;

  ELSIF p_resolution = 'PAY_WORKER' THEN
    v_fee := FLOOR(v_escrow_hold.amount_sats * 0.05);
    v_payout := v_escrow_hold.amount_sats - v_fee;
    PERFORM move_funds(v_creator_escrow, v_worker_available, v_payout, 'DISPUTE_PAY_WORKER', p_job_id::TEXT);
    IF v_platform_fee IS NOT NULL AND v_fee > 0 THEN
      PERFORM move_funds(v_creator_escrow, v_platform_fee, v_fee, 'DISPUTE_PLATFORM_FEE', p_job_id::TEXT);
    END IF;
    UPDATE jobs SET status = 'COMPLETED' WHERE id = p_job_id;

  ELSIF p_resolution = 'SPLIT' THEN
    v_half := FLOOR(v_escrow_hold.amount_sats / 2);
    v_fee := FLOOR(v_half * 0.05);
    PERFORM move_funds(v_creator_escrow, v_creator_available, v_half - v_fee, 'DISPUTE_SPLIT_CREATOR', p_job_id::TEXT);
    IF v_worker_available IS NOT NULL THEN
      PERFORM move_funds(v_creator_escrow, v_worker_available, v_half - v_fee, 'DISPUTE_SPLIT_WORKER', p_job_id::TEXT);
    END IF;
    IF v_platform_fee IS NOT NULL AND v_fee > 0 THEN
      PERFORM move_funds(
        v_creator_escrow, v_platform_fee,
        v_escrow_hold.amount_sats - (v_half - v_fee) - (v_half - v_fee),
        'DISPUTE_SPLIT_FEE', p_job_id::TEXT
      );
    END IF;
    UPDATE jobs SET status = 'CANCELLED' WHERE id = p_job_id;

  ELSE
    RAISE EXCEPTION 'Invalid resolution type: %', p_resolution;
  END IF;

  UPDATE escrow_holds SET status = 'REFUNDED' WHERE job_id = p_job_id;

  UPDATE disputes SET
    status = 'RESOLVED',
    resolution = p_resolution,
    resolved_by = p_admin_id,
    resolved_at = NOW()
  WHERE job_id = p_job_id AND status = 'OPEN';

  RETURN json_build_object('success', true, 'resolution', p_resolution, 'amount', v_escrow_hold.amount_sats);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Auto-update updated_at on jobs
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Auto-promote specific email to admin on signup
CREATE OR REPLACE FUNCTION auto_promote_admin()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email = 'cebomakeleni@gmail.com' THEN
    UPDATE profiles SET role = 'admin' WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- 14. Triggers
-- ============================================
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION create_user_accounts();

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER on_auth_user_created_promote_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION auto_promote_admin();

-- ============================================
-- 15. Indexes
-- ============================================
CREATE INDEX idx_payment_events_payment_hash ON payment_events(payment_hash);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_creator_id ON jobs(creator_id);
CREATE INDEX idx_jobs_worker_id ON jobs(worker_id);
CREATE INDEX idx_jobs_category ON jobs(category);
CREATE INDEX idx_applications_job_id ON applications(job_id);
CREATE INDEX idx_disputes_job_id ON disputes(job_id);
CREATE INDEX idx_disputes_status ON disputes(status);
CREATE INDEX idx_escrow_holds_job_id ON escrow_holds(job_id);
CREATE INDEX idx_ledger_entries_reference ON ledger_entries(reference_type, reference_id);

-- ============================================
-- 16. Seed Data
-- ============================================
-- Platform fee account (system account, no user)
INSERT INTO accounts (user_id, type, balance_sats) VALUES (NULL, 'PLATFORM_FEES', 0);

-- External deposits tracking account (system account, no user)
INSERT INTO accounts (user_id, type, balance_sats) VALUES (NULL, 'EXTERNAL_DEPOSITS', 0);

-- Promote existing admin user if already signed up
UPDATE profiles SET role = 'admin'
WHERE id IN (SELECT id FROM auth.users WHERE email = 'cebomakeleni@gmail.com');

-- ============================================
-- 17. Storage Buckets
-- ============================================

-- Submissions bucket (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('submissions', 'submissions', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload submission files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'submissions' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view submission files they are involved in"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'submissions' AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (
        SELECT 1 FROM jobs j
        WHERE j.creator_id = auth.uid()
        AND j.worker_id::text = (storage.foldername(name))[1]
      )
    )
  );

CREATE POLICY "Users can delete their own submission files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'submissions' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins can view all submission files"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'submissions'
    AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Admins can delete submission files"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'submissions'
    AND EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Avatars bucket (public)
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
