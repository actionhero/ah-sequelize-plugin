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

const actionhero = new ActionHero.Process()
let api

const configChanges = {
  plugins: {'ah-sequelize-plugin': { path: PACKAGE_PATH }}
}

const CopyFile = async (src, dest) => {
  return new Promise((resolve) => {
    if (fs.existsSync(dest)) { fs.unlinkSync(dest) }
    let stream = fs.createReadStream(src).pipe(fs.createWriteStream(dest))
    stream.on('close', () => {
      console.info(`coppied ${src} to ${dest}`)
      return resolve()
    })
  })
}

describe('ah-sequelize-plugin', () => {
  before(async () => {
    // copy configuration files
    await CopyFile(path.join(PACKAGE_PATH, 'config', 'sequelize.js'), path.join(process.env.PROJECT_ROOT, 'config', 'sequelize.js'))
    await CopyFile(path.join(PACKAGE_PATH, 'config', '.sequelizerc'), path.join(process.env.PROJECT_ROOT, 'sequelizerc'))

    // copy model files
    if (!fs.existsSync(modelsPath)) { fs.mkdirSync(modelsPath) }
    await CopyFile(path.join(PACKAGE_PATH, 'test', 'models', 'user.js'), path.join(process.env.PROJECT_ROOT, 'models', 'user.js'))

    // copy migration files
    if (!fs.existsSync(migrationsPath)) { fs.mkdirSync(migrationsPath) }
    await CopyFile(path.join(PACKAGE_PATH, 'test', 'migrations', '01-createUsers.js'), path.join(process.env.PROJECT_ROOT, 'migrations', '01-createUsers.js'))
  })

  before(async () => { api = await actionhero.start({configChanges}) })
  before(async () => { await api.models.User.truncate({force: true}) })
  after(async () => { await api.models.User.truncate({force: true}) })
  after(async () => { await actionhero.stop() })

  it('should have booted an ActionHero server', () => {
    expect(api.running).to.equal(true)
  })

  it('should have loaded models', async () => {
    expect(api.models.User).to.exist()
    let count = await api.models.User.count()
    expect(count).to.equal(0)
  })

  it('can create a model instance (indicating the databse was migrated)', async () => {
    const person = new api.models.User()
    person.email = 'hello@example.com'
    person.name = 'test person'
    await person.save()
  })

  it('can count newly saved models', async () => {
    let count = await api.models.User.count()
    expect(count).to.equal(1)
  })

  it('can read saved models', async () => {
    const person = await api.models.User.find({where: {email: 'hello@example.com'}})
    expect(person.name).to.equal('test person')
  })

  it('can update saved models', async () => {
    const person = await api.models.User.find({where: {email: 'hello@example.com'}})
    person.name = 'a new name'
    await person.save()
    await person.reload()
    expect(person.name).to.equal('a new name')
  })

  it('auto-adds timestamp columns to models', async () => {
    const person = await api.models.User.find({where: {email: 'hello@example.com'}})
    expect(person.createdAt).to.be.below(new Date())
    expect(person.updatedAt).to.be.below(new Date())
    expect(person.deletedAt).to.not.exist()
  })

  it('can use instance methods on models', async () => {
    const person = await api.models.User.find({where: {email: 'hello@example.com'}})
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
    const person = await api.models.User.find({where: {email: 'hello@example.com'}})
    await person.destroy()
    let count = await api.models.User.count()
    expect(count).to.equal(0)
  })

  it('can *really* delete a model', async () => {
    const person = await api.models.User.find({paranoid: false, where: {email: 'hello@example.com'}})
    await person.destroy({force: true})
    let count = await api.models.User.count()
    expect(count).to.equal(0)
  })
})
