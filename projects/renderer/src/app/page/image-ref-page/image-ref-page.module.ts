import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxMatCounterspinnerModule } from 'ngx-mat-counterspinner';

import { ImageRefPageRoutingModule } from './image-ref-page-routing.module';
import { ImageRefPageComponent } from './image-ref-page.component';
import { MaterialModule } from '../../lib/material';
import {
  ImageDetailModule,
  ImageSelectModule,
  LoadingModule,
} from '../../feature';

@NgModule({
  declarations: [ImageRefPageComponent],
  imports: [
    CommonModule,
    NgxMatCounterspinnerModule,

    MaterialModule,
    ImageRefPageRoutingModule,
    ImageDetailModule,
    ImageSelectModule,
    LoadingModule,
  ],
})
export class ImageRefPageModule {}
