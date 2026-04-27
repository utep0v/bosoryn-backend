import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicationEntity } from '../data/entities/application.entity';
import { CandidateApplicationEntity } from '../data/entities/candidate-application.entity';
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
    @InjectRepository(CandidateApplicationEntity)
    private readonly candidateApplicationsRepository: Repository<CandidateApplicationEntity>,
  ) {}

  async getSummary() {
    const [
      regionsCount,
      schoolsCount,
      vacanciesCount,
      applicationsCount,
      candidateApplicationsCount,
      recent,
    ] = await Promise.all([
      this.regionsRepository.count(),
      this.schoolsRepository.count(),
      this.vacanciesRepository.count(),
      this.applicationsRepository.count(),
      this.candidateApplicationsRepository.count(),
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
        candidateApplications: candidateApplicationsCount,
      },
      recentApplications: recent.map((application) =>
        mapApplicationEntity(application, 'ru'),
      ),
    };
  }

  async getAnalytics() {
    const [
      byRegion,
      bySubject,
      byGraduationYear,
      bySchool,
      vacanciesBySubject,
      candidateBySpecialty,
      candidateByEducationLevel,
      candidateByOblys,
      candidateByLocation,
    ] = await Promise.all([
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
      this.vacanciesRepository
        .createQueryBuilder('vacancy')
        .innerJoin('vacancy.subject', 'subject')
        .select('subject.id', 'id')
        .addSelect('subject.nameRu', 'label')
        .addSelect('COUNT(vacancy.id)', 'vacanciesCount')
        .where('vacancy.status = :status', { status: 'open' })
        .groupBy('subject.id')
        .addGroupBy('subject.nameRu')
        .orderBy('COUNT(vacancy.id)', 'DESC')
        .getRawMany<{
          id: string;
          label: string;
          vacanciesCount: string;
        }>(),
      this.candidateApplicationsRepository
        .createQueryBuilder('application')
        .select('application.specialty', 'label')
        .addSelect('COUNT(application.id)', 'applicationsCount')
        .groupBy('application.specialty')
        .orderBy('COUNT(application.id)', 'DESC')
        .getRawMany<{
          label: string;
          applicationsCount: string;
        }>(),
      this.candidateApplicationsRepository
        .createQueryBuilder('application')
        .select('application.educationLevel', 'label')
        .addSelect('COUNT(application.id)', 'applicationsCount')
        .groupBy('application.educationLevel')
        .orderBy('COUNT(application.id)', 'DESC')
        .getRawMany<{
          label: string;
          applicationsCount: string;
        }>(),
      this.candidateApplicationsRepository
        .createQueryBuilder('application')
        .select('application.oblys', 'label')
        .addSelect('COUNT(application.id)', 'applicationsCount')
        .groupBy('application.oblys')
        .orderBy('COUNT(application.id)', 'DESC')
        .getRawMany<{
          label: string | null;
          applicationsCount: string;
        }>(),
      this.candidateApplicationsRepository
        .createQueryBuilder('application')
        .select('application.locationId', 'id')
        .addSelect('application.oblys', 'oblys')
        .addSelect('application.audan', 'locationName')
        .addSelect('COUNT(application.id)', 'applicationsCount')
        .groupBy('application.locationId')
        .addGroupBy('application.oblys')
        .addGroupBy('application.audan')
        .orderBy('COUNT(application.id)', 'DESC')
        .getRawMany<{
          id: string | null;
          oblys: string | null;
          locationName: string | null;
          applicationsCount: string;
        }>(),
    ]);
    const totalCandidateApplications = candidateBySpecialty.reduce(
      (sum, item) => sum + Number(item.applicationsCount),
      0,
    );

    return {
      totalApplications: byRegion.reduce(
        (sum, item) => sum + Number(item.applicationsCount),
        0,
      ),
      totalOpenVacancies: vacanciesBySubject.reduce(
        (sum, item) => sum + Number(item.vacanciesCount),
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
      vacanciesBySubject: vacanciesBySubject.map((item) => ({
        id: item.id,
        label: item.label,
        vacanciesCount: Number(item.vacanciesCount),
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
      candidateApplications: {
        totalApplications: totalCandidateApplications,
        bySpecialty: candidateBySpecialty.map((item) => ({
          label: item.label,
          applicationsCount: Number(item.applicationsCount),
        })),
        byEducationLevel: candidateByEducationLevel.map((item) => ({
          label: item.label,
          applicationsCount: Number(item.applicationsCount),
        })),
        byOblys: candidateByOblys.map((item) => ({
          label: item.label ?? 'Без области',
          applicationsCount: Number(item.applicationsCount),
        })),
        byLocation: candidateByLocation.map((item) => ({
          id: item.id,
          oblys: item.oblys,
          locationName: item.locationName,
          label:
            [item.oblys, item.locationName]
              .filter((value): value is string => Boolean(value))
              .join(' - ') || 'Без локации',
          applicationsCount: Number(item.applicationsCount),
        })),
      },
    };
  }
}
