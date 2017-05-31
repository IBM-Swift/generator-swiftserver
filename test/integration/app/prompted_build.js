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

var appGeneratorPath = path.join(__dirname, '../../../app');
var testResourcesPath = path.join(__dirname, '../../../test/resources');

describe('Prompt and build integration tests for app generator', function () {

  describe('Basic application', function () {
    // Swift build is slow so we need to set a longer timeout for the test
    this.timeout(300000);
    var runContext;

    before(function () {
      runContext = helpers.run(appGeneratorPath)
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
    it('generates an .xcodeproj file', function () {
      assert.file('notes.xcodeproj');
    });
  });

  describe('Web application @full', function () {
    // Swift build is slow so we need to set a longer timeout for the test
    this.timeout(300000);
    var runContext;

    before(function () {
      runContext = helpers.run(appGeneratorPath)
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
      runContext = helpers.run(appGeneratorPath)
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
    it('generates an .xcodeproj file', function () {
      assert.file('notes.xcodeproj');
    });
  });

  describe('Starter with generated SDK integration', function () {
    var runContext;

    before(function () {
      // Swift build is slow so we need to set a longer timeout for the test
      this.timeout(300000);
      runContext = helpers.run(appGeneratorPath)
                          .withPrompts({
                            appType: 'Scaffold a starter',
                            name: 'notes',
                            dir: 'notes',
                            appPattern: 'Basic',
                            iosSwaggerInput: true,
                            iosSwaggerInputPath: testResourcesPath + '/petstore.yaml',
                            serverSwaggerInput0: true,
                            serverSwaggerInputPath0: testResourcesPath + '/petstore.yaml',
                            serverSwaggerInput1: true,
                            serverSwaggerInputPath1: testResourcesPath + '/petstore2.yaml',
                            serverSwaggerInput2: false
                          });
      return runContext.toPromise();                        // Get a Promise back when the generator finishes
    });

    it('created a iOS SDK zip file', function() {
      assert.file('notes_iOS_SDK.zip');
    });

    it('deleted a server SDK zip file', function() {
      assert.noFile('Swagger_Petstore_ServerSDK.zip');
    });

    it('unzipped server SDK folder was deleted', function() {
      assert.noFile('Swagger_Petstore_ServerSDK/README.md');
    });

    it('created Pet model from swagger file', function() {
      assert.file('Sources/Swagger_Petstore_ServerSDK/Pet.swift');
    });

    it('modified Package.swift to include server SDK module', function() {
      assert.fileContent('Package.swift', 'Swagger_Petstore_ServerSDK');
    });

    it('deleted the second server SDK zip file', function() {
      assert.noFile('Swagger_Petstore_Two_ServerSDK.zip');
    });

    it('unzipped the second server SDK folder was deleted', function() {
      assert.noFile('Swagger_Petstore_Two_ServerSDK/README.md');
    });

    it('created Pet model from the second swagger file', function() {
      assert.file('Sources/Swagger_Petstore_Two_ServerSDK/Pet.swift');
    });

    it('modified Package.swift to include the second server SDK module', function() {
      assert.fileContent('Package.swift', 'Swagger_Petstore_Two_ServerSDK');
    });

  });

});
