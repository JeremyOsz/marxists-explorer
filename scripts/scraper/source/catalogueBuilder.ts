import type {
  AuthorRecord,
  DiscoveryAnomaly,
  PeriodicalRecord,
  SectionRecord,
  SourceCatalogue,
} from './types';

export interface BuildCatalogueInput {
  readonly fetchedAt: string;
  readonly authors: readonly AuthorRecord[];
  readonly sections: readonly SectionRecord[];
  readonly periodicals: readonly PeriodicalRecord[];
  readonly anomalies: readonly DiscoveryAnomaly[];
}

export function buildSourceCatalogue(
  input: BuildCatalogueInput,
): SourceCatalogue {
  const sortedAuthors = [...input.authors].sort((a, b) =>
    a.name.localeCompare(b.name),
  );
  const sortedSections = [...input.sections].sort((a, b) =>
    a.title.localeCompare(b.title),
  );
  const sortedPeriodicals = [...input.periodicals].sort((a, b) =>
    a.title.localeCompare(b.title),
  );

  return {
    fetchedAt: input.fetchedAt,
    authors: sortedAuthors,
    sections: sortedSections,
    periodicals: sortedPeriodicals,
    anomalies: [...input.anomalies],
  };
}


