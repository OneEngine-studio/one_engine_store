import nodemailer from 'nodemailer';
import type { Config } from './config.js';

export interface Mailer {
  send(to: string, subject: string, text: string): Promise<void>;
}

interface Logger {
  info: (obj: unknown, msg?: string) => void;
  error: (obj: unknown, msg?: string) => void;
}

/** Real mail through SMTP_URL, or (development only) a mailer that writes the message to the log. */
export function makeMailer(cfg: Config, log: Logger): Mailer {
  if (cfg.smtpUrl) {
    const transport = nodemailer.createTransport(cfg.smtpUrl);
    return {
      async send(to, subject, text) {
        await transport.sendMail({ from: cfg.mailFrom, to, subject, text });
      },
    };
  }
  return {
    async send(to, subject, text) {
      log.info({ to, subject }, `[dev mail] ${text}`);
    },
  };
}

export const verificationMail = (code: string) => ({
  subject: 'Your OneEngine verification code',
  text: `Your OneEngine verification code is ${code}.\n\nIt expires in 15 minutes. If you did not create an account, you can ignore this email.`,
});

export const resetMail = (code: string) => ({
  subject: 'Your OneEngine password reset code',
  text: `Your OneEngine password reset code is ${code}.\n\nIt expires in 15 minutes. If you did not ask to reset your password, you can ignore this email; your password has not changed.`,
});
