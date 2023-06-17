import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ScormComponent } from './scorm.component';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [ScormComponent],
  schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
})
export class ScormModule { }
