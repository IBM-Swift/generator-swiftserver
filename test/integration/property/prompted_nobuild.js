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
var path = require('path')
var assert = require('yeoman-assert')
var helpers = require('yeoman-test')
var fs = require('fs')

// Require config to alter sdkgen delay between
// status checks to speed up unit tests
// var config = require('../../config')
// var sdkGenCheckDelaySaved

var propertyGeneratorPath = path.join(__dirname, '../../../property')

describe('Prompt and no build integration tests for property generator', function () {
  describe('Prompt property when not in a project', function () {
    var runContext
    var error

    before(function () {
      runContext = helpers.run(propertyGeneratorPath)
      return runContext.toPromise().catch(function (err) {
        error = err.message
      })
    })

    it('aborts generator with an error', function () {
      assert(error, 'Should throw an error')
      assert(error.match('This is not a Swift Server Generator project directory.*$'), 'Specified directory is not a project and should have thrown an error')
    })
  })

  describe('Prompt property when not in a CRUD project', function () {
    var runContext
    var error

    before(function () {
      runContext = helpers.run(propertyGeneratorPath)
                          .inTmpDir(function (tmpDir) {
                            var tmpFile = path.join(tmpDir, '.swiftservergenerator-project')
                            fs.writeFileSync(tmpFile, '')
                            var tmpYorc = path.join(tmpDir, '.yo-rc.json')
                            fs.writeFileSync(tmpYorc, '{}')
                            var spec = {
                              appType: 'scaffold'
                            }
                            fs.writeFileSync('spec.json', JSON.stringify(spec))
                          })
      return runContext.toPromise().catch(function (err) {
        error = err.message
      })
    })

    it('aborts generator with an error', function () {
      assert(error, 'Should throw an error')
      var expectedError = 'The \\S+?:property generator is not compatible with non-CRUD application types'
      assert(error.match(expectedError), `Error was: "${error}", it should be: "${expectedError}"`)
    })
  })

  describe('Prompt property when there are no models', function () {
    var runContext
    var error

    before(function () {
      runContext = helpers.run(propertyGeneratorPath)
                          .inTmpDir(function (tmpDir) {
                            var tmpFile = path.join(tmpDir, '.swiftservergenerator-project')
                            fs.writeFileSync(tmpFile, '')
                            var tmpYorc = path.join(tmpDir, '.yo-rc.json')
                            fs.writeFileSync(tmpYorc, '{}')
                            var spec = {
                              appType: 'crud'
                            }
                            fs.writeFileSync('spec.json', JSON.stringify(spec))
                          })
      return runContext.toPromise().catch(function (err) {
        error = err.message
      })
    })

    it('aborts generator with an error', function () {
      assert(error, 'Should throw an error')
      assert.strictEqual(error, 'There are no models to update (no models directory).')
    })
  })

  describe('Prompt to add properties to a model gets added to the correct model' +
           ' and updates the spec.json', function () {
    var runContext

    before(function () {
      // alter delay between status checks to speed up unit tests
      // sdkGenCheckDelaySaved = config.sdkGenCheckDelay
      // config.sdkGenCheckDelay = 1

      runContext = helpers.run(propertyGeneratorPath)
                          .inTmpDir(function (tmpDir) {
                            var tmpFile = path.join(tmpDir, '.swiftservergenerator-project')
                            fs.writeFileSync(tmpFile, '')
                            var tmpYorc = path.join(tmpDir, '.yo-rc.json')
                            fs.writeFileSync(tmpYorc, '{}')
                            var spec = {
                              appType: 'crud',
                              appName: 'test',
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
                              }],
                              config: {}
                            }
                            fs.writeFileSync(path.join(tmpDir, 'spec.json'), JSON.stringify(spec))
                            var model =
                              {
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
                            fs.mkdirSync(path.join(tmpDir, 'models'))
                            fs.writeFileSync(path.join(tmpDir, 'models', 'MyModel.json'), JSON.stringify(model))
                          })
                          .withPrompts({
                            model: 'MyModel',
                            propertyName: 'book',
                            type: 'boolean',
                            required: 'true',
                            default: 'false'
                          })
                          .withOptions({ 'skip-build': true })
      return runContext.toPromise()
    })

    after(function () {
      // restore delay between status checks so integration tests
      // remain resilient
      // config.sdkGenCheckDelay = sdkGenCheckDelaySaved

      runContext.cleanTestDirectory()
    })

    it('adds the properties to the spec.json', function () {
      const exp = {
        models: [
          {
            name: 'MyModel',
            plural: 'MyModels',
            classname: 'MyModel',
            properties: {
              'id': {
                'type': 'string',
                'id': true
              },
              'book': {
                'type': 'boolean',
                'required': true,
                'default': false
              }
            }
          }
        ]
      }
      assert.jsonFileContent('spec.json', exp)
    })

    it('adds the properties to the model file', function () {
      var expected = {
        name: 'MyModel',
        plural: 'MyModels',
        classname: 'MyModel',
        properties: {
          'id': {
            'type': 'string',
            'id': true
          },
          'book': {
            'type': 'boolean',
            'required': true,
            'default': false
          }
        }
      }
      assert.jsonFileContent(path.join(process.cwd(), 'models', 'MyModel.json'), expected)
    })
  })
})
