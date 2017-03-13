/*
 * Copyright IBM Corporation 2016
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
var debug = require('debug')('generator-swiftserver:app');

var helpers = require('../lib/helpers');
var validateDirName = helpers.validateDirName;
var validateAppName = helpers.validateAppName;
var validateCredential = helpers.validateRequiredCredential;
var validatePort = helpers.validatePort;
var generateServiceName = helpers.generateServiceName;
var actions = require('../lib/actions');
var ensureEmptyDirectory = actions.ensureEmptyDirectory;

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

    promptCapabilities: function() {
      if (this.skipPrompting) return;
      var done = this.async();

      var self = this;
      function displayName(property) {
        switch (property) {
          case 'web':         return 'Static web file serving';
          case 'hostSwagger': return 'OpenAPI / Swagger endpoint';
          case 'metrics':     return 'Embedded metrics dashboard';
          case 'docker':      return 'Docker files';
          case 'bluemix':     return 'Bluemix cloud deployment';
          default:
            self.env.error(chalk.red(`Internal error: unknown property ${property}`));
        }
      }

      var choices = ['metrics', 'docker', 'bluemix'];

      if (this.appType === 'scaffold') {
        choices.unshift('hostSwagger');
        choices.unshift('web');
      }

      var prompts = [{
        name: 'capabilities',
        type: 'checkbox',
        message: 'Select capabilities:',
        choices: choices.map(displayName),
        default: choices.map(displayName)
      }];
      this.prompt(prompts, function(answers) {
        choices.forEach(function(choice) {
          this[choice] = (answers.capabilities.indexOf(displayName(choice)) !== -1);
        }.bind(this));
        done();
      }.bind(this));
    },

    promptServicesForScaffoldLocal: function() {
      if (this.skipPrompting) return;
      if (this.appType !== 'scaffold') return;
      if (this.bluemix) return;
      var done = this.async();

      var choices = ['CouchDB', 'MongoDB', 'Redis'];

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
        if (answers.services.indexOf('MongoDB') !== -1) {
          this._addService('mongodb', { name: 'mongodb' });
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

      var choices = ['Cloudant', 'MongoDB', 'Redis', 'Object Storage', 'AppID', 'Auto-scaling'];

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
        if (answers.services.indexOf('MongoDB') !== -1) {
          this._addService('mongodb', { name: generateServiceName(this.appname, 'MongoDB') });
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
          case 'cloudant':      return 'Cloudant / CouchDB';
          case 'mongodb':       return 'MongoDB';
          case 'redis':         return 'Redis';
          case 'objectstorage': return 'Object Storage';
          case 'appid':         return 'AppID';
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
        { name: 'cloudantHost', message: 'Enter host name:' },
        {
          name: 'cloudantPort',
          message: 'Enter port:',
          validate: (port) => validatePort(port) || !port,
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

    promptConfigureMongoDB: function() {
      if (this.skipPrompting) return;
      if (!this.servicesToConfigure) return;
      if (!this.servicesToConfigure.mongodb) return;
      var done = this.async();

      this.log();
      this.log('Configure MongoDB');
      var prompts = [
        { name: 'mongodbHost', message: 'Enter host name:' },
        {
          name: 'mongodbPort',
          message: 'Enter port:',
          validate: (port) => validatePort(port) || !port,
          filter: (port) => (port ? parseInt(port) : port)
        },
        { name: 'mongodbUsername', message: 'Enter username:' },
        { name: 'mongodbPassword', message: 'Enter password:', type: 'password' }
      ];
      this.prompt(prompts, function(answers) {
        this.services.mongodb[0].credentials = {
          host: answers.mongodbHost || undefined,
          port: answers.mongodbPort || undefined,
          username: answers.mongodbUsername || undefined,
          password: answers.mongodbPassword || undefined
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
        { name: 'redisHost', message: 'Enter host name:' },
        {
          name: 'redisPort',
          message: 'Enter port:',
          validate: (port) => validatePort(port) || !port,
          filter: (port) => (port ? parseInt(port) : port)
        },
        { name: 'redisPassword', message: 'Enter password:', type: 'password' }
      ];
      this.prompt(prompts, function(answers) {
        this.services.redis[0].credentials = {
          host: answers.redisHost || undefined,
          port: answers.redisPort || undefined,
          password: answers.redisPassword || undefined
        };
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
        { name: 'objectstorageRegion',     message: 'Enter region:' },
        { name: 'objectstorageProjectId',  message: 'Enter project ID:' },
        { name: 'objectstorageUserId',     message: 'Enter user ID:' },
        { name: 'objectstoragePassword',   message: 'Enter password:', type: 'password' }
      ];
      this.prompt(prompts, function(answers) {
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
        { name: 'appidTenantId', message: 'Enter tenant ID:' },
        { name: 'appidClientId', message: 'Enter client ID:' },
        { name: 'appidSecret',   message: 'Enter secret:', type: 'password' }
      ];
      this.prompt(prompts, function(answers) {
        this.services.appid[0].credentials = {
          tenantId: answers.appidTenantId || undefined,
          clientId: answers.appidClientId || undefined,
          secret:   answers.appidSecret || undefined
        };
        done();
      }.bind(this));
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
      hostSwagger: this.hostSwagger || undefined,
      services: this.services || {},
      crudservice: this.crudservice,
      capabilities: {
        metrics: this.metrics || undefined,
        autoscale: this.autoscale || undefined
      },
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
            destinationSet: (this.destinationSet === true)
          }
        },
        this.options.testmode ? null : { local: require.resolve('../refresh')}
      );
    },

    buildApp: function() {
      if (this.skipBuild || this.options['skip-build']) return;

      this.composeWith(
        'swiftserver:build',
        {},
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
