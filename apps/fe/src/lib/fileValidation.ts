const ONE_MB = 1024 * 1024;

export const CSV_MAX_FILE_SIZE_BYTES = 50 * ONE_MB;

export type CsvValidationMessages = {
  invalidType: string;
  tooLarge: string;
};

export function validateCsvFile(
  file: Pick<File, 'name' | 'size'>,
  messages: CsvValidationMessages,
) {
  const isCsv = file.name.toLowerCase().endsWith('.csv');
  if (!isCsv) return messages.invalidType;
  if (file.size >= CSV_MAX_FILE_SIZE_BYTES) return messages.tooLarge;
  return null;
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < ONE_MB) return `${(bytes / 1024).toFixed(1)} KB`;

  const mb = bytes / ONE_MB;
  return `${Number.isInteger(mb) ? mb : mb.toFixed(1)}MB`;
}
