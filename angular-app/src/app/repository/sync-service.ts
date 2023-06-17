import { Injectable, InjectionToken } from '@angular/core';
import { LocalStorageService } from './local-storage/local-storage';
import { Observable } from 'rxjs';
import { OnlineOfflineService } from './offline-service';

export const APP_STORAGE = new InjectionToken<any>('APP_STORAGE');
export const IDENTITY_TABLE = 'identity';
export const NUGGET_TABLE = 'nugget';

@Injectable({
  providedIn: 'root'
})
export class SyncService {

  private online:boolean;

  constructor(private localstorageService: LocalStorageService, onlineOfflineService: OnlineOfflineService) {
    this.registerToEvents(onlineOfflineService);
    this.online = onlineOfflineService.isOnline;
  }

  private registerToEvents(onlineOfflineService: OnlineOfflineService) {
    onlineOfflineService.connectionChanged.subscribe(online => {
      if (online) {
        console.log('went online');
        this.online = true;
        this.localstorageService.syncPush(NUGGET_TABLE)
        this.localstorageService.syncPush(IDENTITY_TABLE)
      } else {
        console.log('went offline, storing in indexdb');
        this.online = false;
      }
    });
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  async post(table: string, path: string, body: any): Promise<any> {
    await this.localstorageService.post(table, body)
    if (this.online) {
      this.localstorageService.syncPush(table, path)
    } 
    return true
  }

  async get(table: string, path: string, id: string): Promise<any> {
    if (this.online) {
      const minTimestamp = 0;
      const response = await fetch(
          `https://brwpjqq55e.execute-api.eu-west-1.amazonaws.com/prod/v1/sync?minUpdatedAt=${minTimestamp}&collection=${table}`
      );
      const documentsFromRemote = await response.json();
      // Update local storage
      for (const doc in documentsFromRemote) {
        await this.localstorageService.post(table, documentsFromRemote[doc])
      }
    } 
    // Return latest
    return this.localstorageService.get(table, id)
  }

  get$(table: string): Observable<any> {
    if (this.online) {
      // TODO api call
      return this.localstorageService.get$(table);
    } else {
      return this.localstorageService.get$(table);
    }
  }

  async getCollection(table: string): Promise<any> {
    return this.localstorageService.getCollection(table);
  }

}