# Troubleshooting Guide

Common issues and solutions for the Bereka platform.

---

## Table of Contents

1. [Installation & Setup Issues](#installation--setup-issues)
2. [Authentication Issues](#authentication-issues)
3. [Payment & Wallet Issues](#payment--wallet-issues)
4. [Job & Escrow Issues](#job--escrow-issues)
5. [Database & Migration Issues](#database--migration-issues)
6. [Edge Function Issues](#edge-function-issues)
7. [File Upload Issues](#file-upload-issues)
8. [Email Notification Issues](#email-notification-issues)
9. [Performance Issues](#performance-issues)

---

## Installation & Setup Issues

### Problem: `npm install` fails with dependency errors

**Solution:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Problem: Supabase CLI not found

**Solution:**
```bash
# Install Supabase CLI
npm install -g supabase

# Or via homebrew
brew install supabase/tap/supabase
```

### Problem: Environment variables not loading

**Solution:**
- Ensure `.env.local` exists in `apps/web/`
- Restart Next.js dev server after changing env vars
- Verify variable names start with `NEXT_PUBLIC_` for client-side access
- Check for typos in variable names

---

## Authentication Issues

### Problem: "User not authenticated" errors

**Solution:**
1. Check if user session exists:
   ```typescript
   const { data: { user } } = await supabase.auth.getUser()
   console.log('User:', user)
   ```

2. Clear browser storage and cookies
3. Try logging out and logging in again
4. Verify Supabase URL and anon key in `.env.local`

### Problem: Redirect loops on login/signup

**Solution:**
- Check `middleware.ts` configuration
- Ensure auth callbacks are configured correctly
- Clear browser cache and cookies
- Check for conflicting redirect logic

### Problem: Admin role not assigned

**Solution:**
1. Check if admin migration has run:
   ```sql
   SELECT * FROM profiles WHERE role = 'admin';
   ```

2. Manually update user to admin:
   ```sql
   UPDATE profiles SET role = 'admin' 
   WHERE id IN (SELECT id FROM auth.users WHERE email = 'your-email@example.com');
   ```

3. Verify email matches the one in migration `20240523000005_admin_setup.sql`

---

## Payment & Wallet Issues

### Problem: LNbits wallet creation fails

**Symptoms:**
- Error: "Failed to create wallet"
- User cannot top up

**Solution:**
1. Verify LNbits is running and accessible
2. Check LNbits admin key is correct:
   ```bash
   supabase secrets list
   ```

3. Test LNbits API manually:
   ```bash
   curl -X POST https://your-lnbits.com/usermanager/api/v1/users \
     -H "X-Api-Key: YOUR_ADMIN_KEY" \
     -H "Content-Type: application/json" \
     -d '{"admin_id":"1","user_name":"test","wallet_name":"default"}'
   ```

4. Check Edge Function logs:
   ```bash
   supabase functions logs create-wallet
   ```

### Problem: Payment not detected (polling stuck)

**Symptoms:**
- Invoice paid but balance doesn't update
- "Waiting for payment..." forever

**Solution:**
1. Check payment status manually in LNbits
2. Verify polling is running (check browser network tab)
3. Check `check-payment` Edge Function logs:
   ```bash
   supabase functions logs check-payment
   ```

4. Verify `payment_intents` record exists:
   ```sql
   SELECT * FROM payment_intents WHERE payment_hash = 'your-hash';
   ```

5. Check for errors in `payment_events`:
   ```sql
   SELECT * FROM payment_events WHERE payment_hash = 'your-hash';
   ```

### Problem: Invoice already paid but showing as unpaid

**Solution:**
- This is an idempotency check working correctly
- Check `payment_events` table for existing record
- If record exists with `status = 'COMPLETED'`, payment was already processed
- Check user's AVAILABLE balance to confirm credit

### Problem: Double payment credited

**Solution:**
- This should not happen due to idempotency checks
- If it does, check:
  1. `payment_events` table for duplicate entries (should be prevented by unique constraint)
  2. Edge Function logs for errors
  3. Report this as a critical bug

---

## Job & Escrow Issues

### Problem: "Job not found" error when creating job

**Solution:**
1. Check if job was created but funding failed:
   ```sql
   SELECT * FROM jobs WHERE creator_id = 'your-user-id' ORDER BY created_at DESC LIMIT 1;
   ```

2. If job exists with status 'OPEN' instead of 'FUNDED':
   ```sql
   SELECT * FROM escrow_holds WHERE job_id = 'job-id';
   ```

3. Verify user has sufficient AVAILABLE balance:
   ```sql
   SELECT balance_sats FROM accounts 
   WHERE user_id = 'your-user-id' AND type = 'AVAILABLE';
   ```

### Problem: Cannot fund job - "Insufficient funds"

**Solution:**
1. Check AVAILABLE balance:
   ```sql
   SELECT balance_sats FROM accounts 
   WHERE user_id = 'your-user-id' AND type = 'AVAILABLE';
   ```

2. Top up wallet if balance is low
3. Check if funds are stuck in ESCROW:
   ```sql
   SELECT balance_sats FROM accounts 
   WHERE user_id = 'your-user-id' AND type = 'ESCROW';
   ```

### Problem: Job status stuck in FUNDED

**Solution:**
- This means escrow was funded but no worker has been accepted
- Creator should review applications and accept a worker
- If no applications, wait for workers to apply

### Problem: Payout failed but job marked COMPLETED

**Solution:**
1. Check Edge Function logs:
   ```bash
   supabase functions logs approve-payout
   ```

2. Check ledger entries:
   ```sql
   SELECT * FROM ledger_entries WHERE reference_id = 'job-id';
   ```

3. Verify worker received payment:
   ```sql
   SELECT balance_sats FROM accounts 
   WHERE user_id = 'worker-id' AND type = 'AVAILABLE';
   ```

4. If payment missing, contact admin for manual resolution

---

## Database & Migration Issues

### Problem: Migration fails with "relation already exists"

**Solution:**
```bash
# Reset local database
supabase db reset

# Or drop and recreate
supabase db push --dry-run  # preview changes
supabase db push
```

### Problem: "CHECK constraint violation" on job status

**Symptoms:**
- Error when funding escrow: "new row for relation 'jobs' violates check constraint"

**Solution:**
- This means the FUNDED status is missing from the CHECK constraint
- Ensure the initial migration has been applied:
  ```bash
  supabase db reset   # local
  supabase db push    # remote
  ```

### Problem: RLS policy blocking queries

**Symptoms:**
- "permission denied for table X"
- Empty results when data should exist

**Solution:**
1. Check if using correct Supabase client (anon vs service role)
2. Verify user is authenticated
3. Check RLS policies:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'your_table';
   ```

4. For admin operations, ensure user role is 'admin':
   ```sql
   SELECT role FROM profiles WHERE id = auth.uid();
   ```

---

## Edge Function Issues

### Problem: Edge Function returns 500 error

**Solution:**
1. Check function logs:
   ```bash
   supabase functions logs function-name --tail
   ```

2. Verify environment secrets are set:
   ```bash
   supabase secrets list
   ```

3. Test function locally:
   ```bash
   supabase functions serve function-name
   ```

4. Check for import errors in `deno.json` or shared modules

### Problem: Function deploys but doesn't work

**Solution:**
1. Verify function was deployed successfully:
   ```bash
   supabase functions list
   ```

2. Check if secrets are set in production:
   ```bash
   supabase secrets list --project-ref your-ref
   ```

3. Test with curl:
   ```bash
   curl -X POST https://your-ref.supabase.co/functions/v1/function-name \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
   ```

### Problem: CORS errors when calling Edge Functions

**Solution:**
- Edge Functions should have CORS headers configured
- Check `_shared/cors.ts` exists and is imported
- Verify OPTIONS requests are handled:
  ```typescript
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  ```

---

## File Upload Issues

### Problem: File upload fails with "Policy violation"

**Solution:**
1. Check storage bucket exists:
   ```sql
   SELECT * FROM storage.buckets WHERE id = 'submissions';
   ```

2. Verify storage policies:
   ```sql
   SELECT * FROM storage.policies WHERE bucket_id = 'submissions';
   ```

3. Ensure user is authenticated
4. Check file is being uploaded to correct path: `{user_id}/{submission_id}/{filename}`

### Problem: Cannot download submitted files

**Solution:**
1. Verify file exists in storage
2. Check storage policies allow reading
3. For creator viewing worker submissions, ensure RLS policy allows access
4. Try using `download()` instead of `getPublicUrl()` for private buckets

### Problem: "File too large" error

**Solution:**
- Default Supabase limit is 50MB
- For larger files, configure bucket size limit:
  ```sql
  UPDATE storage.buckets SET file_size_limit = 104857600 WHERE id = 'submissions'; -- 100MB
  ```

---

## Email Notification Issues

### Problem: Emails not being sent

**Solution:**
1. Check SMTP environment variables are set:
   ```bash
   supabase secrets list
   ```

2. Verify SMTP credentials are correct
3. Check Edge Function logs:
   ```bash
   supabase functions logs send-notification
   ```

4. Test SMTP connection manually
5. Check spam folder
6. If SMTP not configured, emails will log to console (check function logs)

### Problem: Email templates broken/unstyled

**Solution:**
- Email templates are basic HTML in `send-notification/index.ts`
- Modify templates as needed for better styling
- Test with different email clients

---

## Performance Issues

### Problem: Slow job listing page

**Solution:**
1. Reduce page size (default is 12 items)
2. Add indexes if missing:
   ```sql
   CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
   CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(category);
   CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
   ```

3. Check query performance:
   ```sql
   EXPLAIN ANALYZE SELECT * FROM jobs WHERE status IN ('OPEN', 'FUNDED') LIMIT 12;
   ```

### Problem: Payment polling consuming too many requests

**Solution:**
- Default polling interval is 3 seconds
- Increase interval to 5-10 seconds for less load:
  ```typescript
  const interval = setInterval(checkPayment, 5000); // 5 seconds
  ```

- Implement exponential backoff
- Use webhook handler instead of polling

### Problem: Database connection limit reached

**Solution:**
1. Check active connections:
   ```sql
   SELECT count(*) FROM pg_stat_activity;
   ```

2. Optimize queries to reduce connection time
3. Implement connection pooling
4. Upgrade Supabase plan for more connections

---

## General Debugging Tips

### Enable verbose logging

1. **Frontend:**
   ```typescript
   console.log('Debug:', { user, job, balance });
   ```

2. **Edge Functions:**
   ```typescript
   console.log('Function input:', { userId, amount });
   console.log('LNbits response:', data);
   ```

3. **Database:**
   ```sql
   SET log_statement = 'all';
   ```

### Check Edge Function logs in real-time

```bash
supabase functions logs function-name --tail
```

### Inspect database state

```sql
-- Check user's accounts
SELECT * FROM accounts WHERE user_id = 'user-id';

-- Check ledger for a job
SELECT * FROM ledger_entries WHERE reference_id = 'job-id';

-- Check all jobs for a user
SELECT * FROM jobs WHERE creator_id = 'user-id' OR worker_id = 'user-id';
```

### Test Edge Functions locally

```bash
# Serve all functions
supabase functions serve

# Or specific function
supabase functions serve function-name

# In another terminal, test with curl
curl -X POST http://localhost:54321/functions/v1/function-name \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"test":"data"}'
```

---

## Still Having Issues?

If your issue isn't covered here:

1. **Check Logs:** Start with Edge Function logs and browser console
2. **Search Issues:** Check GitHub issues for similar problems
3. **Database State:** Inspect relevant tables to understand what's happening
4. **Ask for Help:** 
   - Email: support@bereka.app
   - GitHub: Open an issue with:
     - Error message
     - Steps to reproduce
     - Relevant logs
     - Database state (sanitized)

---

## Known Issues

1. **Polling-only payments** - Webhook support is optional; polling works but is slower
2. **No withdrawal mechanism** - MVP is deposit-only (custodial)
3. **Admin-only disputes** - No automated arbitration
4. **No job revision workflow** - Work must be resubmitted as new submission

These are documented limitations of the MVP and may be addressed in future versions.
