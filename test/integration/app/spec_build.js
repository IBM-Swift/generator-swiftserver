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
var buildGeneratorPath = path.join(__dirname, '../../../build');

describe('Spec option and build integration tests for app generator', function () { 

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
        port: 4567
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
      runContext = helpers.run(appGeneratorPath)
                          .withOptions({
                            spec: JSON.stringify(spec)
                          });

      return runContext.toPromise()
                        .then(function(dir) {
                          return helpers.run(buildGeneratorPath)
                                        .cd(dir + "/swiftserver")
                                        .toPromise();
                        });
    });

    it('compiles the application', function () {
      assert.file('.build/debug/todo');
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
        port: 4567
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
      runContext = helpers.run(appGeneratorPath)
                          .withOptions({
                            spec: JSON.stringify(spec)
                          });

      return runContext.toPromise()
                       .then(function(dir) {
                         return helpers.run(buildGeneratorPath)
                                       .cd(dir + "/swiftserver")
                                       .toPromise();
                       });
    });

    it('compiles the application', function () {
      assert.file('.build/debug/todo');
    });
  });

  describe('Web application with a cloudant service and is able to build', function () {
    // Swift build is slow so we need to set a longer timeout for the test
    this.timeout(300000);

    var runContext;

    var spec = {
      appType: 'scaffold',
      appName: 'todo',
      web: true,
      bluemix: true,
      config: {
        logger: 'helium',
        port: 4567
      },
      services: {
        cloudant: [{
          name: "myCloudantService"
        }]
      }
    };

    before(function () {
      runContext = helpers.run(appGeneratorPath)
                          .withOptions({
                            spec: JSON.stringify(spec)
                          });

      return runContext.toPromise()
                       .then(function(dir) {
                         return helpers.run(buildGeneratorPath)
                                       .cd(dir + "/swiftserver")
                                       .toPromise();
                       });
    });

    it('compiles the application', function () {
      assert.file('.build/debug/todo');
    });
  });

  describe('Web application with a redis service and is able to build', function () {
    // Swift build is slow so we need to set a longer timeout for the test
    this.timeout(300000);

    var runContext;

    var spec = {
      appType: 'scaffold',
      appName: 'todo',
      web: true,
      bluemix: true,
      config: {
        logger: 'helium',
        port: 4567
      },
      services: {
        redis: [{
          name: "myRedisService"
        }]
      }
    };

    before(function () {
      runContext = helpers.run(appGeneratorPath)
                          .withOptions({
                            spec: JSON.stringify(spec)
                          });

        return runContext.toPromise()
                         .then(function(dir) {
                           return helpers.run(buildGeneratorPath)
                                         .cd(dir + "/swiftserver")
                                         .toPromise();
                         });
    });

    it('compiles the application', function () {
      assert.file('.build/debug/todo');
    });
  });

  describe('Web application with an appid service is able to build', function () {
    // Swift build is slow so we need to set a longer timeout for the test
    this.timeout(300000);

    var runContext;

    var spec = {
      appType: 'scaffold',
      appName: 'todo',
      web: true,
      bluemix: true,
      config: {
        logger: 'helium',
        port: 4567
      },
      services: {
        appid: [{
          name: "myAppIDService"
        }]
      }
    };

    before(function () {
      runContext = helpers.run(appGeneratorPath)
                          .withOptions({
                            spec: JSON.stringify(spec)
                          });

        return runContext.toPromise()
                         .then(function(dir) {
                           return helpers.run(buildGeneratorPath)
                                         .cd(dir + "/swiftserver")
                                         .toPromise();
                         });
    });

    it('compiles the application', function () {
      assert.file('.build/debug/todo');
    });
  });

  describe('Web application with an object storage service is able to build', function () {
    // Swift build is slow so we need to set a longer timeout for the test
    this.timeout(300000);

    var runContext;

    var spec = {
      appType: 'scaffold',
      appName: 'todo',
      web: true,
      bluemix: true,
      config: {
        logger: 'helium',
        port: 4567
      },
      services: {
        objectstorage: [{
          name: "mObjectStorageService"
        }]
      }
    };

    before(function () {
      runContext = helpers.run(appGeneratorPath)
                          .withOptions({
                            spec: JSON.stringify(spec)
                          });

        return runContext.toPromise()
                         .then(function(dir) {
                           return helpers.run(buildGeneratorPath)
                                         .cd(dir + "/swiftserver")
                                         .toPromise();
                         });
    });

    it('compiles the application', function () {
      assert.file('.build/debug/todo');
    });
  });

  describe('Web application with a watson conversation service is able to build', function () {
    // Swift build is slow so we need to set a longer timeout for the test
    this.timeout(300000);

    var runContext;

    var spec = {
      appType: 'scaffold',
      appName: 'todo',
      bluemix: true,
      config: {
        logger: 'helium',
        port: 4567
      },
      services: {
        watsonconversation: [{
          name: "myWatsonConversationService"
        }]
      }
    };

    before(function () {
      runContext = helpers.run(appGeneratorPath)
                          .withOptions({
                            spec: JSON.stringify(spec)
                          });

        return runContext.toPromise()
                         .then(function(dir) {
                           return helpers.run(buildGeneratorPath)
                                         .cd(dir + "/swiftserver")
                                         .toPromise();
                         });
    });

    it('compiles the application', function () {
      assert.file('.build/debug/todo');
    });
  });
});
