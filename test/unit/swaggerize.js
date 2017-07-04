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
var assert = require('assert')
var utils = require('../../refresh/fromswagger/generatorUtils')

describe('swagger generator', function () {
  describe('generator utils', function () {
    it('extracts basename', function () {
      assert(utils.baseName('/hh/ff/test.txt') === 'test')
    })

    it('can convert Swagger parameters to swift format', function () {
      assert(utils.convertToSwiftParameterFormat('/helper/ff/test{p1} {p2}') === '/helper/ff/test:p1 :p2')
    })

    it('can extract the resource name from a path', function () {
      assert(utils.resourceNameFromPath('/helper/ff/test{p1} {p2}') === 'Helper')
    })

    it('can get a reference name from a swagger $reg value', function () {
      assert(utils.getRefName('/helper/ff/test') === 'test')
    })
  })
})
