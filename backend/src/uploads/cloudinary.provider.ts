import { Logger, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

export const CLOUDINARY = 'CLOUDINARY';

/**
 * Nettoie une valeur d'environnement : un copier-coller dans Render laisse souvent
 * un espace, un retour à la ligne ou des guillemets autour de la valeur, ce qui
 * fausse la signature Cloudinary (« Invalid Signature »).
 */
function clean(value: string | undefined): string {
  return (value ?? '').trim().replace(/^["']+|["']+$/g, '').trim();
}

export const CloudinaryProvider: Provider = {
  provide: CLOUDINARY,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    const cloudName = clean(config.get<string>('CLOUDINARY_CLOUD_NAME'));
    const apiKey = clean(config.get<string>('CLOUDINARY_API_KEY'));
    const apiSecret = clean(config.get<string>('CLOUDINARY_API_SECRET'));

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    // Diagnostic sans rien divulguer : nom du compte, fin de la clé, longueur du secret.
    new Logger('Cloudinary').log(
      `Configuration : compte « ${cloudName || 'VIDE'} », clé ...${apiKey.slice(-4) || 'VIDE'}, ` +
        `secret de ${apiSecret.length} caractères (début « ${apiSecret.slice(0, 2)} », fin « ${apiSecret.slice(-2)} »).`,
    );
    return cloudinary;
  },
};
