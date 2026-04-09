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

  async getAnalytics() {
    const [byRegion, bySubject, byGraduationYear, bySchool] = await Promise.all(
      [
        this.applicationsRepository
          .createQueryBuilder('application')
          .innerJoin('application.vacancy', 'vacancy')
          .innerJoin('vacancy.region', 'region')
          .select('region.id', 'id')
          .addSelect('region.nameRu', 'label')
          .addSelect('COUNT(application.id)', 'applicationsCount')
          .groupBy('region.id')
          .addGroupBy('region.nameRu')
          .orderBy('COUNT(application.id)', 'DESC')
          .getRawMany<{
            id: string;
            label: string;
            applicationsCount: string;
          }>(),
        this.applicationsRepository
          .createQueryBuilder('application')
          .innerJoin('application.vacancy', 'vacancy')
          .innerJoin('vacancy.subject', 'subject')
          .select('subject.id', 'id')
          .addSelect('subject.nameRu', 'label')
          .addSelect('COUNT(application.id)', 'applicationsCount')
          .groupBy('subject.id')
          .addGroupBy('subject.nameRu')
          .orderBy('COUNT(application.id)', 'DESC')
          .getRawMany<{
            id: string;
            label: string;
            applicationsCount: string;
          }>(),
        this.applicationsRepository
          .createQueryBuilder('application')
          .innerJoin('application.vacancy', 'vacancy')
          .select('vacancy.graduationYear', 'year')
          .addSelect('COUNT(application.id)', 'applicationsCount')
          .groupBy('vacancy.graduationYear')
          .orderBy('vacancy.graduationYear', 'ASC')
          .getRawMany<{
            year: string;
            applicationsCount: string;
          }>(),
        this.applicationsRepository
          .createQueryBuilder('application')
          .innerJoin('application.vacancy', 'vacancy')
          .innerJoin('vacancy.school', 'school')
          .select('school.id', 'id')
          .addSelect('school.name', 'label')
          .addSelect('COUNT(application.id)', 'applicationsCount')
          .groupBy('school.id')
          .addGroupBy('school.name')
          .orderBy('COUNT(application.id)', 'DESC')
          .getRawMany<{
            id: string;
            label: string;
            applicationsCount: string;
          }>(),
      ],
    );

    return {
      totalApplications: byRegion.reduce(
        (sum, item) => sum + Number(item.applicationsCount),
        0,
      ),
      byRegion: byRegion.map((item) => ({
        id: item.id,
        label: item.label,
        applicationsCount: Number(item.applicationsCount),
      })),
      bySubject: bySubject.map((item) => ({
        id: item.id,
        label: item.label,
        applicationsCount: Number(item.applicationsCount),
      })),
      byGraduationYear: byGraduationYear.map((item) => ({
        year: Number(item.year),
        applicationsCount: Number(item.applicationsCount),
      })),
      topSchools: bySchool.map((item) => ({
        id: item.id,
        label: item.label,
        applicationsCount: Number(item.applicationsCount),
      })),
    };
  }
}
