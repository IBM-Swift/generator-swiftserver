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
var os = require('os')
var path = require('path')
var fs = require('fs')
var rimraf = require('rimraf')

var helpers = require('../../lib/helpers')

describe('Unit tests for validators', function () {
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

  describe('validateFilePathOrURL', function () {
    var tmpdir

    before(function () {
      tmpdir = fs.mkdtempSync(path.join(os.tmpdir(),
                              'test-validators-generator-swiftserver-'))
      assert(path.isAbsolute(tmpdir))
      process.chdir(tmpdir)
      fs.writeFileSync('file-that-exists')
      fs.mkdirSync('otherdir')
      fs.writeFileSync('otherdir/other-file-that-exists')
    })

    after(function () {
      rimraf.sync(tmpdir)
    })

    it('empty path', function () {
      assert.equal(helpers.validateFilePathOrURL(''), 'Path is required')
    })
    it('invalid path', function () {
      assert(helpers.validateFilePathOrURL('&').match('not a valid path'))
      assert(helpers.validateFilePathOrURL('.').match('not a valid path'))
    })
    it('current dir (.)', function () {
      assert(helpers.validateFilePathOrURL('./') === true)
    })
    it('parent dir (..)', function () {
      assert(helpers.validateFilePathOrURL('../') === true)
    })
    it('absolute file path (exists)', function () {
      assert(helpers.validateFilePathOrURL(`${tmpdir}/file-that-exists`) === true)
    })
    it('absolute file path (does not exist)', function () {
      var filepath = path.join(tmpdir, '__unlikely__to__exist__')
      assert(helpers.validateFilePathOrURL(filepath).match('path does not exist'))
    })
    it('relative file path (exists)', function () {
      assert(helpers.validateFilePathOrURL('file-that-exists') === true)
    })
    it('relative file path (does not exist)', function () {
      assert(helpers.validateFilePathOrURL('__unlikely__to__exist__').match('path does not exist'))
    })
    it('file path relative to specific dir (exists)', function () {
      var dir = path.join(tmpdir, 'otherdir')
      assert(helpers.validateFilePathOrURL('other-file-that-exists', dir) === true)
    })
    it('file path relative to specific dir (does not exist)', function () {
      var dir = path.join(tmpdir, 'otherdir')
      assert(helpers.validateFilePathOrURL('__unlikely__to__exist__', dir).match('path does not exist'))
    })
    it('http url', function () {
      assert(helpers.validateFilePathOrURL('http:///a.com/b/c') === true)
    })
    it('https url', function () {
      assert(helpers.validateFilePathOrURL('https:///a.com/b/c') === true)
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
