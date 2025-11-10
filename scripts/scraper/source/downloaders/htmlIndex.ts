import { SUBJECT_INDEX_PAGES } from '../config';
import { HttpClient } from '../httpClient';
import type { HttpResource } from '../types';

export interface HtmlIndexSnapshot {
  readonly id: string;
  readonly html: string;
  readonly meta: HttpResource<string>['meta'];
}

export async function fetchSubjectIndices(
  client: HttpClient,
): Promise<readonly HtmlIndexSnapshot[]> {
  const results = [];
  for (const page of SUBJECT_INDEX_PAGES) {
    const resource = await client.getText(page.url);
    results.push({
      id: page.id,
      html: resource.data,
      meta: resource.meta,
    });
  }
  return results;
}


