import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseSeederService } from './database-seeder.service';
import { ApplicationEntity } from './entities/application.entity';
import { RegionEntity } from './entities/region.entity';
import { RegionOblysEntity } from './entities/region-oblys.entity';
import { SchoolEntity } from './entities/school.entity';
import { SubjectEntity } from './entities/subject.entity';
import { VacancyEntity } from './entities/vacancy.entity';

@Global()
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        const synchronizeValue =
          configService.get<string>('DB_SYNCHRONIZE') ??
          configService.get<string>('DATABASE_SYNCHRONIZE') ??
          'true';
        const sslValue =
          configService.get<string>('DB_SSL') ??
          configService.get<string>('DATABASE_SSL') ??
          'false';

        return {
          type: 'postgres' as const,
          url: databaseUrl || undefined,
          host: databaseUrl
            ? undefined
            : (configService.get<string>('DATABASE_HOST') ??
              configService.get<string>('DB_HOST') ??
              'localhost'),
          port: databaseUrl
            ? undefined
            : Number(
                configService.get<string>('DATABASE_PORT') ??
                  configService.get<string>('DB_PORT') ??
                  5432,
              ),
          username: databaseUrl
            ? undefined
            : (configService.get<string>('DATABASE_USER') ??
              configService.get<string>('DB_USERNAME') ??
              'postgres'),
          password: databaseUrl
            ? undefined
            : (configService.get<string>('DATABASE_PASSWORD') ??
              configService.get<string>('DB_PASSWORD') ??
              undefined),
          database: databaseUrl
            ? undefined
            : (configService.get<string>('DATABASE_NAME') ??
              configService.get<string>('DB_DATABASE') ??
              'bosoryn'),
          autoLoadEntities: true,
          synchronize: synchronizeValue === 'true',
          ssl: sslValue === 'true' ? { rejectUnauthorized: false } : false,
        };
      },
    }),
    TypeOrmModule.forFeature([
      RegionEntity,
      RegionOblysEntity,
      SchoolEntity,
      SubjectEntity,
      VacancyEntity,
      ApplicationEntity,
    ]),
  ],
  providers: [DatabaseSeederService],
  exports: [TypeOrmModule],
})
export class DataModule {}
