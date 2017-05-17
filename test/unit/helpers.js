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

  describe('generateLocalConfig', function () {
    it('get default local config: no credentials, no specConfig', function() {
      var specConfig = {};
      var services = {};
      var expected = {services:{}, logger:'helium', port:8080};
      var config = helpers.generateLocalConfig(specConfig, services);

      assert.objectContent(config, expected);
    });

    it('get default local config: no credentials, supplied specConfig', function() {
      var specConfig = {logger:'nitrogen',port:1234};
      var services = {};
      var expected = {services:{}, logger:'nitrogen', port:1234};
      var config = helpers.generateLocalConfig(specConfig, services);

      assert.objectContent(config, expected);
    });

    it('get default local config: default credentials', function() {
      var specConfig = {};
      var cloudantCredentials = {}
      var redisCredentials = {}
      var objectstorageCredentials = {}
      var services = {cloudant:[{credentials:cloudantCredentials}],
                      redis:[{credentials:redisCredentials}],
                      objectstorage:[{credentials:objectstorageCredentials}]
                     };
      var expected = {services:{cloudant:[{type:'cloudant',host:'localhost',port:5984,secured:false}],
                                redis:[{type:'redis',host:'localhost',port:6397}],
                                objectstorage:[{type:'objectstorage'}]
                               }, logger:'helium', port:8080};
      var config = helpers.generateLocalConfig(specConfig, services);

      assert.objectContent(config, expected);
    });

    it('get default local config: supplied credentials', function() {
      var specConfig = {};
      var cloudantCredentials = {host:'host', port:1234,username:'username', password:'password'}
      var redisCredentials = {host:'host', port:1234,username:'username', password:'password'}
      var objectstorageCredentials = {auth_url:'auth_url',
                                      project:'project',
                                      projectId:'projectId',
                                      region:'region',
                                      userId:'userId',
                                      username:'username',
                                      password:'password',
                                      domainId:'domainId',
                                      domainName:'domainName',
                                      role:'role'}
      var services = {cloudant:[{credentials:cloudantCredentials}],
                      redis:[{credentials:redisCredentials}],
                      objectstorage:[{credentials:objectstorageCredentials}]
                     };
      var expected = {services:{cloudant:[{type:'cloudant',
                                           host:'host',
                                           port:1234,
                                           secured:false,
                                           username:'username',
                                           password:'password'}],
                                redis:[{type:'redis',
                                        host:'host',
                                        port:1234,
                                        username:'username',
                                        password:'password'}],
                                objectstorage:[{type:'objectstorage',
                                                auth_url:'auth_url',
                                                project:'project',
                                                projectId:'projectId',
                                                region:'region',
                                                userId:'userId',
                                                username:'username',
                                                password:'password',
                                                domainId:'domainId',
                                                domainName:'domainName',
                                                role:'role'}]
                               }, logger:'helium', port:8080};
      var config = helpers.generateLocalConfig(specConfig, services);

      assert.objectContent(config, expected);
    });

  });

  describe('generateCloudConfig', function () {
    it('get default cloud config: no services', function() {
      var services = {};
      var expected = {vcap:{services:{}}};
      var config = helpers.generateCloudConfig({}, services);

      assert.objectContent(config, expected);
    });

    it('get default cloud config: all services with default values', function() {
      var services = {cloudant:[{credentials:{}}],
                      redis:[{credentials:{}}],
                      objectstorage:[{credentials:{}}],
                      appid:[{credentials:{}}],
                      watsonconversation:[{credentials:{}}]
                     };
      var expected = {vcap:{services:{"cloudantNoSQLDB":[{label:"cloudantNoSQLDB",
                                                          tags:[],
                                                          plan:"Lite",
                                                          credentials:{host:"localhost",
                                                                       port:6984}}],
                                      "compose-for-redis":[{label:"compose-for-redis",
                                                            tags:[],
                                                            plan:"Standard",
                                                            credentials:{uri:"redis://admin:@localhost:6397"}}],
                                      "Object-Storage":[{label:"Object-Storage",
                                                         tags:[],
                                                         plan:"Free",
                                                         credentials:{auth_url:"",
                                                                      project:"",
                                                                      projectId:"",
                                                                      region:"",
                                                                      userId:"",
                                                                      username:"",
                                                                      password:"",
                                                                      domainId:"",
                                                                      domainName:"",
                                                                      role:""}}],
                                      "AdvancedMobileAccess":[{label:"AdvancedMobileAccess",
                                                               tags:[],
                                                               plan:"Graduated tier",
                                                               credentials:{clientId:"",
                                                                            oauthServerUrl:"",
                                                                            profilesUrl:"",
                                                                            secret:"",
                                                                            tenantId:"",
                                                                            version:3}}],
                                      "WatsonConversation":[{label:"WatsonConversation",
                                                         tags:[],
                                                         plan:"Free",
                                                         credentials:{username:"",
                                                                      password:"",
                                                                      url:""}}]
                     }}};
      var config = helpers.generateCloudConfig({}, services);
      assert.objectContent(config, expected);
    });

    it('get default cloud config: all services with specified values', function() {
      var services = {cloudant:[{label:"testcloudant",
                                 plan:"premium",
                                 credentials:{host:'host',
                                              url:'url',
                                              username:'username',
                                              password:'password',
                                              port:1234}}],
                      redis:[{label:"testredis",
                              plan:"premium",
                              credentials:{uri:'uri'}}],
                      objectstorage:[{label:"testobjectstorage",
                                      plan:"premium",
                                      credentials:{auth_url:'auth_url',
                                                   project:'project',
                                                   projectId:'projectId',
                                                   region:'region',
                                                   userId:'userId',
                                                   username:'username',
                                                   password:'password',
                                                   domainId:'domainId',
                                                   domainName:'domainName',
                                                   role:'role'}}],
                      appid:[{label:"testappid",
                              plan:"premium",
                              credentials:{clientId:"clientId",
                                           oauthServerUrl:"oauthServerUrl",
                                           profilesUrl:"profilesUrl",
                                           secret:"secret",
                                           tenantId:"tenantId",
                                           version:1}}],
                      watsonconversation:[{label:"testwatsonconversation",
                                           plan:"free",
                                           credentials:{username:'username',
                                                        password:'password',
                                                        url:"https://api.watson"}}]
                     };
      var expected = {vcap:{services:{testcloudant:[{label:"testcloudant",
                                                     tags:[],
                                                     plan:"premium",
                                                     credentials:{host:"host",
                                                                  url:"url",
                                                                  username:"username",
                                                                  password:"password",
                                                                  port:1234}}],
                                      testredis:[{label:"testredis",
                                                    tags:[],
                                                    plan:"premium",
                                                    credentials:{uri:"uri"}}],
                                      testobjectstorage:[{label:"testobjectstorage",
                                                          tags:[],
                                                          plan:"premium",
                                                          credentials:{auth_url:"auth_url",
                                                                       project:"project",
                                                                       projectId:"projectId",
                                                                       region:"region",
                                                                       userId:"userId",
                                                                       username:"username",
                                                                       password:"password",
                                                                       domainId:"domainId",
                                                                       domainName:"domainName",
                                                                       role:"role"}}],
                                      testappid:[{label:"testappid",
                                                  tags:[],
                                                  plan:"premium",
                                                  credentials:{clientId:"clientId",
                                                               oauthServerUrl:"oauthServerUrl",
                                                               profilesUrl:"profilesUrl",
                                                               secret:"secret",
                                                               tenantId:"tenantId",
                                                               version:1}}],
                                      testwatsonconversation:[{label:"testwatsonconversation",
                                                               tags:[],
                                                               plan:"free",
                                                               credentials:{username:'username',
                                                                            password:'password',
                                                                            url:"https://api.watson"}}]
                     }}};
      var config = helpers.generateCloudConfig({}, services);
      assert.objectContent(config, expected);
    });

  });

  describe('getBluemixServiceLabel', function () {
    it('get label for cloudant', function() {
      assert.equal(helpers.getBluemixServiceLabel('cloudant'), 'cloudantNoSQLDB');
    });

    it('get label for redis', function() {
      assert.equal(helpers.getBluemixServiceLabel('redis'), 'compose-for-redis');
    });

    it('get label for objectstorage', function() {
      assert.equal(helpers.getBluemixServiceLabel('objectstorage'), 'Object-Storage');
    });

    it('get label for appid', function() {
      assert.equal(helpers.getBluemixServiceLabel('appid'), 'AdvancedMobileAccess');
    });

    it('get label for watsonconversation', function() {
      assert.equal(helpers.getBluemixServiceLabel('watsonconversation'), 'WatsonConversation');
    });

    it('get label for unrecognised value', function() {
      assert.equal(helpers.getBluemixServiceLabel('unrecognised'), 'unrecognised');
    });
  });

  describe('getBluemixDefaultPlan', function () {
    it('get default plan for cloudant', function() {
      assert.equal(helpers.getBluemixDefaultPlan('cloudant'), 'Lite');
    });

    it('get default plan for redis', function() {
      assert.equal(helpers.getBluemixDefaultPlan('redis'), 'Standard');
    });

    it('get default plan for objectstorage', function() {
      assert.equal(helpers.getBluemixDefaultPlan('objectstorage'), 'Free');
    });

    it('get default plan for appid', function() {
      assert.equal(helpers.getBluemixDefaultPlan('appid'), 'Graduated tier');
    });

    it('get default plan for watsonconversation', function() {
      assert.equal(helpers.getBluemixDefaultPlan('watsonconversation'), 'Free');
    });

    it('get default plan for unrecognised value', function() {
      assert.equal(helpers.getBluemixDefaultPlan('unrecognised'), 'Lite');
    });
  });

  describe('convertDefaultValue', function () {
    it('convert string', function() {
      assert.equal(helpers.convertDefaultValue('string', 'cloudant'), 'cloudant');
    });

    it('convert number', function() {
      assert.equal(helpers.convertDefaultValue('number', '3.14159'), 3.14159);
    });

    it('convert boolean', function() {
      assert.equal(helpers.convertDefaultValue('boolean', 'true'), true);
    });

    it('convert object', function() {
      assert.objectContent(helpers.convertDefaultValue('object', '{"value":"a value"}'), {value:"a value"});
    });

    it('convert array', function() {
      assert.objectContent(helpers.convertDefaultValue('array', '[3.14159, 122]'), [3.14159, 122]);
    });

    it('convert unrecognised type', function() {
      try {
        var result = helpers.convertDefaultValue('pi', '3.14159');
        assert.fail(typeof(result), '[string, number, boolean, object]', false, 'type not one of');
      }
      catch(err) {
        assert.equal(err.message, "Unrecognised type 'pi'");
      }
    });

  });

  describe('convertJSDefaultValueToSwift', function () {
    it('convert string', function() {
      assert.equal(helpers.convertJSDefaultValueToSwift('cloudant'), '"cloudant"');
    });

    it('convert number', function() {
      assert.equal(helpers.convertJSDefaultValueToSwift(3.14159), '3.14159');
    });

    it('convert boolean', function() {
      assert.equal(helpers.convertJSDefaultValueToSwift(true), 'true');
    });

    it('convert object', function() {
      assert.equal(helpers.convertJSDefaultValueToSwift({"value":"a value"}), '["value": "a value"]');
    });

    it('convert array', function() {
      assert.equal(helpers.convertJSDefaultValueToSwift([3.14159, 122]), '[3.14159, 122]');
    });

    it('convert unrecognised type', function() {
      try {
        var person;
        var result = helpers.convertJSDefaultValueToSwift(person);
        assert.fail(typeof(result), '[string, number, boolean, object]', false, 'type not one of');
      }
      catch(err) {
        assert.equal(err.message, "Unrecognised type 'undefined'");
      }
    });
  });

  describe('convertJSTypeValueToSwift', function () {
    it('convert string', function() {
      assert.equal(helpers.convertJSTypeToSwift('string', false), 'String');
      assert.equal(helpers.convertJSTypeToSwift('string', true), 'String?');
    });

    it('convert number', function() {
      assert.equal(helpers.convertJSTypeToSwift('number', false), 'Double');
      assert.equal(helpers.convertJSTypeToSwift('number', true), 'Double?');
    });

    it('convert boolean', function() {
      assert.equal(helpers.convertJSTypeToSwift('boolean', false), 'Bool');
      assert.equal(helpers.convertJSTypeToSwift('boolean', true), 'Bool?');
    });

    it('convert object', function() {
      assert.equal(helpers.convertJSTypeToSwift('object', false), 'Any');
      assert.equal(helpers.convertJSTypeToSwift('object', true), 'Any?');
    });

    it('convert array', function() {
      assert.equal(helpers.convertJSTypeToSwift('array', false), '[Any]');
      assert.equal(helpers.convertJSTypeToSwift('array', true), '[Any]?');
    });

    it('convert unrecognised type', function() {
      try {
        var person;
        var result = helpers.convertJSTypeToSwift(person);
        assert.fail(typeof(result), '[string, number, boolean, object]', false, 'type not one of');
      }
      catch(err) {
        assert.equal(err.message, "Unrecognised type 'undefined'");
      }
    });

  });

});
