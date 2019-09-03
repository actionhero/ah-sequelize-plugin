const fs = require('fs')
const path = require('path')
const chai = require('chai')
const dirtyChai = require('dirty-chai')
const ActionHero = require('actionhero')
const expect = chai.expect
chai.use(dirtyChai)

process.env.PROJECT_ROOT = path.join(__dirname, '..', 'node_modules', 'actionhero')
const PACKAGE_PATH = path.join(__dirname, '..')
const modelsPath = path.join(process.env.PROJECT_ROOT, 'models')
const migrationsPath = path.join(process.env.PROJECT_ROOT, 'migrations')
const pluginsPath = path.join(process.env.PROJECT_ROOT, 'plugins')
const testPluginPath = path.join(pluginsPath, 'test-plugin')

const actionhero = new ActionHero.Process()
let api

const configChanges = {
  plugins: { 'ah-sequelize-plugin': { path: PACKAGE_PATH } }
}

const CopyFile = async (src, dest) => {
  return new Promise((resolve) => {
    if (fs.existsSync(dest)) { fs.unlinkSync(dest) }
    const stream = fs.createReadStream(src).pipe(fs.createWriteStream(dest))
    stream.on('close', () => {
      console.debug(`coppied ${src} to ${dest}`)
      return resolve()
    })
  })
}

describe('ah-sequelize-plugin', function () {
  this.timeout(100000)

  before(async () => {
    // copy configuration files
    await CopyFile(path.join(PACKAGE_PATH, 'test', 'config', 'sequelize.js'), path.join(process.env.PROJECT_ROOT, 'config', 'sequelize.js'))
    await CopyFile(path.join(PACKAGE_PATH, 'config', '.sequelizerc'), path.join(process.env.PROJECT_ROOT, 'sequelizerc'))

    // copy model files
    if (!fs.existsSync(modelsPath)) { fs.mkdirSync(modelsPath) }
    await CopyFile(path.join(PACKAGE_PATH, 'test', 'models', 'user.js'), path.join(process.env.PROJECT_ROOT, 'models', 'user.js'))

    // copy migration files
    if (!fs.existsSync(migrationsPath)) { fs.mkdirSync(migrationsPath) }
    await CopyFile(path.join(PACKAGE_PATH, 'test', 'migrations', '01-createUsers.js'), path.join(process.env.PROJECT_ROOT, 'migrations', '01-createUsers.js'))

    // copy plugin model files
    if (!fs.existsSync(pluginsPath)) { fs.mkdirSync(pluginsPath) }
    if (!fs.existsSync(testPluginPath)) { fs.mkdirSync(testPluginPath) }
    if (!fs.existsSync(path.join(testPluginPath, 'models'))) { fs.mkdirSync(path.join(testPluginPath, 'models')) }
    await CopyFile(path.join(PACKAGE_PATH, 'test', 'plugins', 'test-plugin', 'models', 'post.js'), path.join(process.env.PROJECT_ROOT, 'plugins', 'test-plugin', 'models', 'post.js'))

    // copy plugin migration files
    if (!fs.existsSync(path.join(testPluginPath, 'migrations'))) { fs.mkdirSync(path.join(testPluginPath, 'migrations')) }
    await CopyFile(path.join(PACKAGE_PATH, 'test', 'plugins', 'test-plugin', 'migrations', '02-createPosts.js'), path.join(process.env.PROJECT_ROOT, 'plugins', 'test-plugin', 'migrations', '02-createPosts.js'))
  })

  before(async () => { api = await actionhero.start({ configChanges }) })
  before(async () => { await api.models.User.truncate({ force: true }) })
  after(async () => { await api.models.User.truncate({ force: true }) })
  after(async () => { await actionhero.stop() })

  it('should have booted an ActionHero server', () => {
    expect(api.running).to.equal(true)
  })

  it('should have loaded models', async () => {
    expect(api.models.User).to.exist()
    const count = await api.models.User.count()
    expect(count).to.equal(0)
  })

  it('can create a model instance (indicating the databse was migrated)', async () => {
    const person = new api.models.User()
    person.email = 'hello@example.com'
    person.name = 'test person'
    const { error } = await person.save()
    expect(error).to.not.exist()
  })

  it('can count newly saved models', async () => {
    const count = await api.models.User.count()
    expect(count).to.equal(1)
  })

  it('can read saved models', async () => {
    const person = await api.models.User.findOne({ where: { email: 'hello@example.com' } })
    expect(person.name).to.equal('test person')
  })

  it('can update saved models', async () => {
    const person = await api.models.User.findOne({ where: { email: 'hello@example.com' } })
    person.name = 'a new name'
    await person.save()
    await person.reload()
    expect(person.name).to.equal('a new name')
  })

  it('auto-adds timestamp columns to models', async () => {
    const person = await api.models.User.findOne({ where: { email: 'hello@example.com' } })
    expect(person.createdAt).to.be.below(new Date())
    expect(person.updatedAt).to.be.below(new Date())
    expect(person.deletedAt).to.not.exist()
  })

  it('can use instance methods on models', async () => {
    const person = await api.models.User.findOne({ where: { email: 'hello@example.com' } })
    const apiData = person.apiData()
    expect(apiData.email).not.to.exist()
    expect(apiData.name).to.equal('a new name')
  })

  it('can use class methods on models', async () => {
    let evansCount = await api.models.User.countEvans()
    expect(evansCount).to.equal(0)

    const evan = new api.models.User()
    evan.email = 'evan@example.com'
    evan.name = 'evan'
    await evan.save()

    evansCount = await api.models.User.countEvans()
    expect(evansCount).to.equal(1)
    await evan.destroy()
  })

  it('created indexes in migrations', async () => {
    const otherPerson = new api.models.User()
    otherPerson.email = 'hello@example.com'
    otherPerson.name = 'test person'

    try {
      await otherPerson.save()
      throw new Error('should not succeed')
    } catch (error) {
      expect(error.toString()).to.match(/SequelizeUniqueConstraintError/)
    }
  })

  it('can delete a model', async () => {
    const person = await api.models.User.findOne({ where: { email: 'hello@example.com' } })
    await person.destroy()
    const count = await api.models.User.count()
    expect(count).to.equal(0)
  })

  it('can *really* delete a model', async () => {
    const person = await api.models.User.findOne({ paranoid: false, where: { email: 'hello@example.com' } })
    await person.destroy({ force: true })
    const count = await api.models.User.count()
    expect(count).to.equal(0)
  })

  it('should have loaded plugin models', async () => {
    expect(api.models.Post).to.exist()
    const count = await api.models.Post.count()
    expect(count).to.equal(0)
  })

  it('can create a plugin model instance (indicating the databse was migrated for plugin as well)', async () => {
    const post = new api.models.Post()
    post.title = 'You\'ll never guess what happened next!'
    const { error } = await post.save()
    expect(error).to.not.exist()
  })

  it('can count newly saved plugin models', async () => {
    const count = await api.models.Post.count()
    expect(count).to.equal(1)
  })

  it('can delete a plugin model', async () => {
    const post = await api.models.Post.findOne({ where: { title: 'You\'ll never guess what happened next!' } })
    const { error } = await post.destroy()
    expect(error).to.not.exist()
    const count = await api.models.Post.count()
    expect(count).to.equal(0)
  })
})
