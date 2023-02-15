import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ImageRefPageRoutingModule } from './image-ref-page-routing.module';
import { ImageRefPageComponent } from './image-ref-page.component';
import { MaterialModule } from '../../lib/material';
import { ImageDetailModule, ImageListModule } from '../../feature';

@NgModule({
  declarations: [ImageRefPageComponent],
  imports: [
    CommonModule,

    MaterialModule,
    ImageRefPageRoutingModule,
    ImageDetailModule,
    ImageListModule,
  ],
})
export class ImageRefPageModule {}
