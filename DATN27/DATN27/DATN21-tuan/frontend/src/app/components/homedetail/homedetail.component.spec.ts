import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { HomeComponentDetail } from './homedetail.component';

describe('HomeComponent', () => {
  let component: HomeComponentDetail;
  let fixture: ComponentFixture<HomeComponentDetail>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HomeComponentDetail ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HomeComponentDetail);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});