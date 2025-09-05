import mongoose, { Document, Schema } from 'mongoose';
import { Server as SocketIOServer } from 'socket.io';
import { logger } from '../utils/logger';
import { cacheService } from './cacheService';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Real-time Collaboration Types
interface ICollaborationRoom extends Document {
  roomId: string;
  businessId: string;
  roomName: string;
  roomType: 'team_chat' | 'project_workspace' | 'customer_support' | 'training_session' | 'meeting_room';
  description?: string;
  
  // Room settings
  settings: {
    isPrivate: boolean;
    requiresApproval: boolean;
    maxParticipants: number;
    allowGuests: boolean;
    recordSession: boolean;
    enableAI: boolean;
    autoTranscription: boolean;
  };
  
  // Participants
  participants: {
    userId: string;
    role: 'owner' | 'admin' | 'member' | 'guest';
    joinedAt: Date;
    lastSeen: Date;
    permissions: string[];
    status: 'online' | 'away' | 'busy' | 'offline';
  }[];
  
  // Room metadata
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ICollaborationMessage extends Document {
  roomId: string;
  messageId: string;
  senderId: string;
  senderName: string;
  messageType: 'text' | 'file' | 'image' | 'voice' | 'video' | 'system' | 'task' | 'poll';
  
  // Message content
  content: {
    text?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    metadata?: Record<string, any>;
  };
  
  // Message features
  replyTo?: string;
  mentions: string[];
  reactions: {
    emoji: string;
    userId: string;
    timestamp: Date;
  }[];
  
  // AI features
  aiAnalysis?: {
    sentiment: string;
    priority: 'low' | 'medium' | 'high';
    categories: string[];
    summary?: string;
    actionItems?: string[];
  };
  
  // Message status
  isEdited: boolean;
  isDeleted: boolean;
  editHistory: {
    editedAt: Date;
    previousContent: string;
  }[];
  
  createdAt: Date;
  updatedAt: Date;
}

interface ICollaborationTask extends Document {
  taskId: string;
  roomId: string;
  businessId: string;
  title: string;
  description?: string;
  
  // Task details
  assignee?: string;
  assignedBy: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  dueDate?: Date;
  
  // Task metadata
  tags: string[];
  attachments: {
    fileName: string;
    fileUrl: string;
    uploadedBy: string;
    uploadedAt: Date;
  }[];
  
  // Collaboration features
  comments: {
    commentId: string;
    userId: string;
    userName: string;
    content: string;
    timestamp: Date;
  }[];
  
  // Progress tracking
  progressUpdates: {
    updateId: string;
    userId: string;
    userName: string;
    progress: number; // 0-100
    notes?: string;
    timestamp: Date;
  }[];
  
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

interface IWorkflowTemplate extends Document {
  templateId: string;
  businessId: string;
  templateName: string;
  description: string;
  category: 'project_management' | 'customer_service' | 'sales' | 'operations' | 'custom';
  
  // Workflow steps
  steps: {
    stepId: string;
    title: string;
    description: string;
    assigneeRole: string;
    estimatedDuration: number; // minutes
    dependencies: string[]; // stepIds
    automationRules?: {
      trigger: string;
      action: string;
      conditions: Record<string, any>;
    }[];
  }[];
  
