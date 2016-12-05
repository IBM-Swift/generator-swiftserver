/*
 * Copyright IBM Corporation 2016
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

module.exports = generators.Base.extend({
  initializing: actions.ensureInProject,

  install: {
    ensureRequiredSwiftInstalled: actions.ensureRequiredSwiftInstalled,

    buildSwift: function() {
      // Build swift code
      var done = this.async();
      var buildProcess = this.spawnCommand('swift', ['build']);
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
    }
  }
});
