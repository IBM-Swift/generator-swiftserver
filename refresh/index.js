/*
 * Copyright IBM Corporation 2016
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
var debug = require('debug')('generator-swiftserver:refresh')

var Generator = require('yeoman-generator')
var Promise = require('bluebird')
var chalk = require('chalk')
var YAML = require('js-yaml')
var rimraf = require('rimraf')
var handlebars = require('handlebars')
var path = require('path')
var fs = require('fs')

var actions = require('../lib/actions')
var helpers = require('../lib/helpers')
var swaggerize = require('ibm-openapi-support')
var sdkHelper = require('../lib/sdkGenHelper')
var performSDKGenerationAsync = sdkHelper.performSDKGenerationAsync
var getClientSDKAsync = sdkHelper.getClientSDKAsync
var getServerSDKAsync = sdkHelper.getServerSDKAsync

module.exports = Generator.extend({
  constructor: function () {
    Generator.apply(this, arguments)
    // Allow the user to specify where the specification file is
    this.option('specfile', {
      desc: 'The location of the specification file.',
      required: false,
      hide: true,
      type: String
    })

    this.option('spec', {
      desc: 'The specification in a JSON format.',
      required: false,
      hide: true,
      type: String
    })

    this.fs.copyHbs = (from, to, params) => {
      var template = handlebars.compile(this.fs.read(from))
      this.fs.write(to, template(params))
    }
  },

  // Check if the given file exists, print a log message if it does and execute
  // the provided callback function if it does not.
  //
  // The given file is specified relative to the destination root as a string or
  // an array of path segments to be joined.
  //
  // The callback function is passed the absolute filepath of the given file.
  //
  // @param {(string|string[])} fileInProject - filepath of file to check relative to destination root,
  //                                            if an array is provided, the elements will be joined with
  //                                            the path separator
  // @param {ifNotExistsInProjectCallback} cb - callback to be executed if file to check does not exist
  //
  // @callback ifNotExistsInProjectCallback
  // @param {string} filepath - absolute filepath of file to check
  _ifNotExistsInProject: function (fileInProject, cb) {
    var filepath
    if (typeof (fileInProject) === 'string') {
      filepath = this.destinationPath(fileInProject)
    } else {
      filepath = this.destinationPath.apply(this, fileInProject)
    }
    if (this.fs.exists(this.destinationPath(filepath))) {
      const relativeFilepath = path.relative(this.destinationRoot(), filepath)
      this.log(chalk.cyan('   exists ') + relativeFilepath)
    } else {
      cb.call(this, filepath)
    }
  },

  initializing: {
    readSpec: function () {
      this.generatorVersion = require('../package.json').version
      this.existingProject = false

      if (this.options.specfile) {
        debug('attempting to read the spec from file')
        try {
          this.spec = this.fs.readJSON(this.options.specfile)
          this.existingProject = false
        } catch (err) {
          this.env.error(chalk.red(err))
        }
      }

      if (this.options.spec) {
        debug('attempting to read the spec from cli')
        try {
          this.spec = JSON.parse(this.options.spec)
        } catch (err) {
          this.env.error(chalk.red(err))
        }
      }

      // Getting an object from the generators
      if (this.options.specObj) {
        this.spec = this.options.specObj
      }

      // If we haven't receieved some sort of spec we attempt to read the spec.json
      if (!this.spec) {
        try {
          this.spec = this.fs.readJSON(this.destinationPath('spec.json'))
          this.existingProject = true
        } catch (err) {
          this.env.error(chalk.red('Cannot read the spec.json: ', err))
        }
      }

      if (!this.spec) {
        this.env.error(chalk.red('No specification for this project'))
      }

      // App type
      if (!this.spec.appType) {
        this.env.error(chalk.red('Property appType is missing from the specification'))
      }
      if (['crud', 'scaffold'].indexOf(this.spec.appType) === -1) {
        this.env.error(chalk.red(`Property appType is invalid: ${this.spec.appType}`))
      }
      this.appType = this.spec.appType
      this.repoType = this.spec.repoType || 'link'

      // App name
      if (this.spec.appName) {
        this.projectName = this.spec.appName
      } else {
        this.env.error(chalk.red('Property appName is missing from the specification'))
      }

      // Bluemix configuration
      // Ensure minimal default bluemix properties are set
      this.bluemix = this.spec.bluemix || {}
      this.bluemix.backendPlatform = this.bluemix.backendPlatform || 'SWIFT'
      this.bluemix.name = this.bluemix.name || helpers.sanitizeAppName(this.projectName)
      this.bluemix.server = this.bluemix.server || {}
      this.bluemix.server.name = this.bluemix.server.name || this.bluemix.name
      this.bluemix.server.env = this.bluemix.server.env || {}

      function isServiceProperty (value) {
        if (Array.isArray(value)) {
          // All elements of the service array must have a serviceInfo property
          return value.filter(element => element.serviceInfo).length === value.length
        }
        return !!value.serviceInfo
      }
      function getServiceProperties (bluemixObject) {
        var servicePropNames = Object.keys(bluemixObject).filter(prop => isServiceProperty(bluemixObject[prop]))
        var serviceProperties = servicePropNames.reduce((memo, servicePropName) => {
          return Object.assign(memo, { [servicePropName]: bluemixObject[servicePropName] })
        }, {})
        return serviceProperties
      }

      this.services = getServiceProperties(this.bluemix)
      Object.keys(this.services).forEach(serviceType => {
        var serviceOrServices = this.services[serviceType]
        if (Array.isArray(serviceOrServices)) {
          serviceOrServices.forEach((service, index) => {
            var updatedService = helpers.sanitizeServiceAndFillInDefaults(serviceType, service)
            helpers.validateServiceFields(serviceType, updatedService)
            this.bluemix[serviceType][index] = updatedService
            this.services[serviceType][index] = updatedService
          })
        } else {
          var updatedService = helpers.sanitizeServiceAndFillInDefaults(serviceType, serviceOrServices)
          helpers.validateServiceFields(serviceType, updatedService)
          this.bluemix[serviceType] = updatedService
          this.services[serviceType] = updatedService
        }
      })

      if (typeof (this.bluemix.openApiServers) === 'object') {
        this.openApiServers = this.bluemix.openApiServers
      }
      // Docker configuration
      this.docker = (this.spec.docker === true)

      // Usecase configuration
      this.usecase = (this.spec.usecase === true)

      // Web configuration
      this.web = (this.spec.web === true)

      // Example endpoints
      this.exampleEndpoints = (this.spec.exampleEndpoints === true)

      // Health endpoint
      this.healthcheck = (typeof this.spec.healthcheck === 'undefined') ? true : this.spec.healthcheck

      // Generation of example endpoints from the productSwagger.yaml example.
      if (this.spec.fromSwagger && typeof (this.spec.fromSwagger) === 'string') {
        this.openApiFileOrUrl = this.spec.fromSwagger
      }

      if (this.exampleEndpoints) {
        if (this.openApiFileOrUrl) {
          this.env.error('Only one of: swagger file and example endpoints allowed')
        }
        this.openApiFileOrUrl = this.templatePath('common', 'productSwagger.yaml')
      }

      // Swagger file paths for server SDKs
      this.serverSwaggerFiles = this.spec.serverSwaggerFiles || []

      // Swagger hosting
      this.hostSwagger = (this.spec.hostSwagger === true)

      // Swagger UI
      this.swaggerUI = (this.spec.swaggerUI === true)

      // Metrics
      this.metrics = (this.spec.metrics === true || undefined)

      // Autoscaling implies monitoring
      if (this.bluemix.autoscaling) {
        this.metrics = true
      }

      // SwaggerUI imples web and hostSwagger
      if (this.swaggerUI) {
        this.hostSwagger = true
        this.web = true
      }

      // CRUD generation implies SwaggerUI
      if (this.appType === 'crud') {
        this.hostSwagger = true
        this.swaggerUI = true
        this.web = true
      }

      // Define health-check-type and health-check-http-endpoint
      /* if (this.healthcheck) {
        this.bluemix.server['health-check-type'] = 'http'
        this.bluemix.server['health-check-http-endpoint'] = '/health'
      } */

      // Define OPENAPI_SPEC
      if (this.hostSwagger) {
        this.bluemix.server.env.OPENAPI_SPEC = '"/swagger/api"'
      }

      // Set the names of the modules
      this.generatedModule = 'Generated'
      this.applicationModule = 'Application'
      this.executableModule = this.projectName

      // Target dependencies to add to the applicationModule
      this.sdkTargets = []

      // Files or folders to be ignored in a git repo
      this.itemsToIgnore = []

      // Package dependencies to add to Package.swift
      // eg this.dependencies.push('.package(url: "https://github.com/IBM-Swift/Kitura.git", .upToNextMinor(from : "1.7.0")),')
      this.dependencies = []

      // Module Dependencies to add to Package.swift
      this.modules = []

      // Initialization code to add to Application.swift by code block
      // eg this.appInitCode.services.push('try initializeServiceCloudant()')
      this.appInitCode = {
        capabilities: [],
        services: [],
        service_imports: [],
        service_variables: [],
        middlewares: [],
        endpoints: []
      }

      if (this.web || this.usecase) this.appInitCode.middlewares.push('router.all(middleware: StaticFileServer())')
      if (this.appType === 'crud') {
        this.appInitCode.endpoints.push('try initializeCRUDResources(cloudEnv: cloudEnv, router: router)')
        this.dependencies.push('.package(url: "https://github.com/IBM-Swift/SwiftyJSON.git", from: "17.0.0"),')
      }
      if (this.metrics) {
        this.modules.push('"SwiftMetrics"')
        this.appInitCode.capabilities.push('initializeMetrics(app: self)')
        this.dependencies.push('.package(url: "https://github.com/RuntimeTools/SwiftMetrics.git", from: "2.0.0"),')
      }
      if (this.usecase) {
        this.appInitCode.endpoints.push('initializeAppRoutes(app: self)')
        this.appInitCode.endpoints.push('initializeErrorRoutes(app: self)')
      }
    },

    ensureGeneratorIsCompatibleWithProject: function () {
      if (!this.existingProject) return

      var generatorMajorVersion = this.generatorVersion.split('.')[0]
      var projectGeneratedWithVersion = this.config.get('version')

      if (!projectGeneratedWithVersion) {
        this.env.error(`Project was generated with an incompatible version of the generator (project was generated with an unknown version, current generator is v${generatorMajorVersion})`)
      }

      // Ensure generator major version match
      // TODO Use node-semver? Strip leading non-digits?
      var projectGeneratedWithMajorVersion = projectGeneratedWithVersion.split('.')[0]
      if (projectGeneratedWithMajorVersion !== generatorMajorVersion) {
        this.env.error(`Project was generated with an incompatible version of the generator (project was generated with v${projectGeneratedWithMajorVersion}, current generator is v${generatorMajorVersion})`)
      }
    },

    setDestinationRootFromSpec: function () {
      if (!this.options.destinationSet && !this.existingProject) {
        // Check if we have a directory specified, else use the default one
        this.destinationRoot(path.resolve(this.spec.appDir || 'swiftserver'))
      }
    },

    ensureInProject: function () {
      if (this.existingProject) {
        actions.ensureInProject.call(this)
      } else {
        actions.ensureEmptyDirectory.call(this)
      }
    },

    readModels: function () {
      if (this.appType !== 'crud') return

      // Start with the models from the spec
      var modelMap = {}
      if (this.spec.models) {
        this.spec.models.forEach((model) => {
          if (model.name) {
            modelMap[model.name] = model
          } else {
            this.log('Failed to process model in spec: model name missing')
          }
        })
      }

      // Update the spec with any changes from the model .json files
      try {
        var modelFiles = fs.readdirSync(this.destinationPath('models'))
                           .filter((name) => name.endsWith('.json'))
        modelFiles.forEach(function (modelFile) {
          try {
            debug('reading model json:', this.destinationPath('models', modelFile))
            var modelJSON = fs.readFileSync(this.destinationPath('models', modelFile))
            var model = JSON.parse(modelJSON)
            // Only add models if they aren't being modified/added
            if (model.name) {
              modelMap[model.name] = model
            } else {
              this.log(`Failed to process model file ${modelFile}: model name missing`)
            }
          } catch (_) {
            // Failed to read model file
            this.log(`Failed to process model file ${modelFile}`)
          }
        }.bind(this))
        if (modelFiles.length === 0) {
          debug('no files in the model directory')
        }
      } catch (_) {
        // No models directory
        debug(this.destinationPath('models'), 'directory does not exist')
      }

      // Add any models we need to update
      if (this.options.model) {
        if (this.options.model.name) {
          modelMap[this.options.model.name] = this.options.model
        } else {
          this.env.error(chalk.red('Failed to update model: name missing'))
        }
      }

      this.models = Object.keys(modelMap).map((modelName) => modelMap[modelName])
    },

    loadProjectInfo: function () {
      // TODO(tunniclm): Improve how we set these values
      this.projectVersion = '1.0.0'
    }
  },

  configuring: function () {
    if (this.existingProject) return
    this.composeWith(require.resolve('generator-ibm-service-enablement'), {
      quiet: true,
      bluemix: JSON.stringify(this.bluemix),
      parentContext: {
        injectIntoApplication: options => {
          if (options.capability) this.appInitCode.capabilities.push(options.capability)
          if (options.service) this.appInitCode.services.push(options.service)
          if (options.service_import) this.appInitCode.service_imports.push(options.service_import)
          if (options.service_variable) this.appInitCode.service_variables.push(options.service_variable)
          if (options.endpoint) this.appInitCode.endpoints.push(options.endpoint)
          if (options.middleware) this.appInitCode.middlewares.push(options.middleware)
        },
        injectDependency: dependency => { this.dependencies.push(dependency) },
        injectModules: modules => {
          this.modules.push(modules)
        }
      }
    })
  },

  buildProduct: function () {
    if (!this.options.apic) return
    this.product = {
      'product': '1.0.0',
      'info': {
        'name': this.projectName,
        'title': this.projectName,
        'version': this.projectVersion
      },
      'apis': {
        [this.projectName]: {
          '$ref': this.projectName + '.yaml'
        }
      },
      'visibility': {
        'view': {
          'type': 'public'
        },
        'subscribe': {
          'type': 'authenticated'
        }
      },
      'plans': {
        'default': {
          'title': 'Default Plan',
          'description': 'Default Plan',
          'approval': false,
          'rate-limit': {
            'value': '100/hour',
            'hard-limit': false
          }
        }
      }
    }
  },

  buildSwagger: function () {
    if (this.appType !== 'crud') return
    var swagger = {
      'swagger': '2.0',
      'info': {
        'version': this.projectVersion,
        'title': this.projectName
      },

      'schemes': ['http'],
      'basePath': '/api',

      'consumes': ['application/json'],
      'produces': ['application/json'],

      'paths': {},
      'definitions': {}
    }

    if (this.options.apic) {
      swagger['info']['x-ibm-name'] = this.projectName
      swagger['schemes'] = ['https']
      swagger['host'] = '$(catalog.host)'
      swagger['securityDefinitions'] = {
        'clientIdHeader': {
          'type': 'apiKey',
          'in': 'header',
          'name': 'X-IBM-Client-Id'
        },
        'clientSecretHeader': {
          'type': 'apiKey',
          'in': 'header',
          'name': 'X-IBM-Client-Secret'
        }
      }
      swagger['security'] = [{
        'clientIdHeader': [],
        'clientSecretHeader': []
      }]
      swagger['x-ibm-configuration'] = {
        'testable': true,
        'enforced': true,
        'cors': { 'enabled': true },
        'catalogs': {
          'apic-dev': {
            'properties': {
              'runtime-url': '$(TARGET_URL)'
            }
          },
          'sb': {
            'properties': {
              'runtime-url': 'http://localhost:4001'
            }
          }
        },
        'assembly': {
          'execute': [{
            'invoke': {
              'target-url': '$(runtime-url)$(request.path)$(request.search)'
            }
          }]
        }
      }
    }

    this.models.forEach(function (model) {
      var modelName = model['name']
      var modelNamePlural = model['plural']
      var collectivePath = `/${modelNamePlural}`
      var singlePath = `/${modelNamePlural}/{id}`

      // tunniclm: Generate definitions
      var swaggerProperties = {}
      var requiredProperties = []
      for (var propName in model['properties']) {
        swaggerProperties[propName] = {
          'type': model['properties'][propName]['type']
        }
        if (typeof model['properties'][propName]['format'] !== 'undefined') {
          swaggerProperties[propName]['format'] = model['properties'][propName]['format']
        }
        if (model['properties'][propName]['required'] === true) {
          requiredProperties.push(propName)
        }
      }
      swagger['definitions'][modelName] = {
        'properties': swaggerProperties,
        'additionalProperties': false
      }
      if (requiredProperties.length > 0) {
        swagger['definitions'][modelName]['required'] = requiredProperties
      }

      // tunniclm: Generate paths
      swagger['paths'][singlePath] = {
        'get': {
          'tags': [modelName],
          'summary': 'Find a model instance by {{id}}',
          'operationId': modelName + '.findOne',
          'parameters': [
            {
              'name': 'id',
              'in': 'path',
              'description': 'Model id',
              'required': true,
              'type': 'string',
              'format': 'JSON'
            }
          ],
          'responses': {
            '200': {
              'description': 'Request was successful',
              'schema': {
                '$ref': '#/definitions/' + modelName
              }
            }
          },
          'deprecated': false
        },
        'put': {
          'tags': [modelName],
          'summary': 'Put attributes for a model instance and persist it',
          'operationId': modelName + '.replace',
          'parameters': [
            {
              'name': 'data',
              'in': 'body',
              'description': 'An object of model property name/value pairs',
              'required': true,
              'schema': {
                '$ref': '#/definitions/' + modelName
              }
            },
            {
              'name': 'id',
              'in': 'path',
              'description': 'Model id',
              'required': true,
              'type': 'string',
              'format': 'JSON'
            }
          ],
          'responses': {
            '200': {
              'description': 'Request was successful',
              'schema': {
                '$ref': '#/definitions/' + modelName
              }
            }
          },
          'deprecated': false
        },
        'patch': {
          'tags': [modelName],
          'summary': 'Patch attributes for a model instance and persist it',
          'operationId': modelName + '.update',
          'parameters': [
            {
              'name': 'data',
              'in': 'body',
              'description': 'An object of model property name/value pairs',
              'required': true,
              'schema': {
                '$ref': '#/definitions/' + modelName
              }
            },
            {
              'name': 'id',
              'in': 'path',
              'description': 'Model id',
              'required': true,
              'type': 'string',
              'format': 'JSON'
            }
          ],
          'responses': {
            '200': {
              'description': 'Request was successful',
              'schema': {
                '$ref': '#/definitions/' + modelName
              }
            }
          },
          'deprecated': false
        },
        'delete': {
          'tags': [modelName],
          'summary': 'Delete a model instance by {{id}}',
          'operationId': modelName + '.delete',
          'parameters': [
            {
              'name': 'id',
              'in': 'path',
              'description': 'Model id',
              'required': true,
              'type': 'string',
              'format': 'JSON'
            }
          ],
          'responses': {
            '200': {
              'description': 'Request was successful',
              'schema': {
                'type': 'object'
              }
            }
          },
          'deprecated': false
        }
      }
      swagger['paths'][collectivePath] = {
        'post': {
          'tags': [modelName],
          'summary': 'Create a new instance of the model and persist it',
          'operationId': modelName + '.create',
          'parameters': [
            {
              'name': 'data',
              'in': 'body',
              'description': 'Model instance data',
              'required': true,
              'schema': {
                '$ref': '#/definitions/' + modelName
              }
            }
          ],
          'responses': {
            '200': {
              'description': 'Request was successful',
              'schema': {
                '$ref': '#/definitions/' + modelName
              }
            }
          },
          'deprecated': false
        },
        'get': {
          'tags': [modelName],
          'summary': 'Find all instances of the model',
          'operationId': modelName + '.findAll',
          'responses': {
            '200': {
              'description': 'Request was successful',
              'schema': {
                'type': 'array',
                'items': {
                  '$ref': '#/definitions/' + modelName
                }
              }
            }
          },
          'deprecated': false
        },
        'delete': {
          'tags': [modelName],
          'summary': 'Delete all instances of the model',
          'operationId': modelName + '.deleteAll',
          'responses': {
            '200': {
              'description': 'Request was successful'
            }
          },
          'deprecated': false
        }
      }
    })
    this.swagger = swagger
  },

  loadOpenApiDocument: function () {
    this.openApiDocumentBytes = this.openApiServers && this.openApiServers[0] && this.openApiServers[0].spec

    if (!this.openApiFileOrUrl && !this.openApiDocumentBytes) {
      debug('neither bluemix openApiServers or fromSwagger options have been set')
      return
    }

    if (this.openApiFileOrUrl && this.openApiDocumentBytes) {
      debug('both bluemix openApiServers and fromSwagger options have been set')
      throw new Error('cannot handle two sources of API definition')
    }

    if (this.openApiFileOrUrl) {
      return swaggerize.loadAsync(this.openApiFileOrUrl, this.fs)
        .then(loaded => {
          this.openApiDocumentBytes = loaded
        })
    }
  },

  parseOpenApiDocument: function () {
    let formatters = {
      'pathFormatter': helpers.reformatPathToSwiftKitura,
      'resourceFormatter': helpers.resourceNameFromPath
    }

    if (this.openApiDocumentBytes) {
      return swaggerize.parse(this.openApiDocumentBytes, formatters)
        .then(response => {
          this.loadedApi = response.loaded
          this.parsedSwagger = response.parsed
          // mangle the route name to allow the renaming of the default route.
          Object.keys(this.parsedSwagger.resources).forEach(resource => {
            debug('RESOURCENAME:', resource)
            if (resource.endsWith('*')) {
              this.parsedSwagger.resources[resource]['generatedName'] = resource.replace(/\*$/, 'Default')
            } else {
              this.parsedSwagger.resources[resource]['generatedName'] = resource + '_'
            }
          })
        })
        .catch(err => {
          if (this.openApiFileOrUrl) {
            err.message = chalk.red('failed to parse:' + this.openApiFileOrUrl + ' ' + err.message)
          } else {
            err.message = chalk.red('failed to parse document from bluemix.openApiServers ' + err.message)
          }
          throw err
        })
    }
  },

  addEndpointInitCode: function () {
    var endpointNames = []
    if (this.healthcheck) {
      this.modules.push('"Health"')
      endpointNames.push('Health')
      this.dependencies.push('.package(url: "https://github.com/IBM-Swift/Health.git", from: "0.0.0"),')
    }
    if (this.parsedSwagger && this.parsedSwagger.resources) {
      var resourceNames = []
      Object.keys(this.parsedSwagger.resources).forEach(resource => {
        resourceNames.push(this.parsedSwagger.resources[resource].generatedName)
      })
      endpointNames = endpointNames.concat(resourceNames)
    }

    var initCodeForEndpoints = endpointNames.map(name => `initialize${name}Routes(app: self)`)
    this.appInitCode.endpoints = this.appInitCode.endpoints.concat(initCodeForEndpoints)

    if (this.hostSwagger) {
      this.appInitCode.endpoints.push(`initializeSwaggerRoutes(app: self)`)
      this.swaggerPath = `let swaggerPath = projectPath + "/definitions/${this.projectName}.yaml"`
    }
  },

  generateSDKs: function () {
    var shouldGenerateClientWithModel = (!!this.swagger && JSON.stringify(this.swagger['paths']) !== '{}')
    var shouldGenerateClient = (!!this.openApiDocumentBytes)
    var shouldGenerateServer = (this.serverSwaggerFiles.length > 0)
    if (!shouldGenerateClientWithModel && !shouldGenerateClient && !shouldGenerateServer) return
    this.log(chalk.green('Generating SDK(s) from swagger file(s)...'))
    var generationTasks = []
    if (shouldGenerateClientWithModel) generationTasks.push(generateClientAsync.call(this, this.swagger))
    if (shouldGenerateClient) generationTasks.push(generateClientAsync.call(this, this.loadedApi))
    if (shouldGenerateServer) generationTasks.push(generateServerAsync.call(this))
    return Promise.all(generationTasks)

    function generateClientAsync (swaggerContent) {
      var clientSDKName = `${this.projectName}_iOS_SDK`
      return performSDKGenerationAsync(clientSDKName, 'ios_swift', JSON.stringify(swaggerContent))
        .then(generatedID => getClientSDKAsync(clientSDKName, generatedID))
        .then(() => {
          this.itemsToIgnore.push(`/${clientSDKName}*`)
        })
    }

    function generateServerAsync () {
      var sdkPackages = []
      return Promise.map(this.serverSwaggerFiles, file => {
        return swaggerize.loadAsync(file, this.fs)
          .then(loaded => {
            return swaggerize.parse(loaded, helpers.reformatPathToSwift)
              .then(response => {
                if (response.loaded.info.title === undefined) {
                  this.env.error(chalk.red('Could not extract title from Swagger API.'))
                }

                var serverSDKName = response.loaded.info.title.replace(/ /g, '_') + '_ServerSDK'
                return performSDKGenerationAsync(serverSDKName, 'server_swift', JSON.stringify(response.loaded))
                  .then(generatedID => getServerSDKAsync(serverSDKName, generatedID))
                  .then(sdk => {
                    this.sdkTargets.push(serverSDKName)
                    if (sdk.packages.length > 0) {
                      // Since all of the projects generated by the SDK generation
                      // service will have the same pacakge dependencies, it is ok
                      // (for now) to overwrite with the latest set.
                      sdkPackages = sdk.packages
                    }
                    // Copy SDK's Sources directory into the project's
                    // Sources directory
                    this.fs.copy(path.join(sdk.tempDir, sdk.dirname, 'Sources'),
                                 this.destinationPath('Sources', serverSDKName))

                    // Clean up the SDK's temp directory
                    rimraf.sync(sdk.tempDir)
                  })
              })
          })
          .catch(err => {
            err.message = chalk.red(this.openApiFileOrUrl + ' ' + err.message)
            throw err
          })
      })
      .then(() => {
        sdkPackages.forEach(pkg => this.dependencies.push(pkg))
      })
    }
  },

  writing: {
    createCommonFiles: function () {
      // Check if we should create generator metadata files
      if (!this.options.singleShot) {
        // Root directory
        this.config.defaults({ version: this.generatorVersion })

        // Check if there is a .swiftservergenerator-project, create one if there isn't
        this._ifNotExistsInProject('.swiftservergenerator-project', (filepath) => {
          // NOTE(tunniclm): Write a zero-byte file to mark this as a valid project
          // directory
          this.fs.write(filepath, '')
        })
      }

      // Check if there is a .gitignore, create one if there isn't
      this._ifNotExistsInProject('.gitignore', (filepath) => {
        this.fs.copyTpl(
          this.templatePath('common', 'gitignore'),
          filepath,
          { itemsToIgnore: this.itemsToIgnore }
        )
      })

      this._ifNotExistsInProject('.swift-version', (filepath) => {
        this.fs.copy(this.templatePath('common', 'swift-version'),
                     filepath)
      })

      this._ifNotExistsInProject('LICENSE', (filepath) => {
        this.fs.copy(
          this.templatePath('common', 'LICENSE_for_generated_code'),
                            filepath)
      })

      this._ifNotExistsInProject(['Sources', this.applicationModule, 'InitializationError.swift'], (filepath) => {
        this.fs.copy(this.templatePath('common', 'InitializationError.swift'),
                     filepath)
      })
      this._ifNotExistsInProject(['Sources', this.applicationModule, 'Application.swift'], (filepath) => {
        this.fs.copyTpl(
          this.templatePath('common', 'Application.swift'),
          filepath,
          {
            appType: this.appType,
            generatedModule: this.generatedModule,
            appInitCode: this.appInitCode,
            swaggerPath: this.swaggerPath,
            web: this.web,
            healthcheck: this.healthcheck,
            basepath: this.parsedSwagger && this.parsedSwagger.basepath
          }
        )
      })

      // Check if there is a spec.json, if there isn't create one
      if (this.spec) {
        this._ifNotExistsInProject('spec.json', (filepath) => {
          this.fs.writeJSON(filepath, this.spec)
        })
      }

      // Check if there is a index.js, create one if there isn't
      if (this.options.apic) {
        this._ifNotExistsInProject('index.js', (filepath) => {
          this.fs.copy(this.templatePath('common', 'apic-node-wrapper.js'),
                       filepath)
        })
      }

      this._ifNotExistsInProject(['Tests', this.applicationModule + 'Tests', 'RouteTests.swift'], (filepath) => {
        this.fs.copyTpl(
          this.templatePath('common', 'RouteTests.swift'),
          filepath,
          { applicationModule: this.applicationModule }
        )
      })

      this._ifNotExistsInProject(['Tests', 'LinuxMain.swift'], (filepath) => {
        this.fs.copyTpl(
            this.templatePath('common', 'LinuxMain.swift'),
            filepath,
            { applicationModule: this.applicationModule }
          )
      })

      if (this.metrics) {
        this._ifNotExistsInProject(['Sources', this.applicationModule, 'Metrics.swift'], (filepath) => {
          this.fs.copy(
            this.templatePath('common', 'Metrics.swift'),
            filepath
          )
        })
      }

      if (this.healthcheck) {
        this._ifNotExistsInProject(['Sources', this.applicationModule, 'Routes', 'HealthRoutes.swift'], (filepath) => {
          this.fs.copyTpl(
            this.templatePath('common', 'HealthRoutes.swift'),
            filepath
          )
        })
      }

      if (this.hostSwagger) {
        this.fs.write(this.destinationPath('definitions', '.keep'), '')
        this._ifNotExistsInProject(['Sources', this.applicationModule, 'Routes', 'SwaggerRoutes.swift'], (filepath) => {
          this.fs.copyTpl(
            this.templatePath('common', 'SwaggerRoutes.swift'),
            filepath
          )
        })
      }

      if (this.swaggerUI) {
        this.fs.copy(
          this.templatePath('common', 'swagger-ui/**/*'),
          this.destinationPath('public', 'explorer')
        )
        this.fs.copy(
          this.templatePath('common', 'NOTICES_for_generated_swaggerui'),
          this.destinationPath('NOTICES.txt')
        )
      }

      if (this.web) {
        this.fs.write(this.destinationPath('public', '.keep'), '')
      }

      if (this.usecase) {
        this.fs.copy(
          this.templatePath('public'),
          this.destinationPath('public')
        )

        this._ifNotExistsInProject(['Sources', this.applicationModule, 'Routes', 'ErrorRoutes.swift'], (filepath) => {
          this.fs.copyTpl(
            this.templatePath('common', 'ErrorRoutes.swift'),
            filepath
          )
        })
      }

      if (this.appType !== 'crud') {
        this.fs.copyTpl(
          this.templatePath('common', 'README.scaffold.md'),
          this.destinationPath('README.md'),
          {
            appName: this.projectName,
            executableName: this.executableModule,
            generatorVersion: this.generatorVersion,
            web: this.web,
            docker: this.docker,
            hostSwagger: this.hostSwagger,
            exampleEndpoints: this.exampleEndpoints,
            metrics: this.metrics,
            autoscaling: !!this.bluemix.autoscaling,
            cloudant: this.bluemix.cloudant && this.bluemix.cloudant.length > 0,
            redis: !!this.bluemix.redis,
            objectStorage: this.bluemix.objectStorage && this.bluemix.objectStorage.length > 0,
            auth: !!this.bluemix.auth,
            conversation: !!this.bluemix.conversation,
            alertNotification: !!this.bluemix.alertNotification,
            push: !!this.bluemix.push
          }
        )
        this.fs.write(this.destinationPath('Sources', this.applicationModule, 'Routes', '.keep'), '')
      }
    },

    createFromSwagger: function () {
      if (this.parsedSwagger) {
        handlebars.registerHelper('swifttype', helpers.swiftTypeFromSwaggerProperty)
        Object.keys(this.parsedSwagger.resources).forEach(resource => {
          // Generate routes
          var generatedName = this.parsedSwagger.resources[resource].generatedName
          debug('route:', this.parsedSwagger.resources[resource])
          this.fs.copyHbs(
            this.templatePath('fromswagger', 'Routes.swift.hbs'),
            this.destinationPath('Sources', this.applicationModule, 'Routes', `${generatedName}Routes.swift`),
            {
              resource: generatedName,
              routes: this.parsedSwagger.resources[resource],
              basepath: this.parsedSwagger.basepath
            }
          )
        })

        // Generate model structures
        Object.keys(this.parsedSwagger.models).forEach(name => {
          var model = this.parsedSwagger.models[name]
          var fileName = helpers.capitalizeFirstLetter(name + '.swift')
          debug('model:', model)
          debug('fileName:', fileName)

          if (!model.id) {
            model.id = name
          }
          // For Array of items/models referenced as part of definitions, no need
          // generate a model file.
          if (model.type === 'array' && model.items) {
            return
          }
          if (model.properties) {
            debug('model.properties', model.properties)
            Object.keys(model.properties).forEach(prop => {
              if (model.properties[prop].$ref) {
                model.properties[prop]['type'] = 'ref'
              }
              if (model.required && !helpers.arrayContains(prop, model.required)) {
                model.properties[prop]['optional'] = '?'
              }
              if (model.properties[prop].description && model.properties[prop].description.length > 0) {
                if (model.properties[prop].description.match(/\n/)) {
                  console.log('found:', model.properties[prop].description)
                }
                // model.properties[prop].description = '// ' + model.properties[prop].description
                var comments = model.properties[prop].description.split('\n')
                if (comments[comments.length - 1].length === 0) {
                  comments = comments.slice(0, comments.length - 1)
                }
                model.properties[prop].description = comments
              }
            })
            this.fs.copyHbs(
              this.templatePath('fromswagger', 'Model.swift.hbs'),
              this.destinationPath('Sources', this.applicationModule, 'Models', fileName),
              {
                properties: model.properties,
                model: name,
                required: model.required || [],
                id: name,
                license: this.license
              })
          }
        })

        // Make the swagger available for the swaggerUI
        var swaggerFilename = this.destinationPath('definitions', `${this.projectName}.yaml`)
        this.fs.write(swaggerFilename, YAML.safeDump(this.loadedApi))
      }
    },

    createCRUD: function () {
      if (this.appType !== 'crud') return

      if (!this.fs.exists(this.destinationPath('README.md'))) {
        this.fs.copy(
          this.templatePath('bluemix', 'README.md'),
          this.destinationPath('README.md')
        )
      }

      // Add the models to the spec
      this.spec.models = this.models
      this.fs.writeJSON(this.destinationPath('spec.json'), this.spec)

      // Check if there is a models folder, create one if there isn't
      if (!this.fs.exists(this.destinationPath('models', '.keep'))) {
        this.fs.write(this.destinationPath('models', '.keep'), '')
      }
      this.models.forEach(function (model) {
        var modelMetadataFilename = this.destinationPath('models', `${model.name}.json`)
        this.fs.writeJSON(modelMetadataFilename, model, null, 2)
      }.bind(this))

      // Get the CRUD service for persistence
      function getService (services, serviceName) {
        var serviceDef = null
        Object.keys(services).forEach(function (serviceType) {
          if (serviceDef) return
          var serviceOrServices = services[serviceType]
          if (!Array.isArray(serviceOrServices)) serviceOrServices = [serviceOrServices]
          serviceOrServices.forEach(function (service) {
            if (service.serviceInfo.name && (service.serviceInfo.name === serviceName)) {
              serviceDef = {
                service: service,
                type: serviceType
              }
            }
          })
        })
        return serviceDef
      }

      var crudService
      if (this.spec.crudservice) {
        crudService = getService(this.services, this.spec.crudservice)
      } else {
        crudService = { type: '__memory__' }
      }

      this.fs.copyTpl(
        this.templatePath('crud', 'CRUDResources.swift'),
        this.destinationPath('Sources', this.generatedModule, 'CRUDResources.swift'),
        { models: this.models }
      )
      this.fs.copyTpl(
        this.templatePath('crud', 'AdapterFactory.swift'),
        this.destinationPath('Sources', this.generatedModule, 'AdapterFactory.swift'),
        { models: this.models, crudService: crudService }
      )
      this.fs.copy(
        this.templatePath('crud', 'AdapterError.swift'),
        this.destinationPath('Sources', this.generatedModule, 'AdapterError.swift')
      )
      this.fs.copy(
        this.templatePath('crud', 'ModelError.swift'),
        this.destinationPath('Sources', this.generatedModule, 'ModelError.swift')
      )
      this.models.forEach(function (model) {
        this.fs.copyTpl(
          this.templatePath('crud', 'Resource.swift'),
          this.destinationPath('Sources', this.generatedModule, `${model.classname}Resource.swift`),
          { model: model }
        )
        this.fs.copyTpl(
          this.templatePath('crud', 'Adapter.swift'),
          this.destinationPath('Sources', this.generatedModule, `${model.classname}Adapter.swift`),
          { model: model }
        )
        switch (crudService.type) {
          case 'cloudant':
            this.fs.copyTpl(
            this.templatePath('crud', 'CloudantAdapter.swift'),
            this.destinationPath('Sources', this.generatedModule, `${model.classname}CloudantAdapter.swift`),
            { model: model }
          )
            break
          case '__memory__':
            this.fs.copyTpl(
            this.templatePath('crud', 'MemoryAdapter.swift'),
            this.destinationPath('Sources', this.generatedModule, `${model.classname}MemoryAdapter.swift`),
            { model: model }
          )
            break
        }
        function optional (propertyName) {
          var required = (model.properties[propertyName].required === true)
          var identifier = (model.properties[propertyName].id === true)
          return !required || identifier
        }
        function convertJSTypeToSwiftyJSONType (jsType) {
          switch (jsType) {
            case 'boolean': return 'bool'
            case 'object': return 'dictionary'
            default: return jsType
          }
        }
        function convertJSTypeToSwiftyJSONProperty (jsType) {
          switch (jsType) {
            case 'boolean': return 'bool'
            case 'array': return 'arrayObject'
            case 'object': return 'dictionaryObject'
            default: return jsType
          }
        }
        var propertyInfos = Object.keys(model.properties).map(
          (propertyName) => ({
            name: propertyName,
            jsType: model.properties[propertyName].type,
            swiftyJSONType: convertJSTypeToSwiftyJSONType(model.properties[propertyName].type),
            swiftyJSONProperty: convertJSTypeToSwiftyJSONProperty(model.properties[propertyName].type),
            swiftType: helpers.convertJSTypeToSwift(model.properties[propertyName].type,
                                                      optional(propertyName)),
            optional: optional(propertyName)
          })
        )
        this.fs.copyTpl(
          this.templatePath('crud', 'Model.swift'),
          this.destinationPath('Sources', this.generatedModule, `${model.classname}.swift`),
          { model: model, propertyInfos: propertyInfos, helpers: helpers }
        )
      }.bind(this))
      if (this.product) {
        var productRelativeFilename = path.join('definitions', `${this.projectName}-product.yaml`)
        var productFilename = this.destinationPath(productRelativeFilename)
        if (this.fs.exists(productFilename)) {
          // Do not overwrite this file if it already exists
          this.log(chalk.red('exists, not modifying ') + productRelativeFilename)
        } else {
          this.fs.write(productFilename, YAML.safeDump(this.product))
        }
      }
      if (this.swagger) {
        var swaggerFilename = this.destinationPath('definitions', `${this.projectName}.yaml`)
        this.conflicter.force = true
        this.fs.write(swaggerFilename, YAML.safeDump(this.swagger))

        // Append items to .gitignore that may have been added through model gen process
        var gitignoreFile = this.fs.read(this.destinationPath('.gitignore'))
        for (var item in this.itemsToIgnore) {
          // Ensure we only add unique values
          if (gitignoreFile.indexOf(this.itemsToIgnore[item]) === -1) {
            this.fs.append(
              this.destinationPath('.gitignore'),
              this.itemsToIgnore[item]
            )
          }
        }
      }
    },

    writeMainSwift: function () {
      // Adding the main.swift file by searching for it in the folders
      // and adding it if it is not there.
      var foundMainSwift = false
      if (fs.existsSync(this.destinationPath('Sources'))) {
        // Read all the folders in the Sources directory
        var folders = fs.readdirSync(this.destinationPath('Sources'))
        // Read all the files in each folder
        folders.forEach(function (folder) {
          if (folder.startsWith('.')) return
          if (!fs.statSync(this.destinationPath('Sources', folder)).isDirectory()) return
          var files = fs.readdirSync(this.destinationPath('Sources', folder))
          if (files.indexOf('main.swift') !== -1) {
            foundMainSwift = true
          }
        }.bind(this))
      }

      if (!foundMainSwift) {
        this.fs.copyTpl(
          this.templatePath('common', 'main.swift'),
          this.destinationPath('Sources', this.executableModule, 'main.swift'),
          { applicationModule: this.applicationModule }
        )
      }
    },

    writeDockerFiles: function () {
      if (!this.docker || this.existingProject) return
      this.composeWith(require.resolve('generator-ibm-cloud-enablement/generators/dockertools'), { force: this.force, bluemix: this.bluemix })
    },

    writeBluemixDeploymentFiles: function () {
      if (this.existingProject) return
      // Go through the bluemix object and pull out the serviceInfo for each of
      // the services to pass down to cloud enablement
      this.bluemix.services = {}
      Object.keys(this.services).forEach(prop => {
        var services = Array.isArray(this.services[prop]) ? this.services[prop] : [this.services[prop]]
        this.bluemix.services[prop] = services.map(service => service.serviceInfo)
      })
      this.composeWith(require.resolve('generator-ibm-cloud-enablement/generators/deployment'), { force: this.force, bluemix: this.bluemix, repoType: this.repoType })
    },

    writeKubernetesFiles: function () {
      if (!this.docker || this.existingProject) return
      this.composeWith(require.resolve('generator-ibm-cloud-enablement/generators/kubernetes'), { force: this.force, bluemix: this.bluemix })
    },

    writeUsecaseFiles: function () {
      if (!this.usecase) return
      this.composeWith(require.resolve('generator-ibm-usecase-enablement'), {
        force: this.force,
        bluemix: JSON.stringify(this.bluemix),
        parentContext: {
          injectDependency: dependency => { this.dependencies.push(dependency) }
        }
      })
    },

    writePackageSwift: function () {
      // Check if there is a Package.swift, create one if there isn't
      this._ifNotExistsInProject('Package.swift', (filepath) => {
        this.fs.copyTpl(
          this.templatePath('common', 'Package.swift'),
          filepath,
          {
            appType: this.appType,
            executableModule: this.executableModule,
            generatedModule: this.generatedModule,
            applicationModule: this.applicationModule,
            sdkTargets: this.sdkTargets,
            dependencies: this.dependencies,
            modules: this.modules
          }
        )
      })
    }
  }
})
