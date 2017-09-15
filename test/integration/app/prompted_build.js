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
var helpers = require('yeoman-test')

var appGeneratorPath = path.join(__dirname, '../../../app')
var commonTest = require('../../lib/common_test.js')
var buildTimeout = 300000

// Require config to alter sdkgen delay between
// status checks to improve resilience of integration tests
var config = require('../../../config')
var sdkGenCheckDelaySaved

describe('Prompt and build integration tests for swiftserver:app', function () {
  // Swift build is slow so we need to set a longer timeout for the test
  this.timeout(buildTimeout)

  before(function () {
    // alter delay between status checks to improve resilience of
    // integration tests
    sdkGenCheckDelaySaved = config.sdkGenCheckDelay
    config.sdkGenCheckDelay = 10000
  })

  after('restore sdkgen status check delay', function () {
    // restore delay between status checks
    config.sdkGenCheckDelay = sdkGenCheckDelaySaved
  })

  describe('crud', function () {
    describe('new application', function () {
      var applicationName = 'newapp'
      var executableModule = applicationName

      describe('base', function () {
        var runContext

        before(function () {
          runContext = helpers.run(appGeneratorPath)
                              .withPrompts({
                                appType: 'Scaffold a starter',
                                name: applicationName,
                                dir: applicationName
                              })
          return runContext.toPromise()
        })

        after(function () {
          runContext.cleanTestDirectory()
        })

        commonTest.itCompiledExecutableModule(executableModule)
        commonTest.itCreatedXCodeProjectWorkspace(applicationName)
      })
    })
  })

  describe('scaffold', function () {
    var applicationName = 'myapp'
    var executableModule = applicationName

    describe('base', function () {
      var runContext

      before(function () {
        runContext = helpers.run(appGeneratorPath)
                            .withPrompts({
                              appType: 'Scaffold a starter',
                              name: applicationName,
                              dir: applicationName
                            })
        return runContext.toPromise()
      })

      after(function () {
        runContext.cleanTestDirectory()
      })

      commonTest.itCompiledExecutableModule(executableModule)
      commonTest.itCreatedXCodeProjectWorkspace(applicationName)
    })

    describe('with web', function () {
      var runContext

      before(function () {
        runContext = helpers.run(appGeneratorPath)
                            .withPrompts({
                              appType: 'Scaffold a starter',
                              name: applicationName,
                              dir: applicationName,
                              capabilities: [ 'Static web file serving' ]
                            })
        return runContext.toPromise()
      })

      after(function () {
        runContext.cleanTestDirectory()
      })

      commonTest.itCompiledExecutableModule(executableModule)
      commonTest.itCreatedXCodeProjectWorkspace(applicationName)
    })

    describe('with server sdk', function () {
      var petstoreSwaggerFile = path.join(__dirname, '../../resources/petstore.yaml')
      var petstore2SwaggerFile = path.join(__dirname, '../../resources/petstore2.yaml')
      var runContext

      before(function () {
        runContext = helpers.run(appGeneratorPath)
                            .withPrompts({
                              appType: 'Scaffold a starter',
                              name: applicationName,
                              dir: applicationName,
                              endpoints: 'Endpoints from swagger file',
                              swaggerChoice: 'Custom swagger file',
                              path: petstoreSwaggerFile,
                              serverSwaggerInput0: true,
                              serverSwaggerInputPath0: petstoreSwaggerFile,
                              serverSwaggerInput1: true,
                              serverSwaggerInputPath1: petstore2SwaggerFile,
                              serverSwaggerInput2: false
                            })
        return runContext.toPromise()
      })

      after(function () {
        runContext.cleanTestDirectory()
      })

      commonTest.itCompiledExecutableModule(executableModule)
      commonTest.itCreatedXCodeProjectWorkspace(applicationName)
    })
  })
})
