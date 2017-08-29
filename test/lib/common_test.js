var assert = require('yeoman-assert')
var path = require('path')

exports.defaultProjectDirectory = 'swiftserver'
exports.packageFile = 'Package.swift'
exports.projectMarkerFile = '.swiftservergenerator-project'
exports.generatorConfigFile = '.yo-rc.json'
exports.generatorSpecFile = 'spec.json'
exports.licenseFile = 'LICENSE'
exports.readmeFile = 'README.md'

exports.configMappingsFile = 'config/mappings.json'
exports.configCredentialsFile = 'config/localdev-config.json'

exports.generatedModule = 'Generated'
exports.generatedSourceDir = `Sources/${exports.generatedModule}`
exports.applicationModule = 'Application'
exports.applicationSourceDir = `Sources/${exports.applicationModule}`
exports.applicationSourceFile = `${exports.applicationSourceDir}/Application.swift`
exports.routesSourceDir = `${exports.applicationSourceDir}/Routes`
exports.servicesSourceDir = `${exports.applicationSourceDir}/Services`

exports.bxdevConfigFile = 'cli-config.yml'
exports.cloudFoundryManifestFile = 'manifest.yml'
exports.cloudFoundryFiles = [ exports.cloudFoundryManifestFile, '.cfignore' ]
exports.bluemixPipelineFile = '.bluemix/pipeline.yml'
exports.bluemixFiles = [ exports.bluemixPipelineFile,
  '.bluemix/toolchain.yml',
  '.bluemix/deploy.json' ]

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
}

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

exports.itHasPackageDependencies = function (depOrDeps) {
  var deps = Array.isArray(depOrDeps) ? depOrDeps : [depOrDeps]
  deps.forEach(dep => {
    it(`has package dependency ${dep}`, function () {
      assert.fileContent(exports.packageFile, `/${dep}.git`)
    })
  })
}

exports.itCreatedMetricsFilesWithExpectedContent = function () {
  var applicationSourceDir = exports.applicationSourceDir
  var applicationSourceFile = exports.applicationSourceFile

  it('created metrics boilerplate', function () {
    assert.file(`${applicationSourceDir}/Metrics.swift`)
  })

  it('metrics boilerplate contains expected content', function () {
    var metricsFile = `${applicationSourceDir}/Metrics.swift`
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
    assert.fileContent(applicationSourceFile, 'initializeMetrics()')
  })
}

exports.itCreatedDockerFilesWithExpectedContent = function (applicationName) {
  var dockerFiles = [ 'Dockerfile', 'Dockerfile-tools', '.dockerignore' ]

  it('created docker files', function () {
    assert.file(dockerFiles)
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

exports.itCreatedKubernetesFilesWithExpectedContent = function (opts) {
  opts = opts || {}
  var applicationName = opts.applicationName || 'appname'
  var domain = opts.domain || 'ng.bluemix.net'
  var namespace = opts.namespace || 'replace-me-namespace'

  var chartFile = `chart/${applicationName}/Chart.yaml`
  var valuesFile = `chart/${applicationName}/values.yaml`
  var deploymentFile = `chart/${applicationName}/templates/deployment.yaml`
  var serviceFile = `chart/${applicationName}/templates/service.yaml`
  var kubernetesFiles = [ chartFile, valuesFile, deploymentFile, serviceFile ]

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

exports.itHasServiceConfig = function (serviceDescription, mappingName, serviceName) {
  it(`service configuration mapping file contains ${serviceDescription} mapping`, function () {
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

exports.itCreatedServiceBoilerplate = function (serviceDescription, fileName, initFuncName) {
  it(`created ${serviceDescription} boilerplate`, function () {
    assert.file(`${exports.servicesSourceDir}/${fileName}`)
  })

  it(`application initializes ${serviceDescription}`, function () {
    assert.fileContent(exports.applicationSourceFile, `try ${initFuncName}()`)
  })
}

exports.autoscaling = {
  itCreatedServiceFilesWithExpectedContent: function (serviceName) {
    exports.itCreatedServiceBoilerplate('autoscaling', 'ServiceAutoscaling.swift', 'initializeServiceAutoscaling')

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

exports.cloudant = {
  itCreatedServiceFilesWithExpectedContent: function (serviceName) {
    exports.itHasServiceConfig('cloudant', 'cloudant', serviceName)
    exports.itCreatedServiceBoilerplate('cloudant', 'ServiceCloudant.swift', 'initializeServiceCloudant')

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

exports.appid = {
  itCreatedServiceFilesWithExpectedContent: function (serviceName) {
    exports.itHasServiceConfig('appid', 'appid', serviceName)
    exports.itCreatedServiceBoilerplate('appid', 'ServiceAppid.swift', 'initializeServiceAppid')

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

exports.watsonconversation = {
  itCreatedServiceFilesWithExpectedContent: function (serviceName) {
    exports.itHasServiceConfig('watson conversation', 'watson_conversation', serviceName)
    exports.itCreatedServiceBoilerplate('watson conversation', 'ServiceWatsonConversation.swift', 'initializeServiceWatsonConversation')

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

exports.pushnotifications = {
  itCreatedServiceFilesWithExpectedContent: function (serviceName) {
    exports.itHasServiceConfig('push notifications', 'push', serviceName)
    exports.itCreatedServiceBoilerplate('push notifications', 'ServicePush.swift', 'initializeServicePush')

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

exports.alertnotification = {
  itCreatedServiceFilesWithExpectedContent: function (serviceName) {
    exports.itHasServiceConfig('alert notification', 'alert_notification', serviceName)
    exports.itCreatedServiceBoilerplate('alert notification', 'ServiceAlertnotification.swift', 'initializeServiceAlertnotification')

    it('alert notification boilerplate contains expected content', function () {
      var serviceFile = `${exports.servicesSourceDir}/ServiceAlertnotification.swift`
      assert.fileContent([
        [serviceFile, 'import AlertNotifications'],
        [serviceFile, 'serviceCredentials: ServiceCredentials'],
        [serviceFile, 'func initializeServiceAlertnotification() throws'],
        [serviceFile, 'ServiceCredentials(']
      ])
    })
  }
}

exports.objectstorage = {
  itCreatedServiceFilesWithExpectedContent: function (serviceName) {
    exports.itHasServiceConfig('object storage', 'object_storage', serviceName)
    exports.itCreatedServiceBoilerplate('object storage', 'ServiceObjectStorage.swift', 'initializeServiceObjectStorage')

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

exports.redis = {
  itCreatedServiceFilesWithExpectedContent: function (serviceName) {
    exports.itHasServiceConfig('redis', 'redis', serviceName)
    exports.itCreatedServiceBoilerplate('redis', 'ServiceRedis.swift', 'initializeServiceRedis')

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
