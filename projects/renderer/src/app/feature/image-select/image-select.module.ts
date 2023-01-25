import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MaterialModule } from '../../lib/material';
import { ImageSelectComponent } from './image-select.component';

@NgModule({
  declarations: [ImageSelectComponent],
  imports: [CommonModule, FormsModule, MaterialModule],
  exports: [ImageSelectComponent],
})
export class ImageSelectModule {}
