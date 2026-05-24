const ONE_MB = 1024 * 1024;

export const CSV_MAX_FILE_SIZE_BYTES = 50 * ONE_MB;
const CSV_MIME_TYPES = new Set([
  'application/csv',
  'application/vnd.ms-excel',
  'text/csv',
  'text/plain',
]);

export type CsvValidationMessages = {
  invalidType: string;
  tooLarge: string;
  empty?: string;
};

export function validateCsvFile(
  file: Pick<File, 'name' | 'size' | 'type'>,
  messages: CsvValidationMessages,
) {
  const isCsv = file.name.trim().toLowerCase().endsWith('.csv');
  const normalizedMimeType = file.type.trim().toLowerCase();
  const hasAllowedMimeType =
    !normalizedMimeType || CSV_MIME_TYPES.has(normalizedMimeType);

  if (!isCsv) return messages.invalidType;
  if (!hasAllowedMimeType) return messages.invalidType;
  if (file.size === 0) return messages.empty ?? messages.invalidType;
  if (file.size > CSV_MAX_FILE_SIZE_BYTES) return messages.tooLarge;
  return null;
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < ONE_MB) return `${(bytes / 1024).toFixed(1)} KB`;

  const mb = bytes / ONE_MB;
  return `${Number.isInteger(mb) ? mb : mb.toFixed(1)}MB`;
}
