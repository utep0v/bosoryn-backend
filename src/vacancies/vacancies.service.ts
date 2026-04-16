import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  requireBoolean,
  requirePositiveInt,
  requireText,
  requireUuid,
  toOptionalInt,
  toOptionalText,
} from '../common/validation';
import { ApplicationEntity } from '../data/entities/application.entity';
import { RegionEntity } from '../data/entities/region.entity';
import { SchoolEntity } from '../data/entities/school.entity';
import { SubjectEntity } from '../data/entities/subject.entity';
import { VacancyEntity } from '../data/entities/vacancy.entity';
import { mapVacancyEntity } from '../data/mappers';
import { TeachingLanguage, VacancyStatus } from '../domain/models';

interface VacancyFilters {
  regionId?: string;
  schoolId?: string;
  subjectId?: string;
  graduationYear?: number;
  status?: VacancyStatus;
  lang?: TeachingLanguage;
}

interface SaveVacancyDto {
  regionId: string;
  schoolId: string;
  subjectId: string;
  isPedagogical: boolean;
  teachingLanguage: TeachingLanguage;
  graduationYear: number;
  status: VacancyStatus;
}

function normalizeLanguage(value: unknown, fieldName = 'teachingLanguage') {
  const language = requireText(value, fieldName);

  if (language !== 'kz' && language !== 'ru') {
    throw new BadRequestException(`${fieldName} must be kz or ru`);
  }

  return language as TeachingLanguage;
}

function normalizeStatus(value: unknown, fieldName = 'status') {
  const status = requireText(value, fieldName);

  if (status !== 'open' && status !== 'closed') {
    throw new BadRequestException(`${fieldName} must be open or closed`);
  }

  return status as VacancyStatus;
}

@Injectable()
export class VacanciesService {
  constructor(
    @InjectRepository(VacancyEntity)
    private readonly vacanciesRepository: Repository<VacancyEntity>,
    @InjectRepository(RegionEntity)
    private readonly regionsRepository: Repository<RegionEntity>,
    @InjectRepository(SchoolEntity)
    private readonly schoolsRepository: Repository<SchoolEntity>,
    @InjectRepository(SubjectEntity)
    private readonly subjectsRepository: Repository<SubjectEntity>,
    @InjectRepository(ApplicationEntity)
    private readonly applicationsRepository: Repository<ApplicationEntity>,
  ) {}

  async list(filters: VacancyFilters = {}) {
    const query = this.vacanciesRepository
      .createQueryBuilder('vacancy')
      .leftJoinAndSelect('vacancy.region', 'region')
      .leftJoinAndSelect('region.oblys', 'regionOblys')
      .leftJoinAndSelect('vacancy.school', 'school')
      .leftJoinAndSelect('vacancy.subject', 'subject')
      .orderBy('vacancy.createdAt', 'DESC');

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

    if (filters.subjectId) {
      query.andWhere('vacancy.subjectId = :subjectId', {
        subjectId: filters.subjectId,
      });
    }

    if (filters.graduationYear) {
      query.andWhere('vacancy.graduationYear = :graduationYear', {
        graduationYear: filters.graduationYear,
      });
    }

    if (filters.status) {
      query.andWhere('vacancy.status = :status', {
        status: filters.status,
      });
    }

    const vacancies = await query.getMany();
    return vacancies.map((vacancy) =>
      mapVacancyEntity(vacancy, filters.lang ?? 'ru'),
    );
  }

  async listPublic(query: Record<string, unknown>) {
    const lang = query.lang === 'kz' ? 'kz' : 'ru';

    return this.list({
      regionId: toOptionalText(query.regionId),
      subjectId: toOptionalText(query.subjectId),
      schoolId: toOptionalText(query.schoolId),
      graduationYear: toOptionalInt(query.graduationYear),
      status: 'open',
      lang,
    });
  }

  async getPublicFilters(lang: TeachingLanguage = 'ru') {
    const [regions, schools, subjects, rawYears] = await Promise.all([
      this.regionsRepository.find({
        relations: {
          oblys: true,
        },
        order: {
          createdAt: 'ASC',
        },
      }),
      this.schoolsRepository.find({ order: { id: 'ASC' } }),
      this.subjectsRepository.find({ order: { id: 'ASC' } }),
      this.vacanciesRepository
        .createQueryBuilder('vacancy')
        .select('DISTINCT vacancy.graduationYear', 'graduationYear')
        .where('vacancy.status = :status', { status: 'open' })
        .orderBy('vacancy.graduationYear', 'ASC')
        .getRawMany<{ graduationYear: string }>(),
    ]);

    const currentYear = new Date().getFullYear();
    const availableYears = new Set<number>([currentYear, currentYear + 1]);

    rawYears.forEach((item) => {
      availableYears.add(Number(item.graduationYear));
    });

    return {
      regions: regions.map((region) => ({
        id: region.id,
        label:
          lang === 'ru'
            ? region.oblys?.nameRu
              ? `${region.oblys.nameRu} - ${region.nameRu}`
              : region.nameRu
            : region.oblys?.nameKz
              ? `${region.oblys.nameKz} - ${region.nameKz}`
              : region.nameKz,
      })),
      schools: schools.map((school) => ({
        id: school.id,
        label: school.name,
        regionId: school.regionId,
      })),
      subjects: subjects.map((subject) => ({
        id: subject.id,
        label: lang === 'ru' ? subject.nameRu : subject.nameKz,
      })),
      graduationYears: Array.from(availableYears).sort((a, b) => a - b),
    };
  }

