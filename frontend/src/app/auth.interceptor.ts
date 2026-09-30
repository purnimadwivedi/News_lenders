import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const role = auth.getRole();
  let modifiedReq = req;
  if (role) {
    modifiedReq = req.clone({
      setHeaders: {
        'X-User-Role': role
      }
    });
  }

  return next(modifiedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 || error.status === 403) {
        // Clear session and redirect on unauthorized/forbidden
        auth.confirmLogout();
        router.navigate(['/login'], { replaceUrl: true });
      }
      return throwError(() => error);
    })
  );
};
