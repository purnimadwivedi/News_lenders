import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../auth.service';
import { DEFAULT_AUTH_LOGO } from '../auth-logo';

const DEFAULT_AUTH_TITLE = 'IMGC Lender News Portal';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="login-container">
      
      <!-- Subtle Ambient Background Network Graphic matching image -->
      <svg class="network-bg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="centerGlow" cx="60%" cy="50%" r="55%">
            <stop offset="0%" stop-color="#fff5eb" stop-opacity="0.25"/>
            <stop offset="50%" stop-color="#c8875b" stop-opacity="0.15"/>
            <stop offset="100%" stop-color="#9b5c35" stop-opacity="0"/>
          </radialGradient>
        </defs>

        <rect width="1440" height="900" fill="url(#centerGlow)" />

        <!-- Topographic delicate ridges -->
        <g stroke="rgba(255,255,255,0.18)" stroke-width="1" fill="none">
          <path d="M 450 140 Q 560 190 530 280 T 480 410 T 360 480 Q 280 430 310 320 T 410 200 Z" stroke-dasharray="2,3" />
          <path d="M 520 120 Q 640 180 610 300 T 540 440 T 390 520 Q 270 460 300 300 T 430 170 Z" stroke-dasharray="1,4" stroke="rgba(255,255,255,0.12)" />
          <path d="M 720 220 Q 820 290 780 390 T 690 510 Q 580 490 610 390 Z" stroke-dasharray="2,4" stroke="rgba(255,255,255,0.14)" />
          <circle cx="480" cy="280" r="45" stroke="rgba(255,255,255,0.15)" stroke-dasharray="3,3" />
          <circle cx="860" cy="460" r="75" stroke="rgba(255,255,255,0.1)" stroke-dasharray="4,4" />
        </g>

        <!-- Network Constellation Lines and Dots -->
        <g stroke="rgba(255,255,255,0.28)" stroke-width="1.2" fill="none">
          <!-- Connecting lines -->
          <line x1="200" y1="180" x2="340" y2="280" />
          <line x1="340" y1="280" x2="480" y2="230" />
          <line x1="480" y1="230" x2="650" y2="350" />
          <line x1="650" y1="350" x2="780" y2="270" />
          <line x1="780" y1="270" x2="940" y2="400" />
          <line x1="940" y1="400" x2="1080" y2="310" />
          <line x1="480" y1="230" x2="560" y2="500" />
          <line x1="560" y1="500" x2="720" y2="620" />
          <line x1="720" y1="620" x2="880" y2="650" />
          <line x1="650" y1="350" x2="720" y2="620" />
          <line x1="940" y1="400" x2="880" y2="650" />

          <!-- Network Dots -->
          <circle cx="200" cy="180" r="3.5" fill="rgba(255,255,255,0.75)" />
          <circle cx="340" cy="280" r="4.5" fill="rgba(255,255,255,0.85)" />
          <circle cx="480" cy="230" r="3.5" fill="rgba(255,255,255,0.7)" />
          <circle cx="650" cy="350" r="5.5" fill="rgba(255,255,255,0.9)" />
          <circle cx="780" cy="270" r="4.5" fill="rgba(255,255,255,0.75)" />
          <circle cx="940" cy="400" r="5.5" fill="rgba(255,255,255,0.9)" />
          <circle cx="1080" cy="310" r="4" fill="rgba(255,255,255,0.6)" />
          <circle cx="560" cy="500" r="4.5" fill="rgba(255,255,255,0.7)" />
          <circle cx="720" cy="620" r="5" fill="rgba(255,255,255,0.8)" />
          <circle cx="880" cy="650" r="4.5" fill="rgba(255,255,255,0.75)" />
        </g>
      </svg>

      <!-- Left Column: Hero & Branding -->
      <div class="login-left">
        <!-- Brand Header Bar -->
        <div class="brand-bar">
          <div class="logo-box">
            <img [src]="authLogo" (error)="onLogoError($event)" alt="IMGC Logo" />
          </div>
          <span class="portal-title">{{ portalTitle }}</span>
        </div>

        <!-- Hero Headline & Subtitle -->
        <div class="hero-content">
          <h1 class="hero-title">
            Real-time news <span class="highlight">of</span><br>
            <span class="highlight">every lender.</span>
          </h1>
          <p class="hero-subtitle">
            Track, monitor, and analyze market news, regulatory updates, and risk signals with complete visibility, all in one place.
          </p>
        </div>

        <!-- Security & Compliance Section -->
        <div class="security-section">
          <div class="sec-label">SECURITY &amp; COMPLIANCE</div>
          <div class="sec-badges">
            <div class="sec-badge">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>ISO 27001</span>
            </div>

            <div class="sec-badge">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <polyline points="9 12 11 14 15 10"/>
              </svg>
              <span>SOC 2 Type II</span>
            </div>

            <div class="sec-badge">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span>AES-256</span>
            </div>

            <div class="sec-badge">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
              </svg>
              <span>MFA Enforced</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column: Login Card & Protected Note -->
      <div class="login-right">
        <div class="login-card">
          <h2 class="card-title">Welcome Back</h2>
          <p class="card-subtitle">Sign in to your IMGC Lender News Portal account</p>

          <div class="form-group">
            <label for="empIdInput">Employee ID or Email</label>
            <div class="input-wrapper">
              <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <input id="empIdInput" type="text" placeholder="EMP-0001 or you@lender.com" />
            </div>
            <p class="help-text">
              IMGC staff sign in with an Employee ID and password. Lender users sign in with their work email — we send a one-time code.
            </p>
          </div>

          <button class="btn-continue" (click)="login('admin')">
            <span>Continue</span>
            <span class="arrow-sym">&rarr;</span>
          </button>

          <div class="demo-section">
            <p class="demo-prompt">Need demo access? <strong>Enter Demo Mode</strong></p>
            <div class="demo-buttons">
              <button type="button" class="btn-demo" (click)="login('admin')">Demo as Admin</button>
              <button type="button" class="btn-demo" (click)="login('user')">Demo as User</button>
            </div>
          </div>
        </div>

        <!-- Pill note at bottom of card -->
        <div class="footer-note">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span>Protected workspace · access is granted by IMGC</span>
        </div>
      </div>

    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100vw;
      height: 100vh;
      overflow: hidden;
    }

    .login-container {
      display: flex;
      width: 100vw;
      height: 100vh;
      background: 
        radial-gradient(circle at 65% 45%, rgba(255, 235, 215, 0.22) 0%, transparent 45%),
        radial-gradient(circle at 20% 75%, rgba(255, 240, 225, 0.28) 0%, transparent 40%),
        linear-gradient(135deg, #c79067 0%, #ba7e54 30%, #ac6f46 65%, #92542d 100%);
      position: relative;
      overflow: hidden;
      box-sizing: border-box;
      font-family: inherit;
    }

    .network-bg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1;
      opacity: 0.95;
    }

    /* ----------------------------------------------------
       Left Column
       ---------------------------------------------------- */
    .login-left {
      flex: 1.25;
      position: relative;
      z-index: 10;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 3.5rem 4.5rem;
      box-sizing: border-box;
      height: 100vh;
    }

    .brand-bar {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .logo-box {
      background: #ffffff;
      border-radius: 12px;
      padding: 5px;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.1);
      flex-shrink: 0;
      box-sizing: border-box;
    }

    .logo-box img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }

    .portal-title {
      font-size: 1.15rem;
      font-weight: 700;
      color: #0f172a;
      letter-spacing: -0.01em;
    }

    .hero-content {
      margin: auto 0;
      max-width: 580px;
    }

    .hero-title {
      font-size: 3.35rem;
      font-weight: 800;
      line-height: 1.15;
      margin: 0 0 1.25rem 0;
      color: #0f172a;
      letter-spacing: -0.025em;
    }

    .hero-title .highlight {
      color: #f26422;
      font-weight: 800;
      display: inline-block;
      -webkit-text-stroke: 1.2px #ffffff;
      paint-order: stroke fill;
      text-shadow: 
        0 0 1px #ffffff,
        0 0 10px rgba(255, 255, 255, 0.85),
        0 0 20px rgba(255, 255, 255, 0.5);
    }

    .hero-subtitle {
      font-size: 1.15rem;
      line-height: 1.55;
      color: #1e293b;
      margin: 0;
      font-weight: 500;
      max-width: 520px;
    }

    .security-section {
      margin-top: 1.5rem;
    }

    .sec-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1.4px;
      color: #1e293b;
      margin-bottom: 10px;
      text-transform: uppercase;
    }

    .sec-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
    }

    .sec-badge {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      background: rgba(255, 250, 245, 0.72);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      color: #1e293b;
      border: 1px solid rgba(255, 255, 255, 0.65);
      box-shadow: 0 2px 8px rgba(110, 60, 25, 0.05);
    }

    .sec-badge svg {
      color: #ea580c;
    }

    /* ----------------------------------------------------
       Right Column
       ---------------------------------------------------- */
    .login-right {
      flex: 1;
      position: relative;
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2.5rem 4rem;
      box-sizing: border-box;
      height: 100vh;
    }

    .login-card {
      background: rgba(255, 250, 245, 0.86);
      backdrop-filter: blur(28px);
      -webkit-backdrop-filter: blur(28px);
      border-radius: 24px;
      padding: 34px 34px 28px 34px;
      width: 100%;
      max-width: 430px;
      box-shadow: 0 20px 48px -10px rgba(90, 48, 18, 0.18), 0 0 0 1px rgba(255, 255, 255, 0.8) inset;
      border: 1.5px solid rgba(255, 255, 255, 0.85);
      box-sizing: border-box;
    }

    .card-title {
      font-size: 1.85rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 6px 0;
      text-align: center;
      letter-spacing: -0.015em;
    }

    .card-subtitle {
      color: #64748b;
      font-size: 0.9rem;
      text-align: center;
      margin: 0 0 1.85rem 0;
    }

    .form-group {
      margin-bottom: 1.35rem;
    }

    .form-group label {
      display: block;
      font-size: 0.825rem;
      font-weight: 700;
      color: #334155;
      margin-bottom: 7px;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 14px;
      color: #94a3b8;
      pointer-events: none;
    }

    .input-wrapper input {
      width: 100%;
      padding: 12px 14px 12px 42px;
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      border-radius: 10px;
      font-size: 0.925rem;
      color: #0f172a;
      outline: none;
      transition: all 0.2s ease;
      box-sizing: border-box;
      font-family: inherit;
    }

    .input-wrapper input::placeholder {
      color: #94a3b8;
      font-size: 0.88rem;
    }

    .input-wrapper input:focus {
      border-color: #ea580c;
      box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.18);
    }

    .help-text {
      font-size: 0.785rem;
      color: #64748b;
      line-height: 1.5;
      margin: 9px 0 0 0;
    }

    .btn-continue {
      width: 100%;
      background: linear-gradient(135deg, #f26422 0%, #e05307 100%);
      color: #ffffff;
      border: none;
      padding: 13px;
      border-radius: 10px;
      font-size: 0.98rem;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: 0 5px 16px rgba(230, 90, 18, 0.35);
      transition: all 0.2s ease;
      font-family: inherit;
    }

    .btn-continue:hover {
      background: linear-gradient(135deg, #e05307 0%, #c84600 100%);
      transform: translateY(-1px);
      box-shadow: 0 7px 20px rgba(230, 90, 18, 0.42);
    }

    .btn-continue:active {
      transform: translateY(1px);
    }

    .arrow-sym {
      font-size: 1.15rem;
      line-height: 1;
    }

    .demo-section {
      margin-top: 1.75rem;
      padding-top: 1.25rem;
      border-top: 1px solid rgba(226, 232, 240, 0.85);
      text-align: center;
    }

    .demo-prompt {
      font-size: 0.825rem;
      color: #64748b;
      margin: 0 0 10px 0;
    }

    .demo-prompt strong {
      color: #0f172a;
      font-weight: 700;
    }

    .demo-buttons {
      display: flex;
      gap: 10px;
    }

    .btn-demo {
      flex: 1;
      background: #ffffff;
      border: 1.5px solid #cbd5e1;
      padding: 10px 12px;
      border-radius: 10px;
      font-size: 0.85rem;
      font-weight: 700;
      color: #1e293b;
      cursor: pointer;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      transition: all 0.15s ease;
      font-family: inherit;
    }

    .btn-demo:hover {
      background: #f8fafc;
      border-color: #94a3b8;
      transform: translateY(-1px);
    }

    /* ----------------------------------------------------
       Bottom Protected Note Pill
       ---------------------------------------------------- */
    .footer-note {
      margin-top: 18px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8rem;
      font-weight: 500;
      color: #ffffff;
      background: rgba(186, 122, 82, 0.62);
      border: 1px solid rgba(255, 255, 255, 0.42);
      padding: 8px 22px;
      border-radius: 9999px;
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      box-shadow: 0 4px 14px rgba(70, 30, 10, 0.12);
    }

    .footer-note svg {
      color: #ffffff;
    }

    @media (max-width: 1023px) {
      :host {
        height: auto;
        overflow-y: auto;
      }
      .login-container {
        flex-direction: column;
        height: auto;
        min-height: 100vh;
        overflow-y: auto;
      }
      .login-left {
        height: auto;
        padding: 2.5rem 2rem 1.5rem 2rem;
      }
      .hero-content {
        margin: 2rem 0;
      }
      .hero-title {
        font-size: 2.5rem;
      }
      .login-right {
        height: auto;
        padding: 1.5rem 2rem 3rem 2rem;
      }
    }
  `]
})
export class LoginComponent {
  private auth = inject(AuthService);
  authLogo = DEFAULT_AUTH_LOGO;
  readonly portalTitle = DEFAULT_AUTH_TITLE;

  onLogoError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img && img.src !== DEFAULT_AUTH_LOGO) {
      img.src = DEFAULT_AUTH_LOGO;
    }
  }

  login(role: string) {
    this.auth.login(role);
  }
}

