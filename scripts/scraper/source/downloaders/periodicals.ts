import { SOURCE_RESOURCES } from '../config';
import { HttpClient } from '../httpClient';
import type { HttpResource } from '../types';

export type RawPeriodicalsPayload = unknown;

export async function fetchPeriodicalsResource(
  client: HttpClient,
): Promise<HttpResource<RawPeriodicalsPayload>> {
  return client.getJson<RawPeriodicalsPayload>(SOURCE_RESOURCES.periodicals);
}


