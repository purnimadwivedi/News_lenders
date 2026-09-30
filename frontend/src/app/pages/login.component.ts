import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="login-container">
      <div class="login-left">
        <div class="left-content">
          <div class="brand">
            <div class="brand-logo-container">
              <span class="brand-text">Lender News</span>
            </div>
          </div>
          
          <h1 class="hero-title">One workspace <span>for every lender.</span></h1>
          <p class="hero-subtitle">
            Initiate, track and manage news classifications with complete visibility, all in one place.
          </p>

          <div class="badges">
            <div class="sec-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              ISO 27001
            </div>
            <div class="sec-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              SOC 2 Type II
            </div>
            <div class="sec-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              AES-256
            </div>
            <div class="sec-badge">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path></svg>
              MFA Enforced
            </div>
          </div>
        </div>
      </div>

      <div class="login-right">
        <div class="login-card">
          <h2 class="card-title">Welcome</h2>
          <p class="card-subtitle">Sign in to your Lender News account</p>

          <div class="form-group">
            <label>Email ID</label>
            <div class="input-wrapper">
              <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <input type="text" placeholder="e.g. User@gmail.com" />
            </div>
          </div>

          <button class="btn-primary" (click)="login('admin')">
            Continue
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </button>

          <div class="demo-section">
            <p>Need demo access? <strong>Enter Demo Mode</strong></p>
            <div class="demo-buttons">
              <button class="btn-outline" (click)="login('admin')">Demo as Admin</button>
              <button class="btn-outline" (click)="login('user')">Demo as User</button>
            </div>
          </div>
        </div>
        
        <div class="footer-note">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
          Protected workspace · access is granted by Admin
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      width: 100vw;
      margin: 0;
      padding: 0;
      overflow: hidden;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    
    .login-container {
      display: flex;
      height: 100vh;
      width: 100vw;
      background: linear-gradient(135deg, #d97706, #ea580c, #c2410c);
      position: relative;
    }

    /* Subtle background pattern/overlay */
    .login-container::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 60%);
      pointer-events: none;
    }

    /* Left Panel */
    .login-left {
      flex: 1.2;
      color: white;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 4rem;
      overflow: hidden;
    }

    .left-content {
      position: relative;
      z-index: 10;
      max-width: 600px;
    }

    .brand {
      margin-bottom: 4rem;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .brand-logo-container {
      background: white;
      color: #ea580c;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: 800;
      font-size: 20px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .hero-title {
      font-size: 3.5rem;
      font-weight: 800;
      line-height: 1.1;
      margin-bottom: 1.5rem;
      color: #fff;
    }

    .hero-title span {
      color: #fde68a;
    }

    .hero-subtitle {
      font-size: 1.25rem;
      line-height: 1.6;
      color: rgba(255, 255, 255, 0.9);
      margin-bottom: 4rem;
      font-weight: 400;
    }

    .badges {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: auto;
    }

    .sec-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    /* Right Panel */
    .login-right {
      flex: 1;
      background: transparent;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .login-card {
      background: white;
      border-radius: 16px;
      padding: 2.5rem;
      width: 100%;
      max-width: 440px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05), 0 4px 10px rgba(0,0,0,0.02);
      border: 1px solid #f1f5f9;
    }

    .card-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 8px 0;
      text-align: center;
    }

    .card-subtitle {
      color: #64748b;
      font-size: 0.95rem;
      text-align: center;
      margin: 0 0 2rem 0;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group label {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      color: #334155;
      margin-bottom: 8px;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 12px;
      color: #94a3b8;
    }

    .input-wrapper input {
      width: 100%;
      padding: 12px 12px 12px 40px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.95rem;
      outline: none;
      transition: all 0.2s;
      box-sizing: border-box;
    }

    .input-wrapper input:focus {
      border-color: #ea580c;
      box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.1);
    }

    .help-text {
      font-size: 0.8rem;
      color: #64748b;
      line-height: 1.5;
      margin-bottom: 2rem;
    }

    .btn-primary {
      width: 100%;
      background: #ea580c;
      color: white;
      border: none;
      padding: 14px;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: background 0.2s;
    }

    .btn-primary:hover {
      background: #c2410c;
    }

    .demo-section {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e2e8f0;
      text-align: center;
    }

    .demo-section p {
      font-size: 0.875rem;
      color: #64748b;
      margin: 0 0 12px 0;
    }

    .demo-buttons {
      display: flex;
      gap: 12px;
    }

    .btn-outline {
      flex: 1;
      background: white;
      border: 1px solid #cbd5e1;
      padding: 10px;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 600;
      color: #334155;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-outline:hover {
      background: #f8fafc;
      border-color: #94a3b8;
    }

    .footer-note {
      position: absolute;
      bottom: 2rem;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.8);
      background: rgba(0, 0, 0, 0.2);
      padding: 6px 12px;
      border-radius: 12px;
      backdrop-filter: blur(4px);
    }

    @media (max-width: 900px) {
      .login-container {
        flex-direction: column;
      }
      .login-left {
        padding: 2rem;
        flex: 0.6;
      }
      .hero-title {
        font-size: 2.5rem;
      }
      .badges {
        display: none; /* hide badges on small screens to save space */
      }
    }
  `]
})
export class LoginComponent {
  constructor(private router: Router) {}

  login(role: string) {
    localStorage.setItem('userRole', role);
    this.router.navigate(['/dashboard']);
  }
}
