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

// Require config to alter sdkgen delay between
// status checks to speed up unit tests
var config = require('../../config')
var sdkGenCheckDelaySaved

var expectedFiles = ['.swiftservergenerator-project', 'Package.swift', 'config.json',
  '.yo-rc.json', 'LICENSE', 'README.md']

var appName = 'todo'
var modelName = 'todo'
var modelPlural = 'todos'
var className = 'Todo'

var generatedModule = 'Generated'
var applicationModule = 'Application'
var executableModule = appName

var expectedSourceFiles = [`Sources/${executableModule}/main.swift`, `Sources/${applicationModule}/Application.swift`]

var expectedModelFiles = [`models/${modelName}.json`, `Sources/${generatedModule}/${className}.swift`,
  `Sources/${generatedModule}/${className}Adapter.swift`, `Sources/${generatedModule}/${className}Resource.swift`,
  `Sources/${generatedModule}/AdapterError.swift`, `Sources/${generatedModule}/ModelError.swift`,
  `Sources/${generatedModule}/AdapterFactory.swift`, `Sources/${generatedModule}/CRUDResources.swift`]

var expectedBluemixFiles = ['manifest.yml',
  '.cfignore',
  '.bluemix/pipeline.yml',
  '.bluemix/toolchain.yml',
  '.bluemix/deploy.json']

var expectedDockerFiles = ['cli-config.yml',
  '.dockerignore',
  'Dockerfile',
  'Dockerfile-tools']

var expectedKubernetesFiles = [`chart/${appName}/Chart.yaml`,
  `chart/${appName}/values.yaml`,
  `chart/${appName}/templates/deployment.yaml`,
  `chart/${appName}/templates/service.yaml`]

