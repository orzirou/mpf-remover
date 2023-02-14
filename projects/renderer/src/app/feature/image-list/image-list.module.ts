import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MaterialModule } from '../../lib/material';
import { ImageListComponent } from './image-list.component';
import { ImageSelectModule } from '../image-select/image-select.module';

@NgModule({
  declarations: [ImageListComponent],
  imports: [CommonModule, FormsModule, MaterialModule, ImageSelectModule],
  exports: [ImageListComponent],
})
export class ImageListModule {}
