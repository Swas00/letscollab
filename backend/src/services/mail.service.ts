import nodemailer, { Transporter } from "nodemailer";

const APP_URL = process.env.APP_URL || process.env.FRONTEND_URL || "https://letscollab-delta.vercel.app";
const FROM_EMAIL = process.env.SMTP_FROM || '"LetsCollab Team" <welcome@letscollab.com>';

let transporter: Transporter | null = null;

/**
 * Initializes or returns the cached nodemailer transport
 */
async function getTransporter(): Promise<Transporter> {
  if (transporter) return transporter;

  // 1. If custom SMTP or Gmail credentials are provided in env
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return transporter;
  }

  if (process.env.SMTP_SERVICE && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      service: process.env.SMTP_SERVICE,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return transporter;
  }

  // In test environment, use fast simulated transport without external network requests
  if (process.env.NODE_ENV === "test") {
    transporter = nodemailer.createTransport({
      jsonTransport: true,
    });
    return transporter;
  }

  // 2. Fallback in development: Use Ethereal test account or json stream
  try {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`[MailService] Using test SMTP account: ${testAccount.user}`);
    return transporter;
  } catch (err) {
    console.warn("[MailService] Failed to create test account, falling back to simulated transport:", err);
    // Dummy transport that logs to console
    transporter = nodemailer.createTransport({
      jsonTransport: true,
    });
    return transporter;
  }
}

export interface WelcomeEmailParams {
  to: string;
  name: string;
  organizationName?: string | null;
  role?: string;
}

/**
 * Sends a welcome email when a user registers on the platform
 */
