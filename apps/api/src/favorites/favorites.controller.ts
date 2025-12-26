
import { Controller, Get, Post, Param, UseGuards, Request } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
    constructor(private readonly favoritesService: FavoritesService) { }

    @Get()
    async getFavorites(@Request() req: any) {
        return this.favoritesService.getUserFavorites(req.user.userId);
    }

    @Post(':teacherId')
    async toggleFavorite(@Request() req: any, @Param('teacherId') teacherId: string) {
        return this.favoritesService.toggleFavorite(req.user.userId, teacherId);
    }
}
