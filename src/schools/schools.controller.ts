import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { requireUuid, toOptionalText } from '../common/validation';
import { SchoolsService } from './schools.service';

@Controller('schools')
@UseGuards(AdminAuthGuard)
export class SchoolsController {
  constructor(private readonly schoolsService: SchoolsService) {}

  @Get()
  list(@Query('regionId') regionId?: string) {
    return this.schoolsService.list(toOptionalText(regionId));
  }

  @Post()
  create(
    @Body()
    body: {
      name: string;
      email: string;
      phone: string;
      regionId: string;
    },
  ) {
    return this.schoolsService.create(body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      email?: string;
      phone?: string;
      regionId?: string;
    },
  ) {
    return this.schoolsService.update(requireUuid(id, 'id'), body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.schoolsService.remove(requireUuid(id, 'id'));
  }
}
