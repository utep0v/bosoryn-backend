import { Module } from '@nestjs/common';
import { CandidateApplicationsModule } from './candidate-applications/candidate-applications.module';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { ApplicationsModule } from './applications/applications.module';
import { DataModule } from './data/data.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RegionsModule } from './regions/regions.module';
import { SchoolsModule } from './schools/schools.module';
import { SubjectsModule } from './subjects/subjects.module';
import { VacanciesModule } from './vacancies/vacancies.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    AuthModule,
    DataModule,
    CandidateApplicationsModule,
    RegionsModule,
    SchoolsModule,
    SubjectsModule,
    VacanciesModule,
    ApplicationsModule,
    DashboardModule,
    NotificationsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
