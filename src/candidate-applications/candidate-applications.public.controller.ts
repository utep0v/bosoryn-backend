import { Body, Controller, Get, Post } from '@nestjs/common';
import { CandidateApplicationsService } from './candidate-applications.service';

@Controller('public/candidate-applications')
export class CandidateApplicationsPublicController {
  constructor(
    private readonly candidateApplicationsService: CandidateApplicationsService,
  ) {}

  @Get('locations')
  listLocations() {
    return this.candidateApplicationsService.getPublicLocationOptions();
  }

  @Post()
  create(
    @Body()
    body: {
      fullName: string;
      specialty: string;
      iin: string;
      educationLevel: string;
      locationId: string;
    },
  ) {
    return this.candidateApplicationsService.createPublic(body);
  }
}
