import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: true,
    credentials: true,
  });

  const port = Number(process.env.PORT ?? 8083);
  await app.listen(port);

  console.log(`Recommendation/Search service listening on :${port}`);
}
bootstrap();
