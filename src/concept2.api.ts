/**
 * Direct client for the Concept2 logbook API.
 *
 * Base URL: https://log.concept2.com/api
 * Auth: personal access token, sent as Authorization: Bearer <token>.
 *
 * Endpoints used:
 *   GET /users/me                          — current user profile
 *   GET /users/me/results                  — list workouts (filterable)
 *   GET /users/me/results/{id}             — single workout (full detail)
 *   GET /users/me/results/{id}/strokes     — per-stroke data
 */
import { loadToken } from './concept2-token.js';

export const CONCEPT2_API_BASE = 'https://log.concept2.com/api';

export interface Concept2User {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  country?: string;
  profile_image?: string;
}

export interface Concept2Workout {
  id: number;
  user_id: number;
  date: string;
  timezone: string;
  date_utc: string;
  distance: number;
  /** Time in tenths of seconds (e.g. 15291 = 1529.1s = 25:29.1). */
  time: number;
  time_formatted: string;
  type: 'rower' | 'skierg' | 'bike' | 'dynamic' | 'slides';
  workout_type: string;
  source: string;
  weight_class: string;
  verified: boolean;
  ranked: boolean;
  pace?: number;
  pace_formatted?: string;
  watts?: number;
  calories_total?: number;
  stroke_rate?: number;
  stroke_count?: number;
  drag_factor?: number;
  heart_rate?: {
    average?: number;
    ending?: number;
    rest?: number;
  };
  comments?: string;
  stroke_data?: boolean;
}

export interface Concept2StrokePoint {
  /** Time in tenths of seconds. */
  t: number;
  /** Distance in decimeters. */
  d: number;
  /** Pace (seconds per 500m). */
  p: number;
  /** Strokes per minute. */
  spm: number;
  /** Heart rate (0 if no HR monitor). */
  hr: number;
}

export interface ListResultsParams {
  /** ISO date YYYY-MM-DD (inclusive). */
  from?: string;
  /** ISO date YYYY-MM-DD (inclusive). */
  to?: string;
  /** Filter by ergometer type. */
  type?: Concept2Workout['type'];
  /** Page number (default 1). */
  page?: number;
  /** Page size (default 50, max varies). */
  per_page?: number;
}

export class Concept2ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'Concept2ApiError';
  }
}

export class Concept2Api {
  constructor(private readonly baseUrl: string = CONCEPT2_API_BASE) {}

  async getCurrentUser(): Promise<Concept2User> {
    const { data } = await this.request<{ data: Concept2User }>('/users/me');
    return data;
  }

  async listResults(params: ListResultsParams = {}): Promise<Concept2Workout[]> {
    const query = new URLSearchParams();
    if (params.from) query.set('from', params.from);
    if (params.to) query.set('to', params.to);
    if (params.type) query.set('type', params.type);
    if (params.page) query.set('page', String(params.page));
    if (params.per_page) query.set('per_page', String(params.per_page));

    const path = `/users/me/results${query.size ? `?${query}` : ''}`;
    const { data } = await this.request<{ data: Concept2Workout[] }>(path);
    return data;
  }

  async getResult(workoutId: number): Promise<Concept2Workout> {
    const { data } = await this.request<{ data: Concept2Workout }>(
      `/users/me/results/${workoutId}`,
    );
    return data;
  }

  async getStrokeData(workoutId: number): Promise<Concept2StrokePoint[]> {
    const { data } = await this.request<{ data: Concept2StrokePoint[] }>(
      `/users/me/results/${workoutId}/strokes`,
    );
    return data ?? [];
  }

  private async request<T>(path: string): Promise<T> {
    const token = loadToken();
    if (!token) {
      throw new Concept2ApiError(
        'No Concept2 API token. Set CONCEPT2_API_TOKEN or save a token to ~/.config/concept2-mcp/token. Get one at https://log.concept2.com/developers',
      );
    }

    const url = `${this.baseUrl}${path}`;
    let response: Response;
    try {
      response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
    } catch (err) {
      throw new Concept2ApiError(
        `Network error talking to Concept2 API: ${(err as Error).message}`,
        undefined,
        err,
      );
    }

    if (response.status === 401) {
      throw new Concept2ApiError(
        'Concept2 token rejected (401). Generate a new one at https://log.concept2.com/developers',
        401,
      );
    }
    if (response.status === 403) {
      throw new Concept2ApiError(
        'Insufficient permissions on Concept2 token (403). Make sure your token has results:read scope.',
        403,
      );
    }
    if (response.status === 404) {
      throw new Concept2ApiError(`Not found: ${path}`, 404);
    }
    if (response.status === 503) {
      throw new Concept2ApiError('Concept2 API temporarily unavailable (503).', 503);
    }
    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Concept2ApiError(
        `Concept2 API error: HTTP ${response.status}${body ? ` — ${body.slice(0, 200)}` : ''}`,
        response.status,
      );
    }

    return (await response.json()) as T;
  }
}
