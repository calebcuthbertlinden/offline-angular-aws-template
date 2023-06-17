import { Injectable } from "@angular/core";
import { LOG_TABLE } from "../local-storage/local-storage";
import { SyncService } from "../sync-service";

@Injectable({
  providedIn: 'root'
})
export class ProfileService {

  constructor(private syncService: SyncService) {}

  /**
   * Inserts a new record into the LOG table in the local offline storage.
   *
   * @param body - The data object representing the record to be inserted.
   * @returns A Promise that resolves to void once the record has been successfully inserted.
   * @example
   * await post({ id: 1, product: 'Phone', quantity: 2 });
   */
  async logEvent(body: any): Promise<void> {
    await this.syncService.post(LOG_TABLE, "", body)
  }

}