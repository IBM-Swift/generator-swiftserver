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
});
