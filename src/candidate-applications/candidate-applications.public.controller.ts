import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { requireUuid, toOptionalText } from '../common/validation';
import { CandidateApplicationsService } from './candidate-applications.service';

@Controller('public/candidate-applications')
export class CandidateApplicationsPublicController {
  constructor(
    private readonly candidateApplicationsService: CandidateApplicationsService,
  ) {}

  @Get('locations')
  listLocations(@Query('oblysId') oblysId?: string) {
    return this.candidateApplicationsService.getPublicLocationOptions(
      toOptionalText(oblysId),
    );
  }

  @Get('specialties')
  listSpecialties() {
    return this.candidateApplicationsService.getPublicSpecialtyOptions();
  }

  @Post()
  create(
    @Body()
    body: {
      fullName: string;
      specialty?: string;
      specialtyId?: string;
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
    @Query('lang') lang: string | undefined,
    @Res() response: Response,
  ) {
    const file =
      await this.candidateApplicationsService.generateReferralDocument(
        requireUuid(id, 'id'),
        toOptionalText(lang),
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
