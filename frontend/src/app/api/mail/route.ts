import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

const RELAY_SECRET = process.env.MAIL_RELAY_SECRET || "letscollab-secure-mail-relay-2026";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, subject, text, html, relaySecret } = body;

    if (relaySecret !== RELAY_SECRET) {
      return NextResponse.json({ error: "Unauthorized relay request" }, { status: 401 });
    }

    if (!to || !subject || (!text && !html)) {
      return NextResponse.json({ error: "Missing required email fields" }, { status: 400 });
    }

    const smtpUser = process.env.SMTP_USER || "msswastik07@gmail.com";
    const smtpPass = process.env.SMTP_PASS;
    const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
    const smtpPort = parseInt(process.env.SMTP_PORT || "465", 10);
    const smtpSecure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : smtpPort === 465;

    if (!smtpPass) {
      return NextResponse.json(
        {
          success: false,
          error: "SMTP_PASS is not configured in environment variables.",
        },
        { status: 503 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass.replace(/\s+/g, ""),
      },
    });

    const fromAddress = process.env.SMTP_FROM || `"LetsCollab Team" <${smtpUser}>`;

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text,
      html,
    });

    return NextResponse.json({
      success: true,
      messageId: info.messageId,
    });
  } catch (err: any) {
    console.error("[Vercel Mail Relay] Error sending email:", err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to send email via SMTP relay",
      },
      { status: 500 }
    );
  }
}
