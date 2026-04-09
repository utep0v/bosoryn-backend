import JSZip from 'jszip';
import { ReferralDocumentService } from './referral-document.service';

describe('ReferralDocumentService', () => {
  it('fills the referral template with application data', async () => {
    const service = new ReferralDocumentService();

    const result = await service.generate({
      id: 'application-id',
      fullName: 'Токтасын Аяжан',
      phone: '+77015554433',
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
      teachingLanguage: 'kz',
      graduationYear: 2026,
      status: 'closed',
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
    expect(xml).toContain('Токтасын Аяжан');
    expect(xml).toContain('№18 гимназия, Математика');
    expect(xml).toContain(
      'город Алматы, тел.: +77070000003, e-mail: school@example.com',
    );
  });
});
