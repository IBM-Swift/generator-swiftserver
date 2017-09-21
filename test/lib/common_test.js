/*
 * Copyright IBM Corporation 2017
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
var path = require('path')

var helpers = require('../../lib/helpers')

exports.generatorVersion = require('../../package.json').version

//
// Files
//
exports.defaultProjectDirectory = 'swiftserver'
exports.packageFile = 'Package.swift'
exports.projectMarkerFile = '.swiftservergenerator-project'
exports.generatorConfigFile = '.yo-rc.json'
exports.generatorSpecFile = 'spec.json'
exports.licenseFile = 'LICENSE'
exports.noticesFile = 'NOTICES.txt'
exports.readmeFile = 'README.md'

exports.configMappingsFile = 'config/mappings.json'
exports.configCredentialsFile = 'config/localdev-config.json'

exports.generatedModule = 'Generated'
exports.generatedSourceDir = `Sources/${exports.generatedModule}`
exports.modelDir = 'models'
exports.applicationModule = 'Application'
exports.applicationSourceDir = `Sources/${exports.applicationModule}`
exports.applicationSourceFile = `${exports.applicationSourceDir}/Application.swift`
exports.routesSourceDir = `${exports.applicationSourceDir}/Routes`
exports.servicesSourceDir = `${exports.applicationSourceDir}/Services`
exports.webDir = 'public'
exports.swaggerUIDir = `${exports.webDir}/explorer`

exports.modelFileGenerator = (modelName) => `${exports.modelDir}/${modelName}.json`
exports.modelSourceFilesGenerator = (className) => [
  `Sources/${exports.generatedModule}/${className}.swift`,
  `Sources/${exports.generatedModule}/${className}Adapter.swift`,
  `Sources/${exports.generatedModule}/${className}Resource.swift`
]
exports.crudSourceFiles = [
  `Sources/${exports.generatedModule}/AdapterError.swift`,
  `Sources/${exports.generatedModule}/ModelError.swift`,
  `Sources/${exports.generatedModule}/AdapterFactory.swift`,
  `Sources/${exports.generatedModule}/CRUDResources.swift`
]

exports.bxdevConfigFile = 'cli-config.yml'
exports.cloudFoundryManifestFile = 'manifest.yml'
exports.cloudFoundryFiles = [ exports.cloudFoundryManifestFile, '.cfignore' ]
exports.bluemixPipelineFile = '.bluemix/pipeline.yml'
exports.bluemixFiles = [ exports.bluemixPipelineFile,
  '.bluemix/toolchain.yml',
  '.bluemix/deploy.json' ]
exports.dockerFiles = [ 'Dockerfile', 'Dockerfile-tools', '.dockerignore' ]
exports.kubernetesChartFileGenerator = (applicationName) => `chart/${applicationName}/Chart.yaml`
exports.kubernetesValuesFileGenerator = (applicationName) => `chart/${applicationName}/values.yaml`
exports.kubernetesDeploymentFileGenerator = (applicationName) => `chart/${applicationName}/templates/deployment.yaml`
exports.kubernetesServiceFileGenerator = (applicationName) => `chart/${applicationName}/templates/service.yaml`
exports.kubernetesFilesGenerator = (applicationName) => [
  exports.kubernetesChartFileGenerator(applicationName),
  exports.kubernetesValuesFileGenerator(applicationName),
  exports.kubernetesDeploymentFileGenerator(applicationName),
  exports.kubernetesServiceFileGenerator(applicationName)
]

//
// Prompts
//
exports.capabilityDisplayNames = {
  web: 'Static web file serving',
  swaggerUI: 'Swagger UI',
  metrics: 'Embedded metrics dashboard',
  docker: 'Docker files'
}

exports.serviceDisplayNames = {
  cloudant: 'Cloudant / CouchDB',
  redis: 'Redis',
  mongodb: 'MongoDB',
  postgresql: 'PostreSQL',
  objectstorage: 'Object Storage',
  appid: 'AppID',
  watsonconversation: 'Watson Conversation',
  alertnotification: 'Alert Notification',
  pushnotifications: 'Push Notifications',
  autoscaling: 'Auto-scaling'
}

//
// Destination directory
//
exports.itUsedDestinationDirectory = function (dir) {
  it('uses correct destination directory according to dir value', function () {
    assert.equal(path.basename(process.cwd()), dir)
  })
}

exports.itUsedDefaultDestinationDirectory = function () {
  it('uses default destination directory', function () {
    assert.equal(path.basename(process.cwd()), exports.defaultProjectDirectory)
  })
}

//
// Common
//
exports.itCreatedCommonFiles = function (executableModule) {
  var files = [
    exports.packageFile,
    exports.licenseFile,
    exports.readmeFile,
    exports.generatorSpecFile,
    `Sources/${executableModule}/main.swift`,
    'Sources/Application/Application.swift',
    'Tests/ApplicationTests/RouteTests.swift',
    'Tests/LinuxMain.swift'
  ]
  files.forEach(filepath => {
    var filename = path.basename(filepath)
    it(`created a ${filename} file`, function () {
      assert.file(filepath)
    })
  })
}

exports.applicationImportsModules = function (moduleNameOrModuleNames) {
  var moduleNames = Array.isArray(moduleNameOrModuleNames) ? moduleNameOrModuleNames : [moduleNameOrModuleNames]
  moduleNames.forEach(moduleName => {
    it(`application imports $(moduleName)`, function () {
      assert.fileContent(exports.applicationSourceFile, `import ${moduleName}`)
    })
  })
}

exports.itHasCorrectFilesForSingleShotTrue = function () {
  var files = [
    exports.projectMarkerFile,
    exports.generatorConfigFile
  ]
  files.forEach(filepath => {
    var filename = path.basename(filepath)
    it(`did not create ${filename} file`, function () {
      assert.noFile(filepath)
    })
  })
}

exports.itHasCorrectFilesForSingleShotFalse = function () {
  var files = [
    exports.projectMarkerFile,
    exports.generatorConfigFile
  ]
  files.forEach(filepath => {
    var filename = path.basename(filepath)
    it(`created a ${filename} file`, function () {
      assert.file(filepath)
    })
  })

  var expectedConfig = { 'generator-swiftserver': { version: exports.generatorVersion } }
  it(`${exports.generatorConfigFile} contains generator version`, function () {
    assert.jsonFileContent(exports.generatorConfigFile, expectedConfig)
  })
}

exports.itDidNotCreateClientSDKFile = function (applicationName) {
  it('did not create a client sdk zip file', function () {
    assert.noFile(applicationName + '_iOS_SDK.zip')
  })
}

exports.itCreatedClientSDKFile = function (applicationName) {
  it('created a client sdk zip file', function () {
    assert.file(applicationName + '_iOS_SDK.zip')
  })
}

//
// Routes
//
exports.itCreatedRoutes = function (routeNameOrRouteNames) {
  var routeNames = Array.isArray(routeNameOrRouteNames) ? routeNameOrRouteNames : [routeNameOrRouteNames]
  routeNames.forEach(routeName => {
    it(`created a routes source file for ${routeName}`, function () {
      assert.file(`Sources/Application/Routes/${routeName}Routes.swift`)
    })
    it(`application initializes ${routeName} routes`, function () {
      assert.fileContent('Sources/Application/Application.swift',
                         `initialize${routeName}Routes(`)
    })
  })
}

exports.itDidNotCreateRoutes = function (routeNameOrRouteNames) {
  var routeNames = Array.isArray(routeNameOrRouteNames) ? routeNameOrRouteNames : [routeNameOrRouteNames]
  routeNames.forEach(routeName => {
    it(`did not create a routes source file for ${routeName}`, function () {
      assert.noFile(`Sources/Application/Routes/${routeName}Routes.swift`)
    })
    it(`application does not initialize ${routeName} routes`, function () {
      assert.noFileContent('Sources/Application/Application.swift',
                         `initialize${routeName}Routes(`)
    })
  })
}

//
// Package dependencies
//
exports.itHasPackageDependencies = function (depOrDeps) {
  var deps = Array.isArray(depOrDeps) ? depOrDeps : [depOrDeps]
  deps.forEach(dep => {
    it(`has package dependency ${dep}`, function () {
      assert.fileContent(exports.packageFile, `/${dep}.git`)
    })
  })
}

//
// Build output
//
exports.itCompiledExecutableModule = function (executableModule) {
  var executableFile = `.build/debug/${executableModule}`

  it(`compiled executable module ${executableModule}`, function () {
    assert.file(executableFile)
  })
}

exports.itCreatedXCodeProjectWorkspace = function (applicationName) {
  var workspaceFile = `${applicationName}.xcodeproj`

  it(`created an XCode project workspace file ${workspaceFile}`, function () {
    assert.file(workspaceFile)
  })
}

//
// Metrics
//
exports.itDidNotCreateMetricsFiles = function () {
  it('did not create metrics boilerplate', function () {
    assert.noFile(`${exports.applicationSourceDir}/Metrics.swift`)
  })

  it('application does not initialize metrics', function () {
    assert.noFileContent(exports.applicationSourceFile, 'initializeMetrics()')
  })
}

exports.itCreatedMetricsFilesWithExpectedContent = function () {
  it('created metrics boilerplate', function () {
    assert.file(`${exports.applicationSourceDir}/Metrics.swift`)
  })

  it('metrics boilerplate contains expected content', function () {
    var metricsFile = `${exports.applicationSourceDir}/Metrics.swift`
    assert.fileContent([
      [metricsFile, 'import SwiftMetrics'],
      [metricsFile, 'import SwiftMetricsDash'],
      [metricsFile, 'swiftMetrics: SwiftMetrics'],
      [metricsFile, 'func initializeMetrics()'],
      [metricsFile, 'SwiftMetrics()'],
      [metricsFile, 'try SwiftMetricsDash(']
    ])
  })

  it('application initializes metrics', function () {
    assert.fileContent(exports.applicationSourceFile, 'initializeMetrics()')
  })
}

//
// Web
//
exports.itDidNotCreateWebFiles = function () {
  it('did not create a web content directory', function () {
    assert.noFile(`${exports.webDir}/.keep`)
  })

  it('application does not initialize file serving middleware', function () {
    assert.noFileContent(exports.applicationSourceFile,
                         'router.all(middleware: StaticFileServer())')
  })
}

exports.itCreatedWebFiles = function () {
  it('created a web content directory', function () {
    assert.file(`${exports.webDir}/.keep`)
  })

  it('application initializes file serving middleware', function () {
    assert.fileContent(exports.applicationSourceFile,
                       'router.all(middleware: StaticFileServer())')
  })
}

//
// SwaggerUI
//
exports.itDidNotCreateSwaggerUIFiles = function () {
  it('did not create swaggerui files', function () {
    assert.noFile(`${exports.swaggerUIDir}/index.html`)
    assert.noFile(`${exports.swaggerUIDir}/swagger-ui.js`)
    assert.noFile(`${exports.swaggerUIDir}/css/style.css`)
  })

  it('did not create a notices file', function () {
    assert.noFile(exports.noticesFile)
  })
}

exports.itCreatedSwaggerUIFiles = function () {
  it('created swaggerui files', function () {
    assert.file(`${exports.swaggerUIDir}/index.html`)
    assert.file(`${exports.swaggerUIDir}/swagger-ui.js`)
    assert.file(`${exports.swaggerUIDir}/css/style.css`)
  })

  it('created a notices file', function () {
    assert.file(exports.noticesFile)
  })
}

//
// Docker
//
exports.itCreatedDockerFilesWithExpectedContent = function (applicationName) {
  it('created docker files', function () {
    assert.file(exports.dockerFiles)
  })

  it('cli-config.yml contains expected docker properties', function () {
    assert.fileContent([
      [ exports.bxdevConfigFile, `container-name-run : "${applicationName}-swift-run"` ],
      [ exports.bxdevConfigFile, `container-name-tools : "${applicationName}-swift-tools"` ],
      [ exports.bxdevConfigFile, `image-name-run : "${applicationName}-swift-run"` ],
      [ exports.bxdevConfigFile, `image-name-tools : "${applicationName}-swift-tools"` ],
      [ exports.bxdevConfigFile, 'dockerfile-tools : "Dockerfile-tools"' ],
      [ exports.bxdevConfigFile, 'dockerfile-run : "Dockerfile"' ]
    ])
  })
}

//
// Kubernetes
//
exports.itCreatedKubernetesFilesWithExpectedContent = function (opts) {
  opts = opts || {}
  var applicationName = opts.applicationName || 'appname'
  var domain = opts.domain || 'ng.bluemix.net'
  var namespace = opts.namespace || 'replace-me-namespace'

  var chartFile = exports.kubernetesChartFileGenerator(applicationName)
  var valuesFile = exports.kubernetesValuesFileGenerator(applicationName)
  var kubernetesFiles = exports.kubernetesFilesGenerator(applicationName)

  it('created kubernetes files', function () {
    assert.file(kubernetesFiles)
  })

  it('kubernetes chart file contains expected content', function () {
    assert.fileContent(chartFile, `name: ${applicationName}`)
  })

  it('kubernetes values file contains expected content', function () {
    assert.fileContent(valuesFile, `repository: registry.${domain}/${namespace}/${applicationName}`)
  })

  it('bx dev config contains expected chart-path', function () {
    assert.fileContent(exports.bxdevConfigFile, `chart-path : "chart/${applicationName}"`)
  })
}

//
// Services
//
exports.itDidNotCreateServiceFiles = function () {
  it('did not create any service boilerplate', function () {
    assert.noFile(exports.servicesSourceDir)
  })

  it('application does not initialize any services', function () {
    assert.noFileContent(exports.applicationSourceFile, 'initializeService')
  })

  it('cloudfoundry manifest does not contain services', function () {
    assert.noFileContent(exports.cloudFoundryManifestFile, 'services:')
  })

  it('bluemix pipeline does not contain services', function () {
    assert.noFileContent(exports.bluemixPipelineFile, 'cf create-services')
  })
}

exports.itCreatedServiceConfigFiles = function () {
  it('created service configuration files', function () {
    assert.file(exports.configMappingsFile)
    assert.file(exports.configCredentialsFile)
  })
}

exports.itHasServiceInConfig = function (serviceDescription, mappingName, serviceName, serviceCredentials) {
  it(`service configuration mapping file contains ${serviceDescription} mapping`, function () {
    assert.fileContent(exports.configMappingsFile, mappingName)
    assert.jsonFileContent(exports.configMappingsFile, {
      [mappingName]: {
        searchPatterns: [
          `cloudfoundry:${serviceName}`,
          `env:${serviceName}`,
          `file:/config/localdev-config.json:${serviceName}`
        ]
      }
    })
  })

  it(`service configuration credentials file contains ${serviceDescription} entry`, function () {
    assert.jsonFileContent(exports.configCredentialsFile, { [serviceName]: serviceCredentials || {} })
  })
}

exports.itHasServiceInCloudFoundryManifest = function (serviceDescription, serviceName) {
  it(`cloudfoundry manifest contains ${serviceDescription} entry`, function () {
    assert.fileContent([
      [exports.cloudFoundryManifestFile, 'services:'],
      [exports.cloudFoundryManifestFile, `- ${serviceName}`]
    ])
  })
}

exports.itHasServiceInBluemixPipeline = function (serviceDescription, serviceLabel, servicePlan, serviceName) {
  it(`bluemix pipeline contains ${serviceDescription} create-service command`, function () {
    assert.fileContent(exports.bluemixPipelineFile, `cf create-service "${serviceLabel}" "${servicePlan}" "${serviceName}"`)
  })
}

exports.itCreatedServiceBoilerplate = function (serviceDescription, fileName, initFuncName) {
  it(`created ${serviceDescription} boilerplate`, function () {
    assert.file(`${exports.servicesSourceDir}/${fileName}`)
  })

  it(`application initializes ${serviceDescription}`, function () {
    assert.fileContent(exports.applicationSourceFile, `try ${initFuncName}()`)
  })
}

// Autoscaling
exports.autoscaling = {
  itCreatedServiceFilesWithExpectedContent: function (serviceName, serviceCredentials, servicePlan) {
    var description = 'autoscaling'
    var label = 'Auto-Scaling'
    var plan = servicePlan || helpers.getBluemixDefaultPlan('autoscaling')
    var sourceFile = 'ServiceAutoscaling.swift'
    var initFunction = 'initializeServiceAutoscaling'

    exports.itHasServiceInCloudFoundryManifest(description, serviceName)
    exports.itHasServiceInBluemixPipeline(description, label, plan, serviceName)
    exports.itCreatedServiceBoilerplate(description, sourceFile, initFunction)

    it('autoscaling boilerplate contains expected content', function () {
      var autoscalingFile = `${exports.servicesSourceDir}/ServiceAutoscaling.swift`
      assert.fileContent([
        [autoscalingFile, 'import SwiftMetricsBluemix'],
        [autoscalingFile, 'func initializeServiceAutoscaling()'],
        [autoscalingFile, 'SwiftMetricsBluemix(']
      ])
    })
  }
}

// Cloudant
exports.cloudant = {
  itCreatedServiceFilesWithExpectedContent: function (serviceName, serviceCredentials, servicePlan) {
    var description = 'cloudant'
    var mapping = 'cloudant'
    var label = 'cloudantNoSQLDB'
    var plan = servicePlan || helpers.getBluemixDefaultPlan('cloudant')
    var sourceFile = 'ServiceCloudant.swift'
    var initFunction = 'initializeServiceCloudant'

    exports.itHasServiceInConfig(description, mapping, serviceName, serviceCredentials)
    exports.itHasServiceInCloudFoundryManifest(description, serviceName)
    exports.itHasServiceInBluemixPipeline(description, label, plan, serviceName)
    exports.itCreatedServiceBoilerplate(description, sourceFile, initFunction)

    it('cloudant boilerplate contains expected content', function () {
      var serviceFile = `${exports.servicesSourceDir}/${sourceFile}`
      assert.fileContent([
        [serviceFile, 'import CouchDB'],
        [serviceFile, 'couchDBClient: CouchDBClient'],
        [serviceFile, 'func initializeServiceCloudant() throws'],
        [serviceFile, 'CouchDBClient(']
      ])
    })
  }
}

// AppID
exports.appid = {
  itCreatedServiceFilesWithExpectedContent: function (serviceName, serviceCredentials, servicePlan) {
    var description = 'appid'
    var mapping = 'appid'
    var label = 'AppID'
    var plan = servicePlan || helpers.getBluemixDefaultPlan('appid')
    var sourceFile = 'ServiceAppid.swift'
    var initFunction = 'initializeServiceAppid'

    exports.itHasServiceInConfig(description, mapping, serviceName, serviceCredentials)
    exports.itHasServiceInCloudFoundryManifest(description, serviceName)
    exports.itHasServiceInBluemixPipeline(description, label, plan, serviceName)
    exports.itCreatedServiceBoilerplate(description, sourceFile, initFunction)

    it('appid boilerplate contains expected content', function () {
      var serviceFile = `${exports.servicesSourceDir}/${sourceFile}`
      assert.fileContent([
        [serviceFile, 'import BluemixAppID'],
        [serviceFile, 'webappKituraCredentialsPlugin: WebAppKituraCredentialsPlugin'],
        [serviceFile, 'kituraCredentials: Credentials'],
        [serviceFile, 'func initializeServiceAppid() throws'],
        [serviceFile, 'WebAppKituraCredentialsPlugin('],
        [serviceFile, 'Credentials(']
      ])
    })
  }
}

// Watson conversation
exports.watsonconversation = {
  itCreatedServiceFilesWithExpectedContent: function (serviceName, serviceCredentials, servicePlan) {
    var description = 'watson conversation'
    var mapping = 'watson_conversation'
    var label = 'conversation'
    var plan = servicePlan || helpers.getBluemixDefaultPlan('watsonconversation')
    var sourceFile = 'ServiceWatsonConversation.swift'
    var initFunction = 'initializeServiceWatsonConversation'

    exports.itHasServiceInConfig(description, mapping, serviceName, serviceCredentials)
    exports.itHasServiceInCloudFoundryManifest(description, serviceName)
    exports.itHasServiceInBluemixPipeline(description, label, plan, serviceName)
    exports.itCreatedServiceBoilerplate(description, sourceFile, initFunction)

    it('watson conversation boilerplate contains expected content', function () {
      var serviceFile = `${exports.servicesSourceDir}/${sourceFile}`
      assert.fileContent([
        [serviceFile, 'import ConversationV1'],
        [serviceFile, 'conversation: Conversation'],
        [serviceFile, 'func initializeServiceWatsonConversation() throws'],
        [serviceFile, 'Conversation(']
      ])
    })
  }
}

// Push notifications
exports.pushnotifications = {
  itCreatedServiceFilesWithExpectedContent: function (serviceName, serviceCredentials, servicePlan) {
    var description = 'push notifications'
    var mapping = 'push'
    var label = 'imfpush'
    var plan = servicePlan || helpers.getBluemixDefaultPlan('pushnotifications')
    var sourceFile = 'ServicePush.swift'
    var initFunction = 'initializeServicePush'

    exports.itHasServiceInConfig(description, mapping, serviceName, serviceCredentials)
    exports.itHasServiceInCloudFoundryManifest(description, serviceName)
    exports.itHasServiceInBluemixPipeline(description, label, plan, serviceName)
    exports.itCreatedServiceBoilerplate(description, sourceFile, initFunction)

    it('push notifications boilerplate contains expected content', function () {
      var serviceFile = `${exports.servicesSourceDir}/${sourceFile}`
      assert.fileContent([
        [serviceFile, 'import BluemixPushNotifications'],
        [serviceFile, 'pushNotifications: PushNotifications'],
        [serviceFile, 'func initializeServicePush() throws'],
        [serviceFile, 'PushNotifications(']
      ])
    })
  }
}

// Alert notification
exports.alertnotification = {
  itCreatedServiceFilesWithExpectedContent: function (serviceName, serviceCredentials, servicePlan) {
    var description = 'alert notification'
    var mapping = 'alert_notification'
    var label = 'AlertNotification'
    var plan = servicePlan || helpers.getBluemixDefaultPlan('alertnotification')
    var sourceFile = 'ServiceAlertNotification.swift'
    var initFunction = 'initializeServiceAlertNotification'

    exports.itHasServiceInConfig(description, mapping, serviceName, serviceCredentials)
    exports.itHasServiceInCloudFoundryManifest(description, serviceName)
    exports.itHasServiceInBluemixPipeline(description, label, plan, serviceName)
    exports.itCreatedServiceBoilerplate(description, sourceFile, initFunction)

    it('alert notification boilerplate contains expected content', function () {
      var serviceFile = `${exports.servicesSourceDir}/${sourceFile}`
      assert.fileContent([
        [serviceFile, 'import AlertNotifications'],
        [serviceFile, 'serviceCredentials: ServiceCredentials'],
        [serviceFile, 'func initializeServiceAlertNotification() throws'],
        [serviceFile, 'ServiceCredentials(']
      ])
    })
  }
}

// Object storage
exports.objectstorage = {
  itCreatedServiceFilesWithExpectedContent: function (serviceName, serviceCredentials, servicePlan) {
    var description = 'object storage'
    var mapping = 'object_storage'
    var label = 'Object-Storage'
    var plan = servicePlan || helpers.getBluemixDefaultPlan('objectstorage')
    var sourceFile = 'ServiceObjectStorage.swift'
    var initFunction = 'initializeServiceObjectStorage'

    exports.itHasServiceInConfig(description, mapping, serviceName, serviceCredentials)
    exports.itHasServiceInCloudFoundryManifest(description, serviceName)
    exports.itHasServiceInBluemixPipeline(description, label, plan, serviceName)
    exports.itCreatedServiceBoilerplate(description, sourceFile, initFunction)

    it('object storage boilerplate contains expected content', function () {
      var serviceFile = `${exports.servicesSourceDir}/${sourceFile}`
      assert.fileContent([
        [serviceFile, 'import BluemixObjectStorage'],
        [serviceFile, 'objStorage: ObjectStorage'],
        [serviceFile, 'func initializeServiceObjectStorage() throws'],
        [serviceFile, 'ObjectStorage(']
      ])
    })
  }
}

// Redis
exports.redis = {
  itCreatedServiceFilesWithExpectedContent: function (serviceName, serviceCredentials, servicePlan) {
    var description = 'redis'
    var mapping = 'redis'
    var label = 'compose-for-redis'
    var plan = servicePlan || helpers.getBluemixDefaultPlan('redis')
    var sourceFile = 'ServiceRedis.swift'
    var initFunction = 'initializeServiceRedis'

    exports.itHasServiceInConfig(description, mapping, serviceName, serviceCredentials)
    exports.itHasServiceInCloudFoundryManifest(description, serviceName)
    exports.itHasServiceInBluemixPipeline(description, label, plan, serviceName)
    exports.itCreatedServiceBoilerplate(description, sourceFile, initFunction)

    it('redis boilerplate contains expected content', function () {
      var serviceFile = `${exports.servicesSourceDir}/${sourceFile}`
      assert.fileContent([
        [serviceFile, 'import SwiftRedis'],
        [serviceFile, 'redis = Redis('],
        [serviceFile, 'redisCredentials: RedisCredentials'],
        [serviceFile, 'func initializeServiceRedis() throws'],
        [serviceFile, 'cloudEnv.getRedisCredentials(']
      ])
    })
  }
}

// MongoDB
exports.mongodb = {
  itCreatedServiceFilesWithExpectedContent: function (serviceName, serviceCredentials, servicePlan) {
    var description = 'mongodb'
    var mapping = 'mongodb'
    var label = 'compose-for-mongodb'
    var plan = servicePlan || helpers.getBluemixDefaultPlan('mongodb')
    var sourceFile = 'ServiceMongodb.swift'
    var initFunction = 'initializeServiceMongodb'

    exports.itHasServiceInConfig(description, mapping, serviceName, serviceCredentials)
    exports.itHasServiceInCloudFoundryManifest(description, serviceName)
    exports.itHasServiceInBluemixPipeline(description, label, plan, serviceName)
    exports.itCreatedServiceBoilerplate(description, sourceFile, initFunction)

    it('redis boilerplate contains expected content', function () {
      var serviceFile = `${exports.servicesSourceDir}/${sourceFile}`
      assert.fileContent([
        [serviceFile, 'import MongoKitten'],
        [serviceFile, 'mongodb = try Database('],
        [serviceFile, 'func initializeServiceMongodb() throws'],
        [serviceFile, 'cloudEnv.getDictionary(']
      ])
    })
  }
}

// PostgreSQL
exports.postgresql = {
  itCreatedServiceFilesWithExpectedContent: function (serviceName, serviceCredentials, servicePlan) {
    var description = 'postgresql'
    var mapping = 'postgre'
    var label = 'compose-for-postgresql'
    var plan = servicePlan || helpers.getBluemixDefaultPlan('postgresql')
    var sourceFile = 'ServicePostgre.swift'
    var initFunction = 'initializeServicePostgre'

    exports.itHasServiceInConfig(description, mapping, serviceName, serviceCredentials)
    exports.itHasServiceInCloudFoundryManifest(description, serviceName)
    exports.itHasServiceInBluemixPipeline(description, label, plan, serviceName)
    exports.itCreatedServiceBoilerplate(description, sourceFile, initFunction)

    it('postgresql boilerplate contains expected content', function () {
      var serviceFile = `${exports.servicesSourceDir}/${sourceFile}`
      assert.fileContent([
        [serviceFile, 'import SwiftKueryPostgreSQL'],
        [serviceFile, 'postgreSQLConn = PostgreSQLConnection('],
        [serviceFile, 'func initializeServicePostgre() throws'],
        [serviceFile, 'cloudEnv.getPostgreSQLCredentials(']
      ])
    })
  }
}
