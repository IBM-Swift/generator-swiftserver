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

/**
 * Tests here do not stub out the subgenerators, so for the app generator
 * the real build and refresh subgenerators get called.
 */
'use strict';
var path = require('path');
var assert = require('yeoman-assert');
var helpers = require('yeoman-test');
var rimraf = require('rimraf');
var fs = require('fs');

var appGeneratorPath = path.join(__dirname, '../../../app');

describe('Prompt and no build integration tests for app generator', function () {

  describe('Basic application', function() {
    this.timeout(10000); // Allow first test to be slow
    var runContext;

    before(function() {
      runContext = helpers.run(appGeneratorPath)
                          .withOptions({ 'skip-build': true })
                          .withPrompts({
                            appType: 'Scaffold a starter',
                            name: 'notes',
                            dir:  'notes',
                            capabilities: []
                          });
      return runContext.toPromise();
    });

    it('created and changed into a folder according to dir value', function () {
      assert.equal(path.basename(process.cwd()), 'notes');
    });

    it('created a .swiftservergenerator-project file', function() {
      assert.file('.swiftservergenerator-project');
    });

    it('created a .yo-rc.json file', function() {
      assert.file('.yo-rc.json');
    });

    it('created a LICENSE file', function() {
      assert.file('LICENSE');
    });

    it('created a spec.json file', function() {
      assert.file('spec.json');
    });

    it('created a Package.swift file', function() {
      assert.file('Package.swift');
    });

    it('created a main.swift file', function() {
      assert.file('Sources/notes/main.swift');
    });

    it('created an Application.swift file', function() {
      assert.file('Sources/Application/Application.swift');
    });

    it('created an RouteTests.swift file', function() {
      assert.file('Tests/ApplicationTests/RouteTests.swift');
    });

    it('created an LinuxMain.swift file', function() {
      assert.file('Tests/LinuxMain.swift');
    });

    it('Package.swift contains Configuration dependency', function() {
      assert.fileContent('Package.swift', '/Configuration');
    });

    it('Application.swift references Configuration', function() {
      assert.fileContent('Sources/Application/Application.swift', 'import Configuration');
    });

    it('Application.swift contains a health endpoint', function() {
      assert.fileContent('Sources/Application/Application.swift', '"/health"');
    });

    it('did not create NOTICES.txt', function() {
      assert.noFile('NOTICES.txt');
    });
  });

  describe('Basic application with single-shot', function() {
    var runContext;

    before(function() {
      runContext = helpers.run(appGeneratorPath)
                          .withOptions({
                            'skip-build': true,
                            'single-shot': true
                          })
                          .withPrompts({
                            appType: 'Scaffold a starter',
                            name: 'notes',
                            dir:  'notes',
                            capabilities: []
                          });
      return runContext.toPromise();
    });

    it('did not create a .yo-rc.json file', function() {
      assert.noFile('.yo-rc.json');
    });

    it('did not create a .swiftservergenerator-project file', function() {
      assert.noFile('.swiftservergenerator-project');
    });
  });

  describe('Basic application with bluemix', function() {
    var runContext;

    before(function() {
      runContext = helpers.run(appGeneratorPath)
                          .withOptions({ 'skip-build': true })
                          .withPrompts({
                            appType: 'Scaffold a starter',
                            name: 'notes',
                            dir:  'notes',
                            capabilities: ['Bluemix cloud deployment']
                          });
      return runContext.toPromise();
    });

    it('Package.swift contains CloudConfiguration dependency', function() {
      assert.fileContent('Package.swift', '/CloudConfiguration');
    });
  });

  describe('Basic application with metrics', function() {
    var runContext;

    before(function() {
      runContext = helpers.run(appGeneratorPath)
                          .withOptions({ 'skip-build': true })
                          .withPrompts({
                            appType: 'Scaffold a starter',
                            name: 'notes',
                            dir:  'notes',
                            capabilities: ['Embedded metrics dashboard']
                          });
      return runContext.toPromise();
    });

    it('Package.swift contains SwiftMetrics dependency', function() {
      assert.fileContent('Package.swift', '/SwiftMetrics');
    });

    it('Application.swift imports SwiftMetrics', function() {
      assert.fileContent('Sources/Application/Application.swift', 'import SwiftMetrics');
    });

    it('Application.swift imports SwiftMetricsDash', function() {
      assert.fileContent('Sources/Application/Application.swift', 'import SwiftMetricsDash');
    });
  });

  describe('Basic application with autoscaling', function() {
    var runContext;

    before(function() {
      runContext = helpers.run(appGeneratorPath)
                          .withOptions({ 'skip-build': true })
                          .withPrompts({
                            appType: 'Scaffold a starter',
                            name: 'notes',
                            dir:  'notes',
                            capabilities: [
                              'Embedded metrics dashboard',
                              'Bluemix cloud deployment'
                            ],
                            services: ['Auto-scaling']
                          });
      return runContext.toPromise();
    });

    it('Application.swift imports SwiftMetricsBluemix', function() {
      assert.fileContent('Sources/Application/Application.swift', 'import SwiftMetricsBluemix');
    });

    it('Application.swift references SwiftMetricsBluemix', function() {
      assert.fileContent('Sources/Application/Application.swift', 'SwiftMetricsBluemix(');
    });
  });

  describe('BFF application', function() {
    this.timeout(4000); // NOTE: prevent failures on Travis macOS
    var runContext;

    before(function() {
      runContext = helpers.run(appGeneratorPath)
                          .withOptions({ 'skip-build': true })
                          .withPrompts({
                            appType: 'Scaffold a starter',
                            name: 'notes',
                            dir:  'notes',
                            appPattern: 'Backend for frontend',
                            endpoints: 'Endpoints from swagger file',
                            swaggerChoice: 'Example swagger file'
                          });
      return runContext.toPromise();
    });

    describe('Static web file serving', function() {
      it('created public web directory', function () {
        assert.file('public');
      });

      it('created Application.swift with web serving of public directory', function() {
        assert.fileContent('Sources/Application/Application.swift', 'StaticFileServer()');
      });
    });

    describe('OpenAPI / Swagger endpoint', function() {
      it('created swagger endpoint route', function() {
        assert.file(`Sources/Application/Routes/SwaggerRoute.swift`);
      });
    });

    describe('Example endpoints', function() {
      it('created example endpoints', function() {
        assert.file(`Sources/Application/Routes/ProductsRoutes.swift`);
      });

      it('created example swagger definition', function() {
        assert.file(`definitions/notes.yaml`);
      });
    });

    describe('Static web file serving + Example endpoints', function() {
      it('created SwaggerUI', function () {
        assert.file('public/explorer/index.html');
        assert.file('public/explorer/swagger-ui.js');
        assert.file('public/explorer/css/style.css');
      });

      it('created NOTICES.txt', function() {
        assert.file('NOTICES.txt');
      });
    });

    describe('Embedded metrics dashboard', function() {
      it('created Application.swift with metrics', function() {
        assert.fileContent('Sources/Application/Application.swift', 'import SwiftMetrics');
      });

      it('created Application.swift with metrics dashboard', function() {
        assert.fileContent('Sources/Application/Application.swift', 'import SwiftMetricsDash');
      });
    });

    describe('Docker files', function() {
      it('created tools docker file', function() {
        assert.file('Dockerfile-tools');
      });

      it('created run docker file', function() {
        assert.file('Dockerfile');
      });
    });

    describe('Bluemix cloud deployment', function() {
      it('created CloudFoundry manifest file', function() {
        assert.file('manifest.yml');
      });

      it('created Bluemix toolchain files', function() {
        assert.file('.bluemix/pipeline.yml');
        assert.file('.bluemix/toolchain.yml');
        assert.file('.bluemix/deploy.json');
      });
    });

    describe('Bluemix cloud deployment + Docker files', function() {
      it('created bluemix dev CLI config file', function() {
        assert.file('cli-config.yml');
      });
    });
  });

  describe('BFF application with custom swagger', function() {
    var swagger = {
      "swagger": "2.0",
      "info": {
        "version": "0.0.0",
        "title": "<enter your title>"
      },
      "basePath": "/basepath",
      "paths": {
        "/persons": {
          "get": {
            "description": "Gets `Person` objects.",
          },
          "put": {
            "description": "Puts `Person` objects.",
          }
        },
        "/dinosaurs": {
          "get": {
            "description": "Gets `Dinosaur` objects.",
          }
        }
      }
    };

    this.timeout(4000); // NOTE: prevent failures on Travis macOS
    var runContext;

    before(function() {
      runContext = helpers.run(appGeneratorPath)
                          .inTmpDir(function(tmpDir) {
                            var swaggerPath = path.join(tmpDir, "swagger.json");
                            fs.writeFileSync(swaggerPath, JSON.stringify(swagger));
                            this.answers.path = swaggerPath;
                          })
                          .withOptions({ 'skip-build': true })
                          .withPrompts({
                            appType: 'Scaffold a starter',
                            name: 'notes',
                            dir:  'notes',
                            appPattern: 'Backend for frontend',
                            endpoints: 'Endpoints from swagger file',
                            swaggerChoice: 'Custom swagger file'
                            // path is being set in the inTmpDir call
                          })

      return runContext.toPromise();
    });

    describe('Example endpoints', function() {
      it('created example endpoints', function() {
        assert.file(`Sources/Application/Routes/PersonsRoutes.swift`);
        assert.file(`Sources/Application/Routes/DinosaursRoutes.swift`);
      });
    });
  });

  describe('CRUD application where application name and directory name are the current (empty) directory', function () {
    var runContext;

    before(function () {
      runContext = helpers.run(appGeneratorPath)
                          .withOptions({ 'skip-build': true })
                          .withPrompts({
                            appType: 'Generate a CRUD application',
                            name: 'notes'
                          })
                          .inTmpDir(function(tmpDir) {
                            this.inDir(path.join(tmpDir, 'notes'))
                          });
      return runContext.toPromise();                        // Get a Promise back when the generator finishes
    });

    it('used the empty directory for the project', function () {
      assert.equal(path.basename(process.cwd()), 'notes');
      assert.file('.swiftservergenerator-project');
    });
  });

  describe('Bluemix application where service application name is provided', function () {
    var runContext;

    before(function () {
      runContext = helpers.run(appGeneratorPath)
                          .withOptions({ 'skip-build': true })
                          .withPrompts({
                            appType: 'Scaffold a starter',
                            name: 'notes',
                            dir: 'notes',
                            appPattern: 'Basic',
                            services: ['Cloudant', 'Redis', 'Object Storage', 'AppID', 'Watson Conversation', 'Alert Notification'],
                            configure: ['Cloudant / CouchDB', 'Redis', 'Object Storage', 'AppID', 'Watson Conversation', 'Alert Notification'],
                            cloudantName: 'testCloudant',
                            redisName: 'testRedis',
                            objectstorageName: 'testObjectStorage',
                            appIDName: 'testAppID',
                            watsonConversationName: 'testWatsonConversation',
                            alertNotificationName: 'testAlertNotification'
                          });
      return runContext.toPromise();                        // Get a Promise back when the generator finishes
    });

    it('config.json contains the correct values for cloudant, redis, objectstorage, appid, watsonconversation and alertnotification service names', function () {
      var expected = {
        vcap: {
          services: {
            cloudantNoSQLDB: [{
              name: 'testCloudant'
            }],
            'compose-for-redis': [{
              name: 'testRedis'
            }],
            'Object-Storage': [{
              name: 'testObjectStorage'
            }],
            AdvancedMobileAccess: [{
              name: 'testAppID'
            }],
            'WatsonConversation': [{
              name: 'testWatsonConversation'
            }],
            'AlertNotification': [{
              name: 'testAlertNotification'
            }]
          }
        }
      };
      assert.jsonFileContent('config.json', expected);
    });
  });

  describe('Bluemix application where service application name is defaulted', function () {
    var runContext;

    before(function () {
      runContext = helpers.run(appGeneratorPath)
                          .withOptions({ 'skip-build': true })
                          .withPrompts({
                            appType: 'Scaffold a starter',
                            name: 'notes',
                            dir: 'notes',
                            appPattern: 'Basic',
                            services: ['Cloudant', 'Redis', 'Object Storage', 'AppID', 'Watson Conversation', 'Alert Notification'],
                            configure: ['Cloudant / CouchDB', 'Redis', 'Object Storage', 'AppID', 'Watson Conversation', 'Alert Notification'],
                          });
      return runContext.toPromise();                        // Get a Promise back when the generator finishes
    });

    it('config.json contains the correct values for cloudant, redis, objectstorage and appid service names', function () {
      assert.fileContent([ ['config.json', /\s\"name\":\s\"notes-Cloudant-\w{4}\",/],
                           ['config.json', /\s\"name\":\s\"notes-Redis-\w{4}\",/],
                           ['config.json', /\s\"name\":\s\"notes-ObjectStorage-\w{4}\",/],
                           ['config.json', /\s\"name\":\s\"notes-AppID-\w{4}\",/],
                           ['config.json', /\s\"name\":\s\"notes-WatsonConversation-\w{4}\",/],
                           ['config.json', /\s\"name\":\s\"notes-AlertNotification-\w{4}\",/]
                         ]);
    });
  });

  describe('Non bluemix where service application name should not be provided', function () {
    var runContext;

    before(function () {
      runContext = helpers.run(appGeneratorPath)
                          .withOptions({ 'skip-build': true })
                          .withPrompts({
                            appType: 'Scaffold a starter',
                            name: 'notes',
                            dir: 'notes',
                            appPattern: 'Basic',
                            capabilities: ['Embedded metrics dashboard', 'Docker files'],
                            services: ['CouchDB', 'Redis'],
                            configure: ['Cloudant / CouchDB', 'Redis'],
                          });
      return runContext.toPromise();                        // Get a Promise back when the generator finishes
    });

    it('config.json contains the correct values for cloudant and redis service names', function () {
      var expected = {
        services: {
          cloudant: [{
            name: 'couchdb'
          }],
          'redis': [{
            name: 'redis'
          }],
        }
      };
      assert.jsonFileContent('config.json', expected);
    });
  });

  describe('Non bluemix application where default service credentials are used', function () {
    var runContext;

    before(function () {
      runContext = helpers.run(appGeneratorPath)
                          .withOptions({ 'skip-build': true })
                          .withPrompts({
                            appType: 'Scaffold a starter',
                            name: 'notes',
                            dir: 'notes',
                            appPattern: 'Basic',
                            capabilities: ['Embedded metrics dashboard', 'Docker files'],
                            services: ['CouchDB', 'Redis'],
                            configure: ['Cloudant / CouchDB', 'Redis'],
                          });
      return runContext.toPromise();                        // Get a Promise back when the generator finishes
    });

    it('config.json contains the correct default service config for cloudant and redis credentials', function () {
      var expected = {
        services: {
          cloudant: [{
            name: 'couchdb',
            type: 'cloudant',
            host: 'localhost',
            port: 5984,
            secured: false
          }],
          'redis': [{
            name: 'redis',
            type: 'redis',
            host: 'localhost',
            port: 6397
          }],
        }
      };
      assert.jsonFileContent('config.json', expected);
    });
  });

  describe('Non bluemix application where service credentials are provided', function () {
    var runContext;

    before(function () {
      runContext = helpers.run(appGeneratorPath)
                          .withOptions({ 'skip-build': true })
                          .withPrompts({
                            appType: 'Scaffold a starter',
                            name: 'notes',
                            dir: 'notes',
                            appPattern: 'Basic',
                            capabilities: ['Embedded metrics dashboard', 'Docker files'],
                            services: ['CouchDB', 'Redis'],
                            configure: ['Cloudant / CouchDB', 'Redis'],
                            cloudantType: 'cloudant',
                            cloudantHost: 'cloudy.ibm.com',
                            cloudantPort: 4568,
                            cloudantSecured: true,
                            cloudantUsername: 'admin',
                            cloudantPassword: 'password',
                            redisType: 'redis',
                            redisHost: 'reducto.ibm.com',
                            redisPort: 4569,
                            redisPassword: 'gimble'
                          });
      return runContext.toPromise();                        // Get a Promise back when the generator finishes
    });

    it('auth.json contains the correct service credentials for cloudant and redis credentials', function () {
      var expected = {
        services: {
          cloudant: [{
            name: 'couchdb',
            username: 'admin',
            password: 'password'
          }],
          'redis': [{
            name: 'redis',
            password: 'gimble'
          }],
        }
      };
      assert.jsonFileContent('auth.json', expected);
    });
  });

  describe('Bluemix application where default service credentials are used', function () {
    var runContext;

    before(function () {
      runContext = helpers.run(appGeneratorPath)
                          .withOptions({ 'skip-build': true })
                          .withPrompts({
                            appType: 'Scaffold a starter',
                            name: 'notes',
                            dir: 'notes',
                            appPattern: 'Basic',
                            services: ['Cloudant', 'Redis', 'Object Storage', 'AppID', 'Watson Conversation', 'Alert Notification'],
                            configure: ['Cloudant / CouchDB', 'Redis', 'Object Storage', 'AppID', 'Watson Conversation', 'Alert Notification'],
                          });
      return runContext.toPromise();                        // Get a Promise back when the generator finishes
    });

    it('auth.json contains the correct default service credentials for cloudant, redis, objectstorage, appid, watsonconversation, and alertnotification services', function () {
      var expected = {
        vcap: {
          services: {
            cloudantNoSQLDB: [{
              credentials: {
                host: 'localhost',
                url: '',
                username: '',
                password: '',
                port: 5984
              }
            }],
            'compose-for-redis': [{
              credentials: {
                uri: 'redis://admin:@localhost:6397'
              }
            }],
            'Object-Storage': [{
              credentials: {
                'auth_url': '',
                'project': '',
                'projectId': '',
                'region': '',
                'userId': '',
                'username': '',
                'password': '',
                'domainId': '',
                'domainName': '',
                'role': ''
              }
            }],
            AdvancedMobileAccess: [{
              credentials: {
                'clientId': '',
                'oauthServerUrl': '',
                'profilesUrl': '',
                'secret': '',
                'tenantId': '',
                'version': 3
              }
            }],
            'WatsonConversation': [{
              credentials: {
                'username': '',
                'password': '',
                'url': ''
              }
            }],
            'AlertNotification': [{
              credentials: {
                'name': '',
                'password': '',
                'url': ''
              }
            }]
          }
        }
      };
      assert.jsonFileContent('auth.json', expected);
    });
  });

  describe('Bluemix application where service credentials are specified', function () {
    var runContext;

    before(function () {
      runContext = helpers.run(appGeneratorPath)
                          .withOptions({ 'skip-build': true })
                          .withPrompts({
                            appType: 'Scaffold a starter',
                            name: 'notes',
                            dir: 'notes',
                            appPattern: 'Basic',
                            services: ['Cloudant', 'Redis', 'Object Storage', 'AppID', 'Watson Conversation', 'Alert Notification'],
                            configure: ['Cloudant / CouchDB', 'Redis', 'Object Storage', 'AppID', 'Watson Conversation', 'Alert Notification'],
                            cloudantHost: 'bluemix.cloudant',
                            cloudantPort: 443,
                            cloudantSecured: true,
                            cloudantUsername: 'admin',
                            cloudantPassword: 'password',
                            redisHost: 'bluemix.redis',
                            redisPort: '443',
                            redisPassword: 'password',
                            objectstorageRegion: 'earth',
                            objectstorageProjectId: 'PROJECT_ID',
                            objectstorageUserId: 'USER_ID',
                            objectstoragePassword: 'password',
                            appidTenantId: 'TENANT_ID',
                            appidClientId: 'CLIENT_ID',
                            appidSecret: 'APP_ID_SECRET',
                            watsonConversationUsername: 'WC_USERNAME',
                            watsonConversationPassword: 'WC_PASSWORD',
                            watsonConversationUrl: 'WC_URL',
                            alertNotificationUsername: 'AN_USERNAME',
                            alertNotificationPassword: 'AN_PASSWORD',
                            alertNotificationUrl: 'AN_URL'
                          });
      return runContext.toPromise();                        // Get a Promise back when the generator finishes
    });

    it('auth.json contains the credentials specified by the user', function () {
      var expected = {
        vcap: {
          services: {
            cloudantNoSQLDB: [{
              credentials: {
                host: 'bluemix.cloudant',
                url: '',
                username: 'admin',
                password: 'password',
                port: 443
              }
            }],
            'compose-for-redis': [{
              credentials: {
                uri: 'redis://admin:password@bluemix.redis:443'
              }
            }],
            'Object-Storage': [{
              credentials: {
                'auth_url': '',
                'project': '',
                'projectId': 'PROJECT_ID',
                'region': 'earth',
                'userId': 'USER_ID',
                'username': '',
                'password': 'password',
                'domainId': '',
                'domainName': '',
                'role': ''
              }
            }],
            AdvancedMobileAccess: [{
              credentials: {
                'clientId': 'CLIENT_ID',
                'oauthServerUrl': '',
                'profilesUrl': '',
                'secret': 'APP_ID_SECRET',
                'tenantId': 'TENANT_ID',
                'version': 3
              }
            }],
            'WatsonConversation': [{
              credentials: {
                'username': 'WC_USERNAME',
                'password': 'WC_PASSWORD',
                'url': 'WC_URL'
              }
            }],
            'AlertNotification': [{
              credentials: {
                'name': 'AN_USERNAME',
                'password': 'AN_PASSWORD',
                'url': 'AN_URL'
              }
            }]
          }
        }
      };
      assert.jsonFileContent('auth.json', expected);
    });
  });

  describe('Bluemix where service plan type is not provided', function () {
    var runContext;

    before(function () {
      runContext = helpers.run(appGeneratorPath)
                          .withOptions({ 'skip-build': true })
                          .withPrompts({
                            appType: 'Scaffold a starter',
                            name: 'notes',
                            dir: 'notes',
                            appPattern: 'Basic',
                            services: ['Cloudant', 'Redis', 'Object Storage', 'AppID', 'Auto-scaling', 'Watson Conversation', 'Alert Notification'],
                            configure: ['Cloudant / CouchDB', 'Redis', 'Object Storage', 'AppID', 'Watson Conversation', 'Alert Notification'],
                            cloudantName: 'cloudantService',
                            redisName: 'redisService',
                            objectstorageName: 'objStoreService',
                            appIDName: 'appIDService',
                            watsonConversationName: 'watsonConversationService',
                            alertNotificationName: 'alertNotificationService'
                          });
      return runContext.toPromise();                        // Get a Promise back when the generator finishes
    });

    it('sets the correct plan for cloudant', function () {
      assert.fileContent('.bluemix/pipeline.yml', '"Lite" "cloudantService"')
    });

    it('sets the correct plan for redis', function () {
      assert.fileContent('.bluemix/pipeline.yml', '"Standard" "redisService"')
    });

    it('sets the correct plan for object storage', function () {
      assert.fileContent('.bluemix/pipeline.yml', '"Free" "objStoreService"')
    });

    it('sets the correct plan for appID', function () {
      assert.fileContent('.bluemix/pipeline.yml', '"Graduated tier" "appIDService"')
    });

    it('sets the correct plan for watson conversation', function () {
      assert.fileContent('.bluemix/pipeline.yml', '"Free" "watsonConversationService"')
    });

    it('sets the correct plan for alert notification', function () {
      assert.fileContent('.bluemix/pipeline.yml', '"Authorized Users" "alertNotificationService"')
    });
  });

});
