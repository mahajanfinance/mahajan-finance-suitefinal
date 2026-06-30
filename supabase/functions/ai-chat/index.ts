import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const SYSTEM_PROMPT = `You are the Mahajan Finance AI Assistant — a friendly, knowledgeable financial advisor for Mahajan Finance (Ashta, Sangli, Maharashtra). Owner: Sandeep Mahajan, +91 9730540215, info@mahajanfinance.com.

Services we offer:
- Loans: Personal, Home, Business, Vehicle, Gold, NRI, LAP
- Insurance: Car, Bike, Health, Commercial, Personal Accident, Fire
- Investments: SIP, Mutual Funds, ULIP, FD, Stocks, Retirement, Child Plans
- Accounting: ITR Filing, GST Returns, PAN, FSSAI, Udyam, Shop Act
- Govt Schemes: PMEGP, Mudra, Stand-Up India, etc.
- CSC Services, Partner Program, Cash Flow Manager (income/expense tracking)

Be concise (under 120 words), use bullet points, give actionable financial guidance. For loan/investment specifics, suggest contacting Sandeep on WhatsApp 9730540215 or visiting Apply Loan / Investments pages. Never give legally-binding tax/legal advice — recommend a CA. Always reply in the user's language (English/Hindi/Marathi).`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const trimmed = messages.slice(-12).map((m: any) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content ?? "").slice(0, 2000),
    }));

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...trimmed],
        stream: true,
      }),
    });

    if (!res.ok) {
      if (res.status === 429) return new Response(JSON.stringify({ error: "Too many requests, try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (res.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await res.text();
      console.error("AI gateway error:", res.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(res.body, { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } });
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
