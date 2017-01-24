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
        actions.ensureInProject.call(this);
      }
    },

    readConfig: function() {

      // If we have passed a specification file with the config in
      if(this.spec) {
        // Check if we have specified the config in the file
        if(this.spec.config) {
          debug('reading the config in the specification file');
          this.config = this.spec.config;
          if(!this.config.appName) {
              this.env.error(chalk.red('Property appName missing from config file config.json'));
          }
          // Write the spec config to disk
          this.fs.writeJSON(this.destinationPath('config.json'), this.config);
          return;
        }
      }

      // If we are running refresh generator on its own
      debug('reading config json from: ', this.destinationPath('config.json'));
      try {
        this.config = this.fs.readJSON(this.destinationPath('config.json'));
        if (!this.config) {
          this.env.error(chalk.red('Config file config.json not found'));
        }
        if (!this.config.appName) {
          this.env.error(chalk.red('Property appName missing from config file config.json'));
        }
      } catch (err) {
        this.env.error(chalk.red(err));
      }
    },

    createBasicProject: function() {
      // Check if there is a yo-rc, create one if there isn't
      if(!this.fs.exists(this.destinationPath('.yo-rc.json'))) {
        this.fs.writeJSON(this.destinationPath('.yo-rc.json'), {});
      }

      // Check if there is a Package.swift, create one if there isn't
      if(!this.fs.exists(this.destinationPath('Package.swift'))) {
        let packageSwift = helpers.generatePackageSwift(this.config);
        this.fs.write(this.destinationPath('Package.swift'), packageSwift);
      }

      // Check if there is a .swiftservergenerator-project, create one if there isn't
      if(!this.fs.exists(this.destinationPath('.swiftservergenerator-project'))) {
        // NOTE(tunniclm): Write a zero-byte file to mark this as a valid project
        // directory
        this.fs.write(this.destinationPath('.swiftservergenerator-project'), '');
      }

      // Check if there is a manifest.yml, create one if there isn't
      if (!this.fs.exists(this.destinationPath('manifest.yml'))) {
        var manifest = `applications:\n` +
                       `- name: ${this.appname}\n` +
                       `  memory: 128M\n` +
                       `  instances: 1\n` +
                       `  random-route: true\n` +
                       `  buildpack: swift_buildpack\n` +
                       `  command: ${this.appname} --bind 0.0.0.0:$PORT\n`;

        this.fs.write(this.destinationPath('manifest.yml'), manifest);
      }

      // Check if there is a .cfignore, create one if there isn't
      if (!this.fs.exists(this.destinationPath('.cfignore'))) {
        this.fs.copy(this.templatePath('.cfignore'),
                     this.destinationPath('.cfignore'));
      }

      // Check if there is a models folder, create one if there isn't
      if(!this.fs.exists(this.destinationPath('models', '.keep'))) {
        this.fs.write(this.destinationPath('models', '.keep'), '');
      }

      // Check if there is a index.js, create one if there isn't
      if (this.options.apic) {
        if(!this.fs.exists(this.destinationPath('index.js'))) {
          this.fs.copy(this.templatePath('apic-node-wrapper.js'),
                       this.destinationPath('index.js'));
        }
      }
    },

    createModels: function() {
      var done = this.async();

      // Check for a specification
      if(this.spec) {
        // Check if there are any models defined
        if(this.spec.models) {
          var modelList = this.spec.models;
        } else {
          done();
          return;
        }
      }

      // No models have been passed in and therefore nothing has to be written to disk
      if(!modelList) {
        done();
        return;
      }

      modelList.forEach(function(model) {
        var modelMetadataFilename = this.destinationPath('models', `${model.name}.json`);
        this.fs.writeJSON(modelMetadataFilename, model, null, 2);
      }.bind(this));

      this.fs.commit(function() {
        done();
      });
    },

    readModels: function() {
      this.models = [];
      try {
        var modelFiles = fs.readdirSync(this.destinationPath('models'))
                           .filter((name) => name.endsWith('.json'));
        modelFiles.forEach(function(modelFile) {
          try {
            debug('reading model json:', this.destinationPath('models', modelFile));
            var modelJSON = fs.readFileSync(this.destinationPath('models', modelFile));
            var model = JSON.parse(modelJSON);
            this.models.push(model);
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
    },

    loadProjectInfo: function() {
      // TODO(tunniclm): Improve how we set these values
      this.projectName = this.config.appName
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
    cleanGeneratedDirectory: function() {
      var done = this.async();

      // Delete all the previous generated swift files
      // (Deletes the application configuration though...)
      rimraf(this.destinationPath('Sources', 'Generated'), function() {
        // Add the ApplicationConfiguration to the Generated folder again
        this.fs.copy(this.templatePath('ApplicationConfiguration.swift'),
                     this.destinationPath('Sources', 'Generated', 'ApplicationConfiguration.swift'));
        this.fs.commit(function() {
          done();
          return;
        });
      }.bind(this));
    },

    cleanMainDirectory: function() {
      var done = this.async();
      // Find a main.swift
      const FILE = "main.swift";

      // Read all the folders in the Sources directory
      var folders = fs.readdirSync(this.destinationPath('Sources'));
      // Read all the files in each folder
      folders.forEach(function(folder) {
        var files = fs.readdirSync(this.destinationPath('Sources', folder));
        // If the file contains the main.swift then we delete the folder and
        //replace with the new one
        if(files.indexOf(FILE) != -1) {
            rimraf(this.destinationPath('Sources', folder), function() {
              this.fs.copy(this.templatePath('main.swift'),
                           this.destinationPath('Sources', this.config.appName, 'main.swift'));
              this.fs.commit(function() {
                done();
                return;
              });
            }.bind(this));
        }
      }.bind(this));
      // If there is no main.swift anywhere we copy anyway
      this.fs.copy(this.templatePath('main.swift'),
                   this.destinationPath('Sources', this.config.appName, 'main.swift'));
     this.fs.commit(function() {
       done();
     });
   },

   writeSwiftFiles: function() {
      this.fs.copyTpl(
        this.templatePath('GeneratedApplication.swift'),
        this.destinationPath('Sources', 'Generated', 'GeneratedApplication.swift'),
        { models: this.models }
      );
      this.fs.copyTpl(
        this.templatePath('ApplicationConfiguration.swift'),
        this.destinationPath('Sources', 'Generated', 'ApplicationConfiguration.swift'),
        { store: this.config.store }
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
        function optional(propertyName) {
          var required = (model.properties[propertyName].required === true);
          var identifier = (model.properties[propertyName].id === true);
          return !required || identifier;
        }
        var propertyInfos = Object.keys(model.properties).map(
          (propertyName) => ({
              name: propertyName,
              jsType: model.properties[propertyName].type,
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
    }
  },
});
