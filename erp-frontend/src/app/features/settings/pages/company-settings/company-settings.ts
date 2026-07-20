import { Component, ElementRef, OnInit, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DigitMaskDirective } from '../../../../shared/directives/digit-mask.directive';
import { BRAZILIAN_STATES } from '../../../../shared/constants/brazilian-states';
import { environment } from '../../../../../environments/environment';
import { SettingsTabs } from '../../components/settings-tabs/settings-tabs';
import { SettingsService } from '../../services/settings.service';
import { CompanySettings } from '../../interfaces/settings.interfaces';

const WEEKDAYS = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
];

@Component({
  selector: 'app-company-settings-page',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatIconModule,
    MatProgressSpinnerModule,
    DigitMaskDirective,
    SettingsTabs,
  ],
  templateUrl: './company-settings.html',
  styleUrl: './company-settings.scss',
})
export class CompanySettingsPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly settingsService = inject(SettingsService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly logoInput = viewChild<ElementRef<HTMLInputElement>>('logoInput');

  readonly brazilianStates = BRAZILIAN_STATES;
  readonly weekdays = WEEKDAYS;
  readonly filesBaseUrl = environment.filesBaseUrl;

  readonly isLoading = signal(true);
  readonly hasError = signal(false);
  readonly isSaving = signal(false);
  readonly isUploadingLogo = signal(false);
  readonly logoUrl = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    document: [''],
    email: ['', [Validators.email]],
    phone: [''],
    address: [''],
    city: [''],
    state: [''],
    zipCode: [''],
    businessHoursStart: [''],
    businessHoursEnd: [''],
    workDays: this.fb.nonNullable.control<number[]>([1, 2, 3, 4, 5]),
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.settingsService.getCompany().subscribe({
      next: (company) => {
        this.applyCompany(company);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.hasError.set(true);
      },
    });
  }

  save(): void {
    if (this.form.invalid || this.isSaving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const raw = this.form.getRawValue();

    this.settingsService
      .updateCompany({
        name: raw.name,
        document: raw.document || undefined,
        email: raw.email || undefined,
        phone: raw.phone || undefined,
        address: raw.address || undefined,
        city: raw.city || undefined,
        state: raw.state || undefined,
        zipCode: raw.zipCode || undefined,
        businessHoursStart: raw.businessHoursStart || undefined,
        businessHoursEnd: raw.businessHoursEnd || undefined,
        workDays: raw.workDays,
      })
      .subscribe({
        next: (company) => {
          this.applyCompany(company);
          this.isSaving.set(false);
          this.snackBar.open('Dados da empresa salvos.', 'Fechar', { duration: 3000 });
        },
        error: (error: HttpErrorResponse) => {
          this.isSaving.set(false);
          this.snackBar.open(this.resolveErrorMessage(error), 'Fechar', { duration: 6000 });
        },
      });
  }

  triggerLogoUpload(): void {
    this.logoInput()?.nativeElement.click();
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.isUploadingLogo.set(true);
    this.settingsService.uploadLogo(file).subscribe({
      next: (company) => {
        this.applyCompany(company);
        this.isUploadingLogo.set(false);
        this.snackBar.open('Logo atualizada.', 'Fechar', { duration: 3000 });
      },
      error: () => {
        this.isUploadingLogo.set(false);
        this.snackBar.open('Não foi possível enviar a logo.', 'Fechar', { duration: 4000 });
      },
    });

    input.value = '';
  }

  private applyCompany(company: CompanySettings): void {
    this.form.patchValue({
      name: company.name,
      document: company.document ?? '',
      email: company.email ?? '',
      phone: company.phone ?? '',
      address: company.address ?? '',
      city: company.city ?? '',
      state: company.state ?? '',
      zipCode: company.zipCode ?? '',
      businessHoursStart: company.businessHoursStart ?? '',
      businessHoursEnd: company.businessHoursEnd ?? '',
      workDays: company.workDays,
    });
    this.logoUrl.set(company.logoUrl ? `${this.filesBaseUrl}${company.logoUrl}` : null);
  }

  private resolveErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 409) {
      return 'Já existe uma empresa cadastrada com esse CNPJ/CPF.';
    }
    if (error.status === 403) {
      return 'Apenas administradores podem editar os dados da empresa.';
    }
    if (error.status === 400) {
      const backendMessage = (error.error as { message?: string | string[] } | null)?.message;
      if (Array.isArray(backendMessage) && backendMessage.length > 0) {
        return backendMessage.join(' ');
      }
      if (typeof backendMessage === 'string') {
        return backendMessage;
      }
    }
    return 'Não foi possível salvar os dados da empresa.';
  }
}
