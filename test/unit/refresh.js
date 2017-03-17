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
var path = require('path');
var assert = require('yeoman-assert');
var helpers = require('yeoman-test');
var fs = require('fs');
var format = require('util').format;

var expectedFiles = ['.swiftservergenerator-project', 'Package.swift', 'config.json',
                     '.cfignore', '.yo-rc.json', 'LICENSE', 'README.md'];

var appName = 'todo';
var modelName = 'todo';
var modelPlural = 'todos';
var className = 'Todo';

var generatedModule = 'Generated';
var applicationModule = 'Application';
var executableModule = appName;

var expectedSourceFiles = [`Sources/${executableModule}/main.swift`, `Sources/${applicationModule}/Application.swift`];

var expectedModelFiles = [`models/${modelName}.json`, `Sources/${generatedModule}/${className}.swift`,
    `Sources/${generatedModule}/${className}Adapter.swift`, `Sources/${generatedModule}/${className}Resource.swift`];

var expectedBluemixFiles = ['manifest.yml',
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
      // FIXME: All project types should have a README
      var expectedFilesExceptREADME = expectedFiles.filter((f) => f !== 'README.md');
      assert.file(expectedFilesExceptREADME);
    });

    it('generates the generic swift source files', function() {
      assert.file(expectedSourceFiles);
    });

    it('generates a todo model metadata file and the todo swift files', function() {
      assert.file(expectedModelFiles);
    });

    it('hosts swagger definition', function() {
      assert.file(`Sources/${applicationModule}/Routes/SwaggerRoute.swift`);
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'initializeSwaggerRoute(');
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'definitions');
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, appName + '.yaml');
    });

    it('does not generate the bluemix files', function() {
      assert.noFile(expectedBluemixFiles);
    });

    it('does not generate any capabilities', function() {
      assert.noFileContent(`Sources/${applicationModule}/Application.swift`, 'import SwiftMetrics');
      assert.noFileContent(`Sources/${applicationModule}/Application.swift`, 'import SwiftMetricsDash');
      assert.noFileContent(`Sources/${applicationModule}/Application.swift`, 'SwiftMetrics()');
      assert.noFileContent(`Sources/${applicationModule}/Application.swift`, 'SwiftMetricsDash(swiftMetricsInstance');
      assert.noFileContent(`Sources/${applicationModule}/Application.swift`, 'import SwiftMetricsBluemix');
      assert.noFileContent(`Sources/${applicationModule}/Application.swift`, 'let _ = SwiftMetricsBluemix(swiftMetricsInstance: sm)');
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

    it('defines OPENAPI_SPEC environment variable', function() {
      assert.fileContent('manifest.yml', 'OPENAPI_SPEC: "/swagger/api"');
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
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'import SwiftMetrics');
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'import SwiftMetricsDash');
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'SwiftMetrics()');
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'try SwiftMetricsDash(');
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'import SwiftMetricsBluemix');
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'SwiftMetricsBluemix(swiftMetricsInstance:');
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
      assert.noFileContent(`Sources/${applicationModule}/Application.swift`, 'import SwiftMetrics\nimport SwiftMetricsDash');
      assert.noFileContent(`Sources/${applicationModule}/Application.swift`, 'SwiftMetrics()');
      assert.noFileContent(`Sources/${applicationModule}/Application.swift`, 'try SwiftMetricsDash(');
      assert.noFileContent(`Sources/${applicationModule}/Application.swift`, 'import SwiftMetricsBluemix');
      assert.noFileContent(`Sources/${applicationModule}/Application.swift`, 'SwiftMetricsBluemix(swiftMetricsInstance:');
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
      assert.file(`Sources/${applicationModule}/Extensions/CouchDBExtension.swift`)
    });

    it('imports the correct modules in Application.swift', function() {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'import CouchDB');
    });

    it('initialises cloudant', function() {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, ': CouchDBClient?');
    });

    it('creates the boilerplate to connect to cloudant', function() {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'manager.getCloudantService(name: "myCloudantService")');
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'CouchDBClient(service: cloudantService)');
    });

    it('generates the correct adapter for the resource', function() {
      assert.file(`Sources/${generatedModule}/${className}CloudantAdapter.swift`)
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
      assert.noFile(`Sources/${applicationModule}/Extensions/CouchDBExtension.swift`)
    });

    it('generates the CloudantConfig', function() {
      assert.file(`Sources/${applicationModule}/CloudantConfig.swift`)
    });

    it('imports the correct modules in Application.swift', function() {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'import CouchDB');
    });

    it('initialises cloudant', function() {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, ': CouchDBClient?');
    });

    it('creates the boilerplate to connect to cloudant', function() {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'CloudantConfig(');
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'ConnectionProperties(');
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'CouchDBClient(connectionProperties: couchDBConnProps)');
    });

  });

  describe('Generate skeleton web application for bluemix with custom options', function () {

    var runContext;

    before(function () {
        // Set up the spec file which should create all the necessary files for a server
        var spec = {
          appType: 'scaffold',
          appName: appName,
          web: true,
          bluemix: {
            "name": "test",
            "host": "myhost",
            "domain": "mydomain.net"
          },
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

    it('produces the correct name in the manifest', function () {
      assert.fileContent('manifest.yml', 'name: test');
    });

    it('produces the correct host in the manifest', function () {
      assert.fileContent('manifest.yml', 'host: myhost');
    });

    it('produces the correct domain in the manifest', function () {
      assert.fileContent('manifest.yml', 'domain: mydomain.net');
    });

    it('generates web only files and folders', function() {
      var expectedWebFiles = [`Sources/${applicationModule}/Routes/.keep`,
                              `public/.keep`];
      assert.file(expectedWebFiles);
    });

    it('does not generate example endpoint content', function() {
      assert.noFile(`Sources/${applicationModule}/Routes/ProductRoutes.swift`);
      assert.noFileContent(`Sources/${applicationModule}/Application.swift`, 'initializeProductRoutes()');
    });

    it('does not host swagger definition', function() {
      assert.noFile(`Sources/${applicationModule}/Routes/SwaggerRoute.swift`);
      assert.noFileContent(`Sources/${applicationModule}/Application.swift`, 'initializeSwaggerRoute(');
    });

    it('does not define OPENAPI_SPEC environment variable', function() {
      assert.noFileContent('manifest.yml', 'OPENAPI_SPEC');
    });

    it('produces the correct memory in the manifest', function () {
      assert.fileContent('manifest.yml', 'memory: 128M');
    });

    it('produces the correct number of instances in the manifest', function () {
      assert.fileContent('manifest.yml', 'instances: 1');
    });

    it('produces the correct disk quota in the manifest', function () {
      assert.fileContent('manifest.yml', 'disk_quota: 1024M');
    });
  });

  describe('Generate skeleton web application for bluemix with incorrect custom options', function () {

    var runContext;

    before(function () {
        // Set up the spec file which should create all the necessary files for a server
        var spec = {
          appType: 'scaffold',
          appName: appName,
          web: true,
          bluemix: {
            "name": {},
            "host": {},
            "domain": true
          },
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

    it('produces the correct name in the manifest based on the app name', function () {
      assert.fileContent('manifest.yml', `name: ${appName}`);
    });

    it('produces sets random-route to true in the manifest', function () {
      assert.fileContent('manifest.yml', 'random-route: true');
    });
  });

  describe('Generate skeleton web application without bluemix', function () {

    var runContext;

    before(function () {
        // Set up the spec file which should create all the necessary files for a server
        var spec = {
          appType: 'scaffold',
          appName: appName,
          bluemix: false,
          web: true,
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
      assert.file(`Sources/${executableModule}/main.swift`);
    });

    if('generates Application.swift', function() {
      assert.file(`Sources/${applicationModule}/Application.swift`)
    });

    it('generates web only file and folders', function() {
      var expectedExtensionFiles = [`Sources/${applicationModule}/Application.swift`,
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
          appType: 'scaffold',
          appName: appName,
          bluemix: false,
          web: true,
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
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'import SwiftMetrics');
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'import SwiftMetricsDash');
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'try SwiftMetrics()');
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'try SwiftMetricsDash(swiftMetricsInstance');
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'import SwiftMetricsBluemix');
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'SwiftMetricsBluemix(swiftMetricsInstance:');
    });
  });

  describe('Generate a web application with capabilities', function() {

    var runContext;

    before(function () {
        // Set up the spec file which should create all the necessary files for a server
        var spec = {
          appType: 'scaffold',
          appName: appName,
          bluemix: false,
          web: true,
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
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'import SwiftMetrics');
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'import SwiftMetricsDash');
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'try SwiftMetrics()');
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'try SwiftMetricsDash(swiftMetricsInstance');
      assert.noFileContent(`Sources/${applicationModule}/Application.swift`, 'import SwiftMetricsBluemix');
      assert.noFileContent(`Sources/${applicationModule}/Application.swift`, 'SwiftMetricsBluemix(swiftMetricsInstance');
    });
  });

  describe('Generated a web application with cloudant for bluemix', function() {

    var runContext;

    before(function() {
      var spec = {
        appType: 'scaffold',
        appName: appName,
        bluemix: true,
        web: true,
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
      assert.file(`Sources/${applicationModule}/Extensions/CouchDBExtension.swift`)
    });

    it('imports the correct modules in Application.swift', function() {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'import CouchDB');
    });

    it('initialises cloudant', function() {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'CouchDBClient?');
    });

    it('creates the boilerplate to connect to cloudant', function() {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'try manager.getCloudantService(name: "myCloudantService")');
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'CouchDBClient(service: cloudantService)');
    });

  });

  describe('Generated a web application with cloudant without bluemix', function() {

    var runContext;

    before(function() {
      var spec = {
        appType: 'scaffold',
        appName: appName,
        bluemix: false,
        web: true,
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
      assert.noFile(`Sources/${applicationModule}/Extensions/CouchDBExtension.swift`)
    });

    it('generates the CloudantConfig', function() {
      assert.file(`Sources/${applicationModule}/CloudantConfig.swift`)
    });

    it('imports the correct modules in Application.swift', function() {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'import CouchDB');
    });

    it('initialises cloudant', function() {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'CouchDBClient?');
    });

    it('creates the boilerplate to connect to cloudant', function() {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'CloudantConfig(');
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'ConnectionProperties(');
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'CouchDBClient(connectionProperties: couchDBConnProps)');
    });
  });

  describe('Generated a web application with redis for bluemix', function() {

    var runContext;

    before(function() {
      var spec = {
        appType: 'scaffold',
        appName: appName,
        bluemix: true,
        web: true,
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
      assert.file(`Sources/${applicationModule}/Extensions/RedisExtension.swift`)
    });

    it('imports the correct modules in Application.swift', function() {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'import SwiftRedis');
    });

    it('initialises redis', function() {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'Redis?');
    });

    it('creates the boilerplate to connect to redis', function() {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'manager.getRedisService(name: "myRedisService")');
    });

  });

  describe('Generated a web application with redis without bluemix', function() {

    var runContext;

    before(function() {
      var spec = {
        appType: 'scaffold',
        appName: appName,
        bluemix: false,
        web: true,
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
      assert.noFile(`Sources/${applicationModule}/Extensions/RedisExtension.swift`)
    });

    it('generates the RedisConfig', function() {
      assert.file(`Sources/${applicationModule}/RedisConfig.swift`)
    });

    it('imports the correct modules in Application.swift', function() {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'import SwiftRedis');
    });

    it('initialises redis', function() {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'RedisConfig');
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'Redis?');
    });

    it('creates the boilerplate to connect to redis', function() {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'Redis()');
    });

  });

  describe('Generated a web application with objectstorage for bluemix', function() {

    var runContext;

    before(function() {
      var spec = {
        appType: 'scaffold',
        appName: appName,
        bluemix: true,
        web: true,
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
      assert.file(`Sources/${applicationModule}/Extensions/ObjStorageExtension.swift`)
    });

    it('imports the correct modules in Application.swift', function() {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'import BluemixObjectStorage');
    });

    it('initialises object storage', function() {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'internal var objectStorage: ObjectStorage?');
    });

    it('creates the boilerplate to connect to object storage', function() {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'try manager.getObjectStorageService(name: "myObjectStorageService")');
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'ObjectStorage(service: objectStorageService)');
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'objectStorage?.connectSync(service: objectStorageService)');
    });
  });

  describe('Generated a web application for bluemix without services', function() {

    var runContext;

    before(function() {
      var spec = {
        appType: 'scaffold',
        appName: appName,
        bluemix: true,
        web: true,
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
        appType: 'scaffold',
        appName: appName,
        web: true,
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

  describe('Generate application with example endpoints and hosted Swagger for bluemix', function () {

    var runContext;

    before(function () {
        // Set up the spec file which should create all the necessary files for a server
        var spec = {
          appType: 'scaffold',
          appName: appName,
          hostSwagger: true,
          exampleEndpoints: true,
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
      assert.file('Sources/todo/main.swift');
    });

    if('generates Application.swift', function() {
      assert.file(`Sources/${applicationModule}/Application.swift`)
    });

    it('generates the bluemix files', function() {
      assert.file(expectedBluemixFiles);
    });

    it('defines example endpoints', function() {
      var productRoutesFile = `Sources/${applicationModule}/Routes/ProductRoutes.swift`;
      assert.file(productRoutesFile);
      assert.fileContent(productRoutesFile, '"/products"');
      assert.fileContent(productRoutesFile, '"/product/:id"');
      assert.fileContent(productRoutesFile, 'send(json: [:])');
      assert.fileContent(productRoutesFile, 'router.get(');
      assert.fileContent(productRoutesFile, 'router.post(');
      assert.fileContent(productRoutesFile, 'router.put(');
      assert.fileContent(productRoutesFile, 'router.delete(');
    });

    it('init example endpoint routes', function() {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'initializeProductRoutes()');
    });

    it('hosts swagger definition', function() {
      assert.file(`Sources/${applicationModule}/Routes/SwaggerRoute.swift`);
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'initializeSwaggerRoute(');
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'definitions');
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, appName + '.yaml');
    });

    it('defines OPENAPI_SPEC environment variable', function() {
      assert.fileContent('manifest.yml', 'OPENAPI_SPEC: "/swagger/api"');
    });

    it('does not generate NOTICES.txt', function() {
      assert.noFile('NOTICES.txt');
    });
  });

  describe('Generate application with example endpoints, hosted Swagger and SwaggerUI', function () {

    var runContext;

    before(function () {
        // Set up the spec file which should create all the necessary files for a server
        var spec = {
          appType: 'scaffold',
          appName: appName,
          web: true,
          hostSwagger: true,
          exampleEndpoints: true,
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

    it('generates SwaggerUI', function () {
      assert.file('public/explorer/index.html');
      assert.file('public/explorer/swagger-ui.js');
      assert.file('public/explorer/css/style.css');
    });

    it('generates NOTICES.txt', function() {
      assert.file('NOTICES.txt');
    });
  });

  describe('Generate application for bluemix with a service whose name contains spaces', function () {

    var runContext;

    before(function () {
        // Set up the spec file which should create all the necessary files for a server
        var spec = {
          appType: 'scaffold',
          appName: appName,
          bluemix: true,
          web: true,
          services: {
            cloudant: [{ name: 'name with spaces' }]
          },
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

    it('pipeline.yml quotes service name', function () {
      assert.fileContent('.bluemix/pipeline.yml', '"name with spaces"');
    });
  });

  describe('Generated a web application with appid for bluemix', function() {

    var runContext;

    before(function() {
      var spec = {
        appType: 'scaffold',
        appName: appName,
        bluemix: true,
        web: true,
        config: {
          logger: 'helium',
          port: 8090
        },
        services: {
          appid: [{
            name: "myAppIDService"
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
      assert.file(`Sources/${applicationModule}/Extensions/AppIDExtension.swift`)
    });

    it('imports the correct modules in Application.swift', function() {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'import Credentials');
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'import BluemixAppID');
    });

    it('initialises AppID credentials and credentialsplugin', function() {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'internal var kituraCredentials: Credentials?');
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'internal var webappKituraCredentialsPlugin: WebAppKituraCredentialsPlugin?');
    });

    it('creates the boilerplate to connect to appid', function() {

      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'manager.getAppIDService(name: "myAppIDService")');
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'WebAppKituraCredentialsPlugin(');
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'kituraCredentials = Credentials()');
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'kituraCredentials?.register(plugin: ');

    });
  });

});
