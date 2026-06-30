import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

async function hmacSha256Hex(key: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(JSON.stringify({ verified: false, error: "Missing fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!keySecret) {
      console.error("Razorpay secret not configured");
      return new Response(JSON.stringify({ verified: false, error: "Payment service unavailable" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const expected = await hmacSha256Hex(keySecret, `${razorpay_order_id}|${razorpay_payment_id}`);
    const verified = expected === razorpay_signature;

    return new Response(JSON.stringify({ verified, payment_id: verified ? razorpay_payment_id : undefined }), {
      status: verified ? 200 : 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("razorpay-verify error:", e);
    return new Response(JSON.stringify({ verified: false, error: "An internal error occurred" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
