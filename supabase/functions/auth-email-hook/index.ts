/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { parseEmailWebhookPayload } from 'npm:@lovable.dev/email-js'
import { WebhookError, verifyWebhookRequest } from 'npm:@lovable.dev/webhooks-js'
import { SignupEmail } from '../_shared/email-templates/signup.tsx'
import { InviteEmail } from '../_shared/email-templates/invite.tsx'
import { MagicLinkEmail } from '../_shared/email-templates/magic-link.tsx'
import { RecoveryEmail } from '../_shared/email-templates/recovery.tsx'
import { EmailChangeEmail } from '../_shared/email-templates/email-change.tsx'
import { ReauthenticationEmail } from '../_shared/email-templates/reauthentication.tsx'
import { sendZohoEmail } from '../_shared/zoho.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-lovable-signature, x-lovable-timestamp, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const EMAIL_SUBJECTS: Record<string, string> = {
  signup: 'Confirme seu e-mail · Gabriel Vieira',
  invite: 'Você foi convidado · Gabriel Vieira',
  magiclink: 'Seu link de acesso · Gabriel Vieira',
  recovery: 'Redefina sua senha · Gabriel Vieira',
  email_change: 'Confirme seu novo e-mail · Gabriel Vieira',
  reauthentication: 'Seu código de verificação · Gabriel Vieira',
}

const EMAIL_TEMPLATES: Record<string, React.ComponentType<any>> = {
  signup: SignupEmail,
  invite: InviteEmail,
  magiclink: MagicLinkEmail,
  recovery: RecoveryEmail,
  email_change: EmailChangeEmail,
  reauthentication: ReauthenticationEmail,
}

const SITE_NAME = 'Gabriel Vieira'
const ROOT_DOMAIN = 'gabrielconsultor.com'
const FROM_NAME = 'Gabriel Vieira'

// Preview sample data
const SAMPLE_URL = `https://${ROOT_DOMAIN}`
const SAMPLE_EMAIL = 'user@example.test'
const SAMPLE_DATA: Record<string, object> = {
  signup: { siteName: SITE_NAME, siteUrl: SAMPLE_URL, recipient: SAMPLE_EMAIL, confirmationUrl: SAMPLE_URL },
  magiclink: { siteName: SITE_NAME, confirmationUrl: SAMPLE_URL },
  recovery: { siteName: SITE_NAME, confirmationUrl: SAMPLE_URL },
  invite: { siteName: SITE_NAME, siteUrl: SAMPLE_URL, confirmationUrl: SAMPLE_URL },
  email_change: { siteName: SITE_NAME, oldEmail: SAMPLE_EMAIL, email: SAMPLE_EMAIL, newEmail: SAMPLE_EMAIL, confirmationUrl: SAMPLE_URL },
  reauthentication: { token: '123456' },
}

async function handlePreview(req: Request): Promise<Response> {
  const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' }
  if (req.method === 'OPTIONS') return new Response(null, { headers })

  const apiKey = Deno.env.get('LOVABLE_API_KEY')
  const authHeader = req.headers.get('Authorization')
  if (!apiKey || authHeader !== `Bearer ${apiKey}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...headers, 'Content-Type': 'application/json' } })
  }

  let type: string
  try { type = (await req.json()).type } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } })
  }

  const Tpl = EMAIL_TEMPLATES[type]
  if (!Tpl) return new Response(JSON.stringify({ error: `Unknown type: ${type}` }), { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } })

  const html = await renderAsync(React.createElement(Tpl, SAMPLE_DATA[type] ?? {}))
  return new Response(html, { status: 200, headers: { ...headers, 'Content-Type': 'text/html; charset=utf-8' } })
}

async function handleWebhook(req: Request): Promise<Response> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY')
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Server config error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  let payload: any
  try {
    const verified = await verifyWebhookRequest({ req, secret: apiKey, parser: parseEmailWebhookPayload })
    payload = verified.payload
  } catch (error) {
    if (error instanceof WebhookError) {
      const code = error.code
      if (['invalid_signature', 'missing_timestamp', 'invalid_timestamp', 'stale_timestamp'].includes(code)) {
        return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  if (payload.version !== '1') {
    return new Response(JSON.stringify({ error: `Unsupported version: ${payload.version}` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const emailType = payload.data.action_type
  const recipient = payload.data.email
  console.log('Auth email event', { emailType, recipient })

  const Tpl = EMAIL_TEMPLATES[emailType]
  if (!Tpl) {
    return new Response(JSON.stringify({ error: `Unknown email type: ${emailType}` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const props = {
    siteName: SITE_NAME,
    siteUrl: `https://${ROOT_DOMAIN}`,
    recipient,
    confirmationUrl: payload.data.url,
    token: payload.data.token,
    email: payload.data.email,
    oldEmail: payload.data.old_email,
    newEmail: payload.data.new_email,
  }

  const html = await renderAsync(React.createElement(Tpl, props))

  // Send directly via Zoho (no queue)
  const result = await sendZohoEmail({
    to: recipient,
    subject: EMAIL_SUBJECTS[emailType] ?? 'Mensagem · Gabriel Vieira',
    html,
    fromName: FROM_NAME,
  })

  if (!result.ok) {
    console.error('Zoho send failed', { emailType, recipient, error: result.error })
    return new Response(JSON.stringify({ error: 'send_failed', details: result.error }), {
      status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  console.log('Auth email sent via Zoho', { emailType, recipient, messageId: result.messageId })
  return new Response(JSON.stringify({ ok: true, messageId: result.messageId }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const url = new URL(req.url)
  if (url.pathname.endsWith('/preview')) return handlePreview(req)
  return handleWebhook(req)
})
