import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationEntity } from '../data/entities/application.entity';
import { RegionEntity } from '../data/entities/region.entity';
import { SchoolEntity } from '../data/entities/school.entity';
import { VacancyEntity } from '../data/entities/vacancy.entity';
import { mapApplicationEntity } from '../data/mappers';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(RegionEntity)
    private readonly regionsRepository: Repository<RegionEntity>,
    @InjectRepository(SchoolEntity)
    private readonly schoolsRepository: Repository<SchoolEntity>,
    @InjectRepository(VacancyEntity)
    private readonly vacanciesRepository: Repository<VacancyEntity>,
    @InjectRepository(ApplicationEntity)
    private readonly applicationsRepository: Repository<ApplicationEntity>,
  ) {}

  async getSummary() {
    const [
      regionsCount,
      schoolsCount,
      vacanciesCount,
      applicationsCount,
      recent,
    ] = await Promise.all([
      this.regionsRepository.count(),
      this.schoolsRepository.count(),
      this.vacanciesRepository.count(),
      this.applicationsRepository.count(),
      this.applicationsRepository.find({
        relations: {
          vacancy: {
            region: true,
            school: true,
            subject: true,
          },
        },
        order: {
          createdAt: 'DESC',
        },
        take: 10,
      }),
    ]);

    return {
      counts: {
        regions: regionsCount,
        schools: schoolsCount,
        vacancies: vacanciesCount,
        applications: applicationsCount,
      },
      recentApplications: recent.map((application) =>
        mapApplicationEntity(application, 'ru'),
      ),
    };
  }
}
