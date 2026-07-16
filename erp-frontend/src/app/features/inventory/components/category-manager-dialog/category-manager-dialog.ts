import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CategoriesService } from '../../services/categories.service';
import { Category } from '../../interfaces/inventory.interfaces';

@Component({
  selector: 'app-category-manager-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './category-manager-dialog.html',
  styleUrl: './category-manager-dialog.scss',
})
export class CategoryManagerDialog {
  private readonly fb = inject(FormBuilder);
  private readonly categoriesService = inject(CategoriesService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<CategoryManagerDialog>);

  readonly categories = signal<Category[]>([]);
  readonly isLoading = signal(true);
  readonly isSubmitting = signal(false);
  /** Tracks category changes so the parent list can refresh if anything actually changed. */
  private didChange = false;

  readonly nameControl = this.fb.nonNullable.control('', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]);

  constructor() {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.categoriesService.list('INVENTORY').subscribe({
      next: (categories) => {
        this.categories.set(categories);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  add(): void {
    if (this.nameControl.invalid || this.isSubmitting()) {
      this.nameControl.markAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.categoriesService.create({ name: this.nameControl.value.trim(), type: 'INVENTORY' }).subscribe({
      next: (category) => {
        this.categories.update((list) => [...list, category].sort((a, b) => a.name.localeCompare(b.name)));
        this.nameControl.reset('');
        this.isSubmitting.set(false);
        this.didChange = true;
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        const message = error.status === 409 ? 'Já existe uma categoria com esse nome.' : 'Não foi possível criar a categoria.';
        this.snackBar.open(message, 'Fechar', { duration: 4000 });
      },
    });
  }

  remove(category: Category): void {
    this.categoriesService.remove(category.id).subscribe({
      next: () => {
        this.categories.update((list) => list.filter((c) => c.id !== category.id));
        this.didChange = true;
      },
      error: () => this.snackBar.open('Não foi possível excluir a categoria.', 'Fechar', { duration: 4000 }),
    });
  }

  close(): void {
    this.dialogRef.close(this.didChange);
  }
}
