import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import ExcelJS from 'exceljs';
import { Repository } from 'typeorm';
import {
  requireIin,
  requirePhone,
  requireText,
  requireUuid,
} from '../common/validation';
import { ApplicationEntity } from '../data/entities/application.entity';
import { VacancyEntity } from '../data/entities/vacancy.entity';
import { mapApplicationEntity, mapVacancyEntity } from '../data/mappers';
import { NotificationsService } from '../notifications/notifications.service';
import {
  ApplicationUploadService,
  type UploadedApplicationFile,
  type SavedApplicationFile,
} from './application-upload.service';
import { ReferralDocumentService } from './referral-document.service';

interface ApplicationFilters {
  regionId?: string;
  schoolId?: string;
  graduationYear?: number;
}

interface CreateApplicationDto {
  vacancyId: string;
  fullName: string;
  phone: string;
  iin: string;
}

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(ApplicationEntity)
    private readonly applicationsRepository: Repository<ApplicationEntity>,
    @InjectRepository(VacancyEntity)
    private readonly vacanciesRepository: Repository<VacancyEntity>,
    private readonly notificationsService: NotificationsService,
    private readonly applicationUploadService: ApplicationUploadService,
    private readonly referralDocumentService: ReferralDocumentService,
  ) {}

  async list(filters: ApplicationFilters = {}) {
    const applications = await this.createListQuery(filters).getMany();

    return applications.map((application) =>
      mapApplicationEntity(application, 'ru'),
    );
  }

  async exportToExcel(filters: ApplicationFilters = {}) {
    const applications = await this.createListQuery(filters).getMany();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Заявки');

    worksheet.columns = [
      { header: 'Дата заявки', key: 'createdAt', width: 24 },
      { header: 'ФИО', key: 'fullName', width: 28 },
      { header: 'Телефон', key: 'phone', width: 18 },
      { header: 'ИИН', key: 'iin', width: 18 },
      { header: 'Регион', key: 'regionName', width: 32 },
      { header: 'Школа', key: 'schoolName', width: 36 },
      { header: 'Предмет', key: 'subjectName', width: 28 },
      { header: 'Язык обучения', key: 'teachingLanguage', width: 20 },
      { header: 'Год выпуска', key: 'graduationYear', width: 16 },
      { header: 'Статус email', key: 'emailStatus', width: 18 },
      { header: 'Статус WhatsApp', key: 'whatsappStatus', width: 18 },
    ];

    applications.forEach((application) => {
      const view = mapApplicationEntity(application, 'ru');

      worksheet.addRow({
        createdAt: this.formatDate(application.createdAt),
        fullName: view.fullName,
        phone: view.phone,
        iin: view.iin ?? '',
        regionName: view.regionName,
        schoolName: view.schoolName,
        subjectName: view.subjectName,
        teachingLanguage:
          view.teachingLanguage === 'kz' ? 'Казахский' : 'Русский',
        graduationYear: view.graduationYear,
        emailStatus: this.formatDeliveryStatus(view.notificationStatus.email),
        whatsappStatus: this.formatDeliveryStatus(
          view.notificationStatus.whatsapp,
        ),
      });
    });

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    return workbook.xlsx.writeBuffer();
  }

  async createPublic(
    payload: CreateApplicationDto,
    file?: UploadedApplicationFile,
  ) {
    const fullName = requireText(payload.fullName, 'fullName');
    const phone = requirePhone(payload.phone);
    const iin = requireIin(payload.iin);
    const vacancyId = requireUuid(payload.vacancyId, 'vacancyId');

    const uploadedFile: SavedApplicationFile =
      await this.applicationUploadService.save(file);

    const application = await this.applicationsRepository.manager.transaction(
      async (manager) => {
        const vacancyRepository = manager.getRepository(VacancyEntity);
        const applicationRepository = manager.getRepository(ApplicationEntity);

        const vacancy = await vacancyRepository.findOne({
          where: { id: vacancyId },
          lock: {
            mode: 'pessimistic_write',
          },
        });

        if (!vacancy) {
          throw new NotFoundException(`Vacancy ${vacancyId} was not found`);
        }

        if (vacancy.status !== 'open') {
          throw new NotFoundException('Vacancy is not open for applications');
        }

        if (vacancy.isPedagogical && !uploadedFile.attachmentStoredName) {
          throw new BadRequestException(
            'attachment file is required for pedagogical vacancies',
          );
        }

        vacancy.status = 'closed';
        await vacancyRepository.save(vacancy);

        return applicationRepository.save(
          applicationRepository.create({
            vacancyId,
            fullName,
            phone,
            iin,
            ...uploadedFile,
            emailStatus: 'pending',
            whatsappStatus: 'pending',
            emailError: null,
            whatsappError: null,
            attemptedAt: null,
          }),
        );
      },
    );

    const vacancy = await this.vacanciesRepository.findOne({
      where: { id: vacancyId },
      relations: {
        region: {
          oblys: true,
        },
        school: true,
        subject: true,
      },
    });

    if (!vacancy) {
      throw new NotFoundException(`Vacancy ${vacancyId} was not found`);
    }

    const notificationLanguage =
      vacancy.teachingLanguage === 'kz' ? 'kz' : 'ru';
    const vacancyView = mapVacancyEntity(vacancy, notificationLanguage);

    const attachment =
      uploadedFile.attachmentPath && uploadedFile.attachmentStoredName
        ? {
            fileName:
              uploadedFile.attachmentOriginalName ??
              uploadedFile.attachmentStoredName,
            mimeType:
              uploadedFile.attachmentMimeType ?? 'application/octet-stream',
            buffer: await this.applicationUploadService.read(
              uploadedFile.attachmentPath,
            ),
          }
        : null;

    const notificationsResult =
      await this.notificationsService.notifySchoolAboutApplication({
        fullName,
        phone,
        iin,
        vacancy: vacancyView,
        attachment,
      });

    application.emailStatus = notificationsResult.email.status;
    application.whatsappStatus = notificationsResult.whatsapp.status;
    application.emailError = notificationsResult.email.error;
    application.whatsappError = notificationsResult.whatsapp.error;
    application.attemptedAt = new Date();

    await this.applicationsRepository.save(application);

    const updatedApplication = await this.applicationsRepository.findOne({
      where: { id: application.id },
      relations: {
        vacancy: {
          region: {
            oblys: true,
          },
          school: true,
          subject: true,
        },
      },
    });

    if (!updatedApplication) {
      throw new NotFoundException(
        `Application ${application.id} was not found`,
      );
    }

    return mapApplicationEntity(updatedApplication, 'ru');
  }

  async remove(id: string) {
    const application = await this.findOneWithRelations(id);

    if (!application) {
      throw new NotFoundException(`Application ${id} was not found`);
    }

    await this.applicationsRepository.remove(application);

    return mapApplicationEntity(application, 'ru');
  }

  async generateReferralDocument(id: string) {
    const application = await this.findOneWithRelations(id);

    if (!application) {
      throw new NotFoundException(`Application ${id} was not found`);
    }

    const language =
      application.vacancy.teachingLanguage === 'kz' ? 'kz' : 'ru';

    return this.referralDocumentService.generate(
      mapApplicationEntity(application, language),
    );
  }

  async getAttachment(id: string) {
    const application = await this.findOneWithRelations(id);

    if (!application) {
      throw new NotFoundException(`Application ${id} was not found`);
    }

    return {
      fileName:
        application.attachmentOriginalName ??
        application.attachmentStoredName ??
        `application-${id}`,
      mimeType: application.attachmentMimeType ?? 'application/octet-stream',
      buffer: await this.applicationUploadService.read(
        application.attachmentPath,
      ),
    };
  }

  private createListQuery(filters: ApplicationFilters = {}) {
    const query = this.applicationsRepository
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.vacancy', 'vacancy')
      .leftJoinAndSelect('vacancy.region', 'region')
      .leftJoinAndSelect('region.oblys', 'regionOblys')
      .leftJoinAndSelect('vacancy.school', 'school')
      .leftJoinAndSelect('vacancy.subject', 'subject')
      .orderBy('application.createdAt', 'DESC');

    if (filters.regionId) {
      query.andWhere('vacancy.regionId = :regionId', {
        regionId: filters.regionId,
      });
    }

    if (filters.schoolId) {
      query.andWhere('vacancy.schoolId = :schoolId', {
        schoolId: filters.schoolId,
      });
    }

    if (filters.graduationYear) {
      query.andWhere('vacancy.graduationYear = :graduationYear', {
        graduationYear: filters.graduationYear,
      });
    }

    return query;
  }

  private formatDate(value: Date) {
    return new Intl.DateTimeFormat('ru-RU', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'Asia/Almaty',
    }).format(value);
  }

  private formatDeliveryStatus(status: string) {
    switch (status) {
      case 'sent':
        return 'Отправлено';
      case 'failed':
        return 'Ошибка';
      case 'skipped':
        return 'Пропущено';
      default:
        return 'В ожидании';
    }
  }

  private findOneWithRelations(id: string) {
    return this.applicationsRepository.findOne({
      where: { id },
      relations: {
        vacancy: {
          region: {
            oblys: true,
          },
          school: true,
          subject: true,
        },
      },
    });
  }
}
