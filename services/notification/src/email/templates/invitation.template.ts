export interface InvitationEmailData {
  recipientEmail: string;
  organizationName: string;
  inviterName?: string;
  role: string;
  inviteUrl: string;
  expiresIn?: string;
}

export function generateInvitationEmailHtml(data: InvitationEmailData): string {
  const roleDisplay = data.role === 'ADMIN' ? 'Admin' : 'Member';
  const roleDescription = data.role === 'ADMIN'
    ? 'full access to all projects and settings'
    : 'access to assigned projects';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited!</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fa;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f7fa;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto;">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #00C4AB 0%, #00A896 100%); border-radius: 16px 16px 0 0; padding: 40px 40px 30px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                      You're Invited!
                    </h1>
                    <p style="margin: 0; font-size: 16px; color: rgba(255, 255, 255, 0.9);">
                      Join ${escapeHtml(data.organizationName)} on UTS
                    </p>
                  </td>
                  <td style="text-align: right; vertical-align: top;">
                    <div style="width: 56px; height: 56px; background-color: rgba(255, 255, 255, 0.2); border-radius: 12px; display: inline-flex; align-items: center; justify-content: center;">
                      <span style="font-size: 24px; color: #ffffff; font-weight: bold;">UTS</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background-color: #ffffff; padding: 40px;">

              <!-- Greeting -->
              <p style="margin: 0 0 24px; font-size: 16px; color: #374151; line-height: 1.6;">
                Hello,
              </p>

              <p style="margin: 0 0 24px; font-size: 16px; color: #374151; line-height: 1.6;">
                ${data.inviterName ? `<strong>${escapeHtml(data.inviterName)}</strong> has invited you` : 'You have been invited'}
                to join <strong>${escapeHtml(data.organizationName)}</strong> as a team member.
              </p>

              <!-- Role Card -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 32px;">
                <tr>
                  <td style="background-color: #f0fdf9; border: 1px solid #99f6e4; border-radius: 12px; padding: 20px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="width: 48px; vertical-align: top;">
                          <div style="width: 40px; height: 40px; background-color: #00C4AB; border-radius: 10px; text-align: center; line-height: 40px;">
                            <span style="color: #ffffff; font-size: 18px;">&#128100;</span>
                          </div>
                        </td>
                        <td style="padding-left: 16px;">
                          <p style="margin: 0 0 4px; font-size: 14px; color: #6b7280; font-weight: 500;">
                            Your Role
                          </p>
                          <p style="margin: 0; font-size: 18px; color: #00C4AB; font-weight: 600;">
                            ${roleDisplay}
                          </p>
                          <p style="margin: 8px 0 0; font-size: 13px; color: #6b7280;">
                            You'll have ${roleDescription}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 32px;">
                <tr>
                  <td style="text-align: center;">
                    <a href="${escapeHtml(data.inviteUrl)}"
                       style="display: inline-block; background: linear-gradient(135deg, #00C4AB 0%, #00A896 100%); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; padding: 16px 48px; border-radius: 12px; box-shadow: 0 4px 14px rgba(0, 196, 171, 0.4);">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Alternative Link -->
              <p style="margin: 0 0 16px; font-size: 14px; color: #6b7280; text-align: center;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 32px; font-size: 13px; color: #00C4AB; text-align: center; word-break: break-all; background-color: #f9fafb; padding: 12px 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
                ${escapeHtml(data.inviteUrl)}
              </p>

              <!-- Expiry Notice -->
              ${data.expiresIn ? `
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 24px;">
                <tr>
                  <td style="background-color: #fef3c7; border-radius: 8px; padding: 12px 16px; text-align: center;">
                    <p style="margin: 0; font-size: 13px; color: #92400e;">
                      &#9888; This invitation expires in <strong>${escapeHtml(data.expiresIn)}</strong>
                    </p>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- Help Text -->
              <p style="margin: 0; font-size: 14px; color: #9ca3af; line-height: 1.6;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; border-radius: 0 0 16px 16px; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 8px; font-size: 14px; color: #6b7280;">
                      Powered by <strong style="color: #00C4AB;">UTS Platform</strong>
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #9ca3af;">
                      &copy; ${new Date().getFullYear()} Unified TeamSpace. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function generateInvitationEmailText(data: InvitationEmailData): string {
  const roleDisplay = data.role === 'ADMIN' ? 'Admin' : 'Member';

  return `
You're Invited to Join ${data.organizationName}!

Hello,

${data.inviterName ? `${data.inviterName} has invited you` : 'You have been invited'} to join ${data.organizationName} as a ${roleDisplay}.

To accept this invitation, click the link below:
${data.inviteUrl}

${data.expiresIn ? `This invitation expires in ${data.expiresIn}.` : ''}

If you didn't expect this invitation, you can safely ignore this email.

---
Powered by UTS Platform
© ${new Date().getFullYear()} Unified TeamSpace. All rights reserved.
  `.trim();
}

function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char] || char);
}