  // Template metadata
  isPublic: boolean;
  usageCount: number;
  averageCompletionTime: number;
  successRate: number;
  
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// MongoDB Schemas
const collaborationRoomSchema = new Schema<ICollaborationRoom>({
  roomId: { type: String, required: true, unique: true, index: true },
  businessId: { type: String, required: true, index: true },
  roomName: { type: String, required: true },
  roomType: {
    type: String,
    required: true,
    enum: ['team_chat', 'project_workspace', 'customer_support', 'training_session', 'meeting_room']
  },
  description: String,
  
  settings: {
    isPrivate: { type: Boolean, default: false },
    requiresApproval: { type: Boolean, default: false },
    maxParticipants: { type: Number, default: 50, min: 2, max: 500 },
    allowGuests: { type: Boolean, default: false },
    recordSession: { type: Boolean, default: false },
    enableAI: { type: Boolean, default: true },
    autoTranscription: { type: Boolean, default: false }
  },
  
  participants: [{
    userId: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ['owner', 'admin', 'member', 'guest'],
      default: 'member'
    },
    joinedAt: { type: Date, default: Date.now },
    lastSeen: { type: Date, default: Date.now },
    permissions: [String],
    status: {
      type: String,
      enum: ['online', 'away', 'busy', 'offline'],
      default: 'offline'
    }
  }],
  
  isActive: { type: Boolean, default: true },
  createdBy: { type: String, required: true }
}, {
  timestamps: true
});

const collaborationMessageSchema = new Schema<ICollaborationMessage>({
  roomId: { type: String, required: true, index: true },
  messageId: { type: String, required: true, unique: true },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  messageType: {
    type: String,
    required: true,
    enum: ['text', 'file', 'image', 'voice', 'video', 'system', 'task', 'poll'],
    default: 'text'
  },
  
  content: {
    text: String,
    fileUrl: String,
    fileName: String,
    fileSize: Number,
    metadata: { type: Map, of: Schema.Types.Mixed }
  },
  
  replyTo: String,
  mentions: [String],
  reactions: [{
    emoji: { type: String, required: true },
    userId: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  
  aiAnalysis: {
    sentiment: { type: String, enum: ['positive', 'negative', 'neutral'] },
    priority: { type: String, enum: ['low', 'medium', 'high'] },
    categories: [String],
    summary: String,
    actionItems: [String]
  },
  
  isEdited: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  editHistory: [{
    editedAt: { type: Date, required: true },
    previousContent: { type: String, required: true }
  }]
}, {
  timestamps: true
});

const collaborationTaskSchema = new Schema<ICollaborationTask>({
  taskId: { type: String, required: true, unique: true },
  roomId: { type: String, required: true, index: true },
  businessId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  description: String,
  
  assignee: String,
  assignedBy: { type: String, required: true },
  priority: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  dueDate: Date,
  
  tags: [String],
  attachments: [{
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    uploadedBy: { type: String, required: true },
    uploadedAt: { type: Date, default: Date.now }
  }],
  
  comments: [{
    commentId: { type: String, required: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  
  progressUpdates: [{
    updateId: { type: String, required: true },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    progress: { type: Number, required: true, min: 0, max: 100 },
    notes: String,
    timestamp: { type: Date, default: Date.now }
  }],
  
  completedAt: Date
}, {
  timestamps: true
});

const workflowTemplateSchema = new Schema<IWorkflowTemplate>({
  templateId: { type: String, required: true, unique: true },
  businessId: { type: String, required: true, index: true },
  templateName: { type: String, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: ['project_management', 'customer_service', 'sales', 'operations', 'custom']
  },
  
  steps: [{
    stepId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    assigneeRole: { type: String, required: true },
    estimatedDuration: { type: Number, required: true, min: 1 },
    dependencies: [String],
    automationRules: [{
      trigger: { type: String, required: true },
      action: { type: String, required: true },
      conditions: { type: Map, of: Schema.Types.Mixed }
    }]
  }],
  
  isPublic: { type: Boolean, default: false },
  usageCount: { type: Number, default: 0 },
  averageCompletionTime: { type: Number, default: 0 },
  successRate: { type: Number, default: 0, min: 0, max: 100 },
  
  createdBy: { type: String, required: true }
}, {
  timestamps: true
});

// Create indexes for performance
collaborationRoomSchema.index({ businessId: 1, isActive: 1 });
collaborationRoomSchema.index({ roomType: 1 });
collaborationRoomSchema.index({ 'participants.userId': 1 });

collaborationMessageSchema.index({ roomId: 1, createdAt: -1 });
collaborationMessageSchema.index({ senderId: 1 });
collaborationMessageSchema.index({ mentions: 1 });
collaborationMessageSchema.index({ 'aiAnalysis.priority': 1 });

collaborationTaskSchema.index({ roomId: 1, status: 1 });
collaborationTaskSchema.index({ assignee: 1, status: 1 });
collaborationTaskSchema.index({ businessId: 1, dueDate: 1 });
collaborationTaskSchema.index({ priority: 1, status: 1 });

workflowTemplateSchema.index({ businessId: 1, category: 1 });
workflowTemplateSchema.index({ isPublic: 1, category: 1 });
workflowTemplateSchema.index({ usageCount: -1 });

// MongoDB Models
const CollaborationRoom = mongoose.model<ICollaborationRoom>('CollaborationRoom', collaborationRoomSchema);
const CollaborationMessage = mongoose.model<ICollaborationMessage>('CollaborationMessage', collaborationMessageSchema);
const CollaborationTask = mongoose.model<ICollaborationTask>('CollaborationTask', collaborationTaskSchema);
const WorkflowTemplate = mongoose.model<IWorkflowTemplate>('WorkflowTemplate', workflowTemplateSchema);

// Real-time Collaboration Service
export class CollaborationService {
  private io: SocketIOServer | null = null;
  private genAI: GoogleGenerativeAI | null = null;
  private isInitialized = false;
  private activeConnections = new Map<string, { userId: string; rooms: Set<string> }>();

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      if (process.env.GEMINI_API_KEY) {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        logger.info('Collaboration Service initialized with AI capabilities');
      } else {
        logger.warn('No Gemini API key found, AI features will be limited');
      }
      this.isInitialized = true;
    } catch (error) {
      logger.error('Failed to initialize Collaboration Service:', error);
    }
  }

  // Socket.IO Integration
  initializeSocketIO(server: any) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.io.on('connection', (socket) => {
      logger.info('User connected to collaboration service:', socket.id);

      // Handle user authentication
      socket.on('authenticate', async (data: { userId: string; token: string }) => {
        try {
          // In a real implementation, validate the token
          const { userId } = data;
          
          this.activeConnections.set(socket.id, {
            userId,
            rooms: new Set()
          });

          socket.emit('authenticated', { userId, socketId: socket.id });
          logger.info('User authenticated:', { userId, socketId: socket.id });
        } catch (error) {
          socket.emit('auth_error', { error: 'Authentication failed' });
        }
      });

      // Handle room joining
      socket.on('join_room', async (data: { roomId: string }) => {
        try {
          const connection = this.activeConnections.get(socket.id);
          if (!connection) {
            socket.emit('error', { error: 'Not authenticated' });
            return;
          }

          const room = await this.getRoom(data.roomId);
          if (!room) {
            socket.emit('error', { error: 'Room not found' });
            return;
          }

          // Check permissions
          const participant = room.participants.find(p => p.userId === connection.userId);
          if (!participant && room.settings.requiresApproval) {
            socket.emit('error', { error: 'Access denied to room' });
            return;
          }

          socket.join(data.roomId);
          connection.rooms.add(data.roomId);

          // Update participant status
          await this.updateParticipantStatus(data.roomId, connection.userId, 'online');

          socket.emit('joined_room', { roomId: data.roomId });
          socket.to(data.roomId).emit('user_joined', {
            userId: connection.userId,
            timestamp: new Date()
          });

          logger.info('User joined room:', {
            userId: connection.userId,
            roomId: data.roomId
          });
        } catch (error) {
          socket.emit('error', { error: 'Failed to join room' });
        }
      });

      // Handle message sending
      socket.on('send_message', async (data: {
        roomId: string;
        messageType: string;
        content: any;
        replyTo?: string;
        mentions?: string[];
      }) => {
        try {
          const connection = this.activeConnections.get(socket.id);
          if (!connection) {
            socket.emit('error', { error: 'Not authenticated' });
            return;
          }

          const message = await this.createMessage(
            data.roomId,
            connection.userId,
            data.messageType,
            data.content,
            data.replyTo,
            data.mentions
          );

          // Broadcast message to room
          this.io!.to(data.roomId).emit('new_message', message);

          // Send push notifications to mentioned users
          if (data.mentions && data.mentions.length > 0) {
            await this.sendMentionNotifications(data.mentions, message);
          }
        } catch (error) {
          socket.emit('error', { error: 'Failed to send message' });
        }
      });

      // Handle typing indicators
      socket.on('typing_start', (data: { roomId: string }) => {
        const connection = this.activeConnections.get(socket.id);
        if (connection) {
          socket.to(data.roomId).emit('user_typing', {
            userId: connection.userId,
            action: 'start'
          });
        }
      });

      socket.on('typing_stop', (data: { roomId: string }) => {
        const connection = this.activeConnections.get(socket.id);
        if (connection) {
          socket.to(data.roomId).emit('user_typing', {
            userId: connection.userId,
            action: 'stop'
          });
        }
      });

      // Handle task updates
      socket.on('task_update', async (data: {
        taskId: string;
        updates: any;
      }) => {
        try {
          const connection = this.activeConnections.get(socket.id);
          if (!connection) return;

          const task = await this.updateTask(data.taskId, data.updates);
          if (task) {
            this.io!.to(task.roomId).emit('task_updated', {
              taskId: data.taskId,
              updates: data.updates,
              updatedBy: connection.userId,
              timestamp: new Date()
            });
          }
        } catch (error) {
          socket.emit('error', { error: 'Failed to update task' });
        }
      });

      // Handle disconnection
      socket.on('disconnect', async () => {
        const connection = this.activeConnections.get(socket.id);
        if (connection) {
          // Update user status in all rooms
          for (const roomId of connection.rooms) {
            await this.updateParticipantStatus(connection.userId, roomId, 'offline');
            socket.to(roomId).emit('user_left', {
              userId: connection.userId,
              timestamp: new Date()
            });
          }

          this.activeConnections.delete(socket.id);
          logger.info('User disconnected:', { userId: connection.userId, socketId: socket.id });
        }
      });
    });

    logger.info('Socket.IO initialized for collaboration service');
  }

  // Room Management
  async createRoom(
    businessId: string,
    roomName: string,
    roomType: string,
    settings: any,
    createdBy: string
  ): Promise<ICollaborationRoom> {
    try {
      const roomId = this.generateRoomId();
      
      const room = new CollaborationRoom({
        roomId,
        businessId,
        roomName,
        roomType,
        settings: {
          isPrivate: false,
          requiresApproval: false,
          maxParticipants: 50,
          allowGuests: false,
          recordSession: false,
          enableAI: true,
          autoTranscription: false,
          ...settings
        },
        participants: [{
          userId: createdBy,
          role: 'owner',
          joinedAt: new Date(),
          lastSeen: new Date(),
          permissions: ['all'],
          status: 'online'
        }],
        createdBy
      });

      await room.save();

      // Cache the room
      await cacheService.set(`collaboration_room:${roomId}`, room, 3600);

      logger.info('Collaboration room created:', {
        roomId,
        businessId,
        roomName,
        roomType,
        createdBy
      });

      return room;
    } catch (error) {
      logger.error('Failed to create collaboration room:', error);
      throw error;
    }
  }

  async getRoom(roomId: string): Promise<ICollaborationRoom | null> {
    try {
      // Try cache first
      const cached = await cacheService.get(`collaboration_room:${roomId}`);
      if (cached) {
        return cached;
      }

      const room = await CollaborationRoom.findOne({ roomId });
      if (room) {
        await cacheService.set(`collaboration_room:${roomId}`, room, 3600);
      }

      return room;
    } catch (error) {
      logger.error('Failed to get room:', error);
      return null;
    }
  }

  async getBusinessRooms(businessId: string, filters: any = {}): Promise<ICollaborationRoom[]> {
    try {
      const query: any = { businessId, isActive: true };
      
      if (filters.roomType) {
        query.roomType = filters.roomType;
      }

      const rooms = await CollaborationRoom.find(query)
        .sort({ updatedAt: -1 })
        .limit(filters.limit || 50);

      return rooms;
    } catch (error) {
      logger.error('Failed to get business rooms:', error);
      return [];
    }
  }

  async joinRoom(roomId: string, userId: string, role: string = 'member'): Promise<boolean> {
    try {
      const room = await this.getRoom(roomId);
      if (!room) {
        return false;
      }

      // Check if user is already a participant
      const existingParticipant = room.participants.find(p => p.userId === userId);
      if (existingParticipant) {
        existingParticipant.status = 'online';
        existingParticipant.lastSeen = new Date();
      } else {
        room.participants.push({
          userId,
          role: role as any,
          joinedAt: new Date(),
          lastSeen: new Date(),
          permissions: ['read', 'write'],
          status: 'online'
        });
      }

      await room.save();
      await cacheService.set(`collaboration_room:${roomId}`, room, 3600);

      return true;
    } catch (error) {
      logger.error('Failed to join room:', error);
      return false;
    }
  }

  async updateParticipantStatus(roomId: string, userId: string, status: string): Promise<void> {
    try {
      const room = await this.getRoom(roomId);
      if (!room) return;

      const participant = room.participants.find(p => p.userId === userId);
      if (participant) {
        participant.status = status as any;
        participant.lastSeen = new Date();
        await room.save();
        await cacheService.set(`collaboration_room:${roomId}`, room, 3600);
      }
    } catch (error) {
      logger.error('Failed to update participant status:', error);
    }
  }

  // Message Management
  async createMessage(
    roomId: string,
    senderId: string,
    messageType: string,
    content: any,
    replyTo?: string,
    mentions?: string[]
  ): Promise<ICollaborationMessage> {
    try {
      const messageId = this.generateMessageId();
      
      // AI analysis for text messages
      let aiAnalysis;
      if (messageType === 'text' && content.text && this.genAI) {
        aiAnalysis = await this.analyzeMessage(content.text);
      }

      const message = new CollaborationMessage({
        roomId,
        messageId,
        senderId,
        senderName: 'User', // This should be fetched from user service
        messageType,
        content,
        replyTo,
        mentions: mentions || [],
        reactions: [],
        aiAnalysis,
        isEdited: false,
        isDeleted: false,
        editHistory: []
      });

      await message.save();

      // Update room's last activity
      await CollaborationRoom.updateOne(
        { roomId },
        { updatedAt: new Date() }
      );

      logger.info('Message created:', {
        messageId,
        roomId,
        senderId,
        messageType
      });

      return message;
    } catch (error) {
      logger.error('Failed to create message:', error);
      throw error;
    }
  }

  async getRoomMessages(
    roomId: string,
    limit: number = 50,
    before?: Date
  ): Promise<ICollaborationMessage[]> {
    try {
      const query: any = { roomId, isDeleted: false };
      
      if (before) {
        query.createdAt = { $lt: before };
      }

      const messages = await CollaborationMessage.find(query)
        .sort({ createdAt: -1 })
        .limit(limit);

      return messages.reverse(); // Return in chronological order
    } catch (error) {
      logger.error('Failed to get room messages:', error);
      return [];
    }
  }

  private async analyzeMessage(text: string): Promise<any> {
    if (!this.genAI) return null;

    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
      
      const prompt = `
        Analyze this message for business collaboration context:
        "${text}"
        
        Please provide a JSON response with:
        {
          "sentiment": "positive|negative|neutral",
          "priority": "low|medium|high",
          "categories": ["category1", "category2"],
          "summary": "brief summary if needed",
          "actionItems": ["action1", "action2"] // if any tasks are mentioned
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const analysisText = response.text();
      
      try {
        return JSON.parse(analysisText);
      } catch {
        return {
          sentiment: 'neutral',
          priority: 'low',
          categories: ['general'],
          summary: '',
          actionItems: []
        };
      }
    } catch (error) {
      logger.error('Message analysis failed:', error);
      return null;
    }
  }

  // Task Management
  async createTask(
    roomId: string,
    businessId: string,
    title: string,
    assignedBy: string,
    taskData: any
  ): Promise<ICollaborationTask> {
    try {
      const taskId = this.generateTaskId();
      
      const task = new CollaborationTask({
        taskId,
        roomId,
        businessId,
        title,
        description: taskData.description,
        assignee: taskData.assignee,
        assignedBy,
        priority: taskData.priority || 'medium',
        status: 'pending',
        dueDate: taskData.dueDate,
        tags: taskData.tags || [],
        attachments: [],
        comments: [],
        progressUpdates: []
      });

      await task.save();

      // Notify room participants
      if (this.io) {
        this.io.to(roomId).emit('task_created', {
          task,
          createdBy: assignedBy,
          timestamp: new Date()
        });
      }

      logger.info('Task created:', {
        taskId,
        roomId,
        title,
        assignedBy
      });

      return task;
    } catch (error) {
      logger.error('Failed to create task:', error);
      throw error;
    }
  }

  async updateTask(taskId: string, updates: any): Promise<ICollaborationTask | null> {
    try {
      const task = await CollaborationTask.findOneAndUpdate(
        { taskId },
        { ...updates, updatedAt: new Date() },
        { new: true }
      );

      if (task && updates.status === 'completed') {
        task.completedAt = new Date();
        await task.save();
      }

      return task;
    } catch (error) {
      logger.error('Failed to update task:', error);
      return null;
    }
  }

  async getRoomTasks(roomId: string, filters: any = {}): Promise<ICollaborationTask[]> {
    try {
      const query: any = { roomId };
      
      if (filters.status) {
        query.status = filters.status;
      }
      
      if (filters.assignee) {
        query.assignee = filters.assignee;
      }

      const tasks = await CollaborationTask.find(query)
        .sort({ createdAt: -1 })
        .limit(filters.limit || 100);

      return tasks;
    } catch (error) {
      logger.error('Failed to get room tasks:', error);
      return [];
    }
  }

  // Workflow Templates
  async createWorkflowTemplate(
    businessId: string,
    templateData: any,
    createdBy: string
  ): Promise<IWorkflowTemplate> {
    try {
      const templateId = this.generateTemplateId();
      
      const template = new WorkflowTemplate({
        templateId,
        businessId,
        templateName: templateData.templateName,
        description: templateData.description,
        category: templateData.category,
        steps: templateData.steps.map((step: any, index: number) => ({
          ...step,
          stepId: step.stepId || `step_${index + 1}`
        })),
        isPublic: templateData.isPublic || false,
        createdBy
      });

      await template.save();

      logger.info('Workflow template created:', {
        templateId,
        businessId,
        templateName: templateData.templateName
      });

      return template;
    } catch (error) {
      logger.error('Failed to create workflow template:', error);
      throw error;
    }
  }

  async getWorkflowTemplates(businessId: string, filters: any = {}): Promise<IWorkflowTemplate[]> {
    try {
      const query: any = {
        $or: [
          { businessId },
          { isPublic: true }
        ]
      };
      
      if (filters.category) {
        query.category = filters.category;
      }

      const templates = await WorkflowTemplate.find(query)
        .sort({ usageCount: -1, createdAt: -1 })
        .limit(filters.limit || 20);

      return templates;
    } catch (error) {
      logger.error('Failed to get workflow templates:', error);
      return [];
    }
  }

  // Utility methods
  private generateRoomId(): string {
    return `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTemplateId(): string {
    return `tmpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async sendMentionNotifications(mentions: string[], message: any): Promise<void> {
    // In a real implementation, this would integrate with the push notification service
    logger.info('Sending mention notifications:', { mentions, messageId: message.messageId });
  }

  // Service status and statistics
  isConfigured(): any {
    return {
      database: this.isInitialized,
      ai: !!this.genAI,
      socketIO: !!this.io,
      realTime: true,
      messaging: true,
      tasks: true,
      workflows: true
    };
  }

  async getStats(): Promise<any> {
    try {
      const totalRooms = await CollaborationRoom.countDocuments({ isActive: true });
      const totalMessages = await CollaborationMessage.countDocuments({ isDeleted: false });
      const totalTasks = await CollaborationTask.countDocuments();
      const completedTasks = await CollaborationTask.countDocuments({ status: 'completed' });
      const totalTemplates = await WorkflowTemplate.countDocuments();
      const activeConnections = this.activeConnections.size;

      return {
        rooms: {
          total: totalRooms,
          active: totalRooms
        },
        messaging: {
          totalMessages,
          avgMessagesPerRoom: totalRooms > 0 ? Math.round(totalMessages / totalRooms) : 0
        },
        tasks: {
          total: totalTasks,
          completed: completedTasks,
          completionRate: totalTasks > 0 ? (completedTasks / totalTasks * 100) : 0
        },
        templates: {
          total: totalTemplates,
          avgUsage: 0 // This would be calculated from actual usage data
        },
        realTime: {
          activeConnections,
          connectedUsers: Array.from(this.activeConnections.values()).map(c => c.userId).length
        }
      };
    } catch (error) {
      logger.error('Failed to get collaboration stats:', error);
      return {
        rooms: { total: 0, active: 0 },
        messaging: { totalMessages: 0, avgMessagesPerRoom: 0 },
        tasks: { total: 0, completed: 0, completionRate: 0 },
        templates: { total: 0, avgUsage: 0 },
        realTime: { activeConnections: 0, connectedUsers: 0 }
      };
    }
  }
}

// Export singleton instance
export const collaborationService = new CollaborationService();