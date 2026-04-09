import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminAuthGuard } from '../auth/admin-auth.guard';
import { requireUuid } from '../common/validation';
import { RegionsService } from './regions.service';

@Controller('regions')
@UseGuards(AdminAuthGuard)
export class RegionsController {
  constructor(private readonly regionsService: RegionsService) {}

  @Get()
  list() {
    return this.regionsService.list();
  }

  @Post()
  create(@Body() body: { nameKz: string; nameRu: string }) {
    return this.regionsService.create(body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: { nameKz?: string; nameRu?: string },
  ) {
    return this.regionsService.update(requireUuid(id, 'id'), body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.regionsService.remove(requireUuid(id, 'id'));
  }
}
