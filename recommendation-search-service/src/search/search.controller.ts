import { Controller, Get, Query } from '@nestjs/common';

import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async search(@Query('q') q?: string, @Query('limit') limit?: string) {
    const lim = Math.max(1, Math.min(50, Number(limit ?? 20) || 20));
    return this.searchService.search(q ?? '', lim);
  }
}
