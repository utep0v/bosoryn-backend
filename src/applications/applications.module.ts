import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationEntity } from '../data/entities/application.entity';
import { VacancyEntity } from '../data/entities/vacancy.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { ApplicationsAdminController } from './applications.admin.controller';
import { ApplicationsPublicController } from './applications.public.controller';
import { ApplicationUploadService } from './application-upload.service';
import { ApplicationsService } from './applications.service';
import { ReferralDocumentService } from './referral-document.service';

@Module({
  imports: [
    NotificationsModule,
    TypeOrmModule.forFeature([ApplicationEntity, VacancyEntity]),
  ],
  controllers: [ApplicationsAdminController, ApplicationsPublicController],
  providers: [
    ApplicationsService,
    ReferralDocumentService,
    ApplicationUploadService,
  ],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
