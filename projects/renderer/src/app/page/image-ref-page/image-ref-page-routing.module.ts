import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ImageRefPageComponent } from './image-ref-page.component';

const routes: Routes = [{ path: '', component: ImageRefPageComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ImageRefPageRoutingModule {}
