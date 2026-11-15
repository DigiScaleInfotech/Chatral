import { Router } from 'express';
import { z } from 'zod';
import nodemailer from 'nodemailer';
import { config } from '../config.js';

const router = Router();

const ContactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Valid email is required'),
  company: z.string().trim().optional().default(''),
  topic: z.string().trim().optional().default('Schedule a Live Demo'),
  message: z.string().trim().min(1, 'Message is required'),
});

router.post('/contact', async (req, res, next) => {
  try {
    const data = ContactSchema.parse(req.body);

    console.log(`[contact] New inquiry from ${data.name} <${data.email}> [${data.topic}] - Company: ${data.company || 'N/A'}`);

    // If SMTP is configured on the server, send email alert to digiscaleinfotech@gmail.com
    if (config.smtp?.host && config.smtp?.user) {
      try {
        const transporter = nodemailer.createTransport({
          host: config.smtp.host,
          port: Number(config.smtp.port),
          secure: config.smtp.secure !== false && config.smtp.secure !== 'false',
          auth: { user: config.smtp.user, pass: config.smtp.pass },
          connectionTimeout: 10_000,
        });

        await transporter.sendMail({
          from: config.smtp.from || config.smtp.user,
          to: 'digiscaleinfotech@gmail.com',
          replyTo: data.email,
          subject: `[Chatral Contact Form] ${data.topic} - ${data.name}`,
          text: `You have received a new inquiry from the Chatral landing page.\n\nName: ${data.name}\nEmail: ${data.email}\nCompany: ${data.company || 'N/A'}\nTopic: ${data.topic}\n\nMessage:\n${data.message}\n\nSent at: ${new Date().toLocaleString()}`,
        });
      } catch (err) {
        console.warn('[contact] Could not send email via server SMTP:', err.message);
      }
    }

    res.json({ ok: true, message: 'Message received successfully.' });
  } catch (err) {
    next(err);
  }
});

export default router;
