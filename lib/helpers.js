/*
 * Copyright IBM Corporation 2016-2017
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

var debug = require('debug')('generator-swiftserver:lib:helpers')
var format = require('util').format
var fs = require('fs')
var path = require('path')
var url = require('url')
var chalk = require('chalk')

// Keywords which are reserved in Swift (taken from the Language Reference)
var RESERVED_DECLARATION_KEYWORDS = [
  'associatedtype', 'class', 'deinit', 'enum', 'extension', 'fileprivate',
  'func', 'import', 'init', 'inout', 'internal', 'let', 'open', 'operator',
  'private', 'protocol', 'public', 'static', 'struct', 'subscript', 'typealias',
  'var'
]

var RESERVED_STATEMENT_KEYWORDS = [
  'break', 'case', 'continue', 'default', 'defer', 'do', 'else', 'fallthrough',
  'for', 'guard', 'if', 'in', 'repeat', 'return', 'switch', 'where', 'while'
]

var RESERVED_EXPRESSIONS_TYPES_KEYWORDS = [
  'as', 'Any', 'catch', 'false', 'is', 'nil', 'rethrows', 'super', 'self',
  'Self', 'throw', 'throws', 'true', 'try'
]

var RESERVED_CONTEXT_SPECIFIC_KEYWORDS = [
  'associativity', 'convenience', 'dynamic', 'didSet', 'final', 'get', 'infix',
  'indirect', 'lazy', 'left', 'mutating', 'none', 'nonmutating', 'optional',
  'override', 'postfix', 'precedence', 'prefix', 'Protocol', 'required',
  'right', 'set', 'Type', 'unowned', 'weak', 'willSet'
]

/**
 * Validate a directory name. Empty name will not pass.
 * @param {String} name - The user input for directory name.
 * @returns {String|Boolean} - Returns error string for invalid name, true for valid name.
 */
exports.validateDirName = function (name) {
  if (!name) {
    return 'Name is required'
  }
  return validateValue(name, /[/@\s+%:]/)
}

exports.validateRequiredCredential = function (name) {
  if (!name) {
    return 'Credential is required'
  }
  return true
}

exports.validatePort = function (port) {
  if (port === '') {
    return true
  }
  port = parseInt(port, 10)
  if (isNaN(port)) {
    return 'Port is not a number'
  }
  return true
}

/**
 * Validate a path, permit paths starting with 'filename' or '/' or './' or '../' or 'http://' or 'https://'. Empty path will not pass.
 * @param {String} path - The user input for a file path either local or remote.
 * @returns {String|Boolean} - Returns error string for invalid path, true for valid path.
 */
exports.validateFilePathOrURL = function (filePathOrURL, relativeToDir) {
  if (!filePathOrURL) {
    return 'Path is required'
  }

  // ensure file actually exists if using local file path
  var localMatch = /^\w+|^\/|^\.\.?\//.test(filePathOrURL)
  var remoteMatch = /^https?:\/\/\S+/.test(filePathOrURL)
  if (localMatch && remoteMatch) {
    return true
  } else if (localMatch && !remoteMatch) {
    var filePath = filePathOrURL
    // if file path is relative resolve it against relativeToDir
    // or the current working directory if relativeToDir is falsy
    if (!path.isAbsolute(filePathOrURL)) {
      filePath = path.resolve(relativeToDir || '', filePathOrURL)
    }
    return fs.existsSync(filePath) ? true : format('The following path does not exist: %s', path)
  }
  return format('The following is not a valid path: %s', filePathOrURL)
}

/**
 * Validate the application (module) name.
 * @param {String} name - The user input for application name.
 * @returns {String|Boolean} - Returns error string for invalid name, true for valid name.
 */
exports.validateAppName = function (name) {
  if (name.charAt(0) === '.') {
    return format('Application name cannot start with .: %s', name)
  }
  if (name.toLowerCase() === 'node_modules') {
    return format('Application name cannot be {node_modules}')
  }
  if (name.toLowerCase() === 'favicon.ico') {
    return format('Application name cannot be {favicon.ico}')
  }
  return validateValue(name, /[/@\s+%:]/)
}

/**
 * Sanitize problematic characters from application name
 * to make a clean version of the name for use as a token
 * in templates.
 * @param {String} name - application name
 * @returns {string} - Returns a sanitized application name
 * with some problematic characters removed
 */
