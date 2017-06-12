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

'use strict';
var generators = require('yeoman-generator');

var chalk = require('chalk');
var path = require('path');
var fs = require('fs');
var Rsync = require('rsync');
var debug = require('debug')('generator-swiftserver:app');
var swaggerize = require('../refresh/fromswagger/swaggerize');

var helpers = require('../lib/helpers');
var validateDirName = helpers.validateDirName;
var validateAppName = helpers.validateAppName;
var validateCredential = helpers.validateRequiredCredential;
var validatePort = helpers.validatePort;
var validateFilePath = helpers.validateFilePath;
var generateServiceName = helpers.generateServiceName;
var ignoreFile = helpers.ignoreFile;
var actions = require('../lib/actions');
var ensureEmptyDirectory = actions.ensureEmptyDirectory;
var sdkHelper = require('../lib/sdkGenHelper');
var performSDKGeneration = sdkHelper.performSDKGeneration;
var extractNewContent = sdkHelper.extractNewContent;
var integrateServerSDK = sdkHelper.integrateServerSDK;


module.exports = generators.Base.extend({

  constructor: function() {
    generators.Base.apply(this, arguments);

    // Allow the user to pass the application name into the generator directly
    this.argument('name', {
      desc: 'Name of the application to scaffold.',
      required: false,
      type: String
    });

    this.option('skip-build', {
      type: Boolean,
      desc: 'Skip building the generated application',
      defaults: false
    });

    this.option('single-shot', {
      type: Boolean,
      desc: 'Creates application without including generator metadata files',
      defaults: false
    });
  },

  initializing: {
    ensureNotInProject: actions.ensureNotInProject,

    initSpec: function() {
      if (this.options.spec) {
        try {
          this.spec = JSON.parse(this.options.spec);
          this.skipPrompting = true;
        } catch (err) {
          this.env.error(chalk.red(err));
        }
      }
    },

    initAppName: function() {
      if (this.skipPrompting) return;
      this.appname = null; // Discard yeoman default appname
      this.skipPromptingAppName = false;
      if (this.name) {
        // User passed a desired application name as an argument
        var validation = validateAppName(this.name);
        if (validation === true) {
          // Desired application name is valid, skip prompting for it
          // later
          this.appname = this.name;
          this.skipPromptingAppName = true;
        } else {
          // Log reason for validation failure, if provided
          validation = validation || 'Application name not valid';
          debug(this.name, ' is not valid because ', validation);
          this.log(validation);
        }
      }

      // save the initial directory for use by the fromSwagger processing.
      this.initialWorkingDir = process.cwd();

      if (this.appname === null) {
        // Fall back to name of current working directory
        // Normalize if it contains special characters
        var sanitizedCWD = path.basename(process.cwd()).replace(/[\/@\s\+%:\.]+?/g, '-');
        // We hope that sanitizedCWD is always valid, but check just
        // in case it isn't
        if (validateAppName(sanitizedCWD) === true) {
          this.appname = sanitizedCWD;
        } else {
          // Fall back again to a known valid name
          this.log('Failed to produce a valid application name from the current working directory');
          debug(sanitizedCWD, ' is not a valid application name and defaulting to \'app\'');
          this.appname = 'app';
        }
      }
    }
  },

  _addService: function(serviceType, service) {
    this.services = this.services || {};
    this.services[serviceType] = this.services[serviceType] || [];
    this.services[serviceType].push(service);
  },

  prompting: {
    promptAppName: function() {
      if (this.skipPrompting) return;
      if (this.skipPromptingAppName) { return; }

      var done = this.async();
      var prompts = [
        {
          name: 'name',
          message: 'What\'s the name of your application?',
          default: this.appname,
          validate: validateAppName
        }
      ];
      this.prompt(prompts, function(props) {
        this.appname = props.name;
        done();
      }.bind(this));
    },

    /*
     * Configure the destination directory, asking the user if required.
     * Set up the generator environment so that destinationRoot is set
     * to point to the directory where we want to generate code.
     */
    promptAppDir: function() {
      if (this.skipPrompting) return;
      if (this.appname === path.basename(this.destinationRoot())) {
        // When the project name is the same as the current directory,
        // we are assuming the user has already created the project dir
        this.log('working directory is %s', path.basename(this.destinationRoot()));
        this.destinationSet = true;
        return;
      }

      var done = this.async();
      var prompts = [
        {
          name: 'dir',
          message: 'Enter the name of the directory to contain the project:',
          default: this.appname,
          validate: validateDirName
        }
      ];
      this.prompt(prompts, function(answers) {
        if (answers.dir !== '.') {
          this.destinationSet = true;
          this.destinationRoot(answers.dir);
        }
        done();
      }.bind(this));
    },

    ensureEmptyDirectory: function() {
      if (this.skipPrompting) return;
      actions.ensureEmptyDirectory.call(this);
    },

    promptAppType: function() {
      if (this.skipPrompting) return;

      var done = this.async();
      var prompts = [{
        name: 'appType',
        type: 'list',
        message: 'Select type of project:',
        choices: [ 'Scaffold a starter', 'Generate a CRUD application' ]
      }];
      this.prompt(prompts, function(answers) {
        switch (answers.appType) {
          case 'Scaffold a starter':          this.appType = 'scaffold'; break;
          case 'Generate a CRUD application': this.appType = 'crud'; break;
          default:
            this.env.error(chalk.red(`Internal error: unknown application type ${answers.appType}`));
        }
        done();
      }.bind(this));
    },

    /*
     * Determine the application pattern so that the capability
     * defaults can be set appropriately.
     */
    promptApplicationPattern: function() {
      if (this.skipPrompting) return;
      if (this.appType !== 'scaffold') return;

      var done = this.async();
      var prompts = [{
        name: 'appPattern',
        type: 'list',
        message: 'Select capability presets for application pattern:',
        choices: [ 'Basic', 'Web', 'Backend for frontend' ],
        default: 'Basic'
      }];
      this.prompt(prompts, function(answers) {
        switch (answers.appPattern) {
          case 'Basic':                this.appPattern = 'Basic'; break;
          case 'Web':                  this.appPattern = 'Web'; break;
          case 'Backend for frontend': this.appPattern = 'Bff'; break;
          default:
            this.env.error(chalk.red(`Internal error: unknown application pattern ${answers.appPattern}`));
        }
        done();
      }.bind(this));
    },

    promptCapabilities: function() {
      if (this.skipPrompting) return;
      var done = this.async();

      var self = this;
      function displayName(property) {
        switch (property) {
          case 'web':              return 'Static web file serving';
          case 'hostSwagger':      return 'OpenAPI / Swagger endpoint';
          case 'swaggerUI':        return 'Swagger UI';
          case 'metrics':          return 'Embedded metrics dashboard';
          case 'docker':           return 'Docker files';
          case 'fromSwagger':      return 'From Swagger';
          case 'endpoints':        return 'Generate endpoints';
          case 'bluemix':          return 'Bluemix cloud deployment';
          default:
            self.env.error(chalk.red(`Internal error: unknown property ${property}`));
        }
      }

      function defaultCapabilities(appPattern) {
        switch (appPattern) {
          case 'Basic': return ['Docker files',
                                'Embedded metrics dashboard',
                                'Bluemix cloud deployment'];
          case 'Web':   return ['Static web file serving',
                                'Embedded metrics dashboard',
                                'Docker files',
                                'Bluemix cloud deployment'];
          case 'Bff':   return ['Swagger UI',
                                'Embedded metrics dashboard',
                                'Static web file serving',
                                'Docker files',
                                'Bluemix cloud deployment'];
          default:
            self.env.error(chalk.red(`Internal error: unknown application pattern ${appPattern}`));
        }
      }

      var choices = ['metrics', 'docker', 'bluemix'];
      var defaults = choices.map(displayName);

      if (this.appType === 'scaffold') {
        choices.unshift('swaggerUI');
        choices.unshift('web');
        defaults = defaultCapabilities(this.appPattern);
      }

      var prompts = [{
        name: 'capabilities',
        type: 'checkbox',
        message: 'Select capabilities:',
        choices: choices.map(displayName),
        default: defaults
      }];
      this.prompt(prompts, function(answers) {
        choices.forEach(function(choice) {
          this[choice] = (answers.capabilities.indexOf(displayName(choice)) !== -1);
        }.bind(this));
        done();
      }.bind(this));
    },

    promptGenerateEndpoints: function() {
      if (this.skipPrompting) return;
      if (this.appType !== 'scaffold') return;
      var done = this.async();
      var choices = ['Swagger file serving endpoint', 'Endpoints from swagger file'];

      var prompts = [{
        name: 'endpoints',
        type: 'checkbox',
        message: 'Select endpoints to generate:',
        choices: choices
      }];
      this.prompt(prompts, function(answers) {
        if (answers.endpoints) {
          if (answers.endpoints.indexOf('Swagger file serving endpoint') !== -1) {
            this.hostSwagger = true;
          }
          if (answers.endpoints.indexOf('Endpoints from swagger file') !== -1) {
            this.swaggerEndpoints = true;
          }
        }
        done();
      }.bind(this));
    },

    promptSwaggerEndpoints: function() {
      if (this.skipPrompting) return;
      if (this.appType !== 'scaffold') return;
      if (!this.swaggerEndpoints) return;
      var done = this.async();
      var choices = {'customSwagger': 'Custom swagger file',
                     'exampleEndpoints': 'Example swagger file'};

      this.hostSwagger = true;
      var prompts = [{
        name: 'swaggerChoice',
        type: 'list',
        message: 'Swagger file to use to create endpoints and companion iOS SDK:',
        choices: [choices.customSwagger, choices.exampleEndpoints],
        default: []
      },{
        name: 'path',
        type: 'input',
        message: 'Provide the path to a swagger file:',
        filter: function(response) { return response.trim(); },
        validate: validateFilePath,
        when: function(question) {
                return (question.swaggerChoice === choices.customSwagger);
              }
      }];
      this.prompt(prompts, function(answers) {
        if (answers.swaggerChoice === choices.exampleEndpoints) {
          // this.exampleEndpoints = true;
          this.fromSwagger = path.join(__dirname, '../refresh/templates/common/productSwagger.yaml');
        } else if (answers.path) {
          var httpPattern = new RegExp(/^https?:\/\/\S+/);

          if (httpPattern.test(answers.path)) {
            this.fromSwagger = answers.path;
          } else {
            this.fromSwagger = path.resolve(this.initialWorkingDir, answers.path);
          }
        }
        done();
      }.bind(this));
    },

    promptSwiftServerSwaggerFiles: function () {
      if (this.skipPrompting) return;
      var done = this.async();

      var depth = 0;
      var prompts = [{
        name: 'serverSwaggerInput' + depth,
        type: 'confirm',
        message: 'Would you like to generate a Swift server SDK from a Swagger file?',
        default: false
      }, {
        when: function(props) { return props[Object.keys(props)[0]]; },
        name: 'serverSwaggerInputPath' + depth,
        type: 'input',
        message: 'Enter Swagger yaml file path:',
        filter: function(response) { return response.trim(); },
        validate: validateFilePath,
      }];
      
      function promptUser() {

        this.prompt(prompts, function (answers) {
          // Creating and accessing dynamic answer keys for yeoman-test compatability.
          // It needs unique keys in order to simulate the generation of multiple swagger file paths.
          if (answers['serverSwaggerInput' + depth]) {
            if (this.serverSwaggerFiles === undefined) {
              this.serverSwaggerFiles = [];
            }
            if(!this.serverSwaggerFiles.includes(answers['serverSwaggerInputPath' + depth])) {
              this.serverSwaggerFiles.push(answers['serverSwaggerInputPath' + depth]);
            } else {
              this.log(chalk.yellow('This Swagger file is already being used'));
            }
            depth += 1;
            prompts[0].name = prompts[0].name.slice(0, -1) + depth;
            prompts[1].name = prompts[1].name.slice(0, -1) + depth;
            promptUser.call(this);
          } else {
            done();
          }
        }.bind(this));
      };
      promptUser.call(this);
    },

    promptServicesForScaffoldLocal: function() {
      if (this.skipPrompting) return;
      if (this.appType !== 'scaffold') return;
      if (this.bluemix) return;
      var done = this.async();

      var choices = ['CouchDB', 'Redis'];

      var prompts = [{
        name: 'services',
        type: 'checkbox',
        message: 'Generate boilerplate for local services:',
        choices: choices,
        default: []
      }];
      this.prompt(prompts, function(answers) {
        if (answers.services.indexOf('CouchDB') !== -1) {
          this._addService('cloudant', { name: 'couchdb' });
        }
        if (answers.services.indexOf('Redis') !== -1) {
          this._addService('redis', { name: 'redis' });
        }
        done();
      }.bind(this));
    },

    promptServicesForScaffoldBluemix: function() {
      if (this.skipPrompting) return;
      if (this.appType !== 'scaffold') return;
      if (!this.bluemix) return;
      var done = this.async();

      var choices = ['Cloudant', 'Redis', 'Object Storage', 'AppID', 'Auto-scaling', 'Watson Conversation', 'Alert Notification', 'Push Notifications'];

      var prompts = [{
        name: 'services',
        type: 'checkbox',
        message: 'Generate boilerplate for Bluemix services:',
        choices: choices,
        default: []
      }];
      this.prompt(prompts, function(answers) {
        if (answers.services.indexOf('Cloudant') !== -1) {
          this._addService('cloudant', { name: generateServiceName(this.appname, 'Cloudant') });
        }
        if (answers.services.indexOf('Redis') !== -1) {
          this._addService('redis', { name: generateServiceName(this.appname, 'Redis') });
        }
        if (answers.services.indexOf('Object Storage') !== -1) {
          this._addService('objectstorage', { name: generateServiceName(this.appname, 'ObjectStorage') });
        }
        if (answers.services.indexOf('AppID') !== -1) {
          this._addService('appid',  { name: generateServiceName(this.appname, 'AppID') });
        }
        if (answers.services.indexOf('Watson Conversation') !== -1) {
          this._addService('watsonconversation',  { name: generateServiceName(this.appname, 'WatsonConversation') });
        }
        if (answers.services.indexOf('Alert Notification') !== -1) {
          this._addService('alertnotification',  { name: generateServiceName(this.appname, 'AlertNotification') });
        }
        if (answers.services.indexOf('Push Notifications') !== -1) {
          this._addService('pushnotifications',  { name: generateServiceName(this.appname, 'PushNotifications') });
        }
        if (answers.services.indexOf('Auto-scaling') !== -1) {
          this.autoscale = generateServiceName(this.appname, 'AutoScaling');
        }
        done();
      }.bind(this));
    },

    /*
     * Configure the data store, asking the user what type of data store they
     * are using and configuring the data store if needed. These answers will
     * be the basis for the config.json.
     */
    promptDataStoreForCRUD: function() {
      if (this.skipPrompting) return;
      if (this.appType !== 'crud') return;
      var done = this.async();
      var prompts = [
        {
          name: 'store',
          message: 'Select data store:',
          type: 'list',
          choices: ['Memory (for development purposes)', 'Cloudant / CouchDB'],
          filter: (store) => store.split(" ")[0]
        }
      ];
      this.prompt(prompts, function(answer) {
        // NOTE(tunniclm): no need to do anything for memory it is the default
        // if no crudservice is passed to the refresh generator
        if (answer.store === 'Cloudant') {
          this._addService('cloudant', { name: 'crudDataStore' });
          this.crudservice = 'crudDataStore';
        }
        done();
      }.bind(this));
    },

    promptServicesForCRUDBluemix: function() {
      if (this.skipPrompting) return;
      if (this.appType !== 'crud') return;
      if (!this.bluemix) return;
      var done = this.async();

      var choices = ['Auto-scaling'];

      var prompts = [{
        name: 'services',
        type: 'checkbox',
        message: 'Generate boilerplate for Bluemix services:',
        choices: choices,
        default: []
      }];
      this.prompt(prompts, function(answers) {
        if (answers.services.indexOf('Auto-scaling') !== -1) {
          this.autoscale = generateServiceName(this.appname, 'AutoScaling');
        }
        done();
      }.bind(this));
    },

    // NOTE(tunniclm): This part of the prompting assumes there can only
    // be one of each type of service.
    promptConfigureServices: function() {
      if (this.skipPrompting) return;
      if (!this.services) return;
      if (Object.keys(this.services).length == 0) return;
      var done = this.async();

      var self = this;
      function serviceDisplayType(serviceType) {
        switch (serviceType) {
          case 'cloudant':            return 'Cloudant / CouchDB';
          case 'redis':               return 'Redis';
          case 'objectstorage':       return 'Object Storage';
          case 'appid':               return 'AppID';
          case 'watsonconversation':  return 'Watson Conversation';
          case 'alertnotification':  return 'Alert Notification';
          case 'pushnotifications':  return 'Push Notifications';
          default:
            self.env.error(chalk.red(`Internal error: unknown service type ${serviceType}`));
        }
      }

      var choices = Object.keys(this.services);
      var prompts = [{
        name: 'configure',
        type: 'checkbox',
        message: 'Configure service credentials (leave unchecked for defaults):',
        choices: choices.map(serviceDisplayType),
        default: []
      }];
      this.prompt(prompts, function(answers) {
        this.servicesToConfigure = {};
        choices.forEach(function(serviceType) {
          this.servicesToConfigure[serviceType] =
            (answers.configure.indexOf(serviceDisplayType(serviceType)) !== -1);
        }.bind(this));
        done();
      }.bind(this));
    },

    promptConfigureCloudant: function() {
      if (this.skipPrompting) return;
      if (!this.servicesToConfigure) return;
      if (!this.servicesToConfigure.cloudant) return;
      var done = this.async();

      this.log();
      this.log('Configure Cloudant / CouchDB');
      var prompts = [
        { name: 'cloudantName', message: 'Enter name (blank for default):',
          when: (answers) => this.bluemix && this.appType !== 'crud'
        },
        { name: 'cloudantHost', message: 'Enter host name:' },
        {
          name: 'cloudantPort',
          message: 'Enter port:',
          validate: (port) => validatePort(port),
          filter: (port) => (port ? parseInt(port) : port)
        },
        {
          name: 'cloudantSecured',
          message: 'Secure (https)?',
          type: 'confirm',
          default: false,
        },
        { name: 'cloudantUsername', message: 'Enter username (blank for none):' },
        {
          name: 'cloudantPassword',
          message: 'Enter password:',
          type: 'password',
          when: (answers) => answers.cloudantUsername,
          validate: (password) => validateCredential(password)
        }
      ];
      this.prompt(prompts, function(answers) {
        this.services.cloudant[0].name = answers.cloudantName || this.services.cloudant[0].name;
        this.services.cloudant[0].credentials = {
          host: answers.cloudantHost || undefined,
          port: answers.cloudantPort || undefined,
          secured: answers.cloudantSecured || undefined,
          username: answers.cloudantUsername || undefined,
          password: answers.cloudantPassword || undefined
        };
        done();
      }.bind(this));
    },

    promptConfigureRedis: function() {
      if (this.skipPrompting) return;
      if (!this.servicesToConfigure) return;
      if (!this.servicesToConfigure.redis) return;
      var done = this.async();

      this.log();
      this.log('Configure Redis');
      var prompts = [
        { name: 'redisName', message: 'Enter name (blank for default):',
          when: (answers) => this.bluemix
        },
        { name: 'redisHost', message: 'Enter host name:' },
        {
          name: 'redisPort',
          message: 'Enter port:',
          validate: (port) => validatePort(port),
          filter: (port) => (port ? parseInt(port) : port)
        },
        { name: 'redisPassword', message: 'Enter password:', type: 'password' }
      ];
      this.prompt(prompts, function(answers) {
        this.services.redis[0].name = answers.redisName || this.services.redis[0].name;
        this.services.redis[0].credentials = {
          host: answers.redisHost || undefined,
          port: answers.redisPort || undefined,
          password: answers.redisPassword || undefined
        };
        done();
      }.bind(this));
    },

    promptConfigureWatsonConversation: function() {
      if (this.skipPrompting) return;
      if (!this.servicesToConfigure) return;
      if (!this.servicesToConfigure.watsonconversation) return;
      var done = this.async();

      this.log();
      this.log('Configure Watson Conversation');
      var prompts = [
        { name: 'watsonConversationName', message: 'Enter name (blank for default):',
          when: (answers) => this.bluemix
        },
        { name: 'watsonConversationUsername', message: 'Enter username (blank for none):' },
        { name: 'watsonConversationPassword', message: 'Enter password:', type: 'password' },
        { name: 'watsonConversationUrl', message: 'Enter url (blank for none):' },
        { name: 'watsonConversationVersion', message: 'Enter version (blank for none):' }
      ];
      this.prompt(prompts, function(answers) {
        this.services.watsonconversation[0].name = answers.watsonConversationName || this.services.watsonconversation[0].name;
        this.services.watsonconversation[0].version = answers.watsonConversationVersion || this.services.watsonconversation[0].version;
        this.services.watsonconversation[0].credentials = {
          username: answers.watsonConversationUsername || undefined,
          password: answers.watsonConversationPassword || undefined,
          url: answers.watsonConversationUrl || undefined
        };
        done();
      }.bind(this));
    },

    promptConfigureAlertNotification: function() {
      if (this.skipPrompting) return;
      if (!this.servicesToConfigure) return;
      if (!this.servicesToConfigure.alertnotification) return;
      var done = this.async();

      this.log();
      this.log('Configure Alert Notification');
      var prompts = [
        { name: 'alertNotificationName', message: 'Enter service name (blank for default):',
          when: (answers) => this.bluemix
        },
        { name: 'alertNotificationUsername', message: 'Enter username (blank for none):' },
        { name: 'alertNotificationPassword', message: 'Enter password:', type: 'password' },
        { name: 'alertNotificationUrl', message: 'Enter url (blank for none):' }
      ];
      this.prompt(prompts, function(answers) {
        this.services.alertnotification[0].name = answers.alertNotificationName || this.services.alertnotification[0].name;
        this.services.alertnotification[0].credentials = {
          name: answers.alertNotificationUsername || undefined,
          password: answers.alertNotificationPassword || undefined,
          url: answers.alertNotificationUrl || undefined
        };
        done();
      }.bind(this));
    },

    promptConfigurePushNotifications: function() {
      if (this.skipPrompting) return;
      if (!this.servicesToConfigure) return;
      if (!this.servicesToConfigure.pushnotifications) return;
      var done = this.async();

      this.log();
      this.log('Configure Push Notifications');
      
      var prompts = [
        { name: 'pushNotificationsName', message: 'Enter service name (blank for default):',
          when: (answers) => this.bluemix
        },
        { name: 'pushNotificationsAppGuid', message: 'Enter app GUID:' },
        { name: 'pushNotificationsAppSecret', message: 'Enter app secret:', type: 'password' },
        {
          name: 'pushNotificationsRegion',
          type: 'list',
          message: 'Enter Bluemix region:',
          choices: [ 'US South', 'United Kingdom', 'Sydney' ],
          default: 'US South'
        }
      ];
      this.prompt(prompts, function(answers) {
        this.services.pushnotifications[0].name = answers.pushNotificationsName || this.services.pushnotifications[0].name;
        this.services.pushnotifications[0].credentials = {
          appGuid: answers.pushNotificationsAppGuid || undefined,
          appSecret: answers.pushNotificationsAppSecret || undefined
        };
        switch (answers.pushNotificationsRegion) {
          case 'US South':        this.services.pushnotifications[0].region = 'US_SOUTH'; break;
          case 'United Kingdom':  this.services.pushnotifications[0].region = 'UK'; break;
          case 'Sydney':          this.services.pushnotifications[0].region = 'SYDNEY'; break;
          default:
            this.env.error(chalk.red(`Internal error: unknown region ${answers.pushNotificationsRegion}`));
        }
        done();
      }.bind(this));
    },

    promptConfigureObjectStorage: function() {
      if (this.skipPrompting) return;
      if (!this.servicesToConfigure) return;
      if (!this.servicesToConfigure.objectstorage) return;
      var done = this.async();

      this.log();
      this.log('Configure Object Storage');
      var prompts = [
        /*
        { name: 'objectstorageAuth_url'    message: 'Enter auth url:' },
        { name: 'objectstorageDomainId',   message: 'Enter domain ID:' },
        { name: 'objectstorageDomainName', message: 'Enter domain name:' },
        { name: 'objectstorageProject',    message: 'Enter project:' },
        { name: 'objectstorageRole',       message: 'Enter role:' },
        { name: 'objectstorageUsername',   message: 'Enter username:' },
        */
        { name: 'objectstorageName', message: 'Enter name (blank for default):',
          when: (answers) => this.bluemix
        },
        { name: 'objectstorageRegion',     message: 'Enter region:' },
        { name: 'objectstorageProjectId',  message: 'Enter project ID:' },
        { name: 'objectstorageUserId',     message: 'Enter user ID:' },
        { name: 'objectstoragePassword',   message: 'Enter password:', type: 'password' }
      ];
      this.prompt(prompts, function(answers) {
        this.services.objectstorage[0].name = answers.objectstorageName || this.services.objectstorage[0].name;
        this.services.objectstorage[0].credentials = {
          /*
          auth_url:   answers.objectstorageAuth_url || undefined,
          domainId:   answers.objectstorageDomainId || undefined,
          domainName: answers.objectstorageDomainName || undefined,
          project:    answers.objectstorageProject || undefined,
          role:       answers.objectstorageRole || undefined,
          username:   answers.objectstorageUsername || undefined,
          */
          region:    answers.objectstorageRegion || undefined,
          projectId: answers.objectstorageProjectId || undefined,
          userId:    answers.objectstorageUserId || undefined,
          password:  answers.objectstoragePassword || undefined
        };
        done();
      }.bind(this));
    },

    promptConfigureAppID: function() {
      if (this.skipPrompting) return;
      if (!this.servicesToConfigure) return;
      if (!this.servicesToConfigure.appid) return;
      var done = this.async();

      this.log();
      this.log('Configure AppID');
      var prompts = [
        { name: 'appIDName', message: 'Enter name (blank for default):',
          when: (answers) => this.bluemix
        },
        { name: 'appidTenantId', message: 'Enter tenant ID:' },
        { name: 'appidClientId', message: 'Enter client ID:' },
        { name: 'appidSecret',   message: 'Enter secret:', type: 'password' }
      ];
      this.prompt(prompts, function(answers) {
        this.services.appid[0].name = answers.appIDName || this.services.appid[0].name;
        this.services.appid[0].credentials = {
          tenantId: answers.appidTenantId || undefined,
          clientId: answers.appidClientId || undefined,
          secret:   answers.appidSecret || undefined
        };
        done();
      }.bind(this));
    }
  },

  generateSDKs: function() {
    if(!this.fromSwagger && !this.serverSwaggerFiles) return;
    this.log(chalk.green('Generating SDK(s) from swagger file(s)...'));
    var done = this.async();
    var self = this; // local copy to be used in callbacks

    // Cover the different cases
    if(self.fromSwagger && self.serverSwaggerFiles === undefined) {
      geniOS(done);
    } else if(self.fromSwagger && self.serverSwaggerFiles !== undefined) {
      geniOS(function() {
        genServer(done);
      })
    } else if(!self.fromSwagger && self.serverSwaggerFiles !== undefined) {
      genServer(done);
    }

    function geniOS(callback) {
      swaggerize.parse.call(self, self.fromSwagger, function(loadedApi, parsed) {
        performSDKGeneration(self.appname + '_iOS_SDK', 'ios_swift', JSON.stringify(loadedApi), function () {
          callback();
        });
      });
    }

    function genServer(callback) {
      var numFinished = 0;
      for (var index = 0; index < self.serverSwaggerFiles.length; index++) {
      
        swaggerize.parse.call(self, self.serverSwaggerFiles[index], function(loadedApi, parsed) {

          if (loadedApi['info']['title'] == undefined) {
            console.error(err);
          } else {
            var sdkName = loadedApi['info']['title'].replace(/ /g, '_') + '_ServerSDK';
            performSDKGeneration(sdkName, 'server_swift', JSON.stringify(loadedApi), function() {

              extractNewContent(sdkName, function(sdkTargets, sdkPackages) {

                if(sdkTargets.length > 0) {
                  if(self.sdkTargets === undefined) {
                    self.sdkTargets = [];
                  }
                  self.sdkTargets.push(sdkTargets);
                }
                if(sdkPackages.length > 0) {
                  self.sdkPackages = sdkPackages;
                }
                numFinished += 1;
                if(numFinished === self.serverSwaggerFiles.length) {
                  callback();
                }
              })
            })
          }
        });
      }
    }
  },

  createSpecFromAnswers: function() {
    if (this.skipPrompting) return;
    // NOTE(tunniclm): This spec object may not exploit all possible functionality,
    // some may only be available via non-prompting route.
    this.spec = {
      appType: this.appType,
      appName: this.appname,
      bluemix: this.bluemix || undefined,
      docker: this.docker || undefined,
      web: this.web || undefined,
      exampleEndpoints: this.exampleEndpoints || undefined,
      fromSwagger: this.fromSwagger || undefined,
      hostSwagger: this.hostSwagger || undefined,
      swaggerUI: this.swaggerUI || undefined,
      services: this.services || {},
      crudservice: this.crudservice,
      capabilities: {
        metrics: this.metrics || undefined,
        autoscale: this.autoscale || undefined
      },
      sdkTargets: this.sdkTargets || undefined,
      sdkPackages: this.sdkPackages || undefined,
      config: {
        logger: 'helium',
        port: 8080
      }
    };
  },

  install: {

    buildDefinitions: function() {

      // this.composeWith with just the subgenerator name doesn't work with the
      // Yeoman test framework (yeoman-test)

      // Defining settings.local for the path allows Yeoman to call the
      // subgenerators directly when 'integration testing' using yeoman-test.

      // Adding a testmode allows us to stub the subgenerators (for unit testing).
      // (This is to work around https://github.com/yeoman/yeoman-test/issues/16)

      this.composeWith(
        'swiftserver:refresh',
        {
          // Pass in the option to refresh to decided whether or not we create the *-product.yml
          options: {
            apic: this.options.apic,
            specObj: this.spec,
            singleShot: this.options['single-shot'],
            destinationSet: (this.destinationSet === true)
          }
        },
        this.options.testmode ? null : { local: require.resolve('../refresh')}
      );
    },
    
    configureServerSDK: function() {
      if(this.fromSwagger) {
        ignoreFile('/' + this.appname + '_iOS_SDK*');
      }

      if(!this.sdkTargets) return;
      var done = this.async();

      var numFinished = 0, length = this.sdkTargets.length; 
      for (var index = 0; index < length; index++) {
        integrateServerSDK(this.sdkTargets[index], function() {
          numFinished += 1;
          if(numFinished === length) {
            done();
          }
        });
      }
    },

    buildApp: function() {
      if (this.skipBuild || this.options['skip-build']) return;
      this.composeWith(
        'swiftserver:build',
        {
          // Pass in the option of doing single-shot so the appropriate checks are performed
          options: {
            singleShot: this.options['single-shot'],
          }
        },
        this.options.testmode ? null : { local: require.resolve('../build')}
      );
    }
  },

  end: function() {
    // Inform the user what they should do next
    this.log('Next steps:');
    this.log();
    if (this.destinationRoot() && this.destinationRoot() !== '.') {
      this.log('  Change directory to your app');
      this.log(chalk.green('    $ cd ' + this.destinationRoot()));
      this.log();
    }
    if (this.appType === 'crud') {
      var createModelInstruction = '    $ yo swiftserver:model';
      if (process.env.RUN_BY_COMMAND === 'swiftservergenerator') {
        createModelInstruction = '    $ swiftservergenerator --model';
      } else if (process.env.RUN_BY_COMMAND === 'apic') {
        createModelInstruction = '    $ apic create --type model-swiftserver';
      }

      this.log('  Create a model in your app');
      this.log(chalk.green(createModelInstruction));
      this.log();
    }
    this.log('  Run your app');
    this.log(chalk.green('    $ .build/debug/' + this.appname));
    this.log();
  }
});
module.exports._yeoman = generators;
