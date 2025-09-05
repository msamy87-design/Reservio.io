import { Request, Response, NextFunction } from 'express';
import { collaborationService } from '../services/collaborationService';
import { logger } from '../utils/logger';

// Extend Request interface to include collaboration methods
declare global {
  namespace Express {
    interface Request {
      collaboration: {
        createRoom: (name: string, type: string, settings?: any) => Promise<any>;
        getRoom: (roomId: string) => Promise<any>;
        getBusinessRooms: (filters?: any) => Promise<any[]>;
        joinRoom: (roomId: string, role?: string) => Promise<boolean>;
        getRoomMessages: (roomId: string, limit?: number, before?: Date) => Promise<any[]>;
        createTask: (roomId: string, title: string, taskData: any) => Promise<any>;
        updateTask: (taskId: string, updates: any) => Promise<any>;
        getRoomTasks: (roomId: string, filters?: any) => Promise<any[]>;
        createWorkflowTemplate: (templateData: any) => Promise<any>;
        getWorkflowTemplates: (filters?: any) => Promise<any[]>;
        getCollaborationInsights: () => Promise<any>;
      };
    }
  }
}

// Collaboration middleware
export const collaborationMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const businessId = (req as any).user?.businessId;
    const userId = (req as any).user?.id;
    const userRole = (req as any).user?.role;

    // Add collaboration methods to request object
    req.collaboration = {
      // Create collaboration room
      createRoom: async (name: string, type: string, settings: any = {}) => {
        try {
          if (!businessId && userRole !== 'admin') {
            throw new Error('Business access required for room creation');
          }

          if (!userId) {
            throw new Error('User authentication required');
          }

          const targetBusinessId = businessId || 'admin';
          
          return await collaborationService.createRoom(
            targetBusinessId,
            name,
            type,
            settings,
            userId
          );
        } catch (error) {
          logger.error('Failed to create room:', error);
          throw error;
        }
      },

      // Get specific room
      getRoom: async (roomId: string) => {
        try {
          const room = await collaborationService.getRoom(roomId);
          if (!room) {
            return null;
          }

          // Check permissions
          if (userRole !== 'admin' && room.businessId !== businessId) {
            const participant = room.participants.find(p => p.userId === userId);
            if (!participant) {
              throw new Error('Unauthorized access to room');
            }
          }

          return room;
        } catch (error) {
          logger.error('Failed to get room:', error);
          throw error;
        }
      },

      // Get business rooms
      getBusinessRooms: async (filters: any = {}) => {
        try {
          const targetBusinessId = userRole === 'admin' ? filters.businessId || businessId : businessId;
          
          if (!targetBusinessId) {
            throw new Error('Business ID required');
          }

          const rooms = await collaborationService.getBusinessRooms(targetBusinessId, filters);
          
          // Filter rooms based on user permissions
          if (userRole !== 'admin') {
            return rooms.filter(room => 
              room.participants.some(p => p.userId === userId) || 
              !room.settings.isPrivate
            );
          }

          return rooms;
        } catch (error) {
          logger.error('Failed to get business rooms:', error);
          return [];
        }
      },

      // Join room
      joinRoom: async (roomId: string, role: string = 'member') => {
        try {
          if (!userId) {
            throw new Error('User authentication required');
          }

          const room = await collaborationService.getRoom(roomId);
          if (!room) {
            throw new Error('Room not found');
          }

          // Check permissions
          if (userRole !== 'admin' && room.businessId !== businessId) {
            if (room.settings.isPrivate && !room.participants.some(p => p.userId === userId)) {
              throw new Error('Access denied to private room');
            }
          }

          return await collaborationService.joinRoom(roomId, userId, role);
        } catch (error) {
          logger.error('Failed to join room:', error);
          throw error;
        }
      },

      // Get room messages
      getRoomMessages: async (roomId: string, limit: number = 50, before?: Date) => {
        try {
          const room = await collaborationService.getRoom(roomId);
          if (!room) {
            throw new Error('Room not found');
          }

          // Check permissions
          if (userRole !== 'admin' && room.businessId !== businessId) {
            const participant = room.participants.find(p => p.userId === userId);
            if (!participant) {
              throw new Error('Unauthorized access to room messages');
            }
          }

          return await collaborationService.getRoomMessages(roomId, limit, before);
        } catch (error) {
          logger.error('Failed to get room messages:', error);
          throw error;
        }
      },

      // Create task
      createTask: async (roomId: string, title: string, taskData: any) => {
        try {
          if (!userId) {
            throw new Error('User authentication required');
          }

          const room = await collaborationService.getRoom(roomId);
          if (!room) {
            throw new Error('Room not found');
          }

          // Check permissions
          if (userRole !== 'admin' && room.businessId !== businessId) {
            const participant = room.participants.find(p => p.userId === userId);
            if (!participant || !participant.permissions.includes('create_tasks')) {
              throw new Error('Insufficient permissions to create tasks');
            }
          }

          const targetBusinessId = room.businessId;
          
          return await collaborationService.createTask(
            roomId,
            targetBusinessId,
            title,
            userId,
            taskData
          );
        } catch (error) {
          logger.error('Failed to create task:', error);
          throw error;
        }
      },

      // Update task
      updateTask: async (taskId: string, updates: any) => {
        try {
          if (!userId) {
            throw new Error('User authentication required');
          }

          // For simplicity, allowing updates for now
          // In a real implementation, you'd check task ownership/permissions
          return await collaborationService.updateTask(taskId, updates);
        } catch (error) {
          logger.error('Failed to update task:', error);
          throw error;
        }
      },

      // Get room tasks
      getRoomTasks: async (roomId: string, filters: any = {}) => {
        try {
          const room = await collaborationService.getRoom(roomId);
          if (!room) {
            throw new Error('Room not found');
          }

          // Check permissions
          if (userRole !== 'admin' && room.businessId !== businessId) {
            const participant = room.participants.find(p => p.userId === userId);
            if (!participant) {
              throw new Error('Unauthorized access to room tasks');
            }
          }

          return await collaborationService.getRoomTasks(roomId, filters);
        } catch (error) {
          logger.error('Failed to get room tasks:', error);
          return [];
        }
      },

      // Create workflow template
      createWorkflowTemplate: async (templateData: any) => {
        try {
          if (!businessId && userRole !== 'admin') {
            throw new Error('Business access required for template creation');
          }

          if (!userId) {
            throw new Error('User authentication required');
          }

          const targetBusinessId = businessId || 'admin';
          
          return await collaborationService.createWorkflowTemplate(
            targetBusinessId,
            templateData,
            userId
          );
        } catch (error) {
          logger.error('Failed to create workflow template:', error);
          throw error;
        }
      },

      // Get workflow templates
      getWorkflowTemplates: async (filters: any = {}) => {
        try {
          const targetBusinessId = userRole === 'admin' ? filters.businessId || businessId : businessId;
          
          if (!targetBusinessId) {
            return []; // Return public templates only
          }

          return await collaborationService.getWorkflowTemplates(targetBusinessId, filters);
        } catch (error) {
          logger.error('Failed to get workflow templates:', error);
          return [];
        }
      },

      // Get collaboration insights
      getCollaborationInsights: async () => {
        try {
          const targetBusinessId = businessId;
          
          if (!targetBusinessId) {
            throw new Error('Business ID required for insights');
          }

          const rooms = await collaborationService.getBusinessRooms(targetBusinessId);
          const stats = await collaborationService.getStats();
          
          // Calculate business-specific insights
          const activeRooms = rooms.filter(room => room.isActive).length;
          const totalParticipants = rooms.reduce((sum, room) => sum + room.participants.length, 0);
          const avgParticipantsPerRoom = activeRooms > 0 ? Math.round(totalParticipants / activeRooms) : 0;

          const roomTypes = rooms.reduce((acc, room) => {
            acc[room.roomType] = (acc[room.roomType] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          return {
            overview: {
              activeRooms,
              totalParticipants,
              avgParticipantsPerRoom,
              roomTypes
            },
            stats,
            recommendations: [
              ...(activeRooms === 0 ? [{
                priority: 'high',
                category: 'setup',
                title: 'Create Your First Collaboration Room',
                description: 'Start collaborating with your team by creating a room for communication and task management.',
                actionItems: ['Go to Collaboration section', 'Click Create Room', 'Invite team members']
              }] : []),
              ...(stats.tasks.completionRate < 50 ? [{
                priority: 'medium',
                category: 'productivity',
                title: 'Improve Task Completion Rate',
                description: 'Your team\'s task completion rate could be improved with better task management practices.',
                actionItems: ['Set clear deadlines', 'Assign specific team members', 'Use progress tracking']
              }] : []),
              ...(stats.messaging.avgMessagesPerRoom < 10 ? [{
                priority: 'low',
                category: 'engagement',
                title: 'Increase Team Communication',
                description: 'Encourage more active communication within your collaboration rooms.',
                actionItems: ['Hold regular check-ins', 'Use @mentions effectively', 'Share updates frequently']
              }] : [])
            ],
            generatedAt: new Date()
          };
        } catch (error) {
          logger.error('Failed to get collaboration insights:', error);
          throw error;
        }
      }
    };

    next();
  } catch (error) {
    logger.error('Collaboration middleware error:', error);
    // Don't block the request if collaboration fails
    req.collaboration = {
      createRoom: async () => { throw new Error('Collaboration unavailable'); },
      getRoom: async () => null,
      getBusinessRooms: async () => [],
      joinRoom: async () => { throw new Error('Collaboration unavailable'); },
      getRoomMessages: async () => [],
      createTask: async () => { throw new Error('Collaboration unavailable'); },
      updateTask: async () => { throw new Error('Collaboration unavailable'); },
      getRoomTasks: async () => [],
      createWorkflowTemplate: async () => { throw new Error('Collaboration unavailable'); },
      getWorkflowTemplates: async () => [],
      getCollaborationInsights: async () => { throw new Error('Collaboration unavailable'); }
    };
    next();
  }
};

// Create collaboration routes
export const createCollaborationRoutes = (express: any) => {
  const router = express.Router();

  // Room Management Routes

  // Create room
  router.post('/rooms', async (req: Request, res: Response) => {
    try {
      const { name, type, settings = {} } = req.body;
      
      if (!name || !type) {
        return res.status(400).json({ error: 'Room name and type are required' });
      }

      const room = await req.collaboration.createRoom(name, type, settings);
      res.status(201).json(room);
    } catch (error) {
      logger.error('Failed to create room:', error);
      res.status(error.message.includes('required') ? 403 : 500)
        .json({ error: error.message || 'Failed to create room' });
    }
  });

  // Get business rooms
  router.get('/rooms', async (req: Request, res: Response) => {
    try {
      const filters = {
        roomType: req.query.roomType,
        limit: parseInt(req.query.limit as string) || 50,
        businessId: req.query.businessId // For admin access
      };

      const rooms = await req.collaboration.getBusinessRooms(filters);
      res.json({ rooms, count: rooms.length });
    } catch (error) {
      logger.error('Failed to get rooms:', error);
      res.status(500).json({ error: 'Failed to get rooms' });
    }
  });

  // Get specific room
  router.get('/rooms/:roomId', async (req: Request, res: Response) => {
    try {
      const { roomId } = req.params;
      const room = await req.collaboration.getRoom(roomId);
      
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      res.json(room);
    } catch (error) {
      logger.error('Failed to get room:', error);
      res.status(error.message.includes('Unauthorized') ? 403 : 500)
        .json({ error: error.message || 'Failed to get room' });
    }
  });

  // Join room
  router.post('/rooms/:roomId/join', async (req: Request, res: Response) => {
    try {
      const { roomId } = req.params;
      const { role = 'member' } = req.body;
      
      const success = await req.collaboration.joinRoom(roomId, role);
      
      if (success) {
        res.json({ success: true, message: 'Successfully joined room' });
      } else {
        res.status(400).json({ error: 'Failed to join room' });
      }
    } catch (error) {
      logger.error('Failed to join room:', error);
      res.status(error.message.includes('denied') || error.message.includes('Unauthorized') ? 403 : 500)
        .json({ error: error.message || 'Failed to join room' });
    }
  });

  // Message Management Routes

  // Get room messages
  router.get('/rooms/:roomId/messages', async (req: Request, res: Response) => {
    try {
      const { roomId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const before = req.query.before ? new Date(req.query.before as string) : undefined;
      
      const messages = await req.collaboration.getRoomMessages(roomId, limit, before);
      res.json({ messages, count: messages.length });
    } catch (error) {
      logger.error('Failed to get messages:', error);
      res.status(error.message.includes('Unauthorized') ? 403 : 500)
        .json({ error: error.message || 'Failed to get messages' });
    }
  });

  // Task Management Routes

  // Create task
  router.post('/rooms/:roomId/tasks', async (req: Request, res: Response) => {
    try {
      const { roomId } = req.params;
      const { title, ...taskData } = req.body;
      
      if (!title) {
        return res.status(400).json({ error: 'Task title is required' });
      }

      const task = await req.collaboration.createTask(roomId, title, taskData);
      res.status(201).json(task);
    } catch (error) {
      logger.error('Failed to create task:', error);
      res.status(error.message.includes('permissions') || error.message.includes('Unauthorized') ? 403 : 500)
        .json({ error: error.message || 'Failed to create task' });
    }
  });

  // Get room tasks
  router.get('/rooms/:roomId/tasks', async (req: Request, res: Response) => {
    try {
      const { roomId } = req.params;
      const filters = {
        status: req.query.status,
        assignee: req.query.assignee,
        limit: parseInt(req.query.limit as string) || 100
      };

      const tasks = await req.collaboration.getRoomTasks(roomId, filters);
      res.json({ tasks, count: tasks.length });
    } catch (error) {
      logger.error('Failed to get tasks:', error);
      res.status(error.message.includes('Unauthorized') ? 403 : 500)
        .json({ error: error.message || 'Failed to get tasks' });
    }
  });

  // Update task
  router.put('/tasks/:taskId', async (req: Request, res: Response) => {
    try {
      const { taskId } = req.params;
      const task = await req.collaboration.updateTask(taskId, req.body);
      
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      res.json(task);
    } catch (error) {
      logger.error('Failed to update task:', error);
      res.status(500).json({ error: 'Failed to update task' });
    }
  });

  // Workflow Template Routes

  // Create workflow template
  router.post('/workflow-templates', async (req: Request, res: Response) => {
    try {
      const template = await req.collaboration.createWorkflowTemplate(req.body);
      res.status(201).json(template);
    } catch (error) {
      logger.error('Failed to create workflow template:', error);
      res.status(error.message.includes('required') ? 403 : 500)
        .json({ error: error.message || 'Failed to create template' });
    }
  });

  // Get workflow templates
  router.get('/workflow-templates', async (req: Request, res: Response) => {
    try {
      const filters = {
        category: req.query.category,
        limit: parseInt(req.query.limit as string) || 20,
        businessId: req.query.businessId // For admin access
      };

      const templates = await req.collaboration.getWorkflowTemplates(filters);
      res.json({ templates, count: templates.length });
    } catch (error) {
      logger.error('Failed to get workflow templates:', error);
      res.status(500).json({ error: 'Failed to get templates' });
    }
  });

  // Insights and Analytics Routes

  // Get collaboration insights
  router.get('/insights', async (req: Request, res: Response) => {
    try {
      const insights = await req.collaboration.getCollaborationInsights();
      res.json(insights);
    } catch (error) {
      logger.error('Failed to get collaboration insights:', error);
      res.status(500).json({ error: 'Failed to get insights' });
    }
  });

  // Collaboration Overview
  router.get('/overview', async (req: Request, res: Response) => {
    try {
      const rooms = await req.collaboration.getBusinessRooms({ limit: 5 });
      const insights = await req.collaboration.getCollaborationInsights();

      res.json({
        summary: {
          roomsCount: rooms.length,
          activeRooms: rooms.filter((room: any) => room.isActive).length
        },
        recentRooms: rooms.slice(0, 3),
        insights: insights,
        generatedAt: new Date()
      });
    } catch (error) {
      logger.error('Failed to get collaboration overview:', error);
      res.status(500).json({ error: 'Failed to get overview' });
    }
  });

  // Health check for collaboration service
  router.get('/health', async (req: Request, res: Response) => {
    try {
      const isConfigured = collaborationService.isConfigured();
      const stats = await collaborationService.getStats();
      
      res.json({
        status: 'ok',
        configuration: isConfigured,
        statistics: stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Collaboration health check failed:', error);
      res.status(500).json({ error: 'Collaboration service unavailable' });
    }
  });

  return router;
};

// Collaboration tracking middleware for specific routes
export const trackCollaborationEvents = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const originalJson = res.json;
      
      res.json = function(body: any) {
        // Track collaboration events if response is successful
        if (res.statusCode < 400) {
          const eventType = req.path.includes('rooms') ? 'room' : 
                           req.path.includes('tasks') ? 'task' :
                           req.path.includes('templates') ? 'template' : 'collaboration';
          
          logger.info('Collaboration event tracked:', {
            eventType,
            action: req.method,
            endpoint: req.path,
            userId: (req as any).user?.id,
            businessId: (req as any).user?.businessId,
            timestamp: new Date()
          });
        }
        
        return originalJson.call(this, body);
      };
      
      next();
    } catch (error) {
      logger.error('Collaboration tracking error:', error);
      next();
    }
  };
};