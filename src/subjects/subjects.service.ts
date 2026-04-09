import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { requireText } from '../common/validation';
import { SubjectEntity } from '../data/entities/subject.entity';
import { VacancyEntity } from '../data/entities/vacancy.entity';

interface SaveSubjectDto {
  nameKz: string;
  nameRu: string;
}

@Injectable()
export class SubjectsService {
  constructor(
    @InjectRepository(SubjectEntity)
    private readonly subjectsRepository: Repository<SubjectEntity>,
    @InjectRepository(VacancyEntity)
    private readonly vacanciesRepository: Repository<VacancyEntity>,
  ) {}

  async list() {
    return this.subjectsRepository.find({
      order: {
        id: 'ASC',
      },
    });
  }

  async create(payload: SaveSubjectDto) {
    const subject = this.subjectsRepository.create({
      nameKz: requireText(payload.nameKz, 'nameKz'),
      nameRu: requireText(payload.nameRu, 'nameRu'),
    });

    return this.subjectsRepository.save(subject);
  }

  async update(id: string, payload: Partial<SaveSubjectDto>) {
    const subject = await this.subjectsRepository.findOneBy({ id });

    if (!subject) {
      throw new NotFoundException(`Subject ${id} was not found`);
    }

    if (payload.nameKz !== undefined) {
      subject.nameKz = requireText(payload.nameKz, 'nameKz');
    }

    if (payload.nameRu !== undefined) {
      subject.nameRu = requireText(payload.nameRu, 'nameRu');
    }

    return this.subjectsRepository.save(subject);
  }

  async remove(id: string) {
    const subject = await this.subjectsRepository.findOneBy({ id });

    if (!subject) {
      throw new NotFoundException(`Subject ${id} was not found`);
    }

    const vacanciesCount = await this.vacanciesRepository.countBy({
      subjectId: id,
    });

    if (vacanciesCount > 0) {
      throw new BadRequestException(
        'Subject cannot be removed because it is used by vacancies',
      );
    }

    await this.subjectsRepository.remove(subject);
    return subject;
  }
}
