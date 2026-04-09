import {
  Controller,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
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

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.applicationsService.remove(requireUuid(id, 'id'));
  }
}
