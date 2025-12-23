import { Module } from '@nestjs/common';
import { PackageService } from './package.service';
import { DemoService } from './demo.service';
import { PackageController } from './package.controller';
import { PackageScheduler } from './package.scheduler';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [PackageController],
    providers: [PackageService, DemoService, PackageScheduler],
    exports: [PackageService, DemoService]
})
export class PackageModule { }
