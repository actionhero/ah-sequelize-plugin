import { Process, env, api } from "actionhero";
import { User } from "../src/models/User";
import { Post } from "../src/models/Post";
import { truncate } from "./utils/truncate";

describe("ah-sequelize-plugin", function () {
  const actionhero = new Process();

  beforeAll(async () => {
    await actionhero.start();
    await truncate([User, Post]);
  });

  afterAll(async () => await actionhero.stop());

  it("should have booted an ActionHero server", () => {
    expect(env).toBe("test");
  });

  it("should have mounted models to the api object", () => {
    expect(Object.keys(api.sequelize.models).sort()).toEqual(
      ["SequelizeMeta", "User", "Post"].sort()
    );
  });

  it("should have loaded models", async () => {
    expect(User).toBeTruthy();
    let count = await User.count();
    expect(count).toBe(0);

    expect(Post).toBeTruthy();
    count = await Post.count();
    expect(count).toBe(0);
  });

  it("can create a model instance (indicating the database was migrated)", async () => {
    const person = new User();
    person.email = "hello@example.com";
    person.firstName = "test";
    person.lastName = "person";
    await person.save();

    expect(person.guid.length).toBe(36); // a UUID
  });

  it("can count newly saved models", async () => {
    const count = await User.count();
    expect(count).toBe(1);
  });

  it("can read saved models", async () => {
    const person = await User.findOne({
      where: { email: "hello@example.com" },
    });

    expect(person.firstName).toBe("test");
  });

  it("can update saved models", async () => {
    const person = await User.findOne({
      where: { email: "hello@example.com" },
    });

    person.firstName = "a new first";
    await person.save();
    await person.reload();
    expect(person.firstName).toBe("a new first");
  });

  it("auto-adds timestamp columns to models", async () => {
    const person = await User.findOne({
      where: { email: "hello@example.com" },
    });

    const now = new Date().getTime();
    expect(person.createdAt.getTime()).toBeLessThan(now);
    expect(person.updatedAt.getTime()).toBeLessThan(now);
    expect(person.deletedAt).toBeNull();
  });

  it("can use instance methods on models", async () => {
    const person = await User.findOne({
      where: { email: "hello@example.com" },
    });

    await person.updatePassword("passw0rd");

    let check = await person.checkPassword("passw0rd");
    expect(check).toBe(true);

    check = await person.checkPassword("nope");
    expect(check).toBe(false);
  });

  it("created indexes in migrations", async () => {
    const otherPerson = new User();
    otherPerson.email = "hello@example.com";
    otherPerson.firstName = "test";
    otherPerson.lastName = "person";
    try {
      await otherPerson.save();
      throw new Error("should not succeed");
    } catch (error) {
      expect(error.toString()).toMatch(/SequelizeUniqueConstraintError/);
    }
  });

  it("created associations", async () => {
    const person = await User.findOne();
    const post = new Post({
      authorGuid: person.guid,
      title: "my first post",
      body: "hello world",
    });
    await post.save();

    const count = await person.$count("posts");
    expect(count).toBe(1);
  });

  it("can delete a model", async () => {
    const person = await User.findOne({
      where: { email: "hello@example.com" },
    });

    await person.destroy();
    const count = await User.count();
    expect(count).toBe(0);
  });

  it("can *really* delete a model", async () => {
    const person = await User.findOne({
      paranoid: false,
      where: { email: "hello@example.com" },
    });

    await person.destroy({ force: true });
    const count = await User.count();
    expect(count).toBe(0);
  });
});
