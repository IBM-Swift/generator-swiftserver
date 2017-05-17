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

'use strict';
var generators = require('yeoman-generator');
var fs = require('fs');
var path = require('path');
var chalk = require('chalk');
var YAML = require('js-yaml');
var debug = require('debug')('generator-swiftserver:refresh');
var rimraf = require('rimraf');

var helpers = require('../lib/helpers');
var actions = require('../lib/actions');

module.exports = generators.Base.extend({
  constructor: function() {
    generators.Base.apply(this, arguments);
  },

  constructor: function() {
    generators.Base.apply(this,arguments);

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
  _ifNotExistsInProject: function(fileInProject, cb) {
    var filepath;
    if (typeof(fileInProject) === 'string') {
      filepath = this.destinationPath(fileInProject);
    } else {
      filepath = this.destinationPath.apply(this, fileInProject);
    }
    if (this.fs.exists(this.destinationPath(filepath))) {
      const relativeFilepath = path.relative(this.destinationRoot(), filepath);
      this.log(chalk.cyan('   exists ') + relativeFilepath);
    } else {
      cb.call(this, filepath);
    }
  },

  initializing: {
    config: function() {
      if(!this.options.singleShot) {
        this.generatorVersion = require('../package.json').version;
        this.config.defaults({ version: this.generatorVersion });

        // Ensure generator major version match
        // TODO Use node-semver? Strip leading non-digits?
        var generatorMajorVersion = this.generatorVersion.split('.')[0];
        var projectGeneratedWithMajorVersion = this.config.get('version').split('.')[0];
        if (projectGeneratedWithMajorVersion !== generatorMajorVersion) {
          this.env.error(`Project was generated with a different major version of the generator (project with v${projectGeneratedWithMajorVersion}, current v${generatorMajorVersion})`);
        }
      }
    },

    readSpec: function() {
      this.existingProject = false;

      if(this.options.specfile) {
        debug('attempting to read the spec from file')
        try {
          this.spec = this.fs.readJSON(this.options.specfile);
          this.existingProject = false;
        } catch (err) {
          this.env.error(chalk.red(err));
        }
      }

      if(this.options.spec) {
        debug('attempting to read the spec from cli')
        try {
          this.spec = JSON.parse(this.options.spec);
        } catch (err) {
          this.env.error(chalk.red(err));
        }
      }

      // Getting an object from the generators
      if(this.options.specObj) {
        this.spec = this.options.specObj;
      }

      // If we haven't receieved some sort of spec we attempt to read the spec.json
      if(!this.spec) {
        try {
          this.spec = this.fs.readJSON(this.destinationPath('spec.json'));
          this.existingProject = true;
        } catch (err) {
          this.env.error(chalk.red('Cannot read the spec.json: ', err))
        }
      }

      if (!this.spec) {
        this.env.error(chalk.red('No specification for this project'));
      }

      // App type
      if (!this.spec.appType) {
        this.env.error(chalk.red('Property appType is missing from the specification'));
      }
      if (['crud', 'scaffold'].indexOf(this.spec.appType) == -1) {
        this.env.error(chalk.red(`Property appType is invalid: ${this.spec.appType}`));
      }
      this.appType = this.spec.appType;

      // App name
      if (this.spec.appName) {
          this.projectName = this.spec.appName;
      } else {
          this.env.error(chalk.red('Property appName missing from the specification'));
      }

      // Bluemix configuration
      if (this.spec.bluemix === true) {
        this.bluemix = {};
      } else if (typeof(this.spec.bluemix) === 'object') {
        this.bluemix = {};
        if (typeof(this.spec.bluemix.name) === 'string') {
          this.bluemix.name = this.spec.bluemix.name;
        }
        if (typeof(this.spec.bluemix.host) === 'string') {
          this.bluemix.host = this.spec.bluemix.host;
        }
        if (typeof(this.spec.bluemix.domain) === 'string') {
          this.bluemix.domain = this.spec.bluemix.domain;
        }
        if (typeof(this.spec.bluemix.memory) === 'string') {
          this.bluemix.memory = this.spec.bluemix.memory;
        }
        if (typeof(this.spec.bluemix.diskQuota) === 'string') {
          this.bluemix.diskQuota = this.spec.bluemix.diskQuota;
        }
        if (typeof(this.spec.bluemix.instances) === 'number') {
          this.bluemix.instances = this.spec.bluemix.instances;
        }
      }

      // Clean app name (for containers and other uses)
      this.cleanAppName = helpers.sanitizeAppName(this.bluemix && this.bluemix.name || this.projectName);

      // Docker configuration
      this.docker = (this.spec.docker === true);

      // Web configuration
      this.web = (this.spec.web === true);

      // Example endpoints
      this.exampleEndpoints = (this.spec.exampleEndpoints === true);

      // Swagger hosting
      this.hostSwagger = (this.spec.hostSwagger === true);

      // Service configuration
      this.services = this.spec.services || {};
      // Ensure every service has a credentials object to
      // make life easier for templates
      Object.keys(this.services).forEach(function(serviceType) {
        this.services[serviceType].forEach(function(service, index) {
          // TODO: Further checking that service name is valid?
          if (!service.name) {
            this.env.error(chalk.red(`Service name is missing in spec for services.${serviceType}[${index}]`));
          }
          service.credentials = service.credentials || {};
        }.bind(this));
      }.bind(this));

      // Capability configuration
      this.capabilities = this.spec.capabilities || {};

      // Metrics
      this.capabilities.metrics = (this.capabilities.metrics === true || undefined)

      // Autoscaling
      if (this.capabilities.autoscale === true) {
        this.capabilities.autoscale = `${this.projectName}ScalingService`;
      } else if(typeof(this.capabilities.autoscale) !== 'string') {
        this.capabilities.autoscale = undefined;
      }

      // Autoscaling implies monitoring and Bluemix
      if (this.capabilities.autoscale) {
        this.bluemix = true;
        this.capabilities.metrics = true;
      }

      // Set the names of the modules
      this.generatedModule = 'Generated'
      this.applicationModule = 'Application';
      this.executableModule = this.projectName;

      if (this.appType === 'crud') {
        this.hostSwagger = true;
      }
    },

    setDestinationRootFromSpec: function() {
      if(!this.options.destinationSet && !this.existingProject) {
        // Check if we have a directory specified, else use the default one
        this.destinationRoot(this.spec.appDir || 'swiftserver')
      }
    },

    ensureInProject: function() {
      if (this.existingProject) {
        actions.ensureInProject.call(this);
      } else {
        actions.ensureEmptyDirectory.call(this);
      }
    },

    readModels: function() {
      if(this.appType !== 'crud') return;

      // Start with the models from the spec
      var modelMap = {};
      if (this.spec.models) {
        this.spec.models.forEach((model) => {
          if (model.name) {
            modelMap[model.name] = model;
          } else {
            this.log('Failed to process model in spec: model name missing');
          }
        });
      }

      // Update the spec with any changes from the model .json files
      try {
        var modelFiles = fs.readdirSync(this.destinationPath('models'))
                           .filter((name) => name.endsWith('.json'));
        modelFiles.forEach(function(modelFile) {
          try {
            debug('reading model json:', this.destinationPath('models', modelFile));
            var modelJSON = fs.readFileSync(this.destinationPath('models', modelFile));
            var model = JSON.parse(modelJSON);
            // Only add models if they aren't being modified/added
            if (model.name) {
              modelMap[model.name] = model;
            } else {
              this.log(`Failed to process model file ${modelFile}: model name missing`);
            }
          } catch (_) {
            // Failed to read model file
            this.log(`Failed to process model file ${modelFile}`);
          }
        }.bind(this));
        if (modelFiles.length === 0){
          debug('no files in the model directory')
        }
      } catch (_) {
        // No models directory
        debug(this.destinationPath('models'), 'directory does not exist')
      }

      // Add any models we need to update
      if (this.options.model) {
        if (this.options.model.name) {
          modelMap[this.options.model.name] = this.options.model;
        } else {
          this.env.error(chalk.red('Failed to update model: name missing'));
        }
      }

      this.models = Object.keys(modelMap).map((modelName) => modelMap[modelName]);
    },

    loadProjectInfo: function() {
      // TODO(tunniclm): Improve how we set these values
      this.projectVersion = '1.0.0';
    }
  },

  buildProduct: function() {
    if (!this.options.apic) return;
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
    };
  },

  buildSwagger: function() {
    if (this.appType !== 'crud') return;
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
    };

    if (this.options.apic) {
      swagger['info']['x-ibm-name'] = this.projectName;
      swagger['schemes'] = ['https'];
      swagger['host'] = '$(catalog.host)';
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
      };
      swagger['security'] = [{
        'clientIdHeader': [],
        'clientSecretHeader': []
      }];
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
      };
    }

    this.models.forEach(function(model) {
      var modelName = model['name'];
      var modelNamePlural = model['plural'];
      var modelProperties = model['properties'];
      var collectivePath = `/${modelNamePlural}`;
      var singlePath = `/${modelNamePlural}/{id}`;

      // tunniclm: Generate definitions
      var swaggerProperties = {};
      var requiredProperties = [];
      for (var propName in model['properties']) {
        swaggerProperties[propName] = {
          'type': model['properties'][propName]['type']
        };
        if (typeof model['properties'][propName]['format'] !== 'undefined')
        {
          swaggerProperties[propName]['format'] = model['properties'][propName]['format'];
        }
        if (model['properties'][propName]['required'] === true) {
          requiredProperties.push(propName);
        }
      }
      swagger['definitions'][modelName] = {
        'properties': swaggerProperties,
        'additionalProperties': false
      }
      if (requiredProperties.length > 0) {
        swagger['definitions'][modelName]['required'] = requiredProperties;
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
              'format': 'JSON',
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
              'required': false,
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
              'required': false,
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
      };
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
              'required': false,
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
      };
    });
    this.swagger = swagger;
  },

  writing: {
    createCommonFiles: function() {

      // Check if we should create generator metadata files
      if(!this.options.singleShot) {
        // Root directory
        this.config.save();

        // Check if there is a .swiftservergenerator-project, create one if there isn't
        this._ifNotExistsInProject('.swiftservergenerator-project', (filepath) => {
          // NOTE(tunniclm): Write a zero-byte file to mark this as a valid project
          // directory
          this.fs.write(filepath, '');
        });
      }

      // Check if there is a .gitignore, create one if there isn't
      this._ifNotExistsInProject('.gitignore', (filepath) => {
        this.fs.copy(this.templatePath('common', 'gitignore'), filepath);
      });

      // Check if there is a config.json, create one if there isn't
      this._ifNotExistsInProject('config.json', (filepath) => {
        var configToWrite;
        if(this.bluemix) {
          configToWrite = helpers.generateCloudConfig(this.spec.config, this.services);
        } else {
          configToWrite = helpers.generateLocalConfig(this.spec.config, this.services);
        }
        this.fs.writeJSON(filepath, configToWrite);
      });

      this._ifNotExistsInProject('.swift-version', (filepath) => {
        this.fs.copy(this.templatePath('common','swift-version'),
                     filepath);
      });

      this._ifNotExistsInProject('LICENSE', (filepath) => {
        this.fs.copy(
          this.templatePath('common', 'LICENSE_for_generated_code'),
                            filepath);
      });

      this._ifNotExistsInProject(['Sources', this.applicationModule, 'Application.swift'], (filepath) => {
        this.fs.copyTpl(
          this.templatePath('common', 'Application.swift'),
          filepath,
          {
            appType: this.appType,
            appName: this.projectName,
            generatedModule: this.generatedModule,
            services: this.services,
            bluemix: this.bluemix,
            capabilities: this.capabilities,
            web: this.web,
            hostSwagger: this.hostSwagger,
            exampleEndpoints: this.exampleEndpoints
          }
        );
      });

      // Check if there is a spec.json, if there isn't create one
      if(this.spec) {
        this._ifNotExistsInProject('spec.json', (filepath) => {
          this.fs.writeJSON(filepath, this.spec);
        });
      }

      // Check if there is a index.js, create one if there isn't
      if (this.options.apic) {
        this._ifNotExistsInProject('index.js', (filepath) => {
          this.fs.copy(this.templatePath('common', 'apic-node-wrapper.js'),
                       filepath);
        });
      }

      this._ifNotExistsInProject(['Tests', this.applicationModule + 'Tests', 'RouteTests.swift'], (filepath) => {
        this.fs.copyTpl(
          this.templatePath('common', 'RouteTests.swift'),
          filepath,
          { applicationModule: this.applicationModule }
        );
      });

      this._ifNotExistsInProject(['Tests', 'LinuxMain.swift'], (filepath) => {
          this.fs.copyTpl(
            this.templatePath('common', 'LinuxMain.swift'),
            filepath,
            { applicationModule: this.applicationModule }
          );
      });

      if (this.hostSwagger) {
        this._ifNotExistsInProject(['Sources', this.applicationModule, 'Routes', 'SwaggerRoute.swift'], (filepath) => {
          this.fs.copyTpl(
            this.templatePath('common', 'SwaggerRoute.swift'),
            filepath
          );
        });
      }

      if (this.web) {
        this.fs.write(this.destinationPath('public','.keep'), '');
      }

      if (this.exampleEndpoints) {
        this.fs.copy(
          this.templatePath('common', 'ProductRoutes.swift'),
          this.destinationPath('Sources', this.applicationModule, 'Routes', 'ProductRoutes.swift')
        );
        this.fs.copy(
          this.templatePath('common', 'productSwagger.yaml'),
          this.destinationPath('definitions', `${this.projectName}.yaml`)
        );
        if (this.web) {
          this.fs.copy(
            this.templatePath('common', 'swagger-ui/**/*'),
            this.destinationPath('public', 'explorer')
          );
          this.fs.copy(
            this.templatePath('common', 'NOTICES_for_generated_swaggerui'),
            this.destinationPath('NOTICES.txt')
          );
        }
      }

      if (this.appType !== 'crud') {
        this.fs.copyTpl(
          this.templatePath('common', 'README.scaffold.md'),
          this.destinationPath('README.md'),
          {
            appName: this.projectName,
            executableName: this.executableModule,
            generatorVersion: this.generatorVersion,
            bluemix: this.bluemix,
            web: this.web,
            docker: this.docker,
            hostSwagger: this.hostSwagger,
            exampleEndpoints: this.exampleEndpoints,
            metrics: this.capabilities.metrics,
            autoscale: this.capabilities.autoscale,
            cloudant: this.services.cloudant && this.services.cloudant.length > 0,
            redis: this.services.redis && this.services.redis.length > 0,
            objectstorage: this.services.objectstorage && this.services.objectstorage.length > 0,
            appid: this.services.appid && this.services.appid.length > 0
          }
        );
        this.fs.write(this.destinationPath('Sources', this.applicationModule, 'Routes', '.keep'), '');
      }
    },

    createCRUD: function() {
      if(this.appType != "crud") return;

      if (this.bluemix) {
        if(!this.fs.exists(this.destinationPath('README.md'))) {
          this.fs.copy(
            this.templatePath('bluemix', 'README.md'),
            this.destinationPath('README.md')
          );
        }
      }

      // Add the models to the spec
      this.spec.models = this.models;
      this.fs.writeJSON(this.destinationPath('spec.json'), this.spec);

      // Check if there is a models folder, create one if there isn't
      if(!this.fs.exists(this.destinationPath('models', '.keep'))) {
        this.fs.write(this.destinationPath('models', '.keep'), '');
      }
      this.models.forEach(function(model) {
        var modelMetadataFilename = this.destinationPath('models', `${model.name}.json`);
        this.fs.writeJSON(modelMetadataFilename, model, null, 2);
      }.bind(this));

      // Get the CRUD service for persistence
      function getService(services, serviceName) {
        var serviceDef = null;
        Object.keys(services).forEach(function(serviceType) {
          if (serviceDef) return;
          services[serviceType].forEach(function(service) {
            if (service.name && (service.name === serviceName)) {
              serviceDef = {
                service: service,
                type: serviceType
              }
              return;
            }
          });
        });
        return serviceDef;
      }

      var crudService;
      if (this.spec.crudservice) {
        crudService = getService(this.services, this.spec.crudservice);
      } else {
        crudService = { type: '__memory__' };
      }

      this.fs.copyTpl(
        this.templatePath('crud', 'CRUDResources.swift'),
        this.destinationPath('Sources', this.generatedModule, 'CRUDResources.swift'),
        { models: this.models }
      );
      this.fs.copyTpl(
        this.templatePath('crud', 'AdapterFactory.swift'),
        this.destinationPath('Sources', this.generatedModule, 'AdapterFactory.swift'),
        { models: this.models, crudService: crudService, bluemix: this.bluemix }
      );
      this.fs.copy(
        this.templatePath('crud', 'AdapterError.swift'),
        this.destinationPath('Sources', this.generatedModule, 'AdapterError.swift')
      );
      this.fs.copy(
        this.templatePath('crud', 'ModelError.swift'),
        this.destinationPath('Sources', this.generatedModule, 'ModelError.swift')
      );
      this.models.forEach(function(model) {
        this.fs.copyTpl(
          this.templatePath('crud', 'Resource.swift'),
          this.destinationPath('Sources', this.generatedModule, `${model.classname}Resource.swift`),
          { model: model }
        );
        this.fs.copyTpl(
          this.templatePath('crud', 'Adapter.swift'),
          this.destinationPath('Sources', this.generatedModule, `${model.classname}Adapter.swift`),
          { model: model }
        );
        switch (crudService.type) {
        case 'cloudant':
          this.fs.copyTpl(
            this.templatePath('crud', 'CloudantAdapter.swift'),
            this.destinationPath('Sources', this.generatedModule, `${model.classname}CloudantAdapter.swift`),
            { model: model }
          );
          break;
        case '__memory__':
          this.fs.copyTpl(
            this.templatePath('crud', 'MemoryAdapter.swift'),
            this.destinationPath('Sources', this.generatedModule, `${model.classname}MemoryAdapter.swift`),
            { model: model }
          );
          break;
        }
        function optional(propertyName) {
          var required = (model.properties[propertyName].required === true);
          var identifier = (model.properties[propertyName].id === true);
          return !required || identifier;
        }
        function convertJSTypeToSwiftyJSONType(jsType) {
          switch (jsType) {
            case 'boolean': return 'bool';
            case 'object':  return 'dictionary';
            default:        return jsType;
          }
        }
        function convertJSTypeToSwiftyJSONProperty(jsType) {
          switch (jsType) {
            case 'boolean': return 'bool';
            case 'array':   return 'arrayObject';
            case 'object':  return 'dictionaryObject';
            default:        return jsType;
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
        );
        this.fs.copyTpl(
          this.templatePath('crud', 'Model.swift'),
          this.destinationPath('Sources', this.generatedModule, `${model.classname}.swift`),
          { model: model, propertyInfos: propertyInfos, helpers: helpers }
        );
      }.bind(this));
      if (this.product) {
        var productRelativeFilename = path.join('definitions', `${this.projectName}-product.yaml`);
        var productFilename = this.destinationPath(productRelativeFilename);
        if (this.fs.exists(productFilename)) {
          // Do not overwrite this file if it already exists
          this.log(chalk.red('exists, not modifying ') + productRelativeFilename);
        } else {
          this.fs.write(productFilename, YAML.safeDump(this.product));
        }
      }
      if (this.swagger) {
        var swaggerFilename = this.destinationPath('definitions', `${this.projectName}.yaml`);
        this.conflicter.force = true;
        this.fs.write(swaggerFilename, YAML.safeDump(this.swagger));
      }
    },

    createConfigFiles: function() {
      if(this.bluemix) return;

      // Only create these files if we are running locally
      Object.keys(this.services).forEach(function(serviceType) {
        if(serviceType === 'cloudant') {
          this.fs.copy(
            this.templatePath('local', 'CloudantConfig.swift'),
            this.destinationPath('Sources', this.applicationModule, 'CloudantConfig.swift')
          )
        }
        if(serviceType === 'redis') {
          this.fs.copy(
            this.templatePath('local', 'RedisConfig.swift'),
            this.destinationPath('Sources', this.applicationModule, 'RedisConfig.swift')
          )
        }
      }.bind(this))
    },

    createExtensionFiles: function() {
      if(!this.bluemix) {
        this._ifNotExistsInProject(['Sources', this.applicationModule, 'Extensions', 'ConfigurationManagerExtension.swift'], (filepath) => {
          // Add the extension for the configuration manager
          this.fs.copy(
            this.templatePath('extensions', 'ConfigurationManagerExtension.swift'),
            filepath
          );
        });
        return;
      }

      // Create all the extension files
      Object.keys(this.services).forEach(function(serviceType) {
        if(serviceType === 'cloudant') {
          this._ifNotExistsInProject(['Sources', this.applicationModule, 'Extensions', 'CouchDBExtension.swift'], (filepath) => {
            this.fs.copy(
              this.templatePath('extensions', 'CouchDBExtension.swift'),
              filepath
            );
          });
        }
        if(serviceType === 'mysql') {
          this._ifNotExistsInProject(['Sources', this.applicationModule, 'Extensions', 'MySQLExtension.swift'], (filepath) => {
            this.fs.copy(
              this.templatePath('extensions', 'MySQLExtension.swift'),
              filepath
            );
          });
        }
        if(serviceType === 'postgresql') {
          this._ifNotExistsInProject(['Sources', this.applicationModule, 'Extensions', 'PostgreSQLExtension.swift'], (filepath) => {
            this.fs.copy(
              this.templatePath('extensions', 'PostgreSQLExtension.swift'),
              filepath
            );
          });
        }
        if(serviceType === 'redis') {
          this._ifNotExistsInProject(['Sources', this.applicationModule, 'Extensions', 'RedisExtension.swift'], (filepath) => {
            this.fs.copy(
              this.templatePath('extensions', 'RedisExtension.swift'),
              filepath
            );
          });
        }
        if(serviceType === 'objectstorage') {
          this._ifNotExistsInProject(['Sources', this.applicationModule, 'Extensions', 'ObjStorageExtension.swift'], (filepath) => {
            this.fs.copy(
              this.templatePath('extensions', 'ObjStorageExtension.swift'),
              filepath
            );
          });
        }
        if(serviceType === 'appid') {
          this._ifNotExistsInProject(['Sources', this.applicationModule, 'Extensions', 'AppIDExtension.swift'], (filepath) => {
            this.fs.copy(
              this.templatePath('extensions', 'AppIDExtension.swift'),
              filepath
            );
          });
        }
      }.bind(this));
    },

    writeMainSwift: function() {
      // Adding the main.swift file by searching for it in the folders
      // and adding it if it is not there.
      var foundMainSwift = false;
      if(fs.existsSync(this.destinationPath('Sources'))) {
        // Read all the folders in the Sources directory
        var folders = fs.readdirSync(this.destinationPath('Sources'));
        // Read all the files in each folder
        folders.forEach(function(folder) {
          if(folder.startsWith('.')) return;
          if(!fs.statSync(this.destinationPath('Sources', folder)).isDirectory()) return;
          var files = fs.readdirSync(this.destinationPath('Sources', folder));
          if(files.indexOf("main.swift") != -1) {
            foundMainSwift = true;
          }
        }.bind(this));
      }

      if(!foundMainSwift) {
        this.fs.copyTpl(
          this.templatePath('common', 'main.swift'),
          this.destinationPath('Sources', this.executableModule, 'main.swift'),
          { applicationModule: this.applicationModule }
        );
      }
    },

    writeDockerFiles: function() {
      if (!this.docker) return;

      this._ifNotExistsInProject('.dockerignore', (filepath) => {
        this.fs.copy(this.templatePath('docker', 'dockerignore'),
                     filepath);
      });
      this._ifNotExistsInProject('Dockerfile-tools', (filepath) => {
        this.fs.copy(this.templatePath('docker', 'Dockerfile-tools'),
                     filepath);
      });
      this._ifNotExistsInProject('Dockerfile', (filepath) => {
        this.fs.copy(this.templatePath('docker', 'Dockerfile'),
                     filepath);
      });
      this._ifNotExistsInProject('cli-config.yml', (filepath) => {
        this.fs.copyTpl(
          this.templatePath('docker', 'cli-config.yml'),
          filepath,
          { cleanAppName: this.cleanAppName,
            executableName: this.executableModule }
        );
      });
    },

    writeBluemixDeploymentFiles: function() {
      if (!this.bluemix) return;

      // Check if there is a .cfignore, create one if there isn't
      if (!this.fs.exists(this.destinationPath('.cfignore'))) {
        this.fs.copy(this.templatePath('common', 'cfignore'),
                     this.destinationPath('.cfignore'));
      }

      this._ifNotExistsInProject('manifest.yml', (filepath) => {
        this.fs.copyTpl(
          this.templatePath('bluemix', 'manifest.yml'),
          filepath,
          { cleanAppName: this.cleanAppName,
            executableName: this.executableModule,
            services: this.services,
            capabilities: this.capabilities,
            hostSwagger: this.hostSwagger,
            bluemix: this.bluemix }
        );
      });

      this._ifNotExistsInProject(['.bluemix', 'pipeline.yml'], (filepath) => {
        this.fs.copyTpl(
          this.templatePath('bluemix', 'pipeline.yml'),
          filepath,
          { appName: this.projectName,
            services: this.services,
            capabilities: this.capabilities,
            helpers: helpers }
        );
      });

      this._ifNotExistsInProject(['.bluemix', 'toolchain.yml'], (filepath) => {
        this.fs.copyTpl(
          this.templatePath('bluemix', 'toolchain.yml'),
          filepath,
          { appName: this.projectName }
        );
      });

      this._ifNotExistsInProject(['.bluemix', 'deploy.json'], (filepath) => {
        this.fs.copy(this.templatePath('bluemix', 'deploy.json'),
                     filepath);
      });
    },

    writePackageSwift: function() {
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
            bluemix: this.bluemix,
            services: this.services,
            capabilities: this.capabilities,
          }
        )
      });
    }
  },
});
