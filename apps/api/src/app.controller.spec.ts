import { Test, TestingModule } from '@nestjs/testing';
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
            // Mock PrismaService methods as needed
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
              meetingLinkAccessMinutesBefore: 30
            })
          }
        }
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
