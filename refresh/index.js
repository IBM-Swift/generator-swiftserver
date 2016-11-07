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

var actions = require('../lib/actions');

module.exports = generators.Base.extend({
  constructor: function() {
    generators.Base.apply(this, arguments);
  },

  initializing: {
    ensureInProject: actions.ensureInProject,

    readConfig: function() {
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

    try {
      debug('attempting to load files from', this.destinationPath('models'));
      var modelFiles = fs.readdirSync(this.destinationPath('models'))
                         .filter((name) => name.endsWith('.json'));
      modelFiles.forEach(function(modelFile) {
        try {
          debug('reading model json:', this.destinationPath('models', modelFile));
          var modelJSON = fs.readFileSync(this.destinationPath('models', modelFile));
          var model = JSON.parse(modelJSON);

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
    this.swagger = swagger;
  },

  writing: function() {
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
});
