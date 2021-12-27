import * as bcrypt from "bcrypt";
import {
  Model,
  Table,
  Column,
  AllowNull,
  IsEmail,
  BeforeCreate,
  HasMany,
} from "sequelize-typescript";
import * as uuid from "uuid";
import { Post } from "./Post";

@Table({ tableName: "users", paranoid: true })
export class User extends Model {
  saltRounds = 10;

  @Column({ primaryKey: true })
  guid: string;

  @AllowNull(false)
  @Column
  firstName: string;

  @AllowNull(false)
  @Column
  lastName: string;

  @AllowNull(false)
  @IsEmail
  @Column
  email: string;

  @Column
  passwordHash: string;

  @HasMany(() => Post)
  posts: Post[];

  @BeforeCreate
  static generateGuid(instance: User) {
    if (!instance.guid) {
      instance.guid = uuid.v4();
    }
  }

  async updatePassword(password: string) {
    this.passwordHash = await bcrypt.hash(password, this.saltRounds);
    await this.save();
  }

  async checkPassword(password: string) {
    if (!this.passwordHash) {
      throw new Error("password not set for this team member");
    }

    const match = await bcrypt.compare(password, this.passwordHash);
    return match;
  }
}
