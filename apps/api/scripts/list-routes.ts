
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const server = app.getHttpAdapter().getInstance();
    const router = server._router;

    const availableRoutes: [] = router.stack
        .map((layer: any) => {
            if (layer.route) {
                return {
                    route: {
                        path: layer.route?.path,
                        method: layer.route?.stack[0].method,
                    },
                };
            }
        })
        .filter((item: any) => item !== undefined);

    console.log(JSON.stringify(availableRoutes, null, 2));

    // Also try to inspect via getHttpServer if express
    await app.init();
}
bootstrap();
