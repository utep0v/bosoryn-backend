import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { UploadedApplicationFile } from './application-upload.service';
import { ApplicationsService } from './applications.service';

@Controller('public/applications')
export class ApplicationsPublicController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('attachment'))
  create(
    @Body()
    body: {
      vacancyId: string;
      fullName: string;
      phone: string;
      iin: string;
    },
    @UploadedFile() file?: UploadedApplicationFile,
  ) {
    return this.applicationsService.createPublic(body, file);
  }
}
