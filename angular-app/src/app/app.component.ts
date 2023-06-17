import { Component } from '@angular/core';
import { IDENTITY_TABLE, LocalStorageService, NUGGET_TABLE } from './repository/local-storage/local-storage';
import { v4 } from 'uuid';
import { ProfileService } from './repository/api/profile-repository';
import { TrackService } from './repository/api/track-repository';
import { LmsService } from './scorm/service/lms-service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'mmf-poc';
  nuggets:any[] = [];

  constructor(private localstorageService: LocalStorageService, private profileService: ProfileService, private trackService: TrackService, private lmsService: LmsService) {
    // ,
    this.localstorageService.init().then(() => {
      console.log("Created RxDB collections!")
      this.addTrackTrigger()
      this.syncPull()
    })
  }

  syncPull() {
    this.localstorageService.syncPull(IDENTITY_TABLE)
    this.localstorageService.syncPull(NUGGET_TABLE)
  }

  addItem() {
    this.profileService.createProfile({
      id: v4(),
      name: "Name",
      _deleted: false,
      updatedAt: Date.now(),
    }).then(() => {
      console.log("Added item")
    });
  }

  addTrack() {
    this.trackService.markNuggetComplete({
      id: v4(),
      name: "Name",
      _deleted: false,
      updatedAt: Date.now(),
    }).then(() => {
      console.log("Added track")
    });
  }

  viewScorm() {

  }

  sync() {
    this.localstorageService.syncPush(NUGGET_TABLE)
    this.localstorageService.syncPush(IDENTITY_TABLE)
  }

  public async addTrackTrigger() {
    this.trackService.get$().subscribe(_ => {
      this.trackService.getNuggets().then((value) => {
        this.nuggets = value;
      })
    });
  }
}
