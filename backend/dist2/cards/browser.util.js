"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.launchBrowser = launchBrowser;
const chromium_1 = __importDefault(require("@sparticuz/chromium"));
const puppeteer_core_1 = __importDefault(require("puppeteer-core"));
async function launchBrowser() {
    const customPath = process.env.PUPPETEER_EXECUTABLE_PATH;
    if (customPath) {
        return puppeteer_core_1.default.launch({
            executablePath: customPath,
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
    }
    const executablePath = await chromium_1.default.executablePath();
    return puppeteer_core_1.default.launch({
        args: chromium_1.default.args,
        defaultViewport: chromium_1.default.defaultViewport,
        executablePath,
        headless: chromium_1.default.headless,
    });
}
//# sourceMappingURL=browser.util.js.map