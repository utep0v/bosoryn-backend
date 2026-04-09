import { Body, Controller, Post } from '@nestjs/common';
import { ApplicationsService } from './applications.service';

@Controller('public/applications')
export class ApplicationsPublicController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  create(
    @Body()
    body: {
      vacancyId: string;
      fullName: string;
      phone: string;
    },
  ) {
    return this.applicationsService.createPublic(body);
  }
}
