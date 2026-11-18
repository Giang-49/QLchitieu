import './env';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/transform.interceptor';
import { AllExceptionsFilter } from './common/http-exception.filter';

Object.defineProperty(BigInt.prototype, 'toJSON', {
  value(this: bigint) {
    return Number(this);
  },
  configurable: true,
});

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api/v1');
  app.enableCors();
  app.enableShutdownHooks();

  const frontend = resolve(__dirname, '../../Frontend');
  if (existsSync(join(frontend, 'index.html'))) {
    const express = app.getHttpAdapter().getInstance();
    const runtime = JSON.stringify({ apiBase: '/api/v1', demo: process.env.SMARTMONEY_DEMO === '1' });
    const config = readFileSync(join(frontend, 'js/config.js'), 'utf8');
    express.get('/js/config.js', (_request, response) => {
      response.type('application/javascript').set('Cache-Control', 'no-cache')
        .send('globalThis.SMARTMONEY_RUNTIME = ' + runtime + ';\n' + config);
    });

    for (const directory of ['css', 'js', 'assets']) {
      app.useStaticAssets(join(frontend, directory), { prefix: '/' + directory + '/' });
    }
    const pages = ['/', '/index.html', '/login.html', '/dashboard.html', '/transactions.html', '/reports.html', '/manage.html'];
    express.get(pages, (request, response) => {
      response.sendFile(join(frontend, request.path === '/' ? 'index.html' : request.path.slice(1)));
    });
  }

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());
  const port = Number(process.env.PORT || 3000);
  await app.listen(port, process.env.HOST || '127.0.0.1');
}
void bootstrap();
