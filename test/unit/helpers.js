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

'use strict';
var assert = require('assert');
var helpers = require('../../lib/helpers');

describe('helpers', function () {

  describe('generateServiceName', function () {
    var serviceName;

    before(function() {
      serviceName = helpers.generateServiceName('app', 'service');
    });

    it('created a name string', function() {
      assert.equal(typeof(serviceName), 'string');
    });

    it('created a name prefixed with appName and serviceType', function() {
      assert(serviceName.startsWith('app-service-'));
    });

    it('created a name with a random 4 character suffix', function() {
      var suffix = serviceName.substring('app-service-'.length);
      assert.equal(suffix.length, 4);
      assert(suffix.match(/[a-z]\d[a-z]\d/));
    });
  });

  describe('sanitizeAppName', function () {
    it('alpha name unchanged', function() {
      assert.equal(helpers.sanitizeAppName('bob'), 'bob');
    });

    it('alphanumeric name unchanged', function() {
      assert.equal(helpers.sanitizeAppName('b33ob4'), 'b33ob4');
    });

    it('numbers stripped from start', function() {
      assert.equal(helpers.sanitizeAppName('33b33ob4'), 'b33ob4');
      assert.equal(helpers.sanitizeAppName('^33b33ob4'), 'b33ob4');
    });

    it('non-alphanumerics stripped from everywhere', function() {
      assert.equal(helpers.sanitizeAppName('*(&33b@33ob4'), 'b33ob4');
      assert.equal(helpers.sanitizeAppName('3*(&3 3b@33ob4'), 'b33ob4');
      assert.equal(helpers.sanitizeAppName('h3*(&33b@33ob4'), 'h333b33ob4');
      assert.equal(helpers.sanitizeAppName(' h3*(&33b@33ob4'), 'h333b33ob4');
    });

    it('empty or completely invalid string gives generic name', function() {
      assert.equal(helpers.sanitizeAppName(''), 'SWIFTSERVERAPP');
      assert.equal(helpers.sanitizeAppName(' '), 'SWIFTSERVERAPP');
      assert.equal(helpers.sanitizeAppName('*(&@'), 'SWIFTSERVERAPP');
      assert.equal(helpers.sanitizeAppName('*(&33@334'), 'SWIFTSERVERAPP');
    });
  });

});
