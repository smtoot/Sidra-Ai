import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query, Request } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole, DepositDto, ProcessTransactionDto, UpsertBankInfoDto, WithdrawalRequestDto, TransactionStatus, TransactionType } from '@sidra/shared';

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

    @Post('bank-info')
    @Roles(UserRole.TEACHER)
    upsertBankInfo(@Request() req: any, @Body() dto: UpsertBankInfoDto) {
        return this.walletService.upsertBankInfo(req.user.userId, dto);
    }

    @Post('withdraw')
    @Roles(UserRole.TEACHER)
    requestWithdrawal(@Request() req: any, @Body() dto: WithdrawalRequestDto) {
        return this.walletService.requestWithdrawal(req.user.userId, dto);
    }

    // --- Admin ---

    @Get('admin/stats')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    getStats() {
        return this.walletService.getAdminStats();
    }

    @Get('admin/transactions')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    getTransactions(
        @Query('status') status?: string,
        @Query('type') type?: string,
        @Query('userId') userId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number
    ) {
        return this.walletService.getAdminTransactions(
            status as TransactionStatus,
            type as TransactionType,
            userId,
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined,
            page ? Number(page) : 1,
            limit ? Number(limit) : 50
        );
    }

    @Get('admin/users/:userId/wallet')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    getUserWallet(@Param('userId') userId: string) {
        return this.walletService.getAdminUserWallet(userId);
    }

    @Get('admin/transactions/:id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    getTransaction(@Param('id') id: string) {
        return this.walletService.getAdminTransaction(id);
    }

    @Patch('admin/transactions/:id')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    processTransaction(@Param('id') id: string, @Body() dto: ProcessTransactionDto) {
        return this.walletService.processTransaction(id, dto);
    }
}
