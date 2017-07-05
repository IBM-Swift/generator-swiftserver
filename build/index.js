/*
 * Copyright IBM Corporation 2016-2017
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict'
var generators = require('yeoman-generator')
var chalk = require('chalk')
var actions = require('../lib/actions')
var os = require('os')
var debug = require('debug')('generator-swiftserver:app')

module.exports = generators.Base.extend({
  initializing: {
    config: function () {
      if (!this.options.singleShot) {
        actions.ensureInProject.call(this)
      }
    }
  },

  install: {
    ensureRequiredSwiftInstalled: actions.ensureRequiredSwiftInstalled,
    buildSwift: function () {
      return new Promise((resolve, reject) => {
        var opts = []
        if (os.platform() === 'darwin') {
          opts = ['-Xlinker', '-lc++']
        }
        var buildProcess = this.spawnCommand('swift', ['build'].concat(opts))
        buildProcess.on('error', (err) => {
          debug(`error spawning command "swift build": ${err}`)
          this.env.error(chalk.red('Failed to launch build'))
        })
        buildProcess.on('close', (code, signal) => {
          if (code) {
            this.env.error(chalk.red('swift build command completed with errors'))
          }

          this.log(chalk.green('swift build command completed'))
          resolve()
        })
      })
    },

    generateXCodeprojFile: function () {
      return new Promise((resolve, reject) => {
        var buildProcess = this.spawnCommand('swift', ['package', 'generate-xcodeproj'])
        buildProcess.on('error', (err) => {
          debug(`error spawning command "swift package generate-xcodeproj": ${err}`)
          this.env.error(chalk.red('Failed to generate <application>.xcodeproj file'))
        })
        buildProcess.on('close', (code, signal) => {
          if (code) {
            this.env.error(chalk.red('swift package generate-xcodeproj command completed with errors'))
          }

          this.log(chalk.green('generate .xcodeproj command completed'))
          resolve()
        })
      })
    }
  }
})
