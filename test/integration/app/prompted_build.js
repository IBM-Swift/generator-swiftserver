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
var helpers = require('yeoman-test')
var path = require('path')
var nock = require('nock')

var appGeneratorPath = path.join(__dirname, '../../../app')
var commonTest = require('../../lib/common_test.js')
var mockSDKGen = require('../../lib/mock_sdkgen.js')

describe('Integration tests (prompt build) for swiftserver:app', function () {
  // Swift build is slow so we need to set a longer timeout for the test
  this.timeout(300000)

  describe('crud', function () {
    describe('new application @full', function () {
      var applicationName = 'newapp'
      var executableModule = applicationName

      describe('base', function () {
        var runContext

        before(function () {
          mockSDKGen.mockClientSDKNetworkRequest(applicationName)
          runContext = helpers.run(appGeneratorPath)
                              .withPrompts({
                                appType: 'Scaffold a starter',
                                name: applicationName,
                                dir: applicationName
                              })
          return runContext.toPromise()
        })

        after(function () {
          nock.cleanAll()
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

    var capabilitiesToTest = [ 'web', 'metrics', 'docker' ]
    capabilitiesToTest.forEach(capability => {
      var capabilityDisplayName = commonTest.capabilityDisplayNames[capability]

      describe(`with ${capability} @full`, function () {
        var runContext

        before(function () {
          runContext = helpers.run(appGeneratorPath)
                              .withPrompts({
                                appType: 'Scaffold a starter',
                                name: applicationName,
                                dir: applicationName,
                                capabilities: [ capabilityDisplayName ]
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

    // TODO with swagger file serving endpoint @full
    // TODO with endpoints from swagger file @full

    var servicesToTest = [ 'cloudant', 'redis', 'mongodb', 'postgresql', 'elephantsql',
      'objectstorage', 'appid', 'watsonconversation', 'alertnotification',
      'pushnotifications', 'autoscaling' ]
    servicesToTest.forEach(service => {
      var serviceDisplayName = commonTest.serviceDisplayNames[service]

      describe(`with ${service} @full`, function () {
        var runContext

        before(function () {
          runContext = helpers.run(appGeneratorPath)
                              .withPrompts({
                                appType: 'Scaffold a starter',
                                name: applicationName,
                                dir: applicationName,
                                capabilities: [],
                                services: [ serviceDisplayName ]
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

    describe.skip('with server sdk @full', function () {
      var petstoreSDKName = 'Swagger_Petstore'
      var petstore2SDKName = 'Swagger_Petstore_Two'
      var petstoreSwaggerFile = path.join(__dirname, '../../resources/petstore.yaml')
      var petstore2SwaggerFile = path.join(__dirname, '../../resources/petstore2.yaml')
      var runContext

      before(function () {
        mockSDKGen.mockClientSDKNetworkRequest(applicationName)
        // TODO this test is in skip mode until we mock the server sdk
        // with real content instead of dummy content
        mockSDKGen.mockServerSDKNetworkRequest(petstoreSDKName)
        mockSDKGen.mockServerSDKNetworkRequest(petstore2SDKName)
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
        nock.cleanAll()
        runContext.cleanTestDirectory()
      })

      commonTest.itCompiledExecutableModule(executableModule)
      commonTest.itCreatedXCodeProjectWorkspace(applicationName)
    })

    describe('with all capabilities and services', function () {
      // On macOS this test sometimes times out because of the number
      // of dependencies to fetch and compile. Use a longer timeout.
      this.timeout(600000)

      // var petstoreSDKName = 'Swagger_Petstore'
      var petstoreSwaggerFile = path.join(__dirname, '../../resources/petstore.yaml')
      var runContext

      before(function () {
        mockSDKGen.mockClientSDKNetworkRequest(applicationName)
        // TODO don't include a server sdk until we mock the server sdk
        // with real content instead of dummy content
        // mockSDKGen.mockServerSDKNetworkRequest(petstoreSDKName)
        runContext = helpers.run(appGeneratorPath)
                            .withPrompts({
                              appType: 'Scaffold a starter',
                              name: applicationName,
                              dir: applicationName,
                              appPattern: 'Backend for frontend',
                              swaggerChoice: 'Custom swagger file',
                              path: petstoreSwaggerFile,
                              generateCodableRoutes: true,
                              // serverSwaggerInput0: true,
                              // serverSwaggerInputPath0: petstoreSwaggerFile,
                              // serverSwaggerInput1: false,
                              services: [
                                'Cloudant / CouchDB',
                                'Redis',
                                'MongoDB',
                                'Object Storage',
                                'AppID',
                                'Auto-scaling',
                                'Watson Conversation',
                                'Alert Notification',
                                'Push Notifications'
                              ]
                            })
        return runContext.toPromise()
      })

      after(function () {
        nock.cleanAll()
        runContext.cleanTestDirectory()
      })

      commonTest.itCompiledExecutableModule(executableModule)
      commonTest.itCreatedXCodeProjectWorkspace(applicationName)
    })
  })
})
