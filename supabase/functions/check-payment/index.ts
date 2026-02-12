import { corsHeaders } from "../_shared/cors.ts";
import { getAuthenticatedUser, createAdminClient } from "../_shared/auth.ts";
import { processIncomingPayment } from "../_shared/processIncomingPayment.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Authenticate the user making the polling request
    await getAuthenticatedUser(req);

    const { paymentHash } = await req.json();
    if (!paymentHash) throw new Error("Missing paymentHash");

    const supabase = createAdminClient();

    // Check if already completed (fast path, no LNbits call needed)
    const { data: intent } = await supabase
      .from("payment_intents")
      .select("status")
      .eq("payment_hash", paymentHash)
      .single();

    if (intent?.status === "COMPLETED") {
      return new Response(JSON.stringify({ paid: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the user's LNbits invoice key to check payment status
    const { data: paymentIntent } = await supabase
      .from("payment_intents")
      .select("user_id, amount_sats")
      .eq("payment_hash", paymentHash)
      .single();

    if (!paymentIntent) throw new Error("Payment intent not found");

    const { data: profile } = await supabase
      .from("profiles")
      .select("lnbits_invoice_key")
      .eq("id", paymentIntent.user_id)
      .single();

    const lnbitsUrl = Deno.env.get("LNBITS_URL");
    const invoiceKey = profile?.lnbits_invoice_key;

    if (!lnbitsUrl || !invoiceKey) {
      throw new Error("Missing LNbits configuration or user wallet");
    }

    // Check LNbits for payment status
    const response = await fetch(
      `${lnbitsUrl}/api/v1/payments/${paymentHash}`,
      {
        method: "GET",
        headers: {
          "X-Api-Key": invoiceKey,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.ok) {
      const data = await response.json();

      if (data.paid) {
        // Use centralized idempotent payment processing
        const result = await processIncomingPayment(
          supabase,
          paymentHash,
          "lnbits_poll",
          data
        );

        return new Response(JSON.stringify({ paid: true, amount: result.amount }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ paid: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
