import { HttpService } from '@nestjs/axios';
import { Injectable, LoggerService, Optional } from '@nestjs/common';
import { firstValueFrom, Observable, throwError, timer } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
import { createLogger } from 'util/logger';

interface HealthCheckResponse {
  status: string;
  service: string;
}

interface WorkoutQueryParams {
  from?: string;
  to?: string;
  limit?: number;
}

@Injectable()
export class RowingApi {
  private readonly logger: LoggerService;
  private readonly baseUrl: string;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 second base delay

  constructor(
    private readonly httpService: HttpService,
    baseUrl: string,
    @Optional() logger?: LoggerService
  ) {
    this.baseUrl = baseUrl;
    // Use plain Winston logger by default (safe for MCP apps - no ANSI colors)
    this.logger = logger || createLogger({ colors: false, context: this.constructor.name });

    // Add request interceptor for debugging
    this.httpService.axiosRef.interceptors.request.use(
      (config) => {
        this.logger.debug(`→ ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for debugging
    this.httpService.axiosRef.interceptors.response.use(
      (response) => {
        this.logger.debug(
          `← ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`
        );
        return response;
      },
      (error) => {
        const status = error.response?.status || 'NO_RESPONSE';
        const url = error.config?.url || 'UNKNOWN_URL';
        const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
        this.logger.error(`← ${status} ${method} ${url}`, {
          message: error.message,
          code: error.code,
          responseType: typeof error.response?.data,
          responsePreview: JSON.stringify(error.response?.data)?.substring(0, 200),
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get the base URL for error messages
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Health check endpoint (on base sandbox-api, not /rowing)
   */
  async health(): Promise<HealthCheckResponse> {
    // Remove /api/rowing from base URL for health check
    const healthUrl = this.baseUrl.replace(/\/api\/rowing$/, '/health');
    return firstValueFrom(
      this.httpService.get<HealthCheckResponse>(healthUrl).pipe(
        map((response) => response.data),
        this.retryWithBackoff()
      )
    );
  }

  /**
   * Get current Pete Plan stats (current week, completion %)
   */
  async getStats(): Promise<any> {
    const url = `${this.baseUrl}/stats`;
    return firstValueFrom(
      this.httpService.get<any>(url).pipe(
        map((response) => response.data),
        this.retryWithBackoff()
      )
    );
  }

  /**
   * Get details for a specific Pete Plan week (1-24)
   */
  async getWeek(week: number): Promise<any> {
    const url = `${this.baseUrl}/schedule/week/${week}`;
    return firstValueFrom(
      this.httpService.get<any>(url).pipe(
        map((response) => response.data),
        this.retryWithBackoff()
      )
    );
  }

  /**
   * Get workouts with optional date range and limit filters
   */
  async getWorkouts(params?: WorkoutQueryParams): Promise<any[]> {
    const url = `${this.baseUrl}/workouts`;
    const queryParams: Record<string, string> = {};

    if (params?.from) queryParams.from = params.from;
    if (params?.to) queryParams.to = params.to;
    if (params?.limit !== undefined) queryParams.limit = params.limit.toString();

    return firstValueFrom(
      this.httpService.get<any[]>(url, { params: queryParams }).pipe(
        map((response) => response.data),
        this.retryWithBackoff()
      )
    );
  }

  /**
   * Link a workout to a Pete Plan week/day
   */
  async completeDay(week: number, day: number, workoutId: number): Promise<any> {
    const url = `${this.baseUrl}/completions`;
    return firstValueFrom(
      this.httpService.post<any>(url, { week, day, workoutId }).pipe(
        map((response) => response.data),
        this.retryWithBackoff()
      )
    );
  }

  /**
   * Get a single workout by ID
   */
  async getWorkout(id: number): Promise<any> {
    const url = `${this.baseUrl}/workouts/${id}`;
    return firstValueFrom(
      this.httpService.get<any>(url).pipe(
        map((response) => response.data),
        this.retryWithBackoff()
      )
    );
  }

  /**
   * Retry with exponential backoff operator
   */
  private retryWithBackoff<T>() {
    return (source: Observable<T>) =>
      source.pipe(
        retry({
          count: this.maxRetries,
          delay: (error, retryCount) => {
            const delay = this.retryDelay * Math.pow(2, retryCount - 1);
            this.logger.warn(
              `Attempt ${retryCount} failed, retrying in ${delay}ms...`,
              error.message
            );
            return timer(delay);
          },
        }),
        catchError((error) => {
          // Enhanced error logging with full context
          const details = {
            url: error.config?.url,
            method: error.config?.method?.toUpperCase(),
            status: error.response?.status,
            statusText: error.response?.statusText,
            responseData: error.response?.data,
            message: error.message,
            code: error.code, // e.g., ECONNREFUSED, ENOTFOUND
          };
          this.logger.error(
            `HTTP request failed after ${this.maxRetries} attempts`,
            JSON.stringify(details, null, 2)
          );
          return throwError(() => error);
        })
      );
  }
}
