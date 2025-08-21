import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import type {Express} from 'express';

@Injectable()
export class FilesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  // Modify the method to accept userId as an argument.
  async upload(file: Express.Multer.File, userId: string) {
    console.log(`--- UPLOAD PROCESS STARTED FOR USER: ${userId} ---`);
    if (!file) {
      throw new InternalServerErrorException('File is undefined.');
    }

    const supabase = this.supabaseService.getClient();
    const bucket = 'study-notes';
    // Organize files in storage by user ID for better management
    const filePath = `public/${userId}/${Date.now()}-${file.originalname}`;

    // 1. Upload the file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
      });

    if (uploadError) {
      console.error('!!! STORAGE UPLOAD FAILED:', uploadError);
      throw new InternalServerErrorException('Failed to upload file to storage.', uploadError.message);
    }

    // 2. Insert metadata into the Supabase database
    const { data: dbData, error: dbError } = await supabase
      .from('study_notes')
      .insert({
        // Use the userId in the database insert operation.
        user_id: userId, 
        file_name: file.originalname,
        file_path: uploadData.path,
        file_size: file.size,
        mime_type: file.mimetype,
      })
      .select()
      .single();

    if (dbError) {
      console.error('!!! DATABASE INSERT FAILED:', dbError);
      await supabase.storage.from(bucket).remove([filePath]);
      throw new InternalServerErrorException('Failed to save file metadata.', dbError.message);
    }

    console.log('--- UPLOAD PROCESS FINISHED SUCCESSFULLY ---');
    return {
      message: 'File uploaded successfully',
      data: dbData,
    };
  }
}
