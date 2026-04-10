import { Injectable } from '@nestjs/common';
import { EmailService } from './email.service';
import { WhatsAppService } from './whatsapp.service';

interface NotifySchoolAboutApplicationPayload {
  fullName: string;
  phone: string;
  vacancy: {
    schoolEmail?: string | null;
    schoolPhone?: string | null;
    schoolName: string;
    subjectName: string;
    regionName: string;
  };
  attachment?: {
    fileName: string;
    mimeType: string;
    buffer: Buffer;
  } | null;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly emailService: EmailService,
    private readonly whatsAppService: WhatsAppService,
  ) {}

  async notifySchoolAboutApplication(
    payload: NotifySchoolAboutApplicationPayload,
  ) {
    const schoolEmail = payload.vacancy.schoolEmail;
    const schoolPhone = payload.vacancy.schoolPhone;

    const text = [
      'Новая заявка на вакансию',
      `ФИО: ${payload.fullName}`,
      `Телефон: ${payload.phone}`,
      `Школа: ${payload.vacancy.schoolName}`,
      `Предмет: ${payload.vacancy.subjectName}`,
      `Регион: ${payload.vacancy.regionName}`,
    ].join('\n');

    const emailResult = schoolEmail
      ? await this.emailService.send({
          to: schoolEmail,
          subject: `Новая заявка на вакансию: ${payload.vacancy.subjectName}`,
          text,
          attachments: payload.attachment
            ? [
                {
                  filename: payload.attachment.fileName,
                  content: payload.attachment.buffer,
                  contentType: payload.attachment.mimeType,
                },
              ]
            : undefined,
        })
      : {
          status: 'skipped' as const,
          error: 'School email is missing',
        };

    const whatsappTextResult = schoolPhone
      ? await this.whatsAppService.sendText({
          to: schoolPhone,
          text,
        })
      : {
          status: 'skipped' as const,
          error: 'School phone is missing',
        };

    let whatsappDocumentResult: {
      status: 'sent' | 'failed' | 'skipped';
      error: string | null;
    } = {
      status: 'skipped',
      error: null,
    };

    if (schoolPhone && payload.attachment) {
      whatsappDocumentResult = await this.whatsAppService.sendDocument({
        to: schoolPhone,
        fileName: payload.attachment.fileName,
        mimeType: payload.attachment.mimeType,
        buffer: payload.attachment.buffer,
        caption: `Документ кандидата: ${payload.fullName}`,
      });
    }

    const finalWhatsappStatus =
      whatsappTextResult.status === 'failed' ||
      whatsappDocumentResult.status === 'failed'
        ? 'failed'
        : whatsappTextResult.status === 'sent' ||
            whatsappDocumentResult.status === 'sent'
          ? 'sent'
          : 'skipped';

    const finalWhatsappError =
      whatsappDocumentResult.error ?? whatsappTextResult.error ?? null;

    return {
      email: emailResult,
      whatsapp: {
        status: finalWhatsappStatus,
        error: finalWhatsappError,
      },
    };
  }
}
