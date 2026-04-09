import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApplicationEntity } from '../data/entities/application.entity';
import { VacancyEntity } from '../data/entities/vacancy.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { ApplicationsAdminController } from './applications.admin.controller';
import { ApplicationsPublicController } from './applications.public.controller';
import { ApplicationsService } from './applications.service';

@Module({
  imports: [
    NotificationsModule,
    TypeOrmModule.forFeature([ApplicationEntity, VacancyEntity]),
  ],
  controllers: [ApplicationsAdminController, ApplicationsPublicController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
