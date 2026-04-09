import { Injectable } from '@nestjs/common';
import { VacancyView } from '../domain/models';
import { EmailService } from './email.service';
import { WhatsAppService } from './whatsapp.service';

interface ApplicationNotificationPayload {
  fullName: string;
  phone: string;
  vacancy: VacancyView;
}

@Injectable()
export class NotificationsService {
  constructor(
    private readonly emailService: EmailService,
    private readonly whatsappService: WhatsAppService,
  ) {}

  async notifySchoolAboutApplication(payload: ApplicationNotificationPayload) {
    const messageLines = [
      'Поступила новая заявка на вакансию.',
      '',
      `Школа: ${payload.vacancy.schoolName}`,
      `Регион: ${payload.vacancy.regionName}`,
      `Предмет: ${payload.vacancy.subjectName}`,
      `Язык обучения: ${payload.vacancy.teachingLanguage}`,
      `Год выпуска: ${payload.vacancy.graduationYear}`,
      '',
      `ФИО кандидата: ${payload.fullName}`,
      `Телефон: ${payload.phone}`,
    ];

    const emailResult = await this.emailService.send({
      to: payload.vacancy.schoolEmail,
      subject: `Новая заявка на вакансию: ${payload.vacancy.subjectName}`,
      text: messageLines.join('\n'),
    });

    const whatsappResult = await this.whatsappService.sendText({
      to: payload.vacancy.schoolPhone,
      text: messageLines.join('\n'),
    });

    return {
      email: emailResult,
      whatsapp: whatsappResult,
    };
  }
}
