/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'

interface Props {
  fullName: string
  activityTitle: string
  activityDescription?: string
  portalUrl?: string
}

export const ActivityAvailableEmail = ({ fullName, activityTitle, activityDescription, portalUrl = 'https://gabrielconsultor.com/mentorados' }: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Nova atividade disponível: {activityTitle}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brand}>GABRIEL VIEIRA</Text>
          <Text style={brandSub}>Mentoria Comercial 1:1</Text>
        </Section>
        <Section style={accent} />
        <Section style={content}>
          <Heading style={h1}>Nova atividade prática.</Heading>
          <Text style={text}>
            Olá {fullName.split(' ')[0]}, foi liberada uma nova atividade para você aplicar na sua operação.
          </Text>
          <Section style={box}>
            <Text style={boxLabel}>ATIVIDADE</Text>
            <Text style={boxValue}>{activityTitle}</Text>
            {activityDescription && <Text style={text}>{activityDescription}</Text>}
          </Section>
          <Section style={{ textAlign: 'center', margin: '24px 0 8px' }}>
            <Button style={button} href={portalUrl}>Ver no Portal</Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            Conclua a atividade antes da próxima sessão para discutirmos os resultados.
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

export default ActivityAvailableEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter',sans-serif", margin: 0, padding: '24px 0' }
const container = { maxWidth: '560px', margin: '0 auto', backgroundColor: '#ffffff', border: '1px solid #e8e4dd' }
const header = { padding: '28px 32px 16px', textAlign: 'center' as const }
const brand = { fontFamily: "'Libre Baskerville',Georgia,serif", fontSize: '20px', letterSpacing: '0.18em', color: '#111418', margin: 0, fontWeight: 'bold' as const }
const brandSub = { fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: '#6b6b6b', margin: '6px 0 0' }
const accent = { height: '3px', backgroundColor: '#C4632D' }
const content = { padding: '32px' }
const h1 = { fontFamily: "'Libre Baskerville',Georgia,serif", fontSize: '24px', lineHeight: '1.25', color: '#111418', margin: '0 0 14px', fontWeight: 'normal' as const }
const text = { fontSize: '15px', lineHeight: '1.65', color: '#3a3a3a', margin: '0 0 12px' }
const box = { backgroundColor: '#F4EFE8', border: '1px solid #e8e4dd', padding: '18px 20px', margin: '18px 0 4px' }
const boxLabel = { fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase' as const, color: '#8a8a8a', margin: '0 0 4px' }
const boxValue = { fontSize: '15px', color: '#111418', margin: '0 0 10px', fontWeight: 'bold' as const }
const button = { backgroundColor: '#C4632D', color: '#F4EFE8', fontSize: '14px', fontWeight: 'bold' as const, letterSpacing: '0.08em', textTransform: 'uppercase' as const, borderRadius: '2px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block' }
const hr = { borderColor: '#e8e4dd', margin: '24px 0 14px' }
const footer = { fontSize: '12px', color: '#8a8a8a', lineHeight: '1.5', margin: 0 }
const signature = { padding: '18px 32px 24px', borderTop: '1px solid #e8e4dd', backgroundColor: '#F4EFE8' }
const sigName = { fontFamily: "'Libre Baskerville',Georgia,serif", fontSize: '14px', color: '#111418', margin: 0, fontWeight: 'bold' as const }
const sigContact = { fontSize: '12px', color: '#C4632D', margin: '4px 0 0' }
