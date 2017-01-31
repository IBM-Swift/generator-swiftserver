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
    var appName = 'testApp';
    var expected = [
      'definitions/%s.yaml'
    ];

    before(function () {
        // Mock the options, set up an output folder and run the generator
        return helpers.run(path.join( __dirname, '../../refresh'))
          .inTmpDir(function (tmpDir) {
            dirName = path.basename(tmpDir);
            expected = expected.map((path) => format(path, appName));
            var tmpFile = path.join(tmpDir, ".swiftservergenerator-project");    //Created to make the dir a kitura project
            fs.writeFileSync(tmpFile, "");
            var config = {
              appName: appName
            };
            var configFile = path.join(tmpDir, "config.json");
            fs.writeFileSync(configFile, JSON.stringify(config));
            fs.mkdirSync(path.join(tmpDir, "models"));
            var testModel = {
              name: "test",
              plural: "tests",
              classname: "Test",
              properties: {
                id: { type: "number", id: true }
              }
            };
            fs.writeFileSync(path.join(tmpDir, "models", "test.json"), JSON.stringify(testModel));
          })
          .toPromise();                        // Get a Promise back when the generator finishes
    });

    it('generates the expected files', function () {
      assert.file(expected);
    });

    // This is only a starter set of checks, we need to add further check in.
    it('the swagger file contains the expected content', function() {
      assert.fileContent([
        [expected[0], 'title: ' + appName],
        [expected[0], 'test:']
      ]);
    });
  });

  describe('Basic refresh generator test with apic option. ' +
           'Check the yaml files exist and ' +
           'are written out correctly.', function () {

    var dirName;
    var appName = 'testApp';
    var expected = [
      'definitions/%s-product.yaml',
      'definitions/%s.yaml'
    ];

    before(function () {
        // Mock the options, set up an output folder and run the generator
        return helpers.run(path.join( __dirname, '../../refresh'))
          .inTmpDir(function (tmpDir) {
            dirName = path.basename(tmpDir);
            expected = expected.map((path) => format(path, appName));
            var tmpFile = path.join(tmpDir, ".swiftservergenerator-project");    //Created to make the dir a kitura project
            fs.writeFileSync(tmpFile, "");
            var config = {
              appName: appName
            };
            var configFile = path.join(tmpDir, "config.json");
            fs.writeFileSync(configFile, JSON.stringify(config));
            fs.mkdirSync(path.join(tmpDir, "models"));
            var testModel = {
              name: "test",
              plural: "tests",
              classname: "Test",
              properties: {
                id: { type: "number", id: true }
              }
            };
            fs.writeFileSync(path.join(tmpDir, "models", "test.json"), JSON.stringify(testModel));
          })
          .withOptions({ apic: true })
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
        [expected[1], 'title: ' + appName]
      ]);
    });
  });

  describe('Generate the config file from the spec', function () {

    before(function () {
        // Mock the options, set up an output folder and run the generator
        var spec = {
          config: {
            appName: appName,
            store: 'memory',
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

  describe('Generate a swiftserver with models from a spec', function () {


    var runContext;
    before(function () {
        // Set up the spec file which should create all the necessary files for a server
        var spec = {
          config: {
            appName: appName,
            store: 'memory',
            logger: 'helium',
            port: 8090
          },
          models: [{
                    name: modelName,
                    plural: modelPlural,
                    classname: className,
                    properties: {
                      title: {
                        type: "string"
                      }
                    }
                  }]
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

  describe('Generate basic/web for bluemix with models', function () {

    var runContext;
    before(function () {
        // Set up the spec file which should create all the necessary files for a server
        var spec = {
          appType: 'web',
          bluemixconfig: {
            bluemix: true,
            datastores: ['cloudant', 'redis']
          },
          config: {
            appName: appName,
            store: 'memory',
            logger: 'helium',
            port: 8090
          },
          models: [{
                    name: modelName,
                    plural: modelPlural,
                    classname: className,
                    properties: {
                      title: {
                        type: "string"
                      }
                    }
                  }]
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
      var expectedWebModelFiles = [`Sources/${appName}/models/${modelName}.swift`]
      assert.file(expectedWebModelFiles);
    });

    it('generates the extensions and the controller', function() {
      var expectedExtensionFiles = [`Sources/${appName}/Extensions/CouchDBExtension.swift`,
                                    `Sources/${appName}/Extensions/RedisExtension.swift`,
                                    `Sources/${appName}/Controller.swift`];
      assert.file(expectedExtensionFiles);
    });
  });

  describe('Generate basic/web without bluemix and with models', function () {

    var runContext;
    before(function () {
        // Set up the spec file which should create all the necessary files for a server
        var spec = {
          appType: 'web',
          config: {
            appName: appName,
            store: 'memory',
            logger: 'helium',
            port: 8090
          },
          models: [{
                    name: modelName,
                    plural: modelPlural,
                    classname: className,
                    properties: {
                      title: {
                        type: "string"
                      }
                    }
                  }]
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
      var expectedWebModelFiles = [`Sources/${appName}/models/${modelName}.swift`]
      assert.file(expectedWebModelFiles);
    });

    it('generates the extensions and the controller', function() {
      var expectedExtensionFiles = [`Sources/${appName}/Controller.swift`];
      assert.file(expectedExtensionFiles);
    });
  });


});
