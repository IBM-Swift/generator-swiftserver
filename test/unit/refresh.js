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

'use strict'
var assert = require('yeoman-assert')
var helpers = require('yeoman-test')
var path = require('path')
var fs = require('fs')
var nock = require('nock')
var mkdirp = require('mkdirp')

var refreshGeneratorPath = path.join(__dirname, '../../refresh')
var commonTest = require('../lib/common_test.js')
var mockSDKGen = require('../lib/mock_sdkgen.js')

// Short names for commonTest values
var generatedSourceDir = commonTest.generatedSourceDir
var applicationSourceFile = commonTest.applicationSourceFile
var routesSourceDir = commonTest.routesSourceDir

var bxdevConfigFile = commonTest.bxdevConfigFile
var cloudFoundryManifestFile = commonTest.cloudFoundryManifestFile
var cloudFoundryFiles = commonTest.cloudFoundryFiles
var bluemixFiles = commonTest.bluemixFiles

// Require config to alter sdkgen delay between
// status checks to speed up unit tests
var config = require('../../config')
var sdkGenCheckDelaySaved

describe('Unit tests for swiftserver:refresh', function () {
  before('set sdkgen status check delay to 1ms', function () {
    // alter delay between status checks to speed up unit tests
    sdkGenCheckDelaySaved = config.sdkGenCheckDelay
    config.sdkGenCheckDelay = 1
  })

  after('restore sdkgen status check delay', function () {
    // restore delay between status checks so integration tests
    // remain resilient
    config.sdkGenCheckDelay = sdkGenCheckDelaySaved
  })

  describe('invalid spec', function () {
    describe('missing appType', function () {
      var runContext
      var error = null

      before(function () {
        runContext = helpers.run(refreshGeneratorPath)
                            .withOptions({ specObj: {} })
        return runContext.toPromise().catch(function (err) {
          error = err
        })
      })

      after(function () {
        runContext.cleanTestDirectory()
      })

      it('aborted the generator with an error', function () {
        assert(error, 'Should throw an error')
        assert(error.message.match('^.*appType is missing.*$'), 'Thrown error should be about missing appType, it was: ' + error)
      })
    })

    describe('invalid appType', function () {
      var runContext
      var error = null

      before(function () {
        runContext = helpers.run(refreshGeneratorPath)
                            .withOptions({
                              specObj: {
                                appType: 'tomato'
                              }
                            })
        return runContext.toPromise().catch(function (err) {
          error = err
        })
      })

      after(function () {
        runContext.cleanTestDirectory()
      })

      it('aborted the generator with an error', function () {
        assert(error, 'Should throw an error')
        assert(error.message.match('^.*appType is invalid.*$'), 'Thrown error should be about invalid appType, it was: ' + error)
      })
    })

    describe('missing appName', function () {
      var runContext
      var error = null

      before(function () {
        runContext = helpers.run(refreshGeneratorPath)
                            .withOptions({
                              specObj: {
                                appType: 'scaffold'
                              }
                            })
        return runContext.toPromise().catch(function (err) {
          error = err
        })
      })

      after(function () {
        runContext.cleanTestDirectory()
      })

      it('aborted the generator with an error', function () {
        assert(error, 'Should throw an error')
        assert(error.message.match('^.*appName is missing.*$'), 'Thrown error should be about missing appName, it was: ' + error)
      })
    })

    describe('invalid service', function () {
      var runContext
      var error = null

      before(function () {
        runContext = helpers.run(refreshGeneratorPath)
                            .withOptions({
                              specObj: {
                                appType: 'scaffold',
                                appName: 'myapp',
                                services: {
                                  objectstorage: {}
                                }
                              }
                            })
        return runContext.toPromise().catch(function (err) {
          error = err
        })
      })

      after(function () {
        runContext.cleanTestDirectory()
      })

      it('aborted the generator with an error', function () {
        assert(error, 'Should throw an error')
        assert(error.message.match('services.objectstorage must be an array'), 'Thrown error should be about invalid service value, it was: ' + error)
      })
    })

    describe('service missing name', function () {
      var runContext
      var error = null

      before(function () {
        runContext = helpers.run(refreshGeneratorPath)
                            .withOptions({
                              specObj: {
                                appType: 'scaffold',
                                appName: 'myapp',
                                services: {
                                  objectstorage: [{}]
                                }
                              }
                            })
        return runContext.toPromise().catch(function (err) {
          error = err
        })
      })

      after(function () {
        runContext.cleanTestDirectory()
      })

      it('aborted the generator with an error', function () {
        assert(error, 'Should throw an error')
        assert(error.message.match('Service name is missing.*$'), 'Thrown error should be about missing service name, it was: ' + error)
      })
    })
  })

  describe('crud', function () {
    describe('todo application', function () {
      var applicationName = 'todo'
      var executableModule = applicationName
      var swaggerFile = `definitions/${applicationName}.yaml`
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

      describe('base', function () {
        var runContext
        var sdkScope

        before(function () {
          sdkScope = mockSDKGen.mockClientSDKNetworkRequest(applicationName)
          runContext = helpers.run(refreshGeneratorPath)
                              .withOptions({
                                specObj: {
                                  appType: 'crud',
                                  appName: applicationName,
                                  models: [ todoModel ]
                                }
                              })
          return runContext.toPromise()
        })

        after(function () {
          nock.cleanAll()
          runContext.cleanTestDirectory()
        })

        it('requested an client sdk over http', function () {
          assert(sdkScope.isDone())
        })

        commonTest.itUsedDefaultDestinationDirectory()

        commonTest.itCreatedCommonFiles(executableModule)
        commonTest.itHasCorrectFilesForSingleShotFalse()

        commonTest.itHasPackageDependencies([
          'Kitura',
          'HeliumLogger',
          'CloudEnvironment',
          'Health'
        ])

        commonTest.itCreatedRoutes([
          'Health',
          'Swagger'
        ])

        commonTest.itDidNotCreateServiceFiles()
        commonTest.itDidNotCreateMetricsFiles()

        it('created CRUD source files', function () {
          assert.file(commonTest.crudSourceFiles)
        })

        it(`created ${todoModel.name} model file`, function () {
          assert.file(commonTest.modelFileGenerator(todoModel.name))
        })

        it(`created ${todoModel.name} source files`, function () {
          assert.file(commonTest.modelSourceFilesGenerator(todoModel.classname))
        })

        it('created memory adapter', function () {
          assert.file(`${generatedSourceDir}/${todoModel.classname}MemoryAdapter.swift`)
        })

        it('adapter factory uses memory adapter', function () {
          assert.fileContent(`${generatedSourceDir}/AdapterFactory.swift`, `${todoModel.classname}MemoryAdapter(`)
        })

        it('created cloudfoundry files', function () {
          assert.file(cloudFoundryFiles)
        })

        it('created bluemix files', function () {
          assert.file(bluemixFiles)
        })

        it('created a swagger definition file', function () {
          assert.file(swaggerFile)
        })

        it('swagger definition contains expected content', function () {
          assert.fileContent([
            [ swaggerFile, `title: ${applicationName}` ],
            [ swaggerFile, `${todoModel.name}:` ]
          ])
        })

        it('cloudfoundry manifest contains the expected content', function () {
          assert.fileContent([
            [ cloudFoundryManifestFile, `name: ${applicationName}` ],
            [ cloudFoundryManifestFile, 'random-route: true' ],
            [ cloudFoundryManifestFile, 'instances: 1' ],
            [ cloudFoundryManifestFile, 'memory: 128M' ],
            [ cloudFoundryManifestFile, 'disk_quota: 1024M' ],
            [ cloudFoundryManifestFile, 'timeout: 180' ],
            [ cloudFoundryManifestFile, 'OPENAPI_SPEC:' ]
          ])
          assert.noFileContent([
            [ cloudFoundryManifestFile, 'domain:' ],
            [ cloudFoundryManifestFile, 'host:' ],
            [ cloudFoundryManifestFile, 'namespace:' ]
          ])
        })

        it('cloudfoundry manifest defines health check details', function () {
          assert.fileContent([
            [ cloudFoundryManifestFile, 'health-check-type: http' ],
            [ cloudFoundryManifestFile, 'health-check-http-endpoint: /health' ]
          ])
        })

        it('cloudfoundry manifest defines OPENAPI_SPEC environment variable', function () {
          assert.fileContent(cloudFoundryManifestFile, 'OPENAPI_SPEC: "/swagger/api"')
        })
      })

      describe('update existing without overwriting user-owned files', function () {
        var runContext
        var dummyContent = '{ "dummyContent": "==Dummy existing content==" }'
        var userOwnedFiles = [ commonTest.readmeFile,
          commonTest.packageFile,
          commonTest.bxdevConfigFile,
          commonTest.configMappingsFile,
          commonTest.configCredentialsFile,
          commonTest.applicationSourceFile,
          commonTest.applicationSourceDir + '/Metrics.swift',
          commonTest.routesSourceDir + '/SwaggerRoutes.swift',
          commonTest.routesSourceDir + '/HealthRoutes.swift',
          commonTest.servicesSourceDir + '/ServiceAppid.swift',
          commonTest.servicesSourceDir + '/ServiceCloudant.swift',
          commonTest.servicesSourceDir + '/ServiceRedis.swift',
          commonTest.servicesSourceDir + '/ServiceMongodb.swift',
          commonTest.servicesSourceDir + '/ServiceObjectStorage.swift',
          commonTest.servicesSourceDir + '/ServiceWatsonConversation.swift',
          commonTest.servicesSourceDir + '/ServicePush.swift',
          commonTest.servicesSourceDir + '/ServiceAlertNotification.swift',
          commonTest.servicesSourceDir + '/ServiceAutoscaling.swift' ]
          .concat(commonTest.cloudFoundryFiles)
          .concat(commonTest.bluemixFiles)
          .concat(commonTest.dockerFiles)
          .concat(commonTest.kubernetesFilesGenerator(applicationName))
          // TODO: add server sdk source file as user owned

        var spec = {
          appType: 'crud',
          appName: applicationName,
          models: [ todoModel ],
          docker: true,
          services: {
            appid: [{ name: 'myAppIDService' }],
            cloudant: [{ name: 'myCloudantService' }],
            redis: [{ name: 'myRedisService' }],
            mongodb: [{ name: 'myMongoDBService' }],
            objectstorage: [{ name: 'myObjectStorageService' }],
            watsonconversation: [{ name: 'myConversationService' }],
            pushnotifications: [{ name: 'myPushService' }],
            alertnotification: [{ name: 'myAlertService' }],
            autoscaling: [{ name: 'myAutoscalingService' }]
          },
          crudservice: 'myCloudantService'
        }

        before(function () {
          mockSDKGen.mockClientSDKNetworkRequest(applicationName)
          runContext = helpers.run(refreshGeneratorPath)
                              .inTmpDir(function (tmpDir) {
                                // Create dummy project
                                var projectMarkerFile = `${tmpDir}/${commonTest.projectMarkerFile}`
                                var generatorSpecFile = `${tmpDir}/${commonTest.generatorSpecFile}`
                                var generatorConfigFile = `${tmpDir}/${commonTest.generatorConfigFile}`

                                var config = { 'generator-swiftserver': { version: commonTest.generatorVersion } }

                                fs.writeFileSync(projectMarkerFile, '')
                                fs.writeFileSync(generatorSpecFile, JSON.stringify(spec))
                                fs.writeFileSync(generatorConfigFile, JSON.stringify(config))

                                // Write dummy content to user owned files
                                userOwnedFiles.forEach((filename) => {
                                  mkdirp.sync(path.dirname(filename))
                                  fs.writeFileSync(path.join(tmpDir, filename),
                                                   dummyContent)
                                })
                              })
          return runContext.toPromise()
        })

        after(function () {
          nock.cleanAll()
          runContext.cleanTestDirectory()
        })

        userOwnedFiles.forEach(filename => {
          it(`does not overwrite user-owned file ${filename}`, function () {
            assert.fileContent(filename, dummyContent)
          })
        })
      })

      describe('with docker', function () {
        var runContext

        before(function () {
          mockSDKGen.mockClientSDKNetworkRequest(applicationName)
          runContext = helpers.run(refreshGeneratorPath)
                              .withOptions({
                                specObj: {
                                  appType: 'crud',
                                  appName: applicationName,
                                  models: [ todoModel ],
                                  docker: true,
                                  bluemix: {
                                    domain: 'mydomain.net',
                                    namespace: 'mynamespace'
                                  }
                                }
                              })
          return runContext.toPromise()
        })

        after(function () {
          nock.cleanAll()
          runContext.cleanTestDirectory()
        })

        it('created bx dev config file', function () {
          assert.file(bxdevConfigFile)
        })

        commonTest.itCreatedDockerFilesWithExpectedContent(applicationName)

        // NOTE(tunniclm): For now we have overloaded the docker
        // option to produce kubernetes files as well
        commonTest.itCreatedKubernetesFilesWithExpectedContent({
          applicationName: applicationName,
          domain: 'mydomain.net',
          namespace: 'mynamespace'
        })
      })

      describe('with apic', function () {
        var runContext
        var apicProductFile = `definitions/${applicationName}-product.yaml`

        before(function () {
          mockSDKGen.mockClientSDKNetworkRequest(applicationName)
          runContext = helpers.run(refreshGeneratorPath)
                              .withOptions({
                                specObj: {
                                  appType: 'crud',
                                  appName: applicationName,
                                  models: [ todoModel ]
                                },
                                apic: true
                              })
          return runContext.toPromise()
        })

        after(function () {
          nock.cleanAll()
          runContext.cleanTestDirectory()
        })

        it('created a product file', function () {
          assert.file(apicProductFile)
        })

        it('product file contains expected content', function () {
          assert.fileContent([
            [ apicProductFile, `name: ${applicationName}` ],
            [ apicProductFile, `title: ${applicationName}` ]
          ])
        })

        it('swagger definition contains expected apic extension content', function () {
          assert.fileContent([
            [ swaggerFile, `name: ${applicationName}` ]
          ])
        })
      })

      describe('with metrics', function () {
        var runContext

        before(function () {
          mockSDKGen.mockClientSDKNetworkRequest(applicationName)
          runContext = helpers.run(refreshGeneratorPath)
                              .withOptions({
                                specObj: {
                                  appType: 'crud',
                                  appName: applicationName,
                                  models: [ todoModel ],
                                  metrics: true
                                }
                              })
          return runContext.toPromise()
        })

        after(function () {
          nock.cleanAll()
          runContext.cleanTestDirectory()
        })

        commonTest.itCreatedMetricsFilesWithExpectedContent()
      })

      describe('with autoscaling (implies metrics)', function () {
        var runContext

        before(function () {
          mockSDKGen.mockClientSDKNetworkRequest(applicationName)
          runContext = helpers.run(refreshGeneratorPath)
                              .withOptions({
                                specObj: {
                                  appType: 'crud',
                                  appName: applicationName,
                                  models: [ todoModel ],
                                  services: {
                                    autoscaling: [{ name: 'myAutoscalingService' }]
                                  }
                                }
                              })
          return runContext.toPromise()
        })

        after(function () {
          nock.cleanAll()
          runContext.cleanTestDirectory()
        })

        commonTest.itCreatedMetricsFilesWithExpectedContent()

        commonTest.autoscaling.itCreatedServiceFilesWithExpectedContent('myAutoscalingService')
      })

      describe('with cloudant', function () {
        var runContext

        before(function () {
          mockSDKGen.mockClientSDKNetworkRequest(applicationName)
          runContext = helpers.run(refreshGeneratorPath)
                              .withOptions({
                                specObj: {
                                  appType: 'crud',
                                  appName: applicationName,
                                  models: [ todoModel ],
                                  services: {
                                    cloudant: [{ name: 'myCloudantService' }]
                                  },
                                  crudservice: 'myCloudantService'
                                }
                              })
          return runContext.toPromise()
        })

        after(function () {
          nock.cleanAll()
          runContext.cleanTestDirectory()
        })

        commonTest.itCreatedServiceConfigFiles()

        commonTest.cloudant.itCreatedServiceFilesWithExpectedContent('myCloudantService')

        it('created cloudant adapter', function () {
          assert.file(`${generatedSourceDir}/${todoModel.classname}CloudantAdapter.swift`)
        })

        it('adapter factory uses cloudant adapter', function () {
          assert.fileContent(`${generatedSourceDir}/AdapterFactory.swift`, `${todoModel.classname}CloudantAdapter(`)
        })
      })
    })
  })

  describe('scaffold', function () {
    var applicationName = 'myapp'
    var executableModule = applicationName

    describe('base', function () {
      var runContext

      before(function () {
        runContext = helpers.run(refreshGeneratorPath)
                            .withOptions({
                              specObj: {
                                appType: 'scaffold',
                                appName: applicationName
                              }
                            })
        return runContext.toPromise()
      })

      after(function () {
        runContext.cleanTestDirectory()
      })

      commonTest.itUsedDefaultDestinationDirectory()

      commonTest.itCreatedCommonFiles(executableModule)
      commonTest.itHasCorrectFilesForSingleShotFalse()

      commonTest.itHasPackageDependencies([
        'Kitura',
        'HeliumLogger',
        'CloudEnvironment',
        'Health'
      ])

      commonTest.itCreatedRoutes([
        'Health'
      ])

      commonTest.itDidNotCreateRoutes([
        'Swagger'
      ])

      commonTest.itDidNotCreateServiceFiles()
      commonTest.itDidNotCreateMetricsFiles()
      commonTest.itDidNotCreateWebFiles()
      commonTest.itDidNotCreateSwaggerUIFiles()

      it('created cloudfoundry files', function () {
        assert.file(cloudFoundryFiles)
      })

      it('created bluemix files', function () {
        assert.file(bluemixFiles)
      })

      it('cloudfoundry manifest contains the expected content', function () {
        assert.fileContent([
          [ cloudFoundryManifestFile, `name: ${applicationName}` ],
          [ cloudFoundryManifestFile, 'random-route: true' ],
          [ cloudFoundryManifestFile, 'instances: 1' ],
          [ cloudFoundryManifestFile, 'memory: 128M' ],
          [ cloudFoundryManifestFile, 'disk_quota: 1024M' ],
          [ cloudFoundryManifestFile, 'timeout: 180' ]
        ])
        assert.noFileContent([
          [ cloudFoundryManifestFile, 'domain:' ],
          [ cloudFoundryManifestFile, 'host:' ],
          [ cloudFoundryManifestFile, 'namespace:' ],
          [ cloudFoundryManifestFile, 'OPENAPI_SPEC:' ]
        ])
      })

      it('cloudfoundry manifest defines health check details', function () {
        assert.fileContent([
          [ cloudFoundryManifestFile, 'health-check-type: http' ],
          [ cloudFoundryManifestFile, 'health-check-http-endpoint: /health' ]
        ])
      })

      it('cloudfoundry manifest does not define OPENAPI_SPEC', function () {
        assert.noFileContent(cloudFoundryManifestFile, 'OPENAPI_SPEC')
      })
    })

    describe('with single shot option', function () {
      var runContext

      before(function () {
        runContext = helpers.run(refreshGeneratorPath)
                            .withOptions({
                              specObj: {
                                appType: 'scaffold',
                                appName: applicationName
                              },
                              'single-shot': true
                            })
        return runContext.toPromise()
      })

      after(function () {
        runContext.cleanTestDirectory()
      })

      commonTest.itUsedDefaultDestinationDirectory()

      commonTest.itCreatedCommonFiles(executableModule)
      commonTest.itHasCorrectFilesForSingleShotTrue()
    })

    describe('with custom bluemix options', function () {
      var runContext

      before(function () {
        runContext = helpers.run(refreshGeneratorPath)
                            .withOptions({
                              specObj: {
                                appType: 'scaffold',
                                appName: applicationName,
                                bluemix: {
                                  name: 'test',
                                  host: 'myhost',
                                  domain: 'mydomain.net'
                                }
                              }
                            })
        return runContext.toPromise()
      })

      after(function () {
        runContext.cleanTestDirectory()
      })

      it('cloudfoundry manifest contains the custom options', function () {
        assert.fileContent([
          [ cloudFoundryManifestFile, 'name: test' ],
          [ cloudFoundryManifestFile, 'host: myhost' ],
          [ cloudFoundryManifestFile, 'domain: mydomain.net' ]
        ])
        assert.noFileContent([
          [ cloudFoundryManifestFile, 'random-route: true' ]
        ])
      })
    })

    describe('with incorrect custom bluemix options', function () {
      var runContext

      before(function () {
        runContext = helpers.run(refreshGeneratorPath)
                            .withOptions({
                              specObj: {
                                appType: 'scaffold',
                                appName: applicationName,
                                bluemix: {
                                  name: {},
                                  host: {},
                                  domain: true
                                }
                              }
                            })
        return runContext.toPromise()
      })

      after(function () {
        runContext.cleanTestDirectory()
      })

      it('cloudfoundry manifest contains fallback content', function () {
        assert.fileContent([
          [ cloudFoundryManifestFile, `name: ${applicationName}` ],
          [ cloudFoundryManifestFile, 'random-route: true' ]
        ])
        assert.noFileContent([
          [ cloudFoundryManifestFile, 'host: myhost' ],
          [ cloudFoundryManifestFile, 'domain: mydomain.net' ]
        ])
      })
    })

    describe('with docker', function () {
      var runContext

      before(function () {
        mockSDKGen.mockClientSDKNetworkRequest(applicationName)
        runContext = helpers.run(refreshGeneratorPath)
          .withOptions({
            specObj: {
              appType: 'scaffold',
              appName: applicationName,
              docker: true,
              bluemix: {
                domain: 'mydomain.net',
                namespace: 'mynamespace'
              }
            }
          })
        return runContext.toPromise()
      })

      after(function () {
        nock.cleanAll()
        runContext.cleanTestDirectory()
      })

      it('created bx dev config file', function () {
        assert.file(bxdevConfigFile)
      })

      commonTest.itCreatedDockerFilesWithExpectedContent(applicationName)

      // NOTE(tunniclm): For now we have overloaded the docker
      // option to produce kubernetes files as well
      commonTest.itCreatedKubernetesFilesWithExpectedContent({
        applicationName: applicationName,
        domain: 'mydomain.net',
        namespace: 'mynamespace'
      })
    })

    describe('with metrics', function () {
      var runContext

      before(function () {
        runContext = helpers.run(refreshGeneratorPath)
                            .withOptions({
                              specObj: {
                                appType: 'scaffold',
                                appName: applicationName,
                                metrics: true
                              }
                            })
        return runContext.toPromise()
      })

      after(function () {
        runContext.cleanTestDirectory()
      })

      commonTest.itCreatedMetricsFilesWithExpectedContent()
    })

    describe('with web', function () {
      var runContext

      before(function () {
        runContext = helpers.run(refreshGeneratorPath)
                            .withOptions({
                              specObj: {
                                appType: 'scaffold',
                                appName: applicationName,
                                web: true
                              }
                            })
        return runContext.toPromise()
      })

      after(function () {
        runContext.cleanTestDirectory()
      })

      commonTest.itCreatedWebFiles()
    })

    describe('with server sdk', function () {
      var serverSDKName = 'Swagger_Petstore'
      var spec = {
        appType: 'scaffold',
        appName: applicationName,
        hostSwagger: true,
        serverSwaggerFiles: [
          path.join(__dirname, '../resources/petstore.yaml')
        ]
      }

      describe('successful server sdk generation', function () {
        var runContext
        var sdkScope

        before(function () {
          sdkScope = mockSDKGen.mockServerSDKNetworkRequest(serverSDKName)
          runContext = helpers.run(refreshGeneratorPath)
                              .withOptions({ specObj: spec })
          return runContext.toPromise()
        })

        after(function () {
          nock.cleanAll()
          runContext.cleanTestDirectory()
        })

        it('requested server sdk over http', function () {
          assert(sdkScope.isDone())
        })

        it('created pet model from swagger file', function () {
          assert.file('Sources/Swagger_Petstore_ServerSDK/Pet.swift')
        })

        it('modified Package.swift to include server sdk module', function () {
          assert.fileContent('Package.swift', 'Swagger_Petstore_ServerSDK')
        })
      })

      describe('server sdk download failure (host lookup error)', function () {
        var runContext
        var sdkScope
        var error

        before(function () {
          sdkScope = mockSDKGen.mockServerSDKDownloadFailure(serverSDKName)
          runContext = helpers.run(refreshGeneratorPath)
                              .withOptions({ specObj: spec })
          return runContext.toPromise().catch(function (err) {
            error = err.message
          })
        })

        after(function () {
          nock.cleanAll()
          runContext.cleanTestDirectory()
        })

        it('requested server sdk over http', function () {
          assert(sdkScope.isDone())
        })

        it('aborted the generator with an error', function () {
          assert(error, 'Should throw an error')
          assert(error.match(/Getting server SDK.*failed/), 'Thrown error should be about failing to download server SDK, it was: ' + error)
        })
      })
    })

    describe('from swagger', function () {
      var outputSwaggerFile = `definitions/${applicationName}.yaml`

      describe('from local file', function () {
        describe('using dinosaur swagger (json, with basepath)', function () {
          var inputSwaggerFile = path.join(__dirname, '../resources/person_dino.json')

          describe('successful client sdk generation', function () {
            var runContext
            var sdkScope

            before(function () {
              sdkScope = mockSDKGen.mockClientSDKNetworkRequest(applicationName)
              runContext = helpers.run(refreshGeneratorPath)
                                  .withOptions({
                                    specObj: {
                                      appType: 'scaffold',
                                      appName: applicationName,
                                      hostSwagger: true,
                                      fromSwagger: inputSwaggerFile
                                    }
                                  })
              return runContext.toPromise()
            })

            after(function () {
              nock.cleanAll()
              runContext.cleanTestDirectory()
            })

            it('requested client sdk over http', function () {
              assert(sdkScope.isDone())
            })

            commonTest.itUsedDefaultDestinationDirectory()

            commonTest.itCreatedCommonFiles(executableModule)
            commonTest.itHasCorrectFilesForSingleShotFalse()

            commonTest.itCreatedRoutes([
              'Dinosaurs',
              'Persons',
              'Swagger'
            ])

            it('created a swagger definition file', function () {
              assert.file(outputSwaggerFile)
            })

            it('application defines base path', function () {
              assert.fileContent(applicationSourceFile, 'basePath = "/basepath"')
            })

            it('swagger routes prepend base path', function () {
              assert.fileContent(`${routesSourceDir}/DinosaursRoutes.swift`, 'router.get("\\(basePath)/dinosaurs"')
              assert.fileContent(`${routesSourceDir}/PersonsRoutes.swift`, 'router.get("\\(basePath)/persons"')
            })
          })

          describe('client sdk download failure (host lookup error)', function () {
            var runContext
            var sdkScope
            var error

            before(function () {
              sdkScope = mockSDKGen.mockClientSDKDownloadFailure(applicationName)
              runContext = helpers.run(refreshGeneratorPath)
                                  .withOptions({
                                    specObj: {
                                      appType: 'scaffold',
                                      appName: applicationName,
                                      fromSwagger: inputSwaggerFile
                                    }
                                  })
              return runContext.toPromise().catch(function (err) {
                error = err.message
              })
            })

            after(function () {
              nock.cleanAll()
              runContext.cleanTestDirectory()
            })

            it('requested client sdk over http', function () {
              assert(sdkScope.isDone())
            })

            it('aborted the generator with an error', function () {
              assert(error, 'Should throw an error')
              assert(error.match(/Getting client SDK.*failed/), 'Thrown error should be about failing to download client SDK: ' + error)
            })
          })

          describe('client sdk generation failure', function () {
            var runContext
            var sdkScope
            var error

            before(function () {
              sdkScope = mockSDKGen.mockClientSDKGenerationFailure(applicationName)
              runContext = helpers.run(refreshGeneratorPath)
                                  .withOptions({
                                    specObj: {
                                      appType: 'scaffold',
                                      appName: applicationName,
                                      fromSwagger: inputSwaggerFile
                                    }
                                  })
              return runContext.toPromise().catch(function (err) {
                error = err.message
              })
            })

            after(function () {
              nock.cleanAll()
              runContext.cleanTestDirectory()
            })

            it('requested client sdk over http', function () {
              assert(sdkScope.isDone())
            })

            it('aborted the generator with an error', function () {
              assert(error, 'Should throw an error')
              assert(error.match(/SDK generator.*failed.*FAILED/), 'Thrown error should be about a service failure, it was: ' + error)
            })
          })

          describe('client sdk generation timeout', function () {
            var runContext
            var sdkScope
            var error

            before(function () {
              sdkScope = mockSDKGen.mockClientSDKGenerationTimeout(applicationName)
              runContext = helpers.run(refreshGeneratorPath)
                                  .withOptions({
                                    specObj: {
                                      appType: 'scaffold',
                                      appName: applicationName,
                                      fromSwagger: inputSwaggerFile
                                    }
                                  })
              return runContext.toPromise().catch(function (err) {
                error = err.message
              })
            })

            after(function () {
              nock.cleanAll()
              runContext.cleanTestDirectory()
            })

            it('requested client sdk over http', function () {
              assert(sdkScope.isDone())
            })

            it('aborted the generator with an error', function () {
              assert(error, 'Should throw an error')
              assert(error.match(/generate SDK.*timeout/), 'Thrown error should be about service timeout: ' + error)
            })
          })
        })

        describe('using example product swagger (yaml, no basepath)', function () {
          describe('base', function () {
            var runContext
            var sdkScope

            before(function () {
              sdkScope = mockSDKGen.mockClientSDKNetworkRequest(applicationName)
              runContext = helpers.run(refreshGeneratorPath)
                                  .withOptions({
                                    specObj: {
                                      appType: 'scaffold',
                                      appName: applicationName,
                                      hostSwagger: true,
                                      exampleEndpoints: true
                                    }
                                  })
              return runContext.toPromise()
            })

            after(function () {
              nock.cleanAll()
              runContext.cleanTestDirectory()
            })

            commonTest.itDidNotCreateSwaggerUIFiles()

            it('requested client sdk over http', function () {
              assert(sdkScope.isDone())
            })

            commonTest.itCreatedRoutes([
              'Products',
              'Swagger'
            ])

            it('cloudfoundry manifest defines OPENAPI_SPEC environment variable', function () {
              assert.fileContent(cloudFoundryManifestFile, 'OPENAPI_SPEC: "/swagger/api"')
            })

            it('created a swagger definition file', function () {
              assert.file(outputSwaggerFile)
            })

            it('application does not define base path', function () {
              assert.noFileContent(applicationSourceFile, 'basePath =')
            })

            it('swagger routes match definition', function () {
              var productsRoutesFile = `${routesSourceDir}/ProductsRoutes.swift`
              assert.fileContent([
                [ productsRoutesFile, 'router.get("/products"' ],
                [ productsRoutesFile, 'router.post("/products"' ],
                [ productsRoutesFile, 'router.get("/products/:id"' ],
                [ productsRoutesFile, 'router.delete("/products/:id"' ],
                [ productsRoutesFile, 'router.put("/products/:id"' ]
              ])
            })
          })

          describe('with swaggerui', function () {
            var runContext
            var sdkScope

            before(function () {
              sdkScope = mockSDKGen.mockClientSDKNetworkRequest(applicationName)
              runContext = helpers.run(refreshGeneratorPath)
                                  .withOptions({
                                    specObj: {
                                      appType: 'scaffold',
                                      appName: applicationName,
                                      hostSwagger: true,
                                      exampleEndpoints: true,
                                      swaggerUI: true
                                    }
                                  })
              return runContext.toPromise()
            })

            after(function () {
              nock.cleanAll()
              runContext.cleanTestDirectory()
            })

            it('requested client sdk over http', function () {
              assert(sdkScope.isDone())
            })

            commonTest.itCreatedSwaggerUIFiles()
          })
        })
      })

      describe('from http url', function () {
        describe('using dinosaur swagger (json, with basepath)', function () {
          var inputSwaggerFile = path.join(__dirname, '../resources/person_dino.json')

          var runContext
          var swaggerScope
          var sdkScope

          before(function () {
            swaggerScope = nock('http://dino.io')
              .get('/stuff')
              .replyWithFile(200, inputSwaggerFile)

            sdkScope = mockSDKGen.mockClientSDKNetworkRequest(applicationName)
            runContext = helpers.run(refreshGeneratorPath)
                                .withOptions({
                                  specObj: {
                                    appType: 'scaffold',
                                    appName: applicationName,
                                    fromSwagger: 'http://dino.io/stuff'
                                  }
                                })
            return runContext.toPromise()
          })

          after(function () {
            nock.cleanAll()
            runContext.cleanTestDirectory()
          })

          commonTest.itCreatedRoutes([
            'Dinosaurs',
            'Persons'
          ])

          it('requested swagger over http', function () {
            assert(swaggerScope.isDone())
          })

          it('requested client sdk over http', function () {
            assert(sdkScope.isDone())
          })

          it('created a swagger definition file', function () {
            assert.file(outputSwaggerFile)
          })

          it('application defines base path', function () {
            assert.fileContent(applicationSourceFile, 'basePath = "/basepath"')
          })

          it('swagger routes prepend base path', function () {
            assert.fileContent(`${routesSourceDir}/DinosaursRoutes.swift`, 'router.get("\\(basePath)/dinosaurs"')
            assert.fileContent(`${routesSourceDir}/PersonsRoutes.swift`, 'router.get("\\(basePath)/persons"')
          })
        })
      })

      describe('from invalid local file', function () {
        var inputSwaggerFile = path.join(__dirname, '../resources/invalid_swagger.json')

        var runContext
        var error

        before(function () {
          runContext = helpers.run(refreshGeneratorPath)
                              .withOptions({
                                specObj: {
                                  appType: 'scaffold',
                                  appName: applicationName,
                                  fromSwagger: inputSwaggerFile
                                }
                              })
          return runContext.toPromise().catch(function (err) {
            error = err.message
          })
        })

        after(function () {
          runContext.cleanTestDirectory()
        })

        it('aborted the generator with an error', function () {
          assert(error, 'Should throw an error')
          assert(error.match('does not conform to swagger specification'), 'Thrown error should be about invalid swagger, it was: ' + error)
        })
      })

      describe('from non-existent local file', function () {
        var runContext
        var error

        before(function () {
          runContext = helpers.run(refreshGeneratorPath)
                              .withOptions({
                                specObj: {
                                  appType: 'scaffold',
                                  appName: applicationName,
                                  fromSwagger: 'unknown_file_!£123'
                                }
                              })
          return runContext.toPromise().catch(function (err) {
            error = err.message
          })
        })

        after(function () {
          runContext.cleanTestDirectory()
        })

        it('aborted the generator with an error', function () {
          assert(error, 'Should throw an error')
          assert(error.match('unknown_file_!£123 doesn\'t exist'), 'Thrown error should be about invalid filename, it was: ' + error)
        })
      })

      describe('from non-existent path in url', function () {
        var runContext
        var sdkScope
        var error

        before(function () {
          // Simulate a 404 error
          sdkScope = nock('http://nothing')
                       .get('/here')
                       .reply(404)

          runContext = helpers.run(refreshGeneratorPath)
                              .withOptions({
                                specObj: {
                                  appType: 'scaffold',
                                  appName: applicationName,
                                  fromSwagger: 'http://nothing/here'
                                }
                              })
          return runContext.toPromise().catch(function (err) {
            error = err.message
          })
        })

        after(function () {
          nock.cleanAll()
          runContext.cleanTestDirectory()
        })

        it('requested server sdk over http', function () {
          assert(sdkScope.isDone())
        })

        it('aborted the generator with an error', function () {
          assert(error, 'Should throw an error')
          assert(error.match('failed to load swagger from: http://nothing/here status: 404'), 'Thrown error should be about 404 error, it was: ' + error)
        })
      })

      describe('from non-existent host in url', function () {
        var runContext
        var sdkScope
        var error

        before(function () {
          // Simulate a DNS lookup failure
          sdkScope = nock('http://nothing')
                       .get('/here')
                       .replyWithError({
                         'message': 'getaddrinfo ENOTFOUND nothing nothing:80',
                         'code': 'ENOTFOUND'
                       })

          runContext = helpers.run(refreshGeneratorPath)
                              .withOptions({
                                specObj: {
                                  appType: 'scaffold',
                                  appName: applicationName,
                                  fromSwagger: 'http://nothing/here'
                                }
                              })
          return runContext.toPromise().catch(function (err) {
            error = err.message
          })
        })

        after(function () {
          nock.cleanAll()
          runContext.cleanTestDirectory()
        })

        it('requested server sdk over http', function () {
          assert(sdkScope.isDone())
        })

        it('aborted the generator with an error', function () {
          assert(error, 'Should throw an error')
          assert(error.match(/ENOTFOUND.*nothing:80/), 'Thrown error should be about failure to resolve host in URL, it was: ' + error)
        })
      })
    })

    describe('with a service whose name contains a space', function () {
      var runContext

      before(function () {
        runContext = helpers.run(refreshGeneratorPath)
                            .withOptions({
                              specObj: {
                                appType: 'scaffold',
                                appName: applicationName,
                                services: {
                                  cloudant: [{ name: 'name with spaces' }]
                                }
                              }
                            })
        return runContext.toPromise()
      })

      after(function () {
        runContext.cleanTestDirectory()
      })

      commonTest.cloudant.itCreatedServiceFilesWithExpectedContent('name with spaces')
    })

    describe('with cloudant', function () {
      var runContext

      before(function () {
        runContext = helpers.run(refreshGeneratorPath)
                            .withOptions({
                              specObj: {
                                appType: 'scaffold',
                                appName: applicationName,
                                services: {
                                  cloudant: [{ name: 'myCloudantService' }]
                                }
                              }
                            })
        return runContext.toPromise()
      })

      after(function () {
        runContext.cleanTestDirectory()
      })

      commonTest.itCreatedServiceConfigFiles()

      commonTest.cloudant.itCreatedServiceFilesWithExpectedContent('myCloudantService')
    })

    describe('with autoscaling (implies metrics)', function () {
      var runContext

      before(function () {
        runContext = helpers.run(refreshGeneratorPath)
                            .withOptions({
                              specObj: {
                                appType: 'scaffold',
                                appName: applicationName,
                                services: {
                                  autoscaling: [{ name: 'myAutoscalingService' }]
                                }
                              }
                            })
        return runContext.toPromise()
      })

      after(function () {
        runContext.cleanTestDirectory()
      })

      commonTest.itCreatedMetricsFilesWithExpectedContent()

      commonTest.autoscaling.itCreatedServiceFilesWithExpectedContent('myAutoscalingService')
    })

    describe('with appid', function () {
      var runContext

      before(function () {
        runContext = helpers.run(refreshGeneratorPath)
                            .withOptions({
                              specObj: {
                                appType: 'scaffold',
                                appName: applicationName,
                                services: {
                                  appid: [{ name: 'myAppidService' }]
                                }
                              }
                            })
        return runContext.toPromise()
      })

      after(function () {
        runContext.cleanTestDirectory()
      })

      commonTest.itCreatedServiceConfigFiles()

      commonTest.appid.itCreatedServiceFilesWithExpectedContent('myAppidService')
    })

    describe('with watson conversation', function () {
      var runContext

      before(function () {
        runContext = helpers.run(refreshGeneratorPath)
                            .withOptions({
                              specObj: {
                                appType: 'scaffold',
                                appName: applicationName,
                                services: {
                                  watsonconversation: [{ name: 'myConversationService' }]
                                }
                              }
                            })
        return runContext.toPromise()
      })

      after(function () {
        runContext.cleanTestDirectory()
      })

      commonTest.itCreatedServiceConfigFiles()

      commonTest.watsonconversation.itCreatedServiceFilesWithExpectedContent('myConversationService')
    })

    describe('with push notificiations', function () {
      var runContext

      before(function () {
        runContext = helpers.run(refreshGeneratorPath)
                            .withOptions({
                              specObj: {
                                appType: 'scaffold',
                                appName: applicationName,
                                services: {
                                  pushnotifications: [{ name: 'myPushService' }]
                                }
                              }
                            })
        return runContext.toPromise()
      })

      after(function () {
        runContext.cleanTestDirectory()
      })

      commonTest.itCreatedServiceConfigFiles()

      commonTest.pushnotifications.itCreatedServiceFilesWithExpectedContent('myPushService')
    })

    describe('with alert notification', function () {
      var runContext

      before(function () {
        runContext = helpers.run(refreshGeneratorPath)
                            .withOptions({
                              specObj: {
                                appType: 'scaffold',
                                appName: applicationName,
                                services: {
                                  alertnotification: [{ name: 'myAlertService' }]
                                }
                              }
                            })
        return runContext.toPromise()
      })

      after(function () {
        runContext.cleanTestDirectory()
      })

      commonTest.itCreatedServiceConfigFiles()

      commonTest.alertnotification.itCreatedServiceFilesWithExpectedContent('myAlertService')
    })

    describe('with object storage', function () {
      var runContext

      before(function () {
        runContext = helpers.run(refreshGeneratorPath)
                            .withOptions({
                              specObj: {
                                appType: 'scaffold',
                                appName: applicationName,
                                services: {
                                  objectstorage: [{ name: 'myObjectStorageService' }]
                                }
                              }
                            })
        return runContext.toPromise()
      })

      after(function () {
        runContext.cleanTestDirectory()
      })

      commonTest.itCreatedServiceConfigFiles()

      commonTest.objectstorage.itCreatedServiceFilesWithExpectedContent('myObjectStorageService')
    })

    describe('with redis', function () {
      var runContext

      before(function () {
        runContext = helpers.run(refreshGeneratorPath)
                            .withOptions({
                              specObj: {
                                appType: 'scaffold',
                                appName: applicationName,
                                services: {
                                  redis: [{ name: 'myRedisService' }]
                                }
                              }
                            })
        return runContext.toPromise()
      })

      after(function () {
        runContext.cleanTestDirectory()
      })

      commonTest.itCreatedServiceConfigFiles()

      commonTest.redis.itCreatedServiceFilesWithExpectedContent('myRedisService')
    })

    describe('with mongodb', function () {
      var runContext

      before(function () {
        runContext = helpers.run(refreshGeneratorPath)
                            .withOptions({
                              specObj: {
                                appType: 'scaffold',
                                appName: applicationName,
                                services: {
                                  mongodb: [{ name: 'myMongoDBService' }]
                                }
                              }
                            })
        return runContext.toPromise()
      })

      after(function () {
        runContext.cleanTestDirectory()
      })

      commonTest.itCreatedServiceConfigFiles()

      commonTest.mongodb.itCreatedServiceFilesWithExpectedContent('myMongoDBService')
    })
  })
})
