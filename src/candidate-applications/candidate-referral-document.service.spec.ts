import JSZip from 'jszip';
import { CandidateReferralDocumentService } from './candidate-referral-document.service';

describe('CandidateReferralDocumentService', () => {
  it('fills the russian candidate referral template with application data', async () => {
    const service = new CandidateReferralDocumentService();

    const result = await service.generate(
      {
        id: 'candidate-application-id',
        fullName: 'Токтасын Аяжан',
        specialty: '7M01501 - Математика',
        iin: '030101500111',
        educationLevel: 'Высшее',
        locationId: 'location-id',
        oblys: 'город Астана',
        locationName: 'Есильский район',
        locationType: 'district',
        locationLabel: 'город Астана, Есильский район',
        referralDocumentUrl:
          '/candidate-applications/candidate-application-id/referral-document',
        createdAt: new Date().toISOString(),
      },
      'ru',
    );

    const zip = await JSZip.loadAsync(result.buffer);
    const xml = await zip.file('word/document.xml')?.async('string');

    expect(result.fileName).toBe('candidate-referral-candidate-application-id.docx');
    expect(xml).toContain('Токтасын Аяжан');
    expect(xml).toContain('7M01501 - Математика');
    expect(xml).toContain('город Астана, Есильский район');
    expect(xml).not.toContain('Серикова');
    expect(xml).not.toContain('город Алматы, Медеуский район');
    expect(xml).not.toContain('EE0000');
  });

  it('fills the kazakh candidate referral template with application data', async () => {
    const service = new CandidateReferralDocumentService();

    const result = await service.generate(
      {
        id: 'candidate-application-kz-id',
        fullName: 'Тоқтасын Аяжан',
        specialty: '7M01501 - Математика',
        iin: '030101500111',
        educationLevel: 'Жоғары',
        locationId: 'location-id',
        oblys: 'Астана қаласы',
        locationName: 'Есіл ауданы',
        locationType: 'district',
        locationLabel: 'Астана қаласы, Есіл ауданы',
        referralDocumentUrl:
          '/candidate-applications/candidate-application-kz-id/referral-document',
        createdAt: new Date().toISOString(),
      },
      'kz',
    );

    const zip = await JSZip.loadAsync(result.buffer);
    const xml = await zip.file('word/document.xml')?.async('string');

    expect(result.fileName).toBe(
      'candidate-referral-candidate-application-kz-id-kz.docx',
    );
    expect(xml).toContain('Тоқтасын Аяжан');
    expect(xml).toContain('7M01501 - Математика');
    expect(xml).toContain('Астана қаласы, Есіл ауданы');
    expect(xml).not.toContain('Серикова');
    expect(xml).not.toContain('Алматы қаласы, Медеу ауданыңда');
    expect(xml).not.toContain('EE0000');
  });
});
