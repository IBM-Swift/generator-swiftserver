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

/**
 * Tests here do not stub out the subgenerators, so for the app generator
 * the real build and refresh subgenerators get called.
 */
'use strict';
var path = require('path');
var assert = require('yeoman-assert');
var helpers = require('yeoman-test');
var rimraf = require('rimraf');

describe('Prompt and no build integration tests', function () {

  describe('Basic application', function() {
    this.timeout(10000); // Allow first test to be slow
    var runContext;

    before(function() {
      runContext = helpers.run(path.join( __dirname, '../../app'))
                          .withOptions({ 'skip-build': true })
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
      assert.file('.swiftservergenerator-project');
    });

    it('created a .yo-rc.json file', function() {
      assert.file('.yo-rc.json');
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
  });

  describe('Basic application with bluemix', function() {
    var runContext;

    before(function() {
      runContext = helpers.run(path.join( __dirname, '../../app'))
                          .withOptions({ 'skip-build': true })
                          .withPrompts({
                            appType: 'Scaffold a starter',
                            name: 'notes',
                            dir:  'notes',
                            capabilities: ['Bluemix cloud deployment']
                          });
      return runContext.toPromise();
    });

    it('Package.swift contains CloudConfiguration dependency', function() {
      assert.fileContent('Package.swift', '/CloudConfiguration');
    });
  });

  describe('Basic application with metrics', function() {
    var runContext;

    before(function() {
      runContext = helpers.run(path.join( __dirname, '../../app'))
                          .withOptions({ 'skip-build': true })
                          .withPrompts({
                            appType: 'Scaffold a starter',
                            name: 'notes',
                            dir:  'notes',
                            capabilities: ['Embedded metrics dashboard']
                          });
      return runContext.toPromise();
    });

    it('Package.swift contains SwiftMetrics dependency', function() {
      assert.fileContent('Package.swift', '/SwiftMetrics');
    });

    it('Application.swift imports SwiftMetrics', function() {
      assert.fileContent('Sources/Application/Application.swift', 'import SwiftMetrics');
    });

    it('Application.swift imports SwiftMetricsDash', function() {
      assert.fileContent('Sources/Application/Application.swift', 'import SwiftMetricsDash');
    });
  });

  describe('Basic application with autoscaling', function() {
    var runContext;

    before(function() {
      runContext = helpers.run(path.join( __dirname, '../../app'))
                          .withOptions({ 'skip-build': true })
                          .withPrompts({
                            appType: 'Scaffold a starter',
                            name: 'notes',
                            dir:  'notes',
                            capabilities: [
                              'Embedded metrics dashboard',
                              'Bluemix cloud deployment'
                            ],
                            services: ['Auto-scaling']
                          });
      return runContext.toPromise();
    });

    it('Application.swift imports SwiftMetricsBluemix', function() {
      assert.fileContent('Sources/Application/Application.swift', 'import SwiftMetricsBluemix');
    });

    it('Application.swift references SwiftMetricsBluemix', function() {
      assert.fileContent('Sources/Application/Application.swift', 'SwiftMetricsBluemix(');
    });
  });

  describe('CRUD application where application name and directory name are the current (empty) directory', function () {
    var runContext;

    before(function () {
      runContext = helpers.run(path.join( __dirname, '../../app'))
                          .withOptions({ 'skip-build': true })
                          .withPrompts({
                            appType: 'Generate a CRUD application',
                            name: 'notes'
                          })
                          .inTmpDir(function(tmpDir) {
                            this.inDir(path.join(tmpDir, 'notes'))
                          });
      return runContext.toPromise();                        // Get a Promise back when the generator finishes
    });

    it('used the empty directory for the project', function () {
      assert.equal(path.basename(process.cwd()), 'notes');
      assert.file('.swiftservergenerator-project');
    });
  });

});
