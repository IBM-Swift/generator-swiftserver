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

/**
 * Tests here do not stub out the subgenerators, so for the app generator
 * the real build and refresh subgenerators get called.
 */
'use strict';
var path = require('path');
var assert = require('yeoman-assert');
var helpers = require('yeoman-test');
var rimraf = require('rimraf');

// Files which we assert are created each time the app generator is run.
var expected = [
  'Package.swift',
  '.swiftservergenerator-project'
];

describe('swiftserver:app integration test', function () {

  describe('Application name and directory name are the same', function () {

    // Swift build is slow so we need to set a longer timeout for the test
    this.timeout(150000);

    before(function () {
      // Mock the options, set up an output folder and run the generator
      return helpers.run(path.join( __dirname, '../../app'))
        .withPrompts({                       // Mock the prompt answers
          name: 'notes',
          dir:  'notes'
        })
        .toPromise();                        // Get a Promise back when the generator finishes
    });



    it('created and changed into a folder according to dir value', function () {
      assert.equal(path.basename(process.cwd()), 'notes');
    });

    it('generates the expected application files', function () {
      assert.file(expected);
    });

    it('has the appname in the Package.swift file', function () {
      assert.fileContent('Package.swift', 'name: "notes"');
    });

    it('compiles the application', function () {
      assert.file(process.cwd()+'/.build/debug/notes');
    });
  });
});
