import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { requireUuid } from '../common/validation';
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

  @Get(':id/referral-document')
  async downloadReferralDocument(
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    const file =
      await this.candidateApplicationsService.generateReferralDocument(
        requireUuid(id, 'id'),
      );

    response.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.fileName}"`,
    );
    response.send(file.buffer);
  }
}