exports.sanitizeAppName = function (name) {
  var cleanName = name.replace(/^[^a-zA-Z]*/, '')
                      .replace(/[^a-zA-Z0-9]/g, '')
  return cleanName || 'SWIFTSERVERAPP'
}

/**
 * Validate property name.
 * @param {String} name - The user input.
 * @returns {String|Boolean} - Returns error string for invalid name, true
 * for valid name.
 */
exports.validatePropertyName = function (name) {
  var result = exports.validateRequiredName(name)
  if (result !== true) return result
  // Enforce first character restrictions
  var allowedFirstChar = /[a-zA-Z_]/
  if (!name.charAt(0).match(allowedFirstChar)) {
    return format('The first character in the property name must match %s',
      allowedFirstChar)
  }
  // Enforce word characters
  if (!name.match(/^[\w]+$/)) {
    return format('The property name %s can only contain alphanumeric characters.',
      name)
  }
  // Check for reserved words
  if ((RESERVED_DECLARATION_KEYWORDS.indexOf(name) !== -1) ||
     (RESERVED_STATEMENT_KEYWORDS.indexOf(name) !== -1) ||
     (RESERVED_EXPRESSIONS_TYPES_KEYWORDS.indexOf(name) !== -1) ||
     (RESERVED_CONTEXT_SPECIFIC_KEYWORDS.indexOf(name) !== -1)) {
    return format('%s is a reserved keyword. Please use another name.', name)
  }
  return true
}

/**
 * Convert the model name to a valid Swift classname (if required).
 * @param {String} name - The model name.
 * @returns {String} classname - Returns a valid Swift classname.
 */
exports.convertModelNametoSwiftClassname = function (name) {
  /*
   * 1. Enforce first character restrictions in Swift classname
   * 2. Enforce word characters in Swift classname
   * In cases 1 and 2 convert characters which are not allowed to _
   * 3. If the first character in the classname is lowercase alphabetic
   * change it to uppercase in accordance with Swift classname conventions
   * 4. Check for reserved Swift keywords, if any are found add zero to the
   * end of the name to prevent compiler failures.
   */
  var classname = name.replace(/^[^a-zA-Z_]/, '_')
                      .replace(/\W/g, '_')
                      .replace(/^[a-z]/, (m) => m.toUpperCase())

  if ((RESERVED_DECLARATION_KEYWORDS.indexOf(classname) !== -1) ||
      (RESERVED_STATEMENT_KEYWORDS.indexOf(classname) !== -1) ||
      (RESERVED_EXPRESSIONS_TYPES_KEYWORDS.indexOf(classname) !== -1) ||
      (RESERVED_CONTEXT_SPECIFIC_KEYWORDS.indexOf(classname) !== -1)) {
    classname = classname + '0'
  }
  debug("using classname '%s' for model '%s'", classname, name)

  return classname
}

/**
 * Validate a required name (an empty name will not pass).
 * @param {String} name - The user input.
 * @returns {String|Boolean} - Returns error string for invalid name, true for valid name.
 */
exports.validateRequiredName = function (name) {
  if (!name) {
    return format('Name is required.')
  }
  return validateValue(name, /[/@\s+%:.]/)
}

/*
 *
 * Checks if we already have a model of the same name
 * @ param {String} name - The name of the model that should be unique
 * @ returns {String|Boolean} - Returns an error message for invalid name, returns true for valid name
 *
 */
exports.validateNewModel = function (name) {
  var valid = exports.validateRequiredName(name)
  if (valid !== true) { return valid }

  if (fs.existsSync(path.join('models', name + '.json'))) {
    debug('attempting to modify the existing model: ', name)
    return name + ' model already exists,' +
     ' use the property generator to modify the model'
  }
  return true
}

/*
 * Validate a value.
 * @param {String} name - The user input.
 * @param {String} unallowedCharacters - Characters that won't be accepted as input (in regex format).
 * @returns {String|Boolean} - Returns error string for invalid name, true for valid name.
 */
function validateValue (name, unallowedCharacters) {
  if (!unallowedCharacters) {
    unallowedCharacters = /[/@\s+%:.]/
  }
  if (name.match(unallowedCharacters)) {
    return format('The name %s cannot contain special characters (regex %s)',
      name, unallowedCharacters)
  }
  if (name !== encodeURIComponent(name)) {
    return format('The name %s cannot contain special characters escaped by ' +
      'encodeURIComponent', name)
  }
  return true
}

