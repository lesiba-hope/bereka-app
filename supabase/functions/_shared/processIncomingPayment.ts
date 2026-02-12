import { type SupabaseClient } from "@supabase/supabase-js";

interface ProcessResult {
  paid: boolean;
  alreadyProcessed: boolean;
  amount?: number;
}

/**
 * Centralized, idempotent payment processing.
 * Called by both check-payment (polling) and lnbits-webhook.
 *
 * 1. Checks if payment is already recorded in payment_events
 * 2. If not, inserts a payment_events row (unique constraint on payment_hash)
 * 3. Updates payment_intents status to COMPLETED
 * 4. Credits the user's available balance via process_external_deposit RPC
 *
 * Idempotency is enforced at two levels:
 * - payment_intents.status check (fast path)
 * - payment_events UNIQUE constraint on payment_hash (race-condition safe)
 */
export async function processIncomingPayment(
  supabase: SupabaseClient,
  paymentHash: string,
  provider: string,
  rawPayload?: Record<string, unknown>
): Promise<ProcessResult> {
  // 1. Get the payment intent
  const { data: intent, error: intentError } = await supabase
    .from("payment_intents")
    .select("*")
    .eq("payment_hash", paymentHash)
    .single();

  if (intentError || !intent) {
    throw new Error(`Payment intent not found for hash: ${paymentHash}`);
  }

  // 2. Fast path: already completed
  if (intent.status === "COMPLETED") {
    return { paid: true, alreadyProcessed: true, amount: intent.amount_sats };
  }

  // 3. Insert payment event (unique constraint enforces idempotency)
  const { error: insertError } = await supabase.from("payment_events").insert({
    provider,
    payment_hash: paymentHash,
    amount_sats: intent.amount_sats,
    status: "COMPLETED",
    raw_payload: rawPayload ?? null,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      // Unique violation — another request already processed this payment
      return { paid: true, alreadyProcessed: true, amount: intent.amount_sats };
    }
    throw insertError;
  }

  // 4. Update payment intent status
  await supabase
    .from("payment_intents")
    .update({ status: "COMPLETED" })
    .eq("payment_hash", paymentHash);

  // 5. Credit user balance via double-entry accounting RPC
  const { error: depositError } = await supabase.rpc(
    "process_external_deposit",
    {
      p_user_id: intent.user_id,
      p_amount_sats: intent.amount_sats,
      p_payment_hash: paymentHash,
    }
  );

  if (depositError) {
    console.error("Deposit processing error:", depositError);
    throw depositError;
  }

  return { paid: true, alreadyProcessed: false, amount: intent.amount_sats };
}
