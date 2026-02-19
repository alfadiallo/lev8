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
const PULSECHECK_FROM_EMAIL = process.env.PULSECHECK_FROM_EMAIL || 'EQ·PQ·IQ <noreply@eqpqiq.com>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://lev8.ai';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string; // Optional override for workflow-specific from address
}

/**
 * Send an email using Resend API
 * Falls back to console logging if RESEND_API_KEY is not configured
 */
async function sendEmail(options: EmailOptions): Promise<boolean> {
  const { to, subject, html, text, from } = options;
  const fromAddress = from || FROM_EMAIL;

  // If no API key, log to console (development mode)
  if (!RESEND_API_KEY) {
    console.log('[Email] (DEV MODE - No RESEND_API_KEY configured)');
    console.log('[Email] From:', fromAddress);
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
        from: fromAddress,
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
              Go to Login
            </a>
            <p style="color: #6b7280; font-size: 14px; margin-top: 15px;">On the login page, use &quot;Forgot password?&quot; and enter this email to receive a new password-set link.</p>
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

/**
 * Notify admin of a demo visitor (Pulse Check / EQ·PQ·IQ)
 */
export async function notifyDemoVisitor(visitor: {
  email: string | null;
  visitorId: string;
  ip: string;
  isReturning: boolean;
  timestamp: string;
}): Promise<boolean> {
  const { email, visitorId, ip, isReturning, timestamp } = visitor;
  
  const DEMO_ADMIN_EMAIL = process.env.DEMO_NOTIFICATION_EMAIL || 'alfa@lev8.ai';

  const visitorType = isReturning ? 'Returning Visitor' : 'New Visitor';
  const formattedTime = new Date(timestamp).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #7C3AED 0%, #8B5CF6 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .field { margin-bottom: 15px; }
          .label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
          .value { font-size: 16px; color: #111827; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
          .new { background: #DCFCE7; color: #166534; }
          .returning { background: #DBEAFE; color: #1E40AF; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">📊 EQ·PQ·IQ Demo Access</h1>
            <p style="margin: 10px 0 0; opacity: 0.9;">${formattedTime}</p>
          </div>
          <div class="content">
            <div class="field">
              <span class="badge ${isReturning ? 'returning' : 'new'}">${visitorType}</span>
            </div>
            ${email ? `
            <div class="field">
              <div class="label">Email</div>
              <div class="value">${email}</div>
            </div>
            ` : ''}
            <div class="field">
              <div class="label">IP Address</div>
              <div class="value">${ip}</div>
            </div>
            <div class="field">
              <div class="label">Visitor ID</div>
              <div class="value" style="font-family: monospace; font-size: 14px;">${visitorId}</div>
            </div>
          </div>
          <div class="footer">
            <p>EQ·PQ·IQ Pulse Check Demo</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
EQ·PQ·IQ Demo Access - ${visitorType}

${email ? `Email: ${email}` : 'Email: Not provided'}
IP: ${ip}
Visitor ID: ${visitorId}
Time: ${formattedTime}
  `.trim();

  return sendEmail({
    to: DEMO_ADMIN_EMAIL,
    subject: `[EQ·PQ·IQ] ${isReturning ? '🔄 Returning' : '🆕 New'} Demo Visitor${email ? `: ${email}` : ''}`,
    html,
    text,
    from: PULSECHECK_FROM_EMAIL, // Use eqpqiq.com for Pulse Check emails
  });
}

/**
 * Notify admin of an EQ·PQ·IQ website visitor
 */
export async function notifyEqpqiqVisitor(visitor: {
  email: string;
  visitorId: string;
  page: string;
  ip: string;
  userAgent: string;
  isReturning: boolean;
  visitCount: number;
  timestamp: string;
}): Promise<boolean> {
  const { email, visitorId, page, ip, userAgent, isReturning, visitCount, timestamp } = visitor;

  const EQPQIQ_ADMIN_EMAIL = process.env.EQPQIQ_NOTIFICATION_EMAIL || 'hello@eqpqiq.com';

  const pageLabels: Record<string, string> = {
    '/': 'Landing Page',
    '/interview': 'Interview Assessment',
    '/pulsecheck': 'Pulse Check',
  };
  const pageLabel = pageLabels[page] || page;

  const visitorType = isReturning ? 'Returning Visitor' : 'New Visitor';
  const formattedTime = new Date(timestamp).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2D6A4F 0%, #40916C 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .field { margin-bottom: 15px; }
          .label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
          .value { font-size: 16px; color: #111827; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
          .new { background: #DCFCE7; color: #166534; }
          .returning { background: #DBEAFE; color: #1E40AF; }
          .page-badge { display: inline-block; padding: 4px 12px; border-radius: 8px; font-size: 13px; font-weight: 500; background: #F0FDF4; color: #166534; border: 1px solid #BBF7D0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">EQPQIQ.com Visitor</h1>
            <p style="margin: 10px 0 0; opacity: 0.9;">${formattedTime}</p>
          </div>
          <div class="content">
            <div class="field">
              <span class="badge ${isReturning ? 'returning' : 'new'}">${visitorType}</span>
            </div>
            <div class="field">
              <div class="label">Email</div>
              <div class="value">${email}</div>
            </div>
            <div class="field">
              <div class="label">Page Visited</div>
              <div class="value"><span class="page-badge">${pageLabel}</span></div>
            </div>
            <div class="field">
              <div class="label">IP Address</div>
              <div class="value">${ip}</div>
            </div>
            ${isReturning && visitCount > 1 ? `
            <div class="field">
              <div class="label">Total Visits</div>
              <div class="value">${visitCount}</div>
            </div>
            ` : ''}
            <div class="field">
              <div class="label">User Agent</div>
              <div class="value" style="font-size: 12px; color: #6b7280; word-break: break-all;">${userAgent}</div>
            </div>
            <div class="field">
              <div class="label">Visitor ID</div>
              <div class="value" style="font-family: monospace; font-size: 13px; color: #6b7280;">${visitorId}</div>
            </div>
          </div>
          <div class="footer">
            <p>EQ·PQ·IQ by lev8.ai</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
EQPQIQ.com site visitor

${visitorType}
Email: ${email}
Page: ${pageLabel}
IP: ${ip}
${isReturning && visitCount > 1 ? `Total Visits: ${visitCount}` : ''}
Time: ${formattedTime}
Visitor ID: ${visitorId}
  `.trim();

  return sendEmail({
    to: EQPQIQ_ADMIN_EMAIL,
    subject: 'EQPQIQ.com site visitor',
    html,
    text,
    from: PULSECHECK_FROM_EMAIL,
  });
}

/**
 * Notify admin of a new Studio creator access request
 */
export async function notifyStudioCreatorRequest(request: {
  user_email: string;
  display_name: string;
  affiliation: string;
  specialty?: string;
  bio?: string;
}): Promise<boolean> {
  const { user_email, display_name, affiliation, specialty, bio } = request;
  
  // Send to the specific Studio admin email
  const STUDIO_ADMIN_EMAIL = 'findme@alfadiallo.com';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%); color: white; padding: 30px; border-radius: 12px 12px 0 0; }
          .content { background: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-top: none; }
          .field { margin-bottom: 15px; }
          .label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
          .value { font-size: 16px; color: #111827; }
          .button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; font-size: 24px;">✨ New Studio Creator Request</h1>
            <p style="margin: 10px 0 0; opacity: 0.9;">Someone wants to create content in Studio</p>
          </div>
          <div class="content">
            <div class="field">
              <div class="label">Display Name</div>
              <div class="value">${display_name}</div>
            </div>
            <div class="field">
              <div class="label">Email</div>
              <div class="value">${user_email}</div>
            </div>
            <div class="field">
              <div class="label">Affiliation</div>
              <div class="value">${affiliation}</div>
            </div>
            ${specialty ? `
            <div class="field">
              <div class="label">Specialty</div>
              <div class="value">${specialty}</div>
            </div>
            ` : ''}
            ${bio ? `
            <div class="field">
              <div class="label">Bio</div>
              <div class="value">${bio}</div>
            </div>
            ` : ''}
            <p style="color: #6b7280; margin-top: 20px;">
              Log in to the admin panel to approve or reject this request.
            </p>
          </div>
          <div class="footer">
            <p>lev8 Studio</p>
          </div>
        </div>
      </body>
    </html>
  `;

  const text = `
New Studio Creator Request

Display Name: ${display_name}
Email: ${user_email}
Affiliation: ${affiliation}
${specialty ? `Specialty: ${specialty}` : ''}
${bio ? `Bio: ${bio}` : ''}

Log in to the admin panel to approve or reject this request.
  `.trim();

  return sendEmail({
    to: STUDIO_ADMIN_EMAIL,
    subject: 'lev8 Studio creator access',
    html,
    text,
  });
}



