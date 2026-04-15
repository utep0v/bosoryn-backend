import { Injectable, NotFoundException } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import JSZip from 'jszip';
import { ApplicationView } from '../domain/models';

const UNDERSCORE_OCCURRENCES = {
  topFullName: 0,
  topSpecialty: 1,
  topAddress: 2,
  bottomFullName: 4,
  bottomSpecialty: 5,
  bottomAddress: 6,
} as const;

@Injectable()
export class ReferralDocumentService {
  async generate(application: ApplicationView) {
    const templateBuffer = await this.loadTemplate(application.teachingLanguage);
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

  private async loadTemplate(teachingLanguage: ApplicationView['teachingLanguage']) {
    const templatePath = resolve(
      process.cwd(),
      teachingLanguage === 'kz'
        ? process.env.REFERRAL_TEMPLATE_KZ_PATH ??
            'data/templates/referral-template-kz-2026.docx'
        : process.env.REFERRAL_TEMPLATE_RU_PATH ??
            'data/templates/referral-template-ru-2026.docx',
    );

    return readFile(templatePath);
  }

  private fillTemplate(documentXml: string, application: ApplicationView) {
    const specialty = this.limitText(application.subjectName, 70);
    const addressContact = this.limitText(
      `${application.regionName}, тел.: ${application.schoolPhone}, e-mail: ${application.schoolEmail}`,
      130,
    );

    const replacements = new Map<number, string>([
      [UNDERSCORE_OCCURRENCES.topFullName, application.fullName],
      [UNDERSCORE_OCCURRENCES.topSpecialty, specialty],
      [UNDERSCORE_OCCURRENCES.topAddress, addressContact],
      [UNDERSCORE_OCCURRENCES.bottomFullName, application.fullName],
      [UNDERSCORE_OCCURRENCES.bottomSpecialty, specialty],
      [UNDERSCORE_OCCURRENCES.bottomAddress, addressContact],
    ]);

    let underscoreIndex = -1;

    return documentXml.replace(
      /(<w:t[^>]*>)([^<]*_[^<]*)(<\/w:t>)/g,
      (_, openTag: string, textContent: string, closeTag: string) => {
        underscoreIndex += 1;

        if (!replacements.has(underscoreIndex)) {
          return `${openTag}${textContent}${closeTag}`;
        }

        return `${openTag}${this.replaceUnderscorePlaceholder(textContent, replacements.get(underscoreIndex) ?? '')}${closeTag}`;
      },
    );
  }

  private replaceUnderscorePlaceholder(textContent: string, value: string) {
    const escapedValue = this.escapeXml(value);
    let replaced = false;

    return textContent.replace(/_+/g, (match) => {
      if (replaced) {
        return match;
      }

      replaced = true;
      return escapedValue;
    });
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
