import { Controller, Get, Query } from '@nestjs/common';
import { VacanciesService } from './vacancies.service';

@Controller('public/vacancies')
export class VacanciesPublicController {
  constructor(private readonly vacanciesService: VacanciesService) {}

  @Get()
  list(@Query() query: Record<string, string>) {
    return this.vacanciesService.listPublic(query);
  }

  @Get('filters')
  getFilters(@Query('lang') lang?: string) {
    return this.vacanciesService.getPublicFilters(lang === 'kz' ? 'kz' : 'ru');
  }
}
