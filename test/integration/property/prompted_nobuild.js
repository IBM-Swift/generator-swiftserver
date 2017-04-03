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

var propertyGeneratorPath = path.join(__dirname, '../../../property');

describe('Prompt and no build integration tests for property generator', function() {

  describe('Prompt property when not in a project', function() {
    var runContext;
    var error;

    before(function(){
      runContext = helpers.run(propertyGeneratorPath)
      return runContext.toPromise().catch(function(err){
        error = err.message;
      });
    });

    it('aborts generator with an error', function() {
      assert(error, 'Should throw an error');
      assert(error.match('This is not a Swift Server Generator project directory.*$'), 'Specified directory is not a project and should have thrown an error')
    });
  });

  describe('Prompt property when not in a CRUD project', function() {
    var runContext;
    var error;

    before(function(){
      runContext = helpers.run(propertyGeneratorPath)
                          .inTmpDir(function(tmpDir) {
                            var tmpFile = path.join(tmpDir, ".swiftservergenerator-project");
                            fs.writeFileSync(tmpFile, "");
                            var tmp_yorc = path.join(tmpDir, ".yo-rc.json");
                            fs.writeFileSync(tmp_yorc, "{}");
                            var spec = {
                              appType: 'scaffold'
                            };
                            fs.writeFileSync('spec.json', JSON.stringify(spec));
                          })
      return runContext.toPromise().catch(function(err){
        error = err.message;
      });
    });

    it('aborts generator with an error', function() {
      assert(error, 'Should throw an error');
      assert(error.match('The swiftserver:property generator is not compatible with non-CRUD application types'), 'Should throw an error about not being correct app type');
    });
  });

  describe('Prompt property when there are no models', function() {
    var runContext;
    var error;

    before(function(){
      runContext = helpers.run(propertyGeneratorPath)
                          .inTmpDir(function(tmpDir) {
                            var tmpFile = path.join(tmpDir, ".swiftservergenerator-project");
                            fs.writeFileSync(tmpFile, "");
                            var tmp_yorc = path.join(tmpDir, ".yo-rc.json");
                            fs.writeFileSync(tmp_yorc, "{}");
                            var spec = {
                              appType: 'crud'
                            };
                            fs.writeFileSync('spec.json', JSON.stringify(spec));
                          })
      return runContext.toPromise().catch(function(err){
        error = err.message;
      });
    });

    it('aborts generator with an error', function() {
      assert(error, 'Should throw an error');
      assert.strictEqual(error, 'There are no models to update (no models directory).')
    });
  });

});
