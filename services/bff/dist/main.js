"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const port = parseInt(process.env.PORT || '', 10) || 40800;
    await app.listen(port);
    const logger = new common_1.Logger('Bootstrap');
    logger.log(`BFF listening on http://0.0.0.0:${port}`);
}
bootstrap();
