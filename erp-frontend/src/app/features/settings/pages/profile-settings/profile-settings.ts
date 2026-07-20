import { Component, ElementRef, OnInit, inject, signal, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../../core/services/auth.service';
import { environment } from '../../../../../environments/environment';
import { SettingsTabs } from '../../components/settings-tabs/settings-tabs';
import { UsersService } from '../../services/users.service';
import { UserProfile } from '../../interfaces/settings.interfaces';

@Component({
  selector: 'app-profile-settings-page',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    SettingsTabs,
  ],
  templateUrl: './profile-settings.html',
  styleUrl: './profile-settings.scss',
})
export class ProfileSettingsPage implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly usersService = inject(UsersService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly avatarInput = viewChild<ElementRef<HTMLInputElement>>('avatarInput');

  readonly filesBaseUrl = environment.filesBaseUrl;

  readonly isLoading = signal(true);
  readonly hasError = signal(false);
  readonly isSaving = signal(false);
  readonly isUploadingAvatar = signal(false);
  readonly email = signal('');
  readonly role = signal('');
  readonly avatarUrl = signal<string | null>(null);
  readonly initials = signal('');

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.usersService.getMe().subscribe({
      next: (profile) => {
        this.applyProfile(profile);
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
    this.usersService.updateMe({ name: this.form.getRawValue().name }).subscribe({
      next: (profile) => {
        this.applyProfile(profile);
        this.authService.updateCurrentUser({ name: profile.name });
        this.isSaving.set(false);
        this.snackBar.open('Perfil atualizado.', 'Fechar', { duration: 3000 });
      },
      error: (error: HttpErrorResponse) => {
        this.isSaving.set(false);
        this.snackBar.open(this.resolveErrorMessage(error), 'Fechar', { duration: 6000 });
      },
    });
  }

  triggerAvatarUpload(): void {
    this.avatarInput()?.nativeElement.click();
  }

  onAvatarSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.isUploadingAvatar.set(true);
    this.usersService.uploadAvatar(file).subscribe({
      next: (profile) => {
        this.applyProfile(profile);
        this.authService.updateCurrentUser({ avatarUrl: profile.avatarUrl });
        this.isUploadingAvatar.set(false);
        this.snackBar.open('Foto de perfil atualizada.', 'Fechar', { duration: 3000 });
      },
      error: () => {
        this.isUploadingAvatar.set(false);
        this.snackBar.open('Não foi possível enviar a foto.', 'Fechar', { duration: 4000 });
      },
    });

    input.value = '';
  }

  private applyProfile(profile: UserProfile): void {
    this.form.patchValue({ name: profile.name });
    this.email.set(profile.email);
    this.role.set(profile.role);
    this.avatarUrl.set(profile.avatarUrl ? `${this.filesBaseUrl}${profile.avatarUrl}` : null);
    this.initials.set(
      profile.name
        .split(' ')
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join(''),
    );
  }

  private resolveErrorMessage(error: HttpErrorResponse): string {
    if (error.status === 400) {
      const backendMessage = (error.error as { message?: string | string[] } | null)?.message;
      if (Array.isArray(backendMessage) && backendMessage.length > 0) {
        return backendMessage.join(' ');
      }
      if (typeof backendMessage === 'string') {
        return backendMessage;
      }
    }
    return 'Não foi possível salvar o perfil.';
  }
}
