import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MaterialModule } from '../../lib/material';
import { ImageDetailComponent } from './image-detail.component';

@NgModule({
  declarations: [ImageDetailComponent],
  imports: [CommonModule, FormsModule, MaterialModule],
  exports: [ImageDetailComponent],
})
export class ImageDetailModule {}
