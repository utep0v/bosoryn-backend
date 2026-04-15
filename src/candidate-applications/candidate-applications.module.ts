import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandidateApplicationLocationEntity } from '../data/entities/candidate-application-location.entity';
import { CandidateApplicationEntity } from '../data/entities/candidate-application.entity';
import { CandidateApplicationsAdminController } from './candidate-applications.admin.controller';
import { CandidateApplicationsPublicController } from './candidate-applications.public.controller';
import { CandidateApplicationsService } from './candidate-applications.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CandidateApplicationEntity,
      CandidateApplicationLocationEntity,
    ]),
  ],
  controllers: [
    CandidateApplicationsAdminController,
    CandidateApplicationsPublicController,
  ],
  providers: [CandidateApplicationsService],
  exports: [CandidateApplicationsService],
})
export class CandidateApplicationsModule {}
