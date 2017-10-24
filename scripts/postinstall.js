#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')

const projectApiConfigLocation = path.normalize(process.cwd() + '/../../config/api.js')

const localConfigFile = path.normalize(path.join(__dirname, '/../config/sequelize.js'))
const projectConfigFile = path.normalize(process.cwd() + '/../../config/sequelize.js')

const localRcFile = path.normalize(path.join(__dirname, '/../config/.sequelizerc'))
const projectRcFile = path.normalize(process.cwd() + '/../../.sequelizerc')

try {
  fs.lstatSync(projectApiConfigLocation)
  // Only run if api config file exists (prevents install whlie in development)
  try {
    fs.lstatSync(projectConfigFile)
  } catch (ex) {
    // Only try to copy the files required for cli operations if sequelize.js is being newly created.
    console.log('copying ' + localConfigFile + ' to ' + projectConfigFile)
    fs.createReadStream(localConfigFile).pipe(fs.createWriteStream(projectConfigFile))
    try {
      fs.lstatSync(projectRcFile)
    } catch (ex) {
      console.log('copying ' + localRcFile + ' to ' + projectRcFile)
      fs.createReadStream(localRcFile).pipe(fs.createWriteStream(projectRcFile))
    }
  }

  ['models', 'test/fixtures'].forEach(function (f) {
    let t = path.normalize(process.cwd() + '/../../' + f)
    console.log('creating ' + t)
    mkdirp.sync(t)
  })
} catch (ex) {
  console.log('postinstall script skipped')
}
