import swaggerJSDoc from 'swagger-jsdoc';
import { SwaggerDefinition } from 'swagger-jsdoc';

const swaggerDefinition: SwaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Reservio Marketplace API',
    version: '1.0.0',
    description: 'Comprehensive API documentation for the Reservio beauty and wellness marketplace platform',
    contact: {
      name: 'Reservio API Support',
      email: 'api-support@reservio.com',
      url: 'https://docs.reservio.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3001/api',
      description: 'Development server'
    },
    {
      url: 'https://api.reservio.com/api',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Access Token for authenticated requests'
      },
      refreshToken: {
        type: 'apiKey',
        in: 'cookie',
        name: 'refreshToken',
        description: 'HTTP-only refresh token cookie'
      }
    },
    schemas: {
      // User Models
      CustomerUser: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique customer identifier'
          },
          fullName: {
            type: 'string',
            description: 'Customer full name',
            example: 'John Doe'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Customer email address',
            example: 'john.doe@example.com'
          },
          phone: {
            type: 'string',
            description: 'Customer phone number',
            example: '+1 (555) 123-4567'
          },
          favoriteBusinessIds: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Array of favorite business IDs'
          },
          isActive: {
            type: 'boolean',
            description: 'Account active status'
          },
          emailVerified: {
            type: 'boolean',
            description: 'Email verification status'
          },
          createdAt: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      BusinessUser: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Unique business user identifier'
          },
          businessName: {
            type: 'string',
            description: 'Business name',
            example: 'Elite Hair Salon'
          },
          businessId: {
            type: 'string',
            description: 'Associated business profile ID'
          },
          email: {
            type: 'string',
            format: 'email'
          },
          role: {
            type: 'string',
            enum: ['Owner', 'Manager', 'Assistant'],
            description: 'User role within the business'
          },
          staffId: {
            type: 'string',
            description: 'Staff member identifier'
          },
          isActive: {
            type: 'boolean'
          },
          emailVerified: {
            type: 'boolean'
          }
        }
      },
      Business: {
        type: 'object',
        properties: {
          id: {
            type: 'string'
          },
          name: {
            type: 'string',
            description: 'Business name',
            example: 'Downtown Beauty Lounge'
          },
          email: {
            type: 'string',
            format: 'email'
          },
          phone: {
            type: 'string'
          },
          address: {
            type: 'string',
            description: 'Full business address'
          },
          location: {
            type: 'object',
            properties: {
              latitude: {
                type: 'number',
                format: 'double'
              },
              longitude: {
                type: 'number',
                format: 'double'
              }
            }
          },
          hours: {
            type: 'object',
            description: 'Business operating hours',
            additionalProperties: {
              type: 'object',
              properties: {
                is_working: {
                  type: 'boolean'
                },
                start_time: {
                  type: 'string',
                  pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
                },
                end_time: {
                  type: 'string',
                  pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
                }
              }
            }
          },
          services: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Service'
            }
          },
          staff: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Staff'
            }
          },
          average_rating: {
            type: 'number',
            format: 'double',
            minimum: 0,
            maximum: 5
          },
          review_count: {
            type: 'integer',
            minimum: 0
          },
          price_tier: {
            type: 'string',
            enum: ['$', '$$', '$$$']
          },
          amenities: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['wifi', 'parking', 'wheelchair_accessible', 'credit_cards', 'walk_ins', 'online_booking']
            }
          },
          is_open_now: {
            type: 'boolean'
          },
          next_available: {
            type: 'string',
            format: 'date-time'
          }
        }
      },
      Service: {
        type: 'object',
        properties: {
          id: {
            type: 'string'
          },
          name: {
            type: 'string',
            example: 'Haircut & Style'
          },
          description: {
            type: 'string'
          },
          duration_minutes: {
            type: 'integer',
            minimum: 15,
            maximum: 480
          },
          price: {
            type: 'number',
            format: 'double',
            minimum: 0
          },
          currency: {
            type: 'string',
            enum: ['USD', 'EUR', 'GBP']
          },
          staffIds: {
            type: 'array',
            items: {
              type: 'string'
            }
          },
          average_rating: {
            type: 'number',
            format: 'double'
          },
          review_count: {
            type: 'integer'
          }
        }
      },
      Staff: {
        type: 'object',
        properties: {
          id: {
            type: 'string'
          },
          full_name: {
            type: 'string',
            example: 'Sarah Johnson'
          },
          email: {
            type: 'string',
            format: 'email'
          },
          phone: {
            type: 'string'
          },
          role: {
            type: 'string',
            enum: ['Owner', 'Manager', 'Assistant', 'Stylist']
          },
          skills: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Skills and specializations'
          },
          average_rating: {
            type: 'number',
            format: 'double',
            minimum: 0,
            maximum: 5
          },
          review_count: {
            type: 'integer',
            minimum: 0
          },
          schedule: {
            type: 'object',
            description: 'Weekly schedule',
            additionalProperties: {
              type: 'object',
              properties: {
                is_working: {
                  type: 'boolean'
                },
                start_time: {
                  type: 'string',
                  pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
                },
                end_time: {
                  type: 'string',
                  pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
                }
              }
            }
          }
        }
      },
      Booking: {
        type: 'object',
        properties: {
          id: {
            type: 'string'
          },
          customerId: {
            type: 'string'
          },
          businessId: {
            type: 'string'
          },
          serviceId: {
            type: 'string'
          },
          staffId: {
            type: 'string'
          },
          startTime: {
            type: 'string',
            format: 'date-time'
          },
          endTime: {
            type: 'string',
            format: 'date-time'
          },
          status: {
            type: 'string',
            enum: ['pending', 'confirmed', 'completed', 'cancelled']
          },
          pricing: {
            type: 'object',
            properties: {
              subtotal: {
                type: 'number',
                format: 'double'
              },
              tax: {
                type: 'number',
                format: 'double'
              },
              deposit: {
                type: 'number',
                format: 'double'
              },
              total: {
                type: 'number',
                format: 'double'
              }
            }
          },
          payment: {
            type: 'object',
            properties: {
              stripe_payment_intent_id: {
                type: 'string'
              },
              status: {
                type: 'string',
                enum: ['pending', 'succeeded', 'failed', 'refunded']
              }
            }
          }
        }
      },
      // Request/Response Models
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com'
          },
          password: {
            type: 'string',
            minLength: 8,
            example: 'SecurePass123!'
          }
        }
      },
      SignupRequest: {
        type: 'object',
        required: ['fullName', 'email', 'password'],
        properties: {
          fullName: {
            type: 'string',
            minLength: 2,
            maxLength: 100,
            example: 'John Doe'
          },
          email: {
            type: 'string',
            format: 'email'
          },
          password: {
            type: 'string',
            minLength: 8,
            pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]',
            description: 'Password must contain uppercase, lowercase, number, and special character'
          },
          phone: {
            type: 'string',
            pattern: '^\\+?[\\d\\s-()]+$'
          }
        }
      },
      AuthResponse: {
        type: 'object',
        properties: {
          user: {
            oneOf: [
              { $ref: '#/components/schemas/CustomerUser' },
              { $ref: '#/components/schemas/BusinessUser' }
            ]
          },
          accessToken: {
            type: 'string',
            description: 'JWT access token (15 minute expiry)'
          }
        }
      },
      SearchFilters: {
        type: 'object',
        properties: {
          minPrice: {
            type: 'number',
            format: 'double',
            minimum: 0
          },
          maxPrice: {
            type: 'number',
            format: 'double'
          },
          minRating: {
            type: 'number',
            format: 'double',
            minimum: 0,
            maximum: 5
          },
          date: {
            type: 'string',
            format: 'date'
          },
          lat: {
            type: 'number',
            format: 'double'
          },
          lon: {
            type: 'number',
            format: 'double'
          },
          maxDistance: {
            type: 'number',
            format: 'double',
            description: 'Maximum distance in kilometers'
          },
          priceTiers: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['$', '$$', '$$$']
            }
          },
          amenities: {
            type: 'array',
            items: {
              type: 'string',
              enum: ['wifi', 'parking', 'wheelchair_accessible', 'credit_cards', 'walk_ins', 'online_booking']
            }
          },
          isOpenNow: {
            type: 'boolean'
          },
          hasAvailability: {
            type: 'boolean'
          }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'Error description'
          },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: {
                  type: 'string'
                },
                message: {
                  type: 'string'
                },
                value: {
                  type: 'string'
                }
              }
            },
            description: 'Validation errors (if applicable)'
          },
          code: {
            type: 'string',
            description: 'Error code for programmatic handling'
          }
        }
      }
    },
    responses: {
      UnauthorizedError: {
        description: 'Access token is missing or invalid',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              message: 'Access denied. No token provided.',
              code: 'UNAUTHORIZED'
            }
          }
        }
      },
      ValidationError: {
        description: 'Request validation failed',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              message: 'Validation error',
              errors: [
                {
                  field: 'email',
                  message: 'Please provide a valid email',
                  value: 'invalid-email'
                }
              ]
            }
          }
        }
      },
      RateLimitError: {
        description: 'Rate limit exceeded',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ErrorResponse'
            },
            example: {
              message: 'Too many requests, please try again later',
              code: 'RATE_LIMIT_EXCEEDED'
            }
          }
        }
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ]
};

const options = {
  definition: swaggerDefinition,
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/swagger/paths/auth.yaml',
    './src/swagger/paths/businesses.yaml',
    './src/swagger/paths/bookings.yaml',
    './src/swagger/paths/customer.yaml'
  ]
};

export const swaggerSpec = swaggerJSDoc(options);

export const swaggerOptions = {
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info .title { color: #6366f1; }
    .swagger-ui .scheme-container { background: #f8fafc; border: 1px solid #e2e8f0; }
  `,
  customSiteTitle: 'Reservio API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    tryItOutEnabled: true,
    requestInterceptor: (req: any) => {
      // Add custom headers or modify requests
      req.headers['X-API-Version'] = '1.0';
      return req;
    }
  }
};