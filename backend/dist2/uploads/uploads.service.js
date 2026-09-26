"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadsService = void 0;
const common_1 = require("@nestjs/common");
const stream_1 = require("stream");
const cloudinary_provider_1 = require("./cloudinary.provider");
let UploadsService = class UploadsService {
    constructor(cloudinary) {
        this.cloudinary = cloudinary;
    }
    uploadMemberPhoto(buffer, memberEmail) {
        return this.uploadBuffer(buffer, {
            folder: 'lelou-solidarity/photos',
            public_id: `photo_${Date.now()}`,
            context: { email: memberEmail },
        });
    }
    uploadCardPdf(buffer, memberCode) {
        return this.uploadBuffer(buffer, {
            folder: 'lelou-solidarity/cards',
            public_id: `carte_${memberCode}`,
            resource_type: 'raw',
            format: 'pdf',
        });
    }
    uploadBuffer(buffer, options) {
        return new Promise((resolve, reject) => {
            const uploadStream = this.cloudinary.uploader.upload_stream(options, (error, result) => {
                if (error || !result)
                    return reject(error);
                resolve(result);
            });
            stream_1.Readable.from(buffer).pipe(uploadStream);
        });
    }
};
exports.UploadsService = UploadsService;
exports.UploadsService = UploadsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(cloudinary_provider_1.CLOUDINARY)),
    __metadata("design:paramtypes", [Object])
], UploadsService);
//# sourceMappingURL=uploads.service.js.map