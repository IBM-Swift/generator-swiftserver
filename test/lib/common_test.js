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
exports.itCreatedCommonFiles = function (opts) {
  var files = [
    exports.packageFile,
    exports.licenseFile,
    exports.readmeFile,
    `Sources/${opts.executableModule}/main.swift`,
    'Sources/Application/Application.swift',
    'Tests/ApplicationTests/RouteTests.swift',
    'Tests/LinuxMain.swift'
  ]
  if (!opts.singleshot) {
    files.push(exports.projectMarkerFile)
    files.push(exports.generatorConfigFile)
    files.push(exports.generatorSpecFile)
  }
  files.forEach(filepath => {
    var filename = path.basename(filepath)
    it(`created a ${filename} file`, function () {
      assert.file(filepath)
    })
  })
  if (!opts.singleshot) {
    var expectedConfig = { 'generator-swiftserver': { version: exports.generatorVersion } }
    it(`${exports.generatorConfigFile} contains generator version`, function () {
      assert.jsonFileContent(exports.generatorConfigFile, expectedConfig)
    })
  }
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
      [ exports.bxdevConfigFile, `image-name-run : "${applicationName}-swiftrun"` ],
      [ exports.bxdevConfigFile, `image-name-tools: "${applicationName}-swifttools"` ],
      [ exports.bxdevConfigFile, 'dockerfile-tools: "Dockerfile-tools"' ],
      [ exports.bxdevConfigFile, 'dockerfile-run: "Dockerfile"' ]
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

exports.itHasServiceInConfig = function (serviceDescription, mappingName, serviceName) {
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
    assert.jsonFileContent(exports.configCredentialsFile, { [serviceName]: {} })
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
  itCreatedServiceFilesWithExpectedContent: function (serviceName, servicePlan) {
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
  itCreatedServiceFilesWithExpectedContent: function (serviceName, servicePlan) {
    var description = 'cloudant'
    var mapping = 'cloudant'
    var label = 'cloudantNoSQLDB'
    var plan = servicePlan || helpers.getBluemixDefaultPlan('cloudant')
    var sourceFile = 'ServiceCloudant.swift'
    var initFunction = 'initializeServiceCloudant'

    exports.itHasServiceInConfig(description, mapping, serviceName)
    exports.itHasServiceInCloudFoundryManifest(description, serviceName)
    exports.itHasServiceInBluemixPipeline(description, label, plan, serviceName)
    exports.itCreatedServiceBoilerplate(description, sourceFile, initFunction)

    it('cloudant boilerplate contains expected content', function () {
      var serviceFile = `${exports.servicesSourceDir}/ServiceCloudant.swift`
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
  itCreatedServiceFilesWithExpectedContent: function (serviceName, servicePlan) {
    var description = 'appid'
    var mapping = 'appid'
    var label = 'AppID'
    var plan = servicePlan || helpers.getBluemixDefaultPlan('appid')
    var sourceFile = 'ServiceAppid.swift'
    var initFunction = 'initializeServiceAppid'

    exports.itHasServiceInConfig(description, mapping, serviceName)
    exports.itHasServiceInCloudFoundryManifest(description, serviceName)
    exports.itHasServiceInBluemixPipeline(description, label, plan, serviceName)
    exports.itCreatedServiceBoilerplate(description, sourceFile, initFunction)

    it('appid boilerplate contains expected content', function () {
      var serviceFile = `${exports.servicesSourceDir}/ServiceAppid.swift`
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
  itCreatedServiceFilesWithExpectedContent: function (serviceName, servicePlan) {
    var description = 'watson conversation'
    var mapping = 'watson_conversation'
    var label = 'conversation'
    var plan = servicePlan || helpers.getBluemixDefaultPlan('watsonconversation')
    var sourceFile = 'ServiceWatsonConversation.swift'
    var initFunction = 'initializeServiceWatsonConversation'

    exports.itHasServiceInConfig(description, mapping, serviceName)
    exports.itHasServiceInCloudFoundryManifest(description, serviceName)
    exports.itHasServiceInBluemixPipeline(description, label, plan, serviceName)
    exports.itCreatedServiceBoilerplate(description, sourceFile, initFunction)

    it('watson conversation boilerplate contains expected content', function () {
      var serviceFile = `${exports.servicesSourceDir}/ServiceWatsonConversation.swift`
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
  itCreatedServiceFilesWithExpectedContent: function (serviceName, servicePlan) {
    var description = 'push notifications'
    var mapping = 'push'
    var label = 'imfpush'
    var plan = servicePlan || helpers.getBluemixDefaultPlan('pushnotifications')
    var sourceFile = 'ServicePush.swift'
    var initFunction = 'initializeServicePush'

    exports.itHasServiceInConfig(description, mapping, serviceName)
    exports.itHasServiceInCloudFoundryManifest(description, serviceName)
    exports.itHasServiceInBluemixPipeline(description, label, plan, serviceName)
    exports.itCreatedServiceBoilerplate(description, sourceFile, initFunction)

    it('push notifications boilerplate contains expected content', function () {
      var serviceFile = `${exports.servicesSourceDir}/ServicePush.swift`
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
  itCreatedServiceFilesWithExpectedContent: function (serviceName, servicePlan) {
    var description = 'alert notification'
    var mapping = 'alert_notification'
    var label = 'AlertNotification'
    var plan = servicePlan || helpers.getBluemixDefaultPlan('alertnotification')
    var sourceFile = 'ServiceAlertNotification.swift'
    var initFunction = 'initializeServiceAlertNotification'

    exports.itHasServiceInConfig(description, mapping, serviceName)
    exports.itHasServiceInCloudFoundryManifest(description, serviceName)
    exports.itHasServiceInBluemixPipeline(description, label, plan, serviceName)
    exports.itCreatedServiceBoilerplate(description, sourceFile, initFunction)

    it('alert notification boilerplate contains expected content', function () {
      var serviceFile = `${exports.servicesSourceDir}/ServiceAlertNotification.swift`
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
  itCreatedServiceFilesWithExpectedContent: function (serviceName, servicePlan) {
    var description = 'object storage'
    var mapping = 'object_storage'
    var label = 'Object-Storage'
    var plan = servicePlan || helpers.getBluemixDefaultPlan('objectstorage')
    var sourceFile = 'ServiceObjectStorage.swift'
    var initFunction = 'initializeServiceObjectStorage'

    exports.itHasServiceInConfig(description, mapping, serviceName)
    exports.itHasServiceInCloudFoundryManifest(description, serviceName)
    exports.itHasServiceInBluemixPipeline(description, label, plan, serviceName)
    exports.itCreatedServiceBoilerplate(description, sourceFile, initFunction)

    it('object storage boilerplate contains expected content', function () {
      var serviceFile = `${exports.servicesSourceDir}/ServiceObjectStorage.swift`
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
  itCreatedServiceFilesWithExpectedContent: function (serviceName, servicePlan) {
    var description = 'redis'
    var mapping = 'redis'
    var label = 'compose-for-redis'
    var plan = servicePlan || helpers.getBluemixDefaultPlan('redis')
    var sourceFile = 'ServiceRedis.swift'
    var initFunction = 'initializeServiceRedis'

    exports.itHasServiceInConfig(description, mapping, serviceName)
    exports.itHasServiceInCloudFoundryManifest(description, serviceName)
    exports.itHasServiceInBluemixPipeline(description, label, plan, serviceName)
    exports.itCreatedServiceBoilerplate(description, sourceFile, initFunction)

    it('redis boilerplate contains expected content', function () {
      var serviceFile = `${exports.servicesSourceDir}/ServiceRedis.swift`
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
