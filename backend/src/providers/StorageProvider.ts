export interface IStorageProvider {
  /**
   * Uploads a file to storage and returns its location path/URI.
   */
  upload(file: Express.Multer.File, directory: string): Promise<string>;

  /**
   * Retrieves a file as a buffer.
   */
  get(path: string): Promise<Buffer>;

  /**
   * Deletes a file.
   */
  delete(path: string): Promise<void>;

  /**
   * Generates a signed URL or access URI if the provider supports it.
   * For local storage, this might just return a static endpoint path.
   */
  getAccessUrl(path: string): Promise<string>;
}