/*
 * Validate that a default value is of the specified type.
 * @param {String} type - The property type name to check against.
 * @param {String} value - The default value the user supplied.
 * @returns {String|Boolean} - Returns error string for invalid value, true for valid value.
 */
exports.validateDefaultValue = function (type, value) {
  switch (type) {
    case 'string': return true

    case 'number':
      return /^-?\d+(\.\d+)?$/.test(value) ? true : 'Value must be numeric' // TODO: Check this regexp

    case 'boolean':
      return (value === 'true' || value === 'false') ? true : 'Value must be true or false'

    case 'object':
      try {
        var jsonObj = JSON.parse(value)
        if (typeof jsonObj === 'object') {
          return true
        }
      } catch (_) {
        // ignore
      }
      return 'Value must be a valid JSON object'

    case 'array':
      try {
        var jsonArr = JSON.parse(value)
        if (Array.isArray(jsonArr)) {
          return true
        }
      } catch (_) {
        // ignore
      }
      return 'Value must be a valid JSON array'

    default:
      // Ideally we should not get here, this should be caught earlier in the process
      return "You cannot specify a default value for a property of type '" + type + "'"
  }
}

/*
 * Convert a default value from String to the specified type.
 * Assumes the value has already been checked for validity with validateDefaultValue().
 * @param {String} type - The property type name that the value should be converted to.
 * @param {String} value - The (already validated) default value the user supplied.
 * @returns {String|Boolean} - Returns the converted value.
 * @throws Will throw if the type provided is not in the list of recognized types.
 *   This is an internal error and should only occur in the case of a bug.
 */
exports.convertDefaultValue = function (type, value) {
  switch (type) {
    case 'string': return value
    case 'number': return parseFloat(value)
    case 'boolean': return (value === 'true')
    case 'object': return JSON.parse(value)
    case 'array': return JSON.parse(value)
    default: throw new Error("Unrecognised type '" + type + "'")
  }
}

exports.convertJSDefaultValueToSwift = function (value) {
  switch (typeof (value)) {
    case 'string': return `"${value}"`
    case 'number': return value.toString()
    case 'boolean': return value.toString()
    case 'object':
      // NOTE(tunniclm): `value` should not contain any circular references
      // because it was originally JSON. These recursive calls will never
      // terminate if `value` contains circular references.
      if (Array.isArray(value)) {
        return '[' + value.map((element) => exports.convertJSDefaultValueToSwift(element)).join(', ') + ']'
      } else {
        return '[' + Object.keys(value).reduce((memo, key) => memo.concat(`"${key}": ` + exports.convertJSDefaultValueToSwift(value[key])), []).join(', ') + ']'
      }
    default: throw new Error("Unrecognised type '" + typeof (value) + "'")
  }
}

exports.convertJSTypeToSwift = function (jsType, optional) {
  var result
  switch (jsType) {
    case 'string': result = 'String'; break
    case 'number': result = 'Double'; break
    case 'boolean': result = 'Bool'; break
    case 'object': result = 'Any'; break
    case 'array': result = '[Any]'; break
    default: throw new Error("Unrecognised type '" + jsType + "'")
  }
  if (optional === true) {
    result = result + '?'
  }
  return result
}

exports.generateServiceName = function (appName, serviceType) {
  function randomToken (length) {
    var alphas = 'abcdefghijklmnopqrstuvwxyz'
    var digits = '1234567890'
    var result = ''
    for (var i = 0; i < length; i++) {
      if (i % 2 === 0) {
        result += alphas[Math.floor(Math.random() * alphas.length)]
      } else {
        result += digits[Math.floor(Math.random() * digits.length)]
      }
    }
    return result
  }
  var token = randomToken(4)
  return `${appName}-${serviceType}-${token}`
}

