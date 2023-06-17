import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { addRxPlugin } from 'rxdb';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { RxDBCleanupPlugin } from 'rxdb/plugins/cleanup';
import { RxDBLeaderElectionPlugin } from 'rxdb/plugins/leader-election';
import { LmsService } from './scorm/service/lms-service';
import { ScormWrapperService } from './scorm/service/scorm-wrapper-service';
import { ScormModule } from './scorm/scorm-component/scorm.module';

addRxPlugin(RxDBDevModePlugin);
addRxPlugin(RxDBCleanupPlugin);
addRxPlugin(RxDBLeaderElectionPlugin);

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ScormModule,
  ],
  providers: [
    LmsService,
    ScormModule,
    ScormWrapperService
  ],
  bootstrap: [AppComponent],
  schemas: [ CUSTOM_ELEMENTS_SCHEMA ]
})
export class AppModule { }
