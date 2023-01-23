import { Injectable } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { isNil as _isNil } from 'lodash';

import { LoadingComponent } from './loading.component';

/**
 * Loading管理Service
 */
@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  /** OverlayView */
  private ref?: OverlayRef;

  /**
   * Loading表示中
   */
  get isShown() {
    return !_isNil(this.ref);
  }

  constructor(private readonly overlay: Overlay) {}

  /**
   * Loadingを表示する
   */
  show() {
    if (!this.ref) {
      this.ref = this._createOverlay();
      this.ref.attach(new ComponentPortal(LoadingComponent));
    }
  }

  /**
   * Loadingを閉じる
   */
  hide() {
    if (this.ref) {
      this.ref.detach();
      this.ref.dispose();
      this.ref = undefined;
    }
  }

  /**
   * Overlay領域を生成する
   */
  private _createOverlay() {
    return this.overlay.create({
      width: '100%',
      height: '100%',
      hasBackdrop: false,
      panelClass: 'app-loading-indicator',
      backdropClass: 'app-loading-indicator-backdrop',
    });
  }
}
