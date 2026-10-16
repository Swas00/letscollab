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

  // 2. Fallback in development/test: Use Ethereal test account or json stream
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
}

/**
 * Sends a welcome email when a user registers on the platform
 */
export async function sendWelcomeEmail({ to, name, organizationName }: WelcomeEmailParams) {
  try {
    const transport = await getTransporter();

    const subject = `Welcome to LetsCollab, ${name}! 🚀`;
    const orgGreeting = organizationName
      ? `<p style="margin: 0 0 16px; color: #4A5568; font-size: 14px;">Your organization <strong>${organizationName}</strong> has been configured and is ready for your team.</p>`
      : "";

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to LetsCollab</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8F9FA; margin: 0; padding: 40px 20px;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border-radius: 20px; overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <!-- Header -->
    <tr>
      <td style="background-color: #E65A38; padding: 32px 40px; text-align: center;">
        <h1 style="color: #FFFFFF; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">LetsCollab</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 6px 0 0; font-size: 14px; font-weight: 500;">Collaborative Project & Team Workspace</p>
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 40px;">
        <h2 style="color: #1A202C; margin: 0 0 16px; font-size: 20px; font-weight: 700;">Welcome aboard, ${name}! 👋</h2>
        <p style="color: #4A5568; margin: 0 0 16px; font-size: 15px; line-height: 1.6;">
          Thank you for joining <strong>LetsCollab</strong>. Your account has been successfully created and your collaborative workspace is live.
        </p>
        ${orgGreeting}
        
        <div style="background-color: #F7FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <h3 style="color: #2D3748; margin: 0 0 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">What you can do next:</h3>
          <ul style="margin: 0; padding-left: 20px; color: #4A5568; font-size: 14px; line-height: 1.8;">
            <li><strong>Create projects</strong> and organize work with interactive Kanban boards.</li>
            <li><strong>Invite teammates directly by email</strong> to collaborate seamlessly.</li>
            <li><strong>Real-time updates & activity logs</strong> to keep everyone in sync.</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 32px 0 20px;">
          <a href="${APP_URL}/dashboard" style="display: inline-block; background-color: #E65A38; color: #FFFFFF; text-decoration: none; font-weight: 700; font-size: 14px; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 8px rgba(230,90,56,0.25);">
            Go to Your Workspace &rarr;
          </a>
        </div>

        <p style="color: #718096; margin: 24px 0 0; font-size: 13px; line-height: 1.5;">
          Have questions or need assistance? Reply directly to this email or visit our help center.
        </p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="background-color: #F7FAFC; border-top: 1px solid #E2E8F0; padding: 20px 40px; text-align: center;">
        <p style="color: #A0AEC0; margin: 0; font-size: 12px;">
          &copy; ${new Date().getFullYear()} LetsCollab Inc. All rights reserved.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const text = `
Welcome to LetsCollab, ${name}!

Thank you for joining LetsCollab. Your account is active and ready for teamwork.
${organizationName ? `Organization: ${organizationName}` : ""}

What you can do:
- Create projects with interactive Kanban boards
- Invite team members directly using their email ID
- Real-time updates and task tracking

Visit your workspace: ${APP_URL}/dashboard

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
}: ProjectInviteEmailParams) {
  try {
    const transport = await getTransporter();

    const formattedRole = role.replace(/_/g, " ");
    const subject = `${inviterName} invited you to collaborate on "${projectName}" [${projectKey}]`;

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
          Log in or create your account to view your pending invitations and start working on the project board with your team.
        </p>

        <div style="text-align: center; margin: 32px 0 24px;">
          <a href="${APP_URL}/projects" style="display: inline-block; background-color: #E65A38; color: #FFFFFF; text-decoration: none; font-weight: 700; font-size: 14px; padding: 14px 32px; border-radius: 12px; box-shadow: 0 4px 8px rgba(230,90,56,0.25);">
            Accept Invitation & View Project &rarr;
          </a>
        </div>
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

To accept this invitation and collaborate with your team, visit:
${APP_URL}/projects

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
