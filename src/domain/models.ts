export type TeachingLanguage = 'kz' | 'ru';
export type VacancyStatus = 'open' | 'closed';
export type DeliveryStatus = 'pending' | 'sent' | 'failed' | 'skipped';

export interface Region {
  id: string;
  nameKz: string;
  nameRu: string;
  createdAt: string;
}

export interface School {
  id: string;
  name: string;
  email: string;
  phone: string;
  regionId: string;
  createdAt: string;
}

export interface Subject {
  id: string;
  nameKz: string;
  nameRu: string;
  createdAt: string;
}

export interface Vacancy {
  id: string;
  regionId: string;
  schoolId: string;
  subjectId: string;
  teachingLanguage: TeachingLanguage;
  graduationYear: number;
  status: VacancyStatus;
  createdAt: string;
}

export interface ApplicationNotificationStatus {
  email: DeliveryStatus;
  whatsapp: DeliveryStatus;
  emailError: string | null;
  whatsappError: string | null;
  attemptedAt: string | null;
}

export interface Application {
  id: string;
  vacancyId: string;
  fullName: string;
  phone: string;
  createdAt: string;
  notificationStatus: ApplicationNotificationStatus;
}

export interface VacancyView {
  id: string;
  regionId: string;
  regionName: string;
  schoolId: string;
  schoolName: string;
  schoolEmail: string;
  schoolPhone: string;
  subjectId: string;
  subjectName: string;
  teachingLanguage: TeachingLanguage;
  graduationYear: number;
  status: VacancyStatus;
  createdAt: string;
}

export interface ApplicationView {
  id: string;
  fullName: string;
  phone: string;
  createdAt: string;
  vacancyId: string;
  regionId: string;
  regionName: string;
  schoolId: string;
  schoolName: string;
  schoolEmail: string;
  schoolPhone: string;
  subjectId: string;
  subjectName: string;
  teachingLanguage: TeachingLanguage;
  graduationYear: number;
  status: VacancyStatus;
  notificationStatus: ApplicationNotificationStatus;
}
