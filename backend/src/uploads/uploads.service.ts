//backend/src/uploads/uploads.service.ts
import { Inject, Injectable } from '@nestjs/common';
import { UploadApiResponse, v2 as CloudinaryType } from 'cloudinary';
import { Readable } from 'stream';
import { CLOUDINARY } from './cloudinary.provider';

/**
 * Pour un fichier "raw" (le PDF de la carte), l'identifiant public Cloudinary
 * est le chemin present dans l'URL, apres /raw/upload/ et l'eventuelle
 * version (v123456), extension comprise. Le public_id du PDF n'est pas
 * stocke en base (seule cardPdfUrl l'est), on le retrouve donc depuis l'URL.
 */
function extractRawPublicId(url: string): string | null {
  const match = url.match(/\/raw\/upload\/(?:v\d+\/)?([^?#]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

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

  /** Supprime la photo d'un membre. Renvoie "ok" ou "not found". */
  deleteMemberPhoto(publicId: string): Promise<string> {
    return this.destroy(publicId, 'image');
  }

  /** Supprime le PDF de carte a partir de l'URL stockee en base. */
  async deleteCardPdf(cardPdfUrl: string): Promise<string> {
    const publicId = extractRawPublicId(cardPdfUrl);
    if (!publicId) {
      throw new Error(`URL de carte Cloudinary non reconnue: ${cardPdfUrl}`);
    }
    return this.destroy(publicId, 'raw');
  }

  private async destroy(publicId: string, resourceType: 'image' | 'raw'): Promise<string> {
    const result = await this.cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true,
    });
    if (result.result !== 'ok' && result.result !== 'not found') {
      throw new Error(`Cloudinary a repondu "${result.result}" pour ${publicId}`);
    }
    return result.result;
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