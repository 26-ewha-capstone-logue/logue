import { describe, expect, it } from 'vitest';
import { CSV_MAX_FILE_SIZE_BYTES, validateCsvFile } from './fileValidation';

const messages = {
  invalidType: 'invalid',
  tooLarge: 'too large',
  empty: 'empty',
};

function createFileInput(
  overrides: Partial<Pick<File, 'name' | 'size' | 'type'>> = {},
): Pick<File, 'name' | 'size' | 'type'> {
  return {
    name: 'data.csv',
    size: 1024,
    type: 'text/csv',
    ...overrides,
  };
}

describe('validateCsvFile', () => {
  it('accepts a CSV file at the configured size limit', () => {
    expect(
      validateCsvFile(
        createFileInput({ size: CSV_MAX_FILE_SIZE_BYTES }),
        messages,
      ),
    ).toBeNull();
  });

  it('rejects files above the configured size limit', () => {
    expect(
      validateCsvFile(
        createFileInput({ size: CSV_MAX_FILE_SIZE_BYTES + 1 }),
        messages,
      ),
    ).toBe(messages.tooLarge);
  });

  it('rejects empty CSV files', () => {
    expect(validateCsvFile(createFileInput({ size: 0 }), messages)).toBe(
      messages.empty,
    );
  });

  it('rejects non-CSV extensions', () => {
    expect(
      validateCsvFile(createFileInput({ name: 'data.xlsx' }), messages),
    ).toBe(messages.invalidType);
  });

  it('rejects non-CSV MIME types when the browser provides one', () => {
    expect(
      validateCsvFile(createFileInput({ type: 'application/pdf' }), messages),
    ).toBe(messages.invalidType);
  });
});
