import { Application } from '../application';

export default function start(app: Application) {
  const start = app.cli.command('start');

  start.option('-p, --port <port>', 'port to start the server on', '8233');
  start.description('start the server in production mode');

  start.action(() => {
    console.log('start');
  });
}
