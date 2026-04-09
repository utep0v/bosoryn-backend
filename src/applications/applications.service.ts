import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { requirePhone, requireText, requireUuid } from '../common/validation';
import { ApplicationEntity } from '../data/entities/application.entity';
import { VacancyEntity } from '../data/entities/vacancy.entity';
import { mapApplicationEntity, mapVacancyEntity } from '../data/mappers';
import { NotificationsService } from '../notifications/notifications.service';

interface ApplicationFilters {
  regionId?: string;
  schoolId?: string;
  graduationYear?: number;
}

interface CreateApplicationDto {
  vacancyId: string;
  fullName: string;
  phone: string;
}

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(ApplicationEntity)
    private readonly applicationsRepository: Repository<ApplicationEntity>,
    @InjectRepository(VacancyEntity)
    private readonly vacanciesRepository: Repository<VacancyEntity>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async list(filters: ApplicationFilters = {}) {
    const query = this.applicationsRepository
      .createQueryBuilder('application')
      .leftJoinAndSelect('application.vacancy', 'vacancy')
      .leftJoinAndSelect('vacancy.region', 'region')
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

    const applications = await query.getMany();
    return applications.map((application) =>
      mapApplicationEntity(application, 'ru'),
    );
  }

  async createPublic(payload: CreateApplicationDto) {
    const fullName = requireText(payload.fullName, 'fullName');
    const phone = requirePhone(payload.phone);
    const vacancyId = requireUuid(payload.vacancyId, 'vacancyId');

    const application = await this.applicationsRepository.manager.transaction(
      async (manager) => {
        const vacancyRepository = manager.getRepository(VacancyEntity);
        const applicationRepository = manager.getRepository(ApplicationEntity);

        const vacancy = await vacancyRepository.findOne({
          where: { id: vacancyId },
          relations: {
            region: true,
            school: true,
            subject: true,
          },
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

        vacancy.status = 'closed';
        await vacancyRepository.save(vacancy);

        return applicationRepository.save(
          applicationRepository.create({
            vacancyId,
            fullName,
            phone,
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
        region: true,
        school: true,
        subject: true,
      },
    });

    if (!vacancy) {
      throw new NotFoundException(`Vacancy ${vacancyId} was not found`);
    }

    const notificationsResult =
      await this.notificationsService.notifySchoolAboutApplication({
        fullName,
        phone,
        vacancy: mapVacancyEntity(vacancy, 'ru'),
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
          region: true,
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
    const application = await this.applicationsRepository.findOne({
      where: { id },
      relations: {
        vacancy: {
          region: true,
          school: true,
          subject: true,
        },
      },
    });

    if (!application) {
      throw new NotFoundException(`Application ${id} was not found`);
    }

    await this.applicationsRepository.remove(application);
    return mapApplicationEntity(application, 'ru');
  }
}
