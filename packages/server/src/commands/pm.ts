import colors from 'colors';
import { Table } from 'console-table-printer';
import ejs from 'ejs';
import fg from 'fast-glob';
import { existsSync } from 'fs';
import { mkdir } from 'fs/promises';
import { writeFile } from 'fs/promises';
import inquirer from 'inquirer';
import { dirname, join } from 'path';

import { Application } from '../application';

function toKebabCase(str: string) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

export default function pm(app: Application) {
  const pm = app.cli.command('pm');

  pm.command('list').action(async () => {
    const p = new Table({
      rowSeparator: true,
      columns: [
        {
          name: 'count',
          alignment: 'left',
          color: 'blue',
        },
        {
          name: 'name',
          alignment: 'left',
          color: 'green',
        },
        {
          name: 'description',
          alignment: 'left',
          color: 'yellow',
        },
        {
          name: 'version',
          alignment: 'left',
          color: 'cyan',
        },
      ],
    });
    const plugins = await app.pluginManager.getLocalPlugins();

    let count = 1;
    for (const plugin of plugins) {
      p.addRow({
        count: count++,
        name: plugin.displayName,
        description: plugin.description,
        version: plugin.version,
      });
    }

    p.printTable();

    console.log(colors.green(`Total plugins: ${plugins.length}`));
  });

  pm.command('create').action(async () => {
    const { pkg, name, description } = await inquirer.prompt([
      {
        type: 'input',
        name: 'pkg',
        message: 'Plugin package name',
        validate: (value) => {
          if (value.length === 0) {
            return 'Plugin package name is required';
          }

          return true;
        },
      },
      {
        type: 'input',
        name: 'name',
        message: 'Plugin name',
        default: (answers: any) => answers.pkg,
        validate: (value) => {
          if (value.length === 0) {
            return 'Plugin name is required';
          }
          return true;
        },
      },
      {
        type: 'input',
        name: 'description',
        message: 'Plugin description',
        default: 'A plugin generated by using the CLI',
        validate: (value) => {
          if (value.length === 0) {
            return 'Plugin description is required';
          }
          return true;
        },
      },
    ]);

    let pluginFolder = join(process.cwd(), 'plugins');
    if (existsSync('plugins')) {
      pluginFolder = join(process.cwd(), 'plugins');
    }

    if (existsSync(`${pluginFolder}/${name}`)) {
      console.error(`Plugin ${name} already exists`);
      return;
    }

    const templatesFolder = join(__dirname, '../templates/plugin');
    const files = await fg(`${templatesFolder}/**/*`, { dot: true });

    const content = await Promise.all(
      files.map(async (file) => {
        const template = await ejs.renderFile(file, {
          pkg: toKebabCase(pkg),
          name,
          description,
        });
        return {
          file: file.replace('.ejs', '').replace(`${templatesFolder}/`, ''),
          content: template,
        };
      }),
    );

    for (const file of content) {
      console.log(colors.green(`CREATE:`), file.file);

      const path = join(pluginFolder, toKebabCase(name), file.file);
      const folder = dirname(path);
      await mkdir(folder, { recursive: true });
      await writeFile(path, file.content);
    }
  });
}
