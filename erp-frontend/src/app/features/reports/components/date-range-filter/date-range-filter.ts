import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';

export interface DateRange {
  from: Date;
  to: Date;
}

@Component({
  selector: 'app-date-range-filter',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatDatepickerModule],
  templateUrl: './date-range-filter.html',
  styleUrl: './date-range-filter.scss',
})
export class DateRangeFilter implements OnInit {
  @Input({ required: true }) initialFrom!: Date;
  @Input({ required: true }) initialTo!: Date;
  @Output() readonly rangeChange = new EventEmitter<DateRange>();

  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    from: this.fb.nonNullable.control<Date | null>(null, Validators.required),
    to: this.fb.nonNullable.control<Date | null>(null, Validators.required),
  });

  ngOnInit(): void {
    this.form.setValue({ from: this.initialFrom, to: this.initialTo }, { emitEvent: false });

    this.form.valueChanges.pipe(debounceTime(300)).subscribe(({ from, to }) => {
      if (!from || !to || to < from) return;
      this.rangeChange.emit({ from, to });
    });
  }
}