  async findById(id: string) {
    const vacancy = await this.vacanciesRepository.findOne({
      where: { id },
      relations: {
        region: {
          oblys: true,
        },
        school: true,
        subject: true,
      },
    });

    if (!vacancy) {
      throw new NotFoundException(`Vacancy ${id} was not found`);
    }

    return mapVacancyEntity(vacancy, 'ru');
  }

  async create(payload: SaveVacancyDto) {
    const regionId = requireUuid(payload.regionId, 'regionId');
    const schoolId = requireUuid(payload.schoolId, 'schoolId');
    const subjectId = requireUuid(payload.subjectId, 'subjectId');

    const [region, school, subject] = await Promise.all([
      this.regionsRepository.findOneBy({ id: regionId }),
      this.schoolsRepository.findOneBy({ id: schoolId }),
      this.subjectsRepository.findOneBy({ id: subjectId }),
    ]);

    if (!region) {
      throw new NotFoundException(`Region ${regionId} was not found`);
    }

    if (!school) {
      throw new NotFoundException(`School ${schoolId} was not found`);
    }

    if (!subject) {
      throw new NotFoundException(`Subject ${subjectId} was not found`);
    }

    if (school.regionId !== regionId) {
      throw new NotFoundException(
        'School does not belong to the selected region',
      );
    }

    const vacancy = this.vacanciesRepository.create({
      regionId,
      schoolId,
      subjectId,
      isPedagogical: requireBoolean(payload.isPedagogical, 'isPedagogical'),
      teachingLanguage: normalizeLanguage(payload.teachingLanguage),
      graduationYear: requirePositiveInt(
        payload.graduationYear,
        'graduationYear',
      ),
      status: normalizeStatus(payload.status),
    });

    const savedVacancy = await this.vacanciesRepository.save(vacancy);
    return this.findById(savedVacancy.id);
  }

  async update(id: string, payload: Partial<SaveVacancyDto>) {
    const vacancy = await this.vacanciesRepository.findOneBy({ id });

    if (!vacancy) {
      throw new NotFoundException(`Vacancy ${id} was not found`);
    }

    const nextRegionId =
      payload.regionId !== undefined
        ? requireUuid(payload.regionId, 'regionId')
        : vacancy.regionId;
    const nextSchoolId =
      payload.schoolId !== undefined
        ? requireUuid(payload.schoolId, 'schoolId')
        : vacancy.schoolId;
    const nextSubjectId =
      payload.subjectId !== undefined
        ? requireUuid(payload.subjectId, 'subjectId')
        : vacancy.subjectId;

    const [region, school, subject] = await Promise.all([
      this.regionsRepository.findOneBy({ id: nextRegionId }),
      this.schoolsRepository.findOneBy({ id: nextSchoolId }),
      this.subjectsRepository.findOneBy({ id: nextSubjectId }),
    ]);

    if (!region) {
      throw new NotFoundException(`Region ${nextRegionId} was not found`);
    }

    if (!school) {
      throw new NotFoundException(`School ${nextSchoolId} was not found`);
    }

    if (!subject) {
      throw new NotFoundException(`Subject ${nextSubjectId} was not found`);
    }

    if (school.regionId !== nextRegionId) {
      throw new NotFoundException(
        'School does not belong to the selected region',
      );
    }

    vacancy.regionId = nextRegionId;
    vacancy.schoolId = nextSchoolId;
    vacancy.subjectId = nextSubjectId;

    if (payload.isPedagogical !== undefined) {
      vacancy.isPedagogical = requireBoolean(
        payload.isPedagogical,
        'isPedagogical',
      );
    }

    if (payload.teachingLanguage !== undefined) {
      vacancy.teachingLanguage = normalizeLanguage(payload.teachingLanguage);
    }

    if (payload.graduationYear !== undefined) {
      vacancy.graduationYear = requirePositiveInt(
        payload.graduationYear,
        'graduationYear',
      );
    }

    if (payload.status !== undefined) {
      vacancy.status = normalizeStatus(payload.status);
    }

    await this.vacanciesRepository.save(vacancy);
    return this.findById(vacancy.id);
  }

  async remove(id: string) {
    const vacancy = await this.vacanciesRepository.findOne({
      where: { id },
      relations: {
        region: {
          oblys: true,
        },
        school: true,
        subject: true,
      },
    });

    if (!vacancy) {
      throw new NotFoundException(`Vacancy ${id} was not found`);
    }

    const applicationsCount = await this.applicationsRepository.countBy({
      vacancyId: id,
    });

    if (applicationsCount > 0) {
      throw new BadRequestException(
        'Vacancy cannot be removed because applications already exist',
      );
    }

    await this.vacanciesRepository.remove(vacancy);
    return mapVacancyEntity(vacancy, 'ru');
  }
}
