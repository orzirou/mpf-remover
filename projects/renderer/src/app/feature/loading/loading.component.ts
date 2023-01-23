import { Component } from '@angular/core';
import { CounterSpinnerDisplayMode } from 'ngx-mat-counterspinner';

@Component({
  selector: 'lib-loading',
  templateUrl: './loading.component.html',
  styleUrls: ['./loading.component.scss'],
})
export class LoadingComponent {
  /** Template用 */
  readonly CounterSpinnerDisplayMode = CounterSpinnerDisplayMode;
}
