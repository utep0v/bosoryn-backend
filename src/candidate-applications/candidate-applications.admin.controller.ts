import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { requireUuid } from '../common/validation';
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

  @Get('locations')
  listLocations() {
    return this.candidateApplicationsService.listLocations();
  }

  @Post('locations')
  createLocation(
    @Body()
    body: {
      oblys: string;
      audan: string;
    },
  ) {
    return this.candidateApplicationsService.createLocation(body);
  }

  @Patch('locations/:id')
  updateLocation(
    @Param('id') id: string,
    @Body()
    body: {
      oblys?: string;
      audan?: string;
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
}
