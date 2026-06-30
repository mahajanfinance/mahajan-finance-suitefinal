import { Resend } from 'npm:resend@4.0.0'

const RESEND_API_KEY = 're_ZskQPPoH_7Dtczpwmpuu8m64vatgXe1oe'
const FROM_EMAIL = 'onboarding@resend.dev'
const ADMIN_EMAILS = ['sandeepmahajan9@gmail.com', 'info@mahajanfinance.com']
const MSG91_AUTHKEY = '506671AwtXeIkHadNw6a2234a5P1'
const MSG91_TEMPLATE_ID = '6a3523675d38326161096a62'
const FONNTE_TOKEN = 'ghoLfHFvEMbc3TWc11MU'
const WHATSAPP_TARGET = '919730540215'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  try {
    const body = await req.json()
    const details = body.details || {}
    const serviceName = body.serviceName || 'Loan Application'
    const customerName = body.customerName || details.fullName || 'Unknown'
    const customerMobile = body.customerMobile || details.mobile || ''
    const customerEmail = body.customerEmail || details.email || ''
    const paymentInfo = body.paymentInfo || ''
    const pdfBase64 = body.pdfBase64 || ''
    const pdfFilename = body.pdfFilename || ''
    const documentAttachments = body.documentAttachments || []
    const preUploadedUrls = (body.documentUrls || [])

    const loanLabel = serviceName.split(' - ')[0] || serviceName
    const refId = details['Reference ID'] || details.referenceId || 'APP' + Date.now()
    const payMatch = (paymentInfo || '').match(/pay_[\w]+|ORDER_\w+/)
    const paymentId = payMatch ? payMatch[0] : paymentInfo || 'N/A'

    console.log('INFO pdfBase64:', pdfBase64.length, 'docs:', documentAttachments.length, 'preUrls:', preUploadedUrls.length)

    const folder = refId + '_' + Date.now()
    const links = []
    const uploadErrors = []

    for (const u of preUploadedUrls) {
      if (u.filename && u.url) links.push({ filename: u.filename, url: u.url })
    }

    async function uploadToStorage(b64, filePath, contentType) {
      try {
        let clean = b64
        if (clean.includes(',')) clean = clean.split(',')[1]
        clean = clean.replace(/[\s\r\n]/g, '')
        if (clean.length === 0) { uploadErrors.push(filePath + ': empty'); return null }
        const bytes = Uint8Array.from(atob(clean), c => c.charCodeAt(0))
        const enc = filePath.split('/').map(p => encodeURIComponent(p)).join('/')
        const url = supabaseUrl + '/storage/v1/object/loan-documents/' + enc
        const res = await fetch(url, { method: 'POST', headers: { 'Authorization': 'Bearer ' + supabaseKey, 'Content-Type': contentType, 'x-upsert': 'true' }, body: bytes })
        if (!res.ok) { uploadErrors.push(filePath + ': HTTP ' + res.status); return null }
        return supabaseUrl + '/storage/v1/object/public/loan-documents/' + enc
      } catch (e) { uploadErrors.push(filePath + ': ' + (e.message || String(e))); return null }
    }

    if (pdfBase64 && pdfBase64.length > 10) {
      const pdfName = pdfFilename || ('LoanApp_' + refId + '.pdf')
      const url = await uploadToStorage(pdfBase64, folder + '/' + pdfName, 'application/pdf')
      if (url) links.push({ filename: pdfName, url })
    }

    for (const doc of documentAttachments) {
      if (doc.base64 && doc.base64.length > 10 && doc.filename) {
        const url = await uploadToStorage(doc.base64, folder + '/' + doc.filename, doc.contentType || 'application/octet-stream')
        if (url) links.push({ filename: doc.filename, url })
      }
    }

    console.log('SUMMARY:', links.length, 'links,', uploadErrors.length, 'errors')

    const fields = [['Full Name', details.fullName], ['Email', details.email], ['Mobile', details.mobile], ['PAN Card', details.pancard], ['Current Address', details.currentAddress], ['Company Name', details.companyName], ['Loan Amount', details.loanAmount], ['Purpose', details.purpose], ['Tenure', details.tenure], ['Loan Type', loanLabel], ['Reference ID', refId], ['Selected Banks', details['Selected Banks'] || ''], ['Payment ID', paymentId], ['Documents', details['Documents Attached'] || 'None']]

    let tr = ''
    for (const [l, v] of fields) { if (v) tr += '<tr><td style="padding:8px 10px;border:1px solid #d1d5db;background:#f3f4f6;font-weight:600;width:40%;">' + l + '</td><td style="padding:8px 10px;border:1px solid #d1d5db;">' + v + '</td></tr>' }

    let dl = ''
    if (links.length > 0) {
      let li = ''
      for (const l of links) li += '<li style="margin:8px 0;"><a href="' + l.url + '" target="_blank" style="color:#2563eb;font-weight:600;">' + l.filename + '</a></li>'
      dl = '<div style="margin-top:24px;padding:18px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;"><h3 style="color:#1e40af;">Download Documents (' + links.length + ' files)</h3><ul style="padding-left:22px;">' + li + '</ul></div>'
    }

    const html = '<div style="max-width:620px;margin:0 auto;font-family:Arial,sans-serif;"><div style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:24px 20px;border-radius:10px 10px 0 0;"><h1 style="color:#fff;margin:0;">New Enquiry Received</h1><p style="color:#dbeafe;margin:6px 0 0 0;">' + customerName + ' - ' + loanLabel + '</p></div><div style="padding:24px 20px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 10px 10px;"><table style="border-collapse:collapse;width:100%;"><tr><th colspan="2" style="background:#1e40af;color:#fff;padding:10px;">Application Details</th></tr>' + tr + '</table>' + dl + '<div style="margin-top:20px;padding-top:14px;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;"><p>Automated notification from Mahajan Finance</p><p>Received: ' + new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + '</p></div></div></div>'

    const resend = new Resend(RESEND_API_KEY)
    let emailDelivered = 0
    let resendError = null
    const results = []

    for (const toEmail of ADMIN_EMAILS) {
      try {
        const res = await resend.emails.send({ from: FROM_EMAIL, to: toEmail, subject: 'New Enquiry - ' + customerName + ' (' + loanLabel + ')', html: html })
        const id = res.id || (res.data && res.data.id)
        if (id) { emailDelivered++; results.push({ email: toEmail, id }) }
      } catch (err) { resendError = resendError || (err.message || String(err)) }
    }

    let smsSent = false
    try {
      const smsRes = await fetch('https://api.msg91.com/api/v5/flow/', { method: 'POST', headers: { 'authkey': MSG91_AUTHKEY, 'Content-Type': 'application/json' }, body: JSON.stringify({ flow_id: MSG91_TEMPLATE_ID, sender: 'MAHAJN', mobiles: '919730540215', var1: customerName, var2: loanLabel, var3: customerMobile }) })
      smsSent = smsRes.ok
    } catch (e) { console.error('SMS error:', e) }

    let whatsappSent = false
    let whatsappError = ''
    try {
      const waMsg = '*NEW LEAD - Mahajan Finance*\n\n*Name:* ' + customerName + '\n*Mobile:* ' + customerMobile + '\n*Service:* ' + loanLabel + (details.loanAmount ? '\n*Amount:* Rs.' + details.loanAmount : '') + (details.purpose ? '\n*Purpose:* ' + details.purpose : '') + '\n*Ref:* ' + refId + '\n*Payment:* ' + paymentId + '\n*Docs:* ' + links.length + ' files\n\n_Received: ' + new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + '_'

      const waRes = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: { 'Authorization': FONNTE_TOKEN, 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: WHATSAPP_TARGET, message: waMsg, countryCode: '91' }),
      })
      whatsappSent = waRes.ok
      const waBody = await waRes.text()
      console.log('WhatsApp response:', waRes.status, waBody)
      if (!waRes.ok) whatsappError = 'HTTP ' + waRes.status + ': ' + waBody
    } catch (e) {
      whatsappError = (e && e.message) ? e.message : String(e)
      console.error('WhatsApp error:', e)
    }

    return new Response(JSON.stringify({
      success: true,
      emailDelivered,
      emailResults: results,
      resendError: emailDelivered < ADMIN_EMAILS.length ? resendError : null,
      smsSent,
      whatsappSent,
      whatsappError: whatsappError || undefined,
      customerEmail,
      filesUploaded: links.length,
      uploadErrors: uploadErrors.length > 0 ? uploadErrors : undefined,
      storageFolder: folder,
    }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })

  } catch (err) {
    console.error('Edge function error:', err)
    return new Response(JSON.stringify({ success: false, error: (err && err.message) ? err.message : String(err) }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
  }
})
