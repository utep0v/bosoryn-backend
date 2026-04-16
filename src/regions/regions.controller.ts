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
import { RegionItemType } from '../domain/models';
import { RegionsService } from './regions.service';

@Controller('regions')
@UseGuards(AdminAuthGuard)
export class RegionsController {
  constructor(private readonly regionsService: RegionsService) {}

  @Get()
  list() {
    return this.regionsService.list();
  }

  @Get('oblyses')
  listOblyses() {
    return this.regionsService.listOblyses();
  }

  @Post('oblyses')
  createOblys(@Body() body: { nameKz: string; nameRu: string }) {
    return this.regionsService.createOblys(body);
  }

  @Patch('oblyses/:id')
  updateOblys(
    @Param('id') id: string,
    @Body() body: { nameKz?: string; nameRu?: string },
  ) {
    return this.regionsService.updateOblys(requireUuid(id, 'id'), body);
  }

  @Delete('oblyses/:id')
  removeOblys(@Param('id') id: string) {
    return this.regionsService.removeOblys(requireUuid(id, 'id'));
  }

  @Post()
  create(
    @Body()
    body: {
      oblysId: string;
      nameKz: string;
      nameRu: string;
      type: RegionItemType;
    },
  ) {
    return this.regionsService.create(body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body()
    body: {
      oblysId?: string;
      nameKz?: string;
      nameRu?: string;
      type?: RegionItemType;
    },
  ) {
    return this.regionsService.update(requireUuid(id, 'id'), body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.regionsService.remove(requireUuid(id, 'id'));
  }
}
