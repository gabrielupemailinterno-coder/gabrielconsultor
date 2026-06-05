/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'

interface Props {
  recipientName?: string
  companyName?: string
  headline: string         // "isca" / abertura curta
  intro: string            // 1-2 parágrafos
  bullets?: string[]
  proofLine?: string       // prova social rápida
  ctaLabel?: string
  ctaUrl?: string
  signoff?: string
}

const wrap = (s: string, max = 80) => s

export const ProspectingEmail = ({
  recipientName,
  companyName,
  headline,
  intro,
  bullets,
  proofLine,
  ctaLabel,
  ctaUrl,
  signoff,
}: Props) => {
  const greet = recipientName
    ? `Olá, ${recipientName.split(' ')[0]}.`
    : 'Olá.'
  const companyTag = companyName ? ` (${companyName})` : ''
  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>{headline}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={accent} />
          <Section style={content}>
            <Heading style={h1}>{headline}</Heading>
            <Text style={greetStyle}>{greet}</Text>
            <Text style={text}>{wrap(intro)}{companyTag}</Text>

            {bullets && bullets.length > 0 && (
              <Section style={bulletBox}>
                {bullets.map((b, i) => (
                  <Text key={i} style={bulletItem}>
                    <span style={bulletMark}>—</span> {b}
                  </Text>
                ))}
              </Section>
            )}

            {proofLine && <Text style={proof}>{proofLine}</Text>}

            {ctaUrl && ctaLabel && (
              <Section style={{ textAlign: 'center', margin: '24px 0 6px' }}>
                <Button style={button} href={ctaUrl}>{ctaLabel}</Button>
              </Section>
            )}

            <Hr style={hr} />
            <Text style={signoffStyle}>
              {signoff || 'Se fizer sentido conversar, me responde aqui mesmo.'}
            </Text>
          </Section>
          <Section style={signature}>
            <Text style={sigName}>Gabriel Vieira</Text>
            <Text style={sigRole}>Consultor & Mentor Comercial · São João del Rei, MG</Text>
            <Text style={sigContact}>gabriel@gabrielconsultor.com · gabrielconsultor.com</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default ProspectingEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter','Helvetica Neue',Arial,sans-serif", margin: 0, padding: '24px 0' }
const container = { maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', border: '1px solid #e8e4dd' }
const accent = { height: '3px', backgroundColor: '#C4632D' }
const content = { padding: '32px' }
const h1 = { fontFamily: "'Libre Baskerville',Georgia,serif", fontSize: '22px', lineHeight: '1.3', color: '#111418', margin: '0 0 16px', fontWeight: 'normal' as const }
const greetStyle = { fontSize: '14px', color: '#111418', margin: '0 0 10px', fontWeight: 'bold' as const }
const text = { fontSize: '14px', lineHeight: '1.7', color: '#3a3a3a', margin: '0 0 14px' }
const bulletBox = { backgroundColor: '#F4EFE8', borderLeft: '3px solid #C4632D', padding: '14px 18px', margin: '14px 0' }
const bulletItem = { fontSize: '13.5px', lineHeight: '1.55', color: '#111418', margin: '0 0 8px' }
const bulletMark = { color: '#C4632D', fontWeight: 'bold' as const, marginRight: '6px' }
const proof = { fontSize: '13px', lineHeight: '1.6', color: '#6E1F2F', fontStyle: 'italic' as const, margin: '14px 0 0' }
const button = { backgroundColor: '#C4632D', color: '#F4EFE8', fontSize: '13px', fontWeight: 'bold' as const, letterSpacing: '0.06em', textTransform: 'uppercase' as const, borderRadius: '2px', padding: '12px 24px', textDecoration: 'none', display: 'inline-block' }
const hr = { borderColor: '#e8e4dd', margin: '22px 0 12px' }
const signoffStyle = { fontSize: '13px', color: '#3a3a3a', margin: 0, lineHeight: '1.6' }
const signature = { padding: '18px 32px 24px', borderTop: '1px solid #e8e4dd', backgroundColor: '#F4EFE8' }
const sigName = { fontFamily: "'Libre Baskerville',Georgia,serif", fontSize: '14px', color: '#111418', margin: 0, fontWeight: 'bold' as const }
const sigRole = { fontSize: '12px', color: '#6b6b6b', margin: '4px 0 0' }
const sigContact = { fontSize: '12px', color: '#C4632D', margin: '4px 0 0' }
