import { HttpClient } from '../httpClient';
import type { AuthorRecord, HttpResource } from '../types';

export interface AuthorWorksSnapshot {
  readonly author: AuthorRecord;
  readonly html: string;
  readonly meta: HttpResource<string>['meta'];
}

export async function fetchWorksForAuthor(
  client: HttpClient,
  author: AuthorRecord,
): Promise<AuthorWorksSnapshot> {
  const resource = await client.getText(author.canonicalHref);
  return {
    author,
    html: resource.data,
    meta: resource.meta,
  };
}

export async function fetchWorksForAuthors(
  client: HttpClient,
  authors: readonly AuthorRecord[],
  onProgress?: (current: number, total: number) => void,
): Promise<AuthorWorksSnapshot[]> {
  const snapshots: AuthorWorksSnapshot[] = [];
  const total = authors.length;

  for (let i = 0; i < authors.length; i++) {
    const author = authors[i];
    try {
      const snapshot = await fetchWorksForAuthor(client, author);
      snapshots.push(snapshot);
    } catch (error) {
      // Log error but continue with other authors
      console.warn(
        `Failed to fetch works for author ${author.name} (${author.id}): ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      if (onProgress) {
        onProgress(i + 1, total);
      }
    }
  }

  return snapshots;
}

