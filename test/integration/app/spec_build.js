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
 *
 * IMPORTANT:
 * Only put tests here if you cannot drive the required behaviour through
 * prompting (eg creation of a CRUD project with models in one run of the
 * generator, or other features only available by providing a spec directly)
 *
 * These are build tests, only test build related behaviour in this file.
 */
'use strict'
var helpers = require('yeoman-test')
var path = require('path')
var nock = require('nock')

var appGeneratorPath = path.join(__dirname, '../../../app')
var commonTest = require('../../lib/common_test.js')
var mockSDKGen = require('../../lib/mock_sdkgen.js')

describe('Integration tests (spec build) for swiftserver:app', function () {
  // Swift build is slow so we need to set a long timeout for the test
  this.timeout(300000)

  describe('crud', function () {
    var applicationName = 'todo'
    var executableModule = applicationName
    var todoModel = {
      name: 'todo',
      plural: 'todos',
      classname: 'Todo',
      properties: {
        id: {
          type: 'string',
          id: true
        },
        title: {
          type: 'string'
        }
      }
    }

    describe('base @full', function () {
      var runContext

      before(function () {
        mockSDKGen.mockClientSDKNetworkRequest(applicationName)
        runContext = helpers.run(appGeneratorPath)
                            .withOptions({
                              spec: JSON.stringify({
                                appType: 'crud',
                                appName: applicationName,
                                models: [ todoModel ]
                              })
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
      var runContext
      // var serverSDKFile = path.join(__dirname, '../../resources/petstore.yaml')
      // var serverSDKName = 'Swagger_Petstore'

      before(function () {
        mockSDKGen.mockClientSDKNetworkRequest(applicationName)
        // mockSDKGen.mockServerSDKNetworkRequest(serverSDKName)
        runContext = helpers.run(appGeneratorPath)
                            .withOptions({
                              spec: JSON.stringify({
                                appType: 'crud',
                                appName: applicationName,
                                models: [ todoModel ],
                                docker: true,
                                metrics: true,
                                // serverSwaggerFiles: [ serverSDKFile ],
                                services: {
                                  cloudant: [{ name: 'myCloudantService' }],
                                  autoscaling: [{ name: 'myAutoscalingService' }]
                                },
                                crudservice: 'myCloudantService'
                              })
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
