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
var debug = require('debug')('refresh/fromSwagger/swaggerize');
var util = require('util');
var genUtils = require('./generatorUtils');
var handlebars = require('handlebars');
var wreck = require('wreck');
var enjoi = require('enjoi');
var apischema = require('swagger-schema-official/schema');
var builderUtils = require('swaggerize-routes/lib/utils');
var YAML = require('js-yaml');
var chalk = require('chalk');

var builderUtils = require('swaggerize-routes/lib/utils');

var filesys = require('fs');

var path = require('path');
var process = require('process');

function loadApi(apiPath, content) {
  debug('in loadApi');
  // load from YAML or JSON file into a JS object.
  'use strict';
  if (apiPath.indexOf('.yaml') === apiPath.length - 5 || apiPath.indexOf('.yml') === apiPath.length - 4) {
    /*jslint node: true, stupid: true */
    debug('loading YAML');
    return YAML.load(content || this.fs.read(apiPath));
  }
  debug('loading JSON');
  return content ? JSON.parse(content) : this.fs.readJSON(apiPath);
}

function validate(api) {
  debug('in validate');
  // validate against the swagger schema.
  'use strict';
  enjoi(apischema).validate(api, function (error, value) {
    if (error) {
      this.env.error(chalk.red(this.fromSwagger, 'does not conform to swagger specification:\n', error));
    }
  }.bind(this));
}

function parseSwagger(api) {
  debug('in parseSwagger');
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

    debug('path:', path, 'becomes resource:', resource);
    // for each path, walk the method verbs
    builderUtils.verbs.forEach(function(verb) {
      if (api.paths[path][verb]) {
        if (!resources[resource]) {
          resources[resource] = [];
        } 

        debug('parsing verb:', verb);
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
      if (refs[schema] && refs[schema].properties) {
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
      }
    });
  } while (foundNewRef);

  if (Object.keys(resources).length === 0) {
    this.env.error("no resources");
  }

  var parsed = {basepath: basePath, resources: resources, refs: refs};
  return parsed;
}

function createRoutes(parsed) {
  debug('in createRoutes');
  var tPath = this.templatePath('fromswagger', 'Routes.swift.hbs');
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
  debug('in parse');
  var httpPattern = new RegExp(/^https?:\/\/\S+/);
  var loadedApi;
  if (httpPattern.test(this.fromSwagger)) {
    // handle the swagger loading from a URL.
    debug('loading swagger from url:', this.fromSwagger);
    wreck.get(this.fromSwagger, function (err, res, payload) {
      if (err || (res && res.statusCode !== 200)) {
        debug('get request returned status:', res.statusCode);
        this.env.error(chalk.red('failed to load swagger from:', this.fromSwagger, 'status:', res.statusCode));
      }
      try {
        loadedApi = loadApi.call(this, this.fromSwagger, payload);
      } catch (e) {
        debug('cannot read file contents', this.fromSwagger);
        this.env.error(chalk.red('failed to load swagger from:', this.fromSwagger, e));
      }
      validate.call(this, loadedApi);
      debug('successfully validated against schema');
      try {
        callback(loadedApi, parseSwagger.call(this, loadedApi));
      } catch (e) {
        this.env.error(chalk.red('failed to parse swagger from:', this.fromSwagger, e));
      }
    }.bind(this));
  } else {
    // handle the swagger loading from a file.
    debug('loading swagger from file:', this.fromSwagger);
    try {
      loadedApi = loadApi.call(this, this.fromSwagger);
      if (loadedApi === undefined) {
        // when file exists but cannot read content.
        debug('cannot read file contents', this.fromSwagger);
        this.env.error(chalk.red('failed to load swagger from:', this.fromSwagger));
      }
    } catch (e) {
      // when file doesn't exist.
      debug('file does not exist', this.fromSwagger);
      this.env.error(chalk.red('failed to load swagger from:', this.fromSwagger, e));
    }
    validate.call(this, loadedApi);
    debug('successfully validated against schema');
    try {
      setImmediate(callback, loadedApi, parseSwagger.call(this, loadedApi));
    } catch (e) {
      this.env.error(chalk.red('failed to parse swagger from:', this.fromSwagger, e));
    }
  }
}

module.exports = {createRoutes, parse};
