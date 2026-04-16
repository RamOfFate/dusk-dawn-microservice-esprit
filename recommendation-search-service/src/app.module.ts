import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health.controller';
import { EventsModule } from './events/events.module';
import { IndexModule } from './index/index.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { SearchModule } from './search/search.module';
import { EurekaModule } from '@hjkltop/nestjs-eureka';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const uri =
          config.get<string>('MONGODB_URI') ??
          'mongodb://localhost:27017/recommendation_search';
        return { uri };
      },
    }),
    IndexModule,
    EventsModule,
    SearchModule,
    RecommendationsModule,
    // NOTE: @hjkltop/nestjs-eureka is built against Nest v8 types.
    // We cast to `any` to avoid TS type conflicts while still using it at runtime.
    (EurekaModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const serviceName =
          config.get<string>('EUREKA_SERVICE_NAME') ??
          'recommendation-search-service';

        const port = Number.parseInt(config.get<string>('PORT') ?? '8083', 10);

        const disable =
          (config.get<string>('EUREKA_DISABLE') ?? '').toLowerCase() === 'true';

        const eurekaHost = config.get<string>('EUREKA_HOST') ?? 'eureka-server';
        const eurekaPort = Number.parseInt(
          config.get<string>('EUREKA_PORT') ?? '8761',
          10,
        );

        return {
          disable,
          eureka: {
            host: eurekaHost,
            port: eurekaPort,
            servicePath:
              config.get<string>('EUREKA_SERVICE_PATH') ?? '/eureka/apps/',
            registryFetchInterval: Number.parseInt(
              config.get<string>('EUREKA_REGISTRY_FETCH_INTERVAL') ?? '10000',
              10,
            ),
            maxRetries: Number.parseInt(
              config.get<string>('EUREKA_MAX_RETRIES') ?? '3',
              10,
            ),
          },
          service: {
            name: serviceName,
            // If host is omitted, the library falls back to the container IP.
            ...(config.get<string>('EUREKA_SERVICE_HOST')
              ? { host: config.get<string>('EUREKA_SERVICE_HOST') as string }
              : {}),
            port,
          },
        };
      },
    }) as any),
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
