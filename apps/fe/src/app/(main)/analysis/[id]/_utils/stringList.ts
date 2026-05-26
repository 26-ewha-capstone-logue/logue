export function compactStrings(
  values: readonly (string | null | undefined)[] | null | undefined,
) {
  return (
    values
      ?.map((value) => value?.trim())
      .filter((value): value is string => Boolean(value)) ?? []
  );
}

export function uniqueStrings(
  values: readonly (string | null | undefined)[] | null | undefined,
) {
  return Array.from(new Set(compactStrings(values)));
}
