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
var rimraf = require('rimraf');

// Subgenerators to be stubbed
var dependentGenerators = [
  [helpers.createDummyGenerator(), 'swiftserver:refresh'],
  [helpers.createDummyGenerator(), 'swiftserver:build']
];

describe('swiftserver:property', function() {
var testingDir;
  describe('Basic property test. ' +
            'Check if properties are added to a model', function() {

    before(function() {
      // Mock the options, set up an output folder and run the generator
      return helpers.run(path.join( __dirname, '../../property'))
        .withGenerators(dependentGenerators) // Stub subgenerators
        // .withOptions({ testmode:  true })    // Workaround to stub subgenerators
        .inTmpDir(function (tmpDir) {
          //Get the temporary directory so that we can delete later on.
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

          fs.mkdirSync("models");
          var model = {
            name: "MyModel",
            plural: "MyModels",
            classame: "MyModel",
            properties: {
              id: {
                type: "string",
                id: "true"
              }
            }
          }
          var tmpModel = path.join(tmpDir+"/models", "MyModel.json");           //Create a mock model in order to
          fs.writeFileSync(tmpModel, JSON.stringify(model));                    //test adding a property to the model.
        })
        .withPrompts({                       // Mock the prompt answers
          model: 'MyModel',
          name: 'foo',
          type: 'boolean'
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

    it('added a property to a model', function() {
      var expectedProperties = {  //Create the json for the expected properties
        foo: {                    //Without the id property
          type: "boolean"
        }
      }
      assert.jsonFileContent("models/MyModel.json", {properties: expectedProperties});
    });
  });
});
