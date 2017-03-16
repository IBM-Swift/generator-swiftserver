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

describe('Prompt and build integration tests', function () {

  describe('Basic application', function () {
    // Swift build is slow so we need to set a longer timeout for the test
    this.timeout(300000);
    var runContext;

    before(function () {
      runContext = helpers.run(path.join( __dirname, '../../app'))
                          .withPrompts({
                            appType: 'Scaffold a starter',
                            name: 'notes',
                            dir:  'notes',
                            capabilities: []
                          });
      return runContext.toPromise();
    });

    it('compiles the application', function () {
      assert.file('.build/debug/notes');
    });
  });

  describe('Web application @full', function () {
    // Swift build is slow so we need to set a longer timeout for the test
    this.timeout(300000);
    var runContext;

    before(function () {
      runContext = helpers.run(path.join( __dirname, '../../app'))
                          .withPrompts({
                            appType: 'Scaffold a starter',
                            name: 'notes',
                            dir:  'notes',
                            capabilities: ['Static web file serving'],
                          });
      return runContext.toPromise();
    });

    it('compiles the application', function () {
      assert.file('.build/debug/notes');
    });
  });

  describe('CRUD application @full', function () {
    // Swift build is slow so we need to set a longer timeout for the test
    this.timeout(300000);
    var runContext;

    before(function () {
      runContext = helpers.run(path.join( __dirname, '../../app'))
                          .withPrompts({
                            appType: 'Generate a CRUD application',
                            name: 'notes',
                            dir:  'notes'
                          });
        return runContext.toPromise();
    });

    it('compiles the application', function () {
      assert.file(process.cwd()+'/.build/debug/notes');
    });
  });

});