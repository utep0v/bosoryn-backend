import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import ExcelJS from 'exceljs';
import { Repository } from 'typeorm';
import { requireIin, requireText, requireUuid } from '../common/validation';
import { RegionItemType } from '../domain/models';
import { CandidateApplicationLocationEntity } from '../data/entities/candidate-application-location.entity';
import { CandidateApplicationEntity } from '../data/entities/candidate-application.entity';
import { RegionOblysEntity } from '../data/entities/region-oblys.entity';
import {
  CandidateApplicationLocationView,
  CandidateApplicationView,
} from '../domain/models';
import { CandidateReferralDocumentService } from './candidate-referral-document.service';

interface CreateCandidateApplicationDto {
  fullName: string;
  specialty: string;
  iin: string;
  educationLevel: string;
  locationId: string;
}

interface SaveCandidateApplicationLocationDto {
  oblysId: string;
  name: string;
  type: RegionItemType;
}

interface UniqueCandidateApplicationLocationCheck {
  oblysId: string;
  name: string;
}

function normalizeLocationType(value: unknown, fieldName = 'type') {
  const type = requireText(value, fieldName);

  if (type !== 'district' && type !== 'city') {
    throw new BadRequestException(`${fieldName} must be district or city`);
  }

  return type as RegionItemType;
}

@Injectable()
export class CandidateApplicationsService {
  constructor(
    @InjectRepository(CandidateApplicationEntity)
    private readonly candidateApplicationsRepository: Repository<CandidateApplicationEntity>,
    @InjectRepository(CandidateApplicationLocationEntity)
    private readonly candidateApplicationLocationsRepository: Repository<CandidateApplicationLocationEntity>,
    @InjectRepository(RegionOblysEntity)
    private readonly regionOblysesRepository: Repository<RegionOblysEntity>,
    private readonly candidateReferralDocumentService: CandidateReferralDocumentService,
  ) {}

