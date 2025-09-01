import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import type {Express} from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai'; // Import Google AI
import pdfParse = require('pdf-parse');

@Injectable()
export class FilesService {
  private readonly genAI: GoogleGenerativeAI;

  constructor(private readonly supabaseService: SupabaseService) {

    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY is not defined in the environment variables.');
    }
    this.genAI = new GoogleGenerativeAI(geminiApiKey);
  }

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
     console.log('--- UPLOADING TO PATH:', filePath);
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
    console.log('--- PATH RETURNED FROM SUPABASE UPLOAD:', uploadData.path);
    
    console.log('--- SAVING METADATA WITH PATH:', uploadData.path);
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
  async getSignedUrl(fileId: string, userId: string) {
    const supabase = this.supabaseService.getClient();
    // 1. Verify the user owns the file
    console.log('--- GETTING SIGNED URL FOR fileId:', fileId, 'AND userId:', userId);
    const { data: fileData, error: fileError } = await supabase
      .from('study_notes')
      .select('file_path')
      .eq('id', fileId)
      .eq('user_id', userId)
      .single();

    if (fileError || !fileData) {
      console.error('!!! DATABASE LOOKUP FAILED:', fileError);
      throw new NotFoundException('File not found or access denied.');
    }

     console.log('--- FOUND FILE IN DB. ATTEMPTING TO SIGN PATH:', fileData.file_path);
    // 2. Generate a signed URL that expires in 1 hour (3600 seconds)
    const { data, error } = await supabase.storage
      .from('study-notes')
      .createSignedUrl(fileData.file_path, 3600);

    if (error) {
      console.error('!!! SUPABASE STORAGE ERROR:', error);
      throw new InternalServerErrorException('Could not generate file URL.', error.message);
    }

    return data;
}
async summarize(fileId: string, userId: string) {
  try { // <-- Start of the try block
    const supabase = this.supabaseService.getClient();

    // 1. Find the file path in your database
    const { data: fileData, error: fileError } = await supabase
      .from('study_notes')
      .select('file_path')
      .eq('id', fileId).eq('user_id', userId).single();
    if (fileError) { throw new NotFoundException('File not found or access denied.'); }

    // 2. Download the file from Supabase Storage
    const { data: blob, error: downloadError } = await supabase.storage
      .from('study-notes').download(fileData.file_path);
    if (downloadError) { throw new InternalServerErrorException('Failed to download file.'); }

    // 3. Extract text from the PDF buffer
    const buffer = Buffer.from(await blob.arrayBuffer());
    const pdfData = await pdfParse(buffer);
    const textContent = pdfData.text;

    // 4. Send the text to Gemini for summarization
    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Summarize the following study notes in clear, concise points:\n\n${textContent}`;
    const result = await model.generateContent(prompt);
    
    return { summary: result.response.text() };

  } catch (error) { // <-- Start of the catch block
    // This will log the REAL error to your backend terminal
    console.error('--- ERROR DURING SUMMARIZATION ---', error); 
    // Re-throw a standard error to the frontend
    throw new InternalServerErrorException('An unexpected error occurred during summarization.');
  }
}
}
