/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'

interface Props {
  fullName: string
  meetingTitle: string
  scheduledAt: string // ISO
  meetLink?: string
  portalUrl?: string
}

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    })
  } catch { return iso }
}

export const MeetingScheduledEmail = ({ fullName, meetingTitle, scheduledAt, meetLink, portalUrl = 'https://gabrielconsultor.com/app/mentorados' }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Reunião agendada: {meetingTitle}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brand}>GABRIEL VIEIRA</Text>
          <Text style={brandSub}>Mentoria Comercial 1:1</Text>
        </Section>
        <Section style={accent} />
        <Section style={content}>
          <Heading style={h1}>Reunião agendada, {fullName.split(' ')[0]}.</Heading>
          <Text style={text}>Sua próxima sessão de mentoria está confirmada.</Text>
          <Section style={box}>
            <Text style={boxLabel}>SESSÃO</Text>
            <Text style={boxValue}>{meetingTitle}</Text>
            <Text style={boxLabel}>DATA E HORA</Text>
            <Text style={boxValueMono}>{formatDate(scheduledAt)}</Text>
            {meetLink && (
              <>
                <Text style={boxLabel}>LINK GOOGLE MEET</Text>
                <Text style={{ ...boxValue, fontSize: '13px', wordBreak: 'break-all' as const }}>{meetLink}</Text>
              </>
            )}
          </Section>
          {meetLink && (
            <Section style={{ textAlign: 'center', margin: '24px 0 8px' }}>
              <Button style={button} href={meetLink}>Entrar no Meet</Button>
            </Section>
          )}
          <Hr style={hr} />
          <Text style={footer}>
            Você receberá um convite no seu Google Agenda. Para remarcar, acesse o <a href={portalUrl} style={link}>Portal do Mentorado</a>.
          </Text>
        </Section>
        <Section style={signature}>
          <Text style={sigName}>Gabriel Vieira</Text>
          <Text style={sigContact}>gabriel@gabrielconsultor.com</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default MeetingScheduledEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter',sans-serif", margin: 0, padding: '24px 0' }
const container = { maxWidth: '560px', margin: '0 auto', backgroundColor: '#ffffff', border: '1px solid #e8e4dd' }
const header = { padding: '28px 32px 16px', textAlign: 'center' as const }
const brand = { fontFamily: "'Libre Baskerville',Georgia,serif", fontSize: '20px', letterSpacing: '0.18em', color: '#111418', margin: 0, fontWeight: 'bold' as const }
const brandSub = { fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: '#6b6b6b', margin: '6px 0 0' }
const accent = { height: '3px', backgroundColor: '#C4632D' }
const content = { padding: '32px' }
const h1 = { fontFamily: "'Libre Baskerville',Georgia,serif", fontSize: '24px', lineHeight: '1.25', color: '#111418', margin: '0 0 14px', fontWeight: 'normal' as const }
const text = { fontSize: '15px', lineHeight: '1.65', color: '#3a3a3a', margin: '0 0 12px' }
const link = { color: '#C4632D', textDecoration: 'underline' }
const box = { backgroundColor: '#F4EFE8', border: '1px solid #e8e4dd', padding: '18px 20px', margin: '18px 0 4px' }
const boxLabel = { fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: '#8a8a8a', margin: '0 0 4px' }
const boxValue = { fontSize: '15px', color: '#111418', margin: '0 0 14px', fontWeight: 'bold' as const }
const boxValueMono = { fontFamily: "'IBM Plex Mono','Courier New',monospace", fontSize: '15px', color: '#17242B', margin: '0 0 14px', fontWeight: 'bold' as const }
const button = { backgroundColor: '#C4632D', color: '#F4EFE8', fontSize: '14px', fontWeight: 'bold' as const, letterSpacing: '0.08em', textTransform: 'uppercase' as const, borderRadius: '2px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block' }
const hr = { borderColor: '#e8e4dd', margin: '24px 0 14px' }
const footer = { fontSize: '12px', color: '#8a8a8a', lineHeight: '1.5', margin: 0 }
const signature = { padding: '18px 32px 24px', borderTop: '1px solid #e8e4dd', backgroundColor: '#F4EFE8' }
const sigName = { fontFamily: "'Libre Baskerville',Georgia,serif", fontSize: '14px', color: '#111418', margin: 0, fontWeight: 'bold' as const }
const sigContact = { fontSize: '12px', color: '#C4632D', margin: '4px 0 0' }
