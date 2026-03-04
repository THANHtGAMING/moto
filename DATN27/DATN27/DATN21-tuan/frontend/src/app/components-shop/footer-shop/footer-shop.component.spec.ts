/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { FooterShopComponent } from './footer-shop.component';

describe('FooterShopComponent', () => {
  let component: FooterShopComponent;
  let fixture: ComponentFixture<FooterShopComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FooterShopComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FooterShopComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
