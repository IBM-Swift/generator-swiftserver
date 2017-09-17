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
 * Tests here do not mock out the SDKGen service so real web requests are
 * made which may fail or timeout if the service is unavailable or overloaded.
 *
 * IMPORTANT:
 * Only put tests here to ensure the generators remain compatible with the
 * real service. To protect the development process from service problems
 * these tests should be run on a schedule rather than for pull requests
 * and merges.
 */
'use strict'
var helpers = require('yeoman-test')
var path = require('path')

var appGeneratorPath = path.join(__dirname, '../../app')
var commonTest = require('../lib/common_test.js')

// Require config to alter sdkgen delay between
// status checks to give extra time to the SDKGen service
// for test resilience
var config = require('../../config')
var sdkGenCheckDelaySaved

describe('SDKGen service tests (compat) for swiftserver:app', function () {
  this.timeout(300000)

  before(function () {
    // alter delay between status checks to give SDKGen service extra time
    // to improve the resilience of these tests
    sdkGenCheckDelaySaved = config.sdkGenCheckDelay
    config.sdkGenCheckDelay = 10000
  })

  after('restore sdkgen status check delay', function () {
    // restore delay between status checks so other tests
    // remain unaffected by the change
    config.sdkGenCheckDelay = sdkGenCheckDelaySaved
  })

  describe('scaffold', function () {
    var applicationName = 'myapp'
    var executableModule = applicationName

    describe('from swagger with server sdk', function () {
      var petstoreSwaggerFile = path.join(__dirname, '../resources/petstore.yaml')
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
                              serverSwaggerInput1: false
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
