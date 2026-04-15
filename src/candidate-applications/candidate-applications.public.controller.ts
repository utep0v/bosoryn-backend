import { Body, Controller, Post } from '@nestjs/common';
import { CandidateApplicationsService } from './candidate-applications.service';

@Controller('public/candidate-applications')
export class CandidateApplicationsPublicController {
  constructor(
    private readonly candidateApplicationsService: CandidateApplicationsService,
  ) {}

  @Post()
  create(
    @Body()
    body: {
      fullName: string;
      specialty: string;
      iin: string;
      educationLevel: string;
    },
  ) {
    return this.candidateApplicationsService.createPublic(body);
  }
}
