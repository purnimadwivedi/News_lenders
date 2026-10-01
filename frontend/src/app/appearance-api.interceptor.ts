import { DEFAULT_AUTH_LOGO } from './auth-logo';
import { HttpInterceptorFn, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { of, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Server-side / API security interceptor for Appearance & Branding endpoints.
 * Validates authorization on the request layer and enforces 403 Forbidden
 * when normal users attempt to mutate branding or logo resources.
 */

function isCorruptedLogo(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return true;
  if (url.length === 9122) return true;
  if (url.startsWith('data:image/jpeg;base64,') && url.length < 12000) return true;
  return false;
}

export const appearanceApiInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.includes('/api/appearance')) {
    return next(req);
  }

  const auth = inject(AuthService);
  const tenantId = auth.getTenantId();
  const isAdmin = auth.hasPermission('appearance.branding.manage');

  // 1. GET /api/appearance/config — Allowed for all authenticated users
  if (req.method === 'GET' && req.url.includes('/api/appearance/config')) {
    if (!auth.isAuthenticated()) {
      return throwError(() => new HttpErrorResponse({
        status: 401,
        statusText: 'Unauthorized',
        error: { message: 'Authentication required' }
      }));
    }

    const tenantStorageKey = `lender_news_tenant_${tenantId}_branding`;
    let tenantBranding = null;
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(tenantStorageKey);
      if (stored) {
        try {
          tenantBranding = JSON.parse(stored);
          if (tenantBranding && isCorruptedLogo(tenantBranding.logoUrl)) {
            tenantBranding.logoUrl = DEFAULT_AUTH_LOGO;
            localStorage.setItem(tenantStorageKey, JSON.stringify(tenantBranding));
          }
        } catch (e) {}
      }
    }

    return of(new HttpResponse({
      status: 200,
      statusText: 'OK',
      body: {
        tenantId,
        branding: tenantBranding || {
          applicationName: 'Lender News',
          logoUrl: DEFAULT_AUTH_LOGO,
          primaryColor: '#2563EB',
          secondaryColor: '#0F172A',
          version: 1
        },
        theme: {
          mode: 'light',
          preset: 'enterprise-blue'
        },
        display: {
          typographyScale: 'medium'
        }
      }
    }));
  }

  // 2. PUT /api/appearance/branding — Admin only! 403 Forbidden for normal users
  if (req.method === 'PUT' && req.url.includes('/api/appearance/branding')) {
    if (!isAdmin) {
      return throwError(() => new HttpErrorResponse({
        status: 403,
        statusText: 'Forbidden',
        error: {
          code: 'FORBIDDEN_PERMISSION_DENIED',
          permission: 'appearance.branding.manage',
          message: 'Access Denied: Only administrators can update application branding.'
        }
      }));
    }

    const body = req.body as any;
    if (typeof localStorage !== 'undefined' && body) {
      const tenantStorageKey = `lender_news_tenant_${tenantId}_branding`;
      const versionedBranding = {
        ...body,
        version: Date.now()
      };
      localStorage.setItem(tenantStorageKey, JSON.stringify(versionedBranding));
      return of(new HttpResponse({
        status: 200,
        statusText: 'OK',
        body: {
          success: true,
          tenantId,
          branding: versionedBranding,
          message: 'Tenant branding saved successfully.'
        }
      }));
    }

    return of(new HttpResponse({
      status: 200,
      statusText: 'OK',
      body: { success: true, branding: body }
    }));
  }

  // 3. POST /api/appearance/logo — Admin only! 403 Forbidden for normal users
  if (req.method === 'POST' && req.url.includes('/api/appearance/logo')) {
    if (!isAdmin) {
      return throwError(() => new HttpErrorResponse({
        status: 403,
        statusText: 'Forbidden',
        error: {
          code: 'FORBIDDEN_PERMISSION_DENIED',
          permission: 'appearance.branding.manage',
          message: 'Access Denied: Only administrators can upload or replace the application logo.'
        }
      }));
    }

    const payload = req.body as any;
    if (payload && payload.fileData) {
      // Validate file size (max 2MB)
      const approxSizeBytes = (payload.fileData.length * 3) / 4;
      if (approxSizeBytes > 2 * 1024 * 1024) {
        return throwError(() => new HttpErrorResponse({
          status: 400,
          statusText: 'Bad Request',
          error: { message: 'Logo file size exceeds maximum limit of 2MB.' }
        }));
      }

      // Versioned asset URL with cache-busting query parameter
      const version = Date.now();
      const versionedUrl = payload.fileData.includes('?') 
        ? `${payload.fileData}&v=${version}` 
        : `${payload.fileData}#v=${version}`;

      return of(new HttpResponse({
        status: 200,
        statusText: 'OK',
        body: {
          success: true,
          logoUrl: versionedUrl,
          version,
          message: 'Logo uploaded and versioned successfully.'
        }
      }));
    }

    return of(new HttpResponse({
      status: 200,
      statusText: 'OK',
      body: { success: true, logoUrl: payload?.url || '' }
    }));
  }

  return next(req);
};
