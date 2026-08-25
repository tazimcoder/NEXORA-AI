import { logger } from '../../utils/logger.js';
import { ManualTriggerHandler } from './handlers/manual.trigger.js';
import { WebhookTriggerHandler } from './handlers/webhook.trigger.js';
import { ScheduleTriggerHandler } from './handlers/schedule.trigger.js';
import { ConditionEvaluatorHandler } from './handlers/condition.evaluator.js';
import { HttpRequestActionHandler } from './handlers/http_request.action.js';
import { CreateNotificationActionHandler } from './handlers/create_notification.action.js';
import { DelayActionHandler } from './handlers/delay.action.js';
import { InternalSystemActionHandler } from './handlers/internal_system.action.js';
import { EmailActionHandler } from './handlers/email.action.js';
import { TelegramActionHandler } from './handlers/telegram.action.js';
import { SlackActionHandler } from './handlers/slack.action.js';
import { GoogleActionHandler } from './handlers/google.action.js';
import { CustomApiActionHandler } from './handlers/custom_api.action.js';

class NodeHandlerRegistry {
  constructor() {
    this.handlers = new Map();
    this.registerBuiltInHandlers();
  }

  register(handler) {
    if (!handler || !handler.type || !handler.subtype) {
      throw new Error('Invalid node handler instance');
    }
    const key = `${handler.type}:${handler.subtype}`;
    this.handlers.set(key, handler);
    logger.info(`Registered Node Handler plugin: [${key}] (${handler.displayName})`);
  }

  registerBuiltInHandlers() {
    this.register(new ManualTriggerHandler());
    this.register(new WebhookTriggerHandler());
    this.register(new ScheduleTriggerHandler());
    this.register(new ConditionEvaluatorHandler());
    this.register(new HttpRequestActionHandler());
    this.register(new CreateNotificationActionHandler());
    this.register(new DelayActionHandler());
    this.register(new InternalSystemActionHandler());
    this.register(new EmailActionHandler());
    this.register(new TelegramActionHandler());
    this.register(new SlackActionHandler());
    this.register(new GoogleActionHandler());
    this.register(new CustomApiActionHandler());
  }

  getHandler(type, subtype) {
    const key = `${type}:${subtype}`;
    const handler = this.handlers.get(key);
    if (!handler) {
      // Fallback matching by type if subtype is default
      for (const [hKey, h] of this.handlers.entries()) {
        if (hKey.startsWith(`${type}:`)) return h;
      }
      throw new Error(`No registered node handler found for type '${type}' and subtype '${subtype}'`);
    }
    return handler;
  }

  listHandlers() {
    const list = [];
    for (const [key, handler] of this.handlers.entries()) {
      list.push({
        key,
        name: handler.name,
        type: handler.type,
        subtype: handler.subtype,
        displayName: handler.displayName,
      });
    }
    return list;
  }
}

export const nodeHandlerRegistry = new NodeHandlerRegistry();
