const CONTACT_SERVICE_URL = process.env.CONTACT_EMAIL_SERVICE_URL || 'https://contact-form-service-e8aa.onrender.com/api/contact';
const SITE_NAME = process.env.CONTACT_SITE || 'AutoZona';
const FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || 'info@autozona.com.ar';

async function sendEmail({ to, name, subject, message }) {
  const response = await fetch(CONTACT_SERVICE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: name || SITE_NAME,
      email: FROM_EMAIL,
      to,
      message: `${subject}\n\n${message}`,
      site: SITE_NAME,
      company: '',
    }),
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok || data?.success !== true) {
    throw new Error(data?.error || `Email service failed with status ${response.status}`);
  }
}

async function sendRegistrationConfirmationEmail({ to, userName }) {
  const safeName = userName || 'Usuario';
  const baseUrl = process.env.FRONTEND_URL?.split(',')[0]?.trim().replace(/\/$/, '');
  const plansUrl = baseUrl ? `\n\nElegí tu plan acá: ${baseUrl}/planes` : '';

  await sendEmail({
    to,
    name: SITE_NAME,
    subject: 'Confirmamos la creación de tu cuenta en AutoZona',
    message: `Hola, ${safeName}.\n\nTu cuenta fue creada correctamente. Ya podés ingresar a AutoZona y elegir un plan para publicar tu auto.${plansUrl}\n\nSi no fuiste vos quien creó esta cuenta, podés ignorar este mensaje.`,
  });
}

async function sendListingActiveEmail({ to, userName, listingTitle, listingId }) {
  const safeName = userName || 'Usuario';
  const safeTitle = listingTitle || 'Tu publicación';
  const listingUrl = process.env.FRONTEND_URL
    ? `\n\nVer mi publicación: ${process.env.FRONTEND_URL.replace(/\/$/, '')}/publicaciones/${listingId}`
    : '';

  await sendEmail({
    to,
    name: SITE_NAME,
    subject: 'Tu publicación está activa en AutoZona',
    message: `Hola, ${safeName}.\n\nTu publicación "${safeTitle}" fue revisada por nuestro equipo y ya está activa en AutoZona. Los interesados ya pueden verla y ponerse en contacto con vos.${listingUrl}`,
  });
}

async function sendPasswordResetEmail({ to, userName, resetUrl }) {
  const safeName = userName || 'Usuario';

  await sendEmail({
    to,
    name: SITE_NAME,
    subject: 'Restablecé tu contraseña en AutoZona',
    message: `Hola, ${safeName}.\n\nRecibimos una solicitud para restablecer la contraseña de tu cuenta.\n\nHacé clic en el siguiente enlace para crear una nueva contraseña (válido por 1 hora):\n${resetUrl}\n\nSi no fuiste vos quien lo solicitó, podés ignorar este mensaje. Tu contraseña no cambiará.`,
  });
}

module.exports = { sendListingActiveEmail, sendRegistrationConfirmationEmail, sendPasswordResetEmail };
