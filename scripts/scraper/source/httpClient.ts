import { createHash } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { DEFAULT_RATE_LIMIT, DEFAULT_USER_AGENT } from './config';
import type {
  HttpHeadersSnapshot,
  HttpResource,
  HttpResourceMeta,
  RateLimitConfig,
} from './types';

class TokenBucket {
  private readonly maxTokens: number;
  private readonly refillIntervalMs: number;
  private tokens: number;
  private readonly queue: Array<() => void> = [];
  private interval: NodeJS.Timeout | null = null;

  constructor(config: RateLimitConfig) {
    const rps = Math.max(config.requestsPerSecond, 0.1);
    this.maxTokens = Math.max(config.burst, 1);
    this.tokens = this.maxTokens;
    this.refillIntervalMs = Math.round(1000 / rps);
    this.start();
  }

  private start(): void {
    if (this.interval) return;
    this.interval = setInterval(() => {
      if (this.tokens < this.maxTokens) {
        this.tokens += 1;
        this.dispatch();
      }
    }, this.refillIntervalMs).unref();
  }

  private dispatch(): void {
    if (this.tokens <= 0) return;
    const resolver = this.queue.shift();
    if (resolver) {
      this.tokens -= 1;
      resolver();
    }
  }

  acquire(): Promise<void> {
    return new Promise((resolve) => {
      if (this.tokens > 0) {
        this.tokens -= 1;
        resolve();
        return;
      }
      this.queue.push(resolve);
    });
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.queue.splice(0, this.queue.length);
  }
}

export interface HttpClientOptions {
  readonly rateLimit?: RateLimitConfig;
  readonly userAgent?: string;
  readonly timeoutMs?: number;
}

export class HttpClient {
  private readonly limiter: TokenBucket;
  private readonly userAgent: string;
  private readonly timeoutMs: number;

  constructor(options: HttpClientOptions = {}) {
    this.limiter = new TokenBucket(options.rateLimit ?? DEFAULT_RATE_LIMIT);
    this.userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
    this.timeoutMs = options.timeoutMs ?? 15_000;
  }

  async getJson<T>(url: string): Promise<HttpResource<T>> {
    const response = await this.fetch(url);
    const text = response.bodyText;
    try {
      const data = JSON.parse(text) as T;
      return {
        data,
        meta: response.meta,
      };
    } catch (error) {
      throw new Error(
        `Failed to parse JSON from ${url}: ${(error as Error).message}`,
        { cause: error },
      );
    }
  }

  async getText(url: string): Promise<HttpResource<string>> {
    const response = await this.fetch(url);
    return {
      data: response.bodyText,
      meta: response.meta,
    };
  }

  dispose(): void {
    this.limiter.stop();
  }

  private async fetch(
    url: string,
  ): Promise<{ bodyText: string; meta: HttpResourceMeta }> {
    await this.limiter.acquire();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const start = performance.now();

    try {
      const response = await fetch(url, {
        headers: { 'user-agent': this.userAgent },
        signal: controller.signal,
      });

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const bodyText = buffer.toString('utf-8');
      const durationMs = performance.now() - start;

      const meta: HttpResourceMeta = {
        url,
        status: response.status,
        fetchedAt: new Date().toISOString(),
        durationMs,
        headers: extractHeaders(response.headers),
        sha256: createHash('sha256').update(buffer).digest('hex'),
        bytes: buffer.byteLength,
      };

      if (!response.ok) {
        throw new Error(
          `Request to ${url} failed with status ${response.status}`,
          { cause: meta },
        );
      }

      return { bodyText, meta };
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function extractHeaders(headers: Headers): HttpHeadersSnapshot {
  return {
    etag: headers.get('etag'),
    lastModified: headers.get('last-modified'),
    cacheControl: headers.get('cache-control'),
  };
}


