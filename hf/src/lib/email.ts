type EmailPayload = {
  to: string;
  subject: string;
  text: string;
};

export async function sendEmail(payload: EmailPayload) {
  if (!process.env.SMTP_HOST) {
    console.info("SMTP placeholder:", payload);
    return;
  }

  console.info("SMTP configured but not implemented.", payload);
}
