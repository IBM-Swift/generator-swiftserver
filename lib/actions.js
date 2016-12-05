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

var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var path = require('path');
var fs = require('fs');

var projectMarker = '.swiftservergenerator-project';

/**
 * Check that the required version of Swift is installed.
 * Generate a (fatal) yeoman error if it is not.
 */
exports.ensureRequiredSwiftInstalled = function() {
  var done = this.async();
  var child = this.spawnCommand('swift', ['--version'], { stdio: 'pipe' });
  var version = null;
  child.stdout.pipe(process.stdout);
  child.stderr.pipe(process.stderr);
  child.stdout.on('data', function(data) {
    var match = /Swift version\s+(\d+)\.\d+\.\d+/.exec(data);
    if (match) {
      version = match[1];
    }
  }.bind(this));
  child.on('error', function(err) {
    if (err) {
      this.env.error(chalk.red('Could not start swift. Is it installed and on your PATH?'));
    }
    if (version !== '3') {
      this.env.error(chalk.red('Swift version 3 is required for Swift Server Generator.'));
    }
  }.bind(this));
  child.on('close', function(err) {
    done();
  });
};

/**
 * Check the yeoman destinationRoot is a valid project directory.
 * Generate a (fatal) yeoman error if it is not.
 */
exports.ensureInProject = function() {
  // Ensure that we are in a valid project directory
  // Valid project directories will contain a zero-byte file created by the generator.
  if (!this.fs.exists(this.destinationPath(projectMarker))) {
    this.env.error(chalk.red('This is not a Swift Server Generator project directory.'));
  }
};

/**
 * Check the yeoman destinationRoot is not already a project directory.
 * Generate a (fatal) yeoman error if it is.
 */
exports.ensureNotInProject = function() {
  // Ensure that we are not in a valid project directory
  // Valid project directories will contain a zero-byte file created by the generator.
  if (this.fs.exists(this.destinationPath(projectMarker))) {
    this.env.error(chalk.red(this.destinationPath(), 'is already a Swift Server Generator project directory'));
  }
}

/**
 * Check if the current directory is empty.
 * Generate a (fatal) yeoman error if it is.
 */
exports.ensureEmptyDirectory = function() {
  if(fs.existsSync(this.destinationRoot())) {
    // A valid directory won't have any files/folders.
    var files = fs.readdirSync(this.destinationRoot());
    if (files.length > 0) {
      this.env.error(chalk.red(this.destinationRoot(), 'is not an empty directory'));
    }
  }
}
