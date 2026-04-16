export type TeachingLanguage = 'kz' | 'ru';
export type VacancyStatus = 'open' | 'closed';
export type DeliveryStatus = 'pending' | 'sent' | 'failed' | 'skipped';
export type RegionItemType = 'district' | 'city';

export interface RegionOblys {
  id: string;
  nameKz: string;
  nameRu: string;
  createdAt: string;
}

export interface Region {
  id: string;
  oblysId: string | null;
  oblysNameKz: string | null;
  oblysNameRu: string | null;
  nameKz: string;
  nameRu: string;
  type: RegionItemType | null;
  labelKz: string;
  labelRu: string;
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
  destinationSchoolName: string;
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
  locationName: string | null;
  locationType: RegionItemType | null;
  locationLabel: string | null;
  referralDocumentUrl: string;
  createdAt: string;
}

export interface CandidateApplicationLocationView {
  id: string;
  oblysId: string | null;
  oblys: string | null;
  name: string;
  type: RegionItemType;
  label: string;
  createdAt: string;
}
