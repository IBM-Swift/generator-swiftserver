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

var appGeneratorPath = path.join(__dirname, '../../app')
var commonTest = require('../lib/common_test.js')

// Subgenerators to be stubbed
var dependentGenerators = [
  [helpers.createDummyGenerator(), 'swiftserver:refresh'],
  [helpers.createDummyGenerator(), 'swiftserver:build']
]

function itCreatedSpecWithServicesAndCapabilities (optsGenerator) {
  it('created a spec object containing the expected config', function () {
    var opts = optsGenerator()
    var runContext = opts.runContext
    var appType = opts.appType
    var appName = opts.appName
    var capabilities = opts.capabilities
    var services = opts.services
    var crudservice = opts.crudservice
    var fromSwagger = opts.fromSwagger

    function hasCapability (name) {
      return (capabilities.indexOf(name) !== -1)
    }

    var spec = runContext.generator.spec
    var expectedSpec = {
      appName: appName,
      appType: appType,
      docker: hasCapability('docker') || undefined,
      metrics: hasCapability('metrics') || undefined,
      web: hasCapability('web') || undefined,
      exampleEndpoints: hasCapability('exampleEndpoints') || undefined,
      hostSwagger: hasCapability('hostSwagger') || undefined,
      swaggerUI: hasCapability('swaggerUI') || undefined,
      fromSwagger: fromSwagger || undefined,
      serverSwaggerFiles: undefined,
      services: {},
      crudservice: crudservice || undefined
    }
    // deal with services
    Object.keys(services).forEach(serviceType => {
      var expectedService = { credentials: {} }
      if (services[serviceType].name) {
        expectedService.name = services[serviceType].name
      }
      if (services[serviceType].credentials) {
        expectedService.credentials = services[serviceType].credentials
      }
      expectedSpec.services[serviceType] = [expectedService]
    })
    assert.objectContent(spec, expectedSpec)

    // keep this test relevant by ensuring all key set by the
    // app generator are tested (ie there is no key in spec that
    // is not in expectedSpec)
    var unexpectedKeys = Object.keys(spec).filter(key => !expectedSpec.hasOwnProperty(key))
    assert.deepEqual(unexpectedKeys, [], 'unexpected properties in spec, test may be out of date')
  })
}

