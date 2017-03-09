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
var path = require('path');
var assert = require('yeoman-assert');
var helpers = require('yeoman-test');
var fs = require('fs');
var format = require('util').format;

var expectedFiles = ['.swiftservergenerator-project', 'Package.swift', 'config.json',
                     '.cfignore', '.yo-rc.json'];

var appName = 'todo';
var modelName = 'todo';
var modelPlural = 'todos';
var className = 'Todo';
var genDir = 'Sources/Generated'
var modelDir = 'models'

var expectedSourceFiles = [`Sources/${appName}/main.swift`];

var expectedModelFiles = [`${modelDir}/${modelName}.json`, `${genDir}/${className}.swift`,
    `${genDir}/${className}Adapter.swift`, `${genDir}/${className}Resource.swift`,
    `${genDir}/Application.swift`];

var expectedBluemixFiles = ['README.md',
                            'manifest.yml',
                            '.bluemix/pipeline.yml',
                            '.bluemix/toolchain.yml',
                            '.bluemix/deploy.json'];

describe('swiftserver:refresh', function () {
  describe('Basic refresh generator test. ' +
           'Check the Swagger file exists and ' +
           'is written out correctly.', function () {

    var dirName;
    var expected = [
      `definitions/${appName}.yaml`
    ];
    var runContext;

    before(function () {
        var spec = {
          appType: 'crud',
          appName: appName,
          config: {
            logger: 'helium',
            port: 8090
          },
          "models": [
            {
              "name": modelName,
              "plural": modelPlural,
              "classname": className,
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
          ]
        }
        // Mock the options, set up an output folder and run the generator
      runContext = helpers.run(path.join( __dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise();
    });

    after(function() {
      runContext.cleanTestDirectory();
    });

    it('generates the expected files', function () {
      assert.file(expected);
    });

    // This is only a starter set of checks, we need to add further check in.
    it('the swagger file contains the expected content', function() {
      assert.fileContent([
        [expected[0], 'title: ' + appName],
        [expected[0], `${modelName}:`]
      ]);
    });
  });

  describe('Basic refresh generator test with apic option. ' +
           'Check the yaml files exist and ' +
           'are written out correctly.', function () {

    var dirName;
    var appName = 'testApp';
    var expected = [
      `definitions/${appName}-product.yaml`,
      `definitions/${appName}.yaml`
    ];
    var runContext;

    before(function () {
      var spec = {
        appType: 'crud',
        appName: appName,
        config: {
          logger: 'helium',
          port: 8090
        },
        "models": [
          {
            "name": modelName,
            "plural": modelPlural,
            "classname": className,
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
        ]
      }
      // Mock the options, set up an output folder and run the generator
      runContext = helpers.run(path.join( __dirname, '../../refresh'))
        .withOptions({
          specObj: spec,
          apic: true
        })
        return runContext.toPromise();
    });

    after(function() {
      runContext.cleanTestDirectory();
    });

    it('generates the expected files', function () {
      assert.file(expected);
    });

    it('the product file contains the expected content', function() {
      assert.fileContent([
        [expected[0], 'name: ' + appName],
        [expected[0], 'title: ' + appName]
      ]);
    });

    // This is only a starter set of checks, we need to add further check in.
    it('the swagger file contains the expected content', function() {
      assert.fileContent([
        [expected[1], 'name: ' + appName],
        [expected[1], 'title: ' + appName],
        [expected[1], `${modelName}:`]
      ]);
    });
  });

  describe('Generate the config file from the spec', function () {

    var runContext;

    before(function () {
        // Mock the options, set up an output folder and run the generator
        var spec = {
          appType: 'crud',
          appName: appName,
          bluemix: true,
          config: {
            logger: 'helium',
            port: 8090
          }
        };
      runContext = helpers.run(path.join( __dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise();
    });

    after(function() {
      runContext.cleanTestDirectory();
    });

    if('generated the correct config file', function() {
      assert.jsonFileContent('config.json', {config: {logger: 'helium', port: 8090}});
    });

    it('generates the expected files in the root of the project', function () {
      assert.file(expectedFiles);
    });

    it('generates the swift files', function() {
      assert.file(expectedSourceFiles);
    });
  });

  describe('Generate a skeleton CRUD application without bluemix', function () {

    var runContext;

    before(function () {
        // Set up the spec file which should create all the necessary files for a server
        var spec = {
          appType: 'crud',
          appName: appName,
          bluemix: false,
          config: {
            logger: 'helium',
            port: 8090
          },
          "models": [
            {
              "name": modelName,
              "plural": modelPlural,
              "classname": className,
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
          ]
        };
      runContext = helpers.run(path.join( __dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise();
    });

    after(function() {
      runContext.cleanTestDirectory();
    });

    it('generates the expected files in the root of the project', function () {
      assert.file(expectedFiles);
    });

    it('generates the generic swift source files', function() {
      assert.file(expectedSourceFiles);
    });

    it('generates a todo model metadata file and the todo swift files', function() {
      assert.file(expectedModelFiles);
    });

    it('does not generate the bluemix files', function() {
      assert.noFile(expectedBluemixFiles);
    });

    it('does not generate any capabilities', function() {
      assert.noFileContent('Sources/Generated/Application.swift', 'import SwiftMetrics');
      assert.noFileContent('Sources/Generated/Application.swift', 'import SwiftMetricsDash');
      assert.noFileContent('Sources/Generated/Application.swift', 'SwiftMetrics()');
      assert.noFileContent('Sources/Generated/Application.swift', 'SwiftMetricsDash(swiftMetricsInstance');
      assert.noFileContent('Sources/Generated/Application.swift', 'import SwiftMetricsBluemix');
      assert.noFileContent('Sources/Generated/Application.swift', 'let _ = AutoScalar(swiftMetricsInstance: sm)');
    });
  });

  describe('Generate a skeleton CRUD application for bluemix', function () {

    var runContext;

    before(function () {
        // Set up the spec file which should create all the necessary files for a server
        var spec = {
          appType: 'crud',
          appName: appName,
          bluemix: true,
          config: {
            logger: 'helium',
            port: 8090
          },
          "models": [
            {
              "name": modelName,
              "plural": modelPlural,
              "classname": className,
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
          ]
        };
      runContext = helpers.run(path.join( __dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise();
    });

    after(function() {
      runContext.cleanTestDirectory();
    });

    it('generates the expected files in the root of the project', function () {
      assert.file(expectedFiles);
    });

    it('generates the generic swift source files', function() {
      assert.file(expectedSourceFiles);
    });

    it('generates a todo model metadata file and the todo swift files', function() {
      assert.file(expectedModelFiles);
    });

    it('generates the bluemix files', function() {
      assert.file(expectedBluemixFiles);
    });
  });

  describe('Generate a CRUD application with capabilities', function() {

    var runContext;

    before(function () {
        // Set up the spec file which should create all the necessary files for a server
        var spec = {
          appType: 'crud',
          appName: appName,
          bluemix: false,
          config: {
            logger: 'helium',
            port: 8090
          },
          capabilities: {
            "metrics" : true,
            "autoscale": "myAutoScalingService"
          }
        };
      runContext = helpers.run(path.join( __dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise();
    });

    after(function() {
      runContext.cleanTestDirectory();
    });

    it('generates metrics and autoscale capabilities', function() {
      assert.fileContent('Sources/Generated/Application.swift', 'import SwiftMetrics');
      assert.fileContent('Sources/Generated/Application.swift', 'import SwiftMetricsDash');
      assert.fileContent('Sources/Generated/Application.swift', 'SwiftMetrics()');
      assert.fileContent('Sources/Generated/Application.swift', 'try SwiftMetricsDash(');
      assert.fileContent('Sources/Generated/Application.swift', 'import SwiftMetricsBluemix');
      assert.fileContent('Sources/Generated/Application.swift', 'AutoScalar(swiftMetricsInstance:');
    });
  });

  describe('Generate a CRUD application without metrics', function() {

    var runContext;

    before(function () {
        // Set up the spec file which should create all the necessary files for a server
        var spec = {
          appType: 'crud',
          appName: appName,
          bluemix: false,
          config: {
            logger: 'helium',
            port: 8090
          },
          capabilities: {
            "metrics" : false
          }
        };
      runContext = helpers.run(path.join( __dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise();
    });

    after(function() {
      runContext.cleanTestDirectory();
    });

    it('generates metrics and autoscale capabilities', function() {
      assert.noFileContent('Sources/Generated/Application.swift', 'import SwiftMetrics\nimport SwiftMetricsDash');
      assert.noFileContent('Sources/Generated/Application.swift', 'SwiftMetrics()');
      assert.noFileContent('Sources/Generated/Application.swift', 'try SwiftMetricsDash(');
      assert.noFileContent('Sources/Generated/Application.swift', 'import SwiftMetricsBluemix');
      assert.noFileContent('Sources/Generated/Application.swift', 'AutoScalar(swiftMetricsInstance:');
    });
  });

  describe('Generated a CRUD application with cloudant for bluemix', function() {

    var runContext;

    before(function() {
      var spec = {
        appType: 'crud',
        appName: appName,
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
            "name": modelName,
            "plural": modelPlural,
            "classname": className,
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
      runContext =  helpers.run(path.join( __dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
        return runContext.toPromise();                        // Get a Promise back when the generator finishes
    });

    after(function() {
      runContext.cleanTestDirectory();
    });

    it('generates the extensions required by bluemix', function() {
      assert.file(`Sources/Generated/Extensions/CouchDBExtension.swift`)
    });

    it('imports the correct modules in Application.swift', function() {
      assert.fileContent('Sources/Generated/Application.swift', 'import CouchDB');
    });

    it('initialises cloudant', function() {
      assert.fileContent('Sources/Generated/Application.swift', ': CouchDBClient?');
    });

    it('creates the boilerplate to connect to cloudant', function() {
      assert.fileContent('Sources/Generated/Application.swift', 'manager.getCloudantService(name: "myCloudantService")');
      assert.fileContent('Sources/Generated/Application.swift', 'CouchDBClient(service: cloudantService)');
    });

    it('generates the correct adapter for the resource', function() {
      assert.file(`${genDir}/${className}CloudantAdapter.swift`)
    });

  });

  describe('Generated a CRUD application with cloudant without bluemix', function() {

    var runContext;

    before(function() {
      var spec = {
        appType: 'crud',
        appName: appName,
        bluemix: false,
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
            "name": modelName,
            "plural": modelPlural,
            "classname": className,
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
      runContext = helpers.run(path.join( __dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise();
    });

    after(function() {
      runContext.cleanTestDirectory();
    });

    it('does not generate the extensions required by bluemix', function() {
      assert.noFile(`Sources/Generated/Extensions/CouchDBExtension.swift`)
    });

    it('imports the correct modules in Application.swift', function() {
      assert.fileContent('Sources/Generated/Application.swift', 'import CouchDB');
    });

    it('initialises cloudant', function() {
      assert.fileContent('Sources/Generated/Application.swift', ': CouchDBClient?');
    });

    it('creates the boilerplate to connect to cloudant', function() {
      assert.fileContent('Sources/Generated/Application.swift', 'ConnectionProperties(host: "localhost", port: 5984, secured: false)');
      assert.fileContent('Sources/Generated/Application.swift', 'CouchDBClient(connectionProperties: couchDBConnProps)');
    });

  });

  describe('Generate skeleton web application for bluemix', function () {

    var runContext;

    before(function () {
        // Set up the spec file which should create all the necessary files for a server
        var spec = {
          appType: 'web',
          appName: appName,
          bluemix: true,
          config: {
            logger: 'helium',
            port: 8090
          }
        };
      runContext = helpers.run(path.join( __dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise();
    });

    after(function() {
      runContext.cleanTestDirectory();
    });

    it('generates the expected files in the root of the project', function () {
      assert.file(expectedFiles);
    });

    it('generates the main.swift in the correct directory', function() {
      assert.file('Sources/todoServer/main.swift');
    });

    if('generates Application.swift', function() {
      assert.file('Sources/todo/Application.swift')
    });

    it('generates web only files and folders', function() {
      var expectedExtensionFiles = [`Sources/${appName}/Routes/IndexRouter.swift`,
                                    `public/.keep`];
      assert.file(expectedExtensionFiles);
    });

    it('generates the bluemix files', function() {
      assert.file(expectedBluemixFiles);
    });
  });

  describe('Generate skeleton web application without bluemix', function () {

    var runContext;

    before(function () {
        // Set up the spec file which should create all the necessary files for a server
        var spec = {
          appType: 'web',
          appName: appName,
          bluemix: false,
          config: {
            logger: 'helium',
            port: 8090
          }
        };
      runContext = helpers.run(path.join( __dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise();
    });

    after(function() {
      runContext.cleanTestDirectory();
    });

    it('generates the expected files in the root of the project', function () {
      assert.file(expectedFiles);
    });

    it('generates the generic swift source files', function() {
      assert.file('Sources/todoServer/main.swift');
    });

    if('generates Application.swift', function() {
      assert.file('Sources/todo/Application.swift')
    });

    it('generates web only file and folders', function() {
      var expectedExtensionFiles = [`Sources/${appName}/Application.swift`,
                                    `public/.keep`];
      assert.file(expectedExtensionFiles);
    });

    it('does not generate the bluemix files', function() {
      assert.noFile(expectedBluemixFiles);
    });
  });

  describe('Generate a web application with capabilities', function() {

    var runContext;

    before(function () {
        // Set up the spec file which should create all the necessary files for a server
        var spec = {
          appType: 'web',
          appName: appName,
          bluemix: false,
          config: {
            logger: 'helium',
            port: 8090
          },
          capabilities: {
            "metrics" : true,
            "autoscale": "myAutoScalingService"
          }
        };
      runContext = helpers.run(path.join( __dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise();
    });

    after(function() {
      runContext.cleanTestDirectory();
    });

    it('generates metrics and autoscale capabilities', function() {
      assert.fileContent('Sources/todo/Application.swift', 'import SwiftMetrics');
      assert.fileContent('Sources/todo/Application.swift', 'import SwiftMetricsDash');
      assert.fileContent('Sources/todo/Application.swift', 'try SwiftMetrics()');
      assert.fileContent('Sources/todo/Application.swift', 'try SwiftMetricsDash(swiftMetricsInstance');
      assert.fileContent('Sources/todo/Application.swift', 'import SwiftMetricsBluemix');
      assert.fileContent('Sources/todo/Application.swift', 'AutoScalar(swiftMetricsInstance:');
    });
  });

  describe('Generate a web application with capabilities', function() {

    var runContext;

    before(function () {
        // Set up the spec file which should create all the necessary files for a server
        var spec = {
          appType: 'web',
          appName: appName,
          bluemix: false,
          config: {
            logger: 'helium',
            port: 8090
          },
          capabilities: {
            "metrics" : true,
            "autoscale": false
          }
        };
        runContext = helpers.run(path.join( __dirname, '../../refresh'))
          .withOptions({
            specObj: spec
          })
          return runContext.toPromise();                        // Get a Promise back when the generator finishes
    });

    after(function() {
      runContext.cleanTestDirectory();
    })

    it('generates metrics without autoscale capabilities', function() {
      assert.fileContent('Sources/todo/Application.swift', 'import SwiftMetrics');
      assert.fileContent('Sources/todo/Application.swift', 'import SwiftMetricsDash');
      assert.fileContent('Sources/todo/Application.swift', 'try SwiftMetrics()');
      assert.fileContent('Sources/todo/Application.swift', 'try SwiftMetricsDash(swiftMetricsInstance');
      assert.noFileContent('Sources/todo/Application.swift', 'import SwiftMetricsBluemix');
      assert.noFileContent('Sources/todo/Application.swift', 'AutoScalar(swiftMetricsInstance');
    });
  });

  describe('Generated a web application with cloudant for bluemix', function() {

    var runContext;

    before(function() {
      var spec = {
        appType: 'web',
        appName: appName,
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
      runContext = helpers.run(path.join( __dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise();
    });

    after(function() {
      runContext.cleanTestDirectory();
    });

    it('generates the cloudant extensions required by bluemix', function() {
      assert.file(`Sources/${appName}/Extensions/CouchDBExtension.swift`)
    });

    it('imports the correct modules in Application.swift', function() {
      assert.fileContent(`Sources/${appName}/Application.swift`, 'import CouchDB');
    });

    it('initialises cloudant', function() {
      assert.fileContent(`Sources/${appName}/Application.swift`, 'CouchDBClient?');
    });

    it('creates the boilerplate to connect to cloudant', function() {
      assert.fileContent(`Sources/${appName}/Application.swift`, 'try manager.getCloudantService(name: "myCloudantService")');
      assert.fileContent(`Sources/${appName}/Application.swift`, 'CouchDBClient(service: cloudantService)');
    });

  });

  describe('Generated a web application with cloudant without bluemix', function() {

    var runContext;

    before(function() {
      var spec = {
        appType: 'web',
        appName: appName,
        bluemix: false,
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
      runContext = helpers.run(path.join( __dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise();
    });

    after(function() {
      runContext.cleanTestDirectory();
    });

    it('does not generate the extensions required by bluemix', function() {
      assert.noFile(`Sources/${appName}/Extensions/CouchDBExtension.swift`)
    });

    it('imports the correct modules in Application.swift', function() {
      assert.fileContent(`Sources/${appName}/Application.swift`, 'import CouchDB');
    });

    it('initialises cloudant', function() {
      assert.fileContent(`Sources/${appName}/Application.swift`, 'CouchDBClient?');
    });

    it('creates the boilerplate to connect to cloudant', function() {
      let expectedContent = ['ConnectionProperties(host: "localhost", port: 5984, secured: false)','CouchDBClient(connectionProperties: couchDBConnProps)'];
      assert.fileContent(`Sources/${appName}/Application.swift`, 'ConnectionProperties(host: "localhost", port: 5984, secured: false)');
      assert.fileContent(`Sources/${appName}/Application.swift`, 'CouchDBClient(connectionProperties: couchDBConnProps)');
    });
  });

  describe('Generated a web application with redis for bluemix', function() {

    var runContext;

    before(function() {
      var spec = {
        appType: 'web',
        appName: appName,
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
      runContext = helpers.run(path.join( __dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise();
    });

    after(function() {
      runContext.cleanTestDirectory();
    });

    it('generates the extensions required by bluemix', function() {
      assert.file(`Sources/todo/Extensions/RedisExtension.swift`)
    });

    it('imports the correct modules in Application.swift', function() {
      assert.fileContent('Sources/todo/Application.swift', 'import SwiftRedis');
    });

    it('initialises redis', function() {
      assert.fileContent('Sources/todo/Application.swift', 'Redis?');
    });

    it('creates the boilerplate to connect to redis', function() {
      assert.fileContent('Sources/todo/Application.swift', 'manager.getRedisService(name: "myRedisService")');
    });

  });

  describe('Generated a web application with redis without bluemix', function() {

    var runContext;

    before(function() {
      var spec = {
        appType: 'web',
        appName: appName,
        bluemix: false,
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
      runContext = helpers.run(path.join( __dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise();
    });

    after(function() {
      runContext.cleanTestDirectory();
    });

    it('does not generate the extensions required by bluemix', function() {
      assert.noFile(`Sources/todo/Extensions/RedisExtension.swift`)
    });

    it('imports the correct modules in Application.swift', function() {
      assert.fileContent('Sources/todo/Application.swift', 'import SwiftRedis');
    });

    it('initialises redis', function() {
      assert.fileContent('Sources/todo/Application.swift', 'Redis?');
    });

    it('creates the boilerplate to connect to redis', function() {
      assert.fileContent('Sources/todo/Application.swift', 'Redis()');
    });

  });

  describe('Generated a web application with mongo for bluemix', function() {

    var runContext;

    before(function() {
      var spec = {
        appType: 'web',
        appName: appName,
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
      runContext = helpers.run(path.join( __dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise();
    });

    after(function() {
      runContext.cleanTestDirectory();
    });

    it('does not generate the extensions required by bluemix', function() {
      assert.file(`Sources/todo/Extensions/MongoDBExtension.swift`)
    });

    it('imports the correct modules in Application.swift', function() {
      assert.fileContent('Sources/todo/Application.swift', 'import MongoKitten');
      assert.fileContent('Sources/todo/Application.swift', 'import SSLService');
    });

    it('initialises mongo server', function() {
      assert.fileContent('Sources/todo/Application.swift', 'internal var server: Server?');
    });

    it('creates the boilerplate to connect to mongo', function() {
      assert.fileContent('Sources/todo/Application.swift', 'manager.getMongoDBService(name: "myMongoDBService")');
      assert.fileContent('Sources/todo/Application.swift', 'server = Server(service: mongoDBService)');
    });
  });

  describe('Generated a web application with mongo without bluemix', function() {

    var runContext;

    before(function() {
      var spec = {
        appType: 'web',
        appName: appName,
        bluemix: false,
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
      runContext = helpers.run(path.join( __dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise();
    });

    after(function() {
      runContext.cleanTestDirectory();
    });

    it('does not generate the extensions required by bluemix', function() {
      assert.noFile(`Sources/todo/Extensions/MongoDBExtension.swift`)
    });

    it('imports the correct modules in Application.swift', function() {
      assert.fileContent('Sources/todo/Application.swift', 'import MongoKitten');
      assert.fileContent('Sources/todo/Application.swift', 'import SSLService');
    });

    it('initialises mongo server', function() {
      assert.fileContent('Sources/todo/Application.swift', 'internal var server: Server?');
    });

    it('creates the boilerplate to connect to mongo', function() {
      let expectedContent = 'server = try (mongoURL: "mongodb://username:password@localhost")';
      assert.fileContent('Sources/todo/Application.swift', expectedContent);
    });
  });

  describe('Generated a web application with objectstorage for bluemix', function() {

    var runContext;

    before(function() {
      var spec = {
        appType: 'web',
        appName: appName,
        bluemix: true,
        config: {
          logger: 'helium',
          port: 8090
        },
        services: {
          objectstorage: [{
            name: "myObjectStorageService"
          }]
        }
      };
      runContext = helpers.run(path.join( __dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise();
    });

    after(function() {
      runContext.cleanTestDirectory();
    });

    it('does not generate the extensions required by bluemix', function() {
      assert.file(`Sources/todo/Extensions/ObjStorageExtension.swift`)
    });

    it('imports the correct modules in Application.swift', function() {
      assert.fileContent('Sources/todo/Application.swift', 'import BluemixObjectStorage');
    });

    it('initialises object storage', function() {
      assert.fileContent('Sources/todo/Application.swift', 'internal var objectStorage: ObjectStorage?');
    });

    it('creates the boilerplate to connect to object storage', function() {
      assert.fileContent('Sources/todo/Application.swift', 'try manager.getObjectStorageService(name: "myObjectStorageService")');
      assert.fileContent('Sources/todo/Application.swift', 'ObjectStorage(service: objectStorageService)');
      assert.fileContent('Sources/todo/Application.swift', 'objectStorage?.connectSync(service: objectStorageService)');
    });
  });

  describe('Generated a web application for bluemix without services', function() {

    var runContext;

    before(function() {
      var spec = {
        appType: 'web',
        appName: appName,
        bluemix: true,
        config: {
          logger: 'helium',
          port: 8090
        },
        "models": [
          {
            "name": modelName,
            "plural": modelPlural,
            "classname": className,
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
        ]
      };
      runContext = helpers.run(path.join( __dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise();
    });

    after(function() {
      runContext.cleanTestDirectory();
    });

    it('does not generate services in manifest.yml', function() {
      assert.noFileContent('manifest.yml', 'services:');
    });

    it('does not generate declared-services in manifest.yml', function() {
      assert.noFileContent('manifest.yml', 'declared-services:');
    });
  });

  describe('Rejected spec containing a service with no name', function() {

    var runContext;
    var error = null;

    before(function() {
      var spec = {
        appType: 'web',
        appName: appName,
        config: {
          logger: 'helium',
          port: 8090
        },
        services: {
          objectstorage: [{
            label: "Object-Storage"
          }]
        }
      };
      runContext = helpers.run(path.join( __dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise().catch(function(err) {
        error = err;
      });
    });

    after(function() {
      runContext.cleanTestDirectory();
    });

    it('aborts the generator with an error', function() {
      assert(error, 'Should throw an error');
      assert(error.message.match('Service name is missing.*$'), 'Thrown error should be about missing service name');
    });
  });

    describe('Generate BFF application for bluemix', function () {

    var runContext;

    before(function () {
        // Set up the spec file which should create all the necessary files for a server
        var spec = {
          appType: 'bff',
          appName: appName,
          bluemix: true,
          config: {
            logger: 'helium',
            port: 8090
          }
        };
      runContext = helpers.run(path.join( __dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise();
    });

    after(function() {
      runContext.cleanTestDirectory();
    });

    it('generates the expected files in the root of the project', function () {
      assert.file(expectedFiles);
    });

    it('generates the main.swift in the correct directory', function() {
      assert.file('Sources/todoServer/main.swift');
    });

    if('generates Application.swift', function() {
      assert.file('Sources/todo/Application.swift')
    });

    it('generates the bluemix files', function() {
      assert.file(expectedBluemixFiles);
    });

    it('defines BFF routes', function() {
      var bffRoutesFile = 'Sources/' + appName + '/Routes/BFFRoutes.swift';
      assert.file(bffRoutesFile);
      assert.fileContent(bffRoutesFile, 'Hello World!');
    });

    it('init BFF routes', function() {
      assert.fileContent('Sources/todo/Application.swift', 'initializeBFFRoutes()');
    });

  });

});
