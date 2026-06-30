# Step 3: Update Edge Function to handle PDF attachment + uploaded documents
# This is the COMPLETE replacement for supabase/functions/send-enquiry-email/index.ts

$edgeFnDir = "supabase\functions\send-enquiry-email"
$file = "$edgeFnDir\index.ts"

$completeEdgeFn = @'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const serviceName = body.serviceName || "General Enquiry";
    const customerName = body.customerName || "N/A";
    const customerMobile = body.customerMobile || "N/A";
    const paymentInfo = body.paymentInfo || "N/A";
    const details = body.details || {};
    const pdfBase64 = body.pdfBase64 || "";
    const pdfFilename = body.pdfFilename || "document.pdf";
    const documentAttachments = body.documentAttachments || [];
    const sendToBoth = body.sendToBoth || false;
    const priorityEmails = body.priorityEmails || [];

    // Build email
    var subjectLine = "New Enquiry: " + serviceName + " - " + customerName;
    var htmlBody = "<div style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;'>";
    htmlBody += "<div style='background:linear-gradient(135deg,#1a5276,#2e86c1);padding:20px 30px;border-radius:10px 10px 0 0;'>";
    htmlBody += "<h2 style='color:#fff;margin:0;'>Mahajan Finance</h2>";
    htmlBody += "<p style='color:#d6eaf8;margin:5px 0 0 0;'>New " + serviceName + " Enquiry</p>";
    htmlBody += "</div>";
    htmlBody += "<div style='background:#f8f9fa;padding:20px 30px;border:1px solid #e0e0e0;'>";

    htmlBody += "<table style='width:100%;border-collapse:collapse;'>";
    htmlBody += "<tr><td style='padding:10px;border-bottom:1px solid #eee;font-weight:bold;color:#1a5276;'>Customer Name</td><td style='padding:10px;border-bottom:1px solid #eee;'>" + customerName + "</td></tr>";
    htmlBody += "<tr><td style='padding:10px;border-bottom:1px solid #eee;font-weight:bold;color:#1a5276;'>Mobile</td><td style='padding:10px;border-bottom:1px solid #eee;'>" + customerMobile + "</td></tr>";
    htmlBody += "<tr><td style='padding:10px;border-bottom:1px solid #eee;font-weight:bold;color:#1a5276;'>Service</td><td style='padding:10px;border-bottom:1px solid #eee;'>" + serviceName + "</td></tr>";

    if (paymentInfo && paymentInfo !== "N/A") {
      htmlBody += "<tr><td style='padding:10px;border-bottom:1px solid #eee;font-weight:bold;color:#1a5276;'>Payment Info</td><td style='padding:10px;border-bottom:1px solid #eee;'>" + paymentInfo + "</td></tr>";
    }

    // Add all detail fields
    var keys = Object.keys(details);
    for (var k = 0; k < keys.length; k++) {
      var key = keys[k];
      var val = details[key];
      if (val && val !== "" && val !== "N/A" && val !== "undefined" && val !== "null") {
        htmlBody += "<tr><td style='padding:10px;border-bottom:1px solid #eee;font-weight:bold;color:#1a5276;'>" + key + "</td><td style='padding:10px;border-bottom:1px solid #eee;'>" + val + "</td></tr>";
      }
    }

    htmlBody += "</table>";
    htmlBody += "<p style='color:#7f8c8d;font-size:12px;margin-top:20px;'>Received at " + new Date().toISOString() + "</p>";
    htmlBody += "</div>";
    htmlBody += "<div style='background:#1a5276;padding:15px 30px;border-radius:0 0 10px 10px;text-align:center;'>";
    htmlBody += "<p style='color:#d6eaf8;margin:0;font-size:12px;'>Mahajan Finance &copy; " + new Date().getFullYear() + "</p>";
    htmlBody += "</div></div>";

    // Build attachments array
    var attachments = [];

    // 1. Add the generated PDF as attachment
    if (pdfBase64 && pdfBase64.length > 0) {
      attachments.push({
        filename: pdfFilename,
        content: pdfBase64,
        disposition: "attachment"
      });
    }

    // 2. Add uploaded document attachments
    for (var d = 0; d < documentAttachments.length; d++) {
      var docAtt = documentAttachments[d];
      if (docAtt && docAtt.content && docAtt.filename) {
        attachments.push({
          filename: docAtt.filename,
          content: docAtt.content,
          disposition: "attachment"
        });
      }
    }

    // Build email recipients
    var toList = ["mahajanfinance927@gmail.com"];
    if (sendToBoth) {
      toList.push("maheshmahajan927@gmail.com");
    }
    if (priorityEmails.length > 0) {
      for (var p = 0; p < priorityEmails.length; p++) {
        var pe = priorityEmails[p];
        if (pe && toList.indexOf(pe) === -1) {
          toList.push(pe);
        }
      }
    }

    // Build the email payload for Resend
    var emailPayload = {
      from: "Mahajan Finance <onboarding@resend.dev>",
      to: toList,
      subject: subjectLine,
      html: htmlBody
    };

    // Add attachments only if we have any
    if (attachments.length > 0) {
      emailPayload.attachments = attachments;
    }

    // Send email via Resend
    var resendKey = Deno.env.get("RESEND_API_KEY");
    var emailResult = "Email not sent";
    var whatsappStatus = "WhatsApp not sent";

    if (resendKey) {
      try {
        var emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": "Bearer " + resendKey,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(emailPayload)
        });
        var emailData = await emailResponse.json();
        if (emailResponse.ok) {
          emailResult = "SENT OK";
        } else {
          emailResult = "FAILED: " + (emailData.message || emailData.error || JSON.stringify(emailData));
        }
      } catch (emailErr) {
        emailResult = "ERROR: " + emailErr.message;
      }
    } else {
      emailResult = "FAILED: No RESEND_API_KEY";
    }

    // Send WhatsApp via Green-API
    var whatsappMsg = "New " + serviceName + " Enquiry\n";
    whatsappMsg += "Name: " + customerName + "\n";
    whatsappMsg += "Mobile: " + customerMobile + "\n";
    if (paymentInfo && paymentInfo !== "N/A") {
      whatsappMsg += "Payment: " + paymentInfo + "\n";
    }
    whatsappMsg += "Email: " + emailResult;

    var greenApiUrl = "https://7107.api.greenapi.com/waInstance7107651954/sendMessage/" + Deno.env.get("GREEN_API_TOKEN");
    try {
      var waResponse = await fetch(greenApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: "919730540215@c.us",
          message: whatsappMsg
        })
      });
      var waData = await waResponse.json();
      if (waResponse.ok) {
        whatsappStatus = "SENT OK";
      } else {
        whatsappStatus = "FAILED: " + JSON.stringify(waData);
      }
    } catch (waErr) {
      whatsappStatus = "ERROR: " + waErr.message;
    }

    return new Response(JSON.stringify({
      success: true,
      email: emailResult,
      whatsapp: whatsappStatus,
      attachmentsSent: attachments.length
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
'@

[System.IO.File]::WriteAllText($file, $completeEdgeFn, [System.Text.UTF8Encoding]::new($false))
Write-Host "✅ Edge Function updated with PDF + document attachment support!"
Write-Host "   - PDF base64 attachment: supported"
Write-Host "   - Uploaded documents: supported"
Write-Host "   - Both emails: supported via sendToBoth flag"
