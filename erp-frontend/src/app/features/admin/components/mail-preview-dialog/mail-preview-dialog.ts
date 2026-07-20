import { Component, OnInit, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpErrorResponse } from '@angular/common/http';
import { AdminService } from '../../services/admin.service';
import { AdminMailLogRow } from '../../interfaces/admin.interfaces';

export interface MailPreviewDialogData {
  log: AdminMailLogRow;
}

@Component({
  selector: 'app-mail-preview-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './mail-preview-dialog.html',
  styleUrl: './mail-preview-dialog.scss',
})
export class MailPreviewDialog implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<MailPreviewDialog, boolean>);
  readonly data = inject<MailPreviewDialogData>(MAT_DIALOG_DATA);

  readonly isLoading = signal(true);
  readonly hasError = signal(false);
  readonly isResending = signal(false);
  readonly subject = signal('');
  readonly redacted = signal(false);
  readonly previewUrl = signal<SafeResourceUrl | null>(null);

  ngOnInit(): void {
    this.adminService.previewMailLog(this.data.log.id).subscribe({
      next: (preview) => {
        this.subject.set(preview.subject);
        this.redacted.set(preview.redacted);

        // Rendered inside a sandboxed iframe via a blob URL.
        //
        // The HTML is ours, but it interpolates workshop names that came from a
        // signup form — dropping it into the DOM with innerHTML would make the
        // admin panel the one place that trusts them. The sandbox has no
        // allow-scripts and no allow-same-origin: even if something got through
        // the template's escaping, it lands in an origin that can reach nothing.
        const blob = new Blob([preview.html], { type: 'text/html' });
        this.previewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(blob)));

        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.hasError.set(true);
      },
    });
  }

  resend(): void {
    if (this.isResending()) return;
    this.isResending.set(true);

    this.adminService.resendMailLog(this.data.log.id).subscribe({
      next: () => {
        this.snackBar.open('E-mail reenviado.', 'Fechar', { duration: 4000 });
        this.dialogRef.close(true);
      },
      error: (error: HttpErrorResponse) => {
        this.isResending.set(false);
        const backendMessage = (error.error as { message?: string } | null)?.message;
        this.snackBar.open(backendMessage || 'Não foi possível reenviar.', 'Fechar', { duration: 6000 });
      },
    });
  }
}
