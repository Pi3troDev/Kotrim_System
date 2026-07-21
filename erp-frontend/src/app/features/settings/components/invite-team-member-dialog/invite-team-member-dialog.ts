import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TeamService } from '../../services/team.service';
import { CargoOption, TeamMember } from '../../interfaces/team.interfaces';

@Component({
  selector: 'app-invite-team-member-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  templateUrl: './invite-team-member-dialog.html',
  styleUrl: './invite-team-member-dialog.scss',
})
export class InviteTeamMemberDialog implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly teamService = inject(TeamService);
  private readonly dialogRef = inject(MatDialogRef<InviteTeamMemberDialog>);
  private readonly snackBar = inject(MatSnackBar);

  readonly isLoadingCargos = signal(true);
  readonly isSubmitting = signal(false);
  readonly cargos = signal<CargoOption[]>([]);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    cargo: this.fb.nonNullable.control<CargoOption['key'] | null>(null, Validators.required),
  });

  ngOnInit(): void {
    this.teamService.listCargos().subscribe({
      next: (cargos) => {
        this.cargos.set(cargos);
        this.isLoadingCargos.set(false);
      },
      error: () => this.isLoadingCargos.set(false),
    });
  }

  submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const raw = this.form.getRawValue();

    this.teamService.invite({ name: raw.name, email: raw.email, cargo: raw.cargo! }).subscribe({
      next: (member: TeamMember) => this.dialogRef.close(member),
      error: (error: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.snackBar.open(this.resolveErrorMessage(error), 'Fechar', { duration: 6000 });
      },
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }

  private resolveErrorMessage(error: HttpErrorResponse): string {
    const body = error.error as { error?: string; message?: string | string[] } | null;

    if (error.status === 409) {
      return 'Já existe uma conta com este e-mail.';
    }
    if (body?.error === 'PLAN_LIMIT_REACHED' || body?.error === 'CARGO_REQUIRES_PLAN_UPGRADE') {
      return typeof body.message === 'string' ? body.message : 'Seu plano não permite essa ação.';
    }
    if (Array.isArray(body?.message) && body.message.length > 0) {
      return body.message.join(' ');
    }
    if (typeof body?.message === 'string') {
      return body.message;
    }
    return 'Não foi possível enviar o convite. Verifique os dados e tente novamente.';
  }
}
