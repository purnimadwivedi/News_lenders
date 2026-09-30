import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="login-container">
      <!-- Background Ambient Network Graphic -->
      <svg class="network-bg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 900" preserveAspectRatio="none">
        <defs>
          <radialGradient id="netGlow" cx="60%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#fff8f0" stop-opacity="0.42"/>
            <stop offset="60%" stop-color="#d4956d" stop-opacity="0.22"/>
            <stop offset="100%" stop-color="#aa7956" stop-opacity="0"/>
          </radialGradient>
          <radialGradient id="bottomGlow" cx="15%" cy="85%" r="45%">
            <stop offset="0%" stop-color="#fff5ed" stop-opacity="0.5"/>
            <stop offset="100%" stop-color="#aa7956" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <circle cx="850" cy="450" r="380" fill="url(#netGlow)" />
        <circle cx="200" cy="750" r="300" fill="url(#bottomGlow)" />
        
        <!-- Faint topographic contour ridges (from swatch) -->
        <g stroke="rgba(255,255,255,0.22)" stroke-width="1.2" fill="none">
          <path d="M 680 180 Q 740 220 720 280 T 660 380 T 580 430 Q 520 400 540 330 T 610 240 Z" stroke-dasharray="2,4" />
          <path d="M 720 160 Q 800 210 770 290 T 700 400 T 590 460 Q 500 420 520 320 T 620 210 Z" stroke-dasharray="1,5" stroke="rgba(255,255,255,0.14)" />
          <path d="M 380 480 Q 420 520 400 560 T 340 620 Q 280 600 300 540 Z" stroke-dasharray="2,3" stroke="rgba(255,255,255,0.18)" />
          <circle cx="510" cy="230" r="38" stroke="rgba(255,255,255,0.16)" stroke-dasharray="3,3" />
          <circle cx="790" cy="380" r="65" stroke="rgba(255,255,255,0.12)" stroke-dasharray="4,4" />
        </g>

        <!-- Network Constellation -->
        <g stroke="rgba(255,255,255,0.22)" stroke-width="1" fill="none">
          <circle cx="200" cy="180" r="3" fill="rgba(255,255,255,0.6)" />
          <circle cx="340" cy="260" r="4" fill="rgba(255,255,255,0.65)" />
          <circle cx="480" cy="210" r="3" fill="rgba(255,255,255,0.5)" />
          <circle cx="650" cy="320" r="5" fill="rgba(255,255,255,0.75)" />
          <circle cx="780" cy="240" r="4" fill="rgba(255,255,255,0.6)" />
          <circle cx="920" cy="380" r="5" fill="rgba(255,255,255,0.75)" />
          <circle cx="1050" cy="290" r="3" fill="rgba(255,255,255,0.5)" />
          <circle cx="560" cy="460" r="4" fill="rgba(255,255,255,0.65)" />
          <circle cx="420" cy="540" r="3" fill="rgba(255,255,255,0.5)" />
          <circle cx="720" cy="580" r="5" fill="rgba(255,255,255,0.65)" />
          <circle cx="880" cy="620" r="4" fill="rgba(255,255,255,0.6)" />
          <line x1="200" y1="180" x2="340" y2="260" />
          <line x1="340" y1="260" x2="480" y2="210" />
          <line x1="480" y1="210" x2="650" y2="320" />
          <line x1="650" y1="320" x2="780" y2="240" />
          <line x1="780" y1="240" x2="920" y2="380" />
          <line x1="920" y1="380" x2="1050" y2="290" />
          <line x1="480" y1="210" x2="560" y2="460" />
          <line x1="560" y1="460" x2="420" y2="540" />
          <line x1="560" y1="460" x2="720" y2="580" />
          <line x1="650" y1="320" x2="720" y2="580" />
          <line x1="720" y1="580" x2="880" y2="620" />
          <line x1="920" y1="380" x2="880" y2="620" />
          <circle cx="950" cy="480" r="240" stroke="rgba(255,255,255,0.15)" stroke-dasharray="6,6" />
          <polygon points="620,290 670,270 700,320 670,360 620,340" stroke="rgba(255,255,255,0.16)" />
          <polygon points="850,560 900,530 940,570 910,620 860,600" stroke="rgba(255,255,255,0.16)" />
        </g>
      </svg>

      <!-- Left Hero Column -->
      <div class="login-left">
        <div class="brand-bar">
          <div class="logo-box">
            <img src="/public/images/1631310679243.jfif" alt="IMGC Logo" />
          </div>
          <span class="portal-title">IMGC Lender News Portal</span>
        </div>

        <div class="hero-content">
          <h1 class="hero-title">Real-time news <span class="highlight">of every lender.</span></h1>
          <p class="hero-subtitle">
            Track, monitor, and analyze market news, regulatory updates, and risk signals with complete visibility, all in one place.
          </p>
        </div>

        <div class="security-section">
          <div class="sec-label">SECURITY &amp; COMPLIANCE</div>
          <div class="sec-badges">
            <div class="sec-badge">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>ISO 27001</span>
            </div>
            <div class="sec-badge">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              <span>SOC 2 Type II</span>
            </div>
            <div class="sec-badge">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span>AES-256</span>
            </div>
            <div class="sec-badge">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
              </svg>
              <span>MFA Enforced</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Login Card Column with Glass Transparency -->
      <div class="login-right">
        <div class="login-card">
          <h2 class="card-title">Welcome Back</h2>
          <p class="card-subtitle">Sign in to your IMGC Lender News Portal account</p>

          <div class="form-group">
            <label>Employee ID or Email</label>
            <div class="input-wrapper">
              <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <input type="text" placeholder="EMP-0001  or  you@lender.com" />
            </div>
            <p class="help-text">
              IMGC staff sign in with an Employee ID and password. Lender users sign in with their work email — we send a one-time code.
            </p>
          </div>

          <button class="btn-continue" (click)="login('admin')">
            <span>Continue</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>

          <div class="demo-section">
            <p class="demo-prompt">Need demo access? <strong>Enter Demo Mode</strong></p>
            <div class="demo-buttons">
              <button class="btn-demo" (click)="login('admin')">Demo as Admin</button>
              <button class="btn-demo" (click)="login('user')">Demo as User</button>
            </div>
          </div>
        </div>

        <div class="footer-note">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span>Protected workspace · access is granted by IMGC</span>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class LoginComponent {
  private auth = inject(AuthService);

  login(role: string) {
    this.auth.login(role);
  }
}

