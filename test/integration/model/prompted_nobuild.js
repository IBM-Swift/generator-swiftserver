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

describe('Prompt and no build integration tests for model generator', function() {

  describe('Prompt model when not in a generator', function() {
    var runContext;
    var error;

    before(function(){
      runContext = helpers.run(modelGeneratorPath)
                          .withPrompts({
                            name: 'MyModel',
                            plural: 'MyModels'
                          })
      return runContext.toPromise().catch(function(err){
        error = err;
      });
    });

    it('aborts generator with an error', function() {
      assert(error, 'Should throw an error');
    });
  });

  describe('Prompt for model when not a CRUD app type', function() {

    var runContext;
    var error = null;

    before(function() {
      runContext = helpers.run(modelGeneratorPath)
                          .inTmpDir(function(tmpDir) {
                            var tmpFile = path.join(tmpDir, ".swiftservergenerator-project");
                            fs.writeFileSync(tmpFile, "");
                            var tmp_yorc = path.join(tmpDir, ".yo-rc.json");
                            fs.writeFileSync(tmp_yorc, "{}");
                            var spec = {
                              appType: 'scaffold'
                            };
                            var pathToSpec = path.join(tmpDir, 'spec.json');
                            fs.writeFileSync(pathToSpec, JSON.stringify(spec));
                          })
                          .withPrompts({                       // Mock the prompt answers
                            name: 'MyModel',
                            plural: 'MyModels'
                          });
      return runContext.toPromise().catch(function(err) {
        error = err;
      });
    });

    after(function() {
      runContext.cleanTestDirectory();
    });

    it('aborts generator with an error', function(){
      assert(error, 'Should throw an error');
      assert.strictEqual(error.message, 'App type not compatible with model generator!');
    });

  });

});
