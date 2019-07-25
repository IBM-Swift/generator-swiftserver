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
'use strict'
var assert = require('yeoman-assert')
var helpers = require('yeoman-test')
var path = require('path')
var fs = require('fs')
var nock = require('nock')

var modelGeneratorPath = path.join(__dirname, '../../../model')
var commonTest = require('../../lib/common_test')

var yorcJSON = JSON.stringify({
  'generator-swiftserver': { version: commonTest.generatorVersion }
})

describe('Prompt and no build integration tests for model generator', function () {
  describe('Prompt model when not in a generator', function () {
    var runContext
    var error

    before(function () {
      runContext = helpers.run(modelGeneratorPath)
      return runContext.toPromise().catch(function (err) {
        error = err.message
      })
    })

    it('aborts generator with an error', function () {
      assert(error, 'Should throw an error')
      assert(error.match('This is not a Swift Server Generator project directory.*$'), 'Specified directory is not a project and should have thrown an error')
    })
  })

  describe('Prompt for model when not a CRUD app type', function () {
    var runContext
    var error

    before(function () {
      runContext = helpers.run(modelGeneratorPath)
                          .inTmpDir(function (tmpDir) {
                            var tmpFile = path.join(tmpDir, '.swiftservergenerator-project')
                            fs.writeFileSync(tmpFile, '')
                            var tmpYorc = path.join(tmpDir, '.yo-rc.json')
                            fs.writeFileSync(tmpYorc, yorcJSON)
                            var spec = {
                              appName: 'test',
                              appType: 'scaffold'
                            }
                            var pathToConfig = path.join(tmpDir, 'spec.json')
                            fs.writeFileSync(pathToConfig, JSON.stringify(spec))
                          })
      return runContext.toPromise().catch(function (err) {
        error = err.message
      })
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    it('aborts generator with an error', function () {
      assert(error, 'Should throw an error')
      var expectedError = 'The \\S+?:model generator is not compatible with non-CRUD application types'
      assert(error.match(expectedError), `Error was: "${error}", it should be: "${expectedError}"`)
    })
  })

  describe('Create a new model, creating a new model json file and update the spec.json', function () {
    var runContext

    before(function () {
      runContext = helpers.run(modelGeneratorPath)
                          .inTmpDir(function (tmpDir) {
                            var tmpFile = path.join(tmpDir, '.swiftservergenerator-project')
                            fs.writeFileSync(tmpFile, '')
                            var tmpYorc = path.join(tmpDir, '.yo-rc.json')
                            fs.writeFileSync(tmpYorc, yorcJSON)
                            var spec = {
                              appName: 'test',
                              appType: 'crud',
                              config: {}
                            }
                            var pathToConfig = path.join(tmpDir, 'spec.json')
                            fs.writeFileSync(pathToConfig, JSON.stringify(spec))
                          })
                          .withOptions({ 'skip-build': true })
                          .withPrompts({
                            name: 'MyModel',
                            plural: 'MyModels'
                          })
      return runContext.toPromise()
    })

    after(function () {
      nock.cleanAll()
      runContext.cleanTestDirectory()
    })

    it('creates a model', function () {
      assert.file('models/MyModel.json')
    })

    it('Creates the correct model file with the correct information', function () {
      const expected = {
        name: 'MyModel',
        plural: 'MyModels',
        classname: 'MyModel',
        properties: {
          'id': {
            'type': 'string',
            'id': true
          }
        }
      }
      assert.jsonFileContent(path.join(process.cwd(), 'models', 'MyModel.json'), expected)
    })

    it('updates the spec.json with the model', function () {
      var expected = {
        models: [{
          name: 'MyModel',
          plural: 'MyModels',
          classname: 'MyModel',
          properties: {
            'id': {
              'type': 'string',
              'id': true
            }
          }
        }]
      }
      assert.jsonFileContent('spec.json', expected)
    })
  })
})
