import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { requireUuid, toOptionalText } from '../common/validation';
import { CandidateApplicationsService } from './candidate-applications.service';

@Controller('candidate-applications')
@UseGuards(AdminAuthGuard)
export class CandidateApplicationsAdminController {
  constructor(
    private readonly candidateApplicationsService: CandidateApplicationsService,
  ) {}

  @Get()
  list() {
    return this.candidateApplicationsService.list();
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.candidateApplicationsService.remove(requireUuid(id, 'id'));
  }

  @Get('locations')
  listLocations(@Query('oblysId') oblysId?: string) {
    return this.candidateApplicationsService.listLocations(
      toOptionalText(oblysId),
    );
  }

  @Post('locations')
  createLocation(
    @Body()
    body: {
      oblysId: string;
      name?: string;
      nameKz?: string;
      nameRu?: string;
      type: 'district' | 'city';
    },
  ) {
    return this.candidateApplicationsService.createLocation(body);
  }

  @Patch('locations/:id')
  updateLocation(
    @Param('id') id: string,
    @Body()
    body: {
      oblysId?: string;
      name?: string;
      nameKz?: string;
      nameRu?: string;
      type?: 'district' | 'city';
    },
  ) {
    return this.candidateApplicationsService.updateLocation(
      requireUuid(id, 'id'),
      body,
    );
  }

  @Delete('locations/:id')
  removeLocation(@Param('id') id: string) {
    return this.candidateApplicationsService.removeLocation(
      requireUuid(id, 'id'),
    );
  }

  @Get('export')
  async export(@Res() response: Response) {
    const file = await this.candidateApplicationsService.exportToExcel();
    const timestamp = new Date().toISOString().slice(0, 10);

    response.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="candidate-applications-${timestamp}.xlsx"`,
    );
    response.send(Buffer.from(file));
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
