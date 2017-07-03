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
var helpers = require('../../lib/helpers')

describe('validators', function () {
  describe('validateAppName', function () {
    it('accepts app name with alpha characters only', function () {
      assert(helpers.validateAppName('test') === true)
    })
    it('rejects name starting with .', function () {
      assert(helpers.validateAppName('.test') !== true)
    })
    it('rejects app name {node_modules}', function () {
      assert(helpers.validateAppName('node_modules') !== true)
    })
    it('rejects app name {favicon.ico}', function () {
      assert(helpers.validateAppName('favicon.ico') !== true)
    })
    it('accepts app name with numeric characters', function () {
      assert(helpers.validateAppName('3test') === true)
      assert(helpers.validateAppName('test3') === true)
      assert(helpers.validateAppName('te5t') === true)
      assert(helpers.validateAppName('7357') === true)
    })
    it('rejects app name containing special characters', function () {
      assert(helpers.validateAppName('%test*') !== true)
      assert(helpers.validateAppName('%te]st*') !== true)
      assert(helpers.validateAppName('%`.,*') !== true)
    })
  })

  describe('validateDirName', function () {
    it('accepts valid dir name with only alpha characters', function () {
      assert(helpers.validateDirName('test') === true)
    })
    it('accepts valid dir name with alphanumeric characters', function () {
      assert(helpers.validateDirName('test1') === true)
    })
    it('accepts valid dir name only numeric characters', function () {
      assert(helpers.validateDirName('1234') === true)
    })
    it('rejects empty directory name', function () {
      assert(helpers.validateDirName('') !== true)
    })
  })

  describe('validatePort', function () {
    it('valid port number', function () {
      assert(helpers.validatePort('1234'))
    })
    it('empty port number', function () {
      assert(helpers.validatePort(''))
    })
    it('invalid port number', function () {
      assert(helpers.validatePort('a load of rubbish') !== true)
    })
  })

  describe('validateRequiredCredential', function () {
    it('rejects empty credential', function () {
      assert(helpers.validateRequiredCredential('') !== true)
    })
    it('accepts non-empty credential', function () {
      assert(helpers.validateRequiredCredential('password') === true)
    })
  })

  describe('validateRequiredName', function () {
    it('rejects empty name', function () {
      assert(helpers.validateRequiredName('') !== true)
    })
  })

  describe('validatePropertyName', function () {
    it('accepts alphanumeric property name', function () {
      assert(helpers.validatePropertyName('book') === true)
      assert(helpers.validatePropertyName('book1') === true)
      assert(helpers.validatePropertyName('b00k') === true)
    })
    it('rejects empty name', function () {
      assert(helpers.validatePropertyName('') !== true)
    })
    it('rejects property names with first character being non-alpha character', function () {
      assert(helpers.validatePropertyName('1book') !== true)
      assert(helpers.validatePropertyName('|book') !== true)
      assert(helpers.validatePropertyName(' book') !== true)
    })
    it('rejects non-alphanumeric property names', function () {
      assert(helpers.validatePropertyName('book!') !== true)
      assert(helpers.validatePropertyName('b|ook') !== true)
    })
  })

  describe('validateNewModel', function () {
    it('rejects empty name', function () {
      assert(helpers.validateNewModel('') !== true)
    })
  })

  describe('validateDefaultValue', function () {
    it('does nothing with type string', function () {
      assert(helpers.validateDefaultValue('string') === true)
    })
    it('accepts a a numerical vaue when type is number', function () {
      assert(helpers.validateDefaultValue('number', '123') === true)
      assert(helpers.validateDefaultValue('number', '-123') === true)
      assert(helpers.validateDefaultValue('number', '12.31') === true)
    })
    it('rejects values that aren\'t numeric when type is number', function () {
      assert(helpers.validateDefaultValue('number', '123%') !== true)
      assert(helpers.validateDefaultValue('number', 'one') !== true)
      assert(helpers.validateDefaultValue('number', '{}') !== true)
      assert(helpers.validateDefaultValue('number', 'true') !== true)
      assert(helpers.validateDefaultValue('number', '1one') !== true)
    })
    it('accepts boolean values as string', function () {
      assert(helpers.validateDefaultValue('boolean', 'true') === true)
      assert(helpers.validateDefaultValue('boolean', 'false') === true)
    })
    it('rejects values that aren\' true or false', function () {
      assert(helpers.validateDefaultValue('boolean', 'correct') !== true)
      assert(helpers.validateDefaultValue('boolean', '1') !== true)
      assert(helpers.validateDefaultValue('boolean', '{}') !== true)
    })
    it('accepts an object when type is object', function () {
      assert(helpers.validateDefaultValue('object', '{}') === true)
      assert(helpers.validateDefaultValue('object', '{"book": "Testing for dummies"}') === true)
    })
    it('rejects values that aren\'t object when type is object', function () {
      assert(helpers.validateDefaultValue('object', '1') !== true)
      assert(helpers.validateDefaultValue('object', 'testing') !== true)
      assert(helpers.validateDefaultValue('object', 'true') !== true)
      assert(helpers.validateDefaultValue('object', 'false') !== true)
    })
  })
})
