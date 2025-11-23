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
import { Injectable } from '@nestjs/common';
import { smartTripGoalsIntegration } from '../../../lib/ml/smart-trip-goals-integration';

interface GoalProgressUpdate {
  goalId: string;
  metric: string;
  value: number;
  timestamp: number;
  reason?: string;
}

interface GoalSubscription {
  userId: string;
  goalId?: string;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/goals',
})
export class GoalsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private activeConnections: Map<string, Socket[]> = new Map();
  private goalSubscriptions: Map<string, GoalSubscription> = new Map();

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (!userId) {
      client.disconnect();
      return;
    }

    // Store connection
    const connections = this.activeConnections.get(userId) || [];
    connections.push(client);
    this.activeConnections.set(userId, connections);

    console.log(`User ${userId} connected to goals WebSocket`);

    // Send welcome message with active goals
    this.sendActiveGoals(userId);
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      const connections = this.activeConnections.get(userId) || [];
      const index = connections.indexOf(client);
      if (index > -1) {
        connections.splice(index, 1);
        if (connections.length === 0) {
          this.activeConnections.delete(userId);
        } else {
          this.activeConnections.set(userId, connections);
        }
      }

      // Clean up subscriptions
      this.goalSubscriptions.delete(client.id);
    }

    console.log(`User ${userId} disconnected from goals WebSocket`);
  }

  @SubscribeMessage('subscribe_goal')
  handleSubscribeGoal(
    @MessageBody() data: { goalId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.handshake.query.userId as string;
    if (!userId) return;

    this.goalSubscriptions.set(client.id, {
      userId,
      goalId: data.goalId,
    });

    console.log(`User ${userId} subscribed to goal ${data.goalId}`);

    // Send current goal status
    this.sendGoalStatus(userId, data.goalId);
  }

  @SubscribeMessage('unsubscribe_goal')
  handleUnsubscribeGoal(@ConnectedSocket() client: Socket) {
    this.goalSubscriptions.delete(client.id);
  }

  @SubscribeMessage('update_progress')
  async handleProgressUpdate(
    @MessageBody() data: GoalProgressUpdate,
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.handshake.query.userId as string;
    if (!userId) return;

    try {
      // Update progress through the integration
      const result = await smartTripGoalsIntegration.updateProgressAndAdapt(
        data.goalId,
        {
          metric: data.metric,
          value: data.value,
          timestamp: data.timestamp,
          reason: data.reason,
        }
      );

      // Broadcast progress update to all user's connections
      this.broadcastToUser(userId, 'progress_updated', {
        goalId: data.goalId,
        progress: result.progressReport,
        adaptations: result.adaptations,
      });

      // If adaptations were made, send itinerary update
      if (result.adaptedItinerary) {
        this.broadcastToUser(userId, 'itinerary_adapted', {
          goalId: data.goalId,
          adaptedItinerary: result.adaptedItinerary,
          changes: result.adaptations,
        });
      }

    } catch (error) {
      console.error('Error updating goal progress:', error);
      client.emit('error', {
        type: 'progress_update_failed',
        message: 'Failed to update goal progress',
      });
    }
  }

  @SubscribeMessage('get_goal_status')
  handleGetGoalStatus(
    @MessageBody() data: { goalId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const userId = client.handshake.query.userId as string;
    if (!userId) return;

    this.sendGoalStatus(userId, data.goalId);
  }

  @SubscribeMessage('get_goal_recommendations')
  handleGetRecommendations(@ConnectedSocket() client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (!userId) return;

    try {
      // This would need user preferences - simplified for now
      const recommendations = smartTripGoalsIntegration.getGoalRecommendations(userId, {});
      client.emit('goal_recommendations', { recommendations });
    } catch (error) {
      console.error('Error getting goal recommendations:', error);
      client.emit('error', {
        type: 'recommendations_failed',
        message: 'Failed to get goal recommendations',
      });
    }
  }

  // Send active goals to user
  private sendActiveGoals(userId: string) {
    try {
      const goalData = smartTripGoalsIntegration.exportGoalData(userId);
      this.broadcastToUser(userId, 'active_goals', {
        goals: goalData.goals,
      });
    } catch (error) {
      console.error('Error sending active goals:', error);
    }
  }

  // Send specific goal status
  private sendGoalStatus(userId: string, goalId: string) {
    try {
      const goalData = smartTripGoalsIntegration.exportGoalData(userId);
      const goal = goalData.goals.find((g: any) => g.id === goalId);

      if (goal) {
        this.broadcastToUser(userId, 'goal_status', {
          goal,
        });
      }
    } catch (error) {
      console.error('Error sending goal status:', error);
    }
  }

  // Broadcast message to all connections of a user
  private broadcastToUser(userId: string, event: string, data: any) {
    const connections = this.activeConnections.get(userId);
    if (connections) {
      connections.forEach(client => {
        client.emit(event, data);
      });
    }
  }

  // Send real-time goal updates (called from progress tracking service)
  sendGoalUpdate(userId: string, updateType: string, data: any) {
    this.broadcastToUser(userId, updateType, data);
  }

  // Get active connections for a user (for external use)
  getUserConnections(userId: string): Socket[] {
    return this.activeConnections.get(userId) || [];
  }
}