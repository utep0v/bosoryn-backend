import { Injectable, NotFoundException } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import JSZip from 'jszip';
import { ApplicationView } from '../domain/models';

const UNDERSCORE_OCCURRENCES = {
  topFullName: 0,
  topSpecialtyA: 1,
  topSpecialtyB: 2,
  topOrganizationA: 3,
  topOrganizationB: 4,
  topAddressA: 5,
  topAddressB: 6,
  topAddressC: 7,
  topAddressD: 8,
  topAddressE: 9,
  bottomFullName: 12,
  bottomSpecialtyA: 13,
  bottomSpecialtyB: 14,
  bottomSpecialtyC: 15,
  bottomOrganizationA: 16,
  bottomOrganizationB: 17,
  bottomAddressA: 18,
  bottomAddressB: 19,
  bottomAddressC: 20,
} as const;

@Injectable()
export class ReferralDocumentService {
  async generate(application: ApplicationView) {
    const templateBuffer = await this.loadTemplate();
    const zip = await JSZip.loadAsync(templateBuffer);
    const documentXmlFile = zip.file('word/document.xml');

    if (!documentXmlFile) {
      throw new NotFoundException('Referral template is invalid');
    }

    const documentXml = await documentXmlFile.async('string');
    const filledXml = this.fillTemplate(documentXml, application);

    zip.file('word/document.xml', filledXml);

    const buffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    return {
      fileName: this.createFileName(application.id),
      buffer,
    };
  }

  private async loadTemplate() {
    const templatePath = resolve(
      process.cwd(),
      process.env.REFERRAL_TEMPLATE_RU_PATH ??
        'data/templates/referral-template-ru.docx',
    );

    return readFile(templatePath);
  }

  private fillTemplate(documentXml: string, application: ApplicationView) {
    const specialty = this.limitText(application.subjectName, 70);
    const organizationAndPosition = this.limitText(
      `${application.schoolName}, ${application.subjectName}`,
      110,
    );
    const addressContact = this.limitText(
      `${application.regionName}, тел.: ${application.schoolPhone}, e-mail: ${application.schoolEmail}`,
      130,
    );

    const replacements = new Map<number, string>([
      [UNDERSCORE_OCCURRENCES.topFullName, application.fullName],
      [UNDERSCORE_OCCURRENCES.topSpecialtyA, specialty],
      [UNDERSCORE_OCCURRENCES.topSpecialtyB, ''],
      [UNDERSCORE_OCCURRENCES.topOrganizationA, organizationAndPosition],
      [UNDERSCORE_OCCURRENCES.topOrganizationB, ''],
      [UNDERSCORE_OCCURRENCES.topAddressA, addressContact],
      [UNDERSCORE_OCCURRENCES.topAddressB, ''],
      [UNDERSCORE_OCCURRENCES.topAddressC, ''],
      [UNDERSCORE_OCCURRENCES.topAddressD, ''],
      [UNDERSCORE_OCCURRENCES.topAddressE, ''],
      [UNDERSCORE_OCCURRENCES.bottomFullName, application.fullName],
      [UNDERSCORE_OCCURRENCES.bottomSpecialtyA, specialty],
      [UNDERSCORE_OCCURRENCES.bottomSpecialtyB, ''],
      [UNDERSCORE_OCCURRENCES.bottomSpecialtyC, ''],
      [UNDERSCORE_OCCURRENCES.bottomOrganizationA, organizationAndPosition],
      [UNDERSCORE_OCCURRENCES.bottomOrganizationB, ''],
      [UNDERSCORE_OCCURRENCES.bottomAddressA, addressContact],
      [UNDERSCORE_OCCURRENCES.bottomAddressB, ''],
      [UNDERSCORE_OCCURRENCES.bottomAddressC, ''],
    ]);

    let underscoreIndex = -1;

    return documentXml.replace(
      /(<w:t[^>]*>)([^<]*_[^<]*)(<\/w:t>)/g,
      (_, openTag: string, textContent: string, closeTag: string) => {
        underscoreIndex += 1;

        if (!replacements.has(underscoreIndex)) {
          return `${openTag}${textContent}${closeTag}`;
        }

        return `${openTag}${this.escapeXml(replacements.get(underscoreIndex) ?? '')}${closeTag}`;
      },
    );
  }

  private escapeXml(value: string) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  private createFileName(applicationId: string) {
    const safeId = applicationId.replace(/[^a-z0-9-]+/gi, '').toLowerCase();
    return `referral-${safeId}.docx`;
  }

  private limitText(value: string, maxLength: number) {
    return value.length > maxLength
      ? `${value.slice(0, maxLength - 1).trim()}…`
      : value;
  }
}
