import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  ModelStatic,
  Sequelize,
} from '@botmate/database';

export class PluginModel extends Model<
  InferAttributes<PluginModel>,
  InferCreationAttributes<PluginModel>
> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare displayName: string;
  declare version: string;
  declare description: string | null;
  declare dependencies: Record<string, string> | null;
  declare botId: string;
  declare config: Record<string, unknown> | null;
  declare enabled: boolean;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export function initPluginModel(db: Sequelize): ModelStatic<PluginModel> {
  return db.define<PluginModel>(
    'plugins',
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      displayName: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      version: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      dependencies: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      botId: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      config: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      enabled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      timestamps: true,
    },
  );
}

export type IPlugin = InferAttributes<PluginModel>;
