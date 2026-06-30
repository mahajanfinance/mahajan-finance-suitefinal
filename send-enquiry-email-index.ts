import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/resend";

const ADMIN_EMAILS = ["info@mahajanfinance.com", "sandeepmahajan9@gmail.com"];
const WHATSAPP_TO = "919730540215"; // Business WhatsApp number

function escapeHtml(s: string) {
  return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function clamp(s: unknown, max: number): string {
  return String(s ?? "").slice(0, max);
}

function renderRows(details: Record<string, unknown>): string {
  return Object.entries(details)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `<tr><td style="padding:8px 12px;border:1px solid #e5e7eb;background:#f9fafb;font-weight:600;color:#0f172a;">${escapeHtml(clamp(k, 80))}</td><td style="padding:8px 12px;border:1px solid #e5e7eb;color:#334155;">${escapeHtml(clamp(String(v), 500))}</td></tr>`)
    .join("");
}

/* ──────────── WhatsApp Notification (UltraMsg) ──────────── */
async function sendWhatsAppNotification(
  message: string
): Promise<{ ok: boolean; error?: string }> {
  const WHATSAPP_API_URL = Deno.env.get("WHATSAPP_API_URL");
  const WHATSAPP_API_KEY = Deno.env.get("WHATSAPP_API_KEY");

  if (!WHATSAPP_API_URL || !WHATSAPP_API_KEY) {
    console.warn("WhatsApp notification skipped: WHATSAPP_API_URL or WHATSAPP_API_KEY not set in secrets.");
    return { ok: false, error: "WhatsApp secrets not configured" };
  }

  try {
    const resp = await fetch(WHATSAPP_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: WHATSAPP_API_KEY,
        to: WHATSAPP_TO,
        body: message,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("WhatsApp API error:", resp.status, errText);
      return { ok: false, error: `HTTP ${resp.status}` };
    }

    const data = await resp.json();
    console.log("WhatsApp sent:", data);
    return { ok: true };
  } catch (e: any) {
    console.error("WhatsApp notification failed:", e.message);
    return { ok: false, error: e.message };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!LOVABLE_API_KEY || !RESEND_API_KEY) {
      console.error("Email service misconfigured: missing API keys");
      return new Response(JSON.stringify({ error: "Email service unavailable" }), {
        status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const serviceName = clamp(body.serviceName, 120);
    const customerName = clamp(body.customerName, 120);
    const customerMobile = clamp(body.customerMobile, 20);
    const paymentInfo = clamp(body.paymentInfo, 200);
    const rawDetails = body.details && typeof body.details === "object" ? body.details : {};

    if (!serviceName || !customerName || !customerMobile) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cap detail entries to avoid abuse
    const detailEntries = Object.entries(rawDetails).slice(0, 30);
    const safeDetails: Record<string, string> = {};
    for (const [k, v] of detailEntries) safeDetails[clamp(k, 80)] = clamp(String(v ?? ""), 500);

    const allDetails: Record<string, unknown> = {
      "Service": serviceName,
      "Customer Name": customerName,
      "Mobile": customerMobile,
      ...safeDetails,
      ...(paymentInfo ? { "Payment Status": paymentInfo } : {}),
      "Submitted At": new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
    };

    const html = `<!doctype html><html><body style="margin:0;padding:24px;font-family:Arial,sans-serif;background:#f3f4f6;">
      <table style="max-width:640px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
        <tr><td style="background:#0a2540;color:#fbbf24;padding:18px 24px;font-size:20px;font-weight:bold;">\ud83c\udfe6 Mahajan Finance \u2014 New Enquiry</td></tr>
        <tr><td style="padding:20px 24px;">
          <h2 style="margin:0 0 12px;color:#0a2540;font-size:18px;">${escapeHtml(serviceName)}</h2>
          <table style="width:100%;border-collapse:collapse;font-size:14px;">${renderRows(allDetails)}</table>
          <p style="margin:18px 0 0;color:#64748b;font-size:12px;">This is an automated notification.</p>
        </td></tr>
      </table></body></html>`;

    const subjectLine = `New ${serviceName} Enquiry \u2014 ${customerName}`;

    // Send emails to both admin addresses
    const sends = await Promise.allSettled(ADMIN_EMAILS.map(to =>
      fetch(`${GATEWAY_URL}/emails`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": RESEND_API_KEY,
        },
        body: JSON.stringify({
          from: "Mahajan Finance <onboarding@resend.dev>",
          to: [to],
          subject: subjectLine,
          html,
        }),
      }).then(r => ({ ok: r.ok, status: r.status }))
    ));

    const okCount = sends.filter(s => s.status === "fulfilled" && (s.value as any).ok).length;

    // Send WhatsApp notification (non-blocking, won't fail the email flow)
    const detailLines = Object.entries(allDetails)
      .map(([k, v]) => `  ${k}: ${v}`)
      .join("\n");
    const waMessage = `\ud83d\udce3 *New Mahajan Finance Enquiry*\n\n*Service:* ${serviceName}\n*Name:* ${customerName}\n*Mobile:* ${customerMobile}\n\n*Details:*\n${detailLines}`;

    // Fire WhatsApp in background, don't await so it doesn't slow the response
    sendWhatsAppNotification(waMessage).then(result => {
      if (!result.ok) console.warn("WhatsApp notification failed:", result.error);
    });

    return new Response(JSON.stringify({ success: okCount > 0, delivered: okCount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-enquiry-email error:", e);
    return new Response(JSON.stringify({ error: "An internal error occurred" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});