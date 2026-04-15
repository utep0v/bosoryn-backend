import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandidateApplicationEntity } from '../data/entities/candidate-application.entity';
import { CandidateApplicationsAdminController } from './candidate-applications.admin.controller';
import { CandidateApplicationsPublicController } from './candidate-applications.public.controller';
import { CandidateApplicationsService } from './candidate-applications.service';

@Module({
  imports: [TypeOrmModule.forFeature([CandidateApplicationEntity])],
  controllers: [
    CandidateApplicationsAdminController,
    CandidateApplicationsPublicController,
  ],
  providers: [CandidateApplicationsService],
  exports: [CandidateApplicationsService],
})
export class CandidateApplicationsModule {}
