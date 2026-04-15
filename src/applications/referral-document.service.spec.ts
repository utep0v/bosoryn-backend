import JSZip from 'jszip';
import { ReferralDocumentService } from './referral-document.service';

describe('ReferralDocumentService', () => {
  it('fills the russian referral template for russian vacancies', async () => {
    const service = new ReferralDocumentService();

    const result = await service.generate({
      id: 'application-id',
      fullName: 'Токтасын Аяжан',
      phone: '+77015554433',
      iin: '030101500111',
      createdAt: new Date().toISOString(),
      vacancyId: 'vacancy-id',
      regionId: 'region-id',
      regionName: 'город Алматы',
      schoolId: 'school-id',
      schoolName: '№18 гимназия',
      schoolEmail: 'school@example.com',
      schoolPhone: '+77070000003',
      subjectId: 'subject-id',
      subjectName: 'Математика',
      teachingLanguage: 'ru',
      graduationYear: 2026,
      status: 'closed',
      attachment: {
        hasFile: false,
        originalName: null,
        mimeType: null,
        downloadUrl: null,
      },
      notificationStatus: {
        email: 'sent',
        whatsapp: 'skipped',
        emailError: null,
        whatsappError: null,
        attemptedAt: null,
      },
    });

    const zip = await JSZip.loadAsync(result.buffer);
    const xml = await zip.file('word/document.xml')?.async('string');

    expect(result.fileName).toBe('referral-application-id.docx');
    expect(xml).toContain('Направление в центр занятости');
    expect(xml).toContain('Токтасын Аяжан');
    expect(xml).toContain('Математика');
    expect(xml).toContain(
      'город Алматы, тел.: +77070000003, e-mail: school@example.com',
    );
  });

  it('fills the kazakh referral template for kazakh vacancies', async () => {
    const service = new ReferralDocumentService();

    const result = await service.generate({
      id: 'application-kz-id',
      fullName: 'Тоқтасын Аяжан',
      phone: '+77015554433',
      iin: '030101500111',
      createdAt: new Date().toISOString(),
      vacancyId: 'vacancy-id',
      regionId: 'region-id',
      regionName: 'Алматы қаласы',
      schoolId: 'school-id',
      schoolName: '№18 гимназия',
      schoolEmail: 'school@example.com',
      schoolPhone: '+77070000003',
      subjectId: 'subject-id',
      subjectName: 'Математика',
      teachingLanguage: 'kz',
      graduationYear: 2026,
      status: 'closed',
      attachment: {
        hasFile: false,
        originalName: null,
        mimeType: null,
        downloadUrl: null,
      },
      notificationStatus: {
        email: 'sent',
        whatsapp: 'skipped',
        emailError: null,
        whatsappError: null,
        attemptedAt: null,
      },
    });

    const zip = await JSZip.loadAsync(result.buffer);
    const xml = await zip.file('word/document.xml')?.async('string');

    expect(result.fileName).toBe('referral-application-kz-id.docx');
    expect(xml).toContain('Жұмыспен қамту орталығына жолдама');
    expect(xml).toContain('Тоқтасын Аяжан');
    expect(xml).toContain('Математика');
    expect(xml).toContain(
      'Алматы қаласы, тел.: +77070000003, e-mail: school@example.com',
    );
  });
});
