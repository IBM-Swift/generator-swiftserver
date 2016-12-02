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

var yeoman = require('yeoman-generator');
var format = require('util').format;
var debug = require('debug')('generator-swiftserver:common');

// Keywords which are reserved in Swift (taken from the Language Reference)
var RESERVED_DECLARATION_KEYWORDS = [
  'associatedtype', 'class', 'deinit', 'enum', 'extension', 'fileprivate',
  'func', 'import', 'init', 'inout', 'internal', 'let', 'open', 'operator',
  'private', 'protocol', 'public', 'static', 'struct', 'subscript', 'typealias',
   'var'
 ];

var RESERVED_STATEMENT_KEYWORDS = [
  'break', 'case', 'continue', 'default', 'defer', 'do', 'else', 'fallthrough',
  'for', 'guard', 'if', 'in', 'repeat', 'return', 'switch', 'where', 'while'
 ];

var RESERVED_EXPRESSIONS_TYPES_KEYWORDS = [
  'as', 'Any', 'catch', 'false', 'is', 'nil', 'rethrows', 'super', 'self',
  'Self', 'throw', 'throws', 'true', 'try'
 ];

var RESERVED_CONTEXT_SPECIFIC_KEYWORDS = [
  'associativity', 'convenience', 'dynamic', 'didSet', 'final', 'get', 'infix',
  'indirect', 'lazy', 'left', 'mutating', 'none', 'nonmutating', 'optional',
  'override', 'postfix', 'precedence', 'prefix', 'Protocol', 'required',
  'right', 'set', 'Type', 'unowned', 'weak', 'willSet'
 ];

/**
 * Validate a directory name. Empty name will not pass.
 * @param {String} name - The user input for directory name.
 * @returns {String|Boolean} - Returns error string for invalid name, true for valid name.
 */
exports.validateDirName = function(name) {
  if (!name) {
    return 'Name is required';
  }
  return validateValue(name, /[\/@\s\+%:]/);
};

exports.validateRequiredCredential = function(name) {
  if (!name) {
    return 'Credential is required';
  }
  return true;
};

exports.validatePort = function(port) {
  port = parseInt(port, 10);
  if(isNaN(port)) {
    return 'Port is not a number';
  }
  return true;
}

/**
 * Validate the application (module) name.
 * @param {String} name - The user input for application name.
 * @returns {String|Boolean} - Returns error string for invalid name, true for valid name.
 */
exports.validateAppName = function(name) {
  if (name.charAt(0) === '.') {
    return format('Application name cannot start with .: %s', name);
  }
  if (name.toLowerCase() === 'node_modules') {
    return format('Application name cannot be {node_modules}');
  }
  if (name.toLowerCase() === 'favicon.ico') {
    return format('Application name cannot be {favicon.ico}');
  }
  return validateValue(name, /[\/@\s\+%:]/);
};

/**
 * Validate property name.
 * @param {String} name - The user input.
 * @returns {String|Boolean} - Returns error string for invalid name, true
 * for valid name.
 */
exports.validatePropertyName = function(name) {
  var result = exports.validateRequiredName(name);
  if (result !== true) return result;
  // Enforce first character restrictions
  var allowedFirstChar = /[a-zA-Z_]/;
  if (!name.charAt(0).match(allowedFirstChar)) {
    return format('The first character in the property name must match %s',
      allowedFirstChar);
  }
  // Enforce word characters
  if (!name.match(/^[\w]+$/)) {
    return format('The property name %s can only contain alphanumeric characters.',
      name);
  }
  // Check for reserved words
  if ((RESERVED_DECLARATION_KEYWORDS.indexOf(name) !== -1) ||
     (RESERVED_STATEMENT_KEYWORDS.indexOf(name) !== -1) ||
     (RESERVED_EXPRESSIONS_TYPES_KEYWORDS.indexOf(name) !== -1) ||
     (RESERVED_CONTEXT_SPECIFIC_KEYWORDS.indexOf(name) !== -1)) {
    return format('%s is a reserved keyword. Please use another name.', name);
  }
  return true;
};

/**
 * Convert the model name to a valid Swift classname (if required).
 * @param {String} name - The model name.
 * @returns {String} classname - Returns a valid Swift classname.
 */
exports.convertModelNametoSwiftClassname = function(name) {
  /*
   * 1. Enforce first character restrictions in Swift classname
   * 2. Enforce word characters in Swift classname
   * In cases 1 and 2 convert characters which are not allowed to _
   * 3. If the first character in the classname is lowercase alphabetic
   * change it to uppercase in accordance with Swift classname conventions
   * 4. Check for reserved Swift keywords, if any are found add zero to the
   * end of the name to prevent compiler failures.
   */
  var classname = name.replace(/^[^a-zA-Z_]/, "_")
                      .replace(/\W/g, "_")
                      .replace(/^[a-z]/, (m) => m.toUpperCase());

  if ((RESERVED_DECLARATION_KEYWORDS.indexOf(classname) !== -1) ||
      (RESERVED_STATEMENT_KEYWORDS.indexOf(classname) !== -1) ||
      (RESERVED_EXPRESSIONS_TYPES_KEYWORDS.indexOf(classname) !== -1) ||
      (RESERVED_CONTEXT_SPECIFIC_KEYWORDS.indexOf(classname) !== -1)) {
    classname = classname + '0';
  }
  debug("using classname '%s' for model '%s'", classname, name);

  return classname;
}

