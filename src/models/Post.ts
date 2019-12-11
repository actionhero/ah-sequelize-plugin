import {
  Model,
  Table,
  Column,
  ForeignKey,
  AllowNull,
  BeforeCreate,
  BelongsTo
} from "sequelize-typescript";
import * as uuid from "uuid/v4";
import { User } from "./User";

@Table({ tableName: "posts", paranoid: true })
export class Post extends Model<Post> {
  @Column({ primaryKey: true })
  guid: string;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column
  authorGuid: string;

  @AllowNull(false)
  @Column
  title: string;

  @AllowNull(false)
  @Column
  body: string;

  @BelongsTo(() => User)
  user: User;

  @BeforeCreate
  static generateGuid(instance) {
    if (!instance.guid) {
      instance.guid = uuid();
    }
  }
}
