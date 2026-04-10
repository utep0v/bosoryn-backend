import { Injectable, Logger } from '@nestjs/common';

interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  attachments?: EmailAttachment[];
}

interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

export interface EmailDeliveryResult {
  status: 'sent' | 'failed' | 'skipped';
  error: string | null;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async send(message: EmailMessage): Promise<EmailDeliveryResult> {
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpPort = Number(process.env.SMTP_PORT ?? 587);
    const from = process.env.SMTP_FROM ?? smtpUser;

    if (!smtpHost || !smtpUser || !smtpPass || !from) {
      this.logger.warn(
        `SMTP is not configured. Email to ${message.to} was skipped.`,
      );

      return {
        status: 'skipped',
        error: 'SMTP is not configured',
      };
    }

    try {
      const requireFn = eval('require') as NodeJS.Require;
      const nodemailer = requireFn('nodemailer') as {
        createTransport: (options: Record<string, unknown>) => {
          sendMail: (options: Record<string, unknown>) => Promise<unknown>;
        };
      };

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from,
        to: message.to,
        subject: message.subject,
        text: message.text,
        attachments: message.attachments,
      });

      return {
        status: 'sent',
        error: null,
      };
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : 'Unknown email delivery error';

      this.logger.error(`Failed to send email to ${message.to}: ${reason}`);

      return {
        status: 'failed',
        error: reason,
      };
    }
  }
}
