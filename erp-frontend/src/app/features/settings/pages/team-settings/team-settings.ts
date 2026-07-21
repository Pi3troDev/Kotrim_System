import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SettingsTabs } from '../../components/settings-tabs/settings-tabs';
import { InviteTeamMemberDialog } from '../../components/invite-team-member-dialog/invite-team-member-dialog';
import { ConfirmDialog, ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog';
import { TeamService } from '../../services/team.service';
import { TeamMember } from '../../interfaces/team.interfaces';
import { PlanFeaturesService } from '../../../../core/services/plan-features.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-team-settings-page',
  imports: [MatTableModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatTooltipModule, SettingsTabs],
  templateUrl: './team-settings.html',
  styleUrl: './team-settings.scss',
})
export class TeamSettingsPage implements OnInit {
  private readonly teamService = inject(TeamService);
  private readonly planFeatures = inject(PlanFeaturesService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly displayedColumns = ['name', 'cargo', 'status', 'actions'];

  readonly members = signal<TeamMember[]>([]);
  readonly isLoading = signal(true);
  readonly hasError = signal(false);

  readonly activeCount = computed(() => this.members().filter((m) => m.isActive).length);
  readonly maxUsers = computed(() => this.planFeatures.currentSubscription()?.plan?.maxUsers ?? null);
  readonly currentUserId = computed(() => this.authService.currentUser()?.id);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.teamService.list().subscribe({
      next: (members) => {
        this.members.set(members);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.hasError.set(true);
      },
    });
  }

  openInviteDialog(): void {
    this.dialog
      .open(InviteTeamMemberDialog, { width: '460px' })
      .afterClosed()
      .subscribe((result: TeamMember | undefined) => {
        if (result) {
          this.snackBar.open(`Convite enviado para ${result.email}.`, 'Fechar', { duration: 4000 });
          this.load();
        }
      });
  }

  resendInvite(member: TeamMember): void {
    this.teamService.resendInvite(member.id).subscribe({
      next: () => this.snackBar.open(`Convite reenviado para ${member.email}.`, 'Fechar', { duration: 4000 }),
      error: () => this.snackBar.open('Não foi possível reenviar o convite.', 'Fechar', { duration: 4000 }),
    });
  }

  confirmToggleActive(member: TeamMember): void {
    const data: ConfirmDialogData = member.isActive
      ? {
          title: 'Desativar acesso',
          message: `"${member.name}" não vai mais conseguir entrar no sistema. O histórico dela é mantido, e você pode reativar a qualquer momento.`,
          confirmLabel: 'Desativar',
          danger: true,
        }
      : {
          title: 'Reativar acesso',
          message: `"${member.name}" volta a conseguir entrar no sistema com o mesmo cargo de antes.`,
          confirmLabel: 'Reativar',
        };

    this.dialog
      .open(ConfirmDialog, { data, width: '420px' })
      .afterClosed()
      .subscribe((confirmed: boolean) => {
        if (!confirmed) return;

        this.teamService.update(member.id, { isActive: !member.isActive }).subscribe({
          next: () => {
            this.snackBar.open(member.isActive ? 'Acesso desativado.' : 'Acesso reativado.', 'Fechar', {
              duration: 3000,
            });
            this.load();
          },
          error: () =>
            this.snackBar.open('Não foi possível alterar o acesso dessa pessoa.', 'Fechar', { duration: 4000 }),
        });
      });
  }
}
