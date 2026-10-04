import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

import { BehaviorSubject, Observable } from 'rxjs';

export interface UserProfile {
  name: string;
  role: string;
  avatar: string;
  email: string;
  roleKey: string;
  userId?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);

  showLogoutModal = false;
  isLoggingOut = false;
  logoutError: string | null = null;

  // Reactive stream notifying subscribers when the authenticated user changes or logs out
  private userChangedSubject = new BehaviorSubject<string | null>(this.getInitialUserId());
  public userChanged$: Observable<string | null> = this.userChangedSubject.asObservable();

  private getInitialUserId(): string | null {
    if (typeof localStorage === 'undefined') return null;
    if (!localStorage.getItem('userRole')) return null;
    return localStorage.getItem('currentUserId') || (localStorage.getItem('userRole') === 'admin' ? 'admin-001' : 'user-001');
  }

  isAuthenticated(): boolean {
    if (typeof localStorage === 'undefined') return false;
    return !!localStorage.getItem('userRole');
  }

  getRole(): string {
    if (typeof localStorage === 'undefined') return '';
    return localStorage.getItem('userRole') || '';
  }

  isAdmin(): boolean {
    return this.getRole() === 'admin';
  }

  hasPermission(permission: string): boolean {
    if (permission === 'appearance.branding.manage') {
      return this.isAdmin();
    }
    if (this.isAdmin()) return true;
    return false;
  }

  getTenantId(): string {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('userTenantId');
      if (stored) return stored;
    }
    // Single organisation (IMGC): every role and the login page share one branding record.
    return 'tenant-admin-imgc';
  }

  getUserId(): string {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('currentUserId');
      if (stored) return stored;
    }
    return this.isAdmin() ? 'admin-001' : 'user-001';
  }

  setTenantId(tenantId: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('userTenantId', tenantId);
    }
  }

  getUserProfile(): UserProfile {
    const roleKey = this.getRole() || 'admin';
    const userId = this.getUserId();

    let name = roleKey === 'admin' ? 'Meera Nair' : 'User';
    let email = roleKey === 'admin' ? 'meera.nair@imgc.in' : 'user@lender.com';
    let avatar = roleKey === 'admin' ? 'MN' : 'US';

    if (userId === 'admin-a' || userId === 'admin-001') {
      name = 'Admin (Meera)';
      avatar = 'MN';
      email = 'admin@imgc.in';
    } else if (userId === 'user-a' || userId === 'user-001') {
      name = 'User A (Priya)';
      avatar = 'UA';
      email = 'user.a@lender.com';
    } else if (userId === 'user-b' || userId === 'user-002') {
      name = 'User B (Rahul)';
      avatar = 'UB';
      email = 'user.b@lender.com';
    }

    return {
      name,
      role: roleKey === 'admin' ? 'Admin' : 'User',
      avatar,
      email,
      roleKey,
      userId
    };
  }

  login(role: string, customUserId?: string, customName?: string): void {
    const userId = customUserId || (role === 'admin' ? 'admin-001' : 'user-001');
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('userRole', role);
      localStorage.setItem('currentUserId', userId);
      localStorage.setItem(
        'authSession',
        JSON.stringify({
          authenticated: true,
          role,
          userId,
          user: customName || (role === 'admin' ? 'Admin' : 'User'),
          timestamp: Date.now()
        })
      );
    }
    this.userChangedSubject.next(userId);
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.showLogoutModal = false;
    this.isLoggingOut = false;
    this.logoutError = null;

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('userRole');
      localStorage.removeItem('currentUserId');
      localStorage.removeItem('authSession');
    }

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }

    if (typeof document !== 'undefined' && document.cookie) {
      const cookies = document.cookie.split(';');
      for (const cookie of cookies) {
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = `${name.trim()}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
      }
    }

    this.userChangedSubject.next(null);
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  openLogoutConfirm(): void {
    this.logout();
  }

  cancelLogout(): void {
    this.showLogoutModal = false;
    this.logoutError = null;
    this.isLoggingOut = false;
  }

  async confirmLogout(): Promise<void> {
    this.logout();
  }
}
