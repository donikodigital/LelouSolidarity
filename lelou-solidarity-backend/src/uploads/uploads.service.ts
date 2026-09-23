import { Inject, Injectable } from '@nestjs/common';
import { UploadApiResponse, v2 as CloudinaryType } from 'cloudinary';
import { Readable } from 'stream';
import { CLOUDINARY } from './cloudinary.provider';

@Injectable()
export class UploadsService {
  constructor(@Inject(CLOUDINARY) private readonly cloudinary: typeof CloudinaryType) {}

  /** Televerse la photo d'identite d'un membre. */
  uploadMemberPhoto(buffer: Buffer, memberEmail: string): Promise<UploadApiResponse> {
    return this.uploadBuffer(buffer, {
      folder: 'lelou-solidarity/photos',
      public_id: `photo_${Date.now()}`,
      context: { email: memberEmail },
    });
  }

  /** Televerse le PDF genere de la carte de membre. */
  uploadCardPdf(buffer: Buffer, memberCode: string): Promise<UploadApiResponse> {
    return this.uploadBuffer(buffer, {
      folder: 'lelou-solidarity/cards',
      public_id: `carte_${memberCode}`,
      resource_type: 'raw',
      format: 'pdf',
    });
  }

  private uploadBuffer(
    buffer: Buffer,
    options: Record<string, unknown>,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const uploadStream = this.cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error || !result) return reject(error);
          resolve(result);
        },
      );
      Readable.from(buffer).pipe(uploadStream);
    });
  }
}
