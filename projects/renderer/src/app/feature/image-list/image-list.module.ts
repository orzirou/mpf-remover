import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxMatCounterspinnerModule } from 'ngx-mat-counterspinner';
import { ToastrModule } from 'ngx-toastr';

import { MaterialModule } from '../../lib/material';
import { ImageListComponent } from './image-list.component';
import { ImageSelectModule } from '../image-select/image-select.module';
import { LoadingModule } from '../loading/loading.module';

@NgModule({
  declarations: [ImageListComponent],
  imports: [
    CommonModule,
    FormsModule,
    NgxMatCounterspinnerModule,
    ToastrModule,

    MaterialModule,
    ImageSelectModule,
    LoadingModule,
  ],
  exports: [ImageListComponent],
})
export class ImageListModule {}
