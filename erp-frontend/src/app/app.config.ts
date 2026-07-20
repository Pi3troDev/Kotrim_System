import {
  ApplicationConfig,
  LOCALE_ID,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { subscriptionInterceptor } from './core/interceptors/subscription.interceptor';
import { initializeSession } from './core/config/app-initializer';
import { providePtBrPaginatorIntl } from './core/config/paginator-intl';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

registerLocaleData(localePt);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    // authInterceptor first: it must attach the token and get its shot at
    // refreshing a 401 before subscriptionInterceptor judges the response.
    provideHttpClient(withFetch(), withInterceptors([authInterceptor, subscriptionInterceptor])),
    provideAnimationsAsync(),
    provideAppInitializer(initializeSession),
    { provide: MatPaginatorIntl, useFactory: providePtBrPaginatorIntl },
    provideNativeDateAdapter(),
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' },
    { provide: LOCALE_ID, useValue: 'pt-BR' },
    provideClientHydration(withEventReplay()),
  ],
};