  async list() {
    const applications = await this.candidateApplicationsRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });

    return applications.map((application) => this.toView(application));
  }

  async exportToExcel() {
    const applications = await this.list();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Анкеты');

    worksheet.columns = [
      { header: 'Дата заявки', key: 'createdAt', width: 24 },
      { header: 'ФИО', key: 'fullName', width: 32 },
      { header: 'Специальность', key: 'specialty', width: 28 },
      { header: 'ИИН', key: 'iin', width: 18 },
      { header: 'Уровень образования', key: 'educationLevel', width: 24 },
      { header: 'Облыс', key: 'oblys', width: 24 },
      { header: 'Локация', key: 'locationName', width: 24 },
      { header: 'Тип', key: 'locationType', width: 16 },
    ];

    applications.forEach((application) => {
      worksheet.addRow({
        createdAt: this.formatDate(application.createdAt),
        fullName: application.fullName,
        specialty: application.specialty,
        iin: application.iin,
        educationLevel: application.educationLevel,
        oblys: application.oblys ?? '',
        locationName: application.locationName ?? '',
        locationType: this.formatLocationType(application.locationType),
      });
    });

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    return workbook.xlsx.writeBuffer();
  }

  async listLocations() {
    const locations = await this.candidateApplicationLocationsRepository.find({
      relations: {
        oblysRef: true,
      },
      order: {
        createdAt: 'ASC',
      },
    });

    const items = locations
      .map((location) => this.toLocationView(location))
      .sort((left, right) => left.label.localeCompare(right.label, 'ru'));

    const treeMap = new Map<
      string,
      {
        oblysId: string | null;
        oblys: string | null;
        locations: CandidateApplicationLocationView[];
      }
    >();

    items.forEach((item) => {
      const key = item.oblysId ?? 'ungrouped';
      let node = treeMap.get(key);

      if (!node) {
        node = {
          oblysId: item.oblysId,
          oblys: item.oblys,
          locations: [],
        };
        treeMap.set(key, node);
      }

      node.locations.push(item);
    });

    return {
      items,
      tree: Array.from(treeMap.values()),
    };
  }

  getPublicLocationOptions() {
    return this.listLocations();
  }

  async createLocation(payload: SaveCandidateApplicationLocationDto) {
    const oblysId = requireUuid(payload.oblysId, 'oblysId');
    const oblys = await this.regionOblysesRepository.findOneBy({ id: oblysId });

    if (!oblys) {
      throw new NotFoundException(`Oblys ${oblysId} was not found`);
    }

    const name = requireText(payload.name, 'name');

    await this.assertLocationIsUnique({ oblysId, name });

    const location = await this.candidateApplicationLocationsRepository.save(
      this.candidateApplicationLocationsRepository.create({
        oblysId,
        oblys: oblys.nameRu,
        audan: name,
        type: normalizeLocationType(payload.type),
      }),
    );

    return this.toLocationView({
      ...location,
      oblysRef: oblys,
    });
  }

  async updateLocation(
    id: string,
    payload: Partial<SaveCandidateApplicationLocationDto>,
  ) {
    const location = await this.candidateApplicationLocationsRepository.findOne(
      {
        where: { id },
        relations: {
          oblysRef: true,
        },
      },
    );

    if (!location) {
      throw new NotFoundException(
        `Candidate application location ${id} was not found`,
      );
    }

    if (payload.oblysId !== undefined) {
      const oblysId = requireUuid(payload.oblysId, 'oblysId');
      const oblys = await this.regionOblysesRepository.findOneBy({
        id: oblysId,
      });

      if (!oblys) {
        throw new NotFoundException(`Oblys ${oblysId} was not found`);
      }

      location.oblysId = oblysId;
      location.oblys = oblys.nameRu;
      location.oblysRef = oblys;
    }

    if (payload.name !== undefined) {
      location.audan = requireText(payload.name, 'name');
    }

    if (payload.type !== undefined) {
      location.type = normalizeLocationType(payload.type);
    }

    await this.assertLocationIsUnique(
      {
        oblysId: location.oblysId ?? '',
        name: location.audan ?? '',
      },
      id,
    );

    const updatedLocation =
      await this.candidateApplicationLocationsRepository.save(location);

    return this.toLocationView(updatedLocation);
  }

  async removeLocation(id: string) {
    const location = await this.candidateApplicationLocationsRepository.findOne(
      {
        where: { id },
        relations: {
          oblysRef: true,
        },
      },
    );

    if (!location) {
      throw new NotFoundException(
        `Candidate application location ${id} was not found`,
      );
    }

    await this.candidateApplicationLocationsRepository.remove(location);
    return this.toLocationView(location);
  }

  async createPublic(payload: CreateCandidateApplicationDto) {
    const locationId = requireUuid(payload.locationId, 'locationId');
    const location = await this.candidateApplicationLocationsRepository.findOne(
      {
        where: { id: locationId },
        relations: {
          oblysRef: true,
        },
      },
    );

    if (!location) {
      throw new NotFoundException(
        `Candidate application location ${locationId} was not found`,
      );
    }

    const application = await this.candidateApplicationsRepository.save(
      this.candidateApplicationsRepository.create({
        fullName: requireText(payload.fullName, 'fullName'),
        specialty: requireText(payload.specialty, 'specialty'),
        iin: requireIin(payload.iin),
        educationLevel: requireText(payload.educationLevel, 'educationLevel'),
        locationId: location.id,
        oblys: location.oblysRef?.nameRu ?? location.oblys ?? null,
        audan: location.audan ?? null,
        locationType: location.type ?? 'district',
      }),
    );

    return this.toView(application);
  }

  async remove(id: string) {
    const application = await this.candidateApplicationsRepository.findOneBy({
      id,
    });

    if (!application) {
      throw new NotFoundException(`Candidate application ${id} was not found`);
    }

    await this.candidateApplicationsRepository.remove(application);

    return this.toView(application);
  }

  async generateReferralDocument(id: string) {
    const application = await this.candidateApplicationsRepository.findOneBy({
      id,
    });

    if (!application) {
      throw new NotFoundException(`Candidate application ${id} was not found`);
    }

    return this.candidateReferralDocumentService.generate(
      this.toView(application),
    );
  }

  private toView(
    application: CandidateApplicationEntity,
  ): CandidateApplicationView {
    return {
      id: application.id,
      fullName: application.fullName,
      specialty: application.specialty,
      iin: application.iin,
      educationLevel: application.educationLevel,
      locationId: application.locationId,
      oblys: application.oblys,
      locationName: application.audan,
      locationType: (application.locationType as RegionItemType | null) ?? null,
      locationLabel: this.formatLocationLabel(
        application.oblys,
        application.audan,
      ),
      referralDocumentUrl: `/candidate-applications/${application.id}/referral-document`,
      createdAt: application.createdAt.toISOString(),
    };
  }

  private toLocationView(
    location: CandidateApplicationLocationEntity,
  ): CandidateApplicationLocationView {
    return {
      id: location.id,
      oblysId: location.oblysId,
      oblys: location.oblysRef?.nameRu ?? location.oblys ?? null,
      name: location.audan ?? '',
      type: ((location.type as RegionItemType | null) ??
        'district') as RegionItemType,
      label:
        this.formatLocationLabel(
          location.oblysRef?.nameRu ?? location.oblys ?? null,
          location.audan,
        ) ??
        location.audan ??
        '',
      createdAt: location.createdAt.toISOString(),
    };
  }

  private formatDate(value: string) {
    return new Intl.DateTimeFormat('ru-RU', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'Asia/Almaty',
    }).format(new Date(value));
  }

  private formatLocationType(type: RegionItemType | null) {
    if (type === 'city') {
      return 'Город';
    }

    if (type === 'district') {
      return 'Аудан';
    }

    return '';
  }

  private async assertLocationIsUnique(
    payload: UniqueCandidateApplicationLocationCheck,
    currentId?: string,
  ) {
    const existing = await this.candidateApplicationLocationsRepository.findOne(
      {
        where: {
          oblysId: payload.oblysId,
          audan: payload.name,
        },
      },
    );

    if (existing && existing.id !== currentId) {
      throw new BadRequestException(
        'Candidate application location already exists',
      );
    }
  }

  private formatLocationLabel(
    oblysName: string | null,
    locationName: string | null,
  ) {
    const parts = [oblysName, locationName].filter((value): value is string =>
      Boolean(value),
    );

    return parts.length > 0 ? parts.join(' - ') : null;
  }
}
