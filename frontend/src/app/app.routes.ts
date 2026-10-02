import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard.component';
import { NewsListComponent } from './pages/news-list.component';
import { CompaniesComponent } from './pages/companies.component';
import { RecipientsComponent } from './pages/recipients.component';
import { RunsComponent } from './pages/runs.component';
import { SettingsComponent } from './pages/settings.component';
import { LoginComponent } from './pages/login.component';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'news', component: NewsListComponent, canActivate: [authGuard] },
  { path: 'companies', component: CompaniesComponent, canActivate: [authGuard] },
  { path: 'recipients', component: RecipientsComponent, canActivate: [authGuard] },
  { path: 'runs', component: RunsComponent, canActivate: [authGuard] },
  { path: 'settings', component: SettingsComponent, canActivate: [authGuard], title: 'LLM Configuration - Lender News' },
  { path: '**', redirectTo: 'dashboard' }
];

