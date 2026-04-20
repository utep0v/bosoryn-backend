import { Injectable, NotFoundException } from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import JSZip from 'jszip';
import { ApplicationView } from '../domain/models';

interface RunReplacement {
  paragraphIndex: number;
  runIndex: number;
  value: string;
}

type TeachingLanguage = ApplicationView['teachingLanguage'];
type PreparedApplication = ApplicationView & {
  roleTextRu: string;
  addressTextRu: string;
  addressTextKz: string;
};

const TEMPLATE_REPLACEMENTS: Record<
  TeachingLanguage,
  (application: PreparedApplication) => RunReplacement[]
> = {
  ru: (application) => {
    const role = application.roleTextRu;
    const address = application.addressTextRu;

    return [
      {
        paragraphIndex: 2,
        runIndex: 3,
        value: application.fullName,
      },
      {
        paragraphIndex: 4,
        runIndex: 5,
        value: application.subjectName,
      },
      {
        paragraphIndex: 5,
        runIndex: 14,
        value: `${role}, `,
      },
      {
        paragraphIndex: 5,
        runIndex: 15,
        value: application.destinationSchoolName || application.schoolName,
      },
      {
        paragraphIndex: 7,
        runIndex: 2,
        value: 'в ',
      },
      {
        paragraphIndex: 7,
        runIndex: 3,
        value: '',
      },
      {
        paragraphIndex: 7,
        runIndex: 4,
        value: address,
      },
      {
        paragraphIndex: 7,
        runIndex: 5,
        value: '',
      },
      {
        paragraphIndex: 7,
        runIndex: 6,
        value: '',
      },
      {
        paragraphIndex: 7,
        runIndex: 7,
        value: '',
      },
      {
        paragraphIndex: 7,
        runIndex: 8,
        value: '',
      },
      {
        paragraphIndex: 7,
        runIndex: 9,
        value: '',
      },
      {
        paragraphIndex: 7,
        runIndex: 10,
        value: '',
      },
      {
        paragraphIndex: 7,
        runIndex: 11,
        value: '',
      },
      {
        paragraphIndex: 7,
        runIndex: 12,
        value: '',
      },
      {
        paragraphIndex: 16,
        runIndex: 2,
        value: application.fullName,
      },
      {
        paragraphIndex: 18,
        runIndex: 14,
        value: application.subjectName,
      },
      {
        paragraphIndex: 19,
        runIndex: 15,
        value: `${role}, `,
      },
      {
        paragraphIndex: 19,
        runIndex: 16,
        value: application.destinationSchoolName || application.schoolName,
      },
      {
        paragraphIndex: 21,
        runIndex: 2,
        value: 'в ',
      },
      {
        paragraphIndex: 21,
        runIndex: 3,
        value: '',
      },
      {
        paragraphIndex: 21,
        runIndex: 4,
        value: address,
      },
      {
        paragraphIndex: 21,
        runIndex: 5,
        value: '',
      },
      {
        paragraphIndex: 21,
        runIndex: 6,
        value: '',
      },
      {
        paragraphIndex: 21,
        runIndex: 7,
        value: '',
      },
      {
        paragraphIndex: 21,
        runIndex: 8,
        value: '',
      },
      {
        paragraphIndex: 21,
        runIndex: 9,
        value: '',
      },
      {
        paragraphIndex: 21,
        runIndex: 10,
        value: '',
      },
      {
        paragraphIndex: 21,
        runIndex: 11,
        value: '',
      },
      {
        paragraphIndex: 21,
        runIndex: 12,
        value: '',
      },
    ];
  },
  kz: (application) => {
    const schoolName = application.destinationSchoolName || application.schoolName;
    const schoolSuffix = kazakhDativeSuffix(schoolName);
    const address = application.addressTextKz;

    return [
      {
        paragraphIndex: 2,
        runIndex: 1,
        value: application.fullName,
      },
      {
        paragraphIndex: 4,
        runIndex: 3,
        value: `${application.subjectName} `,
      },
      {
        paragraphIndex: 5,
        runIndex: 15,
        value: address,
      },
      {
        paragraphIndex: 5,
        runIndex: 16,
        value: '',
      },
      {
        paragraphIndex: 5,
        runIndex: 17,
        value: '',
      },
      {
        paragraphIndex: 7,
        runIndex: 0,
        value: schoolName,
      },
      {
        paragraphIndex: 7,
        runIndex: 1,
        value: schoolSuffix,
      },
      {
        paragraphIndex: 7,
        runIndex: 2,
        value: ', ',
      },
      {
        paragraphIndex: 7,
        runIndex: 3,
        value: application.subjectName,
      },
      {
        paragraphIndex: 16,
        runIndex: 3,
        value: application.fullName,
      },
      {
        paragraphIndex: 18,
        runIndex: 1,
        value: application.subjectName,
      },
      {
        paragraphIndex: 18,
        runIndex: 2,
        value: ' ',
      },
      {
        paragraphIndex: 19,
        runIndex: 16,
        value: address,
      },
      {
        paragraphIndex: 19,
        runIndex: 17,
        value: '',
      },
      {
        paragraphIndex: 19,
        runIndex: 18,
        value: '',
      },
      {
        paragraphIndex: 19,
        runIndex: 19,
        value: '',
      },
      {
        paragraphIndex: 21,
        runIndex: 0,
        value: schoolName,
      },
      {
        paragraphIndex: 21,
        runIndex: 1,
        value: schoolSuffix,
      },
      {
        paragraphIndex: 21,
        runIndex: 2,
        value: ', ',
      },
      {
        paragraphIndex: 21,
        runIndex: 3,
        value: application.subjectName,
      },
      {
        paragraphIndex: 21,
        runIndex: 4,
        value: ' ',
      },
    ];
  },
};

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

  private async loadTemplate(teachingLanguage: TeachingLanguage) {
    const templatePath = resolve(
      process.cwd(),
      teachingLanguage === 'kz'
        ? (process.env.REFERRAL_TEMPLATE_KZ_PATH ??
            'data/templates/referral-template-kz-2026.docx')
        : (process.env.REFERRAL_TEMPLATE_RU_PATH ??
            'data/templates/referral-template-ru-2026.docx'),
    );

    return readFile(templatePath);
  }

  private fillTemplate(documentXml: string, application: ApplicationView) {
    const preparedApplication = this.prepareApplication(application);
    const replacements =
      TEMPLATE_REPLACEMENTS[application.teachingLanguage](preparedApplication);
    const paragraphMatches = Array.from(
      documentXml.matchAll(/<w:p\b(?:[\s\S]*?<\/w:p>|[^>]*\/>)/g),
    );

    let updatedDocumentXml = documentXml;
    let documentOffset = 0;
    const replacementsByParagraph = new Map<number, RunReplacement[]>();

    replacements.forEach((replacement) => {
      const paragraphReplacements =
        replacementsByParagraph.get(replacement.paragraphIndex) ?? [];
      paragraphReplacements.push(replacement);
      replacementsByParagraph.set(
        replacement.paragraphIndex,
        paragraphReplacements,
      );
    });

    for (const [paragraphIndex, paragraphReplacements] of replacementsByParagraph) {
      const paragraphMatch = paragraphMatches[paragraphIndex];

      if (!paragraphMatch || paragraphMatch.index === undefined) {
        throw new NotFoundException(
          `Referral paragraph ${paragraphIndex} was not found`,
        );
      }

      const paragraphXml = paragraphMatch[0];
      const updatedParagraphXml = this.replaceParagraphRuns(
        paragraphXml,
        paragraphReplacements,
      );
      const paragraphStart = paragraphMatch.index + documentOffset;

      updatedDocumentXml =
        updatedDocumentXml.slice(0, paragraphStart) +
        updatedParagraphXml +
        updatedDocumentXml.slice(paragraphStart + paragraphXml.length);

      documentOffset += updatedParagraphXml.length - paragraphXml.length;
    }

    return this.normalizeDocumentColor(updatedDocumentXml);
  }

  private prepareApplication(application: ApplicationView): PreparedApplication {
    return {
      ...application,
      fullName: this.limitText(application.fullName, 120),
      subjectName: this.limitText(application.subjectName, 120),
      destinationSchoolName: this.limitText(
        application.destinationSchoolName || application.schoolName,
        140,
      ),
      roleTextRu: this.limitText(
        this.createRoleTextRu(application.subjectName),
        80,
      ),
      addressTextRu: this.limitText(this.createAddressTextRu(application), 160),
      addressTextKz: this.limitText(this.createAddressTextKz(application), 160),
    };
  }

  private createRoleTextRu(subjectName: string) {
    return `учителя ${toRussianGenitive(subjectName)}`;
  }

  private createAddressTextRu(application: ApplicationView) {
    return `${application.regionName}, тел.: ${application.schoolPhone}`;
  }

  private createAddressTextKz(application: ApplicationView) {
    return `${application.regionName}, байланыс телефоны: ${application.schoolPhone}`;
  }

  private replaceParagraphRuns(
    paragraphXml: string,
    replacements: RunReplacement[],
  ) {
    const runMatches = Array.from(paragraphXml.matchAll(/<w:r\b[\s\S]*?<\/w:r>/g));
    let updatedParagraphXml = paragraphXml;
    let paragraphOffset = 0;

    replacements
      .slice()
      .sort((left, right) => left.runIndex - right.runIndex)
      .forEach((replacement) => {
        const runMatch = runMatches[replacement.runIndex];

        if (!runMatch || runMatch.index === undefined) {
          throw new NotFoundException(
            `Referral run ${replacement.runIndex} was not found in paragraph ${replacement.paragraphIndex}`,
          );
        }

        const runXml = runMatch[0];
        const updatedRunXml = this.replaceRunText(runXml, replacement.value);
        const runStart = runMatch.index + paragraphOffset;

        updatedParagraphXml =
          updatedParagraphXml.slice(0, runStart) +
          updatedRunXml +
          updatedParagraphXml.slice(runStart + runXml.length);

        paragraphOffset += updatedRunXml.length - runXml.length;
      });

    return updatedParagraphXml;
  }

  private replaceRunText(runXml: string, value: string) {
    let hasTextNode = false;
    let firstTextNode = true;

    const updatedRunXml = this.normalizeRunColor(
      runXml.replace(
      /<w:t([^>]*)>[\s\S]*?<\/w:t>/g,
      (_, attributes: string) => {
        hasTextNode = true;

        if (!firstTextNode) {
          return `<w:t${attributes}></w:t>`;
        }

        firstTextNode = false;
        return `<w:t${attributes}>${this.escapeXml(value)}</w:t>`;
      },
      ),
    );

    if (!hasTextNode) {
      throw new NotFoundException('Referral run does not contain text');
    }

    return updatedRunXml;
  }

  private normalizeRunColor(runXml: string) {
    return runXml
      .replace(/(<w:color\b[^>]*w:val=")EE0000(")/g, '$1000000$2')
      .replace(/(<w:u\b[^>]*w:color=")EE0000(")/g, '$1000000$2');
  }

  private normalizeDocumentColor(documentXml: string) {
    return documentXml
      .replace(/(<w:color\b[^>]*w:val=")EE0000(")/g, '$1000000$2')
      .replace(/(<w:u\b[^>]*w:color=")EE0000(")/g, '$1000000$2');
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
      ? `${value.slice(0, maxLength - 3).trim()}...`
      : value;
  }
}

