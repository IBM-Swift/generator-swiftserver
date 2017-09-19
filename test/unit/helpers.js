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
var assert = require('yeoman-assert')
var helpers = require('../../lib/helpers')
var nock = require('nock')
var path = require('path')
var memFs = require('mem-fs')
var editor = require('mem-fs-editor')

describe('Unit tests for helpers', function () {
  describe('generateServiceName', function () {
    var serviceName

    before(function () {
      serviceName = helpers.generateServiceName('app', 'service')
    })

    it('created a name string', function () {
      assert.equal(typeof (serviceName), 'string')
    })

    it('created a name prefixed with appName and serviceType', function () {
      assert(serviceName.startsWith('app-service-'))
    })

    it('created a name with a random 4 character suffix', function () {
      var suffix = serviceName.substring('app-service-'.length)
      assert.equal(suffix.length, 4)
      assert(suffix.match(/[a-z]\d[a-z]\d/))
    })
  })

  describe('sanitizeAppName', function () {
    it('alpha name unchanged', function () {
      assert.equal(helpers.sanitizeAppName('bob'), 'bob')
    })

    it('alphanumeric name unchanged', function () {
      assert.equal(helpers.sanitizeAppName('b33ob4'), 'b33ob4')
    })

    it('numbers stripped from start', function () {
      assert.equal(helpers.sanitizeAppName('33b33ob4'), 'b33ob4')
      assert.equal(helpers.sanitizeAppName('^33b33ob4'), 'b33ob4')
    })

    it('non-alphanumerics stripped from everywhere', function () {
      assert.equal(helpers.sanitizeAppName('*(&33b@33ob4'), 'b33ob4')
      assert.equal(helpers.sanitizeAppName('3*(&3 3b@33ob4'), 'b33ob4')
      assert.equal(helpers.sanitizeAppName('h3*(&33b@33ob4'), 'h333b33ob4')
      assert.equal(helpers.sanitizeAppName(' h3*(&33b@33ob4'), 'h333b33ob4')
    })

    it('empty or completely invalid string gives generic name', function () {
      assert.equal(helpers.sanitizeAppName(''), 'SWIFTSERVERAPP')
      assert.equal(helpers.sanitizeAppName(' '), 'SWIFTSERVERAPP')
      assert.equal(helpers.sanitizeAppName('*(&@'), 'SWIFTSERVERAPP')
      assert.equal(helpers.sanitizeAppName('*(&33@334'), 'SWIFTSERVERAPP')
    })
  })

  describe('sanitizeServiceAndFillInDefaults', function () {
    describe('default values', function () {
      var expectedDefaultValues = {
        cloudant: {
          label: 'cloudantNoSQLDB',
          plan: 'Lite',
          credentials: {
            url: 'http://localhost:5984',
            host: 'localhost',
            username: '',
            password: '',
            secured: false,
            port: 5984
          }
        },
        redis: {
          label: 'compose-for-redis',
          plan: 'Standard',
          credentials: {
            uri: 'redis://:@localhost:6397'
          }
        },
        objectstorage: {
          label: 'Object-Storage',
          plan: 'Free',
          credentials: {
            auth_url: 'https://identity.open.softlayer.com',
            project: '',
            projectId: '',
            region: '',
            userId: '',
            username: '',
            password: '',
            domainId: '',
            domainName: '',
            role: ''
          }
        },
        appid: {
          label: 'AppID',
          plan: 'Graduated tier',
          credentials: {
            clientId: '',
            oauthServerUrl: '',
            profilesUrl: '',
            secret: '',
            tenantId: ''
          }
        },
        watsonconversation: {
          label: 'conversation',
          plan: 'free',
          credentials: {
            url: 'https://gateway.watsonplatform.net/conversation/api',
            username: '',
            password: ''
          }
        },
        alertnotification: {
          label: 'AlertNotification',
          plan: 'authorizedusers',
          credentials: {
            url: '',
            name: '',
            password: ''
          }
        },
        pushnotifications: {
          label: 'imfpush',
          plan: 'lite',
          credentials: {
            appGuid: '',
            url: '',
            admin_url: '',
            appSecret: '',
            clientSecret: ''
          }
        },
        autoscaling: {
          label: 'Auto-Scaling',
          plan: 'free',
          credentials: {}
        }
      }
      Object.keys(expectedDefaultValues).forEach(serviceType => {
        it(`for ${serviceType}`, function () {
          var service = helpers.sanitizeServiceAndFillInDefaults(
            serviceType, { name: 'myService', credentials: {} }
          )
          assert.equal(service.name, 'myService')
          assert.objectContent(service, expectedDefaultValues[serviceType])
        })
      })
    })

    describe('specified values', function () {
      var specifiedCredentials = {
        cloudant: {
          url: 'https://my-host:5555',
          host: 'my-host',
          username: 'my-username',
          password: 'my-password',
          secured: true,
          port: 5555
        },
        redis: {
          uri: 'redis://:my-password@my-host:5555'
        },
        objectstorage: {
          auth_url: 'http://my-auth-host',
          project: 'my-project',
          projectId: 'my-project-id',
          region: 'my-region',
          userId: 'my-user-id',
          username: 'my-username',
          password: 'my-password',
          domainId: 'my-domain-id',
          domainName: 'my-domain-name',
          role: 'my-role'
        },
        appid: {
          clientId: 'my-client-id',
          oauthServerUrl: 'http://my-oauth-server-host',
          profilesUrl: 'http://my-profiles-host',
          secret: 'my-secret',
          tenantId: 'my-tenant-id'
        },
        watsonconversation: {
          url: 'http://my-host',
          username: 'my-username',
          password: 'my-password'
        },
        alertnotification: {
          url: 'http://my-host',
          name: 'my-name',
          password: 'my-password'
        },
        pushnotifications: {
          appGuid: 'my-app-guid',
          url: 'http://my-host',
          admin_url: 'http://my-admin-host',
          appSecret: 'my-app-secret',
          clientSecret: 'my-client-secret'
        },
        autoscaling: {
        }
      }
      Object.keys(specifiedCredentials).forEach(serviceType => {
        it(`for ${serviceType}`, function () {
          var service = helpers.sanitizeServiceAndFillInDefaults(
            serviceType, { name: 'my-service', label: 'my-label', plan: 'my-plan', credentials: specifiedCredentials[serviceType] }
          )
          assert.equal(service.name, 'my-service')
          assert.equal(service.label, 'my-label')
          assert.equal(service.plan, 'my-plan')
          assert.objectContent(service.credentials, specifiedCredentials[serviceType])
        })
      })
    })

    describe('calculated values', function () {
      describe('for cloudant', function () {
        it('host, username, password, secured, port from url (merge with default)', function () {
          var specifiedCredentials = { url: 'http://my-username:my-password@my-host:4444' }
          var service = helpers.sanitizeServiceAndFillInDefaults(
            'cloudant', { name: 'my-service', credentials: specifiedCredentials }
          )
          assert.objectContent(service.credentials, {
            url: specifiedCredentials.url,
            host: 'my-host',
            username: 'my-username',
            password: 'my-password',
            secured: false,
            port: 4444
          })
        })

        it('url from host, username, password, port (merge with default)', function () {
          var specifiedCredentials = {
            host: 'my-host',
            username: 'my-username',
            password: 'my-password',
            port: 3333
          }
          var service = helpers.sanitizeServiceAndFillInDefaults(
            'cloudant', { name: 'my-service', credentials: specifiedCredentials }
          )
          assert.objectContent(service.credentials, {
            url: 'http://my-username:my-password@my-host:3333',
            host: specifiedCredentials.host,
            username: specifiedCredentials.username,
            password: specifiedCredentials.password,
            secured: false,
            port: specifiedCredentials.port
          })
        })

        it('url from host (merge with default)', function () {
          var specifiedCredentials = { host: 'my-host' }
          var service = helpers.sanitizeServiceAndFillInDefaults(
            'cloudant', { name: 'my-service', credentials: specifiedCredentials }
          )
          assert.objectContent(service.credentials, {
            url: 'http://my-host:5984',
            host: specifiedCredentials.host,
            username: '',
            password: '',
            secured: false,
            port: 5984
          })
        })

        it('url from port (merge with default)', function () {
          var specifiedCredentials = { port: 1111 }
          var service = helpers.sanitizeServiceAndFillInDefaults(
            'cloudant', { name: 'my-service', credentials: specifiedCredentials }
          )
          assert.objectContent(service.credentials, {
            url: 'http://localhost:1111',
            host: 'localhost',
            username: '',
            password: '',
            secured: false,
            port: specifiedCredentials.port
          })
        })

        it('url from username, password (merge with default)', function () {
          var specifiedCredentials = { username: 'my-username', password: 'my-password' }
          var service = helpers.sanitizeServiceAndFillInDefaults(
            'cloudant', { name: 'my-service', credentials: specifiedCredentials }
          )
          assert.objectContent(service.credentials, {
            url: 'http://my-username:my-password@localhost:5984',
            host: 'localhost',
            username: specifiedCredentials.username,
            password: specifiedCredentials.password,
            secured: false,
            port: 5984
          })
        })
      })

      describe('for redis', function () {
        it('uri from host, port and password (no merge)', function () {
          var service = helpers.sanitizeServiceAndFillInDefaults(
            'redis', { name: 'my-service', credentials: { password: 'my-password', host: 'my-host', port: 5555 } }
          )
          assert.equal(service.credentials.uri, 'redis://:my-password@my-host:5555')
        })

        it('uri from password (merge with default)', function () {
          var service = helpers.sanitizeServiceAndFillInDefaults(
            'redis', { name: 'my-service', credentials: { password: 'my-password' } }
          )
          assert.equal(service.credentials.uri, 'redis://:my-password@localhost:6397')
        })

        it('uri from host (merge with default)', function () {
          var service = helpers.sanitizeServiceAndFillInDefaults(
            'redis', { name: 'my-service', credentials: { host: 'my-host' } }
          )
          assert.equal(service.credentials.uri, 'redis://:@my-host:6397')
        })

        it('uri from port (merge with default)', function () {
          var service = helpers.sanitizeServiceAndFillInDefaults(
            'redis', { name: 'my-service', credentials: { port: 5555 } }
          )
          assert.equal(service.credentials.uri, 'redis://:@localhost:5555')
        })

        it('uri and host, port and password (no merge)', function () {
          var service = helpers.sanitizeServiceAndFillInDefaults(
            'redis', { name: 'my-service', credentials: { uri: 'redis://my-specific-host:1111', password: 'my-password', host: 'my-host', port: 5555 } }
          )
          assert.equal(service.credentials.uri, 'redis://my-specific-host:1111')
        })
      })
    })
  })

  describe('getBluemixServiceLabel', function () {
    it('get label for cloudant', function () {
      assert.equal(helpers.getBluemixServiceLabel('cloudant'), 'cloudantNoSQLDB')
    })

    it('get label for redis', function () {
      assert.equal(helpers.getBluemixServiceLabel('redis'), 'compose-for-redis')
    })

    it('get label for objectstorage', function () {
      assert.equal(helpers.getBluemixServiceLabel('objectstorage'), 'Object-Storage')
    })

    it('get label for appid', function () {
      assert.equal(helpers.getBluemixServiceLabel('appid'), 'AppID')
    })

    it('get label for watsonconversation', function () {
      assert.equal(helpers.getBluemixServiceLabel('watsonconversation'), 'conversation')
    })

    it('get label for alertnotification', function () {
      assert.equal(helpers.getBluemixServiceLabel('alertnotification'), 'AlertNotification')
    })

    it('get label for pushnotifications', function () {
      assert.equal(helpers.getBluemixServiceLabel('pushnotifications'), 'imfpush')
    })

    it('get label for unrecognised value', function () {
      assert.equal(helpers.getBluemixServiceLabel('unrecognised'), 'unrecognised')
    })
  })

  describe('getBluemixDefaultPlan', function () {
    it('get default plan for cloudant', function () {
      assert.equal(helpers.getBluemixDefaultPlan('cloudant'), 'Lite')
    })

    it('get default plan for redis', function () {
      assert.equal(helpers.getBluemixDefaultPlan('redis'), 'Standard')
    })

    it('get default plan for objectstorage', function () {
      assert.equal(helpers.getBluemixDefaultPlan('objectstorage'), 'Free')
    })

    it('get default plan for appid', function () {
      assert.equal(helpers.getBluemixDefaultPlan('appid'), 'Graduated tier')
    })

    it('get default plan for watsonconversation', function () {
      assert.equal(helpers.getBluemixDefaultPlan('watsonconversation'), 'free')
    })

    it('get default plan for alertnotification', function () {
      assert.equal(helpers.getBluemixDefaultPlan('alertnotification'), 'authorizedusers')
    })

    it('get default plan for pushnotifications', function () {
      assert.equal(helpers.getBluemixDefaultPlan('pushnotifications'), 'lite')
    })

    it('get default plan for unrecognised value', function () {
      assert.equal(helpers.getBluemixDefaultPlan('unrecognised'), 'Lite')
    })
  })

  describe('convertDefaultValue', function () {
    it('convert string', function () {
      assert.equal(helpers.convertDefaultValue('string', 'cloudant'), 'cloudant')
    })

    it('convert number', function () {
      assert.equal(helpers.convertDefaultValue('number', '3.14159'), 3.14159)
    })

    it('convert boolean', function () {
      assert.equal(helpers.convertDefaultValue('boolean', 'true'), true)
    })

    it('convert object', function () {
      assert.objectContent(helpers.convertDefaultValue('object', '{"value":"a value"}'), {value: 'a value'})
    })

    it('convert array', function () {
      assert.objectContent(helpers.convertDefaultValue('array', '[3.14159, 122]'), [3.14159, 122])
    })

    it('convert unrecognised type', function () {
      try {
        var result = helpers.convertDefaultValue('pi', '3.14159')
        assert.fail(typeof (result), '[string, number, boolean, object]', false, 'type not one of')
      } catch (err) {
        assert.equal(err.message, "Unrecognised type 'pi'")
      }
    })
  })

  describe('convertJSDefaultValueToSwift', function () {
    it('convert string', function () {
      assert.equal(helpers.convertJSDefaultValueToSwift('cloudant'), '"cloudant"')
    })

    it('convert number', function () {
      assert.equal(helpers.convertJSDefaultValueToSwift(3.14159), '3.14159')
    })

    it('convert boolean', function () {
      assert.equal(helpers.convertJSDefaultValueToSwift(true), 'true')
    })

    it('convert object', function () {
      assert.equal(helpers.convertJSDefaultValueToSwift({'value': 'a value'}), '["value": "a value"]')
    })

    it('convert array', function () {
      assert.equal(helpers.convertJSDefaultValueToSwift([3.14159, 122]), '[3.14159, 122]')
    })

    it('convert unrecognised type', function () {
      try {
        var person
        var result = helpers.convertJSDefaultValueToSwift(person)
        assert.fail(typeof (result), '[string, number, boolean, object]', false, 'type not one of')
      } catch (err) {
        assert.equal(err.message, "Unrecognised type 'undefined'")
      }
    })
  })

  describe('convertJSTypeValueToSwift', function () {
    it('convert string', function () {
      assert.equal(helpers.convertJSTypeToSwift('string', false), 'String')
      assert.equal(helpers.convertJSTypeToSwift('string', true), 'String?')
    })

    it('convert number', function () {
      assert.equal(helpers.convertJSTypeToSwift('number', false), 'Double')
      assert.equal(helpers.convertJSTypeToSwift('number', true), 'Double?')
    })

    it('convert boolean', function () {
      assert.equal(helpers.convertJSTypeToSwift('boolean', false), 'Bool')
      assert.equal(helpers.convertJSTypeToSwift('boolean', true), 'Bool?')
    })

    it('convert object', function () {
      assert.equal(helpers.convertJSTypeToSwift('object', false), 'Any')
      assert.equal(helpers.convertJSTypeToSwift('object', true), 'Any?')
    })

    it('convert array', function () {
      assert.equal(helpers.convertJSTypeToSwift('array', false), '[Any]')
      assert.equal(helpers.convertJSTypeToSwift('array', true), '[Any]?')
    })

    it('convert unrecognised type', function () {
      try {
        var person
        var result = helpers.convertJSTypeToSwift(person)
        assert.fail(typeof (result), '[string, number, boolean, object]', false, 'type not one of')
      } catch (err) {
        assert.equal(err.message, "Unrecognised type 'undefined'")
      }
    })
  })

  describe('loadAsync', function () {
    before(function () {
      nock('http://petstore.org')
        .get('/yaml')
        .replyWithFile(200, path.join(__dirname, '../resources/petstore2.yaml'))
    })

    after(function () {
      nock.cleanAll()
    })

    it('load yaml from http', function () {
      helpers.loadAsync('http://petstore.org/yaml')
        .catch(err => {
          assert.fail('failed to load .yaml file:', err)
        })
    })
  })

  describe('loadAsync', function () {
    before(function () {
      nock('http://petstore.org')
        .get('/yml')
        .replyWithFile(200, path.join(__dirname, '../resources/petstore2.yml'))
    })

    after(function () {
      nock.cleanAll()
    })

    it('load yml from http', function () {
      helpers.loadAsync('http://petstore.org/yml')
        .catch(err => {
          assert.fail('failed to load .yml file:', err)
        })
    })
  })

  describe('loadAsync', function () {
    before(function () {
      nock('http://dino.io')
        .get('/json')
        .replyWithFile(200, path.join(__dirname, '../resources/person_dino.json'))
    })

    after(function () {
      nock.cleanAll()
    })

    it('load json from http', function () {
      helpers.loadAsync('http://dino.io/json')
        .catch(err => {
          assert.fail('failed to load .json file:', err)
        })
    })
  })

  describe('loadAsync', function () {
    var store
    var fs

    before(function () {
      store = memFs.create()
      fs = editor.create(store)
    })

    it('load json from file', function () {
      helpers.loadAsync(path.join(__dirname, '../resources/person_dino.json'), fs)
        .catch(err => {
          assert.fail('failed to load .json file:', err)
        })
    })
  })

  describe('loadAsync', function () {
    var store
    var fs

    before(function () {
      store = memFs.create()
      fs = editor.create(store)
    })

    it('load yaml from file', function () {
      helpers.loadAsync(path.join(__dirname, '../resources/petstore2.yaml'), fs)
        .catch(err => {
          assert.fail('failed to load .yaml file:', err)
        })
    })
  })

  describe('loadAsync', function () {
    var store
    var fs

    before(function () {
      store = memFs.create()
      fs = editor.create(store)
    })

    it('load yml from file', function () {
      helpers.loadAsync(path.join(__dirname, '../resources/petstore2.yml'), fs)
        .catch(err => {
          assert.fail('failed to load .yml file:', err)
        })
    })
  })

  describe('swagger path formatter', function () {
    it('convert swagger path parameters to swift format', function () {
      assert(helpers.reformatPathToSwift('/helper/ff/test/{p1}/{p2}') === '/helper/ff/test/:p1/:p2')
    })
  })
})
