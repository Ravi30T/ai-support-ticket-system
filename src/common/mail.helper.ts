/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import * as nodemailer from 'nodemailer';
import { Logger } from '@nestjs/common';

const logger = new Logger('MailHelper');

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (transporter) {
    return transporter;
  }

  const user = process.env.EMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

  if (!user || !pass) {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      transporter = nodemailer.createTransport({
        host: 'smtp.resend.com',
        port: 465,
        secure: true,
        auth: {
          user: 'resend',
          pass: resendApiKey,
        },
      });
      return transporter;
    }
    return null;
  }

  const isGmail = user.endsWith('@gmail.com');
  const host =
    process.env.SMTP_HOST || (isGmail ? 'smtp.gmail.com' : 'smtp.resend.com');
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = process.env.SMTP_SECURE
    ? process.env.SMTP_SECURE === 'true'
    : port === 465;

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  return transporter;
}

/**
 * Sends an email using Nodemailer.
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<any> {
  const client = getTransporter();
  if (!client) {
    logger.error(
      `Bypassing email to ${to} (Subject: ${subject}) because Nodemailer transporter is not initialized (missing SMTP credentials or RESEND_API_KEY).`,
    );
    return { success: false, message: 'Nodemailer not initialized' };
  }

  try {
    const fromUser = process.env.EMAIL_USER || 'onboarding@resend.dev';
    const fromAddress = `Smart Support <${fromUser}>`;
    const info = await client.sendMail({
      from: fromAddress,
      to,
      subject,
      html,
    });
    logger.log(
      `Email successfully sent to ${to}. Message ID: ${info.messageId}`,
    );
    return { success: true, data: info };
  } catch (error) {
    logger.error(
      `Failed to send email to ${to}: ${error instanceof Error ? error.message : String(error)}`,
    );
    throw error;
  }
}

/**
 * Generates HTML for the User/Admin OTP verification email.
 */