export async function sendWelcomeEmail({ to, name, organizationName, role }: WelcomeEmailParams) {
  try {
    const transport = await getTransporter();

    const subject = `Welcome to LetsCollab, ${name}! 🚀 Your Workspace is Ready`;
    const formattedRole = (role || "TEAM_MEMBER").replace(/_/g, " ");

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to LetsCollab</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F9FA; margin: 0; padding: 40px 16px;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; margin: 0 auto; background: #FFFFFF; border-radius: 24px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 8px 24px rgba(0,0,0,0.06);">
    <!-- Header -->
    <tr>
      <td style="background: linear-gradient(135deg, #1E252B 0%, #2B333B 100%); padding: 36px 40px; text-align: center; border-bottom: 4px solid #E65A38;">
        <h1 style="color: #FFFFFF; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">LetsCollab</h1>
        <p style="color: #E65A38; margin: 6px 0 0; font-size: 13px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">Real-Time Collaborative Workspace</p>
      </td>
    </tr>

    <!-- Main Content -->
    <tr>
      <td style="padding: 40px;">
        <h2 style="color: #1A202C; margin: 0 0 14px; font-size: 22px; font-weight: 800;">Welcome to the team, ${name}! 👋</h2>
        <p style="color: #4A5568; margin: 0 0 20px; font-size: 15px; line-height: 1.6;">
          Your individual account has been permanently configured on <strong>LetsCollab</strong>. You can now seamlessly sign in anytime to manage projects, coordinate with teammates, and build in real time.
        </p>

        <!-- Account Badge Card -->
        <div style="background-color: #F7FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 20px 24px; margin: 0 0 28px;">
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding: 4px 0; color: #718096; font-size: 13px; font-weight: 600;">Registered Email:</td>
              <td style="padding: 4px 0; color: #1A202C; font-size: 13px; font-weight: 700; font-family: monospace; text-align: right;">${to}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #718096; font-size: 13px; font-weight: 600;">Assigned Role:</td>
              <td style="padding: 4px 0; color: #E65A38; font-size: 13px; font-weight: 700; text-align: right; text-transform: capitalize;">${formattedRole}</td>
            </tr>
            ${organizationName ? `
            <tr>
              <td style="padding: 4px 0; color: #718096; font-size: 13px; font-weight: 600;">Organization:</td>
              <td style="padding: 4px 0; color: #1A202C; font-size: 13px; font-weight: 700; text-align: right;">${organizationName}</td>
            </tr>
            ` : ""}
            <tr>
              <td style="padding: 4px 0; color: #718096; font-size: 13px; font-weight: 600;">Account Persistence:</td>
              <td style="padding: 4px 0; color: #254622; font-size: 13px; font-weight: 700; text-align: right;">Permanent (Retained Indefinitely)</td>
            </tr>
          </table>
        </div>

        <h3 style="color: #1A202C; margin: 0 0 16px; font-size: 16px; font-weight: 800; border-bottom: 2px solid #F0F2F5; padding-bottom: 8px;">
          What You Can Do on LetsCollab
        </h3>

        <!-- Feature List with Clean Visual Icons -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
          <tr>
            <td style="vertical-align: top; padding: 12px 0;">
              <div style="background-color: #FFF5F2; border-radius: 10px; width: 36px; height: 36px; line-height: 36px; text-align: center; font-size: 18px; margin-right: 14px;">📋</div>
            </td>
            <td style="vertical-align: top; padding: 10px 0 14px;">
              <strong style="color: #1A202C; font-size: 14px;">Interactive Kanban & Task Workspaces</strong>
              <p style="margin: 4px 0 0; color: #718096; font-size: 13px; line-height: 1.5;">Organize development sprints, backlog items, in-review tasks, and deadlines with real-time updates.</p>
            </td>
          </tr>
          <tr>
            <td style="vertical-align: top; padding: 12px 0;">
              <div style="background-color: #F0FDF4; border-radius: 10px; width: 36px; height: 36px; line-height: 36px; text-align: center; font-size: 18px; margin-right: 14px;">✉️</div>
            </td>
            <td style="vertical-align: top; padding: 10px 0 14px;">
              <strong style="color: #1A202C; font-size: 14px;">Direct Email Project Invitations</strong>
              <p style="margin: 4px 0 0; color: #718096; font-size: 13px; line-height: 1.5;">Invite teammates and partners directly by their email ID with secure, tokenized acceptance links.</p>
            </td>
          </tr>
          <tr>
            <td style="vertical-align: top; padding: 12px 0;">
              <div style="background-color: #EFF6FF; border-radius: 10px; width: 36px; height: 36px; line-height: 36px; text-align: center; font-size: 18px; margin-right: 14px;">🛡️</div>
            </td>
            <td style="vertical-align: top; padding: 10px 0 14px;">
              <strong style="color: #1A202C; font-size: 14px;">Server-Side Role Governance (RBAC)</strong>
              <p style="margin: 4px 0 0; color: #718096; font-size: 13px; line-height: 1.5;">Every task modification, member management, and workspace deletion is strictly verified by server security guards.</p>
            </td>
          </tr>
          <tr>
            <td style="vertical-align: top; padding: 12px 0;">
              <div style="background-color: #FAF5FF; border-radius: 10px; width: 36px; height: 36px; line-height: 36px; text-align: center; font-size: 18px; margin-right: 14px;">⚡</div>
            </td>
            <td style="vertical-align: top; padding: 10px 0 14px;">
              <strong style="color: #1A202C; font-size: 14px;">Conflict-Free Concurrent Collaboration (OCC)</strong>
              <p style="margin: 4px 0 0; color: #718096; font-size: 13px; line-height: 1.5;">Smart versioning prevents team members from accidentally overwriting concurrent edits on the same project task.</p>
            </td>
          </tr>
        </table>

        <!-- Quick 3-Step Guide -->
        <div style="background-color: #F8FAFC; border: 1px dashed #CBD5E1; border-radius: 16px; padding: 20px; margin: 0 0 32px;">
          <h4 style="color: #1E293B; margin: 0 0 10px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">🚀 3 Steps to Get Started:</h4>
          <ol style="margin: 0; padding-left: 20px; color: #475569; font-size: 13px; line-height: 1.8;">
            <li>Sign in to your dashboard anytime using your registered email and password.</li>
            <li>Create your first project workspace from the <strong>Projects</strong> tab.</li>
            <li>Invite your collaborators by entering their email address.</li>
          </ol>
        </div>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 32px 0 16px;">
          <a href="${APP_URL}/dashboard" style="display: inline-block; background-color: #E65A38; color: #FFFFFF; text-decoration: none; font-weight: 700; font-size: 15px; padding: 16px 36px; border-radius: 14px; box-shadow: 0 6px 14px rgba(230,90,56,0.3);">
            Open Your Workspace &rarr;
          </a>
        </div>

        <p style="color: #94A3B8; text-align: center; margin: 16px 0 0; font-size: 12px;">
          Direct Dashboard URL: <a href="${APP_URL}/dashboard" style="color: #E65A38; text-decoration: underline;">${APP_URL}/dashboard</a>
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 24px 40px; text-align: center;">
        <p style="color: #64748B; margin: 0 0 4px; font-size: 12px; font-weight: 600;">
          LetsCollab &bull; Collaborative Project Management Platform
        </p>
        <p style="color: #94A3B8; margin: 0; font-size: 11px;">
          &copy; ${new Date().getFullYear()} LetsCollab Inc. Your account details are securely stored.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const text = `
Welcome to LetsCollab, ${name}!

Your account has been permanently configured and is ready for team collaboration.

Account Details:
- Email: ${to}
- Role: ${formattedRole}
${organizationName ? `- Organization: ${organizationName}` : ""}
- Account Retention: Permanent (preserved indefinitely across sessions)

Core Platform Features:
1. Interactive Kanban Workspaces: Manage tasks across backlog, todo, in progress, review, and done.
2. Email-Based Collaboration: Invite teammates by entering their email addresses.
3. Conflict Detection (OCC): Never lose concurrent work with automatic version conflict protection.
4. Server-Side RBAC: Strict access rules for Admins, Project Managers, Members, and Viewers.

Open your workspace: ${APP_URL}/dashboard

Best regards,
The LetsCollab Team
    `;

    const info = await transport.sendMail({
      from: FROM_EMAIL,
      to,
      subject,
      text,
      html,
    });

    console.log(`[MailService] Welcome email sent to ${to} (MessageId: ${info.messageId || "simulated"})`);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`[MailService] Email preview URL: ${previewUrl}`);
    }

    return { success: true, messageId: info.messageId, previewUrl };
  } catch (err) {
    console.error(`[MailService] Error sending welcome email to ${to}:`, err);
    return { success: false, error: err };
  }
}

