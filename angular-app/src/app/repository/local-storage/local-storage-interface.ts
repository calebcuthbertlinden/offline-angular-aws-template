export interface LocalStorage {

  init(): void;
  sync(collection:string): void;
  destroy(): void;
  createCollection(collection:any): void;

  get(table: string, id: string): Promise<any>;
  getCollection(table: string): Promise<any>;
  post(table: string, body: any): Promise<void>;
  put(table: string, body: any): Promise<void>;
  delete(table: string, id: any): Promise<void>;
  
}
