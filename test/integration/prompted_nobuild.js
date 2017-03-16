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

  describe('BFF application', function() {
    var runContext;

    before(function() {
      runContext = helpers.run(path.join( __dirname, '../../app'))
                          .withOptions({ 'skip-build': true })
                          .withPrompts({
                            appType: 'Scaffold a starter',
                            name: 'notes',
                            dir:  'notes',
                            appPattern: 'Backend for frontend'
                          });
      return runContext.toPromise();
    });

    describe('Static web file serving', function() {
      it('created public web directory', function () {
        assert.file('public');
      });

      it('created Application.swift with web serving of public directory', function() {
        assert.fileContent('Sources/Application/Application.swift', 'StaticFileServer()');
      });
    });

    describe('OpenAPI / Swagger endpoint', function() {
      it('created swagger endpoint route', function() {
        assert.file(`Sources/Application/Routes/SwaggerRoute.swift`);
      });
    });

    describe('Example endpoints', function() {
      it('created example endpoints', function() {
        assert.file(`Sources/Application/Routes/ProductRoutes.swift`);
      });

      it('created example swagger definition', function() {
        assert.file(`definitions/notes.yaml`);
      });
    });

    describe('Static web file serving + Example endpoints', function() {
      it('created SwaggerUI', function () {
        assert.file('public/explorer/index.html');
        assert.file('public/explorer/swagger-ui.js');
        assert.file('public/explorer/css/style.css');
      });

      it('created NOTICES.txt', function() {
        assert.file('NOTICES.txt');
      });
    });

    describe('Embedded metrics dashboard', function() {
      it('created Application.swift with metrics', function() {
        assert.fileContent('Sources/Application/Application.swift', 'import SwiftMetrics');
      });

      it('created Application.swift with metrics dashboard', function() {
        assert.fileContent('Sources/Application/Application.swift', 'import SwiftMetricsDash');
      });
    });

    describe('Docker files', function() {
      it('created tools docker file', function() {
        assert.file('Dockerfile-tools');
      });

      it('created run docker file', function() {
        assert.file('Dockerfile');
      });
    });

    describe('Bluemix cloud deployment', function() {
      it('created CloudFoundry manifest file', function() {
        assert.file('manifest.yml');
      });

      it('created Bluemix toolchain files', function() {
        assert.file('.bluemix/pipeline.yml');
        assert.file('.bluemix/toolchain.yml');
        assert.file('.bluemix/deploy.json');
      });
    });

    describe('Bluemix cloud deployment + Docker files', function() {
      it('created bluemix dev CLI config file', function() {
        assert.file('cli-config.yml');
      });
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