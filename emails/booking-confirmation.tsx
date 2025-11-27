import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
  Link,
} from '@react-email/components'

interface BookingConfirmationEmailProps {
  customerName: string
  businessName: string
  serviceName: string
  date: string
  time: string
  duration: number
  price: number
  businessAddress?: string
  businessPhone?: string
  businessEmail?: string
  bookingId: string
}

export default function BookingConfirmationEmail({
  customerName,
  businessName,
  serviceName,
  date,
  time,
  duration,
  price,
  businessAddress,
  businessPhone,
  businessEmail,
  bookingId
}: BookingConfirmationEmailProps) {
  const previewText = `Your booking for ${serviceName} is confirmed`

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Booking Confirmed! ✓</Heading>
          
          <Text style={text}>
            Hi {customerName},
          </Text>
          
          <Text style={text}>
            Your booking with <strong>{businessName}</strong> has been confirmed.
          </Text>

          <Section style={bookingDetails}>
            <Heading style={h2}>Booking Details</Heading>
            
            <table style={detailsTable}>
              <tr>
                <td style={labelCell}>Service:</td>
                <td style={valueCell}>{serviceName}</td>
              </tr>
              <tr>
                <td style={labelCell}>Date:</td>
                <td style={valueCell}>{date}</td>
              </tr>
              <tr>
                <td style={labelCell}>Time:</td>
                <td style={valueCell}>{time}</td>
              </tr>
              <tr>
                <td style={labelCell}>Duration:</td>
                <td style={valueCell}>{duration} minutes</td>
              </tr>
              <tr>
                <td style={labelCell}>Price:</td>
                <td style={valueCell}>${price.toFixed(2)}</td>
              </tr>
            </table>
          </Section>

          {businessAddress && (
            <Section style={section}>
              <Heading style={h3}>Location</Heading>
              <Text style={text}>{businessAddress}</Text>
            </Section>
          )}

          <Section style={section}>
            <Heading style={h3}>Contact Information</Heading>
            {businessPhone && <Text style={text}>Phone: {businessPhone}</Text>}
            {businessEmail && <Text style={text}>Email: {businessEmail}</Text>}
          </Section>

          <Section style={buttonSection}>
            <Button style={button} href={`${process.env.NEXT_PUBLIC_APP_URL}/booking/${bookingId}`}>
              View Booking Details
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            Need to make changes? Contact {businessName} directly.
          </Text>
          
          <Text style={footer}>
            Booking ID: {bookingId}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
}

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0 40px',
}

const h2 = {
  color: '#333',
  fontSize: '20px',
  fontWeight: 'bold',
  margin: '20px 0 10px',
}

const h3 = {
  color: '#333',
  fontSize: '16px',
  fontWeight: 'bold',
  margin: '16px 0 8px',
}

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 40px',
}

const section = {
  padding: '0 40px',
  marginTop: '24px',
}

const bookingDetails = {
  backgroundColor: '#f9fafb',
  borderRadius: '8px',
  padding: '24px 40px',
  margin: '24px 40px',
}

const detailsTable = {
  width: '100%',
  borderCollapse: 'collapse' as const,
}

const labelCell = {
  color: '#6b7280',
  fontSize: '14px',
  paddingBottom: '12px',
  width: '120px',
}

const valueCell = {
  color: '#111827',
  fontSize: '16px',
  fontWeight: '500',
  paddingBottom: '12px',
}

const buttonSection = {
  padding: '32px 40px',
  textAlign: 'center' as const,
}

const button = {
  backgroundColor: '#6366f1',
  borderRadius: '6px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 32px',
}

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 40px',
}

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '8px 40px',
}
