export function normalizeString(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed || null;
}

export function compactStrings(
  values: readonly (string | null | undefined)[] | null | undefined,
) {
  return (
    values
      ?.map((value) => normalizeString(value))
      .filter((value): value is string => Boolean(value)) ?? []
  );
}

export function uniqueStrings(
  values: readonly (string | null | undefined)[] | null | undefined,
) {
  return Array.from(new Set(compactStrings(values)));
}
