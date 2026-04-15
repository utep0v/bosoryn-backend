import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import ExcelJS from 'exceljs';
import { Repository } from 'typeorm';
import { requireIin, requireText } from '../common/validation';
import { CandidateApplicationEntity } from '../data/entities/candidate-application.entity';
import { CandidateApplicationView } from '../domain/models';

interface CreateCandidateApplicationDto {
  fullName: string;
  specialty: string;
  iin: string;
  educationLevel: string;
}

@Injectable()
export class CandidateApplicationsService {
  constructor(
    @InjectRepository(CandidateApplicationEntity)
    private readonly candidateApplicationsRepository: Repository<CandidateApplicationEntity>,
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
    ];

    applications.forEach((application) => {
      worksheet.addRow({
        createdAt: this.formatDate(application.createdAt),
        fullName: application.fullName,
        specialty: application.specialty,
        iin: application.iin,
        educationLevel: application.educationLevel,
      });
    });

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    return workbook.xlsx.writeBuffer();
  }

  async createPublic(payload: CreateCandidateApplicationDto) {
    const application = await this.candidateApplicationsRepository.save(
      this.candidateApplicationsRepository.create({
        fullName: requireText(payload.fullName, 'fullName'),
        specialty: requireText(payload.specialty, 'specialty'),
        iin: requireIin(payload.iin),
        educationLevel: requireText(payload.educationLevel, 'educationLevel'),
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
      createdAt: application.createdAt.toISOString(),
    };
  }

  private formatDate(value: string) {
    return new Intl.DateTimeFormat('ru-RU', {
      dateStyle: 'short',
      timeStyle: 'short',
      timeZone: 'Asia/Almaty',
    }).format(new Date(value));
  }
}
