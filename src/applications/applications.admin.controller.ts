import {
  Controller,
  Delete,
  Get,
  Param,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import {
  requireUuid,
  toOptionalInt,
  toOptionalText,
} from '../common/validation';
import { ApplicationsService } from './applications.service';

@Controller('applications')
@UseGuards(AdminAuthGuard)
export class ApplicationsAdminController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get()
  list(
    @Query('regionId') regionId?: string,
    @Query('schoolId') schoolId?: string,
    @Query('graduationYear') graduationYear?: string,
  ) {
    return this.applicationsService.list({
      regionId: toOptionalText(regionId),
      schoolId: toOptionalText(schoolId),
      graduationYear: toOptionalInt(graduationYear),
    });
  }

  @Get('export')
  async export(
    @Query('regionId') regionId: string | undefined,
    @Query('schoolId') schoolId: string | undefined,
    @Query('graduationYear') graduationYear: string | undefined,
    @Res() response: Response,
  ) {
    const file = await this.applicationsService.exportToExcel({
      regionId: toOptionalText(regionId),
      schoolId: toOptionalText(schoolId),
      graduationYear: toOptionalInt(graduationYear),
    });
    const timestamp = new Date().toISOString().slice(0, 10);

    response.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="applications-${timestamp}.xlsx"`,
    );
    response.send(Buffer.from(file));
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.applicationsService.remove(requireUuid(id, 'id'));
  }

  @Get(':id/referral-document')
  async downloadReferralDocument(
    @Param('id') id: string,
    @Res() response: Response,
  ) {
    const file = await this.applicationsService.generateReferralDocument(
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

  @Get(':id/attachment')
  async downloadAttachment(@Param('id') id: string, @Res() response: Response) {
    const file = await this.applicationsService.getAttachment(
      requireUuid(id, 'id'),
    );

    response.setHeader('Content-Type', file.mimeType);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.fileName.replace(/[^a-zA-Z0-9._-]+/g, '_')}"`,
    );
    response.send(file.buffer);
  }
}
