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

/**
 * Tests here do not stub out the subgenerators, so for the app generator
 * the real build and refresh subgenerators get called.
 */
'use strict';
var path = require('path');
var assert = require('yeoman-assert');
var helpers = require('yeoman-test');
var rimraf = require('rimraf');

var appGeneratorPath = path.join(__dirname, '../../../app');

describe('Prompt and single-shot integration tests for app generator', function () {

  describe('Basic application', function() {
    this.timeout(300000); // Allow first test to be slow
    var runContext;

    before(function() {
      runContext = helpers.run(appGeneratorPath)
                          .withOptions({ 'single-shot': true })
                          .withPrompts({
                            appType: 'Scaffold a starter',
                            name: 'notes',
                            dir:  'notes',
                            capabilities: []
                          });
      return runContext.toPromise();
    });

    it('created and changed into a folder according to dir value', function () {
      assert.equal(path.basename(process.cwd()), 'notes');
    });

    it('created a .swiftservergenerator-project file', function() {
      assert.noFile('.swiftservergenerator-project');
    });

    it('created a .yo-rc.json file', function() {
      assert.noFile('.yo-rc.json');
    });

    it('created a LICENSE file', function() {
      assert.file('LICENSE');
    });

    it('created a spec.json file', function() {
      assert.file('spec.json');
    });

    it('created a Package.swift file', function() {
      assert.file('Package.swift');
    });

    it('created a main.swift file', function() {
      assert.file('Sources/notes/main.swift');
    });

    it('created an Application.swift file', function() {
      assert.file('Sources/Application/Application.swift');
    });

    it('Package.swift contains Configuration dependency', function() {
      assert.fileContent('Package.swift', '/Configuration');
    });

    it('Application.swift references Configuration', function() {
      assert.fileContent('Sources/Application/Application.swift', 'import Configuration');
    });

    it('did not create NOTICES.txt', function() {
      assert.noFile('NOTICES.txt');
    });
  });
});