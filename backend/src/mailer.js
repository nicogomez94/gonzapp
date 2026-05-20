const nodemailer = require('nodemailer');

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const FROM = () => process.env.SMTP_FROM || `"AutoZona" <${process.env.SMTP_USER}>`;

async function sendListingActiveEmail({ to, userName, listingTitle, listingId }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('[mailer] SMTP no configurado (SMTP_USER / SMTP_PASS), email no enviado');
    return;
  }

  const listingUrl = process.env.FRONTEND_URL
    ? `${process.env.FRONTEND_URL.replace(/\/$/, '')}/publicaciones/${listingId}`
    : null;

  const transporter = createTransporter();

  await transporter.sendMail({
    from: FROM(),
    to,
    subject: '¡Tu publicación está activa en AutoZona!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a2e;">
        <div style="background: #1a56db; padding: 24px 32px; border-radius: 12px 12px 0 0;">
          <h1 style="color: #fff; margin: 0; font-size: 1.4rem;">AutoZona</h1>
        </div>
        <div style="background: #f9fafb; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb;">
          <h2 style="margin-top: 0; color: #1a1a2e;">¡Hola, ${userName}!</h2>
          <p style="color: #374151; line-height: 1.6;">
            Tu publicación <strong>"${listingTitle}"</strong> fue revisada por nuestro equipo y ya está
            <span style="color: #16a34a; font-weight: 700;">activa</span> en AutoZona.
          </p>
          <p style="color: #374151; line-height: 1.6;">
            Los interesados ya pueden verla y ponerse en contacto con vos.
          </p>
          ${listingUrl ? `
          <div style="margin: 28px 0;">
            <a href="${listingUrl}" style="background: #1a56db; color: #fff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">
              Ver mi publicación
            </a>
          </div>` : ''}
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 28px 0;" />
          <p style="color: #9ca3af; font-size: 0.82rem; margin: 0;">
            Este es un mensaje automático de AutoZona. Por favor, no respondas este email.
          </p>
        </div>
      </div>
    `,
  });
}

module.exports = { sendListingActiveEmail };
