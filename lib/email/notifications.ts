/**
 * Email Notification Service
 * 
 * This module handles sending email notifications for the access management system.
 * Configure RESEND_API_KEY in your environment variables to enable email sending.
 * 
 * If no email service is configured, notifications will be logged to console.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'alfadiallo@mac.com';
const FROM_EMAIL = process.env.FROM_EMAIL || 'Elevate <noreply@lev8.ai>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://lev8.ai';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email using Resend API
 * Falls back to console logging if RESEND_API_KEY is not configured
 */
async function sendEmail(options: EmailOptions): Promise<boolean> {
  const { to, subject, html, text } = options;

  // If no API key, log to console (development mode)
  if (!RESEND_API_KEY) {
    console.log('[Email] (DEV MODE - No RESEND_API_KEY configured)');
    console.log('[Email] To:', to);
    console.log('[Email] Subject:', subject);
    console.log('[Email] Content:', text || html.replace(/<[^>]*>/g, ''));
    return true;
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to,
        subject,
        html,
        text,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[Email] Send failed:', error);
      return false;
    }

    console.log('[Email] Sent successfully to:', to);
    return true;
  } catch (error) {
    console.error('[Email] Error sending email:', error);
    return false;
  }
}

/**
 * Notify admin of a new access request
 */
export async function notifyAdminOfNewRequest(request: {
  id: string;
  full_name: string;
  personal_email: string;
  institutional_email?: string;
  requested_role: string;
  reason?: string;
}): Promise<boolean> {
  const { id, full_name, personal_email, institutional_email, requested_role, reason } = request;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .field { margin-bottom: 15px; }
          .label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
          .value { font-size: 16px; color: #111827; }
          .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">New Access Request</h1>
            <p style="margin: 10px 0 0; opacity: 0.9;">Someone wants to join Elevate</p>
          </div>
          <div class="content">
            <div class="field">
              <div class="label">Name</div>
              <div class="value">${full_name}</div>
            </div>
            <div class="field">
              <div class="label">Personal Email</div>
              <div class="value">${personal_email}</div>
            </div>
            ${institutional_email ? `
            <div class="field">
              <div class="label">Institutional Email</div>
              <div class="value">${institutional_email}</div>
            </div>
            ` : ''}
            <div class="field">
              <div class="label">Requested Role</div>
              <div class="value">${requested_role}</div>
            </div>
            ${reason ? `
            <div class="field">
              <div class="label">Reason</div>
              <div class="value">${reason}</div>
            </div>
            ` : ''}
            <a href="${APP_URL}/admin/requests?id=${id}" class="button">
              Review Request
            </a>
          </div>
          <div class="footer">
            <p>Elevate by lev8.ai</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
New Access Request

Name: ${full_name}
Personal Email: ${personal_email}
${institutional_email ? `Institutional Email: ${institutional_email}` : ''}
Requested Role: ${requested_role}
${reason ? `Reason: ${reason}` : ''}

Review this request: ${APP_URL}/admin/requests?id=${id}
  `.trim();

  return sendEmail({
    to: ADMIN_EMAIL,
    subject: `[Elevate] New Access Request from ${full_name}`,
    html,
    text,
  });
}

/**
 * Notify user that their request has been received
 */
export async function notifyUserRequestReceived(request: {
  full_name: string;
  personal_email: string;
}): Promise<boolean> {
  const { full_name, personal_email } = request;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; text-align: center; }
          .icon { font-size: 48px; margin-bottom: 20px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">Request Received</h1>
          </div>
          <div class="content">
            <div class="icon">✅</div>
            <h2 style="color: #111827; margin: 0 0 15px;">Thank you, ${full_name.split(' ')[0]}!</h2>
            <p style="color: #6b7280; margin: 0;">
              We've received your access request for Elevate. Our team will review your application and get back to you within 24 hours.
            </p>
          </div>
          <div class="footer">
            <p>Elevate by lev8.ai</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Hi ${full_name.split(' ')[0]},

Thank you for your interest in Elevate!

We've received your access request and will review it shortly. You should hear back from us within 24 hours.

Best,
The Elevate Team
  `.trim();

  return sendEmail({
    to: personal_email,
    subject: '[Elevate] Access Request Received',
    html,
    text,
  });
}

/**
 * Notify user that their account has been approved
 */
export async function notifyUserApproved(user: {
  full_name: string;
  email: string;
  reset_link?: string;
}): Promise<boolean> {
  const { full_name, email, reset_link } = user;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">🎉 Welcome to Elevate!</h1>
          </div>
          <div class="content" style="text-align: center;">
            <h2 style="color: #111827; margin: 0 0 15px;">Your account is ready, ${full_name.split(' ')[0]}!</h2>
            <p style="color: #6b7280;">
              Your access request has been approved. Click the button below to set your password and start using Elevate.
            </p>
            ${reset_link ? `
            <a href="${reset_link}" class="button">
              Set Your Password
            </a>
            ` : `
            <a href="${APP_URL}/login" class="button">
              Log In
            </a>
            `}
            <p style="color: #9ca3af; font-size: 14px; margin-top: 30px;">
              If you didn't request this account, please ignore this email.
            </p>
          </div>
          <div class="footer">
            <p>Elevate by lev8.ai</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Welcome to Elevate, ${full_name.split(' ')[0]}!

Your access request has been approved. You can now log in to your account.

${reset_link ? `Set your password: ${reset_link}` : `Log in: ${APP_URL}/login`}

If you didn't request this account, please ignore this email.

Best,
The Elevate Team
  `.trim();

  return sendEmail({
    to: email,
    subject: '🎉 Welcome to Elevate - Your Account is Ready!',
    html,
    text,
  });
}

/**
 * Notify user that their request has been rejected
 */
export async function notifyUserRejected(user: {
  full_name: string;
  email: string;
  reason?: string;
}): Promise<boolean> {
  const { full_name, email, reason } = user;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #6b7280; color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; text-align: center; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">Access Request Update</h1>
          </div>
          <div class="content">
            <h2 style="color: #111827; margin: 0 0 15px;">Hi ${full_name.split(' ')[0]},</h2>
            <p style="color: #6b7280;">
              Thank you for your interest in Elevate. After reviewing your application, we're unable to approve access at this time.
            </p>
            ${reason ? `
            <p style="color: #6b7280; background: #f3f4f6; padding: 15px; border-radius: 8px; margin-top: 20px;">
              <strong>Note:</strong> ${reason}
            </p>
            ` : ''}
            <p style="color: #6b7280; margin-top: 20px;">
              If you believe this was a mistake or have questions, please reach out to us.
            </p>
          </div>
          <div class="footer">
            <p>Elevate by lev8.ai</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
Hi ${full_name.split(' ')[0]},

Thank you for your interest in Elevate. After reviewing your application, we're unable to approve access at this time.

${reason ? `Note: ${reason}` : ''}

If you believe this was a mistake or have questions, please reach out to us.

Best,
The Elevate Team
  `.trim();

  return sendEmail({
    to: email,
    subject: '[Elevate] Access Request Update',
    html,
    text,
  });
}

