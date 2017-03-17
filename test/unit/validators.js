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

describe('validators', function () {

  describe('validatePort', function () {
    it('valid port number', function() {
      assert(helpers.validatePort('1234'));
    });
    it('empty port number', function() {
      assert(helpers.validatePort(''));
    });
    it('invalid port number', function() {
      assert.equal(helpers.validatePort('a load of rubbish'), 'Port is not a number');
    });
  });

});
