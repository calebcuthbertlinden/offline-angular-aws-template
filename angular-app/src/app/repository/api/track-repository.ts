import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { NUGGET_TABLE } from "../local-storage/local-storage";
import { SyncService } from "../sync-service";

@Injectable({
  providedIn: 'root'
})
export class TrackService {

  constructor(private syncService: SyncService) {}

  /**
   * Updates the nugget complete state.
   *
   * @param body - The data object representing the record to be inserted.
   * @returns A Promise that resolves to void once the record has been successfully inserted.
   * @example
   * await post({ id: 1, product: 'Phone', quantity: 2 });
   */
  async markNuggetComplete(body: any): Promise<void> {
    await this.syncService.post(NUGGET_TABLE, "", body)
  }

  get$(): Observable<any> {
    return this.syncService.get$(NUGGET_TABLE)
  }

  getNuggets(): Promise<any> {
    return this.syncService.getCollection(NUGGET_TABLE)
  }

}