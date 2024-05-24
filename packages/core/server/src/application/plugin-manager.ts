import { ModelStatic } from '@botmate/database';
import { Logger, createLogger } from '@botmate/utils';
import colors from 'colors';
import { existsSync } from 'fs';
import { lstat, readFile, readdir } from 'fs/promises';
import { join } from 'path';

import { Plugin } from '../plugin';
import { Application } from './application';
import { PluginModel, initModel } from './plugin-model';

type PluginMeta = {
  name: string;
  displayName: string;
  description: string;
  version: string;
  dependencies: Record<string, string>;
  localPath: string;
};

export class PluginManager {
  protected plugins: PluginMeta[] = [];
  protected instanes: Map<string, Plugin> = new Map();
  protected model: ModelStatic<PluginModel>;

  logger: Logger;

  constructor(private app: Application) {
    this.logger = createLogger('plugin-manager');
    this.model = initModel(this.app.db);
  }

  async initialize() {
    this.logger.debug('Initializing...');
    await this.model.sync();
    await this.prepare();
    await this.sync();
  }

  async getPlugins() {
    return this.plugins;
  }

  async resolvePlugin(name: string) {
    try {
      const m = await import(name);
      console.log('m', m);
    } catch (e) {
      this.logger.error(e);
    }
  }

  async buildPlugins() {
    this.logger.info('Building plugins...');

    const plugins = await this.getPlugins();
    console.log('plugins', plugins);
    // for (const plugin of plugins) {
    //   this.logger.info(`Building ${colors.bold(plugin.name)}`);
    //   const pluginPath = await readdir(plugin.path);
    //   console.log('pluginPath', pluginPath);
    // }
  }

  async sync() {
    for (const plugin of this.plugins) {
      const exist = await this.model.findOne({
        where: { name: plugin.name },
      });
      if (!exist) {
        // await this.model.create({
        //   name: plugin.name,
        //   packageName: plugin.packageName,
        //   builtin: plugin.localPath.includes('packages/plugins/@botmate'),
        //   version: plugin.version,
        //   description: plugin.description,
        //   options: {},
        //   enabled: true,
        //   installed: true,
        //   dependencies: plugin.dependencies,
        // });
      }
    }
  }

  async getInstalledPlugins() {
    const pkgJsonPath = join(process.cwd(), 'package.json');

    if (!existsSync(pkgJsonPath)) {
      this.logger.debug('No package.json found');
      return [];
    }

    this.logger.debug('Reading plugins from package.json');
    const pkgJson = await readFile('package.json', 'utf-8').then((data) =>
      JSON.parse(data),
    );

    const dependencies = Object.keys(pkgJson.dependencies || {});

    if (!dependencies.length) {
      this.logger.debug('No dependencies found in package.json');
      return [];
    }

    const plugins: PluginMeta[] = [];

    for (const dep of dependencies) {
      if (dep.startsWith('@botmate/plugin-')) {
        const pluginPath = join(process.cwd(), 'node_modules', dep);
        const pkgJSON = join(pluginPath, 'package.json');
        const pkg = await readFile(pkgJSON, 'utf-8').then((data) =>
          JSON.parse(data),
        );

        plugins.push({
          name: pkg.name,
          displayName: pkg.displayName || pkg.name,
          description: pkg.description,
          version: pkg.version,
          dependencies: pkg.botmate?.dependencies || {},
          localPath: pluginPath,
        });
      }
    }

    if (plugins.length > 0) {
      this.logger.info(
        `Found ${plugins.map((p) => colors.bold(p.displayName)).join(', ')}`,
      );
    }

    return plugins;
  }

  /**
   * Fetch all plugins from the given folder and prepare them.
   */
  async prepare() {
    const storagePlugins = await this.getLocalPlugins('storage/plugins');
    const corePlugins = await this.getLocalPlugins('packages/plugins/@botmate');
    const installedPlugins = await this.getInstalledPlugins();

    this.plugins = [...corePlugins, ...storagePlugins, ...installedPlugins];

    for (const plugin of this.plugins) {
      this.logger.debug(`Processing ${colors.bold(plugin.displayName)}`);

      const serverEntry = join(
        plugin.localPath,
        this.app.isDev ? 'src/server/server.ts' : 'server.js',
      );

      try {
        const module = await import(serverEntry);
        const exportKey = Object.keys(module)[0];
        if (!exportKey) {
          this.logger.error(
            `Failed to prepare plugin ${colors.bold(
              plugin.name,
            )}: No export found`,
          );
          continue;
        }

        const PluginClass = module[exportKey];
        const pluginLogger = createLogger(plugin.name);
        const instance = new PluginClass(this.app, pluginLogger);
        await instance.beforeLoad();
        this.instanes.set(plugin.displayName, instance);
      } catch (e) {
        this.logger.error(
          `Failed to prepare plugin ${colors.bold(plugin.name)}`,
        );
        this.logger.error(e);
      }
    }

    this.logger.debug('Plugins are initialized');
  }

  /**
   * Get all plugins from the given folder.
   */
  async getLocalPlugins(pluginFolder: string) {
    this.logger.debug(`Reading plugins from "${colors.bold(pluginFolder)}"`);

    if (!existsSync(pluginFolder)) {
      this.logger.warn(`No plugins found in "${colors.bold(pluginFolder)}"`);
      return [];
    }

    const path = join(process.cwd(), pluginFolder);

    const list = await readdir(path);

    const plugins: PluginMeta[] = [];

    for (const item of list) {
      const pluginPath = join(path, item);
      const stat = await lstat(pluginPath);

      if (stat.isDirectory()) {
        const pkgJSON = join(pluginPath, 'package.json');
        const pkg = await readFile(pkgJSON, 'utf-8').then((data) =>
          JSON.parse(data),
        );

        plugins.push({
          name: pkg.name,
          displayName: pkg.displayName || pkg.name,
          description: pkg.description,
          version: pkg.version,
          dependencies: pkg.botmate?.dependencies || {},
          localPath: pluginPath,
        });
      }
    }

    this.logger.info(
      `Found ${plugins.map((p) => colors.bold(p.displayName)).join(', ')}`,
    );

    return plugins;
  }

  /**
   * Load all plugins.
   */
  async loadAll() {
    for (const plugin of this.instanes.values()) {
      await plugin.load();
    }
  }
}
