import { ApplicationView, VacancyView } from '../domain/models';
import { ApplicationEntity } from './entities/application.entity';
import { RegionEntity } from './entities/region.entity';
import { SubjectEntity } from './entities/subject.entity';
import { VacancyEntity } from './entities/vacancy.entity';

type SupportedLanguage = 'kz' | 'ru';

function regionName(region: RegionEntity, lang: SupportedLanguage) {
  return lang === 'ru' ? region.nameRu : region.nameKz;
}

function subjectName(subject: SubjectEntity, lang: SupportedLanguage) {
  return lang === 'ru' ? subject.nameRu : subject.nameKz;
}

function assertVacancyRelations(vacancy: VacancyEntity) {
  if (!vacancy.region || !vacancy.school || !vacancy.subject) {
    throw new Error(
      `Vacancy ${vacancy.id} was loaded without required relations`,
    );
  }
}

export function mapVacancyEntity(
  vacancy: VacancyEntity,
  lang: SupportedLanguage = 'ru',
): VacancyView {
  assertVacancyRelations(vacancy);

  return {
    id: vacancy.id,
    regionId: vacancy.regionId,
    regionName: regionName(vacancy.region, lang),
    schoolId: vacancy.schoolId,
    schoolName: vacancy.school.name,
    schoolEmail: vacancy.school.email,
    schoolPhone: vacancy.school.phone,
    subjectId: vacancy.subjectId,
    subjectName: subjectName(vacancy.subject, lang),
    isPedagogical: vacancy.isPedagogical,
    teachingLanguage: vacancy.teachingLanguage as 'kz' | 'ru',
    graduationYear: vacancy.graduationYear,
    status: vacancy.status as 'open' | 'closed',
    createdAt: vacancy.createdAt.toISOString(),
  };
}

function assertApplicationRelations(application: ApplicationEntity) {
  if (!application.vacancy) {
    throw new Error(
      `Application ${application.id} was loaded without vacancy relation`,
    );
  }

  assertVacancyRelations(application.vacancy);
}

export function mapApplicationEntity(
  application: ApplicationEntity,
  lang: SupportedLanguage = 'ru',
): ApplicationView {
  assertApplicationRelations(application);
  const vacancyView = mapVacancyEntity(application.vacancy, lang);

  return {
    id: application.id,
    fullName: application.fullName,
    phone: application.phone,
    iin: application.iin,
    createdAt: application.createdAt.toISOString(),
    vacancyId: application.vacancyId,
    regionId: vacancyView.regionId,
    regionName: vacancyView.regionName,
    schoolId: vacancyView.schoolId,
    schoolName: vacancyView.schoolName,
    schoolEmail: vacancyView.schoolEmail,
    schoolPhone: vacancyView.schoolPhone,
    subjectId: vacancyView.subjectId,
    subjectName: vacancyView.subjectName,
    isPedagogical: vacancyView.isPedagogical,
    teachingLanguage: vacancyView.teachingLanguage,
    graduationYear: vacancyView.graduationYear,
    status: vacancyView.status,
    attachment: {
      hasFile: Boolean(application.attachmentStoredName),
      originalName: application.attachmentOriginalName,
      mimeType: application.attachmentMimeType,
      downloadUrl: application.attachmentStoredName
        ? `/applications/${application.id}/attachment`
        : null,
    },
    notificationStatus: {
      email: application.emailStatus as
        | 'pending'
        | 'sent'
        | 'failed'
        | 'skipped',
      whatsapp: application.whatsappStatus as
        | 'pending'
        | 'sent'
        | 'failed'
        | 'skipped',
      emailError: application.emailError,
      whatsappError: application.whatsappError,
      attemptedAt: application.attemptedAt?.toISOString() ?? null,
    },
  };
}
