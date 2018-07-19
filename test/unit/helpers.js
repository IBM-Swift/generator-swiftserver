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
          serviceInfo: {
            label: 'cloudantNoSQLDB',
            plan: 'Lite'
          },
          url: 'http://localhost:5984',
          host: 'localhost',
          username: '',
          password: '',
          secured: false,
          port: 5984
        },
        redis: {
          serviceInfo: {
            label: 'compose-for-redis',
            plan: 'Standard'
          },
          uri: 'redis://:@localhost:6379'
        },
        objectStorage: {
          serviceInfo: {
            label: 'Object-Storage',
            plan: 'Free'
          },
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
        },
        auth: {
          serviceInfo: {
            label: 'AppID',
            plan: 'Graduated tier'
          },
          clientId: '',
          oauthServerUrl: '',
          profilesUrl: '',
          secret: ''
        },
        conversation: {
          serviceInfo: {
            label: 'conversation',
            plan: 'free'
          },
          url: 'https://gateway.watsonplatform.net/assistant/api',
          apikey: ''
        },
        alertNotification: {
          serviceInfo: {
            label: 'AlertNotification',
            plan: 'authorizedusers'
          },
          url: '',
          name: '',
          password: ''
        },
        push: {
          serviceInfo: {
            label: 'imfpush',
            plan: 'lite'
          },
          appGuid: '',
          url: '',
          admin_url: '',
          appSecret: '',
          clientSecret: ''
        },
        autoscaling: {
          serviceInfo: {
            label: 'Auto-Scaling',
            plan: 'free'
          }
        }
      }
      Object.keys(expectedDefaultValues).forEach(serviceType => {
        it(`for ${serviceType}`, function () {
          var service = helpers.sanitizeServiceAndFillInDefaults(
            serviceType, { serviceInfo: {name: 'myService'} }
          )
          assert.equal(service.serviceInfo.name, 'myService')
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
        objectStorage: {
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
        auth: {
          clientId: 'my-client-id',
          oauthServerUrl: 'http://my-oauth-server-host',
          profilesUrl: 'http://my-profiles-host',
          secret: 'my-secret',
          tenantId: 'my-tenant-id'
        },
        conversation: {
          url: 'http://my-host',
          apikey: 'my-apikey'
        },
        alertNotification: {
          url: 'http://my-host',
          name: 'my-name',
          password: 'my-password'
        },
        push: {
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
          var serviceInfo = { serviceInfo: {name: 'my-service', label: 'my-label', plan: 'my-plan'} }
          var service = helpers.sanitizeServiceAndFillInDefaults(
            serviceType, Object.assign(specifiedCredentials[serviceType], serviceInfo)
          )
          assert.equal(service.serviceInfo.name, 'my-service')
          assert.equal(service.serviceInfo.label, 'my-label')
          assert.equal(service.serviceInfo.plan, 'my-plan')
          assert.objectContent(service, specifiedCredentials[serviceType])
        })
      })
    })

    describe('calculated values', function () {
      describe('for cloudant', function () {
        it('host, username, password, secured, port from url (merge with default)', function () {
          var specifiedCredentials = { url: 'http://my-username:my-password@my-host:4444' }
          var service = helpers.sanitizeServiceAndFillInDefaults(
            'cloudant', Object.assign(specifiedCredentials, { serviceInfo: {name: 'my-service'} })
          )
          assert.objectContent(service, {
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
            'cloudant', Object.assign(specifiedCredentials, { serviceInfo: {name: 'my-service'} })
          )
          assert.objectContent(service, {
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
            'cloudant', Object.assign(specifiedCredentials, { serviceInfo: {name: 'my-service'} })
          )
          assert.objectContent(service, {
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
            'cloudant', Object.assign(specifiedCredentials, { serviceInfo: {name: 'my-service'} })
          )
          assert.objectContent(service, {
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
            'cloudant', Object.assign(specifiedCredentials, { serviceInfo: {name: 'my-service'} })
          )
          assert.objectContent(service, {
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
            'redis', { serviceInfo: {name: 'my-service'}, password: 'my-password', host: 'my-host', port: 5555 }
          )
          assert.equal(service.uri, 'redis://:my-password@my-host:5555')
        })

        it('uri from password (merge with default)', function () {
          var service = helpers.sanitizeServiceAndFillInDefaults(
            'redis', { serviceInfo: {name: 'my-service'}, password: 'my-password' }
          )
          assert.equal(service.uri, 'redis://:my-password@localhost:6379')
        })

        it('uri from host (merge with default)', function () {
          var service = helpers.sanitizeServiceAndFillInDefaults(
            'redis', { serviceInfo: {name: 'my-service'}, host: 'my-host' }
          )
          assert.equal(service.uri, 'redis://:@my-host:6379')
        })

        it('uri from port (merge with default)', function () {
          var service = helpers.sanitizeServiceAndFillInDefaults(
            'redis', { serviceInfo: {name: 'my-service'}, port: 5555 }
          )
          assert.equal(service.uri, 'redis://:@localhost:5555')
        })

        it('uri and host, port and password (no merge)', function () {
          var service = helpers.sanitizeServiceAndFillInDefaults(
            'redis', { serviceInfo: {name: 'my-service'}, uri: 'redis://my-specific-host:1111', password: 'my-password', host: 'my-host', port: 5555 }
          )
          assert.equal(service.uri, 'redis://my-specific-host:1111')
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
      assert.equal(helpers.getBluemixServiceLabel('objectStorage'), 'Object-Storage')
    })

    it('get label for appid', function () {
      assert.equal(helpers.getBluemixServiceLabel('auth'), 'AppID')
    })

    it('get label for watsonassistant', function () {
      assert.equal(helpers.getBluemixServiceLabel('conversation'), 'conversation')
    })

    it('get label for alertnotification', function () {
      assert.equal(helpers.getBluemixServiceLabel('alertNotification'), 'AlertNotification')
    })

    it('get label for pushnotifications', function () {
      assert.equal(helpers.getBluemixServiceLabel('push'), 'imfpush')
    })

    it('get label for unrecognized value', function () {
      assert.equal(helpers.getBluemixServiceLabel('unrecognized'), 'unrecognized')
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
      assert.equal(helpers.getBluemixDefaultPlan('objectStorage'), 'Free')
    })

    it('get default plan for appid', function () {
      assert.equal(helpers.getBluemixDefaultPlan('auth'), 'Graduated tier')
    })

    it('get default plan for watsonassistant', function () {
      assert.equal(helpers.getBluemixDefaultPlan('conversation'), 'free')
    })

    it('get default plan for alertnotification', function () {
      assert.equal(helpers.getBluemixDefaultPlan('alertNotification'), 'authorizedusers')
    })

    it('get default plan for pushnotifications', function () {
      assert.equal(helpers.getBluemixDefaultPlan('push'), 'lite')
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

  describe('swagger path formatter', function () {
    it('convert swagger path parameters to swift format', function () {
      assert(helpers.reformatPathToSwiftKitura('/helper/ff/test/{p1}/{p2}') === '/helper/ff/test/:p1/:p2')
    })
  })

  describe('arrayContains', function () {
    it('returns true when the array contains value', function () {
      var search = 'data'
      var array = ['data']
      assert(helpers.arrayContains(search, array) === true)
    })

    it('returns false when the array does not contain value', function () {
      var search = 'data'
      var array = ['blahh']
      assert(helpers.arrayContains(search, array) === false)
    })
  })

  describe('getRefName', function () {
    it('returns the last element from a reference path', function () {
      assert(helpers.getRefName('#/definitions/errorModelBody') === 'errorModelBody')
    })
  })

  describe('capitalizeFirstLetter', function () {
    it('returns a string with first letter in upper  case', function () {
      assert(helpers.capitalizeFirstLetter('should_be_capitalized') === 'Should_be_capitalized')
    })
  })

  describe('swiftTypeFromSwaggerProperty', function () {
    it('returns a Swift Bool type', function () {
      var property = {'type': 'boolean', 'format': undefined}
      assert(helpers.swiftFromSwaggerProperty(property) === 'Bool')
    })

    it('returns a Swift Int type', function () {
      var property = {'type': 'integer', 'format': undefined}
      assert(helpers.swiftFromSwaggerProperty(property) === 'Int')
    })

    it('returns a Swift Int8 type', function () {
      var property = {'type': 'integer', 'format': 'int8'}
      assert(helpers.swiftFromSwaggerProperty(property) === 'Int8')
    })

    it('returns a Swift UInt8 type', function () {
      var property = {'type': 'integer', 'format': 'uint8'}
      assert(helpers.swiftFromSwaggerProperty(property) === 'UInt8')
    })

    it('returns a Swift Int16 type', function () {
      var property = {'type': 'integer', 'format': 'int16'}
      assert(helpers.swiftFromSwaggerProperty(property) === 'Int16')
    })

    it('returns a Swift UInt16 type', function () {
      var property = {'type': 'integer', 'format': 'uint16'}
      assert(helpers.swiftFromSwaggerProperty(property) === 'UInt16')
    })

    it('returns a Swift Int32 type', function () {
      var property = {'type': 'integer', 'format': 'int32'}
      assert(helpers.swiftFromSwaggerProperty(property) === 'Int32')
    })

    it('returns a Swift UInt32 type', function () {
      var property = {'type': 'integer', 'format': 'uint32'}
      assert(helpers.swiftFromSwaggerProperty(property) === 'UInt32')
    })

    it('returns a Swift Int64 type', function () {
      var property = {'type': 'integer', 'format': 'int64'}
      assert(helpers.swiftFromSwaggerProperty(property) === 'Int64')
    })

    it('returns a Swift UInt64 type', function () {
      var property = {'type': 'integer', 'format': 'uint64'}
      assert(helpers.swiftFromSwaggerProperty(property) === 'UInt64')
    })

    it('returns a Swift Double type', function () {
      var property = {'type': 'number', 'format': undefined}
      assert(helpers.swiftFromSwaggerProperty(property) === 'Double')
    })

    it('returns a Swift Float type', function () {
      var property = {'type': 'number', 'format': 'float'}
      assert(helpers.swiftFromSwaggerProperty(property) === 'Float')
    })

    it('returns a Swift mapping type for an integer without a format', function () {
      var property = {
        'type': 'object',
        'additionalProperties': {
          'type': 'integer'
        }
      }
      assert(helpers.swiftFromSwaggerProperty(property) === 'Dictionary<String, Int>')
    })

    it('returns a Swift mapping type for an integer with a format', function () {
      var property = {
        'type': 'object',
        'additionalProperties': {
          'type': 'integer',
          'format': 'int8'
        }
      }
      assert(helpers.swiftFromSwaggerProperty(property) === 'Dictionary<String, Int8>')
    })

    it('returns a Swift array of Int32 types', function () {
      var property = {
        'type': 'array',
        'items': {
          'type': 'integer',
          'format': 'int32'
        }
      }
      assert(helpers.swiftFromSwaggerProperty(property) === '[Int32]')
    })
  })

  describe('swiftFromSwaggerType', function () {
    it('converts string to String', function () {
      assert(helpers.swiftFromSwaggerType('string') === 'String')
    })

    it('converts integer to Int', function () {
      assert(helpers.swiftFromSwaggerType('integer') === 'Int')
    })

    it('converts cheese to itself', function () {
      assert(helpers.swiftFromSwaggerType('cheese') === 'cheese')
    })
  })
})
