import { uploadFile } from './storageServiceNew';

export const fileService = {
  // Upload a file to storage
  async uploadFile(file: File, folder: string = 'community-files'): Promise<string> {
    try {
      // 使用新的存储服务上传
      const publicUrl = await uploadFile(file, folder);
      return publicUrl;
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  }
};
