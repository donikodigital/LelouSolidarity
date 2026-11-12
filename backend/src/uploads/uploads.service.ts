//backend/src/uploads/uploads.service.ts
// v1.1 — photo de profil du gérant (uploadAdminAvatar / deleteAdminAvatar).
import { Inject, Injectable } from '@nestjs/common';
import { UploadApiResponse, v2 as CloudinaryType } from 'cloudinary';
import { randomBytes } from 'crypto';
import { Readable } from 'stream';
import { CLOUDINARY } from './cloudinary.provider';

/**
 * Suffixe aléatoire (128 bits) ajouté aux identifiants Cloudinary : les fichiers
 * sont servis par une URL publique, il faut donc qu'elle soit impossible à
 * deviner (avant, `carte_LS-2026-0001` se déduisait d'un simple compteur).
 */
function randomSuffix(): string {
  return randomBytes(16).toString('hex');
}

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
      public_id: `photo_${Date.now()}_${randomSuffix()}`,
      context: { email: memberEmail },
    });
  }

  /**
   * Televerse la photo de profil du gerant : recadree en carre de 512 px autour du
   * visage et compressee par Cloudinary, quelle que soit la taille d'origine.
   */
  uploadAdminAvatar(buffer: Buffer, adminId: string): Promise<UploadApiResponse> {
    return this.uploadBuffer(buffer, {
      folder: 'lelou-solidarity/admins',
      public_id: `admin_${adminId}_${Date.now()}_${randomSuffix()}`,
      transformation: [
        { width: 512, height: 512, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });
  }

  /** Supprime la photo de profil du gerant. */
  deleteAdminAvatar(publicId: string): Promise<string> {
    return this.destroy(publicId, 'image');
  }

  /** Televerse le PDF genere de la carte de membre. */
  uploadCardPdf(buffer: Buffer, memberCode: string): Promise<UploadApiResponse> {
    return this.uploadBuffer(buffer, {
      folder: 'lelou-solidarity/cards',
      public_id: `carte_${memberCode}_${randomSuffix()}`,
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
          // Cloudinary peut renvoyer une erreur sans objet Error : on garantit un message lisible dans les logs.
          if (error || !result) {
            const e = error as { message?: string; http_code?: number } | undefined;
            return reject(
              new Error(`Cloudinary: ${e?.message ?? 'réponse vide'}${e?.http_code ? ` (HTTP ${e.http_code})` : ''}`),
            );
          }
          resolve(result);
        },
      );
      Readable.from(buffer).pipe(uploadStream);
    });
  }
}