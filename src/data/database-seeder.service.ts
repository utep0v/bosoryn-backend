import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createSeedData } from './seed-data';
import { ApplicationEntity } from './entities/application.entity';
import { RegionEntity } from './entities/region.entity';
import { RegionOblysEntity } from './entities/region-oblys.entity';
import { SchoolEntity } from './entities/school.entity';
import { SubjectEntity } from './entities/subject.entity';
import { VacancyEntity } from './entities/vacancy.entity';

@Injectable()
export class DatabaseSeederService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(RegionOblysEntity)
    private readonly regionOblysesRepository: Repository<RegionOblysEntity>,
    @InjectRepository(RegionEntity)
    private readonly regionsRepository: Repository<RegionEntity>,
    @InjectRepository(SchoolEntity)
    private readonly schoolsRepository: Repository<SchoolEntity>,
    @InjectRepository(SubjectEntity)
    private readonly subjectsRepository: Repository<SubjectEntity>,
    @InjectRepository(VacancyEntity)
    private readonly vacanciesRepository: Repository<VacancyEntity>,
    @InjectRepository(ApplicationEntity)
    private readonly applicationsRepository: Repository<ApplicationEntity>,
  ) {}

  async onApplicationBootstrap() {
    const regionsCount = await this.regionsRepository.count();

    if (regionsCount > 0) {
      return;
    }

    const seed = createSeedData();

    await this.regionOblysesRepository.save(
      seed.oblyses.map((oblys) =>
        this.regionOblysesRepository.create({
          ...oblys,
          createdAt: new Date(oblys.createdAt),
        }),
      ),
    );

    await this.regionsRepository.save(
      seed.regions.map((region) =>
        this.regionsRepository.create({
          ...region,
          createdAt: new Date(region.createdAt),
        }),
      ),
    );

    await this.schoolsRepository.save(
      seed.schools.map((school) =>
        this.schoolsRepository.create({
          ...school,
          createdAt: new Date(school.createdAt),
        }),
      ),
    );

    await this.subjectsRepository.save(
      seed.subjects.map((subject) =>
        this.subjectsRepository.create({
          ...subject,
          createdAt: new Date(subject.createdAt),
        }),
      ),
    );

    await this.vacanciesRepository.save(
      seed.vacancies.map((vacancy) =>
        this.vacanciesRepository.create({
          ...vacancy,
          createdAt: new Date(vacancy.createdAt),
        }),
      ),
    );

    await this.applicationsRepository.save(
      seed.applications.map((application) =>
        this.applicationsRepository.create({
          id: application.id,
          vacancyId: application.vacancyId,
          fullName: application.fullName,
          phone: application.phone,
          iin: application.iin,
          attachmentOriginalName: application.attachmentOriginalName,
          attachmentStoredName: application.attachmentStoredName,
          attachmentMimeType: application.attachmentMimeType,
          attachmentPath: application.attachmentPath,
          createdAt: new Date(application.createdAt),
          emailStatus: application.notificationStatus.email,
          whatsappStatus: application.notificationStatus.whatsapp,
          emailError: application.notificationStatus.emailError,
          whatsappError: application.notificationStatus.whatsappError,
          attemptedAt: application.notificationStatus.attemptedAt
            ? new Date(application.notificationStatus.attemptedAt)
            : null,
        }),
      ),
    );
  }
}
