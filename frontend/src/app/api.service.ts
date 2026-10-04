import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../environments/environment';
import { Company, Recipient, NewsArticle, Stats, RunLog, UserOverride, Configuration, DashboardFilter, DashboardResponse } from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private base = environment.apiBase;

  health(): Observable<{ ok: boolean; time: string; company: string; model: string }> {
    return this.http.get<{ ok: boolean; time: string; company: string; model: string }>(`${this.base}/health`);
  }

  listCompanies(): Observable<Company[]> {
    return this.http.get<Company[]>(`${this.base}/companies`);
  }
  createCompany(c: Partial<Company>): Observable<Company> {
    return this.http.post<Company>(`${this.base}/companies`, c);
  }
  updateCompany(id: string, c: Partial<Company>): Observable<Company> {
    return this.http.put<Company>(`${this.base}/companies/${id}`, c);
  }
  deleteCompany(id: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/companies/${id}`);
  }

  listRecipients(): Observable<Recipient[]> {
    return this.http.get<Recipient[]>(`${this.base}/recipients`);
  }
  createRecipient(r: Partial<Recipient>): Observable<Recipient> {
    return this.http.post<Recipient>(`${this.base}/recipients`, r);
  }
  updateRecipient(id: string, r: Partial<Recipient>): Observable<Recipient> {
    return this.http.put<Recipient>(`${this.base}/recipients/${id}`, r);
  }
  deleteRecipient(id: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/recipients/${id}`);
  }
  testEmail(id: string): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${this.base}/recipients/${id}/test-email`, {});
  }

  listNews(params: Record<string, any> = {}): Observable<{ items: NewsArticle[]; total: number }> {
    const searchParams: Record<string, string> = {};
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') {
        searchParams[k] = String(v);
      }
    }
    const search = new URLSearchParams(searchParams).toString();
    return this.http.get<{ items: NewsArticle[]; total: number }>(
      `${this.base}/news${search ? '?' + search : ''}`
    );
  }

  getDashboardData(filter: DashboardFilter): Observable<DashboardResponse> {
    const params: Record<string, string> = {
      period: filter.period,
      startDate: filter.startDate,
      endDate: filter.endDate,
      lenderId: filter.lenderId || 'ALL'
    };
    return this.http.get<DashboardResponse>(`${this.base}/dashboard`, { params }).pipe(
      catchError((err: HttpErrorResponse) => {
        // If /dashboard endpoint is not yet deployed on remote server (404), seamlessly fallback to /news/stats
        if (err.status === 404) {
          const statsParams: Record<string, string> = {
            period: filter.period,
            startDate: filter.startDate,
            endDate: filter.endDate,
            lenderId: filter.lenderId || 'ALL'
          };
          const qs = new URLSearchParams(statsParams).toString();
          return this.http.get<Stats>(`${this.base}/news/stats?${qs}`).pipe(
            map((stats) => {
              const critical = stats.byImpact?.find((i) => i._id.toLowerCase() === 'critical')?.count || 0;
              const high = stats.byImpact?.find((i) => i._id.toLowerCase() === 'high')?.count || 0;
              const medium = stats.byImpact?.find((i) => i._id.toLowerCase() === 'medium')?.count || 0;
              const low = stats.byImpact?.find((i) => i._id.toLowerCase() === 'low')?.count || 0;

              return {
                period: filter.period,
                startDate: filter.startDate,
                endDate: filter.endDate,
                lenderId: filter.lenderId || 'ALL',
                summary: {
                  totalArticles: stats.total || 0,
                  critical,
                  high,
                  medium,
                  low,
                  lendersTracked: filter.lenderId && filter.lenderId !== 'ALL' ? 1 : (stats.topCompanies?.length || 0)
                },
                categories: (stats.byRisk || []).map((r) => ({
                  _id: r._id,
                  category: r._id,
                  count: r.count
                })),
                topMentionedLenders: (stats.topCompanies || []).map((c) => ({
                  _id: c.name || c._id,
                  name: c.name || c._id,
                  lenderId: c.name || c._id,
                  lenderName: c.name || c._id,
                  count: c.count
                })),
                window: stats.window || filter.period,
                total: stats.total || 0,
                byImpact: stats.byImpact || [],
                byRisk: stats.byRisk || [],
                topCompanies: stats.topCompanies || []
              };
            })
          );
        }
        return throwError(() => err);
      })
    );
  }

  newsStats(period?: string): Observable<Stats> {
    const url = period ? `${this.base}/news/stats?period=${period}` : `${this.base}/news/stats`;
    return this.http.get<Stats>(url);
  }
  getNews(id: string): Observable<NewsArticle> {
    return this.http.get<NewsArticle>(`${this.base}/news/${id}`);
  }
  deleteNews(id: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${this.base}/news/${id}`);
  }
  overrideClassification(id: string, override: Partial<UserOverride>): Observable<NewsArticle> {
    return this.http.patch<NewsArticle>(`${this.base}/news/${id}/override`, override);
  }
  clearOverride(id: string): Observable<NewsArticle> {
    return this.http.delete<NewsArticle>(`${this.base}/news/${id}/override`);
  }

  listRuns(): Observable<RunLog[]> {
    return this.http.get<RunLog[]>(`${this.base}/runs`);
  }
  triggerFetch(): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${this.base}/runs/fetch-now`, {});
  }
  triggerDigest(): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>(`${this.base}/runs/digest-now`, {});
  }

  getConfig(): Observable<Configuration> {
    return this.http.get<Configuration>(`${this.base}/config`);
  }
  updateConfig(cfg: Partial<Configuration>): Observable<Configuration> {
    return this.http.put<Configuration>(`${this.base}/config`, cfg);
  }
  addCategory(category: { name: string; description?: string }): Observable<Configuration> {
    return this.http.post<Configuration>(`${this.base}/config/categories`, category);
  }
  updateCategory(id: string, category: { name: string; description?: string }): Observable<Configuration> {
    return this.http.put<Configuration>(`${this.base}/config/categories/${id}`, category);
  }
  deleteCategory(id: string): Observable<Configuration> {
    return this.http.delete<Configuration>(`${this.base}/config/categories/${id}`);
  }
  resetConfig(): Observable<Configuration> {
    return this.http.post<Configuration>(`${this.base}/config/reset`, {});
  }
}
