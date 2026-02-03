
import { supabase } from '../lib/supabase';

export const fileService = {
  // Upload a file to Supabase Storage
  async uploadFile(file: File, bucket: string = 'community-files'): Promise<string> {
    try {
      // Generate a unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) {
        // If bucket doesn't exist or other error, try generic 'files' or 'public' if applicable, 
        // but for now just throw
        console.error(`Error uploading to ${bucket}:`, uploadError);
        throw uploadError;
      }

      // Get Public URL
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  }
};
