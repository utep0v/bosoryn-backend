import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  requireEmail,
  requirePhone,
  requireText,
  requireUuid,
} from '../common/validation';
import { RegionEntity } from '../data/entities/region.entity';
import { SchoolEntity } from '../data/entities/school.entity';
import { VacancyEntity } from '../data/entities/vacancy.entity';

interface SaveSchoolDto {
  name: string;
  email: string;
  phone: string;
  regionId: string;
}

@Injectable()
export class SchoolsService {
  constructor(
    @InjectRepository(SchoolEntity)
    private readonly schoolsRepository: Repository<SchoolEntity>,
    @InjectRepository(RegionEntity)
    private readonly regionsRepository: Repository<RegionEntity>,
    @InjectRepository(VacancyEntity)
    private readonly vacanciesRepository: Repository<VacancyEntity>,
  ) {}

  async list(regionId?: string) {
    return this.schoolsRepository.find({
      where: regionId ? { regionId } : undefined,
      relations: {
        region: true,
      },
      order: {
        id: 'ASC',
      },
    });
  }

  async create(payload: SaveSchoolDto) {
    const regionId = requireUuid(payload.regionId, 'regionId');
    const region = await this.regionsRepository.findOneBy({ id: regionId });

    if (!region) {
      throw new NotFoundException(`Region ${regionId} was not found`);
    }

    const school = this.schoolsRepository.create({
      name: requireText(payload.name, 'name'),
      email: requireEmail(payload.email),
      phone: requirePhone(payload.phone),
      regionId,
    });

    return this.schoolsRepository.save(school);
  }

  async update(id: string, payload: Partial<SaveSchoolDto>) {
    const school = await this.schoolsRepository.findOneBy({ id });

    if (!school) {
      throw new NotFoundException(`School ${id} was not found`);
    }

    if (payload.name !== undefined) {
      school.name = requireText(payload.name, 'name');
    }

    if (payload.email !== undefined) {
      school.email = requireEmail(payload.email);
    }

    if (payload.phone !== undefined) {
      school.phone = requirePhone(payload.phone);
    }

    if (payload.regionId !== undefined) {
      const regionId = requireUuid(payload.regionId, 'regionId');
      const region = await this.regionsRepository.findOneBy({ id: regionId });

      if (!region) {
        throw new NotFoundException(`Region ${regionId} was not found`);
      }

      school.regionId = regionId;
    }

    return this.schoolsRepository.save(school);
  }

  async remove(id: string) {
    const school = await this.schoolsRepository.findOneBy({ id });

    if (!school) {
      throw new NotFoundException(`School ${id} was not found`);
    }

    const vacanciesCount = await this.vacanciesRepository.countBy({
      schoolId: id,
    });

    if (vacanciesCount > 0) {
      throw new BadRequestException(
        'School cannot be removed because it is used by vacancies',
      );
    }

    await this.schoolsRepository.remove(school);
    return school;
  }
}
