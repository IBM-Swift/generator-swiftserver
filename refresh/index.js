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

  initializing: {

    readSpec: function() {

      if(this.options.specfile) {
        debug('attempting to read the spec from file')
        try {
          this.spec = this.fs.readJSON(this.options.specfile);
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
        } catch (err) {
          this.env.error(chalk.red('Cannot read the spec.json: ', err))
        }
      }

      // Default values
      this.bluemix = false;
      this.datastores = [{
          "name": "cloudant",
          "type": "cloudantNoSQLDB",
          "host": "",
          "url": "",
          "username": "",
          "password": "",
          "port": 8080
        }];

      if(this.spec) {
        if(this.spec.appType) {
          this.appType = this.spec.appType;
        } else {
          this.env.error(chalk.red('App type is missing'));
        }
        if(this.spec.appName) {
            this.projectName = this.spec.appName;
        } else {
            this.env.error(chalk.red('Property appName missing from the specification file spec.json'));
        }
        // Bluemix configuration
        if(this.spec.bluemixconfig) {
          this.bluemix = this.spec.bluemixconfig.bluemix;
          this.datastores = this.spec.bluemixconfig.datastores;
        }
        // Monitoring
        this.metrics = this.spec.metrics || false;

        // Runtime Configuration
        if(this.spec.config) {
          this.config = this.spec.config;
          // TODO: Decide whether we still want the config in the spec.json
          // delete this.spec.config;
        }
      }
    },

    setDestinationRootFromSpec: function() {
      if(!this.options.destinationSet) {
        if (this.spec) {
          // Check if we have a directory specified, else use the default one
          this.destinationRoot(this.spec.appDir || 'swiftserver')
        }
      }
    },

    ensureInProject: function() {
      if(!this.spec) {
        // actions.ensureEmptyDirectory.call(this);
      // } else {
        actions.ensureInProject.call(this);
      }
    },

    readModels: function() {
      if(!this.appType == 'crud') return;
      this.modelList = [];
      if(this.spec) {
        // Check if there are any models defined
        if(this.spec.models) {
          this.modelList = this.spec.models;
        }
      }

      this.models = this.modelList || [];
      this.modelNames = [];
      this.modelList.forEach(function(model) {
        this.modelNames.push(model.name);
      }.bind(this));

      try {
        var modelFiles = fs.readdirSync(this.destinationPath('models'))
                           .filter((name) => name.endsWith('.json'));
        modelFiles.forEach(function(modelFile) {
          try {
            debug('reading model json:', this.destinationPath('models', modelFile));
            var modelJSON = fs.readFileSync(this.destinationPath('models', modelFile));
            var model = JSON.parse(modelJSON);
            // Only add models if they aren't being modified/added
            if(this.modelNames.indexOf(model.name) == -1) {
              this.models.push(model);
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
      if(this.spec) {
        if(this.spec.models) {
          this.spec.models = this.models;
        }
      }
    },

    loadProjectInfo: function() {
      // TODO(tunniclm): Improve how we set these values
      // this.projectName = this.projectName
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
    createBasicProject: function() {
      // Root directory

      // Check if there is a .swiftservergenerator-project, create one if there isn't
      if(!this.fs.exists(this.destinationPath('.swiftservergenerator-project'))) {
        // NOTE(tunniclm): Write a zero-byte file to mark this as a valid project
        // directory
        this.fs.write(this.destinationPath('.swiftservergenerator-project'), '');
      }

      // Check if there is a .cfignore, create one if there isn't
      if (!this.fs.exists(this.destinationPath('.cfignore'))) {
        this.fs.copy(this.templatePath('cfignore'),
                     this.destinationPath('.cfignore'));
      }

      // Check if there is a .gitignore, create one if there isn't
      if (!this.fs.exists(this.destinationPath('.gitignore'))) {
        this.fs.copy(this.templatePath('gitignore'),
                     this.destinationPath('.gitignore'));
      }

      // Check if there is a yo-rc, create one if there isn't
      if(!this.fs.exists(this.destinationPath('.yo-rc.json'))) {
        this.fs.writeJSON(this.destinationPath('.yo-rc.json'), {});
      }

      // Check if there is a config.json, create one if there isn't
      if(!this.fs.exists(this.destinationPath('config.json'))) {
        if(this.bluemix) {
          this.fs.copyTpl(
            this.templatePath('config.bluemix.json'),
            this.destinationPath('config.json'),
            { appName: this.projectName, datastores: this.datastores }
          );
        } else {
          if(this.config) {
            this.fs.writeJSON(this.destinationPath('config.json'), this.spec.config);
          }
        }
      }

      // Check if there is a spec.json, if there isn't create one
      if(!this.fs.exists(this.destinationPath('spec.json'))) {
        if(this.spec) {
          this.fs.writeJSON(this.destinationPath('spec.json'), this.spec);
        }
      }

      // Check if there is a index.js, create one if there isn't
      if (this.options.apic) {
        if(!this.fs.exists(this.destinationPath('index.js'))) {
          this.fs.copy(this.templatePath('apic-node-wrapper.js'),
                       this.destinationPath('index.js'));
        }
      }

      if(!this.fs.exists(this.destinationPath('.swift-version'))) {
        this.fs.copy(this.templatePath('swift-version'),
                     this.destinationPath('.swift-version'));
      }

      // models directory
      // Don't write out the models if an apptype has been specified
      if(this.appType != "crud") return;
      // Check if there is a models folder, create one if there isn't
      if(!this.fs.exists(this.destinationPath('models', '.keep'))) {
        this.fs.write(this.destinationPath('models', '.keep'), '');
      }

      this.models.forEach(function(model) {
        var modelMetadataFilename = this.destinationPath('models', `${model.name}.json`);
        this.fs.writeJSON(modelMetadataFilename, model, null, 2);
      }.bind(this));
    },

    createCRUD: function() {
      if(this.appType != "crud") return;

      // TODO: Consolidate with web/basic app type
      this.executableModule = this.projectName;
      this.applicationModule = 'Generated';

      // Check if there is a manifest.yml, create one if there isn't
      if (!this.fs.exists(this.destinationPath('manifest.yml'))) {
        var manifest = `applications:\n` +
                       `- name: ${this.projectName}\n` +
                       `  memory: 128M\n` +
                       `  instances: 1\n` +
                       `  random-route: true\n` +
                       `  buildpack: swift_buildpack\n` +
                       `  command: ${this.projectName} --bind 0.0.0.0:$PORT\n`;

        this.fs.write(this.destinationPath('manifest.yml'), manifest);
      }

      this.fs.copyTpl(
        this.templatePath('GeneratedApplication.swift'),
        this.destinationPath('Sources', 'Generated', 'GeneratedApplication.swift'),
        { models: this.models }
      );
      this.fs.copy(
        this.templatePath('ApplicationConfiguration.swift'),
        this.destinationPath('Sources', 'Generated', 'ApplicationConfiguration.swift')
      );
      this.fs.copyTpl(
        this.templatePath('AdapterFactory.swift'),
        this.destinationPath('Sources', 'Generated', 'AdapterFactory.swift'),
        { models: this.models }
      );
      this.models.forEach(function(model) {
        this.fs.copyTpl(
          this.templatePath('Resource.swift'),
          this.destinationPath('Sources', 'Generated', `${model.classname}Resource.swift`),
          { model: model }
        );
        this.fs.copyTpl(
          this.templatePath('Adapter.swift'),
          this.destinationPath('Sources', 'Generated', `${model.classname}Adapter.swift`),
          { model: model }
        );
        this.fs.copy(
          this.templatePath('AdapterError.swift'),
          this.destinationPath('Sources', 'Generated', 'AdapterError.swift')
        );
        this.fs.copyTpl(
          this.templatePath('MemoryAdapter.swift'),
          this.destinationPath('Sources', 'Generated', `${model.classname}MemoryAdapter.swift`),
          { model: model }
        );
        this.fs.copyTpl(
          this.templatePath('CloudantAdapter.swift'),
          this.destinationPath('Sources', 'Generated', `${model.classname}CloudantAdapter.swift`),
          { model: model }
        );
        this.fs.copy(
          this.templatePath('ModelError.swift'),
          this.destinationPath('Sources', 'Generated', 'ModelError.swift')
        );
        function optional(propertyName) {
          var required = (model.properties[propertyName].required === true);
          var identifier = (model.properties[propertyName].id === true);
          return !required || identifier;
        }
        function convertJSTypeToSwiftyJSONType(jsType) {
          return jsType === 'boolean' ? 'bool' : jsType;
        }
        var propertyInfos = Object.keys(model.properties).map(
          (propertyName) => ({
              name: propertyName,
              jsType: model.properties[propertyName].type,
              swiftyJSONType: convertJSTypeToSwiftyJSONType(model.properties[propertyName].type),
              swiftType: helpers.convertJSTypeToSwift(model.properties[propertyName].type,
                                                      optional(propertyName)),
              optional: optional(propertyName)
          })
        );
        this.fs.copyTpl(
          this.templatePath('Model.swift'),
          this.destinationPath('Sources', 'Generated', `${model.classname}.swift`),
          { model: model, propertyInfos: propertyInfos }
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

    createBasicWeb: function() {
      // Exit if we are not generating web or basic
      if(!(this.appType == 'web' || this.appType == 'basic')) return;

      // TODO: Consolidate with crud app type
      this.executableModule = this.projectName + 'Server';
      this.applicationModule = this.projectName;

      // Add the datastores if we are using bluemix
      if(this.bluemix) {
        this.datastores.forEach(function(store) {
          var storeName = store.name;
          if(storeName === 'cloudant') {
            this.fs.copy(
              this.templatePath('CouchDBExtension.swift'),
              this.destinationPath('Sources', this.projectName, 'Extensions', 'CouchDBExtension.swift')
            );
          }
          if(storeName === 'mongo') {
            this.fs.copy(
              this.templatePath('MongoDBExtension.swift'),
              this.destinationPath('Sources', this.projectName, 'Extensions', 'MongoDBExtension.swift')
            );
          }
          if(storeName === 'mysql') {
            this.fs.copy(
              this.templatePath('MySQLExtension.swift'),
              this.destinationPath('Sources', this.projectName, 'Extensions', 'MySQLExtension.swift')
            );
          }
          if(storeName === 'postgres') {
            this.fs.copy(
              this.templatePath('PostgreSQLExtension.swift'),
              this.destinationPath('Sources', this.projectName, 'Extensions', 'PostgreSQLExtension.swift')
            );
          }
          if(storeName === 'redis') {
            this.fs.copy(
              this.templatePath('RedisExtension.swift'),
              this.destinationPath('Sources', this.projectName, 'Extensions', 'RedisExtension.swift')
            );
          }
        }.bind(this));

        this.fs.copyTpl(
          this.templatePath('manifest.yml'),
          this.destinationPath('manifest.yml'),
          { appName: this.projectName,
            executableName: this.executableModule }
        );

        this.fs.copy(
          this.templatePath('README.md'),
          this.destinationPath('README.md')
         );

        this.fs.copyTpl(
          this.templatePath('pipeline.yml'),
          this.destinationPath('.bluemix', 'pipeline.yml'),
          { appName: this.projectName }
        );
      }

      this.fs.copyTpl(
        this.templatePath('Controller.swift'),
        this.destinationPath('Sources', this.projectName, 'Controller.swift'),
        { bluemix: this.bluemix, datastores: this.datastores,
          cloudant_service_name: `${this.projectName}CloudantService`,
          appType: this.appType, metrics: this.metrics }
      );

      if(this.appType === 'web') {
        //Create the public folder
        this.fs.write(this.destinationPath('public','.keep'), '');
      }
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
        if(this.appType == 'crud') {
          this.fs.copy(
            this.templatePath('main.crud.swift'),
            this.destinationPath('Sources', this.executableModule, 'main.swift')
          );
        } else {
          this.fs.copyTpl(
            this.templatePath('main.basicweb.swift'),
            this.destinationPath('Sources', this.executableModule, 'main.swift'),
            { applicationModule: this.applicationModule }
          );
        }
      }
    },

    writePackageSwift: function() {
      // Check if there is a Package.swift, create one if there isn't
      if(!this.fs.exists(this.destinationPath('Package.swift'))) {
        this.fs.copyTpl(
          this.templatePath('Package.swift'),
          this.destinationPath('Package.swift'),
          {
            executableModule: this.executableModule,
            applicationModule: this.applicationModule,
            bluemix: this.bluemix,
            datastores: this.datastores,
            metrics: this.metrics
          }
        )
      }
    }
  },
});
