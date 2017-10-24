#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')

const localConfigFile = path.normalize(path.join(__dirname, '/../config/sequelize.js'))
const projectConfigFile = path.normalize(process.cwd() + '/../../config/sequelize.js')

const localRcFile = path.normalize(path.join(__dirname, '/../config/.sequelizerc'))
const projectRcFile = path.normalize(process.cwd() + '/../../.sequelizerc')

try {
  fs.lstatSync(projectConfigFile)
} catch (ex) {
  console.log('copying ' + localConfigFile + ' to ' + projectConfigFile)
  fs.createReadStream(localConfigFile).pipe(fs.createWriteStream(projectConfigFile))
  // Only try to copy the files required for cli operations if sequelize.js is being newly created.
  try {
    fs.lstatSync(projectRcFile)
  } catch (ex) {
    console.log('copying ' + localRcFile + ' to ' + projectRcFile)
    fs.createReadStream(localRcFile).pipe(fs.createWriteStream(projectRcFile))
  }
}

['models', 'test/fixtures'].forEach(function (f) {
  mkdirp.sync(path.normalize(process.cwd() + '/../../' + f))
})

// console.warn('Notice:')
// console.warn('npm run actionhero link -- --name ah-sequelize-plugin')
// console.warn('To read more about this, https://docs.actionherojs.com/tutorial-plugins.html')
