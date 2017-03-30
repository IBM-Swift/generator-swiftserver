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
var fs = require('fs');

var modelGeneratorPath = path.join(__dirname, '../../../model');

var dependentGenerators = [
  [helpers.createDummyGenerator(), 'swiftserver:property']
];

describe('Prompt and no build integration tests for model generator', function() {

  describe('Prompt model when not in a generator', function() {
    var runContext;
    var error;

    before(function(){
      runContext = helpers.run(modelGeneratorPath)
      return runContext.toPromise().catch(function(err){
        error = err.message;
      });
    });

    it('aborts generator with an error', function() {
      assert(error, 'Should throw an error');
      assert(error.match('This is not a Swift Server Generator project directory.*$'), 'Specified directory is not a project and should have thrown an error')
    });
  });

  describe('Prompt for model when not a CRUD app type', function() {

    var runContext;
    var error;

    before(function() {
      runContext = helpers.run(modelGeneratorPath)
                          .inTmpDir(function(tmpDir) {
                            var tmpFile = path.join(tmpDir, ".swiftservergenerator-project");
                            fs.writeFileSync(tmpFile, "");
                            var tmp_yorc = path.join(tmpDir, ".yo-rc.json");
                            fs.writeFileSync(tmp_yorc, "{}");
                            var spec = {
                              appName: 'test',
                              appType: 'crud'
                            };
                            var pathToConfig = path.join(tmpDir, 'spec.json');
                            fs.writeFileSync(pathToConfig, JSON.stringify(spec));
                          });
      return runContext.toPromise().catch(function(err) {
        error = err.message;
      });
    });

    after(function() {
      runContext.cleanTestDirectory();
    });

    it('aborts generator with an error', function(){
      assert(error, 'Should throw an error');
      assert(error, 'App type not compatible with model generator!', 'Specified directory is not a crud app type and should have thrown an error');
    });
  });

  describe('Prompt model', function() {
    var runContext;
    var error;

    before(function(){
      runContext = helpers.run(modelGeneratorPath)
                          .inTmpDir(function(tmpDir) {
                            var tmpFile = path.join(tmpDir, ".swiftservergenerator-project");
                            fs.writeFileSync(tmpFile, "");
                            var tmp_yorc = path.join(tmpDir, ".yo-rc.json");
                            fs.writeFileSync(tmp_yorc, "{}");
                            var spec = {
                              appName: 'test',
                              appType: 'crud',
                              config: {}
                            };
                            var pathToConfig = path.join(tmpDir, 'spec.json');
                            fs.writeFileSync(pathToConfig, JSON.stringify(spec));
                          })
                          .withOptions({ 'skip-build': true })
                          .withPrompts({
                            name: "MyModel",
                            plural: "MyModels"
                          });
      return runContext.toPromise();
    });

    after(function() {
      runContext.cleanTestDirectory();
    });

    it('creates a model', function() {
      assert.file('models/MyModel.json');
    });
  });

});
