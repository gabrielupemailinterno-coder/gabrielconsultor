/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { sendZohoEmail } from '../_shared/zoho.ts'
import { WelcomeMenteeEmail } from '../_shared/app-email-templates/welcome-mentee.tsx'
import { MeetingScheduledEmail } from '../_shared/app-email-templates/meeting-scheduled.tsx'
import { MeetingAvailableEmail } from '../_shared/app-email-templates/meeting-available.tsx'
import { ActivityAvailableEmail } from '../_shared/app-email-templates/activity-available.tsx'
import { BlogInsightEmail } from '../_shared/app-email-templates/blog-insight.tsx'
import { ProspectingEmail } from '../_shared/app-email-templates/prospecting.tsx'
import { ScheduleFirstMeetingEmail } from '../_shared/app-email-templates/schedule-first-meeting.tsx'
import { requireAdminOrService } from '../_shared/require-admin.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}


const TEMPLATES: Record<string, { component: React.ComponentType<any>; subject: (data: any) => string }> = {
  'welcome-mentee': {
    component: WelcomeMenteeEmail,
    subject: () => 'Bem-vindo à Mentoria Comercial · Gabriel Vieira',
  },
  'meeting-scheduled': {
    component: MeetingScheduledEmail,
    subject: (d) => `Reunião agendada: ${d.meetingTitle}`,
  },
  'meeting-available': {
    component: MeetingAvailableEmail,
    subject: (d) => `Nova sessão liberada: ${d.meetingTitle}`,
  },
  'activity-available': {
    component: ActivityAvailableEmail,
    subject: (d) => `Nova atividade: ${d.activityTitle}`,
  },
  'blog-insight': {
    component: BlogInsightEmail,
    subject: (d) => d.title || 'Insight Comercial · Gabriel Vieira',
  },
  'prospecting': {
    component: ProspectingEmail,
    subject: (d) => d.headline || 'Uma ideia comercial para a sua operação',
  },
  'schedule-first-meeting': {
    component: ScheduleFirstMeetingEmail,
    subject: () => 'Agende sua 1ª reunião da mentoria',
  },
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  // Require admin JWT or service_role — otherwise the function can be abused
  // to send arbitrary emails (including welcome-mentee with temp passwords).
  const auth = await requireAdminOrService(req, corsHeaders)
  if (auth instanceof Response) return auth

  try {
    const { template, to, data, subject: customSubject, replyTo } = await req.json()


    if (!template || !to || !data) {
      return new Response(JSON.stringify({ error: 'template, to and data are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const tpl = TEMPLATES[template]
    if (!tpl) {
      return new Response(JSON.stringify({ error: `Unknown template: ${template}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const html = await renderAsync(React.createElement(tpl.component, data))
    const subject = customSubject ?? tpl.subject(data)

    const result = await sendZohoEmail({
      to, subject, html, fromName: 'Gabriel Vieira', replyTo,
    })

    if (!result.ok) {
      console.error('send-app-email failed', { template, to, error: result.error })
      return new Response(JSON.stringify({ error: 'send_failed', details: result.error }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    console.log('send-app-email ok', { template, to, messageId: result.messageId })
    return new Response(JSON.stringify({ ok: true, messageId: result.messageId }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('send-app-email error', err)
    return new Response(JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
