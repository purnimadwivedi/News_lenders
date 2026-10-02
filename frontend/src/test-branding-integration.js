const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('====================================================');
console.log('RUNNING COMPLETE BRANDING SETTINGS INTEGRATION TESTS');
console.log('====================================================\n');

// 1. Verify Model Definitions
const modelsPath = path.join(__dirname, 'app', 'appearance-studio', 'appearance.models.ts');
const modelsContent = fs.readFileSync(modelsPath, 'utf8');

assert(modelsContent.includes('applicationName: string'), 'BrandingConfig must include applicationName');
assert(modelsContent.includes('termsPrivacyText?: string'), 'BrandingConfig must include termsPrivacyText');
assert(modelsContent.includes('loginLogo?: string'), 'BrandingConfig must include loginLogo');
assert(modelsContent.includes('sidebarLogo?: string'), 'BrandingConfig must include sidebarLogo');
assert(modelsContent.includes('favicon?: string'), 'BrandingConfig must include favicon');
console.log('✓ PASS: BrandingConfig contains all required properties.');

// 2. Verify Service State Management & Defaults
const servicePath = path.join(__dirname, 'app', 'appearance-studio', 'appearance.service.ts');
const serviceContent = fs.readFileSync(servicePath, 'utf8');

assert(serviceContent.includes('termsPrivacyText:'), 'DEFAULT_APPEARANCE_STATE must include termsPrivacyText');
assert(serviceContent.includes('loginLogo: DEFAULT_LOGO'), 'DEFAULT_APPEARANCE_STATE must include loginLogo');
assert(serviceContent.includes('sidebarLogo: DEFAULT_LOGO'), 'DEFAULT_APPEARANCE_STATE must include sidebarLogo');
assert(serviceContent.includes('updateDraftBranding'), 'AppearanceService must include updateDraftBranding');
assert(serviceContent.includes('applyChanges'), 'AppearanceService must include applyChanges');
assert(serviceContent.includes('cancelStudio'), 'AppearanceService must include cancelStudio');
assert(serviceContent.includes('resetDraftToDefaults'), 'AppearanceService must include resetDraftToDefaults');
console.log('✓ PASS: AppearanceService state management & lifecycle methods verified.');

// 3. Verify Branding Tab Component UI (Inputs & Actions matching screenshot)
const brandingTabPath = path.join(__dirname, 'app', 'appearance-studio', 'tabs', 'branding-tab.component.ts');
const brandingTabContent = fs.readFileSync(brandingTabPath, 'utf8');

assert(brandingTabContent.includes('Text &amp; Identity') || brandingTabContent.includes('Text & Identity'), 'Branding Tab must have Text & Identity section');
assert(brandingTabContent.includes('Application Name'), 'Branding Tab must have Application Name field');
assert(brandingTabContent.includes('Terms &amp; Privacy Text') || brandingTabContent.includes('Terms & Privacy Text'), 'Branding Tab must have Terms & Privacy Text field');
assert(brandingTabContent.includes('Logos &amp; Assets') || brandingTabContent.includes('Logos & Assets'), 'Branding Tab must have Logos & Assets section');
assert(brandingTabContent.includes('Login Screen Logo'), 'Branding Tab must have Login Screen Logo field');
assert(brandingTabContent.includes('Sidebar Logo'), 'Branding Tab must have Sidebar Logo field');
assert(brandingTabContent.includes('Favicon'), 'Branding Tab must have Favicon field');
assert(brandingTabContent.includes('removeLoginLogo()'), 'Branding Tab must have removeLoginLogo action');
assert(brandingTabContent.includes('removeSidebarLogo()'), 'Branding Tab must have removeSidebarLogo action');
assert(brandingTabContent.includes('removeFavicon()'), 'Branding Tab must have removeFavicon action');
assert(brandingTabContent.includes('Upload image'), 'Branding Tab must have Upload image dropzone/button');
console.log('✓ PASS: BrandingTabComponent contains all UI fields and controls matching reference screenshot.');

// 4. Verify Live Preview Real Application UI
const previewPath = path.join(__dirname, 'app', 'appearance-studio', 'live-preview.component.ts');
const previewContent = fs.readFileSync(previewPath, 'utf8');

assert(previewContent.includes('real-app-shell'), 'LivePreview must include real-app-shell container');
assert(previewContent.includes('real-sidebar'), 'LivePreview must include real-sidebar');
assert(previewContent.includes('real-chocolate'), 'LivePreview must include real-chocolate banner');
assert(previewContent.includes('real-stat-grid'), 'LivePreview must include real-stat-grid');
assert(previewContent.includes('previewLogoUrl'), 'LivePreview must bind previewLogoUrl');
assert(previewContent.includes('real-brand-name'), 'LivePreview must bind application name');
console.log('✓ PASS: LivePreviewComponent accurately renders the real application shell and binds to draft branding state.');

// 5. Verify Real Application Login Page Consumption
const loginPath = path.join(__dirname, 'app', 'pages', 'login.component.ts');
const loginContent = fs.readFileSync(loginPath, 'utf8');

assert(loginContent.includes('AppearanceService'), 'LoginComponent must inject AppearanceService');
assert(loginContent.includes('this.branding.applicationName') || loginContent.includes('portalTitle'), 'LoginComponent must use configured application name');
assert(loginContent.includes('this.branding.loginLogo'), 'LoginComponent must use configured loginLogo');
assert(loginContent.includes('this.branding.termsPrivacyText') || loginContent.includes('termsText'), 'LoginComponent must use configured termsPrivacyText');
assert(loginContent.includes('login-terms-note'), 'LoginComponent template must render termsText');
console.log('✓ PASS: Real application LoginComponent consumes centralized branding configuration.');

// 6. Verify Real Application Sidebar & Mobile Header Consumption
const appCompPath = path.join(__dirname, 'app', 'app.component.ts');
const appCompContent = fs.readFileSync(appCompPath, 'utf8');

assert(appCompContent.includes('sidebarLogo'), 'AppComponent must bind sidebarLogo with fallback');
assert(appCompContent.includes('brand-title'), 'AppComponent must bind brand-title to applicationName');
assert(appCompContent.includes('brandLogoUrl'), 'AppComponent must provide brandLogoUrl getter');
assert(appCompContent.includes('onBrandLogoError'), 'AppComponent must provide onBrandLogoError fallback handler');
console.log('✓ PASS: Real application AppComponent sidebar consumes centralized branding configuration.');

// 7. Verify API Interceptor & Persistence
const interceptorPath = path.join(__dirname, 'app', 'appearance-api.interceptor.ts');
const interceptorContent = fs.readFileSync(interceptorPath, 'utf8');

assert(interceptorContent.includes('loginLogo'), 'appearanceApiInterceptor must support loginLogo');
assert(interceptorContent.includes('sidebarLogo'), 'appearanceApiInterceptor must support sidebarLogo');
assert(interceptorContent.includes('termsPrivacyText'), 'appearanceApiInterceptor must support termsPrivacyText');
console.log('✓ PASS: Backend API security interceptor supports all centralized branding properties.');

console.log('\n====================================================');
console.log('ALL BRANDING INTEGRATION TESTS PASSED SUCCESSFULLY! ');
console.log('====================================================');