export interface ProjectInviteEmailParams {
  to: string;
  inviterName: string;
  projectName: string;
  projectKey: string;
  role: string;
  token?: string;
  expiresAt?: Date | null;
}

/**
 * Sends a project invitation email to collaborate on a project group
 */
export async function sendProjectInviteEmail({
  to,
  inviterName,
  projectName,
  projectKey,
  role,
  token,
  expiresAt,
}: ProjectInviteEmailParams) {
  try {
    const transport = await getTransporter();

    const formattedRole = role.replace(/_/g, " ");
    const subject = `${inviterName} invited you to collaborate on "${projectName}" [${projectKey}]`;
    const inviteUrl = token ? `${APP_URL}/invite/${token}` : `${APP_URL}/projects`;

    const expirationHtml = expiresAt
      ? `<p style="color: #E65A38; font-size: 13px; font-weight: 600; margin: 12px 0 0;">⏱ This invitation link expires on ${new Date(expiresAt).toLocaleDateString(undefined, { dateStyle: "medium" })}.</p>`
      : "";

    const expirationText = expiresAt
      ? `\nThis invitation link expires on ${new Date(expiresAt).toLocaleDateString(undefined, { dateStyle: "medium" })}.`
      : "";

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Project Invitation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F9FA; margin: 0; padding: 40px 20px;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 20px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <!-- Header -->
    <tr>
      <td style="background-color: #1A202C; padding: 28px 40px; text-align: center;">
        <h1 style="color: #FFFFFF; margin: 0; font-size: 24px; font-weight: 800;">LetsCollab</h1>
        <p style="color: #E65A38; margin: 4px 0 0; font-size: 13px; font-weight: 700; letter-spacing: 0.5px;">PROJECT INVITATION</p>
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 40px;">
        <h2 style="color: #1A202C; margin: 0 0 16px; font-size: 19px; font-weight: 700;">You've been invited to team up! 🤝</h2>
        <p style="color: #4A5568; margin: 0 0 20px; font-size: 15px; line-height: 1.6;">
          <strong>${inviterName}</strong> has invited your email (<strong>${to}</strong>) to join and collaborate on the following project:
        </p>

        <div style="background-color: #FFF5F2; border: 1px solid #FED7D0; border-radius: 14px; padding: 20px; margin: 20px 0;">
          <div style="font-family: monospace; font-size: 11px; font-weight: 700; color: #E65A38; margin-bottom: 6px;">[${projectKey}]</div>
          <h3 style="color: #1A202C; margin: 0 0 8px; font-size: 17px; font-weight: 700;">${projectName}</h3>
          <p style="color: #718096; margin: 0; font-size: 13px;">Assigned Role: <strong style="color: #2D3748;">${formattedRole}</strong></p>
        </div>

        <p style="color: #4A5568; margin: 20px 0; font-size: 14px; line-height: 1.6;">
          Click the button below to view the project details and accept the invitation to collaborate with your team.
        </p>

        <div style="text-align: center; margin: 32px 0 24px;">
          <a href="${inviteUrl}" style="display: inline-block; background-color: #E65A38; color: #FFFFFF; text-decoration: none; font-weight: 700; font-size: 14px; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 8px rgba(230,90,56,0.25);">
            Accept Invitation & View Project &rarr;
          </a>
          ${expirationHtml}
        </div>

        <p style="color: #A0AEC0; font-size: 12px; margin: 24px 0 0; text-align: center;">
          Or copy and paste this link in your browser: <br>
          <span style="color: #718096; word-break: break-all;">${inviteUrl}</span>
        </p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="background-color: #F7FAFC; border-top: 1px solid #E2E8F0; padding: 20px 40px; text-align: center;">
        <p style="color: #A0AEC0; margin: 0; font-size: 12px;">
          LetsCollab &bull; Real-Time Collaborative Team Workspace
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const text = `
You've been invited to collaborate on "${projectName}" [${projectKey}] on LetsCollab!

${inviterName} has invited your email (${to}) as ${formattedRole}.
${expirationText}

To accept this invitation and collaborate with your team, visit:
${inviteUrl}

Best regards,
The LetsCollab Team
    `;

    const info = await transport.sendMail({
      from: FROM_EMAIL,
      to,
      subject,
      text,
      html,
    });

    console.log(`[MailService] Project invitation email sent to ${to} (MessageId: ${info.messageId || "simulated"})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[MailService] Error sending project invitation email to ${to}:`, err);
    return { success: false, error: err };
  }
}