export function getUserOtpEmailTemplate(
  name: string,
  otp: string | number,
): string {
  const appName = 'Smart Support Ticketing System';
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Account</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #f8fafc;
          color: #1e293b;
        }
        .wrapper {
          width: 100%;
          background-color: #f8fafc;
          padding: 40px 0;
        }
        .container {
          max-width: 580px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }
        .header-gradient {
          height: 6px;
          background: linear-gradient(90deg, #3b82f6 0%, #8b5cf6 100%);
        }
        .content {
          padding: 40px;
        }
        .logo {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 24px;
          letter-spacing: -0.5px;
        }
        .logo-accent {
          color: #4f46e5;
        }
        .title {
          font-size: 24px;
          font-weight: 700;
          color: #0f172a;
          margin-top: 0;
          margin-bottom: 16px;
          line-height: 1.25;
        }
        .text {
          font-size: 16px;
          line-height: 1.6;
          color: #475569;
          margin-top: 0;
          margin-bottom: 24px;
        }
        .otp-container {
          background: linear-gradient(135deg, #f1f5f9 0%, #f8fafc 100%);
          border: 1px dashed #cbd5e1;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          margin: 32px 0;
        }
        .otp-label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #64748b;
          margin-bottom: 8px;
          font-weight: 600;
        }
        .otp-code {
          font-family: 'Courier New', Courier, monospace;
          font-size: 36px;
          font-weight: 800;
          letter-spacing: 8px;
          color: #4f46e5;
          margin: 0;
        }
        .footer {
          background-color: #f1f5f9;
          padding: 24px 40px;
          text-align: center;
          font-size: 13px;
          color: #64748b;
          border-top: 1px solid #e2e8f0;
        }
        .divider {
          height: 1px;
          background-color: #e2e8f0;
          margin: 24px 0;
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header-gradient"></div>
          <div class="content">
            <div class="logo">
              <span class="logo-accent">⚡</span> ${appName}
            </div>
            <h1 class="title">Verify your email address</h1>
            <p class="text">Hi ${name},</p>
            <p class="text">Thank you for signing up for <strong>${appName}</strong>. To complete your verification, please use the 6-digit One-Time Password (OTP) below. This OTP is valid for 24 hours.</p>
            
            <div class="otp-container">
              <div class="otp-label">Verification Code</div>
              <div class="otp-code">${otp}</div>
            </div>

            <p class="text">If you did not request this email, you can safely ignore it. Your account will remain secure.</p>
            <div class="divider"></div>
            <p class="text" style="font-size: 14px; color: #94a3b8;">Please do not reply to this message. If you have any questions, contact our support team.</p>
          </div>
          <div class="footer">
            © 2026 ${appName}. All rights reserved.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generates HTML for the Admin invitation email.
 */
export function getAdminInviteEmailTemplate(
  name: string,
  otp: string | number,
  token: string,
): string {
  const appName = 'Smart Support Ticketing System';
  // Let's configure a mock setup URL or a URL pointing to the backend's page or typical frontend route
  const setupUrl = `http://localhost:3000/auth/setup-admin?token=${token}`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Admin Invitation - Smart Support</title>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #f8fafc;
          color: #1e293b;
        }
        .wrapper {
          width: 100%;
          background-color: #f8fafc;
          padding: 40px 0;
        }
        .container {
          max-width: 580px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e2e8f0;
        }
        .header-gradient {
          height: 6px;
          background: linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%);
        }
        .content {
          padding: 40px;
        }
        .logo {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 24px;
          letter-spacing: -0.5px;
        }
        .logo-accent {
          color: #4f46e5;
        }
        .title {
          font-size: 24px;
          font-weight: 700;
          color: #0f172a;
          margin-top: 0;
          margin-bottom: 16px;
          line-height: 1.25;
        }
        .text {
          font-size: 16px;
          line-height: 1.6;
          color: #475569;
          margin-top: 0;
          margin-bottom: 24px;
        }
        .otp-container {
          background: linear-gradient(135deg, #f1f5f9 0%, #f8fafc 100%);
          border: 1px dashed #cbd5e1;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          margin: 32px 0;
        }
        .otp-label {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #64748b;
          margin-bottom: 8px;
          font-weight: 600;
        }
        .otp-code {
          font-family: 'Courier New', Courier, monospace;
          font-size: 36px;
          font-weight: 800;
          letter-spacing: 8px;
          color: #7c3aed;
          margin: 0;
        }
        .button-container {
          text-align: center;
          margin: 32px 0;
        }
        .btn {
          display: inline-block;
          background: linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%);
          color: #ffffff !important;
          text-decoration: none;
          padding: 14px 30px;
          font-weight: 600;
          font-size: 16px;
          border-radius: 8px;
          text-align: center;
          box-shadow: 0 4px 10px rgba(79, 70, 229, 0.2);
        }
        .footer {
          background-color: #f1f5f9;
          padding: 24px 40px;
          text-align: center;
          font-size: 13px;
          color: #64748b;
          border-top: 1px solid #e2e8f0;
        }
        .divider {
          height: 1px;
          background-color: #e2e8f0;
          margin: 24px 0;
        }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header-gradient"></div>
          <div class="content">
            <div class="logo">
              <span class="logo-accent">🛡️</span> ${appName}
            </div>
            <h1 class="title">Join as an Administrator</h1>
            <p class="text">Hi ${name},</p>
            <p class="text">You have been invited to join the <strong>${appName}</strong> team as an Administrator. To complete your account setup and choose your password, please use the One-Time Password (OTP) below and click the button to set up your account.</p>
            
            <div class="otp-container">
              <div class="otp-label">Setup Code</div>
              <div class="otp-code">${otp}</div>
            </div>

            <div class="button-container">
              <a href="${setupUrl}" class="btn" target="_blank">Complete Account Setup</a>
            </div>

            <p class="text" style="font-size: 14px; color: #64748b;">Or copy and paste this link into your browser:<br>
            <a href="${setupUrl}" style="color: #4f46e5; word-break: break-all;">${setupUrl}</a></p>

            <p class="text">This invitation is valid for 24 hours. Please complete your setup before then.</p>
            <div class="divider"></div>
            <p class="text" style="font-size: 14px; color: #94a3b8;">Please do not reply to this message. If you did not expect this invitation, you can ignore this email.</p>
          </div>
          <div class="footer">
            © 2026 ${appName}. All rights reserved.
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}
