import nodemailer from "nodemailer";

function getTransporter() {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;

    if (!user || !pass) {
        throw new Error("SMTP_USER and SMTP_PASSWORD must be set in environment variables");
    }

    return nodemailer.createTransport({
        service: "gmail",
        auth: {
            user,
            pass,
        },
    });
}

export async function sendPasswordResetEmail({
    to,
    resetUrl,
}: {
    to: string;
    resetUrl: string;
}) {
    const transporter = getTransporter();
    const mailOptions = {
        from: `"Social Media App" <${process.env.SMTP_USER}>`,
        to,
        subject: "Reset Your Password",
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #09090b; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table role="presentation" width="480" cellspacing="0" cellpadding="0" style="background-color: #18181b; border-radius: 16px; border: 1px solid #27272a; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 40px 40px 24px; text-align: center;">
                            <div style="width: 56px; height: 56px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 14px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                                <span style="font-size: 24px; color: white; line-height: 56px;">🔑</span>
                            </div>
                            <h1 style="color: #fafafa; font-size: 24px; font-weight: 700; margin: 0 0 8px; letter-spacing: -0.5px;">
                                Password Reset Request
                            </h1>
                            <p style="color: #a1a1aa; font-size: 14px; margin: 0; line-height: 1.6;">
                                We received a request to reset your password. Click the button below to choose a new password.
                            </p>
                        </td>
                    </tr>

                    <!-- Button -->
                    <tr>
                        <td style="padding: 8px 40px 32px; text-align: center;">
                            <a href="${resetUrl}" 
                               style="display: inline-block; background-color: #10b981; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 14px 40px; border-radius: 12px; letter-spacing: 0.3px;">
                                Reset Password
                            </a>
                        </td>
                    </tr>

                    <!-- Divider -->
                    <tr>
                        <td style="padding: 0 40px;">
                            <div style="height: 1px; background-color: #27272a;"></div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="padding: 24px 40px 32px;">
                            <p style="color: #71717a; font-size: 12px; margin: 0 0 8px; line-height: 1.6;">
                                This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
                            </p>
                            <p style="color: #52525b; font-size: 11px; margin: 0; line-height: 1.6;">
                                If the button doesn't work, copy and paste this link into your browser:
                            </p>
                            <p style="color: #10b981; font-size: 11px; margin: 8px 0 0; word-break: break-all; line-height: 1.6;">
                                ${resetUrl}
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `.trim(),
    };

    await transporter.sendMail(mailOptions);
}
