import { normalizeSearchQuery, scoreQueryMatch } from "@t3tools/shared/searchRanking";

export interface ProjectPickerOption<T> {
  readonly value: string;
  readonly label: string;
  readonly data: T;
}

function projectLabelMatchesToken(label: string, token: string): boolean {
  return (
    scoreQueryMatch({
      value: label,
      query: token,
      exactBase: 0,
      prefixBase: 1,
      boundaryBase: 2,
      includesBase: 3,
      ...(token.length >= 3 ? { fuzzyBase: 100 } : {}),
    }) !== null
  );
}

export function filterProjectPickerOptions<T>(
  options: readonly ProjectPickerOption<T>[],
  query: string,
): readonly ProjectPickerOption<T>[] {
  const normalizedQuery = normalizeSearchQuery(query);
  if (!normalizedQuery) {
    return options;
  }

  const tokens = normalizedQuery.split(/\s+/u);
  return options.filter((option) => {
    const normalizedLabel = normalizeSearchQuery(option.label);
    return tokens.every((token) => projectLabelMatchesToken(normalizedLabel, token));
  });
}
