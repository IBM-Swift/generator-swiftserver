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
var enjoi = require('enjoi')
var apischema = require('swagger-schema-official/schema')
var builderUtils = require('swaggerize-routes/lib/utils')
var YAML = require('js-yaml')
var chalk = require('chalk')
var Promise = require('bluebird')
var request = require('request')
var requestAsync = Promise.promisify(request)

function loadHttpAsync (uri) {
  debug('in loadHttpAsync')

  return requestAsync({ method: 'GET', uri: uri })
    .catch(err => {
      debug('get request returned err:', err)
      throw new Error(chalk.red('failed to load swagger from:', uri, 'err:', err.message))
    })
    .then(result => {
      if (result.statusCode !== 200) {
        debug('get request returned status:', result.statusCode)
        throw new Error(chalk.red('failed to load swagger from:', uri, 'status:', result.statusCode))
      }
      return result.body
    })
}

function loadFileAsync (memfs, filePath) {
  debug('in loadFileAsync')

  return Promise.try(() => memfs.read(filePath))
    .catch(err => {
      // when file doesn't exist.
      debug('file does not exist', filePath)
      throw new Error(chalk.red('failed to load swagger from:', filePath, err.message))
    })
    .then(data => {
      if (data === undefined) {
        // when file exists but cannot read content.
        debug('cannot read file contents', filePath)
        throw new Error(chalk.red('failed to load swagger from:', filePath))
      }
      return data
    })
}

function loadAsync (memfs, path) {
  var isHttp = /^https?:\/\/\S+/.test(path)
  var isYaml = (path.endsWith('.yaml') || path.endsWith('.yml'))
  return (isHttp ? loadHttpAsync(path) : loadFileAsync(memfs, path))
    .then(data => isYaml ? YAML.load(data) : JSON.parse(data))
}

function ensureValid (api, apiPath) {
  debug('in ensureValid')

  // validate against the swagger schema.
  var error = enjoi(apischema).validate(api).error
  if (error) {
    throw new Error(chalk.red(apiPath, 'does not conform to swagger specification:\n', error))
  }
}

function parseSwagger (api) {
  debug('in parseSwagger')
  // walk the api, extract the schemas from the definitions, the parameters and the responses.
  var resources = {}
  var refs = []
  var basePath = api.basePath || undefined

  Object.keys(api.paths).forEach(function (path) {
    var resource = genUtils.resourceNameFromPath(path)
    if (resource === '*') {
      // ignore a resource of '*' as a default route for this is set up in the template.
      return
    }

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

  if (Object.keys(resources).length === 0) {
    throw new Error('no resources')
  }

  var parsed = {basepath: basePath, resources: resources, refs: refs}
  return parsed
}

exports.parse = function (memfs, swaggerPath) {
  debug('in parse')
  return loadAsync(memfs, swaggerPath)
    .then(loaded => {
      ensureValid(loaded, swaggerPath)
      debug('successfully validated against schema')
      return { loaded: loaded, parsed: parseSwagger(loaded) }
    })
}