describe('Unit tests for swiftserver:app', function () {
  describe('no application name or directory (should default to current dir)', function () {
    var runContext

    before(function () {
      runContext = helpers.run(appGeneratorPath)
                          .withGenerators(dependentGenerators) // Stub subgenerators
                          .inTmpDir(function (tmpDir) {
                            // Run the test inside a directory with a known name
                            // we can use to check against later (since the test
                            // dir has a randomly generated name)
                            this.inDir(path.join(tmpDir, 'appDir'))
                          })
                          .withOptions({ testmode: true })     // Workaround to stub subgenerators
      return runContext.toPromise()
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    commonTest.itUsedDestinationDirectory('appDir')

    it('created a spec object with appName defaulted to current dir and no appDir', function () {
      var spec = runContext.generator.spec
      var expectedSpec = {
        appName: 'appDir',
        appDir: undefined
      }
      assert.objectContent(spec, expectedSpec)
    })
  })

  describe('application name and directory name are the same', function () {
    var runContext

    before(function () {
      runContext = helpers.run(appGeneratorPath)
                          .withGenerators(dependentGenerators) // Stub subgenerators
                          .withOptions({ testmode: true })     // Workaround to stub subgenerators
                          .withPrompts({
                            name: 'notes',
                            dir: 'notes'
                          })
      return runContext.toPromise()
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    commonTest.itUsedDestinationDirectory('notes')

    it('created a spec object with correct appName and no appDir', function () {
      var spec = runContext.generator.spec
      var expectedSpec = {
        appName: 'notes',
        appDir: undefined
      }
      assert.objectContent(spec, expectedSpec)
    })
  })

  describe('application name matches current directory, no directory supplied', function () {
    var runContext

    before(function () {
      runContext = helpers.run(appGeneratorPath)
                          .withGenerators(dependentGenerators) // Stub subgenerators
                          .inTmpDir(function (tmpDir) {
                            // Run the test inside a directory with a known name
                            // we can use to check against later (since the test
                            // dir has a randomly generated name)
                            this.inDir(path.join(tmpDir, 'notes'))
                          })
                          .withOptions({ testmode: true })     // Workaround to stub subgenerators
                          .withPrompts({
                            name: 'notes'
                          })
      return runContext.toPromise()
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    commonTest.itUsedDestinationDirectory('notes')

    it('uses current directory not create a new one inside', function () {
      assert.notEqual(path.basename(path.dirname(process.cwd())), 'notes')
    })

    it('created a spec object with appName defaulted to current dir and no appDir', function () {
      var spec = runContext.generator.spec
      var expectedSpec = {
        appName: 'notes',
        appDir: undefined
      }
      assert.objectContent(spec, expectedSpec)
    })
  })

  describe('application name and directory name are not the same', function () {
    var runContext

    before(function () {
      runContext = helpers.run(appGeneratorPath)
                          .withGenerators(dependentGenerators)
                          .withOptions({ testmode: true })
                          .withPrompts({
                            name: 'applicationName',
                            dir: 'directoryName'
                          })
      return runContext.toPromise()
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    commonTest.itUsedDestinationDirectory('directoryName')

    it('created a spec object with correct appName and no appDir', function () {
      var spec = runContext.generator.spec
      var expectedSpec = {
        appName: 'applicationName',
        appDir: undefined
      }
      assert.objectContent(spec, expectedSpec)
    })
  })

  describe('application directory is .', function () {
    var runContext

    before(function () {
      runContext = helpers.run(appGeneratorPath)
                          .withGenerators(dependentGenerators)
                          .inTmpDir(function (tmpDir) {
                            this.inDir(path.join(tmpDir, 'appDir'))
                          })
                          .withOptions({ testmode: true })
                          .withPrompts({
                            name: 'applicationName',
                            dir: '.'
                          })
      return runContext.toPromise()
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    commonTest.itUsedDestinationDirectory('appDir')

    it('uses current directory not create a new one inside', function () {
      assert.notEqual(path.basename(path.dirname(process.cwd())), 'notes')
    })

    it('created a spec object with correct appName and no appDir', function () {
      var spec = runContext.generator.spec
      var expectedSpec = {
        appName: 'applicationName',
        appDir: undefined
      }
      assert.objectContent(spec, expectedSpec)
    })
  })

  describe('application directory is not empty', function () {
    describe('current directory', function () {
      var runContext
      var error = null

      before(function () {
        runContext = helpers.run(appGeneratorPath)
                            .withGenerators(dependentGenerators)
                            .inTmpDir(function (tmpDir) {
                              var tmpFile = path.join(tmpDir, 'non_empty.txt')
                              fs.writeFileSync(tmpFile, '')
                            })
                            .withOptions({ testmode: true })
        return runContext.toPromise().catch(function (err) {
          error = err
        })
      })

      after(function () {
        runContext.cleanTestDirectory()
      })

      it('aborted the generator with an error', function () {
        assert(error, 'Should throw an error')
        assert(error.message.match('is not an empty directory'), 'Thrown error should be about directory not being empty, it was: ' + error)
      })
    })

    describe('new directory', function () {
      var runContext
      var error = null

      before(function () {
        runContext = helpers.run(appGeneratorPath)
                            .withGenerators(dependentGenerators)
                            .inTmpDir(function (tmpDir) {
                              fs.mkdirSync(path.join(tmpDir, 'newDir'))
                              var tmpFile = path.join(tmpDir, 'newDir', 'non_empty.txt')
                              fs.writeFileSync(tmpFile, '')
                            })
                            .withOptions({ testmode: true })
                            .withPrompts({
                              name: 'notes',
                              dir: 'newDir'
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
        assert(error.message.match('is not an empty directory'), 'Thrown error should be about directory not being empty, it was: ' + error)
      })
    })

    describe('existing project directory', function () {
      var runContext
      var error = null

      before(function () {
        runContext = helpers.run(appGeneratorPath)
                            .withGenerators(dependentGenerators)
                            .inTmpDir(function (tmpDir) {
                              var tmpFile = path.join(tmpDir, commonTest.projectMarkerFile)
                              fs.writeFileSync(tmpFile, '')
                            })
                            .withOptions({ testmode: true })
        return runContext.toPromise().catch(function (err) {
          error = err
        })
      })

      after(function () {
        runContext.cleanTestDirectory()
      })

      it('aborted the generator with an error', function () {
        assert(error, 'Should throw an error')
        assert(error.message.match('is already a Swift Server Generator project directory'), 'Thrown error should be about directory being an existing project, it was: ' + error)
      })
    })
  })

  describe('application name supplied as option (not prompt)', function () {
    var runContext

    before(function () {
      runContext = helpers.run(appGeneratorPath)
                          .withGenerators(dependentGenerators)
                          .withOptions({ testmode: true })
                          .withArguments([ 'nameFromOption' ])
      return runContext.toPromise()
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    commonTest.itUsedDestinationDirectory('nameFromOption')

    it('created a spec object with correct appName and no appDir', function () {
      var spec = runContext.generator.spec
      var expectedSpec = {
        appName: 'nameFromOption',
        appDir: undefined
      }
      assert.objectContent(spec, expectedSpec)
    })
  })

  describe('invalid application name supplied as option', function () {
    describe('in dir with valid name', function () {
      var runContext

      before(function () {
        runContext = helpers.run(appGeneratorPath)
                            .withGenerators(dependentGenerators)
                            .inTmpDir(function (tmpDir) {
                              this.inDir(path.join(tmpDir, 'validDir'))
                            })
                            .withOptions({ testmode: true })
                            .withArguments(['inva&%*lid'])
        return runContext.toPromise()
      })

      after(function () {
        runContext.cleanTestDirectory()
      })

      commonTest.itUsedDestinationDirectory('validDir')

      it('created a spec object with appName defaulting to dir and no appDir', function () {
        var spec = runContext.generator.spec
        var expectedSpec = {
          appName: 'validDir',
          appDir: undefined
        }
        assert.objectContent(spec, expectedSpec)
      })
    })

    describe('in dir with invalid and sanitizable name', function () {
      var runContext

      before(function () {
        runContext = helpers.run(appGeneratorPath)
                            .withGenerators(dependentGenerators)
                            .inTmpDir(function (tmpDir) {
                              this.inDir(path.join(tmpDir, 'inv@l+l%l:l.lid'))
                            })
                            .withOptions({ testmode: true })
                            .withArguments(['inva&%*lid'])
        return runContext.toPromise()
      })

      after(function () {
        runContext.cleanTestDirectory()
      })

      commonTest.itUsedDestinationDirectory('inv-l-l-l-l-lid')

      it('created a spec object with appName defaulting to dir and no appDir', function () {
        var spec = runContext.generator.spec
        var expectedSpec = {
          appName: 'inv-l-l-l-l-lid',
          appDir: undefined
        }
        assert.objectContent(spec, expectedSpec)
      })
    })

    describe('in dir with invalid and unsanitizable name', function () {
      var runContext

      before(function () {
        runContext = helpers.run(appGeneratorPath)
                            .withGenerators(dependentGenerators)
                            .inTmpDir(function (tmpDir) {
                              this.inDir(path.join(tmpDir, 'inva&%*lid'))
                            })
                            .withOptions({ testmode: true })
                            .withArguments(['inva&%*lid'])
        return runContext.toPromise()
      })

      after(function () {
        runContext.cleanTestDirectory()
      })

      commonTest.itUsedDestinationDirectory('app')

      it('created a spec object with appName defaulting to dir and no appDir', function () {
        var spec = runContext.generator.spec
        var expectedSpec = {
          appName: 'app',
          appDir: undefined
        }
        assert.objectContent(spec, expectedSpec)
      })
    })
  })

  describe('application name only, all other answers default', function () {
    var runContext

    before(function () {
      runContext = helpers.run(appGeneratorPath)
                          .withGenerators(dependentGenerators) // Stub subgenerators
                          .withOptions({ testmode: true })     // Workaround to stub subgenerators
                          .withPrompts({ name: 'notes' })
      return runContext.toPromise()
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    commonTest.itUsedDestinationDirectory('notes')

    itCreatedSpecWithServicesAndCapabilities(() => ({
      runContext: runContext,
      appType: 'scaffold',
      appName: 'notes',
      capabilities: [ 'docker', 'metrics' ],
      services: {}
    }))
  })

  describe('scaffold', function () {
    var applicationName = 'myapp'

    describe('base', function () {
      var runContext

      before(function () {
        runContext = helpers.run(appGeneratorPath)
                            .withGenerators(dependentGenerators) // Stub subgenerators
                            .withOptions({ testmode: true })     // Workaround to stub subgenerators
                            .withPrompts({
                              name: applicationName,
                              appType: 'Scaffold a starter',
                              capabilities: [],
                              endpoints: []
                            })
        return runContext.toPromise()
      })

      after(function () {
        runContext.cleanTestDirectory()
      })

      itCreatedSpecWithServicesAndCapabilities(() => ({
        runContext: runContext,
        appType: 'scaffold',
        appName: applicationName,
        capabilities: [],
        services: {}
      }))
    })

    describe('app pattern defaults', function () {
      describe('basic', function () {
        var runContext

        before(function () {
          runContext = helpers.run(appGeneratorPath)
                              .withGenerators(dependentGenerators) // Stub subgenerators
                              .withOptions({ testmode: true })     // Workaround to stub subgenerators
                              .withPrompts({
                                name: applicationName,
                                appType: 'Scaffold a starter',
                                appPattern: 'Basic'
                              })
          return runContext.toPromise()
        })

        after(function () {
          runContext.cleanTestDirectory()
        })

        itCreatedSpecWithServicesAndCapabilities(() => ({
          runContext: runContext,
          appType: 'scaffold',
          appName: applicationName,
          capabilities: [ 'docker', 'metrics' ],
          services: {}
        }))
      })

      describe('web', function () {
        var runContext

        before(function () {
          runContext = helpers.run(appGeneratorPath)
                              .withGenerators(dependentGenerators) // Stub subgenerators
                              .withOptions({ testmode: true })     // Workaround to stub subgenerators
                              .withPrompts({
                                name: applicationName,
                                appType: 'Scaffold a starter',
                                appPattern: 'Web'
                              })
          return runContext.toPromise()
        })

        after(function () {
          runContext.cleanTestDirectory()
        })

        itCreatedSpecWithServicesAndCapabilities(() => ({
          runContext: runContext,
          appType: 'scaffold',
          appName: applicationName,
          capabilities: [ 'docker', 'metrics', 'web' ],
          services: {}
        }))
      })

      describe('bff', function () {
        var runContext

        before(function () {
          runContext = helpers.run(appGeneratorPath)
                              .withGenerators(dependentGenerators) // Stub subgenerators
                              .withOptions({ testmode: true })     // Workaround to stub subgenerators
                              .withPrompts({
                                name: applicationName,
                                appType: 'Scaffold a starter',
                                appPattern: 'Backend for frontend',
                                swaggerChoice: 'Example swagger file'
                              })
          return runContext.toPromise()
        })

        after(function () {
          runContext.cleanTestDirectory()
        })

        itCreatedSpecWithServicesAndCapabilities(() => ({
          runContext: runContext,
          appType: 'scaffold',
          appName: applicationName,
          capabilities: [ 'docker', 'metrics', 'web', 'hostSwagger', 'swaggerUI', 'exampleEndpoints' ],
          services: {}
        }))
      })
    })

    describe('with web', function () {
      var runContext

      before(function () {
        runContext = helpers.run(appGeneratorPath)
                            .withGenerators(dependentGenerators) // Stub subgenerators
                            .withOptions({ testmode: true })     // Workaround to stub subgenerators
                            .withPrompts({
                              name: applicationName,
                              appType: 'Scaffold a starter',
                              capabilities: [ 'Static web file serving' ],
                              endpoints: []
                            })
        return runContext.toPromise()
      })

      after(function () {
        runContext.cleanTestDirectory()
      })

      itCreatedSpecWithServicesAndCapabilities(() => ({
        runContext: runContext,
        appType: 'scaffold',
        appName: applicationName,
        capabilities: [ 'web' ],
        services: {}
      }))
    })

    describe('with metrics', function () {
      var runContext

      before(function () {
        runContext = helpers.run(appGeneratorPath)
                            .withGenerators(dependentGenerators) // Stub subgenerators
                            .withOptions({ testmode: true })     // Workaround to stub subgenerators
                            .withPrompts({
                              name: applicationName,
                              appType: 'Scaffold a starter',
                              capabilities: [ 'Embedded metrics dashboard' ],
                              endpoints: []
                            })
        return runContext.toPromise()
      })

      after(function () {
        runContext.cleanTestDirectory()
      })

      itCreatedSpecWithServicesAndCapabilities(() => ({
        runContext: runContext,
        appType: 'scaffold',
        appName: applicationName,
        capabilities: [ 'metrics' ],
        services: {}
      }))
    })

    describe('with docker', function () {
      var runContext

      before(function () {
        runContext = helpers.run(appGeneratorPath)
                            .withGenerators(dependentGenerators) // Stub subgenerators
                            .withOptions({ testmode: true })     // Workaround to stub subgenerators
                            .withPrompts({
                              name: applicationName,
                              appType: 'Scaffold a starter',
                              capabilities: [ 'Docker files' ],
                              endpoints: []
                            })
        return runContext.toPromise()
      })

      after(function () {
        runContext.cleanTestDirectory()
      })

      itCreatedSpecWithServicesAndCapabilities(() => ({
        runContext: runContext,
        appType: 'scaffold',
        appName: applicationName,
        capabilities: [ 'docker' ],
        services: {}
      }))
    })

    describe('with swaggerui', function () {
      var runContext

      before(function () {
        runContext = helpers.run(appGeneratorPath)
                            .withGenerators(dependentGenerators) // Stub subgenerators
                            .withOptions({ testmode: true })     // Workaround to stub subgenerators
                            .withPrompts({
                              name: applicationName,
                              appType: 'Scaffold a starter',
                              capabilities: [ 'Swagger UI' ],
                              endpoints: []
                            })
        return runContext.toPromise()
      })

      after(function () {
        runContext.cleanTestDirectory()
      })

      itCreatedSpecWithServicesAndCapabilities(() => ({
        runContext: runContext,
        appType: 'scaffold',
        appName: applicationName,
        capabilities: [ 'swaggerUI' ],
        services: {}
      }))
    })

    describe('with swagger file serving endpoint', function () {
      var runContext

      before(function () {
        runContext = helpers.run(appGeneratorPath)
                            .withGenerators(dependentGenerators) // Stub subgenerators
                            .withOptions({ testmode: true })     // Workaround to stub subgenerators
                            .withPrompts({
                              name: applicationName,
                              appType: 'Scaffold a starter',
                              capabilities: [],
                              endpoints: [ 'Swagger file serving endpoint' ]
                            })
        return runContext.toPromise()
      })

      after(function () {
        runContext.cleanTestDirectory()
      })

      itCreatedSpecWithServicesAndCapabilities(() => ({
        runContext: runContext,
        appType: 'scaffold',
        appName: applicationName,
        capabilities: [ 'hostSwagger' ],
        services: {}
      }))
    })

    describe('with endpoints from swagger file', function () {
      describe('example swagger file', function () {
        var runContext

        before(function () {
          runContext = helpers.run(appGeneratorPath)
                              .withGenerators(dependentGenerators) // Stub subgenerators
                              .withOptions({ testmode: true })     // Workaround to stub subgenerators
                              .withPrompts({
                                name: applicationName,
                                appType: 'Scaffold a starter',
                                capabilities: [],
                                endpoints: [ 'Endpoints from swagger file' ],
                                swaggerChoice: 'Example swagger file'
                              })
          return runContext.toPromise()
        })

        after(function () {
          runContext.cleanTestDirectory()
        })

        itCreatedSpecWithServicesAndCapabilities(() => ({
          runContext: runContext,
          appType: 'scaffold',
          appName: applicationName,
          capabilities: [ 'exampleEndpoints' ],
          services: {}
        }))
      })

      describe('custom swagger file', function () {
        describe('from local file', function () {
          describe('absolute path', function () {
            var runContext

            before(function () {
              runContext = helpers.run(appGeneratorPath)
                                  .withGenerators(dependentGenerators) // Stub subgenerators
                                  .withOptions({ testmode: true })     // Workaround to stub subgenerators
                                  .withPrompts({
                                    name: applicationName,
                                    appType: 'Scaffold a starter',
                                    capabilities: [],
                                    endpoints: [ 'Endpoints from swagger file' ],
                                    swaggerChoice: 'Custom swagger file',
                                    path: '/absolute/path/to/my/swagger/file.json'
                                  })
              return runContext.toPromise()
            })

            after(function () {
              runContext.cleanTestDirectory()
            })

            itCreatedSpecWithServicesAndCapabilities(() => ({
              runContext: runContext,
              appType: 'scaffold',
              appName: applicationName,
              capabilities: [],
              services: {},
              fromSwagger: '/absolute/path/to/my/swagger/file.json'
            }))
          })

          describe('relative path', function () {
            var runContext
            var destinationDir

            before(function () {
              runContext = helpers.run(appGeneratorPath)
                                  .withGenerators(dependentGenerators) // Stub subgenerators
                                  .inTmpDir(function (tmpDir) {
                                    destinationDir = tmpDir
                                  })
                                  .withOptions({ testmode: true })     // Workaround to stub subgenerators
                                  .withPrompts({
                                    name: applicationName,
                                    dir: 'appDir',
                                    appType: 'Scaffold a starter',
                                    capabilities: [],
                                    endpoints: [ 'Endpoints from swagger file' ],
                                    swaggerChoice: 'Custom swagger file',
                                    path: 'relative/path/to/my/swagger/file.json'
                                  })
              return runContext.toPromise()
            })

            after(function () {
              runContext.cleanTestDirectory()
            })

            itCreatedSpecWithServicesAndCapabilities(() => ({
              runContext: runContext,
              appType: 'scaffold',
              appName: applicationName,
              capabilities: [],
              services: {},
              fromSwagger: `${destinationDir}/relative/path/to/my/swagger/file.json`
            }))
          })
        })

        describe('from http url', function () {
          var runContext

          before(function () {
            runContext = helpers.run(appGeneratorPath)
                                .withGenerators(dependentGenerators) // Stub subgenerators
                                .withOptions({ testmode: true })     // Workaround to stub subgenerators
                                .withPrompts({
                                  name: applicationName,
                                  appType: 'Scaffold a starter',
                                  capabilities: [],
                                  endpoints: [ 'Endpoints from swagger file' ],
                                  swaggerChoice: 'Custom swagger file',
                                  path: 'http://dino.io/stuff'
                                })
            return runContext.toPromise()
          })

          after(function () {
            runContext.cleanTestDirectory()
          })

          itCreatedSpecWithServicesAndCapabilities(() => ({
            runContext: runContext,
            appType: 'scaffold',
            appName: applicationName,
            capabilities: [],
            services: {},
            fromSwagger: 'http://dino.io/stuff'
          }))
        })
      })
    })

    // TODO with server sdk

    describe('with cloudant', function () {
      describe('default credentials', function () {
        var runContext

        before(function () {
          runContext = helpers.run(appGeneratorPath)
                              .withGenerators(dependentGenerators)
                              .withOptions({ testmode: true })
                              .withPrompts({
                                name: applicationName,
                                appType: 'Scaffold a starter',
                                capabilities: [],
                                services: [ 'Cloudant / CouchDB' ]
                              })
          return runContext.toPromise()
        })

        after(function () {
          runContext.cleanTestDirectory()
        })

        itCreatedSpecWithServicesAndCapabilities(() => ({
          runContext: runContext,
          appType: 'scaffold',
          appName: applicationName,
          capabilities: [],
          services: { cloudant: {} }
        }))
      })

      describe('non-default credentials', function () {
        describe('without username and password', function () {
          var runContext

          before(function () {
            runContext = helpers.run(appGeneratorPath)
                                .withGenerators(dependentGenerators)
                                .withOptions({ testmode: true })
                                .withPrompts({
                                  name: applicationName,
                                  appType: 'Scaffold a starter',
                                  capabilities: [],
                                  services: [ 'Cloudant / CouchDB' ],
                                  configure: [ 'Cloudant / CouchDB' ],
                                  cloudantName: 'myCloudantService',
                                  cloudantHost: 'cloudanthost',
                                  cloudantPort: 4568,
                                  cloudantSecured: true
                                })
            return runContext.toPromise()
          })

          after(function () {
            runContext.cleanTestDirectory()
          })

          itCreatedSpecWithServicesAndCapabilities(() => ({
            runContext: runContext,
            appType: 'scaffold',
            appName: applicationName,
            capabilities: [],
            services: {
              'cloudant': {
                name: 'myCloudantService',
                credentials: {
                  host: 'cloudanthost',
                  port: 4568,
                  secured: true
                }
              }
            }
          }))
        })

        describe('with username and password', function () {
          var runContext

          before(function () {
            runContext = helpers.run(appGeneratorPath)
                                .withGenerators(dependentGenerators)
                                .withOptions({ testmode: true })
                                .withPrompts({
                                  name: applicationName,
                                  appType: 'Scaffold a starter',
                                  capabilities: [],
                                  services: [ 'Cloudant / CouchDB' ],
                                  configure: [ 'Cloudant / CouchDB' ],
                                  cloudantName: 'myCloudantService',
                                  cloudantHost: 'cloudanthost',
                                  cloudantPort: 4568,
                                  cloudantSecured: true,
                                  cloudantUsername: 'admin',
                                  cloudantPassword: 'password123'
                                })
            return runContext.toPromise()
          })

          after(function () {
            runContext.cleanTestDirectory()
          })

          itCreatedSpecWithServicesAndCapabilities(() => ({
            runContext: runContext,
            appType: 'scaffold',
            appName: applicationName,
            capabilities: [],
            services: {
              cloudant: {
                name: 'myCloudantService',
                credentials: {
                  host: 'cloudanthost',
                  port: 4568,
                  secured: true,
                  username: 'admin',
                  password: 'password123'
                }
              }
            }
          }))
        })
      })
    })

    describe('with redis', function () {
      describe('default credentials', function () {
        var runContext

        before(function () {
          runContext = helpers.run(appGeneratorPath)
                              .withGenerators(dependentGenerators)
                              .withOptions({ testmode: true })
                              .withPrompts({
                                name: applicationName,
                                appType: 'Scaffold a starter',
                                capabilities: [],
                                services: [ 'Redis' ]
                              })
          return runContext.toPromise()
        })

        after(function () {
          runContext.cleanTestDirectory()
        })

        itCreatedSpecWithServicesAndCapabilities(() => ({
          runContext: runContext,
          appType: 'scaffold',
          appName: applicationName,
          capabilities: [],
          services: { redis: {} }
        }))
      })

      describe('non-default credentials', function () {
        var runContext

        before(function () {
          runContext = helpers.run(appGeneratorPath)
                              .withGenerators(dependentGenerators)
                              .withOptions({ testmode: true })
                              .withPrompts({
                                name: applicationName,
                                appType: 'Scaffold a starter',
                                capabilities: [],
                                services: [ 'Redis' ],
                                configure: [ 'Redis' ],
                                redisName: 'myRedisService',
                                redisHost: 'myhost',
                                redisPort: '1234',
                                redisPassword: 'password1234'
                              })
          return runContext.toPromise()
        })

        after(function () {
          runContext.cleanTestDirectory()
        })

        itCreatedSpecWithServicesAndCapabilities(() => ({
          runContext: runContext,
          appType: 'scaffold',
          appName: applicationName,
          capabilities: [],
          services: {
            redis: {
              name: 'myRedisService',
              credentials: {
                host: 'myhost',
                port: 1234,
                password: 'password1234'
              }
            }
          }
        }))
      })
    })

    describe('with mongodb', function () {
      describe('default credentials', function () {
        var runContext

        before(function () {
          runContext = helpers.run(appGeneratorPath)
                              .withGenerators(dependentGenerators)
                              .withOptions({ testmode: true })
                              .withPrompts({
                                name: applicationName,
                                appType: 'Scaffold a starter',
                                capabilities: [],
                                services: [ 'MongoDB' ]
                              })
          return runContext.toPromise()
        })

        after(function () {
          runContext.cleanTestDirectory()
        })

        itCreatedSpecWithServicesAndCapabilities(() => ({
          runContext: runContext,
          appType: 'scaffold',
          appName: applicationName,
          capabilities: [],
          services: { mongodb: {} }
        }))
      })

      describe('non-default credentials', function () {
        var runContext

        before(function () {
          runContext = helpers.run(appGeneratorPath)
                              .withGenerators(dependentGenerators)
                              .withOptions({ testmode: true })
                              .withPrompts({
                                name: applicationName,
                                appType: 'Scaffold a starter',
                                capabilities: [],
                                services: [ 'MongoDB' ],
                                configure: [ 'MongoDB' ],
                                mongodbName: 'myMongoService',
                                mongodbHost: 'myhost',
                                mongodbPort: '1234',
                                mongodbPassword: 'password1234',
                                mongodbDatabase: 'mydb'
                              })
          return runContext.toPromise()
        })

        after(function () {
          runContext.cleanTestDirectory()
        })

        itCreatedSpecWithServicesAndCapabilities(() => ({
          runContext: runContext,
          appType: 'scaffold',
          appName: applicationName,
          capabilities: [],
          services: {
            mongodb: {
              name: 'myMongoService',
              credentials: {
                host: 'myhost',
                port: 1234,
                password: 'password1234',
                database: 'mydb'
              }
            }
          }
        }))
      })
    })

    describe('with object storage', function () {
      describe('default credentials', function () {
        var runContext

        before(function () {
          runContext = helpers.run(appGeneratorPath)
                              .withGenerators(dependentGenerators)
                              .withOptions({ testmode: true })
                              .withPrompts({
                                name: applicationName,
                                appType: 'Scaffold a starter',
                                capabilities: [],
                                services: [ 'Object Storage' ]
                              })
          return runContext.toPromise()
        })

        after(function () {
          runContext.cleanTestDirectory()
        })

        itCreatedSpecWithServicesAndCapabilities(() => ({
          runContext: runContext,
          appType: 'scaffold',
          appName: applicationName,
          capabilities: [],
          services: { objectstorage: {} }
        }))
      })

      describe('non-default credentials', function () {
        var runContext

        before(function () {
          runContext = helpers.run(appGeneratorPath)
                              .withGenerators(dependentGenerators)
                              .withOptions({ testmode: true })
                              .withPrompts({
                                name: applicationName,
                                appType: 'Scaffold a starter',
                                capabilities: [],
                                services: [ 'Object Storage' ],
                                configure: [ 'Object Storage' ],
                                objectstorageName: 'myObjectStorageService',
                                objectstorageRegion: 'dallas',
                                objectstorageProjectId: 'myProjectId',
                                objectstorageUserId: 'admin',
                                objectstoragePassword: 'password1234'
                              })
          return runContext.toPromise()
        })

        after(function () {
          runContext.cleanTestDirectory()
        })

        itCreatedSpecWithServicesAndCapabilities(() => ({
          runContext: runContext,
          appType: 'scaffold',
          appName: applicationName,
          capabilities: [],
          services: {
            objectstorage: {
              name: 'myObjectStorageService',
              credentials: {
                region: 'dallas',
                projectId: 'myProjectId',
                userId: 'admin',
                password: 'password1234'
              }
            }
          }
        }))
      })
    })

    describe('with appid', function () {
      describe('default credentials', function () {
        var runContext

        before(function () {
          runContext = helpers.run(appGeneratorPath)
                              .withGenerators(dependentGenerators)
                              .withOptions({ testmode: true })
                              .withPrompts({
                                name: applicationName,
                                appType: 'Scaffold a starter',
                                capabilities: [],
                                services: [ 'AppID' ]
                              })
          return runContext.toPromise()
        })

        after(function () {
          runContext.cleanTestDirectory()
        })

        itCreatedSpecWithServicesAndCapabilities(() => ({
          runContext: runContext,
          appType: 'scaffold',
          appName: applicationName,
          capabilities: [],
          services: { appid: {} }
        }))
      })

      describe('non-default credentials', function () {
        var runContext

        before(function () {
          runContext = helpers.run(appGeneratorPath)
                              .withGenerators(dependentGenerators)
                              .withOptions({ testmode: true })
                              .withPrompts({
                                name: applicationName,
                                appType: 'Scaffold a starter',
                                capabilities: [],
                                services: [ 'AppID' ],
                                configure: [ 'AppID' ],
                                appIDName: 'myAppIDService',
                                appidTenantId: 'myTenantId',
                                appidClientId: 'myClientId',
                                appidSecret: 'mySecret'
                              })
          return runContext.toPromise()
        })

        after(function () {
          runContext.cleanTestDirectory()
        })

        itCreatedSpecWithServicesAndCapabilities(() => ({
          runContext: runContext,
          appType: 'scaffold',
          appName: applicationName,
          capabilities: [],
          services: {
            appid: {
              name: 'myAppIDService',
              credentials: {
                tenantId: 'myTenantId',
                clientId: 'myClientId',
                secret: 'mySecret'
              }
            }
          }
        }))
      })
    })

    describe('with watson conversation', function () {
      describe('default credentials', function () {
        var runContext

        before(function () {
          runContext = helpers.run(appGeneratorPath)
                              .withGenerators(dependentGenerators)
                              .withOptions({ testmode: true })
                              .withPrompts({
                                name: applicationName,
                                appType: 'Scaffold a starter',
                                capabilities: [],
                                services: [ 'Watson Conversation' ]
                              })
          return runContext.toPromise()
        })

        after(function () {
          runContext.cleanTestDirectory()
        })

        itCreatedSpecWithServicesAndCapabilities(() => ({
          runContext: runContext,
          appType: 'scaffold',
          appName: applicationName,
          capabilities: [],
          services: { watsonconversation: {} }
        }))
      })

      describe('non-default credentials', function () {
        var runContext

        before(function () {
          runContext = helpers.run(appGeneratorPath)
                              .withGenerators(dependentGenerators)
                              .withOptions({ testmode: true })
                              .withPrompts({
                                name: applicationName,
                                appType: 'Scaffold a starter',
                                capabilities: [],
                                services: [ 'Watson Conversation' ],
                                configure: [ 'Watson Conversation' ],
                                watsonConversationName: 'myConversationService',
                                watsonConversationUsername: 'admin',
                                watsonConversationPassword: 'password1234',
                                watsonConversationUrl: 'https://myhost'
                              })
          return runContext.toPromise()
        })

        after(function () {
          runContext.cleanTestDirectory()
        })

        itCreatedSpecWithServicesAndCapabilities(() => ({
          runContext: runContext,
          appType: 'scaffold',
          appName: applicationName,
          capabilities: [],
          services: {
            watsonconversation: {
              name: 'myConversationService',
              credentials: {
                username: 'admin',
                password: 'password1234',
                url: 'https://myhost'
              }
            }
          }
        }))
      })
    })

    describe('with alert notification', function () {
      describe('default credentials', function () {
        var runContext

        before(function () {
          runContext = helpers.run(appGeneratorPath)
                              .withGenerators(dependentGenerators)
                              .withOptions({ testmode: true })
                              .withPrompts({
                                name: applicationName,
                                appType: 'Scaffold a starter',
                                capabilities: [],
                                services: [ 'Alert Notification' ]
                              })
          return runContext.toPromise()
        })

        after(function () {
          runContext.cleanTestDirectory()
        })

        itCreatedSpecWithServicesAndCapabilities(() => ({
          runContext: runContext,
          appType: 'scaffold',
          appName: applicationName,
          capabilities: [],
          services: { alertnotification: {} }
        }))
      })

      describe('non-default credentials', function () {
        var runContext

        before(function () {
          runContext = helpers.run(appGeneratorPath)
                              .withGenerators(dependentGenerators)
                              .withOptions({ testmode: true })
                              .withPrompts({
                                name: applicationName,
                                appType: 'Scaffold a starter',
                                capabilities: [],
                                services: [ 'Alert Notification' ],
                                configure: [ 'Alert Notification' ],
                                alertNotificationName: 'myAlertNotificationService',
                                alertNotificationUsername: 'admin',
                                alertNotificationPassword: 'password1234',
                                alertNotificationUrl: 'https://myhost'
                              })
          return runContext.toPromise()
        })

        after(function () {
          runContext.cleanTestDirectory()
        })

        itCreatedSpecWithServicesAndCapabilities(() => ({
          runContext: runContext,
          appType: 'scaffold',
          appName: applicationName,
          capabilities: [],
          services: {
            alertnotification: {
              name: 'myAlertNotificationService',
              credentials: {
                name: 'admin',
                password: 'password1234',
                url: 'https://myhost'
              }
            }
          }
        }))
      })
    })

    describe('with push notifications', function () {
      describe('default credentials', function () {
        var runContext

        before(function () {
          runContext = helpers.run(appGeneratorPath)
                              .withGenerators(dependentGenerators)
                              .withOptions({ testmode: true })
                              .withPrompts({
                                name: applicationName,
                                appType: 'Scaffold a starter',
                                capabilities: [],
                                services: [ 'Push Notifications' ]
                              })
          return runContext.toPromise()
        })

        after(function () {
          runContext.cleanTestDirectory()
        })

        itCreatedSpecWithServicesAndCapabilities(() => ({
          runContext: runContext,
          appType: 'scaffold',
          appName: applicationName,
          capabilities: [],
          services: { pushnotifications: {} }
        }))
      })

      describe('non-default credentials', function () {
        describe('valid', function () {
          var runContext

          before(function () {
            runContext = helpers.run(appGeneratorPath)
                                .withGenerators(dependentGenerators)
                                .withOptions({ testmode: true })
                                .withPrompts({
                                  name: applicationName,
                                  appType: 'Scaffold a starter',
                                  capabilities: [],
                                  services: [ 'Push Notifications' ],
                                  configure: [ 'Push Notifications' ],
                                  pushNotificationsName: 'myPushNotificationsService',
                                  pushNotificationsAppGuid: 'myAppGuid',
                                  pushNotificationsAppSecret: 'myAppSecret',
                                  pushNotificationsRegion: 'US South'
                                })
            return runContext.toPromise()
          })

          after(function () {
            runContext.cleanTestDirectory()
          })

          itCreatedSpecWithServicesAndCapabilities(() => ({
            runContext: runContext,
            appType: 'scaffold',
            appName: applicationName,
            capabilities: [],
            services: {
              pushnotifications: {
                name: 'myPushNotificationsService',
                region: 'US_SOUTH',
                credentials: {
                  appGuid: 'myAppGuid',
                  appSecret: 'myAppSecret'
                }
              }
            }
          }))
        })

        describe('invalid region', function () {
          var runContext
          var error = null

          before(function () {
            runContext = helpers.run(appGeneratorPath)
                                .withGenerators(dependentGenerators)
                                .withOptions({ testmode: true })
                                .withPrompts({
                                  name: applicationName,
                                  appType: 'Scaffold a starter',
                                  capabilities: [],
                                  services: [ 'Push Notifications' ],
                                  configure: [ 'Push Notifications' ],
                                  pushNotificationsRegion: 'NotARegion'
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
            assert(error.message.match('unknown region'), 'Thrown error should be about unknown region, it was: ' + error)
          })
        })
      })
    })

    describe('with autoscaling', function () {
      var runContext

      before(function () {
        runContext = helpers.run(appGeneratorPath)
                            .withGenerators(dependentGenerators)
                            .withOptions({ testmode: true })
                            .withPrompts({
                              name: applicationName,
                              appType: 'Scaffold a starter',
                              capabilities: [],
                              services: [ 'Auto-scaling' ]
                            })
        return runContext.toPromise()
      })

      after(function () {
        runContext.cleanTestDirectory()
      })

      itCreatedSpecWithServicesAndCapabilities(() => ({
        runContext: runContext,
        appType: 'scaffold',
        appName: applicationName,
        capabilities: [],
        services: { autoscaling: {} }
      }))
    })
  })

  describe('crud', function () {
    var applicationName = 'notes'

    describe('base', function () {
      var runContext

      before(function () {
        runContext = helpers.run(appGeneratorPath)
                            .withGenerators(dependentGenerators)
                            .withOptions({ testmode: true })
                            .withPrompts({
                              name: applicationName,
                              appType: 'Generate a CRUD application',
                              capabilities: [],
                              store: 'Memory'
                            })
        return runContext.toPromise()
      })

      after(function () {
        runContext.cleanTestDirectory()
      })

      itCreatedSpecWithServicesAndCapabilities(() => ({
        runContext: runContext,
        appType: 'crud',
        appName: applicationName,
        capabilities: [],
        services: {}
      }))
    })

    // TODO with server sdk

    describe('with metrics', function () {
      var runContext

      before(function () {
        runContext = helpers.run(appGeneratorPath)
                            .withGenerators(dependentGenerators)
                            .withOptions({ testmode: true })
                            .withPrompts({
                              name: applicationName,
                              appType: 'Generate a CRUD application',
                              capabilities: [ 'Embedded metrics dashboard' ],
                              store: 'Memory'
                            })
        return runContext.toPromise()
      })

      after(function () {
        runContext.cleanTestDirectory()
      })

      itCreatedSpecWithServicesAndCapabilities(() => ({
        runContext: runContext,
        appType: 'crud',
        appName: applicationName,
        capabilities: [ 'metrics' ],
        services: {}
      }))
    })

    describe('with docker', function () {
      var runContext

      before(function () {
        runContext = helpers.run(appGeneratorPath)
                            .withGenerators(dependentGenerators)
                            .withOptions({ testmode: true })
                            .withPrompts({
                              name: applicationName,
                              appType: 'Generate a CRUD application',
                              capabilities: [ 'Docker files' ],
                              store: 'Memory'
                            })
        return runContext.toPromise()
      })

      after(function () {
        runContext.cleanTestDirectory()
      })

      itCreatedSpecWithServicesAndCapabilities(() => ({
        runContext: runContext,
        appType: 'crud',
        appName: applicationName,
        capabilities: [ 'docker' ],
        services: {}
      }))
    })

    describe('with cloudant', function () {
      describe('default credentials', function () {
        var runContext

        before(function () {
          runContext = helpers.run(appGeneratorPath)
                              .withGenerators(dependentGenerators)
                              .withOptions({ testmode: true })
                              .withPrompts({
                                name: applicationName,
                                appType: 'Generate a CRUD application',
                                capabilities: [],
                                store: 'Cloudant'
                              })
          return runContext.toPromise()
        })

        after(function () {
          runContext.cleanTestDirectory()
        })

        itCreatedSpecWithServicesAndCapabilities(() => ({
          runContext: runContext,
          appType: 'crud',
          appName: applicationName,
          capabilities: [],
          services: { cloudant: { name: 'crudDataStore' } },
          crudservice: 'crudDataStore'
        }))
      })

      describe('non-default credentials', function () {
        describe('without username and password', function () {
          var runContext

          before(function () {
            runContext = helpers.run(appGeneratorPath)
                                .withGenerators(dependentGenerators)
                                .withOptions({ testmode: true })
                                .withPrompts({
                                  name: applicationName,
                                  appType: 'Generate a CRUD application',
                                  capabilities: [],
                                  store: 'Cloudant',
                                  configure: [ 'Cloudant / CouchDB' ],
                                  cloudantHost: 'cloudanthost',
                                  cloudantPort: 4568,
                                  cloudantSecured: true
                                })
            return runContext.toPromise()
          })

          after(function () {
            runContext.cleanTestDirectory()
          })

          itCreatedSpecWithServicesAndCapabilities(() => ({
            runContext: runContext,
            appType: 'crud',
            appName: applicationName,
            capabilities: [],
            services: {
              'cloudant': {
                name: 'crudDataStore',
                credentials: {
                  host: 'cloudanthost',
                  port: 4568,
                  secured: true
                }
              }
            },
            crudservice: 'crudDataStore'
          }))
        })

        describe('with username and password', function () {
          var runContext

          before(function () {
            runContext = helpers.run(appGeneratorPath)
                                .withGenerators(dependentGenerators)
                                .withOptions({ testmode: true })
                                .withPrompts({
                                  name: applicationName,
                                  appType: 'Generate a CRUD application',
                                  capabilities: [],
                                  store: 'Cloudant',
                                  configure: [ 'Cloudant / CouchDB' ],
                                  cloudantHost: 'cloudanthost',
                                  cloudantPort: 4568,
                                  cloudantSecured: true,
                                  cloudantUsername: 'admin',
                                  cloudantPassword: 'password123'
                                })
            return runContext.toPromise()
          })

          after(function () {
            runContext.cleanTestDirectory()
          })

          itCreatedSpecWithServicesAndCapabilities(() => ({
            runContext: runContext,
            appType: 'crud',
            appName: applicationName,
            capabilities: [],
            services: {
              'cloudant': {
                name: 'crudDataStore',
                credentials: {
                  host: 'cloudanthost',
                  port: 4568,
                  secured: true,
                  username: 'admin',
                  password: 'password123'
                }
              }
            },
            crudservice: 'crudDataStore'
          }))
        })
      })
    })
  })
})