function sanitizeCredentialsAndFillInDefaults (serviceType, service) {
  switch (serviceType) {
    case 'cloudant':
      var defaults = {
        url: { protocol: 'http', hostname: 'localhost', port: 5984 },
        host: 'localhost',
        port: 5984,
        username: '',
        password: '',
        secured: false
      }
      if (service.url) {
        var parsedURL = url.parse(service.url)
        if (parsedURL.host) defaults.host = parsedURL.hostname
        if (parsedURL.port) defaults.port = parsedURL.port
        if (parsedURL.auth) {
          var auth = parsedURL.auth.split(':')
          if (auth[0]) defaults.username = auth[0]
          if (auth[1]) defaults.password = auth[1]
        }
        if (parsedURL.protocol) {
          defaults.secured = (parsedURL.protocol === 'https')
        }
      }
      if (service.host) defaults.url.hostname = service.host
      if (service.port) defaults.url.port = service.port
      if (service.secured) defaults.url.protocol = 'https'
      if (service.username || service.password) {
        defaults.url.auth = [
          service.username,
          service.password
        ].join(':')
      }
      return {
        host: service.host || defaults.host,
        url: service.url || url.format(defaults.url),
        username: service.username || defaults.username,
        password: service.password || defaults.password,
        secured: service.secured || defaults.secured,
        port: service.port || defaults.port
      }
    case 'redis':
      var defaultRedisURI = { protocol: 'redis', auth: ':', hostname: 'localhost', port: 6379, slashes: true }
      if (service.host) defaultRedisURI.hostname = service.host
      if (service.port) defaultRedisURI.port = service.port
      if (service.password) defaultRedisURI.auth = `:${service.password}`
      return {
        uri: service.uri || url.format(defaultRedisURI)
      }
    case 'mongodb':
      var defaultMongoURI = { protocol: 'mongodb', hostname: 'localhost', port: 27017, slashes: true }
      if (service.host) defaultMongoURI.hostname = service.host
      if (service.port) defaultMongoURI.port = service.port
      if (service.password) defaultMongoURI.auth = `:${service.password}`
      if (service.database) defaultMongoURI.pathname = service.database
      return {
        uri: service.uri || url.format(defaultMongoURI)
      }
    case 'postgresql':
      var defaultPostgresURI = { protocol: 'postgres', hostname: 'localhost', port: 5432, slashes: true }
      if (service.host) defaultPostgresURI.hostname = service.host
      if (service.port) defaultPostgresURI.port = service.port
      if (service.username || service.password) {
        defaultPostgresURI.auth = [
          service.username,
          service.password
        ].join(':')
      }
      if (service.database) defaultPostgresURI.pathname = service.database
      return {
        uri: service.uri || url.format(defaultPostgresURI)
      }
    case 'objectStorage':
      var defaultAuthURL = 'https://identity.open.softlayer.com'
      return {
        auth_url: service.auth_url || defaultAuthURL,
        project: service.project || '',
        projectId: service.projectId || '',
        region: service.region || '',
        userId: service.userId || '',
        username: service.username || '',
        password: service.password || '',
        domainId: service.domainId || '',
        domainName: service.domainName || '',
        role: service.role || ''
      }
    case 'auth':
      return {
        clientId: service.clientId || '',
        oauthServerUrl: service.oauthServerUrl || '',
        profilesUrl: service.profilesUrl || '',
        secret: service.secret || '',
        tenantId: service.tenantId || ''
      }
    case 'conversation':
      var defaultConversationURL = 'https://gateway.watsonplatform.net/conversation/api'
      return {
        url: service.url || defaultConversationURL,
        username: service.username || '',
        password: service.password || ''
      }
    case 'alertNotification':
      return {
        url: service.url || '',
        name: service.name || '',
        password: service.password || ''
      }
    case 'push':
      return {
        appGuid: service.appGuid || '',
        url: service.url || '',
        admin_url: service.admin_url || '',
        appSecret: service.appSecret || '',
        clientSecret: service.clientSecret || ''
      }
    case 'autoscaling':
      return {}
    default:
      return {}
  }
};

exports.sanitizeServiceAndFillInDefaults = function (serviceType, service) {
  var credentials = sanitizeCredentialsAndFillInDefaults(serviceType, service)
  var serviceInfo = {
    serviceInfo: {
      name: service.serviceInfo.name,
      label: service.serviceInfo.label || exports.getBluemixServiceLabel(serviceType),
      plan: service.serviceInfo.plan || exports.getBluemixDefaultPlan(serviceType)
    }
  }
  return Object.assign(credentials, serviceInfo)
}

exports.getBluemixServiceLabel = function (serviceType) {
  switch (serviceType) {
    case 'cloudant': return 'cloudantNoSQLDB'
    case 'redis': return 'compose-for-redis'
    case 'mongodb': return 'compose-for-mongodb'
    case 'postgresql': return 'compose-for-postgresql'
    case 'objectStorage': return 'Object-Storage'
    case 'auth': return 'AppID'
    case 'conversation': return 'conversation'
    case 'alertNotification': return 'AlertNotification'
    case 'push': return 'imfpush'
    case 'autoscaling': return 'Auto-Scaling'
    default: return serviceType
  }
}

