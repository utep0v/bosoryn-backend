import { BadRequestException } from '@nestjs/common';

function normalizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export function requireText(value: unknown, fieldName: string) {
  const text = normalizeString(value);

  if (!text) {
    throw new BadRequestException(`${fieldName} is required`);
  }

  return text;
}

export function requireEmail(value: unknown, fieldName = 'email') {
  const email = requireText(value, fieldName).toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new BadRequestException(`${fieldName} must be a valid email`);
  }

  return email;
}

export function requirePhone(value: unknown, fieldName = 'phone') {
  const phone = requireText(value, fieldName);
  const digits = phone.replace(/\D/g, '');

  if (digits.length < 10) {
    throw new BadRequestException(
      `${fieldName} must contain at least 10 digits`,
    );
  }

  return phone;
}

export function requireNumber(value: unknown, fieldName: string) {
  const numberValue =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(numberValue)) {
    throw new BadRequestException(`${fieldName} must be a number`);
  }

  return numberValue;
}

export function requirePositiveInt(value: unknown, fieldName: string) {
  const numberValue = requireNumber(value, fieldName);

  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    throw new BadRequestException(`${fieldName} must be a positive integer`);
  }

  return numberValue;
}

export function toOptionalInt(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : undefined;
}

export function requireUuid(value: unknown, fieldName: string) {
  const text = requireText(value, fieldName);

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      text,
    )
  ) {
    throw new BadRequestException(`${fieldName} must be a valid UUID`);
  }

  return text;
}

export function toOptionalText(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'string') {
    return value.trim() || undefined;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim() || undefined;
  }

  return undefined;
}
