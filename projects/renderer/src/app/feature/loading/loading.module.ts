import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxMatCounterspinnerModule } from 'ngx-mat-counterspinner';

import { MaterialModule } from '../../lib/material';
import { LoadingComponent } from './loading.component';

@NgModule({
  declarations: [LoadingComponent],
  imports: [CommonModule, MaterialModule, NgxMatCounterspinnerModule],
})
export class LoadingModule {}
