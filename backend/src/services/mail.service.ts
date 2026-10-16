import nodemailer, { Transporter } from "nodemailer";
import dotenv from "dotenv";
import path from "path";
import os from "os";

// Load credentials from both project .env and ~/.env
dotenv.config();
dotenv.config({ path: path.join(os.homedir(), ".env") });

const APP_URL = process.env.APP_URL || process.env.FRONTEND_URL || "https://letscollab-delta.vercel.app";
const RELAY_SECRET = process.env.MAIL_RELAY_SECRET || "letscollab-secure-mail-relay-2026";

function getFromEmail(): string {
  const smtpUser = process.env.SMTP_USER || "msswastik07@gmail.com";
  return process.env.SMTP_FROM || `"LetsCollab Team" <${smtpUser}>`;
}

/**
 * Creates a Nodemailer transport when direct SMTP credentials are configured
 */
function createDirectTransporter(): Transporter | null {
  const smtpUser = process.env.SMTP_USER || "msswastik07@gmail.com";
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpPass) return null;

  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);
  const smtpSecure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : smtpPort === 465;

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass.replace(/\s+/g, ""),
    },
    connectionTimeout: 8000,
    greetingTimeout: 8000,
  });
}

/**
 * Dispatches an email using:
 * 1. Fast simulated JSON transport in unit tests (NODE_ENV === "test")
 * 2. Direct SMTP if configured and reachable
 * 3. HTTPS relay via Vercel Serverless Function (/api/mail) to bypass Render Free Tier SMTP port blocking
 */
async function dispatchEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<{ success: boolean; messageId?: string; error?: any }> {
  // 1. Unit test environment
  if (process.env.NODE_ENV === "test") {
    const testTransport = nodemailer.createTransport({ jsonTransport: true });
    const info = await testTransport.sendMail({
      from: getFromEmail(),
      to,
      subject,
      text,
      html,
    });
    return { success: true, messageId: info.messageId };
  }

  // 2. Try direct SMTP if SMTP_PASS is present locally
  const directTransport = createDirectTransporter();
  if (directTransport) {
    try {
      const info = await directTransport.sendMail({
        from: getFromEmail(),
        to,
        subject,
        text,
        html,
      });
      console.log(`[MailService] Direct SMTP email delivered to ${to} (MessageId: ${info.messageId})`);
      return { success: true, messageId: info.messageId };
    } catch (directErr: any) {
      console.warn(`[MailService] Direct SMTP failed (${directErr.message}), attempting HTTPS Vercel mail relay...`);
    }
  }

  // 3. Relay over HTTPS via Vercel Serverless Function (/api/mail)
  try {
    const relayUrl = `${APP_URL.replace(/\/$/, "")}/api/mail`;
    const response = await fetch(relayUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to,
        subject,
        text,
        html,
        relaySecret: RELAY_SECRET,
      }),
    });

    const data: any = await response.json().catch(() => ({}));
    if (response.ok && data.success) {
      console.log(`[MailService] Relayed email delivered to ${to} (MessageId: ${data.messageId})`);
      return { success: true, messageId: data.messageId };
    }

    const errMsg = data.error || `Mail relay responded with HTTP ${response.status}`;
    console.error(`[MailService] HTTPS Mail Relay error for ${to}: ${errMsg}`);
    return { success: false, error: new Error(errMsg) };
  } catch (relayErr: any) {
    console.error(`[MailService] Failed to reach HTTPS Mail Relay for ${to}:`, relayErr);
    return { success: false, error: relayErr };
  }
}

export interface WelcomeEmailParams {
  to: string;
  name: string;
  organizationName?: string | null;
  role?: string;
}

/**
 * Sends a rich, well-designed welcome email when a user creates an account for the first time
 */
