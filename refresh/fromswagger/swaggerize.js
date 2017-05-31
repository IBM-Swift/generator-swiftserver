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
var util = require('util');
var genUtils = require('./generatorUtils');
var handlebars = require('handlebars');
var wreck = require('wreck');
var mkdirp = require('mkdirp');
var memFs = require('mem-fs');
var editor = require('mem-fs-editor');
var enjoi = require('enjoi');
var apischema = require('swagger-schema-official/schema');
var builderUtils = require('swaggerize-routes/lib/utils');
var YAML = require('js-yaml');
var chalk = require('chalk');

var builderUtils = require('swaggerize-routes/lib/utils');

var filesys = require('fs');
var store = memFs.create();
var fs = editor.create(store);

var path = require('path');
var process = require('process');

function loadApi(apiPath, content) {
    'use strict';
    if (apiPath.indexOf('.yaml') === apiPath.length - 5 ||
            apiPath.indexOf('.yml') === apiPath.length - 4) {
        /*jslint node: true, stupid: true */
        return YAML.load(content || this.fs.read(apiPath));
    }
    return content ? JSON.parse(content) : this.fs.readJSON(apiPath);
}

function methParamsFromSchema(schema) {
  var params = '';
  Object.keys(schema.properties).forEach(function(prop) {
    params += prop + ': ' + genUtils.getTypeFromSwaggerProperty(schema.properties[prop]);
    if (schema.required && schema.required.indexOf(prop) >= 0) {
      params += ', ';
    } else {
      params += '?, ';
    }
  });

  return params.substring(0, params.length -2);
}

function methPropertiesFromSchema(schema) {
  var properties = [];
  var property = '';
  Object.keys(schema.properties).forEach(function(prop) {
    property = {name: prop,
                type: genUtils.getTypeFromSwaggerProperty(schema.properties[prop]),
                required: ''
               }
    if (!schema.required || schema.required && schema.required.indexOf(prop) == -1) {
      property['required'] = '?';
    }
    properties.push(property);
  });

  return properties;
}

function parseSwagger(api) {
  // walk the api, extract the schemas from the definitions, the parameters and the responses.
  var resources = {}
  var refs = [];
  var basePath = api.basePath || undefined;

  Object.keys(api.paths).forEach(function(path) {
    var resource = genUtils.resourceNameFromPath(path);
    if (resource === "*") {
      // ignore a resource of '*' as a default route for this is set up in the template.
      return;
    }

    // for each path, walk the method verbs
    builderUtils.verbs.forEach(function(verb) {
      if (api.paths[path][verb]) {
       if (!resources[resource]) {
         resources[resource] = [];
       }

       // save the method and the path in the resources list.
       resources[resource].push({method: verb, route: genUtils.convertToSwiftParameterFormat(path)});
       // process the parameters
        if (api.paths[path][verb].parameters) {
          var parameters = api.paths[path][verb].parameters;

          parameters.forEach(function(parameter) {
            if (parameter.schema) {
              if (parameter.schema.$ref) {
                // handle the schema ref
                var ref = genUtils.getRefName(parameter.schema.$ref);
                refs[ref] = api.definitions[ref];
              } else if (parameter.schema.items) {
                // handle array of schema items
                if (parameter.schema.items.$ref) {
                  // handle the schema ref
                  refs[ref] = api.definitions[ref];
                }
              }
            }
          });
        }

        // process the responses. 200 and default are probably the only ones that make any sense.
        ['200', 'default'].forEach(function(responseType) {
          if (api.paths[path][verb].responses && api.paths[path][verb].responses[responseType]) {
            var responses = api.paths[path][verb].responses;
            if (responses[responseType] && responses[responseType].schema) {
              if (responses[responseType].schema.$ref) {
                // handle the schema ref
                var ref = genUtils.getRefName(responses[responseType].schema.$ref);
                refs[ref] = api.definitions[ref];
              } else if (responses[responseType].schema.type && responses[responseType].schema.type === 'array') {
                if (responses[responseType].schema.items && responses[responseType].schema.items.$ref) {
                  var ref = genUtils.getRefName(responses[responseType].schema.items.$ref);
                  refs[ref] = api.definitions[ref];
                  if (responses[responseType].schema.items) {
                    // handle array of schema items
                    if (responses[responseType].schema.items.$ref) {
                      // handle the schema ref
                      var ref = genUtils.getRefName(responses[responseType].schema.items.$ref);
                      refs[ref] = api.definitions[ref];
                    }
                  }
                }
              }
            }
          } 
        });
      }
    });
  });
 
  var foundNewRef;
  do {
    foundNewRef = false;
    // now parse the schemas for child references.
    Object.keys(refs).forEach(function(schema) {
      var properties = refs[schema].properties;
      Object.keys(properties).forEach(function(property) {
        if (properties[property].$ref) {
          // this property contains a definition reference.
          var name = genUtils.getRefName(properties[property].$ref);
          if (!refs[name]) {
            refs[name] = api.definitions[name];
            foundNewRef = true;
          }
        } else if (properties[property].items && properties[property].items.$ref) {
          // this property contains a definition reference.
          var name = genUtils.getRefName(properties[property].items.$ref);
          if (!refs[name]) {
            refs[name] = api.definitions[name];
            foundNewRef = true;
          }
        }
      });
    });
  } while (foundNewRef);

  var parsed = {basepath: basePath, resources: resources, refs: refs};
  return parsed;
}

function createRoutes(parsed) {
  var tPath = this.templatePath('fromswagger', 'Routes.swift.hbr');
  filesys.readFile(tPath, 'utf-8', function (err, data) {
    var template = handlebars.compile(data);
 
    Object.keys(parsed.resources).forEach(function(resource) {
      var sourceCode = template({resource: resource,
                                 routes: parsed.resources[resource],
                                 basepath: parsed.basepath});

      // write the source code to its file.
      var fileName = resource + 'Routes.swift';
      this.fs.write(this.destinationPath('Sources', this.applicationModule, 'Routes', fileName), sourceCode);
    }.bind(this));
  }.bind(this));
}

function parse(callback) {
  var httpPattern = new RegExp(/^https?:\/\/\S+/);
  if (httpPattern.test(this.fromSwagger)) {
    wreck.get(this.fromSwagger, function (err, res, payload) {
      if (err || (res && res.statusCode !== 200)) {
        this.env.error(chalk.red("failed to load swagger from:" + this.fromSwagger));
      }

      var loadedApi = loadApi.call(this, this.fromSwagger, payload);
      var parsedSwagger = parseSwagger(loadedApi);
      callback(loadedApi, parsedSwagger);
    }.bind(this));
  } else {
    var loadedApi = loadApi.call(this, this.fromSwagger);
    var parsedSwagger = parseSwagger(loadedApi);
    setImmediate(callback, loadedApi, parsedSwagger);
  }
}

module.exports = {createRoutes, parse};
