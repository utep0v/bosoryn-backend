import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { requireText } from '../common/validation';
import { RegionEntity } from '../data/entities/region.entity';
import { SchoolEntity } from '../data/entities/school.entity';
import { VacancyEntity } from '../data/entities/vacancy.entity';

interface SaveRegionDto {
  nameKz: string;
  nameRu: string;
}

@Injectable()
export class RegionsService {
  constructor(
    @InjectRepository(RegionEntity)
    private readonly regionsRepository: Repository<RegionEntity>,
    @InjectRepository(SchoolEntity)
    private readonly schoolsRepository: Repository<SchoolEntity>,
    @InjectRepository(VacancyEntity)
    private readonly vacanciesRepository: Repository<VacancyEntity>,
  ) {}

  async list() {
    return this.regionsRepository.find({
      order: {
        id: 'ASC',
      },
    });
  }

  async create(payload: SaveRegionDto) {
    const region = this.regionsRepository.create({
      nameKz: requireText(payload.nameKz, 'nameKz'),
      nameRu: requireText(payload.nameRu, 'nameRu'),
    });

    return this.regionsRepository.save(region);
  }

  async update(id: string, payload: Partial<SaveRegionDto>) {
    const region = await this.regionsRepository.findOneBy({ id });

    if (!region) {
      throw new NotFoundException(`Region ${id} was not found`);
    }

    if (payload.nameKz !== undefined) {
      region.nameKz = requireText(payload.nameKz, 'nameKz');
    }

    if (payload.nameRu !== undefined) {
      region.nameRu = requireText(payload.nameRu, 'nameRu');
    }

    return this.regionsRepository.save(region);
  }

  async remove(id: string) {
    const region = await this.regionsRepository.findOneBy({ id });

    if (!region) {
      throw new NotFoundException(`Region ${id} was not found`);
    }

    const [schoolsCount, vacanciesCount] = await Promise.all([
      this.schoolsRepository.countBy({ regionId: id }),
      this.vacanciesRepository.countBy({ regionId: id }),
    ]);

    if (schoolsCount > 0 || vacanciesCount > 0) {
      throw new BadRequestException(
        'Region cannot be removed because it is used by schools or vacancies',
      );
    }

    await this.regionsRepository.remove(region);
    return region;
  }
}
