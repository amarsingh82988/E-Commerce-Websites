import nodemailer from "nodemailer";
import { env, isConfigured } from "../config/env.js";

/**
 * Generate a random 6-digit numeric OTP code
 */
export function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Send an OTP email to the target address (or log mock email in dev if SMTP is not configured)
 */
export async function sendOtpEmail(to, code, subject = "Your OTP Code") {
  if (!isConfigured.smtp) {
    console.log(`
=========================================
[DEV] MOCK EMAIL SENT
To: ${to}
Subject: ${subject}
OTP Code: ${code}
=========================================
`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: {
      user: env.smtp.user,
      pass: env.smtp.pass,
    },
  });

  const mailOptions = {
    from: env.smtp.from,
    to,
    subject,
    text: `Your OTP code is: ${code}\nIt will expire in 10 minutes.`,
  };

  await transporter.sendMail(mailOptions);
}
