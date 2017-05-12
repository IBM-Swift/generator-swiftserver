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

'use strict';
var generators = require('yeoman-generator');
var chalk = require('chalk');
var actions = require('../lib/actions');
var os = require('os');

module.exports = generators.Base.extend({
  initializing: {
    config: function() {
      if(!this.options.singleShot) {
        actions.ensureInProject.call(this);
      }
    }
  },

  install: {
    ensureRequiredSwiftInstalled: actions.ensureRequiredSwiftInstalled,
    buildSwift: function() {
      // Build swift code
      var done = this.async();
      var opts = [];
      if (os.platform() === 'darwin') {
        opts = ['-Xlinker', '-lc++'];
      }
      var buildProcess = this.spawnCommand('swift', ['build'].concat(opts));
      buildProcess.on('error', function(err) {
        this.env.error(chalk.red('Failed to launch build'));
      });
      buildProcess.on('close', function(err) {
        if(err) {
          this.env.error(chalk.red('\nswift build command completed with errors'));
        }

        this.log('swift build command completed');
        done();
      }.bind(this));
    },

    generateXCodeprojFile: function() {

      var done = this.async();
      var buildProcess = this.spawnCommand('swift', ['package', 'generate-xcodeproj']);
      buildProcess.on('error', function(err) {
        this.env.error(chalk.red('Failed to generate <application>.xcodeproj file'));
      });
      buildProcess.on('close', function(err) {
        if(err) {
          this.env.error(chalk.red('\nswift package generate-xcodeproj command completed with errors'));
        }

        this.log('generate .xcodeproj command completed');
        done();
      }.bind(this));
    }
  }
});
