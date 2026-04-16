import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegionOblysEntity } from '../data/entities/region-oblys.entity';
import { RegionEntity } from '../data/entities/region.entity';
import { SchoolEntity } from '../data/entities/school.entity';
import { VacancyEntity } from '../data/entities/vacancy.entity';
import { RegionsController } from './regions.controller';
import { RegionsService } from './regions.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RegionEntity,
      RegionOblysEntity,
      SchoolEntity,
      VacancyEntity,
    ]),
  ],
  controllers: [RegionsController],
  providers: [RegionsService],
  exports: [RegionsService],
})
export class RegionsModule {}
