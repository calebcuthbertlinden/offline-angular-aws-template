import { Injectable, InjectionToken } from '@angular/core';
import { RxDatabase, RxReplicationPullStreamItem, createRxDatabase, lastOfArray } from 'rxdb';
import { wrappedKeyEncryptionCryptoJsStorage } from 'rxdb/plugins/encryption-crypto-js';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { learnerSchema } from '../schema/identity';
import { nuggetSchema } from '../schema/nugget';
import { Observable, Subject } from 'rxjs';
import { replicateRxCollection } from 'rxdb/plugins/replication';
import { LocalStorage } from './local-storage-interface';
import { Checkpoint } from './checkpoint';
import { logSchema } from '../schema/log';

export const APP_STORAGE = new InjectionToken<any>('APP_STORAGE');
export const IDENTITY_TABLE = 'identity';
export const NUGGET_TABLE = 'nugget';
export const LOG_TABLE = 'log';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService implements LocalStorage {
  private _database: RxDatabase | undefined;
  private pullStream$ = new Subject<RxReplicationPullStreamItem<any, any>>();

  constructor() {}

  async init() {
    this._database = await createRxDatabase({
      name: 'offlinestore'+ new Date().getTime(),
      storage: wrappedKeyEncryptionCryptoJsStorage({
        storage: getRxStorageDexie()
      }),
      password: 'ThisIsAVeryStrongPasswordForEncryption',
      cleanupPolicy: {
        /**
         * The minimum time in milliseconds for how long a document has to be deleted before it is purged by the cleanup.
         * [default=one month]
         */
        minimumDeletedTime: 1000 * 60 * 60 * 24 * 31, // one month,
        /**
         * The minimum amount of that that the RxCollection must have existed.
         * This ensures that at the initial page load, more important tasks are not slowed down because a cleanup process is running.
         * [default=60 seconds]
         */
        minimumCollectionAge: 1000 * 60, // 60 seconds
        /**
         * After the initial cleanup is done, a new cleanup is started after [runEach] milliseconds
         * [default=5 minutes]
         */
        runEach: 1000 * 60 * 5, // 5 minutes
        /**
         * If set to true, RxDB will await all running replications to not have a replication cycle running.
         * This ensures we do not remove deleted documents when they might not have already been replicated.
         * [default=true]
         */
        awaitReplicationsInSync: true,
      }
    });

    await this.createCollection({identity: {
      schema: learnerSchema
    }})

    await this.createCollection({nugget: {
      schema: nuggetSchema
    }})

    await this.createCollection({nugget: {
      log: logSchema
    }})
  }

  async createCollection(collection:any) {
    await this._database!.addCollections(collection);
  }

  async sync(collection:string) {
    console.log('Syncing from server to client, and then client updates back to server');
    const replicationState = replicateRxCollection({
      collection: this._database![collection],
      /**
       * An id for the replication to identify it and so that RxDB is able to resume the replication on app reload.
       * If you replicate with a remote server, it is recommended to put the server url into the replicationIdentifier.
       */
      replicationIdentifier: 'my-rest-replication-to-prod/v1/sync',
      /**
       * By default it will do an ongoing realtime replication.
       * By settings live: false the replication will run once until the local state is in sync with the remote state, then it will cancel itself.
       * (optional), default is true.
       */
      live: false,
      /**
       * Time in milliseconds after when a failed backend request has to be retried.
       * This time will be skipped if a offline->online switch is detected via navigator.onLine
       * (optional), default is 5 seconds.
       */
      retryTime: 600 * 1000,
      /**
       * When multiInstance is true, like when you use RxDB in multiple browser tabs, the replication should always run in only one of the open browser tabs.
       * If waitForLeadership is true, it will wait until the current instance is leader.
       * If waitForLeadership is false, it will start replicating, even if it is not leader.
       * [default=true]
       */
      waitForLeadership: true,
      /**
       * If this is set to false, the replication will not start automatically but will wait for replicationState.start() being called.
       * (optional), default is true
       */
      autoStart: true,

      /**
       * Custom deleted field, the boolean property of the document data that marks a document as being deleted.
       * If your backend uses a different fieldname then '_deleted', set the fieldname here.
       * RxDB will still store the documents internally with '_deleted', setting this field only maps the data on the data layer.
       *
       * If a custom deleted field contains a non-boolean value, the deleted state
       * of the documents depends on if the value is truthy or not. So instead of providing a boolean * * deleted value, you could also work with using a 'deletedAt' timestamp instead.
       *
       * [default='_deleted']
       */
      deletedField: '_deleted',

      /**
       * Optional,
       * only needed when you want to replicate local changes to the remote instance.
       */
      push: {
          /**
           * Push handler
           */
          async handler(docs) {
              /**
               * Push the local documents to a remote REST server.
               */
              const rawResponse = await fetch(`https://brwpjqq55e.execute-api.eu-west-1.amazonaws.com/prod/v1/sync/${collection}`, {
                  method: 'POST',
                  headers: {
                      'Accept': 'application/json',
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ docs })
              });
              /**
               * Contains an array with all conflicts that appeared during this push.
               * If there were no conflicts, return an empty array.
               */
              const response = await rawResponse.json();
              return response;
          },
          /**
           * Batch size, optional
           * Defines how many documents will be given to the push handler at once.
           */
          batchSize: 5,
          /**
           * Modifies all documents before they are given to the push handler.
           * Can be used to swap out a custom deleted flag instead of the '_deleted' field.
           * (optional)
           */
          modifier: d => d
      },
      /**
       * Optional,
       * only needed when you want to replicate remote changes to the local state.
       */
      pull: {
          /**
           * Pull handler
           */
          async handler(lastCheckpoint, batchSize) {
              const minTimestamp = 0;
              // const minTimestamp = lastCheckpoint ? lastCheckpoint.updatedAt : 0;
              /**
               * In this example we replicate with a remote REST server
               */
              const response = await fetch(
                  `https://brwpjqq55e.execute-api.eu-west-1.amazonaws.com/prod/v1/sync/${collection}?minUpdatedAt=${minTimestamp}&limit=${batchSize}`
              );
              const documentsFromRemote = await response.json();
              return {
                  /**
                   * Contains the pulled documents from the remote.
                   * Notice: If documentsFromRemote.length < batchSize,
                   * then RxDB assumes that there are no more un-replicated documents
                   * on the backend, so the replication will switch to 'Event observation' mode.
                   */
                  documents: documentsFromRemote,
                  /**
                   * The last checkpoint of the returned documents.
                   * On the next call to the pull handler,
                   * this checkpoint will be passed as 'lastCheckpoint'
                   */
                  checkpoint: documentsFromRemote.length === 0 ? lastCheckpoint : {
                      id: "",
                      updatedAt: ""
                  }
              };
          },
          batchSize: 10,
          /**
           * Modifies all documents after they have been pulled
           * but before they are used by RxDB.
           * (optional)
           */
          modifier: d => d,
          /**
           * Stream of the backend document writes.
           * See below.
           * You only need a stream$ when you have set live=true
           */
          stream$: this.pullStream$.asObservable()
      },
    });



    // emits each document that was received from the remote
    replicationState.received$.subscribe(doc => {});

    // emits each document that was send to the remote
    replicationState.send$.subscribe(doc => console.dir(doc));

    // emits all errors that happen when running the push- & pull-handlers.
    replicationState.error$.subscribe(error => console.dir(error));

    // emits true when the replication was canceled, false when not.
    replicationState.canceled$.subscribe(bool => console.dir(bool));

    // emits true when a replication cycle is running, false when not.
    replicationState.active$.subscribe(bool => console.dir(bool));
  }

  async syncPush(collection:string, path:string = "") {
    console.log('Syncing client to server');
    const replicationState = replicateRxCollection({
      collection: this._database![collection],
      replicationIdentifier: 'sync-local-to-prod-v1-sync-push',
      live: false,
      retryTime: 600 * 1000,
      waitForLeadership: true,
      autoStart: true,
      deletedField: '_deleted',
      push: {
          async handler(docs) {
              // TODO replace with auth interceptor
              const rawResponse = await fetch(`https://brwpjqq55e.execute-api.eu-west-1.amazonaws.com/prod/v1/sync/${collection}`, {
                  method: 'POST',
                  headers: {
                      'Accept': 'application/json',
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ docs })
              });
              const response = await rawResponse.json();
              return response;
          },
          batchSize: 5,
          modifier: d => d
      },
    });

    replicationState.received$.subscribe(doc => console.log(`SYNC received`));
    replicationState.send$.subscribe(doc => console.log(`SYNC send`));
    replicationState.error$.subscribe(error => console.dir(`SYNC cancelled ${error}`));
    replicationState.canceled$.subscribe(bool => console.dir(`SYNC cancelled ${bool}`));
    replicationState.active$.subscribe(bool => console.log(`SYNC active ${bool}`));
  }

  async syncPull(collection:string) {
    console.log('Syncing server to client');
    const replicationState = replicateRxCollection({
      collection: this._database![collection],
      replicationIdentifier: 'sync-prod-v1-sync-to-local',
      live: false,
      retryTime: 600 * 1000,
      waitForLeadership: true,
      autoStart: true,
      deletedField: '_deleted',
      pull: {
        async handler(lastCheckpoint: Checkpoint, batchSize) {
            // TODO replace with auth interceptor
            const minTimestamp = lastCheckpoint ? lastCheckpoint.updatedAt : 0;
            const response = await fetch(
                `https://brwpjqq55e.execute-api.eu-west-1.amazonaws.com/prod/v1/sync/${collection}?minUpdatedAt=${minTimestamp}&limit=${batchSize}`
            );
            const documentsFromRemote = await response.json();
            const checkpoint = lastOfArray(documentsFromRemote) as Checkpoint;
            return {
                documents: documentsFromRemote,
                checkpoint: documentsFromRemote.length === 0 ? lastCheckpoint : {
                  updatedAt: checkpoint.updatedAt
                }
            };
        },
        batchSize: 100,
        modifier: d => d,
      },
    });

    replicationState.received$.subscribe(doc => console.log(`SYNC received`));
    replicationState.send$.subscribe(doc => console.log(`SYNC send`));
    replicationState.error$.subscribe(error => console.dir(`SYNC cancelled ${error}`));
    replicationState.canceled$.subscribe(bool => console.dir(`SYNC cancelled ${bool}`));
    replicationState.active$.subscribe(bool => console.log(`SYNC active ${bool}`));
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Accessors
  // -----------------------------------------------------------------------------------------------------

  /**
   * Getter for database
   */
  get database(): RxDatabase {
    return this._database as RxDatabase;
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Public methods
  // -----------------------------------------------------------------------------------------------------

  /**
   * Inserts a new record into the specified table in the local offline storage.
   *
   * @param table - The name of the table where the record will be inserted.
   * @param body - The data object representing the record to be inserted.
   * @returns A Promise that resolves to void once the record has been successfully inserted.
   *
   * @example
   * await post('orders', { id: 1, product: 'Phone', quantity: 2 });
   * // Inserts a new record into the 'orders' table with the provided data.
   */
  async post(table: string, body: any): Promise<void> {
    await this.database[table].insert(body);
  }

  /**
   * Retrieves a record from the specified table in the local offline storage based on the provided ID.
   *
   * @param table - The name of the table from which the record will be retrieved.
   * @param id - The ID of the record to be retrieved.
   * @returns A Promise that resolves to the retrieved record.
   *
   * @example
   * const order = await get('orders', '456');
   * // Retrieves the record with ID '456' from the 'orders' table.
   */
  async get(table: string, id: string): Promise<any> {
    return this.database[table].findOne(id).exec();
  }

  async getCollection(table: string): Promise<any> {
    return this.database[table].find().exec();
  }


  /**
   * Retrieves an Observable stream of records from the specified table in the local offline storage.
   *
   * @param table - The name of the table from which the records will be retrieved.
   * @returns An Observable that emits the records from the specified table.
   *
   * @example
   * // Example usage:
   * const users$ = get$('users');
   * users$.subscribe((users) => {
   *   console.log(users);
   * });
   * // Retrieves the records from the 'users' table and logs the emitted records whenever there is an update.
   */
  get$(table: string): Observable<any> {
    return this.database[table].$;
  }

  /**
   * Updates an existing record or inserts a new record into the specified table in the local offline storage.
   *
   * @param table - The name of the table where the record will be updated or inserted.
   * @param body - The data object representing the record to be updated or inserted.
   * @returns A Promise that resolves to void once the record has been successfully updated or inserted.
   *
   * @example
   * await put('users', { id: '123', name: 'John Doe', age: 30 });
   * // Updates the record with ID '123' in the 'users' table if it exists, or inserts a new record with the provided data if the record doesn't exist.
   */
  async put(table: string, body: any): Promise<void> {
    await this.database[table].upsert(body);
  }


  /**
   * DELETE
   */
  async delete(): Promise<void> {}

  /**
   * REMOVE
   */
  async deleteCollection(table: string): Promise<void> {
    await this.database[table].remove();
  }

  /**
   * Destroy
   */
  async destroyCollection(table: string): Promise<void> {
    await this.database[table].destroy();
  }

  destroy(): void {
    this.database.remove()
  }
}
