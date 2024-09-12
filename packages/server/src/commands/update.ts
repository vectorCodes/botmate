import { Application } from '../application';

export default function update(app: Application) {
  const update = app.cli.command('update');

  update.description('update botmate to the latest version');

  update.action(() => {});
}
