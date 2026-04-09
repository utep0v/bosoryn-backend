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
import { SubjectsService } from './subjects.service';

@Controller('subjects')
@UseGuards(AdminAuthGuard)
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get()
  list() {
    return this.subjectsService.list();
  }

  @Post()
  create(@Body() body: { nameKz: string; nameRu: string }) {
    return this.subjectsService.create(body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: { nameKz?: string; nameRu?: string },
  ) {
    return this.subjectsService.update(requireUuid(id, 'id'), body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subjectsService.remove(requireUuid(id, 'id'));
  }
}
