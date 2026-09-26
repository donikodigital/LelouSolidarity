"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessCodesModule = void 0;
const common_1 = require("@nestjs/common");
const mail_module_1 = require("../mail/mail.module");
const access_codes_controller_1 = require("./access-codes.controller");
const access_codes_service_1 = require("./access-codes.service");
let AccessCodesModule = class AccessCodesModule {
};
exports.AccessCodesModule = AccessCodesModule;
exports.AccessCodesModule = AccessCodesModule = __decorate([
    (0, common_1.Module)({
        imports: [mail_module_1.MailModule],
        controllers: [access_codes_controller_1.AccessCodesController],
        providers: [access_codes_service_1.AccessCodesService],
        exports: [access_codes_service_1.AccessCodesService],
    })
], AccessCodesModule);
//# sourceMappingURL=access-codes.module.js.map