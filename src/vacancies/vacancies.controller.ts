import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import {
  requireUuid,
  toOptionalInt,
  toOptionalText,
} from '../common/validation';
import { TeachingLanguage, VacancyStatus } from '../domain/models';
import { VacanciesService } from './vacancies.service';

@Controller('vacancies')
@UseGuards(AdminAuthGuard)
export class VacanciesController {
  constructor(private readonly vacanciesService: VacanciesService) {}

  @Get()
  list(
    @Query('regionId') regionId?: string,
    @Query('schoolId') schoolId?: string,
    @Query('subjectId') subjectId?: string,
    @Query('graduationYear') graduationYear?: string,
    @Query('status') status?: string,
  ) {
    return this.vacanciesService.list({
      regionId: toOptionalText(regionId),
      schoolId: toOptionalText(schoolId),
      subjectId: toOptionalText(subjectId),
      graduationYear: toOptionalInt(graduationYear),
      status: status as VacancyStatus | undefined,
      lang: 'ru',
    });
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.vacanciesService.findById(requireUuid(id, 'id'));
  }

  @Post()
  create(
    @Body()
    body: {
      regionId: string;
      schoolId: string;
      subjectId: string;
      isPedagogical: boolean;
      teachingLanguage: TeachingLanguage;
      graduationYear: number;
      status: VacancyStatus;
    },
  ) {
    return this.vacanciesService.create(body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: {
      regionId?: string;
      schoolId?: string;
      subjectId?: string;
      isPedagogical?: boolean;
      teachingLanguage?: TeachingLanguage;
      graduationYear?: number;
      status?: VacancyStatus;
    },
  ) {
    return this.vacanciesService.update(requireUuid(id, 'id'), body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.vacanciesService.remove(requireUuid(id, 'id'));
  }
}
