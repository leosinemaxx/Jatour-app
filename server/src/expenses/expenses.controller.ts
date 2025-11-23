import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { SyncTransactionDto } from './dto/sync-transaction.dto';
// import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // TODO: Add auth guard

@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  create(@Body() createExpenseDto: CreateExpenseDto) {
    return this.expensesService.create(createExpenseDto);
  }

  @Post('sync-transaction')
  syncTransaction(@Body() syncTransactionDto: SyncTransactionDto) {
    return this.expensesService.syncTransaction(syncTransactionDto);
  }

  @Get()
  findAll(
    @Query('userId') userId: string,
    @Query('category') category?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('budgetId') budgetId?: string,
    @Query('itineraryId') itineraryId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const filters = {
      category,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      budgetId,
      itineraryId,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    };
    return this.expensesService.findAll(userId, filters);
  }

  @Get('analytics')
  getAnalytics(
    @Query('userId') userId: string,
    @Query('period') period: 'week' | 'month' | 'year' = 'month',
  ) {
    return this.expensesService.getAnalytics(userId, period);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.expensesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateExpenseDto: UpdateExpenseDto) {
    return this.expensesService.update(id, updateExpenseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.expensesService.remove(id);
  }
}