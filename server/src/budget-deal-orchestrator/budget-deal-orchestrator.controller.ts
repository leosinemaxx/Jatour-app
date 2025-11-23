import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { BudgetDealOrchestratorService, BudgetDealOrchestrationRequest, BudgetDealOrchestrationResult } from './budget-deal-orchestrator.service';

@Controller('budget-deal-orchestrator')
export class BudgetDealOrchestratorController {
  constructor(
    private readonly budgetDealOrchestratorService: BudgetDealOrchestratorService,
  ) {}

  @Post('orchestrate')
  async orchestrateBudgetDeals(@Body() request: BudgetDealOrchestrationRequest): Promise<BudgetDealOrchestrationResult> {
    return this.budgetDealOrchestratorService.orchestrateBudgetDeals(request);
  }

  @Post('budget-update')
  async onBudgetUpdate(
    @Body('userId') userId: string,
    @Body('itineraryId') itineraryId?: string,
  ): Promise<BudgetDealOrchestrationResult> {
    return this.budgetDealOrchestratorService.onBudgetUpdate(userId, itineraryId);
  }

  @Post('itinerary-change')
  async onItineraryChange(
    @Body('userId') userId: string,
    @Body('itineraryId') itineraryId: string,
  ): Promise<BudgetDealOrchestrationResult> {
    return this.budgetDealOrchestratorService.onItineraryChange(userId, itineraryId);
  }

  @Post('scheduled-check')
  async scheduledDealCheck(@Body('userId') userId: string): Promise<BudgetDealOrchestrationResult> {
    return this.budgetDealOrchestratorService.scheduledDealCheck(userId);
  }

  @Post('manual-request')
  async manualDealRequest(
    @Body('userId') userId: string,
    @Body('location') location?: string,
    @Body('itineraryId') itineraryId?: string,
  ): Promise<BudgetDealOrchestrationResult> {
    return this.budgetDealOrchestratorService.manualDealRequest(userId, location, itineraryId);
  }

  @Post('clear-cache/:userId')
  async clearUserCache(@Body('userId') userId: string): Promise<{ success: boolean }> {
    await this.budgetDealOrchestratorService.clearUserCache(userId);
    return { success: true };
  }
}