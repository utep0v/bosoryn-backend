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
  isPedagogical: boolean;
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
  iin: string | null;
  attachmentOriginalName: string | null;
  attachmentStoredName: string | null;
  attachmentMimeType: string | null;
  attachmentPath: string | null;
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
  isPedagogical: boolean;
  teachingLanguage: TeachingLanguage;
  graduationYear: number;
  status: VacancyStatus;
  createdAt: string;
}

export interface ApplicationView {
  id: string;
  fullName: string;
  phone: string;
  iin: string | null;
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
  isPedagogical: boolean;
  teachingLanguage: TeachingLanguage;
  graduationYear: number;
  status: VacancyStatus;
  attachment: {
    hasFile: boolean;
    originalName: string | null;
    mimeType: string | null;
    downloadUrl: string | null;
  };
  notificationStatus: ApplicationNotificationStatus;
}

export interface CandidateApplicationView {
  id: string;
  fullName: string;
  specialty: string;
  iin: string;
  educationLevel: string;
  locationId: string | null;
  oblys: string | null;
  audan: string | null;
  locationLabel: string | null;
  createdAt: string;
}

export interface CandidateApplicationLocationView {
  id: string;
  oblys: string;
  audan: string;
  label: string;
  createdAt: string;
}
