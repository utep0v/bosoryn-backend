import { mapApplicationEntity, mapVacancyEntity } from './mappers';
import { ApplicationEntity } from './entities/application.entity';
import { VacancyEntity } from './entities/vacancy.entity';

describe('data mappers', () => {
  it('maps vacancy entity to api view', () => {
    const vacancy = {
      id: '44444444-4444-4444-8444-444444444444',
      regionId: '11111111-1111-4111-8111-111111111111',
      schoolId: '22222222-2222-4222-8222-222222222222',
      subjectId: '33333333-3333-4333-8333-333333333333',
      isPedagogical: true,
      teachingLanguage: 'kz',
      graduationYear: 2025,
      status: 'open',
      createdAt: new Date('2025-05-29T12:15:00.000Z'),
      region: {
        id: '11111111-1111-4111-8111-111111111111',
        nameKz: 'Алматы қаласы',
        nameRu: 'город Алматы',
        createdAt: new Date(),
      },
      school: {
        id: '22222222-2222-4222-8222-222222222222',
        name: '№18 гимназия',
        email: 'school@example.com',
        phone: '+77070000003',
        regionId: '11111111-1111-4111-8111-111111111111',
        createdAt: new Date(),
      },
      subject: {
        id: '33333333-3333-4333-8333-333333333333',
        nameKz: 'Математика',
        nameRu: 'Математика',
        createdAt: new Date(),
      },
    } as VacancyEntity;

    const mapped = mapVacancyEntity(vacancy, 'ru');

    expect(mapped.regionName).toBe('город Алматы');
    expect(mapped.schoolPhone).toBe('+77070000003');
    expect(mapped.subjectName).toBe('Математика');
    expect(mapped.isPedagogical).toBe(true);
    expect(mapped.status).toBe('open');
  });

  it('maps application entity with notification status', () => {
    const application = {
      id: '77777777-7777-4777-8777-777777777777',
      vacancyId: '44444444-4444-4444-8444-444444444444',
      fullName: 'Тестовый Кандидат',
      phone: '+77015554433',
      attachmentOriginalName: 'portfolio.pdf',
      attachmentStoredName: 'abc.pdf',
      attachmentMimeType: 'application/pdf',
      attachmentPath: '/tmp/abc.pdf',
      createdAt: new Date('2026-02-24T18:05:00.000Z'),
      emailStatus: 'sent',
      whatsappStatus: 'pending',
      emailError: null,
      whatsappError: 'WhatsApp integration is not configured yet',
      attemptedAt: new Date('2026-02-24T18:06:00.000Z'),
      vacancy: {
        id: '44444444-4444-4444-8444-444444444444',
        regionId: '11111111-1111-4111-8111-111111111111',
        schoolId: '22222222-2222-4222-8222-222222222222',
        subjectId: '33333333-3333-4333-8333-333333333333',
        isPedagogical: true,
        teachingLanguage: 'kz',
        graduationYear: 2025,
        status: 'open',
        createdAt: new Date('2025-05-29T12:15:00.000Z'),
        region: {
          id: '11111111-1111-4111-8111-111111111111',
          nameKz: 'Алматы қаласы',
          nameRu: 'город Алматы',
          createdAt: new Date(),
        },
        school: {
          id: '22222222-2222-4222-8222-222222222222',
          name: '№18 гимназия',
          email: 'school@example.com',
          phone: '+77070000003',
          regionId: '11111111-1111-4111-8111-111111111111',
          createdAt: new Date(),
        },
        subject: {
          id: '33333333-3333-4333-8333-333333333333',
          nameKz: 'Математика',
          nameRu: 'Математика',
          createdAt: new Date(),
        },
      } as VacancyEntity,
    } as ApplicationEntity;

    const mapped = mapApplicationEntity(application, 'ru');

    expect(mapped.fullName).toBe('Тестовый Кандидат');
    expect(mapped.schoolEmail).toBe('school@example.com');
    expect(mapped.isPedagogical).toBe(true);
    expect(mapped.attachment.hasFile).toBe(true);
    expect(mapped.notificationStatus.email).toBe('sent');
    expect(mapped.notificationStatus.whatsapp).toBe('pending');
  });
});
