import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

export interface UserProfile {
  name: string;
  role: string;
  avatar: string;
  email: string;
  roleKey: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private router = inject(Router);

  showLogoutModal = false;
  isLoggingOut = false;
  logoutError: string | null = null;

  isAuthenticated(): boolean {
    if (typeof localStorage === 'undefined') return false;
    return !!localStorage.getItem('userRole');
  }

  getRole(): string {
    if (typeof localStorage === 'undefined') return '';
    return localStorage.getItem('userRole') || '';
  }

  getUserProfile(): UserProfile {
    const roleKey = this.getRole() || 'admin';
    return {
      name: roleKey === 'admin' ? 'Meera Nair' : 'User',
      role: roleKey === 'admin' ? 'Admin' : 'User',
      avatar: roleKey === 'admin' ? 'MN' : 'US',
      email: roleKey === 'admin' ? 'meera.nair@imgc.in' : 'user@lender.com',
      roleKey
    };
  }

  login(role: string): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('userRole', role);
      localStorage.setItem(
        'authSession',
        JSON.stringify({
          authenticated: true,
          role,
          user: role === 'admin' ? 'Meera Nair' : 'User',
          timestamp: Date.now()
        })
      );
    }
    this.router.navigate(['/dashboard']);
  }

  logout(): void {
    this.showLogoutModal = false;
    this.isLoggingOut = false;
    this.logoutError = null;

    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('userRole');
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
