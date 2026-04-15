import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import ExcelJS from 'exceljs';
import { Repository } from 'typeorm';
import { requireIin, requireText, requireUuid } from '../common/validation';
import { CandidateApplicationLocationEntity } from '../data/entities/candidate-application-location.entity';
import { CandidateApplicationEntity } from '../data/entities/candidate-application.entity';
import {
  CandidateApplicationLocationView,
  CandidateApplicationView,
} from '../domain/models';

interface CreateCandidateApplicationDto {
  fullName: string;
  specialty: string;
  iin: string;
  educationLevel: string;
  locationId: string;
}

interface SaveCandidateApplicationLocationDto {
  oblys: string;
  audan: string;
}

@Injectable()
export class CandidateApplicationsService {
  constructor(
    @InjectRepository(CandidateApplicationEntity)
    private readonly candidateApplicationsRepository: Repository<CandidateApplicationEntity>,
    @InjectRepository(CandidateApplicationLocationEntity)
    private readonly candidateApplicationLocationsRepository: Repository<CandidateApplicationLocationEntity>,
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
      { header: 'Аудан', key: 'audan', width: 24 },
    ];

    applications.forEach((application) => {
      worksheet.addRow({
        createdAt: this.formatDate(application.createdAt),
        fullName: application.fullName,
        specialty: application.specialty,
        iin: application.iin,
        educationLevel: application.educationLevel,
        oblys: application.oblys ?? '',
        audan: application.audan ?? '',
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
      order: {
        oblys: 'ASC',
        audan: 'ASC',
        createdAt: 'ASC',
      },
    });

    return locations.map((location) => this.toLocationView(location));
  }

  async getPublicLocationOptions() {
    const locations = await this.listLocations();
    const oblysMap = new Map<
      string,
      {
        oblys: string;
        audans: Array<{
          id: string;
          audan: string;
          label: string;
        }>;
      }
    >();

    locations.forEach((location) => {
      let oblysNode = oblysMap.get(location.oblys);

      if (!oblysNode) {
        oblysNode = {
          oblys: location.oblys,
          audans: [],
        };
        oblysMap.set(location.oblys, oblysNode);
      }

      let audanNode = oblysNode.audans.find(
        (item) => item.audan === location.audan,
      );

      if (!audanNode) {
        audanNode = {
          id: location.id,
          audan: location.audan,
          label: location.label,
        };
        oblysNode.audans.push(audanNode);
      }
    });

    return {
      locations,
      tree: Array.from(oblysMap.values()),
    };
  }

  async createLocation(payload: SaveCandidateApplicationLocationDto) {
    const normalizedPayload = this.normalizeLocationPayload(payload);
    await this.assertLocationIsUnique(normalizedPayload);

    const location = await this.candidateApplicationLocationsRepository.save(
      this.candidateApplicationLocationsRepository.create(normalizedPayload),
    );

    return this.toLocationView(location);
  }

  async updateLocation(
    id: string,
    payload: Partial<SaveCandidateApplicationLocationDto>,
  ) {
    const location =
      await this.candidateApplicationLocationsRepository.findOneBy({ id });

    if (!location) {
      throw new NotFoundException(
        `Candidate application location ${id} was not found`,
      );
    }

    if (payload.oblys !== undefined) {
      location.oblys = requireText(payload.oblys, 'oblys');
    }

    if (payload.audan !== undefined) {
      location.audan = requireText(payload.audan, 'audan');
    }

    await this.assertLocationIsUnique(
      {
        oblys: location.oblys,
        audan: location.audan,
      },
      id,
    );

    const updatedLocation =
      await this.candidateApplicationLocationsRepository.save(location);

    return this.toLocationView(updatedLocation);
  }

  async removeLocation(id: string) {
    const location =
      await this.candidateApplicationLocationsRepository.findOneBy({ id });

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
    const location =
      await this.candidateApplicationLocationsRepository.findOneBy({
        id: locationId,
      });

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
        oblys: location.oblys,
        audan: location.audan,
      }),
    );

    return this.toView(application);
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
      audan: application.audan,
      locationLabel: this.formatLocationLabel(application),
      createdAt: application.createdAt.toISOString(),
    };
  }

  private toLocationView(
    location: CandidateApplicationLocationEntity,
  ): CandidateApplicationLocationView {
    return {
      id: location.id,
      oblys: location.oblys,
      audan: location.audan,
      label: this.formatLocationLabel(location) ?? '',
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

  private normalizeLocationPayload(
    payload: SaveCandidateApplicationLocationDto,
  ) {
    return {
      oblys: requireText(payload.oblys, 'oblys'),
      audan: requireText(payload.audan, 'audan'),
    };
  }

  private async assertLocationIsUnique(
    payload: SaveCandidateApplicationLocationDto,
    currentId?: string,
  ) {
    const existing = await this.candidateApplicationLocationsRepository.findOne(
      {
        where: {
          oblys: payload.oblys,
          audan: payload.audan,
        },
      },
    );

    if (existing && existing.id !== currentId) {
      throw new BadRequestException(
        'Candidate application location already exists',
      );
    }
  }

  private formatLocationLabel(location: {
    oblys: string | null;
    audan: string | null;
  }) {
    const parts = [location.oblys, location.audan].filter(
      (value): value is string => Boolean(value),
    );

    return parts.length > 0 ? parts.join(' / ') : null;
  }
}
