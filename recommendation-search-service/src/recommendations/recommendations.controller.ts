import { Controller, Get, Param, Query } from '@nestjs/common';

import { RecommendationsService } from './recommendations.service';

@Controller('recommendations')
export class RecommendationsController {
  constructor(
    private readonly recommendationsService: RecommendationsService,
  ) {}

  @Get('user/:userId')
  async forUser(
    @Param('userId') userId: string,
    @Query('limit') limit?: string,
  ) {
    const uid = Number(userId);
    const lim = Math.max(1, Math.min(50, Number(limit ?? 12) || 12));
    return this.recommendationsService.recommendForUser(uid, lim);
  }
}
