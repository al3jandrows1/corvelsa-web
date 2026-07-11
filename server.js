require('dotenv').config();
const express = require('express');
const path = require('path');
const { Resend } = require('resend');

const app = express();
const PORT = process.env.PORT || 3000;
const resend = new Resend(process.env.RESEND_API_KEY);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==================== CONTACTO ====================
app.post('/api/contacto', async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ ok: false, error: 'Todos los campos son requeridos.' });
  }

  try {
    await resend.emails.send({
      from: 'Formulario CORVELSA <info@corvelsa.com>',
      to: process.env.MAIL_TO,
      replyTo: email,
      subject: `[Contacto Web] ${subject}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#0d4f8b;padding:24px 32px;border-radius:8px 8px 0 0;">
            <h2 style="color:#fff;margin:0;font-size:20px;">Nuevo mensaje desde corvelsa.com</h2>
          </div>
          <div style="background:#f8f9fa;padding:32px;border:1px solid #dee2e6;border-top:none;border-radius:0 0 8px 8px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr><td style="padding:8px 0;color:#6c757d;width:120px;font-size:14px;">Nombre</td><td style="padding:8px 0;font-weight:600;font-size:14px;">${name}</td></tr>
              <tr><td style="padding:8px 0;color:#6c757d;font-size:14px;">Correo</td><td style="padding:8px 0;font-size:14px;"><a href="mailto:${email}">${email}</a></td></tr>
              <tr><td style="padding:8px 0;color:#6c757d;font-size:14px;">Asunto</td><td style="padding:8px 0;font-size:14px;">${subject}</td></tr>
            </table>
            <hr style="border:none;border-top:1px solid #dee2e6;margin:20px 0;">
            <p style="color:#343a40;font-size:14px;line-height:1.7;white-space:pre-wrap;">${message}</p>
          </div>
          <p style="color:#adb5bd;font-size:12px;text-align:center;margin-top:16px;">
            Mensaje enviado desde el formulario de contacto de <strong>corvelsa.com</strong>
          </p>
        </div>
      `,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('Error al enviar correo:', err.message);
    res.status(500).json({ ok: false, error: 'No se pudo enviar el mensaje. Intenta más tarde.' });
  }
});

// ==================== CHAT ====================
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ reply: 'Mensaje requerido.' });

  try {
    const n8nRes = await fetch(process.env.N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'sendMessage',
        sessionId: 'corvelsa-web',
        chatInput: message,
      }),
    });

    const data = await n8nRes.json();
    res.json({ reply: data.output || 'Lo siento, no pude procesar tu consulta.' });

  } catch (err) {
    console.error('Error al contactar n8n:', err.message);
    res.status(500).json({ reply: '⚠️ En este momento no puedo responder. Por favor, usa el formulario de contacto o llámanos al +502 5996-5350.' });
  }
});

app.listen(PORT, () => {
  console.log(`🌐 Servidor ejecutándose en http://localhost:${PORT}`);
});
