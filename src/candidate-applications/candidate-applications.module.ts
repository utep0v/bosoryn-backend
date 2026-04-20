import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CandidateApplicationLocationEntity } from '../data/entities/candidate-application-location.entity';
import { CandidateApplicationEntity } from '../data/entities/candidate-application.entity';
import { RegionOblysEntity } from '../data/entities/region-oblys.entity';
import { SubjectEntity } from '../data/entities/subject.entity';
import { CandidateApplicationsAdminController } from './candidate-applications.admin.controller';
import { CandidateReferralDocumentService } from './candidate-referral-document.service';
import { CandidateApplicationsPublicController } from './candidate-applications.public.controller';
import { CandidateApplicationsService } from './candidate-applications.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CandidateApplicationEntity,
      CandidateApplicationLocationEntity,
      RegionOblysEntity,
      SubjectEntity,
    ]),
  ],
  controllers: [
    CandidateApplicationsAdminController,
    CandidateApplicationsPublicController,
  ],
  providers: [CandidateApplicationsService, CandidateReferralDocumentService],
  exports: [CandidateApplicationsService],
})
export class CandidateApplicationsModule {}
