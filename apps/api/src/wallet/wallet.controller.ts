import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query, Request } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole, DepositDto, ProcessTransactionDto } from '@sidra/shared';

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
    constructor(private readonly walletService: WalletService) { }

    @Get('me')
    getMyBalance(@Request() req: any) {
        return this.walletService.getBalance(req.user.userId);
    }

    @Post('deposit')
    @Roles(UserRole.PARENT, UserRole.TEACHER)
    deposit(@Request() req: any, @Body() dto: DepositDto) {
        return this.walletService.deposit(req.user.userId, dto);
    }

    // --- Admin ---

    @Get('admin/stats')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    getStats() {
        return this.walletService.getAdminStats();
    }

    @Get('admin/pending')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    getPendingTransactions() {
        return this.walletService.getPendingTransactions();
    }

    @Patch('admin/transactions/:id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    processTransaction(@Param('id') id: string, @Body() dto: ProcessTransactionDto) {
        return this.walletService.processTransaction(id, dto);
    }
}
