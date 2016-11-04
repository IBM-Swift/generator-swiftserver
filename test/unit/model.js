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
var rimraf = require('rimraf');
var fs = require('fs');

// Subgenerators to be stubbed
var dependentGenerators = [
  [helpers.createDummyGenerator(), 'swiftserver:property']
];

// Files which we assert are created each time the model generator is run.
var expected = [
  'models/MyModel.json',
  'Sources/Generated/MyModel.swift'
];

var modelJsonPath = 'models/MyModel.json'

describe('swiftserver:model', function () {
var testingDir;
  describe('Basic model test. '+
           'Check the generated folders and the files are made', function () {

    before(function () {
        // Mock the options, set up an output folder and run the generator
        return helpers.run(path.join( __dirname, '../../model'))
          .withGenerators(dependentGenerators) // Stub subgenerators
          .inTmpDir(function (tmpDir) {
            testingDir = tmpDir;
            var tmpFile = path.join(tmpDir, ".swiftservergenerator-project");    //Created to make the dir a kitura project
            fs.writeFileSync(tmpFile, "");
            var config = {
              appName: "modelTestDir",
              store: "cloudant",
              logger: "helium",
              port: 8090
            }
            var tmpConfig = path.join(tmpDir, "config.json");           //Created so there is an appName for the models
            fs.writeFileSync(tmpConfig, JSON.stringify(config));
            var tmp_yorc = path.join(tmpDir, ".yo-rc.json");             //Created so we can test in a different directory
            fs.writeFileSync(tmp_yorc, "{}");
          })
          .withPrompts({                       // Mock the prompt answers
            name: 'MyModel',
            plural: 'MyModels'
          })
          .toPromise();                        // Get a Promise back when the generator finishes
    });

    after(function() {
      //rm -rf the temporary directory that we made
      rimraf(testingDir, function(err) {
        if(err) {
          console.log('Error: ', err);
        }
      });
    });

    it('generates the expected application files', function () {
      assert.file(expected);
    });

    it('has the model name in the generated json file', function() {
      assert.jsonFileContent(modelJsonPath, {name: "MyModel"})
    });

    it('has the model plural name in the generated json file', function() {
      assert.jsonFileContent(modelJsonPath, {plural: "MyModels"})
    });

    it('has the class name in the generated json file', function() {
      assert.jsonFileContent(modelJsonPath, {classname: "MyModel"})
    });
  });
});
