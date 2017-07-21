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
var debug = require('debug')('generator-swiftserver:refresh:fromSwagger:swaggerize')
var genUtils = require('./generatorUtils')
var SwaggerParser = require('swagger-parser')
var builderUtils = require('swaggerize-routes/lib/utils')
var chalk = require('chalk')

function ensureValidAsync (loadedSwagger) {
  debug('in ensureValidAsync')
  return SwaggerParser.validate(loadedSwagger)
    .catch(function (err) {
      debug(err)
      throw new Error(chalk.red('does not conform to swagger specification'))
    })
}

function parseSwagger (api) {
  debug('in parseSwagger')
  // walk the api, extract the schemas from the definitions, the parameters and the responses.
  var resources = {}
  var refs = []
  var basePath = api.basePath || undefined

  Object.keys(api.paths).forEach(function (path) {
    var resource = genUtils.resourceNameFromPath(path)

    debug('path:', path, 'becomes resource:', resource)
    // for each path, walk the method verbs
    builderUtils.verbs.forEach(function (verb) {
      if (api.paths[path][verb]) {
        if (!resources[resource]) {
          resources[resource] = []
        }

        debug('parsing verb:', verb)
        // save the method and the path in the resources list.
        resources[resource].push({method: verb, route: genUtils.convertToSwiftParameterFormat(path)})
        // process the parameters
        if (api.paths[path][verb].parameters) {
          var parameters = api.paths[path][verb].parameters

          parameters.forEach(function (parameter) {
            if (parameter.schema) {
              if (parameter.schema.$ref) {
                // handle the schema ref
                var ref = genUtils.getRefName(parameter.schema.$ref)
                refs[ref] = api.definitions[ref]
              } else if (parameter.schema.items) {
                // handle array of schema items
                if (parameter.schema.items.$ref) {
                  // handle the schema ref
                  refs[ref] = api.definitions[ref]
                }
              }
            }
          })
        }

        // process the responses. 200 and default are probably the only ones that make any sense.
        ['200', 'default'].forEach(function (responseType) {
          if (api.paths[path][verb].responses && api.paths[path][verb].responses[responseType]) {
            var responses = api.paths[path][verb].responses
            if (responses[responseType] && responses[responseType].schema) {
              var ref
              if (responses[responseType].schema.$ref) {
                // handle the schema ref
                ref = genUtils.getRefName(responses[responseType].schema.$ref)
                refs[ref] = api.definitions[ref]
              } else if (responses[responseType].schema.type && responses[responseType].schema.type === 'array') {
                if (responses[responseType].schema.items && responses[responseType].schema.items.$ref) {
                  ref = genUtils.getRefName(responses[responseType].schema.items.$ref)
                  refs[ref] = api.definitions[ref]
                  if (responses[responseType].schema.items) {
                    // handle array of schema items
                    if (responses[responseType].schema.items.$ref) {
                      // handle the schema ref
                      ref = genUtils.getRefName(responses[responseType].schema.items.$ref)
                      refs[ref] = api.definitions[ref]
                    }
                  }
                }
              }
            }
          }
        })
      }
    })
  })

  var foundNewRef
  do {
    foundNewRef = false
    // now parse the schemas for child references.
    Object.keys(refs).forEach(function (schema) {
      if (refs[schema] && refs[schema].properties) {
        var properties = refs[schema].properties
        Object.keys(properties).forEach(function (property) {
          var name
          if (properties[property].$ref) {
            // this property contains a definition reference.
            name = genUtils.getRefName(properties[property].$ref)
            if (!refs[name]) {
              refs[name] = api.definitions[name]
              foundNewRef = true
            }
          } else if (properties[property].items && properties[property].items.$ref) {
            // this property contains a definition reference.
            name = genUtils.getRefName(properties[property].items.$ref)
            if (!refs[name]) {
              refs[name] = api.definitions[name]
              foundNewRef = true
            }
          }
        })
      }
    })
  } while (foundNewRef)

  var parsed = {basepath: basePath, resources: resources, refs: refs}
  return parsed
}

exports.parse = function (swaggerStr) {
  debug('in parse')
  var loaded = JSON.parse(swaggerStr)
  return ensureValidAsync(loaded)
    .then(function () {
      debug('successfully validated against schema')
      // restore the original swagger as the call to ensureValidAsync modifies the original loaded object.
      loaded = JSON.parse(swaggerStr)
      return { loaded: loaded, parsed: parseSwagger(loaded) }
    })
}
