import { Application } from '../application';

export default function pm(app: Application) {
  const pm = app.cli.command('pm');

  pm.description('manage plugins');

  pm.command('list')
    .description('list all plugins')
    .action(() => {
      const plugins = app.pluginManager.getPlugins();
      // console.log('plugins', plugins);
    });
}