export async function sendWelcomeEmail({ to, name, organizationName, role }: WelcomeEmailParams) {
  const subject = `Welcome to LetsCollab, ${name}! 🚀 Your Collaborative Workspace is Ready`;
  const formattedRole = (role || "TEAM_MEMBER").replace(/_/g, " ");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to LetsCollab</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F4F5F7; margin: 0; padding: 40px 16px; color: #1A202C;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 640px; margin: 0 auto; background: #FFFFFF; border-radius: 24px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 12px 32px rgba(0,0,0,0.08);">
    <!-- Brand Hero Banner -->
    <tr>
      <td style="background: linear-gradient(135deg, #1E252B 0%, #2D3748 100%); padding: 42px 40px; text-align: center; border-bottom: 4px solid #E65A38;">
        <div style="display: inline-block; background-color: #E65A38; color: #FFFFFF; font-weight: 900; font-size: 13px; letter-spacing: 1.5px; padding: 6px 14px; border-radius: 999px; text-transform: uppercase; margin-bottom: 14px;">
          OFFICIAL WELCOME
        </div>
        <h1 style="color: #FFFFFF; margin: 0; font-size: 32px; font-weight: 900; letter-spacing: -0.8px;">LetsCollab</h1>
        <p style="color: #CBD5E1; margin: 8px 0 0; font-size: 14px; font-weight: 500;">
          Enterprise Real-Time Project &amp; Team Collaboration Platform
        </p>
      </td>
    </tr>

    <!-- Personal Greeting & Intro -->
    <tr>
      <td style="padding: 40px;">
        <h2 style="color: #1A202C; margin: 0 0 14px; font-size: 24px; font-weight: 800;">Welcome aboard, ${name}! 🎉</h2>
        <p style="color: #4A5568; margin: 0 0 22px; font-size: 15px; line-height: 1.7;">
          Thank you for creating your account on <strong>LetsCollab</strong>. Your profile and credentials have been permanently saved, so you can sign in anytime from any device to manage projects, write code, and collaborate with your team in real time.
        </p>

        <!-- Account Summary Box -->
        <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-left: 4px solid #E65A38; border-radius: 14px; padding: 20px 24px; margin: 0 0 30px;">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #E65A38; margin-bottom: 10px;">
            Your Registered Account Profile
          </div>
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding: 5px 0; color: #64748B; font-size: 13px; font-weight: 600;">Account Holder:</td>
              <td style="padding: 5px 0; color: #1E293B; font-size: 13px; font-weight: 700; text-align: right;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #64748B; font-size: 13px; font-weight: 600;">Registered Email ID:</td>
              <td style="padding: 5px 0; color: #1E293B; font-size: 13px; font-weight: 700; font-family: monospace; text-align: right;">${to}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; color: #64748B; font-size: 13px; font-weight: 600;">Workspace Role:</td>
              <td style="padding: 5px 0; color: #E65A38; font-size: 13px; font-weight: 800; text-align: right;">${formattedRole}</td>
            </tr>
            ${organizationName ? `
            <tr>
              <td style="padding: 5px 0; color: #64748B; font-size: 13px; font-weight: 600;">Organization:</td>
              <td style="padding: 5px 0; color: #1E293B; font-size: 13px; font-weight: 700; text-align: right;">${organizationName}</td>
            </tr>
            ` : ""}
            <tr>
              <td style="padding: 5px 0; color: #64748B; font-size: 13px; font-weight: 600;">Account Status:</td>
              <td style="padding: 5px 0; color: #166534; font-size: 13px; font-weight: 700; text-align: right;">✓ Active &amp; Permanently Saved</td>
            </tr>
          </table>
        </div>

        <!-- Platform Capabilities & Uses Section -->
        <h3 style="color: #1A202C; margin: 0 0 18px; font-size: 17px; font-weight: 800; border-bottom: 2px solid #F1F5F9; padding-bottom: 10px;">
          Platform Capabilities &amp; How You Can Use LetsCollab
        </h3>

        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 28px;">
          <tr>
            <td style="vertical-align: top; padding: 12px 14px 12px 0; width: 40px;">
              <div style="background-color: #FFF5F2; border: 1px solid #FED7D0; border-radius: 12px; width: 40px; height: 40px; line-height: 40px; text-align: center; font-size: 18px;">📋</div>
            </td>
            <td style="vertical-align: top; padding: 10px 0 14px;">
              <strong style="color: #1E293B; font-size: 14px; display: block; margin-bottom: 3px;">1. Interactive Kanban Boards &amp; Agile Task Management</strong>
              <span style="color: #64748B; font-size: 13px; line-height: 1.5; display: block;">Create projects, break work into tasks with priorities and due dates, and track progress across Backlog, To-Do, In Progress, In Review, and Done.</span>
            </td>
          </tr>
          <tr>
            <td style="vertical-align: top; padding: 12px 14px 12px 0; width: 40px;">
              <div style="background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; width: 40px; height: 40px; line-height: 40px; text-align: center; font-size: 18px;">🤝</div>
            </td>
            <td style="vertical-align: top; padding: 10px 0 14px;">
              <strong style="color: #1E293B; font-size: 14px; display: block; margin-bottom: 3px;">2. Team Up via Direct Email Invitations</strong>
              <span style="color: #64748B; font-size: 13px; line-height: 1.5; display: block;">Invite any registered teammate directly by their email ID. They receive a secure invitation link to join your private project workspace.</span>
            </td>
          </tr>
          <tr>
            <td style="vertical-align: top; padding: 12px 14px 12px 0; width: 40px;">
              <div style="background-color: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 12px; width: 40px; height: 40px; line-height: 40px; text-align: center; font-size: 18px;">💻</div>
            </td>
            <td style="vertical-align: top; padding: 10px 0 14px;">
              <strong style="color: #1E293B; font-size: 14px; display: block; margin-bottom: 3px;">3. Integrated Live Collaborative Code &amp; Document Editor</strong>
              <span style="color: #64748B; font-size: 13px; line-height: 1.5; display: block;">Open the built-in VS Code-powered workspace inside any project to write code, edit documentation, and sync changes with teammates in real time.</span>
            </td>
          </tr>
          <tr>
            <td style="vertical-align: top; padding: 12px 14px 12px 0; width: 40px;">
              <div style="background-color: #FAF5FF; border: 1px solid #E9D5FF; border-radius: 12px; width: 40px; height: 40px; line-height: 40px; text-align: center; font-size: 18px;">🛡️</div>
            </td>
            <td style="vertical-align: top; padding: 10px 0 14px;">
              <strong style="color: #1E293B; font-size: 14px; display: block; margin-bottom: 3px;">4. Role-Based Access Control (RBAC) &amp; Conflict Protection</strong>
              <span style="color: #64748B; font-size: 13px; line-height: 1.5; display: block;">Protected by Optimistic Concurrency Control (OCC) and strict role permissions so your team never overwrites concurrent edits.</span>
            </td>
          </tr>
        </table>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 34px 0 24px;">
          <a href="${APP_URL}/dashboard" style="display: inline-block; background-color: #E65A38; color: #FFFFFF; text-decoration: none; font-weight: 800; font-size: 15px; padding: 16px 38px; border-radius: 14px; box-shadow: 0 6px 16px rgba(230,90,56,0.3);">
            Launch Your Workspace &rarr;
          </a>
        </div>

        <p style="color: #94A3B8; text-align: center; margin: 16px 0 0; font-size: 12px;">
          Sign in anytime at <a href="${APP_URL}/login" style="color: #E65A38; text-decoration: underline; font-weight: 600;">${APP_URL}/login</a>
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 24px 40px; text-align: center;">
        <p style="color: #64748B; margin: 0 0 4px; font-size: 12px; font-weight: 700;">
          LetsCollab &bull; Collaborative Project &amp; Engineering Workspace
        </p>
        <p style="color: #94A3B8; margin: 0; font-size: 11px;">
          &copy; ${new Date().getFullYear()} LetsCollab Inc. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
Welcome to LetsCollab, ${name}! 🎉

Thank you for creating your account on LetsCollab. Your account details and credentials are permanently saved so you can sign in anytime.

YOUR REGISTERED PROFILE:
- Name: ${name}
- Email: ${to}
- Role: ${formattedRole}
${organizationName ? `- Organization: ${organizationName}\n` : ""}- Status: Active & Permanently Saved

HOW YOU CAN USE LETSCOLLAB:
1. Interactive Kanban & Task Management: Create projects, assign tasks, set priorities, and track sprints in real time.
2. Direct Email Team Invitations: Invite collaborators by their email address with secure 1-click acceptance links.
3. Collaborative Code & Document Editor: Write and sync code together inside each project workspace.
4. Role-Based Security & Conflict Detection: Prevent accidental overwrites with Optimistic Concurrency Control (OCC).

Launch your workspace: ${APP_URL}/dashboard

Best regards,
The LetsCollab Team
  `;

  return dispatchEmail({ to, subject, text, html });
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
    <tr>
      <td style="background-color: #1A202C; padding: 28px 40px; text-align: center;">
        <h1 style="color: #FFFFFF; margin: 0; font-size: 24px; font-weight: 800;">LetsCollab</h1>
        <p style="color: #E65A38; margin: 4px 0 0; font-size: 13px; font-weight: 700; letter-spacing: 0.5px;">PROJECT INVITATION</p>
      </td>
    </tr>
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
            Accept Invitation &amp; View Project &rarr;
          </a>
          ${expirationHtml}
        </div>

        <p style="color: #A0AEC0; font-size: 12px; margin: 24px 0 0; text-align: center;">
          Or copy and paste this link in your browser: <br>
          <span style="color: #718096; word-break: break-all;">${inviteUrl}</span>
        </p>
      </td>
    </tr>
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

  return dispatchEmail({ to, subject, text, html });
}

export interface PasswordResetOtpEmailParams {
  to: string;
  name: string;
  otp: string;
}

/**
 * Sends a 6-digit OTP email strictly to the user's inbox for password reset
 */
export async function sendPasswordResetOtpEmail({
  to,
  name,
  otp,
}: PasswordResetOtpEmailParams) {
  const subject = `Your LetsCollab Password Reset Code: ${otp}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Password Reset Verification Code</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F9FA; margin: 0; padding: 40px 20px;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; margin: 0 auto; background: #FFFFFF; border-radius: 20px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <tr>
      <td style="background-color: #1A202C; padding: 28px 40px; text-align: center; border-bottom: 3px solid #E65A38;">
        <h1 style="color: #FFFFFF; margin: 0; font-size: 24px; font-weight: 800;">LetsCollab</h1>
        <p style="color: #E65A38; margin: 4px 0 0; font-size: 12px; font-weight: 700; letter-spacing: 1px;">SECURITY VERIFICATION</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px;">
        <h2 style="color: #1A202C; margin: 0 0 14px; font-size: 19px; font-weight: 700;">Password Reset OTP</h2>
        <p style="color: #4A5568; margin: 0 0 20px; font-size: 14px; line-height: 1.6;">
          Hello ${name},<br>
          We received a request to reset the password for your LetsCollab account (<strong>${to}</strong>).
        </p>
        <p style="color: #4A5568; margin: 0 0 16px; font-size: 14px;">
          Enter this confidential 6-digit verification code on the password reset screen:
        </p>

        <div style="background-color: #FFF5F2; border: 2px dashed #E65A38; border-radius: 14px; padding: 24px; text-align: center; margin: 24px 0;">
          <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #E65A38; display: inline-block;">
            ${otp}
          </span>
          <p style="margin: 10px 0 0; color: #718096; font-size: 12px; font-weight: 600;">
            ⏱ Valid for 10 minutes &bull; Do not share this code
          </p>
        </div>

        <p style="color: #718096; margin: 20px 0 0; font-size: 13px; line-height: 1.5;">
          <strong>Security Notice:</strong> Never share this OTP with anyone. If you did not request a password reset, you can safely ignore this email and your account will remain secure.
        </p>
      </td>
    </tr>
    <tr>
      <td style="background-color: #F7FAFC; border-top: 1px solid #E2E8F0; padding: 20px 40px; text-align: center;">
        <p style="color: #A0AEC0; margin: 0; font-size: 12px;">
          &copy; ${new Date().getFullYear()} LetsCollab Inc. &bull; Account Security
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
Your confidential 6-digit verification code (OTP) is:

${otp}

This code is valid for 10 minutes. Never share this code with anyone.

Best regards,
The LetsCollab Team
  `;

  return dispatchEmail({ to, subject, text, html });
}
