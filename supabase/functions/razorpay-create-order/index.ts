import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { amount, currency = "INR", receipt, notes } = await req.json();
    if (!amount || amount < 100) {
      return new Response(JSON.stringify({ error: "Invalid amount" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const keyId = Deno.env.get("RAZORPAY_KEY_ID");
    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keyId || !keySecret) {
      console.error("Razorpay keys not configured");
      return new Response(JSON.stringify({ error: "Payment service unavailable" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const auth = btoa(`${keyId}:${keySecret}`);
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: Math.round(amount),
        currency,
        receipt: receipt || `rcpt_${Date.now()}`,
        notes: notes || {},
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Razorpay order creation failed:", res.status, data);
      return new Response(JSON.stringify({ error: "Unable to create payment order. Please try again." }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ order: data, keyId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("razorpay-create-order error:", e);
    return new Response(JSON.stringify({ error: "An internal error occurred" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
