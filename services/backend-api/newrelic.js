'use strict'

/**
 * New Relic agent configuration.
 *
 * See lib/config/default.js in the agent distribution for a more complete
 * description of configuration variables and their potential values.
 */
exports.config = {
  /**
   * Array of application names.
   */
  app_name: ['Reservio Backend API'],
  
  /**
   * Your New Relic license key.
   */
  license_key: process.env.NEW_RELIC_LICENSE_KEY || 'your-license-key-here',
  
  /**
   * Logging configuration
   */
  logging: {
    /**
     * Level at which to log. 'trace' is most useful to New Relic when
     * diagnosing issues with the agent, 'info' and higher will impose the
     * least overhead on production applications.
     */
    level: process.env.NODE_ENV === 'production' ? 'info' : 'trace',
    
    /**
     * Whether to write to a log file. When false, logs to stdout.
     */
    filepath: process.env.NEW_RELIC_LOG_FILE || 'newrelic_agent.log'
  },
  
  /**
   * When true, all request headers except for those listed in attributes.exclude
   * will be captured for all traces, unless otherwise specified in a destination's
   * attributes include/exclude lists.
   */
  allow_all_headers: true,
  
  /**
   * Attribute configuration
   */
  attributes: {
    /**
     * Prefix of attributes to exclude from all destinations. Allows * as wildcard
     * at end of string.
     */
    exclude: [
      'request.headers.cookie',
      'request.headers.authorization',
      'request.headers.proxyAuthorization',
      'request.headers.setCookie*',
      'request.headers.x*',
      'response.headers.cookie',
      'response.headers.authorization',
      'response.headers.proxyAuthorization',
      'response.headers.setCookie*',
      'response.headers.x*'
    ]
  },
  
  /**
   * Error collector configuration
   */
  error_collector: {
    /**
     * Disabling the error collector removes this handler from the stack.
     */
    enabled: true,
    
    /**
     * List of HTTP error status codes the error collector should ignore.
     */
    ignore_status_codes: [404, 401, 403]
  },
  
  /**
   * Transaction tracer configuration
   */
  transaction_tracer: {
    /**
     * Enable transaction tracing.
     */
    enabled: true,
    
    /**
     * Threshold in milliseconds for when to collect a trace for a slow transaction.
     */
    transaction_threshold: process.env.NODE_ENV === 'production' ? 'apdex_f' : 500,
    
    /**
     * Generate stack traces for transactions slower than this threshold.
     */
    stack_trace_threshold: 500,
    
    /**
     * Capture SQL queries.
     */
    record_sql: process.env.NODE_ENV === 'production' ? 'obfuscated' : 'raw',
    
    /**
     * Threshold for explaining SQL queries in milliseconds.
     */
    explain_threshold: 500
  },
  
  /**
   * Rules for naming or ignoring transactions.
   */
  rules: {
    name: [
      { pattern: /^\/api\/health/, name: '/api/health' },
      { pattern: /^\/api\/docs/, name: '/api/docs' },
      { pattern: /^\/api\/auth\/.*/, name: '/api/auth/*' },
      { pattern: /^\/api\/businesses\/search/, name: '/api/businesses/search' },
      { pattern: /^\/api\/bookings/, name: '/api/bookings' }
    ],
    ignore: [
      /^\/favicon\.ico$/,
      /^\/robots\.txt$/,
      /^\/health$/,
      /^\/ping$/
    ]
  },
  
  /**
   * Browser monitoring (Real User Monitoring)
   */
  browser_monitoring: {
    enable: false // API only, no browser monitoring needed
  },
  
  /**
   * Distributed tracing
   */
  distributed_tracing: {
    enabled: true
  },
  
  /**
   * High security mode
   */
  high_security: process.env.NODE_ENV === 'production',
  
  /**
   * Custom insights events
   */
  custom_insights_events: {
    enabled: true
  },
  
  /**
   * Application performance index (Apdex) configuration
   */
  apdex_t: 0.5 // 500ms for satisfying response time
}