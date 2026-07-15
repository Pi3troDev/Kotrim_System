import { EnvironmentProviders, Provider } from '@angular/core';
import { provideRouter } from '@angular/router';

/** Applied to every spec by the unit-test builder — keeps individual specs free of router boilerplate. */
export default [provideRouter([])] satisfies Array<Provider | EnvironmentProviders>;