exports.getBluemixDefaultPlan = function (serviceType) {
  switch (serviceType) {
    case 'cloudant': return 'Lite'
    case 'redis': return 'Standard'
    case 'mongodb': return 'Standard'
    case 'postgresql': return 'Standard'
    case 'objectStorage': return 'Free'
    case 'auth': return 'Graduated tier'
    case 'conversation': return 'free'
    case 'alertNotification': return 'authorizedusers'
    case 'push': return 'lite'
    case 'autoscaling': return 'free'
    default: return 'Lite'
  }
}

// take a swagger path and convert the parameters to Swift Kitura format.
// i.e. convert "/path/to/{param1}/{param2}" to "/path/to/:param1/:param2"
exports.reformatPathToSwiftKitura = (path) => path.replace(/{/g, ':').replace(/}/g, '')

exports.resourceNameFromPath = function (thepath) {
  // grab the first valid element of a path (or partial path) and return it capitalized.
  var resource = thepath.match(/^\/*([^/]+)/)[1]
  return resource.charAt(0).toUpperCase() + resource.slice(1)
}

exports.getRefName = function (ref) {
  return ref.split('/').pop()
}

exports.capitalizeFirstLetter = function (toBeCapitalized) {
  // capitalize the first letter
  return toBeCapitalized.charAt(0).toUpperCase() + toBeCapitalized.slice(1)
}

exports.arrayContains = function (search, array) {
  return array.indexOf(search) > -1
}

exports.swiftTypeFromSwaggerProperty = function (property) {
  // return a Swift type based on a swagger type and format.
  var swaggerPropertyTypes = [
    'boolean',
    'integer',
    'number',
    'string'
  ]

  var swaggerToSwiftInt = {
    'int8': 'Int8',
    'uint8': 'UInt8',
    'int16': 'Int16',
    'uint16': 'UInt16',
    'int32': 'Int32',
    'uint32': 'UInt32',
    'int64': 'Int64',
    'uint64': 'UInt64'
  }

  var swaggerToSwift = {
    boolean: 'Bool',
    integer: 'Int',
    number: 'Double',
    string: 'String',
    object: 'Dictionary<String, JSONValue>'
  }

  var format
  var array
  var mappingType
  var swiftType

  if (property.type) {
    if (exports.arrayContains(property.type, swaggerPropertyTypes)) {
      swiftType = swaggerToSwift[property.type]
      format = property.format || undefined
    } else if (property.type === 'ref' && property.$ref) {
      swiftType = exports.getRefName(property.$ref)
      format = undefined
    } else if (property.type === 'object') {
      if (property.additionalProperties && property.additionalProperties.type) {
        swiftType = swaggerToSwift[property.additionalProperties.type]
        format = property.additionalProperties.format || undefined
        mappingType = true
      }
    } else if (property.type === 'array') {
      if (property.items.$ref) {
        // has a ref type, so set the swagger type to that.
        swiftType = exports.getRefName(property.items.$ref)
      } else if (property.items && property.items.type) {
        swiftType = swaggerToSwift[property.items['type']]
        format = property.items['format'] || undefined
      }
      array = true
    }
  }

  // now check if the property has a format modifier and apply that if appropriate.
  if (format) {
    // a format modifier exists, so convert the swagger type if appropriate.
    if (swiftType === 'Int') {
      swiftType = swaggerToSwiftInt[format]
    }

    if (swiftType === 'Double' && format === 'float') {
      swiftType = 'Float'
    }
  }

  if (mappingType) {
    swiftType = 'Dictionary<String, ' + swiftType + '>'
  }

  if (array) {
    swiftType = '[' + swiftType + ']'
  }
  return swiftType
}

exports.isThisServiceAnArray = function (serviceType) {
  return (serviceType === 'cloudant' || serviceType === 'objectStorage')
}

exports.validateServiceFields = function (serviceType, service) {
  if (!service.serviceInfo.name) {
    throw new Error(chalk.red(`Service name is missing in spec for bluemix.${serviceType}`))
  }
  if (typeof (service.serviceInfo.name) !== 'string') {
    throw new Error(chalk.red(`Ensure Type of Service name in spec for bluemix.${serviceType}`))
  }
}