function toRussianGenitive(subjectName: string) {
  const normalized = subjectName.trim();
  const predefined = new Map<string, string>([
    ['Английский язык', 'английского языка'],
    ['Биология', 'биологии'],
    ['География', 'географии'],
    ['Математика', 'математики'],
    ['Русский язык и литература', 'русского языка и литературы'],
  ]);

  if (predefined.has(normalized)) {
    return predefined.get(normalized) ?? normalized.toLowerCase();
  }

  if (normalized.endsWith('ия')) {
    return `${normalized.slice(0, -2).toLowerCase()}ии`;
  }

  if (normalized.endsWith('ка')) {
    return `${normalized.slice(0, -1).toLowerCase()}и`;
  }

  if (normalized.endsWith('а')) {
    return `${normalized.slice(0, -1).toLowerCase()}ы`;
  }

  if (normalized.endsWith('я')) {
    return `${normalized.slice(0, -1).toLowerCase()}и`;
  }

  return normalized.toLowerCase();
}

function kazakhDativeSuffix(value: string) {
  const normalized = value.toLowerCase();
  const lastLetterMatch = normalized.match(
    /[a-zа-яәіңғүұқөһ]+(?=[^a-zа-яәіңғүұқөһ]*$)/i,
  );
  const word = lastLetterMatch?.[0] ?? normalized;
  const lastLetter = word[word.length - 1] ?? '';
  const vowels = Array.from(word).filter((char) =>
    'аәеёиіоуүұыөэюя'.includes(char),
  );
  const lastVowel = vowels[vowels.length - 1] ?? '';
  const isFrontVowel = 'әеёиіөүэ'.includes(lastVowel);
  const isVoicelessConsonant = 'кқпстфхцчшщ'.includes(lastLetter);
  const isVowel = 'аәеёиіоуүұыөэюя'.includes(lastLetter);

  if (isVoicelessConsonant) {
    return isFrontVowel ? 'ке' : 'қа';
  }

  if (isVowel) {
    return isFrontVowel ? 'ге' : 'ға';
  }

  return isFrontVowel ? 'ге' : 'ға';
}
