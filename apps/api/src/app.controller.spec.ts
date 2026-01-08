import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

import { SystemSettingsService } from './admin/system-settings.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
            email_outbox: {
              count: jest.fn().mockResolvedValue(0),
            },
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                RESEND_API_KEY: 'test-key',
                R2_ACCESS_KEY_ID: 'test-r2-key',
              };
              return config[key];
            }),
          },
        },
        {
          provide: SystemSettingsService,
          useValue: {
            getSettings: jest.fn().mockResolvedValue({
              packagesEnabled: true,
              demosEnabled: true,
              maintenanceMode: false,
              currency: 'SDG',
              meetingLinkAccessMinutesBefore: 30,
            }),
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
