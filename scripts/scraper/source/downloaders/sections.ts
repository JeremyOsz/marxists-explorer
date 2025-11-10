import { SOURCE_RESOURCES } from '../config';
import { HttpClient } from '../httpClient';
import type { HttpResource } from '../types';

export type RawSectionsPayload = unknown;

export async function fetchSectionsResource(
  client: HttpClient,
): Promise<HttpResource<RawSectionsPayload>> {
  return client.getJson<RawSectionsPayload>(SOURCE_RESOURCES.sections);
}