describe('swiftserver:refresh', function () {
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

  describe('Basic refresh generator test. ' +
           'Check the Swagger file exists and ' +
           'is written out correctly.', function () {
    var expected = [
      `definitions/${appName}.yaml`
    ]
    var runContext
    var sdkScope

    before(function () {
      sdkScope = nock('https://mobilesdkgen.ng.bluemix.net')
        .filteringRequestBody(/.*/, '*')
        .post(`/sdkgen/api/generator/${appName}_iOS_SDK/ios_swift`, '*')
        .reply(200, { job: { id: 'myid' } })
        .get('/sdkgen/api/generator/myid/status')
        .reply(200, { status: 'FINISHED' })
        .get('/sdkgen/api/generator/myid')
        .replyWithFile(
          200,
          path.join(__dirname, '../resources/dummy_iOS_SDK.zip'),
          { 'Content-Type': 'application/zip' }
        )
      var spec = {
        appType: 'crud',
        appName: appName,
        config: {
          logger: 'helium',
          port: 4567
        },
        'models': [
          {
            'name': modelName,
            'plural': modelPlural,
            'classname': className,
            'properties': {
              'id': {
                'type': 'string',
                'id': true
              },
              'title': {
                'type': 'string'
              }
            }
          }
        ]
      }
        // Mock the options, set up an output folder and run the generator
      runContext = helpers.run(path.join(__dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise()
    })

    after(function () {
      nock.cleanAll()
      runContext.cleanTestDirectory()
    })

    it('requested iOS SDK over http', function () {
      assert(sdkScope.isDone())
    })

    it('generates the expected files', function () {
      assert.file(expected)
    })

    // This is only a starter set of checks, we need to add further check in.
    it('the swagger file contains the expected content', function () {
      assert.fileContent([
        [expected[0], 'title: ' + appName],
        [expected[0], `${modelName}:`]
      ])
    })
  })

  describe('Basic refresh generator test with apic option. ' +
           'Check the yaml files exist and ' +
           'are written out correctly.', function () {
    var appName = 'testApp'
    var expected = [
      `definitions/${appName}-product.yaml`,
      `definitions/${appName}.yaml`
    ]
    var runContext
    var sdkScope

    before(function () {
      sdkScope = nock('https://mobilesdkgen.ng.bluemix.net')
        .filteringRequestBody(/.*/, '*')
        .post(`/sdkgen/api/generator/${appName}_iOS_SDK/ios_swift`, '*')
        .reply(200, { job: { id: 'myid' } })
        .get('/sdkgen/api/generator/myid/status')
        .reply(200, { status: 'FINISHED' })
        .get('/sdkgen/api/generator/myid')
        .replyWithFile(
          200,
          path.join(__dirname, '../resources/dummy_iOS_SDK.zip'),
          { 'Content-Type': 'application/zip' }
        )
      var spec = {
        appType: 'crud',
        appName: appName,
        config: {
          logger: 'helium',
          port: 4567
        },
        'models': [
          {
            'name': modelName,
            'plural': modelPlural,
            'classname': className,
            'properties': {
              'id': {
                'type': 'string',
                'id': true
              },
              'title': {
                'type': 'string'
              }
            }
          }
        ]
      }
      // Mock the options, set up an output folder and run the generator
      runContext = helpers.run(path.join(__dirname, '../../refresh'))
        .withOptions({
          specObj: spec,
          apic: true
        })
      return runContext.toPromise()
    })

    after(function () {
      nock.cleanAll()
      runContext.cleanTestDirectory()
    })

    it('requested iOS SDK over http', function () {
      assert(sdkScope.isDone())
    })

    it('generates the expected files', function () {
      assert.file(expected)
    })

    it('the product file contains the expected content', function () {
      assert.fileContent([
        [expected[0], 'name: ' + appName],
        [expected[0], 'title: ' + appName]
      ])
    })

    // This is only a starter set of checks, we need to add further check in.
    it('the swagger file contains the expected content', function () {
      assert.fileContent([
        [expected[1], 'name: ' + appName],
        [expected[1], 'title: ' + appName],
        [expected[1], `${modelName}:`]
      ])
    })
  })

  describe('Generate a basic application with a server SDK', function () {
    var runContext
    var sdkScope

    before(function () {
      sdkScope = nock('https://mobilesdkgen.ng.bluemix.net')
        .filteringRequestBody(/.*/, '*')
        .post('/sdkgen/api/generator/Swagger_Petstore_ServerSDK/server_swift', '*')
        .reply(200, { job: { id: 'myid' } })
        .get('/sdkgen/api/generator/myid/status')
        .reply(200, { status: 'FINISHED' })
        .get('/sdkgen/api/generator/myid')
        .replyWithFile(
          200,
          path.join(__dirname, '../resources/dummy_ServerSDK.zip'),
          { 'Content-Type': 'application/zip' }
        )
      var spec = {
        appType: 'scaffold',
        appName: appName,
        hostSwagger: true,
        serverSwaggerFiles: [
          path.join(__dirname, '../resources/petstore.yaml')
        ],
        config: {
          logger: 'helium',
          port: 4567
        }
      }
      runContext = helpers.run(path.join(__dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise()
    })

    after(function () {
      nock.cleanAll()
      runContext.cleanTestDirectory()
    })

    it('requested server SDK over http', function () {
      assert(sdkScope.isDone())
    })

    it('created Pet model from swagger file', function () {
      assert.file('Sources/Swagger_Petstore_ServerSDK/Pet.swift')
    })

    it('modified Package.swift to include server SDK module', function () {
      assert.fileContent('Package.swift', 'Swagger_Petstore_ServerSDK')
    })
  })

  describe('Generate a basic application experiencing server SDK download failure', function () {
    var runContext
    var error
    var sdkScope

    before(function () {
      sdkScope = nock('https://mobilesdkgen.ng.bluemix.net')
        .filteringRequestBody(/.*/, '*')
        .post('/sdkgen/api/generator/Swagger_Petstore_ServerSDK/server_swift', '*')
        .reply(200, { job: { id: 'myid' } })
        .get('/sdkgen/api/generator/myid/status')
        .reply(200, { status: 'FINISHED' })
        .get('/sdkgen/api/generator/myid')
        .replyWithError({ message: 'getaddrinfo ENOTFOUND', code: 'ENOTFOUND' })

      var spec = {
        appType: 'scaffold',
        appName: appName,
        hostSwagger: true,
        serverSwaggerFiles: [
          path.join(__dirname, '../resources/petstore.yaml')
        ],
        config: {
          logger: 'helium',
          port: 4567
        }
      }
      runContext = helpers.run(path.join(__dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise().catch(function (err) {
        error = err.message
      })
    })

    after(function () {
      nock.cleanAll()
      runContext.cleanTestDirectory()
    })

    it('requested server SDK over http', function () {
      assert(sdkScope.isDone())
    })

    it('aborts generator with an error', function () {
      assert(error, 'Should throw an error')
      assert(error.match(/Getting server SDK.*failed/), 'Thrown error should be about failing to download server SDK: ' + error)
    })
  })

  describe('Generate a Bff application from a Swagger document', function () {
    var runContext
    var sdkScope

    before(function () {
      sdkScope = nock('https://mobilesdkgen.ng.bluemix.net')
        .filteringRequestBody(/.*/, '*')
        .post(`/sdkgen/api/generator/${appName}_iOS_SDK/ios_swift`, '*')
        .reply(200, { job: { id: 'myid' } })
        .get('/sdkgen/api/generator/myid/status')
        .reply(200, { status: 'FINISHED' })
        .get('/sdkgen/api/generator/myid')
        .replyWithFile(
          200,
          path.join(__dirname, '../resources/dummy_iOS_SDK.zip'),
          { 'Content-Type': 'application/zip' }
        )

      // Mock the options, set up an output folder and run the generator
      var spec = {
        appType: 'scaffold',
        appName: appName,
        hostSwagger: true,
        fromSwagger: path.join(__dirname, '../resources/person_dino.json'),
        config: {
          logger: 'helium',
          port: 4567
        }
      }
      runContext = helpers.run(path.join(__dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise()
    })

    after(function () {
      nock.cleanAll()
      runContext.cleanTestDirectory()
    })

    it('requested iOS SDK over http', function () {
      assert(sdkScope.isDone())
    })

    it('generated the correct config file', function () {
      assert.jsonFileContent('config.json', {logger: 'helium', port: 4567})
    })

    it('generates the expected files in the root of the project', function () {
      assert.file(expectedFiles)
    })

    it('installs the swagger file to be hosted', function () {
      var expectedFiles = [
        `definitions/${executableModule}.yaml`
      ]

      assert.file(expectedFiles)
    })

    it('generates the swift files', function () {
      var expectedSourceFiles = [
        `Sources/${applicationModule}/Application.swift`,
        `Sources/${applicationModule}/Routes/DinosaursRoutes.swift`,
        `Sources/${applicationModule}/Routes/PersonsRoutes.swift`,
        `Sources/${applicationModule}/Routes/SwaggerRoute.swift`,
        `Sources/${executableModule}/main.swift`
      ]
      assert.file(expectedSourceFiles)
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'initializePersonsRoutes(')
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'initializeDinosaursRoutes(')
      assert.fileContent(`Sources/${applicationModule}/Routes/PersonsRoutes.swift`, 'router.get("\\(basePath)/persons"')
    })
  })

  describe('Generate scaffolded app from an invalid swagger path', function () {
    var runContext
    var error

    before(function () {
        // Mock the options, set up an output folder and run the generator
      var spec = {
        appType: 'scaffold',
        appName: appName,
        fromSwagger: 'unknown_file_!£123',
        config: {
          logger: 'helium',
          port: 4567
        }
      }
      runContext = helpers.run(path.join(__dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise().catch(function (err) {
        error = err.message
      })
    })

    it('aborts generator with an error', function () {
      assert(error, 'Should throw an error')
      assert(error.match('unknown_file_!£123 doesn\'t exist'), 'unknown_file_!£$ doesn\'t exist')
    })

    after(function () {
      runContext.cleanTestDirectory()
    })
  })

  describe('Generate scaffolded app from an valid swagger URL', function () {
    var runContext
    var swaggerScope
    var sdkScope

    before(function () {
      swaggerScope = nock('http://dino.io')
        .get('/stuff')
        .replyWithFile(200, path.join(__dirname, '../resources/person_dino.json'))

      sdkScope = nock('https://mobilesdkgen.ng.bluemix.net')
        .filteringRequestBody(/.*/, '*')
        .post(`/sdkgen/api/generator/${appName}_iOS_SDK/ios_swift`, '*')
        .reply(200, { job: { id: 'myid' } })
        .get('/sdkgen/api/generator/myid/status')
        .reply(200, { status: 'FINISHED' })
        .get('/sdkgen/api/generator/myid')
        .replyWithFile(
          200,
          path.join(__dirname, '../resources/dummy_iOS_SDK.zip'),
          { 'Content-Type': 'application/zip' }
        )

      // Mock the options, set up an output folder and run the generator
      var spec = {
        appType: 'scaffold',
        appName: appName,
        fromSwagger: 'http://dino.io/stuff',
        config: {
          logger: 'helium',
          port: 4567
        }
      }
      runContext = helpers.run(path.join(__dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise()
    })

    it('requested swagger over http', function () {
      assert(swaggerScope.isDone())
    })

    it('requested iOS SDK over http', function () {
      assert(sdkScope.isDone())
    })

    it('generates the swift files', function () {
      var expectedSourceFiles = [
        `Sources/${applicationModule}/Application.swift`,
        `Sources/${applicationModule}/Routes/DinosaursRoutes.swift`,
        `Sources/${applicationModule}/Routes/PersonsRoutes.swift`,
        `Sources/${executableModule}/main.swift`
      ]
      assert.file(expectedSourceFiles)
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'initializePersonsRoutes(')
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'initializeDinosaursRoutes(')
      assert.fileContent(`Sources/${applicationModule}/Routes/PersonsRoutes.swift`, 'router.get("\\(basePath)/persons"')
    })

    after(function () {
      nock.cleanAll()
      runContext.cleanTestDirectory()
    })
  })

  describe('Generate scaffolded app from valid swagger but no basepath', function () {
    var sdkScope
    var runContext

    before(function () {
      sdkScope = nock('https://mobilesdkgen.ng.bluemix.net')
        .filteringRequestBody(/.*/, '*')
        .post(`/sdkgen/api/generator/${appName}_iOS_SDK/ios_swift`, '*')
        .reply(200, { job: { id: 'myid' } })
        .get('/sdkgen/api/generator/myid/status')
        .reply(200, { status: 'FINISHED' })
        .get('/sdkgen/api/generator/myid')
        .replyWithFile(
          200,
          path.join(__dirname, '../resources/dummy_iOS_SDK.zip'),
          { 'Content-Type': 'application/zip' }
        )

      // Mock the options, set up an output folder and run the generator
      var spec = {
        appType: 'scaffold',
        appName: appName,
        fromSwagger: path.join(__dirname, '../resources/productSwagger.yaml'),
        config: {
          logger: 'helium',
          port: 4567
        }
      }
      runContext = helpers.run(path.join(__dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise()
    })

    it('generates the swift files', function () {
      var expectedSourceFiles = [
        `Sources/${applicationModule}/Application.swift`,
        `Sources/${applicationModule}/Routes/ProductsRoutes.swift`,
        `Sources/${executableModule}/main.swift`
      ]
      assert.file(expectedSourceFiles)
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'initializeProductsRoutes(')
      assert.fileContent(`Sources/${applicationModule}/Routes/ProductsRoutes.swift`, 'router.get("/products"')
      assert.fileContent(`Sources/${applicationModule}/Routes/ProductsRoutes.swift`, 'router.get("/products/:id"')
    })

    it('requested iOS SDK over http', function () {
      assert(sdkScope.isDone())
    })

    after(function () {
      nock.cleanAll()
      runContext.cleanTestDirectory()
    })
  })

  describe('Generate scaffolded app experiencing a service status failure', function () {
    var runContext
    var error
    var sdkScope

    before(function () {
      sdkScope = nock('https://mobilesdkgen.ng.bluemix.net')
        .filteringRequestBody(/.*/, '*')
        .post(`/sdkgen/api/generator/${appName}_iOS_SDK/ios_swift`, '*')
        .reply(200, { job: { id: 'myid' } })
        .get('/sdkgen/api/generator/myid/status')
        .reply(200, { status: 'FAILED' })

      // Mock the options, set up an output folder and run the generator
      var spec = {
        appType: 'scaffold',
        appName: appName,
        fromSwagger: path.join(__dirname, '../resources/person_dino.json'),
        config: {
          logger: 'helium',
          port: 4567
        }
      }
      runContext = helpers.run(path.join(__dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise().catch(function (err) {
        error = err.message
      })
    })

    it('requested iOS SDK over http', function () {
      assert(sdkScope.isDone())
    })

    it('aborts generator with an error', function () {
      assert(error, 'Should throw an error')
      assert(error.match(/SDK generator.*failed.*FAILED/), 'Thrown error should be about a service failure')
    })

    after(function () {
      nock.cleanAll()
      runContext.cleanTestDirectory()
    })
  })

  describe('Generate scaffolded app experiencing a service timeout', function () {
    var runContext
    var error
    var sdkScope

    before(function () {
      sdkScope = nock('https://mobilesdkgen.ng.bluemix.net')
        .filteringRequestBody(/.*/, '*')
        .post(`/sdkgen/api/generator/${appName}_iOS_SDK/ios_swift`, '*')
        .reply(200, { job: { id: 'myid' } })
        .get('/sdkgen/api/generator/myid/status')
        .times(11)
        .reply(200, { status: 'VALIDATING' })

      // Mock the options, set up an output folder and run the generator
      var spec = {
        appType: 'scaffold',
        appName: appName,
        fromSwagger: path.join(__dirname, '../resources/person_dino.json'),
        config: {
          logger: 'helium',
          port: 4567
        }
      }
      runContext = helpers.run(path.join(__dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise().catch(function (err) {
        error = err.message
      })
    })

    it('requested iOS SDK over http', function () {
      assert(sdkScope.isDone())
    })

    it('aborts generator with an error', function () {
      assert(error, 'Should throw an error')
      assert(error.match(/generate SDK.*timeout/), 'Thrown error should be about service timeout: ' + error)
    })

    after(function () {
      nock.cleanAll()
      runContext.cleanTestDirectory()
    })
  })

  describe('Generate scaffolded app experiencing a client SDK download failure', function () {
    var runContext
    var error
    var sdkScope

    before(function () {
      sdkScope = nock('https://mobilesdkgen.ng.bluemix.net')
        .filteringRequestBody(/.*/, '*')
        .post(`/sdkgen/api/generator/${appName}_iOS_SDK/ios_swift`, '*')
        .reply(200, { job: { id: 'myid' } })
        .get('/sdkgen/api/generator/myid/status')
        .reply(200, { status: 'FINISHED' })
        .get('/sdkgen/api/generator/myid')
        .replyWithError({ message: 'getaddrinfo ENOTFOUND', code: 'ENOTFOUND' })

      // Mock the options, set up an output folder and run the generator
      var spec = {
        appType: 'scaffold',
        appName: appName,
        fromSwagger: path.join(__dirname, '../resources/person_dino.json'),
        config: {
          logger: 'helium',
          port: 4567
        }
      }
      runContext = helpers.run(path.join(__dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise().catch(function (err) {
        error = err.message
      })
    })

    it('requested iOS SDK over http', function () {
      assert(sdkScope.isDone())
    })

    it('aborts generator with an error', function () {
      assert(error, 'Should throw an error')
      assert(error.match(/Getting client SDK.*failed/), 'Thrown error should be about failing to download client SDK: ' + error)
    })

    after(function () {
      nock.cleanAll()
      runContext.cleanTestDirectory()
    })
  })

  describe('Generate scaffolded app from an invalid swagger URL', function () {
    var errorCode = 'ENOTFOUND'
    var errorMessage = 'getaddrinfo ' + errorCode + ' nothing nothing:80'
    var runContext
    var error

    before(function () {
      // Mock the options, set up an output folder and run the generator
      nock('http://nothing')
        .get('/here')
        .replyWithError({'message': errorMessage, 'code': errorCode})

      var spec = {
        appType: 'scaffold',
        appName: appName,
        fromSwagger: 'http://nothing/here',
        config: {
          logger: 'helium',
          port: 4567
        }
      }
      runContext = helpers.run(path.join(__dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise().catch(function (err) {
        error = err.message
      })
    })

    it('aborts generator with an error', function () {
      assert(error, 'Should throw an error')
      assert(error.match(errorMessage, 'did not recieve ' + errorCode))
    })

    after(function () {
      runContext.cleanTestDirectory()
    })
  })

  describe('Generate scaffolded app from a 404 swagger URL', function () {
    var runContext
    var error

    before(function () {
      // Mock the options, set up an output folder and run the generator
      nock('http://nothing')
        .get('/here')
        .reply(404)

      var spec = {
        appType: 'scaffold',
        appName: appName,
        fromSwagger: 'http://nothing/here',
        config: {
          logger: 'helium',
          port: 4567
        }
      }
      runContext = helpers.run(path.join(__dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise().catch(function (err) {
        error = err.message
      })
    })

    it('aborts generator with an error', function () {
      assert(error, 'Should throw an error')
      assert(error.match('failed to load swagger from: http://nothing/here status: 404'), 'did not recieve 404')
    })

    after(function () {
      runContext.cleanTestDirectory()
    })
  })

  describe('Generate scaffolded app from a non-conforming swagger document', function () {
    var swagger = {
      'swagger': '2.0',
      'info': {
        'version': '0.0.0',
        'title': '<enter your title>'
      },
      'basePath': '/basepath',
      'xxxx': {
      }
    }

    var runContext
    var error

    before(function () {
        // Mock the options, set up an output folder and run the generator
      var spec = {
        appType: 'scaffold',
        appName: appName,
        config: {
          logger: 'helium',
          port: 4567
        }
      }
      runContext = helpers.run(path.join(__dirname, '../../refresh'))
        .inTmpDir(function (tmpDir) {
          spec.fromSwagger = path.join(tmpDir, 'swagger.json')
          fs.writeFileSync(spec.fromSwagger, JSON.stringify(swagger))
        })
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise().catch(function (err) {
        error = err.message
      })
    })

    it('aborts generator with an error', function () {
      assert(error, 'Should throw an error')
      assert(error.match('does not conform to swagger specification'), 'does not conform to swagger specification')
    })

    after(function () {
      runContext.cleanTestDirectory()
    })
  })

  describe('Generate the config file from the spec', function () {
    var runContext

    before(function () {
        // Mock the options, set up an output folder and run the generator
      var spec = {
        appType: 'crud',
        appName: appName,
        bluemix: true,
        config: {
          logger: 'helium',
          port: 4567
        }
      }
      runContext = helpers.run(path.join(__dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise()
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    it('generated the correct config file', function () {
      assert.jsonFileContent('config.json', { vcap: { services: {} } })
    })

    it('generates the expected files in the root of the project', function () {
      assert.file(expectedFiles)
    })

    it('generates the swift files', function () {
      assert.file(expectedSourceFiles)
    })
  })

  describe('Generate a skeleton CRUD application without bluemix', function () {
    var runContext
    var sdkScope

    before(function () {
      sdkScope = nock('https://mobilesdkgen.ng.bluemix.net')
        .filteringRequestBody(/.*/, '*')
        .post(`/sdkgen/api/generator/${appName}_iOS_SDK/ios_swift`, '*')
        .reply(200, { job: { id: 'myid' } })
        .get('/sdkgen/api/generator/myid/status')
        .reply(200, { status: 'FINISHED' })
        .get('/sdkgen/api/generator/myid')
        .replyWithFile(
          200,
          path.join(__dirname, '../resources/dummy_iOS_SDK.zip'),
          { 'Content-Type': 'application/zip' }
        )
        // Set up the spec file which should create all the necessary files for a server
      var spec = {
        appType: 'crud',
        appName: appName,
        bluemix: false,
        config: {
          logger: 'helium',
          port: 4567
        },
        'models': [
          {
            'name': modelName,
            'plural': modelPlural,
            'classname': className,
            'properties': {
              'id': {
                'type': 'string',
                'id': true
              },
              'title': {
                'type': 'string'
              }
            }
          }
        ]
      }
      runContext = helpers.run(path.join(__dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise()
    })

    after(function () {
      nock.cleanAll()
      runContext.cleanTestDirectory()
    })

    it('requested iOS SDK over http', function () {
      assert(sdkScope.isDone())
    })

    it('generates the expected files in the root of the project', function () {
      // FIXME: All project types should have a README
      var expectedFilesExceptREADME = expectedFiles.filter((f) => f !== 'README.md')
      assert.file(expectedFilesExceptREADME)
    })

    it('generates the generic swift source files', function () {
      assert.file(expectedSourceFiles)
    })

    it('generates a todo model metadata file and the todo swift files', function () {
      assert.file(expectedModelFiles)
    })

    it('hosts swagger definition', function () {
      assert.file(`Sources/${applicationModule}/Routes/SwaggerRoute.swift`)
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'initializeSwaggerRoute(')
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'definitions')
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, appName + '.yaml')
    })

    it('does not generate the bluemix files', function () {
      assert.noFile(expectedBluemixFiles)
    })

    it('does not generate the docker files', function () {
      assert.noFile(expectedDockerFiles)
    })

    it('does not generate the kubernetes files', function () {
      assert.noFile(expectedKubernetesFiles)
    })

    it('does not generate any capabilities', function () {
      assert.noFileContent(`Sources/${applicationModule}/Application.swift`, 'import SwiftMetrics')
      assert.noFileContent(`Sources/${applicationModule}/Application.swift`, 'import SwiftMetricsDash')
      assert.noFileContent(`Sources/${applicationModule}/Application.swift`, 'SwiftMetrics()')
      assert.noFileContent(`Sources/${applicationModule}/Application.swift`, 'SwiftMetricsDash(swiftMetricsInstance')
      assert.noFileContent(`Sources/${applicationModule}/Application.swift`, 'import SwiftMetricsBluemix')
      assert.noFileContent(`Sources/${applicationModule}/Application.swift`, 'let _ = SwiftMetricsBluemix(swiftMetricsInstance: sm)')
    })

    it('generates the extension for ConfigurationManager', function () {
      assert.file(`Sources/${applicationModule}/Extensions/ConfigurationManagerExtension.swift`)
    })
  })

  describe('Updating a skeleton CRUD application without bluemix and with no models', function () {
    var runContext
    var userOwnedFiles = ['.swift-version',
      'README.md',
      'LICENSE',
      'Package.swift',
      'config.json',
      `Sources/${executableModule}/main.swift`,
      `Sources/${applicationModule}/Application.swift`,
      `Sources/${applicationModule}/Extensions/ConfigurationManagerExtension.swift`,
      `Sources/${applicationModule}/Routes/SwaggerRoute.swift`]
    var dummyContent = '==Dummy existing content=='

    before(function () {
      runContext = helpers.run(path.join(__dirname, '../../refresh'))
                          .inTmpDir(function (tmpDir) {
                            // Create a dummy file for each one that should
                            // not be overwritten by the update
                            fs.mkdirSync('Sources')
                            fs.mkdirSync(`Sources/${executableModule}`)
                            fs.mkdirSync(`Sources/${applicationModule}`)
                            fs.mkdirSync(`Sources/${applicationModule}/Routes`)
                            fs.mkdirSync(`Sources/${applicationModule}/Extensions`)
                            userOwnedFiles.forEach((filename) => {
                              fs.writeFileSync(path.join(tmpDir, filename),
                                               dummyContent)
                            })

                            var spec = {
                              appType: 'crud',
                              appName: appName,
                              config: {}
                            }
                            fs.writeFileSync(path.join(tmpDir, '.swiftservergenerator-project'), '')
                            fs.writeFileSync(path.join(tmpDir, 'spec.json'),
                                             JSON.stringify(spec))
                          })
      return runContext.toPromise()
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    userOwnedFiles.forEach((filename) => {
      it(`does not overwrite user-owned file ${filename}`, function () {
        assert.fileContent(filename, dummyContent)
      })
    })
  })

  describe('Generate a skeleton CRUD application without bluemix and with no models', function () {
    var runContext

    before(function () {
        // Set up the spec file which should create all the necessary files for a server
      var spec = {
        appType: 'crud',
        appName: appName,
        bluemix: false,
        config: {
          logger: 'helium',
          port: 4567
        }
      }
      runContext = helpers.run(path.join(__dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise()
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    it('generates the expected files in the root of the project', function () {
      // FIXME: All project types should have a README
      var expectedFilesExceptREADME = expectedFiles.filter((f) => f !== 'README.md')
      assert.file(expectedFilesExceptREADME)
    })

    it('generates the generic swift source files', function () {
      assert.file(expectedSourceFiles)
    })

    it('generates a todo model metadata file and the todo swift files', function () {
      var expectedModelFiles = [
        `Sources/${generatedModule}/AdapterFactory.swift`,
        `Sources/${generatedModule}/CRUDResources.swift`,
        `Sources/${generatedModule}/AdapterError.swift`,
        `Sources/${generatedModule}/ModelError.swift`
      ]
      assert.file(expectedModelFiles)
    })
  })

  describe('Generate a skeleton CRUD application for bluemix', function () {
    var runContext
    var sdkScope

    before(function () {
      sdkScope = nock('https://mobilesdkgen.ng.bluemix.net')
        .filteringRequestBody(/.*/, '*')
        .post(`/sdkgen/api/generator/${appName}_iOS_SDK/ios_swift`, '*')
        .reply(200, { job: { id: 'myid' } })
        .get('/sdkgen/api/generator/myid/status')
        .reply(200, { status: 'FINISHED' })
        .get('/sdkgen/api/generator/myid')
        .replyWithFile(
          200,
          path.join(__dirname, '../resources/dummy_iOS_SDK.zip'),
          { 'Content-Type': 'application/zip' }
        )
        // Set up the spec file which should create all the necessary files for a server
      var spec = {
        appType: 'crud',
        appName: appName,
        bluemix: true,
        config: {
          logger: 'helium',
          port: 4567
        },
        docker: true,
        'models': [
          {
            'name': modelName,
            'plural': modelPlural,
            'classname': className,
            'properties': {
              'id': {
                'type': 'string',
                'id': true
              },
              'title': {
                'type': 'string'
              }
            }
          }
        ]
      }
      runContext = helpers.run(path.join(__dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise()
    })

    after(function () {
      nock.cleanAll()
      runContext.cleanTestDirectory()
    })

    it('requested iOS SDK over http', function () {
      assert(sdkScope.isDone())
    })

    it('generates the expected files in the root of the project', function () {
      assert.file(expectedFiles)
    })

    it('generates the generic swift source files', function () {
      assert.file(expectedSourceFiles)
    })

    it('generates a todo model metadata file and the todo swift files', function () {
      assert.file(expectedModelFiles)
    })

    it('does not generate the extension for ConfigurationManager', function () {
      assert.noFile(`Sources/${applicationModule}/Extensions/ConfigurationManagerExtension.swift`)
    })

    it('generates the bluemix files', function () {
      assert.file(expectedBluemixFiles)
    })

    it('generates the docker files', function () {
      assert.file(expectedDockerFiles)
    })

    it('generates the expected kubernetes files', function () {
      assert.file(expectedKubernetesFiles)
    })

    it('defines OPENAPI_SPEC environment variable', function () {
      assert.fileContent('manifest.yml', 'OPENAPI_SPEC: "/swagger/api"')
    })
  })

  describe('Updating a skeleton CRUD application with bluemix and services', function () {
    var runContext
    var spec = {
      appType: 'crud',
      appName: appName,
      bluemix: true,
      config: {},
      services: {
        cloudant: [{ name: 'myCloudantService' }],
        redis: [{ name: 'myRedisService' }],
        objectstorage: [{ name: 'myObjectStorageService' }],
        appid: [{ name: 'myAppIDService' }]
      }
    }
    var userOwnedFiles = ['manifest.yml',
      '.bluemix/pipeline.yml',
      '.bluemix/toolchain.yml',
      '.bluemix/deploy.json',
      'README.md',
      `Sources/${applicationModule}/Extensions/CouchDBExtension.swift`,
      `Sources/${applicationModule}/Extensions/RedisExtension.swift`,
      `Sources/${applicationModule}/Extensions/ObjStorageExtension.swift`,
      `Sources/${applicationModule}/Extensions/AppIDExtension.swift`]
    var dummyContent = '==Dummy existing content=='

    before(function () {
      runContext = helpers.run(path.join(__dirname, '../../refresh'))
                          .inTmpDir(function (tmpDir) {
                            // Create a dummy file for each one that should
                            // not be overwritten by the update
                            fs.mkdirSync('.bluemix')
                            fs.mkdirSync('Sources')
                            fs.mkdirSync(`Sources/${applicationModule}`)
                            fs.mkdirSync(`Sources/${applicationModule}/Extensions`)
                            userOwnedFiles.forEach((filename) => {
                              fs.writeFileSync(path.join(tmpDir, filename),
                                               dummyContent)
                            })

                            fs.writeFileSync(path.join(tmpDir, '.swiftservergenerator-project'), '')
                            fs.writeFileSync(path.join(tmpDir, 'spec.json'),
                                             JSON.stringify(spec))
                          })
      return runContext.toPromise()
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    userOwnedFiles.forEach((filename) => {
      it(`does not overwrite user-owned file ${filename}`, function () {
        assert.fileContent(filename, dummyContent)
      })
    })
  })

  describe('Generate a CRUD application with capabilities', function () {
    var runContext

    before(function () {
        // Set up the spec file which should create all the necessary files for a server
      var spec = {
        appType: 'crud',
        appName: appName,
        bluemix: false,
        config: {
          logger: 'helium',
          port: 4567
        },
        capabilities: {
          'metrics': true,
          'autoscale': 'myAutoScalingService'
        }
      }
      runContext = helpers.run(path.join(__dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise()
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    it('generates metrics and autoscale capabilities', function () {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'import SwiftMetrics')
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'import SwiftMetricsDash')
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'SwiftMetrics()')
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'try SwiftMetricsDash(')
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'import SwiftMetricsBluemix')
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'SwiftMetricsBluemix(swiftMetricsInstance:')
    })
  })

  describe('Generate a CRUD application without metrics', function () {
    var runContext

    before(function () {
        // Set up the spec file which should create all the necessary files for a server
      var spec = {
        appType: 'crud',
        appName: appName,
        bluemix: false,
        config: {
          logger: 'helium',
          port: 4567
        },
        capabilities: {
          'metrics': false
        }
      }
      runContext = helpers.run(path.join(__dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise()
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    it('generates metrics and autoscale capabilities', function () {
      assert.noFileContent(`Sources/${applicationModule}/Application.swift`, 'import SwiftMetrics\nimport SwiftMetricsDash')
      assert.noFileContent(`Sources/${applicationModule}/Application.swift`, 'SwiftMetrics()')
      assert.noFileContent(`Sources/${applicationModule}/Application.swift`, 'try SwiftMetricsDash(')
      assert.noFileContent(`Sources/${applicationModule}/Application.swift`, 'import SwiftMetricsBluemix')
      assert.noFileContent(`Sources/${applicationModule}/Application.swift`, 'SwiftMetricsBluemix(swiftMetricsInstance:')
    })
  })

  describe('Generated a CRUD application with cloudant for bluemix', function () {
    var runContext
    var sdkScope

    before(function () {
      sdkScope = nock('https://mobilesdkgen.ng.bluemix.net')
        .filteringRequestBody(/.*/, '*')
        .post(`/sdkgen/api/generator/${appName}_iOS_SDK/ios_swift`, '*')
        .reply(200, { job: { id: 'myid' } })
        .get('/sdkgen/api/generator/myid/status')
        .reply(200, { status: 'FINISHED' })
        .get('/sdkgen/api/generator/myid')
        .replyWithFile(
          200,
          path.join(__dirname, '../resources/dummy_iOS_SDK.zip'),
          { 'Content-Type': 'application/zip' }
        )
      var spec = {
        appType: 'crud',
        appName: appName,
        bluemix: true,
        config: {
          logger: 'helium',
          port: 4567
        },
        services: {
          cloudant: [{
            name: 'myCloudantService'
          }]
        },
        'models': [
          {
            'name': modelName,
            'plural': modelPlural,
            'classname': className,
            'properties': {
              'id': {
                'type': 'string',
                'id': true
              },
              'title': {
                'type': 'string'
              }
            }
          }
        ],
        crudservice: 'myCloudantService'
      }
      runContext = helpers.run(path.join(__dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise()                        // Get a Promise back when the generator finishes
    })

    after(function () {
      nock.cleanAll()
      runContext.cleanTestDirectory()
    })

    it('requested iOS SDK over http', function () {
      assert(sdkScope.isDone())
    })

    it('generates the extensions required by bluemix', function () {
      assert.file(`Sources/${applicationModule}/Extensions/CouchDBExtension.swift`)
    })

    it('imports the correct modules in Application.swift', function () {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'import CouchDB')
    })

    it('initialises cloudant', function () {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, ': CouchDBClient?')
    })

    it('creates the boilerplate to connect to cloudant', function () {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'manager.getCloudantService(name: "myCloudantService")')
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'CouchDBClient(service: cloudantService)')
    })

    it('generates the correct adapter for the resource', function () {
      assert.file(`Sources/${generatedModule}/${className}CloudantAdapter.swift`)
    })
  })

  describe('Generated a CRUD application with cloudant without bluemix', function () {
    var runContext
    var sdkScope

    before(function () {
      sdkScope = nock('https://mobilesdkgen.ng.bluemix.net')
        .filteringRequestBody(/.*/, '*')
        .post(`/sdkgen/api/generator/${appName}_iOS_SDK/ios_swift`, '*')
        .reply(200, { job: { id: 'myid' } })
        .get('/sdkgen/api/generator/myid/status')
        .reply(200, { status: 'FINISHED' })
        .get('/sdkgen/api/generator/myid')
        .replyWithFile(
          200,
          path.join(__dirname, '../resources/dummy_iOS_SDK.zip'),
          { 'Content-Type': 'application/zip' }
        )
      var spec = {
        appType: 'crud',
        appName: appName,
        bluemix: false,
        config: {
          logger: 'helium',
          port: 4567
        },
        services: {
          cloudant: [{
            name: 'myCloudantService'
          }]
        },
        'models': [
          {
            'name': modelName,
            'plural': modelPlural,
            'classname': className,
            'properties': {
              'id': {
                'type': 'string',
                'id': true
              },
              'title': {
                'type': 'string'
              }
            }
          }
        ],
        crudservice: 'myCloudantService'
      }
      runContext = helpers.run(path.join(__dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise()
    })

    after(function () {
      nock.cleanAll()
      runContext.cleanTestDirectory()
    })

    it('requested iOS SDK over http', function () {
      assert(sdkScope.isDone())
    })

    it('does not generate the extensions required by bluemix', function () {
      assert.noFile(`Sources/${applicationModule}/Extensions/CouchDBExtension.swift`)
    })

    it('generates the CloudantConfig', function () {
      assert.file(`Sources/${applicationModule}/CloudantConfig.swift`)
    })

    it('imports the correct modules in Application.swift', function () {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'import CouchDB')
    })

    it('initialises cloudant', function () {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, ': CouchDBClient?')
    })

    it('creates the boilerplate to connect to cloudant', function () {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'CloudantConfig(')
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'ConnectionProperties(')
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'CouchDBClient(connectionProperties: couchDBConnProps)')
    })
  })

  describe('Generate skeleton web application for bluemix with custom options', function () {
    var runContext

    before(function () {
        // Set up the spec file which should create all the necessary files for a server
      var spec = {
        appType: 'scaffold',
        appName: appName,
        web: true,
        bluemix: {
          'name': 'test',
          'host': 'myhost',
          'domain': 'mydomain.net',
          'namespace': 'mynamespace'
        },
        config: {
          logger: 'helium',
          port: 4567
        },
        docker: true
      }
      runContext = helpers.run(path.join(__dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise()
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    it('produces the correct name in the manifest', function () {
      assert.fileContent('manifest.yml', 'name: test')
    })

    it('produces the correct host in the manifest', function () {
      assert.fileContent('manifest.yml', 'host: myhost')
    })

    it('produces the correct domain in the manifest', function () {
      assert.fileContent('manifest.yml', 'domain: mydomain.net')
    })

    it('generates web only files and folders', function () {
      var expectedWebFiles = [`Sources/${applicationModule}/Routes/.keep`,
        `public/.keep`]
      assert.file(expectedWebFiles)
    })

    it('does not generate example endpoint content', function () {
      assert.noFile(`Sources/${applicationModule}/Routes/ProductRoutes.swift`)
      assert.noFileContent(`Sources/${applicationModule}/Application.swift`, 'initializeProductRoutes()')
    })

    it('does not host swagger definition', function () {
      assert.noFile(`Sources/${applicationModule}/Routes/SwaggerRoute.swift`)
      assert.noFileContent(`Sources/${applicationModule}/Application.swift`, 'initializeSwaggerRoute(')
    })

    it('does not define OPENAPI_SPEC environment variable', function () {
      assert.noFileContent('manifest.yml', 'OPENAPI_SPEC')
    })

    it('produces the correct memory in the manifest', function () {
      assert.fileContent('manifest.yml', 'memory: 128M')
    })

    it('produces the correct number of instances in the manifest', function () {
      assert.fileContent('manifest.yml', 'instances: 1')
    })

    it('produces the correct disk quota in the manifest', function () {
      assert.fileContent('manifest.yml', 'disk_quota: 1024M')
    })

    it('adds the proper chart-path in cli-config.yml', function () {
      assert.fileContent('cli-config.yml', 'chart-path : "chart/test"')
    })

    it('populates the correct name in Chart.yaml', function () {
      assert.fileContent('chart/test/Chart.yaml', 'name: test')
    })

    it('populates the correct values in values.yaml', function () {
      assert.fileContent('chart/test/values.yaml', 'repository: registry.mydomain.net/mynamespace/test')
    })
  })

  describe('Generate skeleton web application for bluemix with incorrect custom options', function () {
    var runContext

    before(function () {
        // Set up the spec file which should create all the necessary files for a server
      var spec = {
        appType: 'scaffold',
        appName: appName,
        web: true,
        bluemix: {
          'name': {},
          'host': {},
          'domain': true
        },
        config: {
          logger: 'helium',
          port: 4567
        }
      }
      runContext = helpers.run(path.join(__dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise()
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    it('produces the correct name in the manifest based on the app name', function () {
      assert.fileContent('manifest.yml', `name: ${appName}`)
    })

    it('produces sets random-route to true in the manifest', function () {
      assert.fileContent('manifest.yml', 'random-route: true')
    })
  })

  describe('Generate skeleton web application without bluemix', function () {
    var runContext

    before(function () {
        // Set up the spec file which should create all the necessary files for a server
      var spec = {
        appType: 'scaffold',
        appName: appName,
        bluemix: false,
        web: true,
        config: {
          logger: 'helium',
          port: 4567
        }
      }
      runContext = helpers.run(path.join(__dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise()
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    it('generates the expected files in the root of the project', function () {
      assert.file(expectedFiles)
    })

    it('generates the generic swift source files', function () {
      assert.file(`Sources/${executableModule}/main.swift`)
    })

    it('generates Application.swift', function () {
      assert.file(`Sources/${applicationModule}/Application.swift`)
    })

    it('generates web only file and folders', function () {
      var expectedExtensionFiles = [`Sources/${applicationModule}/Application.swift`,
        `public/.keep`]
      assert.file(expectedExtensionFiles)
    })

    it('does not generate the bluemix files', function () {
      assert.noFile(expectedBluemixFiles)
    })

    it('does not generate the docker files', function () {
      assert.noFile(expectedDockerFiles)
    })

    it('does not generate the kubernetes files', function () {
      assert.noFile(expectedKubernetesFiles)
    })
  })

  describe('Generate a web application with capabilities', function () {
    var runContext

    before(function () {
        // Set up the spec file which should create all the necessary files for a server
      var spec = {
        appType: 'scaffold',
        appName: appName,
        bluemix: false,
        web: true,
        config: {
          logger: 'helium',
          port: 4567
        },
        capabilities: {
          'metrics': true,
          'autoscale': 'myAutoScalingService'
        }
      }
      runContext = helpers.run(path.join(__dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise()
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    it('generates metrics and autoscale capabilities', function () {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'import SwiftMetrics')
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'import SwiftMetricsDash')
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'try SwiftMetrics()')
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'try SwiftMetricsDash(swiftMetricsInstance')
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'import SwiftMetricsBluemix')
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'SwiftMetricsBluemix(swiftMetricsInstance:')
    })
  })

  describe('Generate a web application with capabilities', function () {
    var runContext

    before(function () {
        // Set up the spec file which should create all the necessary files for a server
      var spec = {
        appType: 'scaffold',
        appName: appName,
        bluemix: false,
        web: true,
        config: {
          logger: 'helium',
          port: 4567
        },
        capabilities: {
          'metrics': true,
          'autoscale': false
        }
      }
      runContext = helpers.run(path.join(__dirname, '../../refresh'))
          .withOptions({
            specObj: spec
          })
      return runContext.toPromise()                        // Get a Promise back when the generator finishes
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    it('generates metrics without autoscale capabilities', function () {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'import SwiftMetrics')
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'import SwiftMetricsDash')
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'try SwiftMetrics()')
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'try SwiftMetricsDash(swiftMetricsInstance')
      assert.noFileContent(`Sources/${applicationModule}/Application.swift`, 'import SwiftMetricsBluemix')
      assert.noFileContent(`Sources/${applicationModule}/Application.swift`, 'SwiftMetricsBluemix(swiftMetricsInstance')
    })
  })

  describe('Generated a web application with cloudant for bluemix', function () {
    var runContext

    before(function () {
      var spec = {
        appType: 'scaffold',
        appName: appName,
        bluemix: true,
        web: true,
        config: {
          logger: 'helium',
          port: 4567
        },
        services: {
          cloudant: [{
            name: 'myCloudantService'
          }]
        }
      }
      runContext = helpers.run(path.join(__dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise()
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    it('generates the cloudant extensions required by bluemix', function () {
      assert.file(`Sources/${applicationModule}/Extensions/CouchDBExtension.swift`)
    })

    it('imports the correct modules in Application.swift', function () {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'import CouchDB')
    })

    it('initialises cloudant', function () {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'CouchDBClient?')
    })

    it('creates the boilerplate to connect to cloudant', function () {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'try manager.getCloudantService(name: "myCloudantService")')
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'CouchDBClient(service: cloudantService)')
    })
  })

  describe('Generated a web application with cloudant without bluemix', function () {
    var runContext

    before(function () {
      var spec = {
        appType: 'scaffold',
        appName: appName,
        bluemix: false,
        web: true,
        config: {
          logger: 'helium',
          port: 4567
        },
        services: {
          cloudant: [{
            name: 'myCloudantService'
          }]
        }
      }
      runContext = helpers.run(path.join(__dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise()
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    it('does not generate the extensions required by bluemix', function () {
      assert.noFile(`Sources/${applicationModule}/Extensions/CouchDBExtension.swift`)
    })

    it('generates the CloudantConfig', function () {
      assert.file(`Sources/${applicationModule}/CloudantConfig.swift`)
    })

    it('imports the correct modules in Application.swift', function () {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'import CouchDB')
    })

    it('initialises cloudant', function () {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'CouchDBClient?')
    })

    it('creates the boilerplate to connect to cloudant', function () {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'CloudantConfig(')
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'ConnectionProperties(')
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'CouchDBClient(connectionProperties: couchDBConnProps)')
    })
  })

  describe('Generated a web application with redis for bluemix', function () {
    var runContext

    before(function () {
      var spec = {
        appType: 'scaffold',
        appName: appName,
        bluemix: true,
        web: true,
        config: {
          logger: 'helium',
          port: 4567
        },
        services: {
          redis: [{
            name: 'myRedisService'
          }]
        }
      }
      runContext = helpers.run(path.join(__dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise()
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    it('generates the extensions required by bluemix', function () {
      assert.file(`Sources/${applicationModule}/Extensions/RedisExtension.swift`)
    })

    it('imports the correct modules in Application.swift', function () {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'import SwiftRedis')
    })

    it('initialises redis', function () {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'Redis?')
    })

    it('creates the boilerplate to connect to redis', function () {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'manager.getRedisService(name: "myRedisService")')
    })
  })

  describe('Generated a web application with redis without bluemix', function () {
    var runContext

    before(function () {
      var spec = {
        appType: 'scaffold',
        appName: appName,
        bluemix: false,
        web: true,
        config: {
          logger: 'helium',
          port: 4567
        },
        services: {
          redis: [{
            name: 'myRedisService'
          }]
        }
      }
      runContext = helpers.run(path.join(__dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise()
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    it('does not generate the extensions required by bluemix', function () {
      assert.noFile(`Sources/${applicationModule}/Extensions/RedisExtension.swift`)
    })

    it('generates the RedisConfig', function () {
      assert.file(`Sources/${applicationModule}/RedisConfig.swift`)
    })

    it('imports the correct modules in Application.swift', function () {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'import SwiftRedis')
    })

    it('initialises redis', function () {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'RedisConfig')
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'Redis?')
    })

    it('creates the boilerplate to connect to redis', function () {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'Redis()')
    })
  })

  describe('Generated a web application with objectstorage for bluemix', function () {
    var runContext

    before(function () {
      var spec = {
        appType: 'scaffold',
        appName: appName,
        bluemix: true,
        web: true,
        config: {
          logger: 'helium',
          port: 4567
        },
        services: {
          objectstorage: [{
            name: 'myObjectStorageService'
          }]
        }
      }
      runContext = helpers.run(path.join(__dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise()
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    it('does not generate the extensions required by bluemix', function () {
      assert.file(`Sources/${applicationModule}/Extensions/ObjStorageExtension.swift`)
    })

    it('imports the correct modules in Application.swift', function () {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'import BluemixObjectStorage')
    })

    it('initialises object storage', function () {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'internal var objectStorage: ObjectStorage?')
    })

    it('creates the boilerplate to connect to object storage', function () {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'try manager.getObjectStorageService(name: "myObjectStorageService")')
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'ObjectStorage(service: objectStorageService)')
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'objectStorage?.connectSync(service: objectStorageService)')
    })
  })

  describe('Generated a web application with watson conversation for bluemix', function () {
    var runContext

    before(function () {
      var spec = {
        appType: 'scaffold',
        appName: appName,
        bluemix: true,
        web: true,
        config: {
          logger: 'helium',
          port: 4567
        },
        services: {
          watsonconversation: [{
            name: 'myConversationService',
            version: '4-19-2017'
          }]
        }
      }
      runContext = helpers.run(path.join(__dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise()
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    it('generates the watson conversation extensions required by bluemix', function () {
      assert.file(`Sources/${applicationModule}/Extensions/WatsonConversationExtension.swift`)
    })

    it('imports the correct modules in Application.swift', function () {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'import ConversationV1')
    })

    it('initialises conversation', function () {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'Conversation?')
    })

    it('creates the boilerplate to connect to watson conversation service', function () {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'try manager.getWatsonConversationService')
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'conversation = Conversation(service: service, version: "4-19-2017")')
    })
  })

  describe('Generated a bff application with alert notification for bluemix', function () {
    var runContext

    before(function () {
      var spec = {
        appType: 'scaffold',
        appName: appName,
        bluemix: true,
        web: false,
        config: {
          logger: 'helium',
          port: 4567
        },
        services: {
          alertnotification: [{
            name: 'myAlertNotificationService'
          }]
        }
      }
      runContext = helpers.run(path.join(__dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise()
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    it('generates the Alert Notification extensions required by bluemix', function () {
      assert.file(`Sources/${applicationModule}/Extensions/AlertNotificationExtension.swift`)
    })

    it('imports the correct modules in Application.swift', function () {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'import AlertNotifications')
    })

    it('initialises alert notification', function () {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, '')
    })

    it('creates the boilerplate to connect to an alert notification service', function () {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'try manager.getAlertNotificationService')
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, '')
    })
  })

  describe('Generated a web application with push notifications for bluemix', function () {
    var runContext

    before(function () {
      var spec = {
        appType: 'scaffold',
        appName: appName,
        bluemix: true,
        web: true,
        config: {
          logger: 'helium',
          port: 4567
        },
        services: {
          pushnotifications: [{
            name: 'myPushNotificationsService',
            region: 'UK'
          }]
        }
      }
      runContext = helpers.run(path.join(__dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise()
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    it('generates the Push Notifications extensions required by bluemix', function () {
      assert.file(`Sources/${applicationModule}/Extensions/PushNotificationsExtension.swift`)
    })

    it('imports the correct modules in Application.swift', function () {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'import BluemixPushNotifications')
    })

    it('initialises push notifications', function () {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'internal var pushNotifications: PushNotifications?')
    })

    it('creates the boilerplate to connect to a push notifications service', function () {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'let pushNotificationsService = try manager.getPushSDKService(name: "myPushNotificationsService")')
    })

    it('creates the boilerplate to connect to a push notifications service', function () {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'pushNotifications = PushNotifications(service: pushNotificationsService, region: PushNotifications.Region.UK)')
    })
  })

  describe('Generated a web application for bluemix without services', function () {
    var runContext

    before(function () {
      var spec = {
        appType: 'scaffold',
        appName: appName,
        bluemix: true,
        web: true,
        config: {
          logger: 'helium',
          port: 4567
        },
        'models': [
          {
            'name': modelName,
            'plural': modelPlural,
            'classname': className,
            'properties': {
              'id': {
                'type': 'string',
                'id': true
              },
              'title': {
                'type': 'string'
              }
            }
          }
        ]
      }
      runContext = helpers.run(path.join(__dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise()
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    it('does not generate services in manifest.yml', function () {
      assert.noFileContent('manifest.yml', 'services:')
    })

    it('does not generate declared-services in manifest.yml', function () {
      assert.noFileContent('manifest.yml', 'declared-services:')
    })
  })

  describe('Rejected spec missing appType', function () {
    var runContext
    var error = null

    before(function () {
      var spec = {
        appName: appName,
        config: {
          logger: 'helium',
          port: 4567
        },
        services: {}
      }
      runContext = helpers.run(path.join(__dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise().catch(function (err) {
        error = err
      })
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    it('aborts the generator with an error', function () {
      assert(error, 'Should throw an error')
      assert(error.message.match('^.*appType is missing.*$'), 'Thrown error should be about missing appType')
    })
  })

  describe('Rejected spec with invalid appType', function () {
    var runContext
    var error = null

    before(function () {
      var spec = {
        appType: 'tomato',
        appName: appName,
        config: {
          logger: 'helium',
          port: 4567
        },
        services: {}
      }
      runContext = helpers.run(path.join(__dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise().catch(function (err) {
        error = err
      })
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    it('aborts the generator with an error', function () {
      assert(error, 'Should throw an error')
      assert(error.message.match('^.*appType is invalid.*$'), 'Thrown error should be about missing appType')
    })
  })

  describe('Rejected spec containing a service with no name', function () {
    var runContext
    var error = null

    before(function () {
      var spec = {
        appType: 'scaffold',
        appName: appName,
        web: true,
        config: {
          logger: 'helium',
          port: 4567
        },
        services: {
          objectstorage: [{
            label: 'Object-Storage'
          }]
        }
      }
      runContext = helpers.run(path.join(__dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise().catch(function (err) {
        error = err
      })
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    it('aborts the generator with an error', function () {
      assert(error, 'Should throw an error')
      assert(error.message.match('Service name is missing.*$'), 'Thrown error should be about missing service name')
    })
  })

  describe('Generate application with example endpoints and hosted Swagger for bluemix', function () {
    var runContext
    var sdkScope

    before(function () {
      sdkScope = nock('https://mobilesdkgen.ng.bluemix.net')
        .filteringRequestBody(/.*/, '*')
        .post(`/sdkgen/api/generator/${appName}_iOS_SDK/ios_swift`, '*')
        .reply(200, { job: { id: 'myid' } })
        .get('/sdkgen/api/generator/myid/status')
        .reply(200, { status: 'FINISHED' })
        .get('/sdkgen/api/generator/myid')
        .replyWithFile(
          200,
          path.join(__dirname, '../resources/dummy_iOS_SDK.zip'),
          { 'Content-Type': 'application/zip' }
        )

      // Set up the spec file which should create all the necessary files for a server
      var spec = {
        appType: 'scaffold',
        appName: appName,
        hostSwagger: true,
        exampleEndpoints: true,
        bluemix: true,
        config: {
          logger: 'helium',
          port: 4567
        },
        docker: true
      }
      runContext = helpers.run(path.join(__dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise()
    })

    after(function () {
      nock.cleanAll()
      runContext.cleanTestDirectory()
    })

    it('requested iOS SDK over http', function () {
      assert(sdkScope.isDone())
    })

    it('generates the expected files in the root of the project', function () {
      assert.file(expectedFiles)
    })

    it('generates the main.swift in the correct directory', function () {
      assert.file('Sources/todo/main.swift')
    })

    it('generates Application.swift', function () {
      assert.file(`Sources/${applicationModule}/Application.swift`)
    })

    it('generates the bluemix files', function () {
      assert.file(expectedBluemixFiles)
    })

    it('generates the docker files', function () {
      assert.file(expectedDockerFiles)
    })

    it('generates the kubernetes files with expected values', function () {
      assert.file(expectedKubernetesFiles)
    })

    it('defines example endpoints', function () {
      var productsRoutesFile = `Sources/${applicationModule}/Routes/ProductsRoutes.swift`
      assert.file(productsRoutesFile)
      assert.fileContent(productsRoutesFile, '"/products"')
      assert.fileContent(productsRoutesFile, '"/products/:id"')
      assert.fileContent(productsRoutesFile, 'send(json: [:])')
      assert.fileContent(productsRoutesFile, 'router.get(')
      assert.fileContent(productsRoutesFile, 'router.post(')
      assert.fileContent(productsRoutesFile, 'router.put(')
      assert.fileContent(productsRoutesFile, 'router.delete(')
    })

    it('init example endpoint routes', function () {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'initializeProductsRoutes()')
    })

    it('hosts swagger definition', function () {
      assert.file(`Sources/${applicationModule}/Routes/SwaggerRoute.swift`)
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'initializeSwaggerRoute(')
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'definitions')
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, appName + '.yaml')
    })

    it('defines OPENAPI_SPEC environment variable', function () {
      assert.fileContent('manifest.yml', 'OPENAPI_SPEC: "/swagger/api"')
    })

    it('does not generate NOTICES.txt', function () {
      assert.noFile('NOTICES.txt')
    })
  })

  describe('Generate application with example endpoints, hosted Swagger and SwaggerUI', function () {
    var runContext
    var sdkScope

    before(function () {
      sdkScope = nock('https://mobilesdkgen.ng.bluemix.net')
        .filteringRequestBody(/.*/, '*')
        .post(`/sdkgen/api/generator/${appName}_iOS_SDK/ios_swift`, '*')
        .reply(200, { job: { id: 'myid' } })
        .get('/sdkgen/api/generator/myid/status')
        .reply(200, { status: 'FINISHED' })
        .get('/sdkgen/api/generator/myid')
        .replyWithFile(
          200,
          path.join(__dirname, '../resources/dummy_iOS_SDK.zip'),
          { 'Content-Type': 'application/zip' }
        )

      // Set up the spec file which should create all the necessary files for a server
      var spec = {
        appType: 'scaffold',
        appName: appName,
        web: true,
        hostSwagger: true,
        swaggerUI: true,
        exampleEndpoints: true,
        config: {
          logger: 'helium',
          port: 4567
        }
      }
      runContext = helpers.run(path.join(__dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise()
    })

    after(function () {
      nock.cleanAll()
      runContext.cleanTestDirectory()
    })

    it('requested iOS SDK over http', function () {
      assert(sdkScope.isDone())
    })

    it('generates SwaggerUI', function () {
      assert.file('public/explorer/index.html')
      assert.file('public/explorer/swagger-ui.js')
      assert.file('public/explorer/css/style.css')
    })

    it('generates NOTICES.txt', function () {
      assert.file('NOTICES.txt')
    })
  })

  describe('Generate application for bluemix with a service whose name contains spaces', function () {
    var runContext

    before(function () {
        // Set up the spec file which should create all the necessary files for a server
      var spec = {
        appType: 'scaffold',
        appName: appName,
        bluemix: true,
        web: true,
        services: {
          cloudant: [{ name: 'name with spaces' }]
        },
        config: {
          logger: 'helium',
          port: 4567
        }
      }
      runContext = helpers.run(path.join(__dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise()
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    it('pipeline.yml quotes service name', function () {
      assert.fileContent('.bluemix/pipeline.yml', '"name with spaces"')
    })
  })

  describe('Generated a web application with appid for bluemix', function () {
    var runContext

    before(function () {
      var spec = {
        appType: 'scaffold',
        appName: appName,
        bluemix: true,
        web: true,
        config: {
          logger: 'helium',
          port: 4567
        },
        services: {
          appid: [{
            name: 'myAppIDService'
          }]
        }
      }
      runContext = helpers.run(path.join(__dirname, '../../refresh'))
        .withOptions({
          specObj: spec
        })
      return runContext.toPromise()
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    it('does not generate the extensions required by bluemix', function () {
      assert.file(`Sources/${applicationModule}/Extensions/AppIDExtension.swift`)
    })

    it('imports the correct modules in Application.swift', function () {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'import Credentials')
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'import BluemixAppID')
    })

    it('initialises AppID credentials and credentialsplugin', function () {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'internal var kituraCredentials: Credentials?')
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'internal var webappKituraCredentialsPlugin: WebAppKituraCredentialsPlugin?')
    })

    it('creates the boilerplate to connect to appid', function () {
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'manager.getAppIDService(name: "myAppIDService")')
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'WebAppKituraCredentialsPlugin(')
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'kituraCredentials = Credentials()')
      assert.fileContent(`Sources/${applicationModule}/Application.swift`, 'kituraCredentials?.register(plugin: ')
    })
  })
})
