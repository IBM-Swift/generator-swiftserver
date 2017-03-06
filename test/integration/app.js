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

// Files which we assert are created each time the app generator is run.
var expected = [
  'Package.swift',
  '.swiftservergenerator-project'
];

describe('swiftserver:app integration test', function () {

  describe('Application name and directory name are the same, not the cwd', function () {

    // Swift build is slow so we need to set a longer timeout for the test
    this.timeout(300000);
    var runContext;

    before(function () {
      // Mock the options, set up an output folder and run the generator
      runContext = helpers.run(path.join( __dirname, '../../app'))
        .withPrompts({                       // Mock the prompt answers
          name: 'notes',
          dir:  'notes'
        })
        return runContext.toPromise();                        // Get a Promise back when the generator finishes
    });

    it('created and changed into a folder according to dir value', function () {
      assert.equal(path.basename(process.cwd()), 'notes');
    });

    it('compiles the application', function () {
      assert.file(process.cwd()+'/.build/debug/notes');
    });
  });

  // For this test, don't run the build, we only need to check that the
  // right files are generated
  describe('Application name and directory name are the current (empty) directory', function () {
    var runContext;

    before(function () {
      // Mock the options, set up an output folder and run the generator
      runContext = helpers.run(path.join( __dirname, '../../app'))
        .withPrompts({ name: 'notes' })
        .withOptions({ 'skip-build': true })
        .inTmpDir(function(tmpDir) {
          this.inDir(path.join(tmpDir, 'notes'))
        });
        return runContext.toPromise();                        // Get a Promise back when the generator finishes
    });

    after(function() {
      //runContext.cleanTestDirectory();
    });

    it('used the empty directory for the project', function () {
      assert.equal(path.basename(process.cwd()), 'notes');
      assert.file(process.cwd()+'/.swiftservergenerator-project');
    });
  });

  describe('A CRUD application with a cloudant service is able to build', function () {

    // Swift build is slow so we need to set a longer timeout for the test
    this.timeout(300000);

    var runContext;

    var spec = {
      appType: 'crud',
      appName: 'todo',
      bluemix: true,
      config: {
        logger: 'helium',
        port: 8090
      },
      services: {
        cloudant: [{
          name: "myCloudantService"
        }]
      },
      "models": [
        {
          "name": 'todo',
          "plural": 'todos',
          "classname": 'Todo',
          "properties": {
            "id": {
              "type": "string",
              "id": true
            },
            "title": {
              "type": "string"
            }
          }
        }
      ],
      crudservice: "myCloudantService"
    };

    before(function () {
      // Mock the options, set up an output folder and run the generator

      runContext = helpers.run(path.join( __dirname, '../../app'))
        .withOptions({
          spec: JSON.stringify(spec)
        });

          return runContext.toPromise()
                            .then(function(dir) {
                              return helpers.run(path.join(__dirname, '../../build'))
                                     .cd(dir+"/swiftserver")
                                     .toPromise()
                              });
      });

    it('compiles the application', function () {
      assert.file(process.cwd()+'/.build/debug/todo');
    });
  });

  describe('A CRUD application with metrics and autoscaling is able to build', function () {

    // Swift build is slow so we need to set a longer timeout for the test
    this.timeout(300000);

    var runContext;

    var spec = {
      appType: 'crud',
      appName: 'todo',
      bluemix: true,
      config: {
        logger: 'helium',
        port: 8090
      },
      capabilities: {
        metrics: true,
        autoscale: "myAutoScalingService"
      },
      "models": [
        {
          "name": 'todo',
          "plural": 'todos',
          "classname": 'Todo',
          "properties": {
            "id": {
              "type": "string",
              "id": true
            },
            "title": {
              "type": "string"
            }
          }
        }
      ],
      crudService: "myCloudantService"
    };

    before(function () {
      // Mock the options, set up an output folder and run the generator

      runContext = helpers.run(path.join( __dirname, '../../app'))
        .withOptions({
          spec: JSON.stringify(spec)
        })

          return runContext.toPromise()
                            .then(function(dir) {
                              return helpers.run(path.join(__dirname, '../../build'))
                                     .cd(dir+"/swiftserver")
                                     .toPromise()
                              });
      });

      it('compiles the application', function () {
        assert.file(process.cwd()+'/.build/debug/todo');
      });
  });

  describe('Web application with a cloudant service and is able to build', function () {

    // Swift build is slow so we need to set a longer timeout for the test
    this.timeout(300000);

    var runContext;

    var spec = {
      appType: 'web',
      appName: 'todo',
      bluemix: true,
      config: {
        logger: 'helium',
        port: 8090
      },
      services: {
        cloudant: [{
          name: "myCloudantService"
        }]
      }
    };

    before(function () {
      // Mock the options, set up an output folder and run the generator

      runContext = helpers.run(path.join( __dirname, '../../app'))
        .withOptions({
          spec: JSON.stringify(spec)
        })

          return runContext.toPromise()
                            .then(function(dir) {
                              return helpers.run(path.join(__dirname, '../../build'))
                                     .cd(dir+"/swiftserver")
                                     .toPromise()
                              });
      });

      it('compiles the application', function () {
        assert.file(process.cwd()+'/.build/debug/todoServer');
      });
  });

  describe('Web application with a redis service and is able to build', function () {

    // Swift build is slow so we need to set a longer timeout for the test
    this.timeout(300000);

    var runContext;

    var spec = {
      appType: 'web',
      appName: 'todo',
      bluemix: true,
      config: {
        logger: 'helium',
        port: 8090
      },
      services: {
        redis: [{
          name: "myRedisService"
        }]
      }
    };

    before(function () {
      // Mock the options, set up an output folder and run the generator

      runContext = helpers.run(path.join( __dirname, '../../app'))
        .withOptions({
          spec: JSON.stringify(spec)
        })

          return runContext.toPromise()
                            .then(function(dir) {
                              return helpers.run(path.join(__dirname, '../../build'))
                                     .cd(dir+"/swiftserver")
                                     .toPromise()
                              });
      });

      it('compiles the application', function () {
        assert.file(process.cwd()+'/.build/debug/todoServer');
      });
  });

  describe('Web application with a mongo service and is able to build', function () {

    // Swift build is slow so we need to set a longer timeout for the test
    this.timeout(300000);

    var runContext;

    var spec = {
      appType: 'web',
      appName: 'todo',
      bluemix: true,
      config: {
        logger: 'helium',
        port: 8090
      },
      services: {
        mongodb: [{
          name: "myMongoDBService"
        }]
      }
    };

    before(function () {
      // Mock the options, set up an output folder and run the generator

      runContext = helpers.run(path.join( __dirname, '../../app'))
        .withOptions({
          spec: JSON.stringify(spec)
        })

          return runContext.toPromise()
                            .then(function(dir) {
                              return helpers.run(path.join(__dirname, '../../build'))
                                     .cd(dir+"/swiftserver")
                                     .toPromise()
                              });
      });

      it('compiles the application', function () {
        assert.file(process.cwd()+'/.build/debug/todoServer');
      });
  });

});
