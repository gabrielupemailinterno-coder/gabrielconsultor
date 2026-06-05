/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'

interface Props {
  token: string
}

export const ReauthenticationEmail = ({ token }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu código de verificação</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brand}>GABRIEL VIEIRA</Text>
          <Text style={brandSub}>Consultoria & Mentoria Comercial</Text>
        </Section>
        <Section style={accent} />
        <Section style={content}>
          <Heading style={h1}>Confirme sua identidade.</Heading>
          <Text style={text}>Use o código abaixo para confirmar sua identidade:</Text>
          <Text style={codeStyle}>{token}</Text>
          <Hr style={hr} />
          <Text style={footer}>
            Este código expira em alguns minutos. Se não foi você, ignore este e-mail.
          </Text>
        </Section>
        <Section style={signature}>
          <Text style={sigName}>Gabriel Vieira</Text>
          <Text style={sigRole}>Consultor & Mentor Comercial · São João del Rei, MG</Text>
          <Text style={sigContact}>contato@gabrielconsultor.com</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif", margin: 0, padding: '24px 0' }
const container = { maxWidth: '560px', margin: '0 auto', backgroundColor: '#ffffff', border: '1px solid #e8e4dd' }
const header = { padding: '28px 32px 16px', textAlign: 'center' as const }
const brand = { fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: '20px', letterSpacing: '0.18em', color: '#111418', margin: 0, fontWeight: 'bold' as const }
const brandSub = { fontFamily: "'Inter', sans-serif", fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: '#6b6b6b', margin: '6px 0 0' }
const accent = { height: '3px', backgroundColor: '#C4632D' }
const content = { padding: '32px' }
const h1 = { fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: '26px', lineHeight: '1.25', color: '#111418', margin: '0 0 18px', fontWeight: 'normal' as const }
const text = { fontSize: '15px', lineHeight: '1.65', color: '#3a3a3a', margin: '0 0 16px' }
const codeStyle = { fontFamily: "'IBM Plex Mono', 'Courier New', Courier, monospace", fontSize: '28px', letterSpacing: '0.3em', fontWeight: 'bold' as const, color: '#111418', backgroundColor: '#F4EFE8', padding: '16px 20px', textAlign: 'center' as const, margin: '12px 0 24px' }
const hr = { borderColor: '#e8e4dd', margin: '28px 0 16px' }
const footer = { fontSize: '12px', color: '#8a8a8a', lineHeight: '1.5', margin: 0 }
const signature = { padding: '20px 32px 28px', borderTop: '1px solid #e8e4dd', backgroundColor: '#F4EFE8' }
const sigName = { fontFamily: "'Libre Baskerville', Georgia, serif", fontSize: '14px', color: '#111418', margin: 0, fontWeight: 'bold' as const }
const sigRole = { fontSize: '12px', color: '#6b6b6b', margin: '4px 0 0' }
const sigContact = { fontSize: '12px', color: '#C4632D', margin: '4px 0 0' }
