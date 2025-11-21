import { File } from 'buffer';

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
  stream?: any;
  destination?: string;
  filename?: string;
  path?: string;
}

export type FileType = Express.Multer.File | File | UploadedFile; 