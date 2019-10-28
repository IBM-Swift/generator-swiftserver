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

var appGeneratorPath = path.join(__dirname, '../../../app')
var commonTest = require('../../lib/common_test.js')

var bxdevConfigFile = commonTest.bxdevConfigFile
var cloudFoundryManifestFile = commonTest.cloudFoundryManifestFile
var cloudFoundryFiles = commonTest.cloudFoundryFiles
var bluemixFiles = commonTest.bluemixFiles

describe('Integration tests (prompt no build) for swiftserver:app', function () {
  describe('scaffold', function () {
    var applicationName = 'myapp'
    var executableModule = applicationName

    describe('base', function () {
      var runContext

      before(function () {
        runContext = helpers.run(appGeneratorPath)
                            .withOptions({ skipBuild: true })
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

      commonTest.itUsedDestinationDirectory(applicationName)

      commonTest.itCreatedCommonFiles(executableModule)
      commonTest.itHasCorrectFilesForSingleShotFalse()

      commonTest.itDidNotCreateClientSDKFile()
      commonTest.itDidNotCreateRoutes([ 'Swagger' ])
      commonTest.itDidNotCreateServiceFiles()
      commonTest.itDidNotCreateMetricsFiles()
      commonTest.itDidNotCreateWebFiles()
      commonTest.itDidNotCreateSwaggerUIFiles()

      commonTest.itHasPackageDependencies([
        'Kitura',
        'HeliumLogger',
        'CloudEnvironment',
        'Health'
      ])

      commonTest.itHasApplicationModuleImports([
        'Kitura',
        'CloudEnvironment',
        'Health'
      ])

      commonTest.itCreatedRoutes([ 'Health' ])

      it('created cloudfoundry files', function () {
        assert.file(cloudFoundryFiles)
      })

      it('created bluemix files', function () {
        assert.file(bluemixFiles)
      })

      it('cloudfoundry manifest contains the expected content', function () {
        assert.fileContent([
          [ cloudFoundryManifestFile, `name: ${applicationName}` ],
          [ cloudFoundryManifestFile, `command: '${executableModule}'` ],
          [ cloudFoundryManifestFile, 'random-route: true' ],
          [ cloudFoundryManifestFile, 'instances: 1' ],
          [ cloudFoundryManifestFile, 'memory: 128M' ],
          [ cloudFoundryManifestFile, 'timeout: 180' ]
        ])
        assert.noFileContent([
          [ cloudFoundryManifestFile, 'domain:' ],
          [ cloudFoundryManifestFile, 'host:' ],
          [ cloudFoundryManifestFile, 'namespace:' ],
          [ cloudFoundryManifestFile, 'OPENAPI_SPEC :' ]
        ])
      })

      /* it('cloudfoundry manifest defines health check details', function () {
        assert.fileContent([
          [ cloudFoundryManifestFile, 'health-check-type: http' ],
          [ cloudFoundryManifestFile, 'health-check-http-endpoint: /health' ]
        ])
      }) */

      it('cloudfoundry manifest does not define OPENAPI_SPEC', function () {
        assert.noFileContent(cloudFoundryManifestFile, 'OPENAPI_SPEC')
      })
    })

    describe('app pattern defaults', function () {
      describe('basic', function () {
        var runContext

        before(function () {
          runContext = helpers.run(appGeneratorPath)
                              .withOptions({ skipBuild: true })
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

        commonTest.itDidNotCreateClientSDKFile()
        commonTest.itDidNotCreateRoutes([ 'Swagger' ])
        commonTest.itDidNotCreateServiceFiles()
        commonTest.itDidNotCreateWebFiles()
        commonTest.itDidNotCreateSwaggerUIFiles()
        commonTest.itDidNotAddOpenAPIContent()

        commonTest.itHasPackageDependencies([ 'SwiftMetrics' ])

        commonTest.itCreatedMetricsFilesWithExpectedContent()

        it('created ibmcloud dev config file', function () {
          assert.file(bxdevConfigFile)
        })

        commonTest.itCreatedDockerFilesWithExpectedContent(applicationName)

        // NOTE(tunniclm): For now we have overloaded the docker
        // option to produce kubernetes files as well
        commonTest.itCreatedKubernetesFilesWithExpectedContent({
          applicationName: applicationName
        })
      })

      describe('web', function () {
        var runContext

        before(function () {
          runContext = helpers.run(appGeneratorPath)
                              .withOptions({ skipBuild: true })
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

        commonTest.itDidNotCreateClientSDKFile()
        commonTest.itDidNotCreateRoutes([ 'Swagger' ])
        commonTest.itDidNotCreateServiceFiles()
        commonTest.itDidNotCreateSwaggerUIFiles()
        commonTest.itDidNotAddOpenAPIContent()

        commonTest.itHasPackageDependencies([ 'SwiftMetrics' ])

        commonTest.itCreatedMetricsFilesWithExpectedContent()
        commonTest.itCreatedWebFiles()

        it('created ibmcloud dev config file', function () {
          assert.file(bxdevConfigFile)
        })

        commonTest.itCreatedDockerFilesWithExpectedContent(applicationName)

        // NOTE(tunniclm): For now we have overloaded the docker
        // option to produce kubernetes files as well
        commonTest.itCreatedKubernetesFilesWithExpectedContent({
          applicationName: applicationName
        })
      })
    })

    describe('with single shot option', function () {
      var runContext

      before(function () {
        runContext = helpers.run(appGeneratorPath)
                            .withOptions({ skipBuild: true, singleShot: true })
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

      commonTest.itUsedDestinationDirectory(applicationName)

      commonTest.itCreatedCommonFiles(executableModule)
      commonTest.itHasCorrectFilesForSingleShotTrue()
    })

    describe('with web', function () {
      var runContext

      before(function () {
        runContext = helpers.run(appGeneratorPath)
                            .withOptions({ skipBuild: true })
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

      commonTest.itCreatedWebFiles()
    })

    describe('with metrics', function () {
      var runContext

      before(function () {
        runContext = helpers.run(appGeneratorPath)
                            .withOptions({ skipBuild: true })
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

      commonTest.itHasPackageDependencies([ 'SwiftMetrics' ])
      commonTest.itCreatedMetricsFilesWithExpectedContent()
    })

    describe('with openapi', function () {
      var runContext

      before(function () {
        runContext = helpers.run(appGeneratorPath)
                            .withOptions({ skipBuild: true })
                            .withPrompts({
                              name: applicationName,
                              appType: 'Scaffold a starter',
                              capabilities: [ 'Kitura OpenAPI' ],
                              endpoints: []
                            })
        return runContext.toPromise()
      })
      after(function () {
        runContext.cleanTestDirectory()
      })
      commonTest.itHasPackageDependencies([ 'Kitura-OpenAPI' ])
      commonTest.itAddedOpenAPIContent()
    })

    describe('with docker', function () {
      var runContext

      before(function () {
        runContext = helpers.run(appGeneratorPath)
                            .withOptions({ skipBuild: true })
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

      it('created ibmcloud dev config file', function () {
        assert.file(bxdevConfigFile)
      })

      commonTest.itCreatedDockerFilesWithExpectedContent(applicationName)

      // NOTE(tunniclm): For now we have overloaded the docker
      // option to produce kubernetes files as well
      commonTest.itCreatedKubernetesFilesWithExpectedContent({
        applicationName: applicationName
      })
    })

    describe('with swaggerui', function () {
      var runContext

      before(function () {
        runContext = helpers.run(appGeneratorPath)
                            .withOptions({ skipBuild: true })
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

      commonTest.itCreatedRoutes([ 'Swagger' ])

      it('cloudfoundry manifest defines OPENAPI_SPEC environment variable', function () {
        assert.fileContent(cloudFoundryManifestFile, 'OPENAPI_SPEC : "/swagger/api"')
      })

      commonTest.itCreatedWebFiles()
      commonTest.itCreatedSwaggerUIFiles()
    })

    describe('with cloudant', function () {
      describe('default credentials', function () {
        var runContext

        before(function () {
          runContext = helpers.run(appGeneratorPath)
                              .withOptions({ skipBuild: true })
                              .withPrompts({
                                name: applicationName,
                                appType: 'Scaffold a starter',
                                capabilities: [],
                                services: [ 'Cloudant / CouchDB' ],
                                configure: [ 'Cloudant / CouchDB' ],
                                cloudantName: 'myCloudantService'
                              })
          return runContext.toPromise()
        })

        after(function () {
          runContext.cleanTestDirectory()
        })

        commonTest.itCreatedServiceConfigFiles()
        commonTest.cloudant.itCreatedServiceFilesWithExpectedContent('myCloudantService', {
          url: 'http://localhost:5984'
        })
      })

      describe('non-default credentials', function () {
        describe('without username and password', function () {
          var runContext

          before(function () {
            runContext = helpers.run(appGeneratorPath)
                                .withOptions({ skipBuild: true })
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

          commonTest.itCreatedServiceConfigFiles()
          commonTest.cloudant.itCreatedServiceFilesWithExpectedContent('myCloudantService', {
            url: 'https://cloudanthost:4568'
          })
        })

        describe('with username and password', function () {
          var runContext

          before(function () {
            runContext = helpers.run(appGeneratorPath)
                                .withOptions({ skipBuild: true })
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
                                  cloudantPassword: 'password1234'
                                })
            return runContext.toPromise()
          })

          after(function () {
            runContext.cleanTestDirectory()
          })

          commonTest.itCreatedServiceConfigFiles()
          commonTest.cloudant.itCreatedServiceFilesWithExpectedContent('myCloudantService', {
            username: 'admin',
            password: 'password1234',
            url: 'https://admin:password1234@cloudanthost:4568'
          })
        })
      })
    })

    describe('with redis', function () {
      describe('default credentials', function () {
        var runContext

        before(function () {
          runContext = helpers.run(appGeneratorPath)
                              .withOptions({ skipBuild: true })
                              .withPrompts({
                                name: applicationName,
                                appType: 'Scaffold a starter',
                                capabilities: [],
                                services: [ 'Redis' ],
                                configure: [ 'Redis' ],
                                redisName: 'myRedisService'
                              })
          return runContext.toPromise()
        })

        after(function () {
          runContext.cleanTestDirectory()
        })

        commonTest.itCreatedServiceConfigFiles()
        commonTest.redis.itCreatedServiceFilesWithExpectedContent('myRedisService', {
          uri: 'redis://:@localhost:6379'
        })
      })

      describe('non-default credentials', function () {
        var runContext

        before(function () {
          runContext = helpers.run(appGeneratorPath)
                              .withOptions({ skipBuild: true })
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

        commonTest.itCreatedServiceConfigFiles()
        commonTest.redis.itCreatedServiceFilesWithExpectedContent('myRedisService', {
          uri: 'redis://:password1234@myhost:1234'
        })
      })
    })

    describe('with postgresql', function () {
      describe('default credentials', function () {
        var runContext

        before(function () {
          runContext = helpers.run(appGeneratorPath)
                              .withOptions({ skipBuild: true })
                              .withPrompts({
                                name: applicationName,
                                appType: 'Scaffold a starter',
                                capabilities: [],
                                services: [ 'PostgreSQL' ],
                                configure: [ 'PostgreSQL' ],
                                postgresqlName: 'myPostgreSQLService'
                              })
          return runContext.toPromise()
        })

        after(function () {
          runContext.cleanTestDirectory()
        })

        commonTest.itCreatedServiceConfigFiles()
        commonTest.postgresql.itCreatedServiceFilesWithExpectedContent('myPostgreSQLService', {
          uri: 'postgres://localhost:5432/database'
        })
      })

      describe('non-default credentials', function () {
        var runContext

        before(function () {
          runContext = helpers.run(appGeneratorPath)
                              .withOptions({ skipBuild: true })
                              .withPrompts({
                                name: applicationName,
                                appType: 'Scaffold a starter',
                                capabilities: [],
                                services: [ 'PostgreSQL' ],
                                configure: [ 'PostgreSQL' ],
                                postgresqlName: 'myPostgreSQLService',
                                postgresqlHost: 'myhost',
                                postgresqlPort: '1234',
                                postgresqlUsername: 'admin',
                                postgresqlPassword: 'password1234',
                                postgresqlDatabase: 'mydb'
                              })
          return runContext.toPromise()
        })

        after(function () {
          runContext.cleanTestDirectory()
        })

        commonTest.itCreatedServiceConfigFiles()
        commonTest.postgresql.itCreatedServiceFilesWithExpectedContent('myPostgreSQLService', {
          uri: 'postgres://admin:password1234@myhost:1234/mydb'
        })
      })
    })

    describe('with elephantsql', function () {
      describe('default credentials', function () {
        var runContext

        before(function () {
          runContext = helpers.run(appGeneratorPath)
                              .withOptions({ skipBuild: true })
                              .withPrompts({
                                name: applicationName,
                                appType: 'Scaffold a starter',
                                capabilities: [],
                                services: [ 'ElephantSQL' ],
                                configure: [ 'ElephantSQL' ],
                                elephantsqlName: 'myElephantSQLService'
                              })
          return runContext.toPromise()
        })

        after(function () {
          runContext.cleanTestDirectory()
        })

        commonTest.itCreatedServiceConfigFiles()
        commonTest.elephantsql.itCreatedServiceFilesWithExpectedContent('myElephantSQLService', {
          uri: 'postgres://localhost:5432/database'
        })
      })

      describe('non-default credentials', function () {
        var runContext

        before(function () {
          runContext = helpers.run(appGeneratorPath)
                              .withOptions({ skipBuild: true })
                              .withPrompts({
                                name: applicationName,
                                appType: 'Scaffold a starter',
                                capabilities: [],
                                services: [ 'ElephantSQL' ],
                                configure: [ 'ElephantSQL' ],
                                elephantsqlName: 'myElephantSQLService',
                                elephantsqlHost: 'myhost',
                                elephantsqlPort: '1234',
                                elephantsqlUsername: 'admin',
                                elephantsqlPassword: 'password1234',
                                elephantsqlDatabase: 'mydb'
                              })
          return runContext.toPromise()
        })

        after(function () {
          runContext.cleanTestDirectory()
        })

        commonTest.itCreatedServiceConfigFiles()
        commonTest.elephantsql.itCreatedServiceFilesWithExpectedContent('myElephantSQLService', {
          uri: 'postgres://admin:password1234@myhost:1234/mydb'
        })
      })
    })

    describe('with appid', function () {
      describe('default credentials', function () {
        var runContext

        before(function () {
          runContext = helpers.run(appGeneratorPath)
                              .withOptions({ skipBuild: true })
                              .withPrompts({
                                name: applicationName,
                                appType: 'Scaffold a starter',
                                capabilities: [],
                                services: [ 'AppID' ],
                                configure: [ 'AppID' ],
                                appidName: 'myAppIDService'
                              })
          return runContext.toPromise()
        })

        after(function () {
          runContext.cleanTestDirectory()
        })

        commonTest.itCreatedServiceConfigFiles()
        commonTest.appid.itCreatedServiceFilesWithExpectedContent('myAppIDService', {
          tenantId: '',
          clientId: '',
          secret: '',
          oauthServerUrl: '',
          profilesUrl: ''
        })
      })

      describe('non-default credentials', function () {
        var runContext

        before(function () {
          runContext = helpers.run(appGeneratorPath)
                              .withOptions({ skipBuild: true })
                              .withPrompts({
                                name: applicationName,
                                appType: 'Scaffold a starter',
                                capabilities: [],
                                services: [ 'AppID' ],
                                configure: [ 'AppID' ],
                                appidName: 'myAppIDService',
                                appidTenantId: 'myTenantId',
                                appidClientId: 'myClientId',
                                appidSecret: 'mySecret'
                              })
          return runContext.toPromise()
        })

        after(function () {
          runContext.cleanTestDirectory()
        })

        commonTest.itCreatedServiceConfigFiles()
        commonTest.appid.itCreatedServiceFilesWithExpectedContent('myAppIDService', {
          tenantId: 'myTenantId',
          clientId: 'myClientId',
          secret: 'mySecret',
          oauthServerUrl: '',
          profilesUrl: ''
        })
      })
    })

    describe('with watson assistant', function () {
      describe('default credentials', function () {
        var runContext

        before(function () {
          runContext = helpers.run(appGeneratorPath)
                              .withOptions({ skipBuild: true })
                              .withPrompts({
                                name: applicationName,
                                appType: 'Scaffold a starter',
                                capabilities: [],
                                services: [ 'Watson Assistant, formerly Conversation' ],
                                configure: [ 'Watson Assistant' ],
                                watsonAssistantName: 'myAssistantService'
                              })
          return runContext.toPromise()
        })

        after(function () {
          runContext.cleanTestDirectory()
        })

        commonTest.itCreatedServiceConfigFiles()
        commonTest.watsonassistant.itCreatedServiceFilesWithExpectedContent('myAssistantService', {
          url: 'https://gateway.watsonplatform.net/assistant/api',
          apikey: ''
        })
      })

      describe('non-default credentials', function () {
        var runContext

        before(function () {
          runContext = helpers.run(appGeneratorPath)
                              .withOptions({ skipBuild: true })
                              .withPrompts({
                                name: applicationName,
                                appType: 'Scaffold a starter',
                                capabilities: [],
                                services: [ 'Watson Assistant, formerly Conversation' ],
                                configure: [ 'Watson Assistant' ],
                                watsonAssistantName: 'myAssistantService',
                                watsonAssistantAPIKey: 'apikey1234',
                                watsonAssistantUrl: 'https://myhost'
                              })
          return runContext.toPromise()
        })

        after(function () {
          runContext.cleanTestDirectory()
        })

        commonTest.itCreatedServiceConfigFiles()
        commonTest.watsonassistant.itCreatedServiceFilesWithExpectedContent('myAssistantService', {
          url: 'https://myhost',
          apikey: 'apikey1234'
        })
      })
    })

    describe('with alert notification', function () {
      describe('default credentials', function () {
        var runContext

        before(function () {
          runContext = helpers.run(appGeneratorPath)
                              .withOptions({ skipBuild: true })
                              .withPrompts({
                                name: applicationName,
                                appType: 'Scaffold a starter',
                                capabilities: [],
                                services: [ 'Alert Notification' ],
                                configure: [ 'Alert Notification' ],
                                alertNotificationName: 'myAlertNotificationService'
                              })
          return runContext.toPromise()
        })

        after(function () {
          runContext.cleanTestDirectory()
        })

        commonTest.itCreatedServiceConfigFiles()
        commonTest.alertnotification.itCreatedServiceFilesWithExpectedContent('myAlertNotificationService', {
          url: '',
          name: '',
          password: ''
        })
      })

      describe('non-default credentials', function () {
        var runContext

        before(function () {
          runContext = helpers.run(appGeneratorPath)
                              .withOptions({ skipBuild: true })
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

        commonTest.itCreatedServiceConfigFiles()
        commonTest.alertnotification.itCreatedServiceFilesWithExpectedContent('myAlertNotificationService', {
          url: 'https://myhost',
          name: 'admin',
          password: 'password1234'
        })
      })
    })

    describe('with push notifications', function () {
      describe('default credentials', function () {
        var runContext

        before(function () {
          runContext = helpers.run(appGeneratorPath)
                              .withOptions({ skipBuild: true })
                              .withPrompts({
                                name: applicationName,
                                appType: 'Scaffold a starter',
                                capabilities: [],
                                services: [ 'Push Notifications' ],
                                configure: [ 'Push Notifications' ],
                                pushNotificationsName: 'myPushNotificationsService'
                              })
          return runContext.toPromise()
        })

        after(function () {
          runContext.cleanTestDirectory()
        })

        commonTest.itCreatedServiceConfigFiles()
        commonTest.pushnotifications.itCreatedServiceFilesWithExpectedContent('myPushNotificationsService', {
          appGuid: '',
          apikey: '',
          clientSecret: ''
        })
      })

      describe('non-default credentials', function () {
        var runContext

        before(function () {
          runContext = helpers.run(appGeneratorPath)
                              .withOptions({ skipBuild: true })
                              .withPrompts({
                                name: applicationName,
                                appType: 'Scaffold a starter',
                                capabilities: [],
                                services: [ 'Push Notifications' ],
                                configure: [ 'Push Notifications' ],
                                pushNotificationsName: 'myPushNotificationsService',
                                pushNotificationsAppGuid: 'myAppGuid',
                                pushNotificationsAPIKey: 'myAPIKey',
                                pushNotificationsRegion: 'United Kingdom'
                              })
          return runContext.toPromise()
        })

        after(function () {
          runContext.cleanTestDirectory()
        })

        commonTest.itCreatedServiceConfigFiles()
        commonTest.pushnotifications.itCreatedServiceFilesWithExpectedContent('myPushNotificationsService', {
          appGuid: 'myAppGuid',
          apikey: 'myAPIKey',
          clientSecret: '',
          url: 'https://imfpush.eu-gb.bluemix.net'
        })
      })
    })

    describe('with autoscaling (implies metrics)', function () {
      var runContext

      before(function () {
        runContext = helpers.run(appGeneratorPath)
                            .withOptions({ skipBuild: true })
                            .withPrompts({
                              name: applicationName,
                              appType: 'Scaffold a starter',
                              capabilities: [],
                              services: [ 'Auto-scaling' ],
                              configure: [ 'Auto-scaling' ],
                              autoscalingName: 'myAutoscalingService'
                            })
        return runContext.toPromise()
      })

      after(function () {
        runContext.cleanTestDirectory()
      })

      commonTest.itCreatedMetricsFilesWithExpectedContent()
      commonTest.autoscaling.itCreatedServiceFilesWithExpectedContent('myAutoscalingService')
    })

    describe('with --init flag set', function () {
      var runContext
      var appName = 'fishcakes'

      before(function () {
        runContext = helpers.run(appGeneratorPath)
                            .withOptions({ skipBuild: true, init: true })
                            .inTmpDir(function (tmpDir) {
                              this.inDir(path.join(tmpDir, appName))
                            })

        return runContext.toPromise()
      })

      after(function () {
        runContext.cleanTestDirectory()
      })

      commonTest.itCreatedCommonFiles(appName)
      commonTest.itCreatedMetricsFilesWithExpectedContent()
      commonTest.itCreatedDockerFilesWithExpectedContent(appName)
    })
  })

  describe('crud', function () {
    // TODO base
    // TODO with server sdk
    // TODO with metrics
    // TODO with docker
    // TODO with autoscaling
    // TODO with cloudant
  })

// -- OLD
//  describe('Starter with generated iOS and Swift Server SDK', function () {
//    this.timeout(extendedTimeout)
//    var runContext
//    var appName = 'notes'
//
//    before(function () {
//      runContext = helpers.run(appGeneratorPath)
//                          .withOptions({ 'skip-build': true })
//                          .withPrompts({
//                            appType: 'Scaffold a starter',
//                            name: appName,
//                            dir: appName,
//                            appPattern: 'Basic',
//                            endpoints: 'Endpoints from swagger file',
//                            swaggerChoice: 'Custom swagger file',
//                            path: testResourcesPath + '/petstore.yaml',
//                            serverSwaggerInput0: true,
//                            serverSwaggerInputPath0: testResourcesPath + '/petstore.yaml',
//                            serverSwaggerInput1: true,
//                            serverSwaggerInputPath1: testResourcesPath + '/petstore2.yaml',
//                            serverSwaggerInput2: false
//                          })
//
//      return runContext.toPromise()
//    })
//
//    it('created a iOS SDK zip file', function () {
//      assert.file(appName + '_iOS_SDK.zip')
//    })
//
//    it('modified .gitignore to include the generated iOS SDK', function () {
//      assert.fileContent('.gitignore', '/' + appName + '_iOS_SDK*')
//    })
//
//    it('deleted a server SDK zip file', function () {
//      assert.noFile('Swagger_Petstore_ServerSDK.zip')
//    })
//
//    it('unzipped server SDK folder was deleted', function () {
//      assert.noFile('Swagger_Petstore_ServerSDK/README.md')
//    })
//
//    it('created Pet model from swagger file', function () {
//      assert.file('Sources/Swagger_Petstore_ServerSDK/Pet.swift')
//    })
//
//    it('modified Package.swift to include server SDK module', function () {
//      assert.fileContent('Package.swift', 'Swagger_Petstore_ServerSDK')
//    })
//
//    it('deleted the second server SDK zip file', function () {
//      assert.noFile('Swagger_Petstore_Two_ServerSDK.zip')
//    })
//
//    it('unzipped the second server SDK folder was deleted', function () {
//      assert.noFile('Swagger_Petstore_Two_ServerSDK/README.md')
//    })
//
//    it('created Pet model from the second swagger file', function () {
//      assert.file('Sources/Swagger_Petstore_Two_ServerSDK/Pet.swift')
//    })
//
//    it('modified Package.swift to include the second server SDK module', function () {
//      assert.fileContent('Package.swift', 'Swagger_Petstore_Two_ServerSDK')
//    })
//  })
//
//  describe('CRUD application where application name and directory name are the current (empty) directory', function () {
//    var runContext
//
//    before(function () {
//      runContext = helpers.run(appGeneratorPath)
//                          .withOptions({ 'skip-build': true })
//                          .withPrompts({
//                            appType: 'Generate a CRUD application',
//                            name: 'notes'
//                          })
//                          .inTmpDir(function (tmpDir) {
//                            this.inDir(path.join(tmpDir, 'notes'))
//                          })
//      return runContext.toPromise()                        // Get a Promise back when the generator finishes
//    })
//
//    it('used the empty directory for the project', function () {
//      assert.equal(path.basename(process.cwd()), 'notes')
//      assert.file('.swiftservergenerator-project')
//    })
//  })
})
