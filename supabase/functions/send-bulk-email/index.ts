/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { sendZohoEmail } from '../_shared/zoho.ts'
import { ProspectingEmail } from '../_shared/app-email-templates/prospecting.tsx'
import { BlogInsightEmail } from '../_shared/app-email-templates/blog-insight.tsx'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const TEMPLATES: Record<string, { component: React.ComponentType<any>; defaultSubject: (d: any) => string }> = {
  'prospecting': {
    component: ProspectingEmail,
    defaultSubject: (d) => d.headline || 'Uma ideia comercial para a sua operação',
  },
  'blog-insight': {
    component: BlogInsightEmail,
    defaultSubject: (d) => d.title || 'Insight Comercial · Gabriel Vieira',
  },
}

type Recipient = {
  email: string
  name?: string
  company?: string
}

interface Payload {
  template: string
  subject?: string                       // optional override
  data: Record<string, any>              // base template data (recipient/company auto-injected per email)
  recipients: Recipient[]
  throttleMs?: number                    // delay between sends, default 350
  replyTo?: string
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const body = (await req.json()) as Payload
    const { template, subject, data, recipients, throttleMs = 350, replyTo } = body

    if (!template || !TEMPLATES[template]) {
      return new Response(JSON.stringify({ error: `Unknown template: ${template}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    if (!Array.isArray(recipients) || recipients.length === 0) {
      return new Response(JSON.stringify({ error: 'recipients is required (non-empty array)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    if (recipients.length > 200) {
      return new Response(JSON.stringify({ error: 'Max 200 recipients per call. Split your list.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const tpl = TEMPLATES[template]
    const results: Array<{ email: string; ok: boolean; error?: string; messageId?: string }> = []
    let sent = 0, failed = 0

    for (const r of recipients) {
      const email = (r.email || '').trim().toLowerCase()
      if (!isValidEmail(email)) {
        results.push({ email, ok: false, error: 'invalid_email' })
        failed++
        continue
      }
      const perEmailData = {
        ...data,
        recipientName: r.name || data.recipientName,
        companyName: r.company || data.companyName,
        fullName: r.name || data.fullName,
      }
      const subj = subject?.trim() || tpl.defaultSubject(perEmailData)
      try {
        const html = await renderAsync(React.createElement(tpl.component, perEmailData))
        const res = await sendZohoEmail({
          to: email, subject: subj, html, fromName: 'Gabriel Vieira', replyTo,
        })
        if (res.ok) {
          results.push({ email, ok: true, messageId: res.messageId })
          sent++
        } else {
          results.push({ email, ok: false, error: res.error || 'send_failed' })
          failed++
        }
      } catch (e: any) {
        results.push({ email, ok: false, error: e?.message || 'render_failed' })
        failed++
      }
      if (throttleMs > 0) await sleep(throttleMs)
    }

    console.log('send-bulk-email', { template, total: recipients.length, sent, failed })
    return new Response(JSON.stringify({ ok: true, sent, failed, total: recipients.length, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('send-bulk-email error', err)
    return new Response(JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