export interface PasswordResetOtpEmailParams {
  to: string;
  name: string;
  otp: string;
}

/**
 * Sends a 6-digit OTP email for password reset
 */
export async function sendPasswordResetOtpEmail({
  to,
  name,
  otp,
}: PasswordResetOtpEmailParams) {
  try {
    const transport = await getTransporter();

    const subject = `Your LetsCollab Verification Code: ${otp}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Password Reset OTP</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F9FA; margin: 0; padding: 40px 20px;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 0 auto; background: #FFFFFF; border-radius: 20px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <!-- Header -->
    <tr>
      <td style="background-color: #1A202C; padding: 28px 40px; text-align: center;">
        <h1 style="color: #FFFFFF; margin: 0; font-size: 24px; font-weight: 800;">LetsCollab</h1>
        <p style="color: #E65A38; margin: 4px 0 0; font-size: 13px; font-weight: 700; letter-spacing: 0.5px;">ACCOUNT SECURITY</p>
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 40px;">
        <h2 style="color: #1A202C; margin: 0 0 14px; font-size: 19px; font-weight: 700;">Password Reset Request</h2>
        <p style="color: #4A5568; margin: 0 0 20px; font-size: 14px; line-height: 1.6;">
          Hello ${name},<br>
          We received a request to reset the password for your LetsCollab account (<strong>${to}</strong>).
        </p>
        <p style="color: #4A5568; margin: 0 0 16px; font-size: 14px;">
          Use the following verification code (OTP) to complete your password reset:
        </p>

        <!-- OTP Card -->
        <div style="background-color: #FFF5F2; border: 2px dashed #E65A38; border-radius: 14px; padding: 24px; text-align: center; margin: 24px 0;">
          <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #E65A38; display: inline-block;">
            ${otp}
          </span>
          <p style="margin: 10px 0 0; color: #718096; font-size: 12px; font-weight: 600;">
            ⏱ Valid for 10 minutes only
          </p>
        </div>

        <p style="color: #718096; margin: 20px 0 0; font-size: 13px; line-height: 1.5;">
          <strong>Security Notice:</strong> If you did not initiate this request, someone else may have entered your email address by mistake. Your account remains completely secure and no changes have been made.
        </p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="background-color: #F7FAFC; border-top: 1px solid #E2E8F0; padding: 20px 40px; text-align: center;">
        <p style="color: #A0AEC0; margin: 0; font-size: 12px;">
          &copy; ${new Date().getFullYear()} LetsCollab Inc. &bull; Account Protection
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const text = `
Hello ${name},

We received a request to reset your LetsCollab password.
Your verification code (OTP) is:

${otp}

This code is valid for 10 minutes. If you did not request this, you can safely ignore this message.

Best regards,
The LetsCollab Team
    `;

    const info = await transport.sendMail({
      from: FROM_EMAIL,
      to,
      subject,
      text,
      html,
    });

    console.log(`[MailService] Password reset OTP email sent to ${to} (MessageId: ${info.messageId || "simulated"})`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[MailService] Error sending password reset OTP email to ${to}:`, err);
    return { success: false, error: err };
  }
}

