import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PagePlaceholder } from './page-placeholder';

describe('PagePlaceholder', () => {
  let component: PagePlaceholder;
  let fixture: ComponentFixture<PagePlaceholder>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PagePlaceholder],
    }).compileComponents();

    fixture = TestBed.createComponent(PagePlaceholder);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
