import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationEntity } from '../data/entities/application.entity';
import { RegionEntity } from '../data/entities/region.entity';
import { SchoolEntity } from '../data/entities/school.entity';
import { SubjectEntity } from '../data/entities/subject.entity';
import { VacancyEntity } from '../data/entities/vacancy.entity';
import { VacanciesController } from './vacancies.controller';
import { VacanciesPublicController } from './vacancies.public.controller';
import { VacanciesService } from './vacancies.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VacancyEntity,
      RegionEntity,
      SchoolEntity,
      SubjectEntity,
      ApplicationEntity,
    ]),
  ],
  controllers: [VacanciesController, VacanciesPublicController],
  providers: [VacanciesService],
  exports: [VacanciesService],
})
export class VacanciesModule {}
