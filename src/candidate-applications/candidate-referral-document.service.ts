import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import JSZip from 'jszip';
import { CandidateApplicationView } from '../domain/models';

type CandidateReferralLanguage = 'ru' | 'kz';

interface RunReplacement {
  paragraphIndex: number;
  runIndex: number;
  value: string;
}

const TEMPLATE_REPLACEMENTS: Record<
  CandidateReferralLanguage,
  (application: CandidateApplicationView) => RunReplacement[]
> = {
  ru: (application) => [
    {
      paragraphIndex: 1,
      runIndex: 2,
      value: application.fullName,
    },
    {
      paragraphIndex: 1,
      runIndex: 3,
      value: '',
    },
    {
      paragraphIndex: 1,
      runIndex: 5,
      value: application.specialty,
    },
    {
      paragraphIndex: 2,
      runIndex: 2,
      value: application.locationLabel ?? '',
    },
    {
      paragraphIndex: 7,
      runIndex: 2,
      value: application.fullName,
    },
    {
      paragraphIndex: 7,
      runIndex: 7,
      value: application.specialty,
    },
    {
      paragraphIndex: 7,
      runIndex: 10,
      value: application.locationLabel ?? '',
    },
  ],
  kz: (application) => [
    {
      paragraphIndex: 2,
      runIndex: 11,
      value: application.fullName,
    },
    {
      paragraphIndex: 2,
      runIndex: 15,
      value: application.specialty,
    },
    {
      paragraphIndex: 3,
      runIndex: 10,
      value: application.locationLabel ?? '',
    },
    {
      paragraphIndex: 14,
      runIndex: 1,
      value: application.fullName,
    },
    {
      paragraphIndex: 14,
      runIndex: 4,
      value: application.specialty,
    },
    {
      paragraphIndex: 14,
      runIndex: 19,
      value: application.locationLabel ?? '',
    },
  ],
};

@Injectable()
export class CandidateReferralDocumentService {
  async generate(
    application: CandidateApplicationView,
    language?: string,
  ) {
    const normalizedLanguage = this.normalizeLanguage(language);
    const templateBuffer = await this.loadTemplate(normalizedLanguage);
    const zip = await JSZip.loadAsync(templateBuffer);
    const documentXmlFile = zip.file('word/document.xml');

    if (!documentXmlFile) {
      throw new NotFoundException('Candidate referral template is invalid');
    }

    const documentXml = await documentXmlFile.async('string');
    const filledXml = this.fillTemplate(
      documentXml,
      application,
      normalizedLanguage,
    );

    zip.file('word/document.xml', filledXml);

    const buffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
    });

    return {
      fileName: this.createFileName(application.id, normalizedLanguage),
      buffer,
    };
  }

  private normalizeLanguage(value?: string): CandidateReferralLanguage {
    if (!value) {
      return 'kz';
    }

    if (value === 'ru' || value === 'kz') {
      return value;
    }

    throw new BadRequestException('lang must be ru or kz');
  }

  private async loadTemplate(language: CandidateReferralLanguage) {
    const templatePath = resolve(
      process.cwd(),
      language === 'kz'
        ? (process.env.CANDIDATE_REFERRAL_TEMPLATE_KZ_PATH ??
            process.env.REFERRAL_TEMPLATE_KZ_PATH ??
            'data/templates/candidate-referral-template-kz-2026.docx')
        : (process.env.CANDIDATE_REFERRAL_TEMPLATE_RU_PATH ??
            process.env.CANDIDATE_REFERRAL_TEMPLATE_PATH ??
            process.env.REFERRAL_TEMPLATE_RU_PATH ??
            'data/templates/candidate-referral-template-ru-2026.docx'),
    );

    return readFile(templatePath);
  }

  private fillTemplate(
    documentXml: string,
    application: CandidateApplicationView,
    language: CandidateReferralLanguage,
  ) {
    const replacements = TEMPLATE_REPLACEMENTS[language]({
      ...application,
      fullName: this.limitText(application.fullName, 120),
      specialty: this.limitText(application.specialty, 120),
      locationLabel: this.limitText(application.locationLabel ?? '', 160),
    });

    const paragraphMatches = Array.from(
      documentXml.matchAll(/<w:p\b[\s\S]*?<\/w:p>/g),
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
          `Candidate referral paragraph ${paragraphIndex} was not found`,
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
            `Candidate referral run ${replacement.runIndex} was not found in paragraph ${replacement.paragraphIndex}`,
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
      throw new NotFoundException('Candidate referral run does not contain text');
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

  private createFileName(
    applicationId: string,
    language: CandidateReferralLanguage,
  ) {
    const safeId = applicationId.replace(/[^a-z0-9-]+/gi, '').toLowerCase();
    return language === 'kz'
      ? `candidate-referral-${safeId}-kz.docx`
      : `candidate-referral-${safeId}.docx`;
  }

  private limitText(value: string, maxLength: number) {
    return value.length > maxLength
      ? `${value.slice(0, maxLength - 3).trim()}...`
      : value;
  }
}
