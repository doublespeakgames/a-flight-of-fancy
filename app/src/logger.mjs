// @flow
/**
 * Logger
 * @author mtownsend
 * @since Feb 2019
 * 
 * Handles logging configuration
 */
import Winston from 'winston';

const { createLogger, format, transports } = Winston;

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'voice-adventure' },
  transports: [
    // Log to the Console, because we're in a container
    new transports.Console({
      format: format.combine(format.colorize(), format.simple())
    })
  ]
});

export default logger;