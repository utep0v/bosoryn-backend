import {
  Application,
  Region,
  School,
  Subject,
  Vacancy,
} from '../domain/models';

interface SeedData {
  regions: Region[];
  schools: School[];
  subjects: Subject[];
  vacancies: Vacancy[];
  applications: Application[];
}

export function createSeedData(): SeedData {
  return {
    regions: [
      {
        id: '0fa8db4a-bd4c-48fb-aac7-4f8c6f9e17f7',
        nameKz: 'Абай ауданы - Абай облысы',
        nameRu: 'Абайский район - Абайская область',
        createdAt: '2025-05-29T12:08:00.000Z',
      },
      {
        id: '724d1e47-a65b-4a7f-8798-1b67cb7d2d7d',
        nameKz: 'Алматы қаласы',
        nameRu: 'город Алматы',
        createdAt: '2025-05-08T11:33:00.000Z',
      },
      {
        id: '8f4990f1-3bd0-45df-8d45-7691cf8d3751',
        nameKz: 'Ақмола облысы - Ерейментау қаласы',
        nameRu: 'Акмолинская область - город Ерейментау',
        createdAt: '2025-07-01T12:24:00.000Z',
      },
    ],
    schools: [
      {
        id: 'cdff712c-641c-4d79-a440-9d21caf68d67',
        name: 'Абай ауданы білім бөлімі',
        email: '795_032@ayagoz-roo.kz',
        phone: '+77070000001',
        regionId: '0fa8db4a-bd4c-48fb-aac7-4f8c6f9e17f7',
        createdAt: '2025-05-29T12:08:00.000Z',
      },
      {
        id: '86adf14c-19b7-4f63-b5f9-e2ec6d696cb1',
        name: '№178 мамандандырылған лицей',
        email: 'licei_178@mail.ru',
        phone: '+77070000002',
        regionId: '724d1e47-a65b-4a7f-8798-1b67cb7d2d7d',
        createdAt: '2025-05-26T17:15:00.000Z',
      },
      {
        id: 'a6168499-6e16-48bd-9e42-60e1f42bd65f',
        name: '№18 гимназия',
        email: 'gaurieva69@mail.ru',
        phone: '+77070000003',
        regionId: '724d1e47-a65b-4a7f-8798-1b67cb7d2d7d',
        createdAt: '2025-05-08T11:44:00.000Z',
      },
      {
        id: '40cfbfb7-05ea-451a-a4b5-d60cf2764fb5',
        name: 'Бөгенбай батыр атындағы мектеп-лицей',
        email: 'a.olzhas.00@gmail.com',
        phone: '+77070000004',
        regionId: '8f4990f1-3bd0-45df-8d45-7691cf8d3751',
        createdAt: '2025-07-01T12:24:00.000Z',
      },
    ],
    subjects: [
      {
        id: '9f1fb0a9-95d2-430b-a9a7-53f65f0e0a4f',
        nameKz: 'Ағылшын тілі',
        nameRu: 'Английский язык',
        createdAt: '2025-04-30T20:58:00.000Z',
      },
      {
        id: '7d12dff2-9b31-4a52-a5c6-46d563a431ec',
        nameKz: 'Биология',
        nameRu: 'Биология',
        createdAt: '2025-04-30T20:58:00.000Z',
      },
      {
        id: 'f98eb14e-984d-41c8-8453-a0de8715efab',
        nameKz: 'География',
        nameRu: 'География',
        createdAt: '2025-05-01T20:43:00.000Z',
      },
      {
        id: '1fc4b8ff-f268-4b5a-9e0b-6b4c5c9f3eb0',
        nameKz: 'Математика',
        nameRu: 'Математика',
        createdAt: '2025-05-14T17:41:00.000Z',
      },
      {
        id: '18ec86ef-3e42-4cab-9261-4f98049abfa4',
        nameKz: 'Орыс тілі мен әдебиеті',
        nameRu: 'Русский язык и литература',
        createdAt: '2025-05-14T18:03:00.000Z',
      },
    ],
    vacancies: [
      {
        id: '1fcc6cae-4f7e-4f64-bfbe-2805d86c7943',
        regionId: '0fa8db4a-bd4c-48fb-aac7-4f8c6f9e17f7',
        schoolId: 'cdff712c-641c-4d79-a440-9d21caf68d67',
        subjectId: '9f1fb0a9-95d2-430b-a9a7-53f65f0e0a4f',
        teachingLanguage: 'kz',
        graduationYear: 2026,
        status: 'open',
        createdAt: '2025-05-29T12:15:00.000Z',
      },
      {
        id: '38e2ba08-d2df-478b-bc89-c524a326598b',
        regionId: '0fa8db4a-bd4c-48fb-aac7-4f8c6f9e17f7',
        schoolId: 'cdff712c-641c-4d79-a440-9d21caf68d67',
        subjectId: '7d12dff2-9b31-4a52-a5c6-46d563a431ec',
        teachingLanguage: 'kz',
        graduationYear: 2026,
        status: 'open',
        createdAt: '2025-05-29T12:18:00.000Z',
      },
      {
        id: '9ae9f7f7-99e4-41cf-b954-192c00d0d069',
        regionId: '0fa8db4a-bd4c-48fb-aac7-4f8c6f9e17f7',
        schoolId: 'cdff712c-641c-4d79-a440-9d21caf68d67',
        subjectId: 'f98eb14e-984d-41c8-8453-a0de8715efab',
        teachingLanguage: 'kz',
        graduationYear: 2027,
        status: 'open',
        createdAt: '2025-05-29T12:20:00.000Z',
      },
      {
        id: '1f929597-7904-448b-a8ff-a27a4e63c75d',
        regionId: '724d1e47-a65b-4a7f-8798-1b67cb7d2d7d',
        schoolId: '86adf14c-19b7-4f63-b5f9-e2ec6d696cb1',
        subjectId: '7d12dff2-9b31-4a52-a5c6-46d563a431ec',
        teachingLanguage: 'kz',
        graduationYear: 2026,
        status: 'open',
        createdAt: '2025-05-26T17:18:00.000Z',
      },
      {
        id: '5e07e62a-a46f-4d18-ab77-f5d0f383ef79',
        regionId: '8f4990f1-3bd0-45df-8d45-7691cf8d3751',
        schoolId: '40cfbfb7-05ea-451a-a4b5-d60cf2764fb5',
        subjectId: '1fc4b8ff-f268-4b5a-9e0b-6b4c5c9f3eb0',
        teachingLanguage: 'kz',
        graduationYear: 2027,
        status: 'open',
        createdAt: '2025-07-01T12:25:00.000Z',
      },
    ],
    applications: [
      {
        id: '844fbc6a-7ca2-45e8-a985-f2626d50fb42',
        vacancyId: '1fcc6cae-4f7e-4f64-bfbe-2805d86c7943',
        fullName: 'Токтасын Аяжан',
        phone: '8(778)603-41-00',
        createdAt: '2026-02-24T21:20:00.000Z',
        notificationStatus: {
          email: 'sent',
          whatsapp: 'pending',
          emailError: null,
          whatsappError: null,
          attemptedAt: '2026-02-24T21:20:00.000Z',
        },
      },
      {
        id: '68c95ba1-fa9d-4ab5-b6c4-b0ac4e475649',
        vacancyId: '1f929597-7904-448b-a8ff-a27a4e63c75d',
        fullName: 'Асылай',
        phone: '8(776)847-99-31',
        createdAt: '2026-02-24T18:05:00.000Z',
        notificationStatus: {
          email: 'sent',
          whatsapp: 'pending',
          emailError: null,
          whatsappError: null,
          attemptedAt: '2026-02-24T18:05:00.000Z',
        },
      },
    ],
  };
}
