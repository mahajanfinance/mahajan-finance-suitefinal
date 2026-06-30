import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

// Parses a bank statement (text) and returns closing balances for
// configurable sample days across MULTIPLE months, plus 6M & 1Y ABB.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { textContent, fileBase64, mimeType, sampleDays = [5, 10, 15, 20, 25, 30], months = 12 } = await req.json();
    if (!textContent && !fileBase64) {
      return new Response(JSON.stringify({ error: "Provide textContent or fileBase64" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const daysList = sampleDays.join(", ");
    const systemPrompt = `You are a precise Indian bank statement parser. Identify the CLOSING BALANCE on days ${daysList} for the LAST ${months} months available in the statement. For any sample day with no entry (holiday/weekend), use the last available closing balance ON OR BEFORE that day. Return JSON via the tool only.`;

    const userText = textContent
      ? `Statement text (truncated to fit):\n${String(textContent).slice(0, 120000)}`
      : `Bank statement file attached. Extract closing balances per the rules.`;

    const messages: any[] = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: fileBase64 && !textContent
          ? [
              { type: "text", text: userText },
              { type: "image_url", image_url: { url: `data:${mimeType || "application/pdf"};base64,${fileBase64}` } },
            ]
          : userText,
      },
    ];

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        tools: [{
          type: "function",
          function: {
            name: "report_monthly_balances",
            description: "Report closing balances per month for sample days",
            parameters: {
              type: "object",
              properties: {
                bank: { type: "string" },
                account_holder: { type: "string" },
                months_data: {
                  type: "array",
                  description: "Array of months found, most recent first",
                  items: {
                    type: "object",
                    properties: {
                      month: { type: "string", description: "e.g. 'October 2025'" },
                      balances: {
                        type: "object",
                        description: `Map of sample day (string) -> closing balance number, for days ${daysList}`,
                        additionalProperties: { type: "number" },
                      },
                    },
                    required: ["month", "balances"],
                  },
                },
              },
              required: ["months_data"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "report_monthly_balances" } },
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI parse failed", aiRes.status, t);
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached. Try again in a minute." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Could not parse statement" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await aiRes.json();
    const call = json.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) {
      return new Response(JSON.stringify({ error: "No data extracted. Try a clearer statement." }), {
        status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const parsed = JSON.parse(call.function.arguments);

    // Compute ABBs
    const monthsData: Array<{ month: string; balances: Record<string, number> }> = parsed.months_data || [];
    const avgOfMonth = (m: any) => {
      const vals = Object.values(m.balances || {}).filter((v) => typeof v === "number") as number[];
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    };
    const monthlyAvgs = monthsData.map((m) => ({ month: m.month, abb: avgOfMonth(m) }));
    const last6 = monthlyAvgs.slice(0, 6);
    const last12 = monthlyAvgs.slice(0, 12);
    const avg = (arr: { abb: number }[]) => arr.length ? arr.reduce((a, b) => a + b.abb, 0) / arr.length : 0;

    return new Response(JSON.stringify({
      success: true,
      bank: parsed.bank,
      account_holder: parsed.account_holder,
      months_data: monthsData,
      monthly_avgs: monthlyAvgs,
      abb_6m: avg(last6),
      abb_1y: avg(last12),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("parse-bank-statement error", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
