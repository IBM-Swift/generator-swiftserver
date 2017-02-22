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
                     'manifest.yml', '.cfignore', '.yo-rc.json'];

var appName = 'todo';
var modelName = 'todo';
var modelPlural = 'todos';
var className = 'Todo';
var genDir = 'Sources/Generated/'
var modelDir = 'models/'

var expectedSourceFiles = [`Sources/${appName}/main.swift`];

var expectedModelFiles = [`${modelDir}${modelName}.json`, `${genDir}${className}.swift`,
    `${genDir}${className}Adapter.swift`, `${genDir}${className}Resource.swift`,
    `${genDir}${className}MemoryAdapter.swift`];

describe('swiftserver:refresh', function () {
  describe('Basic refresh generator test. ' +
           'Check the Swagger file exists and ' +
           'is written out correctly.', function () {

    var dirName;
    // var appName = 'testApp';
    var expected = [
      `definitions/${appName}.yaml`
    ];

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
        return helpers.run(path.join( __dirname, '../../refresh'))
          .withOptions({ specObj: spec })
          .toPromise();                        // Get a Promise back when the generator finishes
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

    before(function () {
      var spec = {
        appType: 'crud',
        appName: appName,
        config: {
          store: 'memory',
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
        return helpers.run(path.join( __dirname, '../../refresh'))
          .withOptions({ apic: true , specObj: spec })
          .toPromise();                        // Get a Promise back when the generator finishes
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
        return helpers.run(path.join( __dirname, '../../refresh'))
          .withOptions({
            specObj: spec
          })
          .toPromise();                        // Get a Promise back when the generator finishes
    });

    it('generates the expected files in the root of the project', function () {
      assert.file(expectedFiles);
    });

    it('generates the swift files', function() {
      assert.file(expectedSourceFiles);
    });
  });

  describe('Generate a CRUD application from a spec', function () {

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
        return helpers.run(path.join( __dirname, '../../refresh'))
          .withOptions({
            specObj: spec
          })
          .toPromise();                        // Get a Promise back when the generator finishes
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
  });

  describe('Generate web application for bluemix', function () {

    var runContext;
    before(function () {
        // Set up the spec file which should create all the necessary files for a server
        var spec = {
          appType: 'web',
          appName: appName,
          bluemix: true,
          services: {
            cloudant: [{
              name: "todoCloudantService",
              type: "cloudantNoSQLDB"
            }]
          },
          config: {
            logger: 'helium',
            port: 8090
          }
        };
        return helpers.run(path.join( __dirname, '../../refresh'))
          .withOptions({
            specObj: spec
          })
          .toPromise();                        // Get a Promise back when the generator finishes
    });

    it('generates the expected files in the root of the project', function () {
      assert.file(expectedFiles);
    });

    it('generates the generic swift source files', function() {
      assert.file('Sources/todoServer/main.swift');
    });

    it('generates bluemix web only files and folders', function() {
      var expectedExtensionFiles = [`Sources/${appName}/Extensions/CouchDBExtension.swift`,
                                    `Sources/${appName}/Application.swift`,
                                    `public/.keep`];
      assert.file(expectedExtensionFiles);
    });
  });

  describe('Generate web without bluemix', function () {

    var runContext;
    before(function () {
        // Set up the spec file which should create all the necessary files for a server
        var spec = {
          appType: 'web',
          appName: appName,
          bluemix: false,
          services: {
            cloudant: [{
              name: "todoCloudantService"
            }]
          },
          config: {
            logger: 'helium',
            port: 8090
          }
        };
        return helpers.run(path.join( __dirname, '../../refresh'))
          .withOptions({
            specObj: spec
          })
          .toPromise();                        // Get a Promise back when the generator finishes
    });

    it('generates the expected files in the root of the project', function () {
      var files = ['.swiftservergenerator-project', 'Package.swift', 'config.json',
                           '.cfignore', '.yo-rc.json'];
      assert.file(files);
    });

    it('generates the generic swift source files', function() {
      assert.file('Sources/todoServer/main.swift');
    });

    it('generates web only file and folders', function() {
      var expectedExtensionFiles = [`Sources/${appName}/Application.swift`,
                                    `public/.keep`];
      assert.file(expectedExtensionFiles);
    });
  });

  describe('Generate basic application for bluemix', function () {

    var runContext;
    before(function () {
        // Set up the spec file which should create all the necessary files for a server
        var spec = {
          appType: 'basic',
          appName: appName,
          bluemix: true,
          services: {
            cloudant: [{
              name: "todoCloudantService"
            }]
          },
          config: {
            logger: 'helium',
            port: 8090
          }
        };
        return helpers.run(path.join( __dirname, '../../refresh'))
          .withOptions({
            specObj: spec
          })
          .toPromise();                        // Get a Promise back when the generator finishes
    });

    it('generates the expected files in the root of the project', function () {
      assert.file(expectedFiles);
    });

    it('generates the generic swift source files', function() {
      assert.file('Sources/todoServer/main.swift');
    });

    it('generates bluemix web only files and folders', function() {
      var expectedExtensionFiles = [`Sources/${appName}/Extensions/CouchDBExtension.swift`,
                                    `Sources/${appName}/Application.swift`];
      assert.file(expectedExtensionFiles);
    });
  });

  describe('Generate basic without bluemix', function () {

    var runContext;
    before(function () {
        // Set up the spec file which should create all the necessary files for a server
        var spec = {
          appType: 'basic',
          appName: appName,
          bluemix: false,
          services: {
            cloudant: [{
              name: "todoCloudantService"
            }]
          },
          config: {
            logger: 'helium',
            port: 8090
          }
        };
        return helpers.run(path.join( __dirname, '../../refresh'))
          .withOptions({
            specObj: spec
          })
          .toPromise();                        // Get a Promise back when the generator finishes
    });

    it('generates the expected files in the root of the project', function () {
      var files = ['.swiftservergenerator-project', 'Package.swift', 'config.json',
                           '.cfignore', '.yo-rc.json'];
      assert.file(files);
    });

    it('generates the generic swift source files', function() {
      assert.file('Sources/todoServer/main.swift');
    });

    it('generates web only file and folders', function() {
      var expectedExtensionFiles = [`Sources/${appName}/Application.swift`];
      assert.file(expectedExtensionFiles);
    });
  });
});
