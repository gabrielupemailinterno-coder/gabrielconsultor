/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Hr, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'

interface Props {
  fullName: string
  eyebrow?: string          // ex.: "INSIGHT DA SEMANA"
  title: string             // título principal
  intro: string             // parágrafo de abertura
  bullets?: string[]        // pontos-chave (opcional)
  body?: string             // parágrafo extra (opcional)
  ctaLabel?: string         // ex.: "Ler artigo completo"
  ctaUrl?: string           // link do post
  closing?: string          // fechamento (opcional)
}

export const BlogInsightEmail = ({
  fullName,
  eyebrow = 'INSIGHT',
  title,
  intro,
  bullets,
  body,
  ctaLabel,
  ctaUrl,
  closing,
}: Props) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>{title}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brand}>GABRIEL VIEIRA</Text>
          <Text style={brandSub}>Mentoria Comercial 1:1</Text>
        </Section>
        <Section style={accent} />
        <Section style={content}>
          <Text style={eyebrowStyle}>{eyebrow}</Text>
          <Heading style={h1}>{title}</Heading>
          <Text style={greet}>Olá, {fullName.split(' ')[0]}.</Text>
          <Text style={text}>{intro}</Text>

          {bullets && bullets.length > 0 && (
            <Section style={bulletBox}>
              {bullets.map((b, i) => (
                <Text key={i} style={bulletItem}>
                  <span style={bulletMark}>—</span> {b}
                </Text>
              ))}
            </Section>
          )}

          {body && <Text style={text}>{body}</Text>}

          {ctaUrl && ctaLabel && (
            <Section style={{ textAlign: 'center', margin: '28px 0 8px' }}>
              <Button style={button} href={ctaUrl}>{ctaLabel}</Button>
            </Section>
          )}

          {closing && (
            <>
              <Hr style={hr} />
              <Text style={footer}>{closing}</Text>
            </>
          )}
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

export default BlogInsightEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter','Helvetica Neue',Arial,sans-serif", margin: 0, padding: '24px 0' }
const container = { maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', border: '1px solid #e8e4dd' }
const header = { padding: '28px 32px 16px', textAlign: 'center' as const }
const brand = { fontFamily: "'Libre Baskerville',Georgia,serif", fontSize: '20px', letterSpacing: '0.18em', color: '#111418', margin: 0, fontWeight: 'bold' as const }
const brandSub = { fontSize: '11px', letterSpacing: '0.22em', textTransform: 'uppercase' as const, color: '#6b6b6b', margin: '6px 0 0' }
const accent = { height: '3px', backgroundColor: '#C4632D' }
const content = { padding: '32px' }
const eyebrowStyle = { fontSize: '11px', letterSpacing: '0.22em', color: '#C4632D', margin: '0 0 12px', fontWeight: 'bold' as const, textTransform: 'uppercase' as const }
const h1 = { fontFamily: "'Libre Baskerville',Georgia,serif", fontSize: '26px', lineHeight: '1.3', color: '#111418', margin: '0 0 18px', fontWeight: 'normal' as const }
const greet = { fontSize: '15px', color: '#111418', margin: '0 0 12px', fontWeight: 'bold' as const }
const text = { fontSize: '15px', lineHeight: '1.7', color: '#3a3a3a', margin: '0 0 16px' }
const bulletBox = { backgroundColor: '#F4EFE8', border: '1px solid #e8e4dd', borderLeft: '3px solid #C4632D', padding: '18px 22px', margin: '18px 0' }
const bulletItem = { fontSize: '14px', lineHeight: '1.6', color: '#111418', margin: '0 0 10px' }
const bulletMark = { color: '#C4632D', fontWeight: 'bold' as const, marginRight: '8px' }
const button = { backgroundColor: '#C4632D', color: '#F4EFE8', fontSize: '13px', fontWeight: 'bold' as const, letterSpacing: '0.08em', textTransform: 'uppercase' as const, borderRadius: '2px', padding: '14px 28px', textDecoration: 'none', display: 'inline-block' }
const hr = { borderColor: '#e8e4dd', margin: '24px 0 14px' }
const footer = { fontSize: '13px', color: '#6b6b6b', lineHeight: '1.6', margin: 0, fontStyle: 'italic' as const }
const signature = { padding: '20px 32px 28px', borderTop: '1px solid #e8e4dd', backgroundColor: '#F4EFE8' }
const sigName = { fontFamily: "'Libre Baskerville',Georgia,serif", fontSize: '14px', color: '#111418', margin: 0, fontWeight: 'bold' as const }
const sigRole = { fontSize: '12px', color: '#6b6b6b', margin: '4px 0 0' }
const sigContact = { fontSize: '12px', color: '#C4632D', margin: '4px 0 0' }