/**
 * Validate a required name (an empty name will not pass).
 * @param {String} name - The user input.
 * @returns {String|Boolean} - Returns error string for invalid name, true for valid name.
 */
exports.validateRequiredName = function(name) {
  if (!name) {
    return format('Name is required.');
  }
  return validateValue(name, /[\/@\s\+%:\.]/);
};

/*
 * Validate a value.
 * @param {String} name - The user input.
 * @param {String} unallowedCharacters - Characters that won't be accepted as input (in regex format).
 * @returns {String|Boolean} - Returns error string for invalid name, true for valid name.
 */
function validateValue(name, unallowedCharacters) {
  if (!unallowedCharacters) {
    unallowedCharacters = /[\/@\s\+%:.]/;
  }
  if (name.match(unallowedCharacters)) {
    return format('The name %s cannot contain special characters (regex %s)',
      name, unallowedCharacters);
  }
  if (name !== encodeURIComponent(name)) {
    return format('The name %s cannot contain special characters escaped by ' +
      'encodeURIComponent', name);
  }
  return true;
}

/*
 * Validate that a default value is of the specified type.
 * @param {String} type - The property type name to check against.
 * @param {String} value - The default value the user supplied.
 * @returns {String|Boolean} - Returns error string for invalid value, true for valid value.
 */
exports.validateDefaultValue = function(type, value) {
  switch (type) {
    case 'string': return true;

    case 'number':
      return /^-?\d+(\.\d+)?$/.test(value) ? true : 'Value must be numeric'; // TODO: Check this regexp

    case 'boolean':
      return (value === 'true' || value === 'false') ? true : 'Value must be true or false';

    case 'object':
      try {
        var json = JSON.parse(value);
        if (typeof json == 'object') {
          return true;
        }
      } catch (_) {
        // ignore
      }
      return 'Value must be a valid JSON object';

    case 'array':
      try {
        var json = JSON.parse(value);
        if (Array.isArray(json)) {
           return true;
        }
      } catch (_) {
        // ignore
      }
      return 'Value must be a valid JSON array';

    default:
      // Ideally we should not get here, this should be caught earlier in the process
      return "You cannot specify a default value for a property of type '" + type + "'";
  }
};

/*
 * Convert a default value from String to the specified type.
 * Assumes the value has already been checked for validity with validateDefaultValue().
 * @param {String} type - The property type name that the value should be converted to.
 * @param {String} value - The (already validated) default value the user supplied.
 * @returns {String|Boolean} - Returns the converted value.
 * @throws Will throw if the type provided is not in the list of recognized types.
 *   This is an internal error and should only occur in the case of a bug.
 */
exports.convertDefaultValue = function(type, value) {
  switch (type) {
    case 'string': return value;
    case 'number': return parseFloat(value);
    case 'boolean': return (value === 'true');
    case 'object': return JSON.parse(value);
    case 'array': return JSON.parse(value);
    default: throw new Error("Unrecognised type '" + type + "'");
  }
};

// TODO(tunniclm): Move this to a yeoman template?
exports.generatePackageSwift = function(config) {
  var targets = `targets: [
        Target(name: "${config.appName}", dependencies: [ .Target(name: "Generated") ]),
    ],`;
  var logger = '';
  if (config.logger === 'helium') {
    logger = '.Package(url: "https://github.com/IBM-Swift/HeliumLogger.git", majorVersion: 1, minor: 1),';
  }
  //Hard coded as we don't have the optional dependencies implemented
  var store = '.Package(url: "https://github.com/IBM-Swift/GeneratedSwiftServer-CloudantStore.git", majorVersion: 0, minor: 3),';
  //TODO: re-implement this when we have added optional dependencies on the stores
  /*if (config.store === 'cloudant') {
    store = '.Package(url: "https://github.com/IBM-Swift/GeneratedSwiftServer-CloudantStore.git", majorVersion: 0, minor: 3),';
  }*/
  return `
import PackageDescription

let package = Package(
    name: "${config.appName}",
    ${targets}
    dependencies: [
        .Package(url: "https://github.com/IBM-Swift/Kitura.git", majorVersion: 1, minor: 1),
        .Package(url: "https://github.com/IBM-Swift/GeneratedSwiftServer.git", majorVersion: 0, minor: 3),
        ${logger}
        ${store}
    ]
)`;
};
