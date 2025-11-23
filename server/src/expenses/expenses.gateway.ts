import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ExpensesService } from './expenses.service';
import { Logger, Inject, forwardRef } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*', // In production, specify your frontend URL
  },
  namespace: '/expenses',
})
export class ExpensesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('ExpensesGateway');
  private connectedClients: Map<string, string> = new Map(); // socketId -> userId

  constructor(
    @Inject(forwardRef(() => ExpensesService))
    private readonly expensesService: ExpensesService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    // You might want to authenticate the user here
    // For now, we'll assume userId is passed in the handshake
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.connectedClients.set(client.id, userId);
      client.join(`user_${userId}`);
      this.logger.log(`User ${userId} joined room user_${userId}`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  // Broadcast expense updates to connected users
  broadcastExpenseUpdate(userId: string, event: string, data: any) {
    this.server.to(`user_${userId}`).emit(event, data);
  }

  // Subscribe to expense updates
  @SubscribeMessage('subscribeToExpenses')
  handleSubscribeToExpenses(
    @MessageBody() data: { userId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { userId } = data;
    client.join(`user_${userId}`);
    this.logger.log(`Client ${client.id} subscribed to expense updates for user ${userId}`);

    return {
      event: 'subscribed',
      data: { message: 'Successfully subscribed to expense updates' },
    };
  }

  // Get real-time expense analytics
  @SubscribeMessage('getExpenseAnalytics')
  async handleGetExpenseAnalytics(
    @MessageBody() data: { userId: string; period?: 'week' | 'month' | 'year' },
    @ConnectedSocket() client: Socket,
  ) {
    const { userId, period = 'month' } = data;

    try {
      const analytics = await this.expensesService.getAnalytics(userId, period);
      return {
        event: 'expenseAnalytics',
        data: analytics,
      };
    } catch (error) {
      this.logger.error(`Error getting expense analytics: ${error.message}`);
      return {
        event: 'error',
        data: { message: 'Failed to get expense analytics' },
      };
    }
  }

  // Real-time expense creation notification
  notifyExpenseCreated(userId: string, expense: any) {
    this.broadcastExpenseUpdate(userId, 'expenseCreated', {
      expense,
      timestamp: new Date().toISOString(),
    });
  }

  // Real-time budget threshold alerts (total and daily)
  notifyBudgetThreshold(userId: string, budgetData: any) {
    this.broadcastExpenseUpdate(userId, 'budgetThreshold', {
      ...budgetData,
      timestamp: new Date().toISOString(),
    });
  }

  // Real-time transaction sync notifications
  notifyTransactionSynced(userId: string, transaction: any) {
    this.broadcastExpenseUpdate(userId, 'transactionSynced', {
      transaction,
      timestamp: new Date().toISOString(),
    });
  }
}