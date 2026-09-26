/** Contributions may reference the editorial vocabulary, never create it. */
export const CONTRIBUTION_METADATA_KINDS = [
  'actors',
  'tags',
  'genres',
  'productionCompanies',
  'languages',
] as const;
export type ContributionMetadataKind =
  (typeof CONTRIBUTION_METADATA_KINDS)[number];

export function isContributionMetadataKind(
  value: unknown
): value is ContributionMetadataKind {
  return CONTRIBUTION_METADATA_KINDS.some((kind) => kind === value);
}

export interface ContributionMetadataInput {
  countryCode?: string | null;
  productionCompanyName?: string | null;
  originalLanguageName?: string | null;
  dubbingLanguageNames?: string[];
  actorNames?: string[];
  tagNames?: string[];
  genreNames?: string[];
}

interface NamedEntity {
  id: number;
  name: string;
}

export interface ContributionMetadataCatalog {
  countries: { id: number; code: string | null }[];
  productionCompanies: NamedEntity[];
  languages: NamedEntity[];
  actors: NamedEntity[];
  tags: NamedEntity[];
  genres: NamedEntity[];
}

export function contributionNames(values: (string | null | undefined)[]) {
  return [
    ...new Set(
      values
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value))
    ),
  ];
}

export function resolveContributionMetadata(
  input: ContributionMetadataInput,
  catalog: ContributionMetadataCatalog
) {
  const unresolvedNames = new Set<string>();
  function resolve(raw: string | null | undefined, rows: NamedEntity[]) {
    const name = raw?.trim();
    if (!name) return null;
    const matches = rows.filter(
      (row) => row.name.toLowerCase() === name.toLowerCase()
    );
    // Case-variant duplicates need editorial resolution, not arbitrary findFirst.
    if (matches.length !== 1) {
      unresolvedNames.add(name);
      return null;
    }
    return matches[0].id;
  }
  function resolveMany(names: string[] | undefined, rows: NamedEntity[]) {
    return [
      ...new Set(
        (names ?? [])
          .map((name) => resolve(name, rows))
          .filter((id): id is number => id !== null)
      ),
    ];
  }
  const countryCode = input.countryCode?.trim();
  const countries = countryCode
    ? catalog.countries.filter(
        (country) => country.code?.toLowerCase() === countryCode.toLowerCase()
      )
    : [];
  if (countryCode && countries.length !== 1) unresolvedNames.add(countryCode);
  const data = {
    countryId: countries.length === 1 ? countries[0].id : null,
    productionCompanyId: resolve(
      input.productionCompanyName,
      catalog.productionCompanies
    ),
    originalLanguageId: resolve(input.originalLanguageName, catalog.languages),
    dubbingLanguageIds: resolveMany(
      input.dubbingLanguageNames,
      catalog.languages
    ),
    actorIds: resolveMany(input.actorNames, catalog.actors),
    tagIds: resolveMany(input.tagNames, catalog.tags),
    genreIds: resolveMany(input.genreNames, catalog.genres),
  };
  return unresolvedNames.size
    ? { ok: false as const, unresolvedNames: [...unresolvedNames] }
    : { ok: true as const, data };
}

/** Shared response shape: forms retain their inputs and translate the explanation. */
export function contributionMetadataFailure(unresolvedNames: string[]) {
  return { code: 'EDITORIAL_METADATA_REQUIRED' as const, unresolvedNames };
}

export function unresolvedContributionNames(payload: unknown): string[] | null {
  if (
    !payload ||
    typeof payload !== 'object' ||
    !('code' in payload) ||
    payload.code !== 'EDITORIAL_METADATA_REQUIRED' ||
    !('unresolvedNames' in payload) ||
    !Array.isArray(payload.unresolvedNames) ||
    !payload.unresolvedNames.every(
      (name): name is string => typeof name === 'string'
    )
  )
    return null;
  return payload.unresolvedNames;
}
