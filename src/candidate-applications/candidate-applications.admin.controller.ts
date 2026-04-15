import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
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
