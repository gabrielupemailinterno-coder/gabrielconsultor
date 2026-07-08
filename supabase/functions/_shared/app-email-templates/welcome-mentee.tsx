/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'

interface Props {
  fullName: string
  email: string
  tempPassword: string
  portalUrl?: string
}

export const WelcomeMenteeEmail = ({ fullName, email, tempPassword, portalUrl = 'https://gabrielconsultor.com/app/login' }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Seu acesso ao Portal do Mentorado está liberado</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brand}>GABRIEL VIEIRA</Text>
          <Text style={brandSub}>Mentoria Comercial 1:1</Text>
        </Section>
        <Section style={accent} />
        <Section style={content}>
          <Heading style={h1}>Bem-vindo, {fullName.split(' ')[0]}.</Heading>
          <Text style={text}>
            Seu acesso ao <strong>Portal do Mentorado</strong> foi liberado. A partir de agora você tem acesso ao cronograma de reuniões, materiais e atividades práticas da mentoria.
          </Text>
          <Section style={credBox}>
            <Text style={credLabel}>E-MAIL</Text>
            <Text style={credValue}>{email}</Text>
            <Text style={credLabel}>SENHA TEMPORÁRIA</Text>
            <Text style={credValueMono}>{tempPassword}</Text>
          </Section>
          <Section style={{ textAlign: 'center', margin: '28px 0 8px' }}>
            <Button style={button} href={portalUrl}>Acessar o Portal</Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            Recomendamos trocar a senha no primeiro acesso. Para qualquer dúvida, é só responder este e-mail.
          </Text>
        </Section>
        <Section style={signature}>
          <Text style={sigName}>Gabriel Vieira</Text>
          <Text style={sigRole}>Consultor & Mentor Comercial · São João del Rei, MG</Text>
          <Text style={sigContact}>gabriel@gabrielconsultor.com</Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default WelcomeMenteeEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter','Helvetica Neue',Arial,sans-serif", margin: 0, padding: '24px 0' }
const container = { maxWidth: '560px', margin: '0 auto', backgroundColor: '#ffffff', border: '1px solid #e8e4dd' }
const header = { padding: '28px 32px 16px', textAlign: 'center' as const }
const brand = { fontFamily: "'Libre Baskerville',Georgia,serif", fontSize: '20px', letterSpacing: '0.18em', color: '#111418', margin: 0, fontWeight: 'bold' as const }
const brandSub = { fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: '#6b6b6b', margin: '6px 0 0' }
const accent = { height: '3px', backgroundColor: '#C4632D' }
const content = { padding: '32px' }
const h1 = { fontFamily: "'Libre Baskerville',Georgia,serif", fontSize: '26px', lineHeight: '1.25', color: '#111418', margin: '0 0 18px', fontWeight: 'normal' as const }
const text = { fontSize: '15px', lineHeight: '1.65', color: '#3a3a3a', margin: '0 0 16px' }
const credBox = { backgroundColor: '#F4EFE8', border: '1px solid #e8e4dd', padding: '18px 20px', margin: '20px 0' }
const credLabel = { fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: '#8a8a8a', margin: '0 0 4px' }
const credValue = { fontSize: '15px', color: '#111418', margin: '0 0 14px', fontWeight: 'bold' as const }
const credValueMono = { fontFamily: "'IBM Plex Mono','Courier New',monospace", fontSize: '15px', color: '#6E1F2F', margin: 0, fontWeight: 'bold' as const, letterSpacing: '0.05em' }
const button = { backgroundColor: '#C4632D', color: '#F4EFE8', fontSize: '14px', fontWeight: 'bold' as const, letterSpacing: '0.08em', textTransform: 'uppercase' as const, borderRadius: '2px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block' }
const hr = { borderColor: '#e8e4dd', margin: '24px 0 14px' }
const footer = { fontSize: '12px', color: '#8a8a8a', lineHeight: '1.5', margin: 0 }
const signature = { padding: '20px 32px 28px', borderTop: '1px solid #e8e4dd', backgroundColor: '#F4EFE8' }
const sigName = { fontFamily: "'Libre Baskerville',Georgia,serif", fontSize: '14px', color: '#111418', margin: 0, fontWeight: 'bold' as const }
const sigRole = { fontSize: '12px', color: '#6b6b6b', margin: '4px 0 0' }
const sigContact = { fontSize: '12px', color: '#C4632D', margin: '4px 0 0' }
