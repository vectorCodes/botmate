import { createLogger, winston } from '@botmate/logger';
import { Platform, PlatformType } from '@botmate/platform';
import { existsSync } from 'fs';
import { join } from 'path';

import { IBot } from '../models/bot';
import { Plugin } from '../plugin';

export enum BotStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
}

const pkgMap: Record<PlatformType, string> = {
  telegram: '@botmate/platform-telegram',
  discord: '@botmate/bot-discord',
};

export class Bot {
  status = BotStatus.INACTIVE;
  logger: winston.Logger = createLogger({ name: Bot.name });
  plugins = new Map<string, Plugin>();

  private _bot?: Platform;

  constructor(
    private type: PlatformType,
    private credentials: Record<string, string>,
    private _data: IBot,
  ) {}

  instance<T>() {
    return this._bot?.instance as T;
  }

  async init() {
    const platform = await this.importPlatform();
    const bot = new platform(this.credentials) as Platform;
    this._bot = bot;
  }

  get data() {
    return this._data;
  }

  async importPlatform() {
    const platformsDir = join(process.cwd(), 'platforms');
    if (existsSync(platformsDir)) {
      const platform = await import(
        join(platformsDir, `${this.type}/src/index.ts`)
      );
      return platform.default?.default || platform.default;
    } else {
      const _export = await import(pkgMap[this.type]);
      const [first] = Object.values(_export);
      return first;
    }
  }

  async getBotInfo() {
    try {
      const platform = await this.importPlatform();
      const bot = new platform(this.credentials) as Platform;
      const info = await bot.getBotInfo();
      return info;
    } catch (e) {
      this.logger.error(`Failed to get bot info`);
      throw e;
    }
  }

  async start() {
    try {
      if (this._bot) {
        await this._bot.start();
        this.status = BotStatus.ACTIVE;
      }
    } catch (error) {
      console.error(error);
      this.logger.error(`Error stopping bot: ${this.data.id}`);
    }
  }

  async stop() {
    try {
      if (this._bot) {
        await this._bot.stop();
        this.status = BotStatus.INACTIVE;
      }
    } catch (error) {
      console.error(error);
      this.logger.error(`Error stopping bot: ${this.data.id}`);
    }
  }

  async restart() {
    try {
      if (this._bot) {
        await this._bot.stop();
        this.status = BotStatus.INACTIVE;

        await this._bot.start();
        this.status = BotStatus.ACTIVE;
      }
    } catch (error) {
      console.error(error);
      this.logger.error(`Error restarting bot: ${this.data.id}`);
    }
  }
}
