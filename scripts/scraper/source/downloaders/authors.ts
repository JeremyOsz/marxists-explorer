import { SOURCE_RESOURCES } from '../config';
import { HttpClient } from '../httpClient';
import type { HttpResource } from '../types';

export type RawAuthorsPayload = unknown;

export async function fetchAuthorsResource(
  client: HttpClient,
): Promise<HttpResource<RawAuthorsPayload>> {
  return client.getJson<RawAuthorsPayload>(SOURCE_RESOURCES.authors);
}


