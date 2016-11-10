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

var expected = [
  'definitions/refreshProjectName.yaml'
];


describe('swiftserver:refresh', function () {
var dirName;
var expected = [];

  describe('Basic refresh generator test. ' +
           'Check the product.yaml file exists and ' +
           'is written out correctly.', function () {

    before(function () {
        // Mock the options, set up an output folder and run the generator
        return helpers.run(path.join( __dirname, '../../refresh'))
          .inTmpDir(function (tmpDir) {
            dirName = tmpDir.split('/').pop()
            expected = ['definitions/'+dirName+'.yaml'];
            var tmpFile = path.join(tmpDir, ".swiftservergenerator-project");    //Created to make the dir a kitura project
            fs.writeFileSync(tmpFile, "");
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

    it('generates the expected yaml files', function () {
      assert.file(expected);
    });

    // This is only a starter set of checks, we need to add further check in.
    it('the project yaml file contains the expected content', function() {
      assert.fileContent([
        [expected[0], 'title: ' + dirName],
        [expected[0], 'test:']
      ]);
    });
  });
});
