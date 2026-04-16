import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { requireText, requireUuid } from '../common/validation';
import { RegionItemType } from '../domain/models';
import { RegionOblysEntity } from '../data/entities/region-oblys.entity';
import { RegionEntity } from '../data/entities/region.entity';
import { SchoolEntity } from '../data/entities/school.entity';
import { VacancyEntity } from '../data/entities/vacancy.entity';

interface SaveRegionDto {
  oblysId: string;
  nameKz: string;
  nameRu: string;
  type: RegionItemType;
}

interface SaveOblysDto {
  nameKz: string;
  nameRu: string;
}

function normalizeRegionType(value: unknown, fieldName = 'type') {
  const type = requireText(value, fieldName);

  if (type !== 'district' && type !== 'city') {
    throw new BadRequestException(`${fieldName} must be district or city`);
  }

  return type as RegionItemType;
}

@Injectable()
export class RegionsService {
  constructor(
    @InjectRepository(RegionEntity)
    private readonly regionsRepository: Repository<RegionEntity>,
    @InjectRepository(RegionOblysEntity)
    private readonly regionOblysesRepository: Repository<RegionOblysEntity>,
    @InjectRepository(SchoolEntity)
    private readonly schoolsRepository: Repository<SchoolEntity>,
    @InjectRepository(VacancyEntity)
    private readonly vacanciesRepository: Repository<VacancyEntity>,
  ) {}

  async list() {
    const [oblyses, regions] = await Promise.all([
      this.listOblyses(),
      this.regionsRepository.find({
        relations: {
          oblys: true,
        },
        order: {
          createdAt: 'ASC',
        },
      }),
    ]);

    const items = regions
      .map((region) => this.toRegionView(region))
      .sort((left, right) => left.labelRu.localeCompare(right.labelRu, 'ru'));

    const tree = oblyses.map((oblys) => ({
      ...oblys,
      regions: items.filter((item) => item.oblysId === oblys.id),
    }));

    return {
      oblyses,
      items,
      tree,
    };
  }

  async listOblyses() {
    const oblyses = await this.regionOblysesRepository.find({
      order: {
        nameRu: 'ASC',
        createdAt: 'ASC',
      },
    });

    return oblyses.map((oblys) => ({
      id: oblys.id,
      nameKz: oblys.nameKz,
      nameRu: oblys.nameRu,
      createdAt: oblys.createdAt.toISOString(),
    }));
  }

  async createOblys(payload: SaveOblysDto) {
    const oblys = this.regionOblysesRepository.create({
      nameKz: requireText(payload.nameKz, 'nameKz'),
      nameRu: requireText(payload.nameRu, 'nameRu'),
    });

    return this.regionOblysesRepository.save(oblys);
  }

  async updateOblys(id: string, payload: Partial<SaveOblysDto>) {
    const oblys = await this.regionOblysesRepository.findOneBy({ id });

    if (!oblys) {
      throw new NotFoundException(`Oblys ${id} was not found`);
    }

    if (payload.nameKz !== undefined) {
      oblys.nameKz = requireText(payload.nameKz, 'nameKz');
    }

    if (payload.nameRu !== undefined) {
      oblys.nameRu = requireText(payload.nameRu, 'nameRu');
    }

    return this.regionOblysesRepository.save(oblys);
  }

  async removeOblys(id: string) {
    const oblys = await this.regionOblysesRepository.findOneBy({ id });

    if (!oblys) {
      throw new NotFoundException(`Oblys ${id} was not found`);
    }

    const regionsCount = await this.regionsRepository.countBy({ oblysId: id });

    if (regionsCount > 0) {
      throw new BadRequestException(
        'Oblys cannot be removed because it is used by regions',
      );
    }

    await this.regionOblysesRepository.remove(oblys);
    return oblys;
  }

  async create(payload: SaveRegionDto) {
    const oblysId = requireUuid(payload.oblysId, 'oblysId');
    const oblys = await this.regionOblysesRepository.findOneBy({ id: oblysId });

    if (!oblys) {
      throw new NotFoundException(`Oblys ${oblysId} was not found`);
    }

    const region = this.regionsRepository.create({
      oblysId,
      nameKz: requireText(payload.nameKz, 'nameKz'),
      nameRu: requireText(payload.nameRu, 'nameRu'),
      type: normalizeRegionType(payload.type),
    });

    const savedRegion = await this.regionsRepository.save(region);
    return this.toRegionView({
      ...savedRegion,
      oblys,
    });
  }

  async update(id: string, payload: Partial<SaveRegionDto>) {
    const region = await this.regionsRepository.findOne({
      where: { id },
      relations: {
        oblys: true,
      },
    });

    if (!region) {
      throw new NotFoundException(`Region ${id} was not found`);
    }

    if (payload.oblysId !== undefined) {
      const oblysId = requireUuid(payload.oblysId, 'oblysId');
      const oblys = await this.regionOblysesRepository.findOneBy({
        id: oblysId,
      });

      if (!oblys) {
        throw new NotFoundException(`Oblys ${oblysId} was not found`);
      }

      region.oblysId = oblysId;
      region.oblys = oblys;
    }

    if (payload.nameKz !== undefined) {
      region.nameKz = requireText(payload.nameKz, 'nameKz');
    }

    if (payload.nameRu !== undefined) {
      region.nameRu = requireText(payload.nameRu, 'nameRu');
    }

    if (payload.type !== undefined) {
      region.type = normalizeRegionType(payload.type);
    }

    const savedRegion = await this.regionsRepository.save(region);
    return this.toRegionView(savedRegion);
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

  private toRegionView(region: RegionEntity) {
    return {
      id: region.id,
      oblysId: region.oblysId,
      oblysNameKz: region.oblys?.nameKz ?? null,
      oblysNameRu: region.oblys?.nameRu ?? null,
      nameKz: region.nameKz,
      nameRu: region.nameRu,
      type: (region.type as RegionItemType | null) ?? null,
      labelKz: this.formatRegionLabel(
        region.oblys?.nameKz ?? null,
        region.nameKz,
      ),
      labelRu: this.formatRegionLabel(
        region.oblys?.nameRu ?? null,
        region.nameRu,
      ),
      createdAt: region.createdAt.toISOString(),
    };
  }

  private formatRegionLabel(oblysName: string | null, regionName: string) {
    return oblysName ? `${oblysName} - ${regionName}` : regionName;
  }
}
