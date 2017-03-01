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

    initHeadlessBluemix: function() {
      if (this.options.bluemix) {
        try {
          this.bluemixInfo = this.options.bluemix;
          if (typeof(this.bluemixInfo) === 'string') {
            this.bluemixInfo = JSON.parse(this.bluemixInfo);
          }
          // TODO Do some validation of the bluemix object?
          if (!this.spec) {
            this.env.error(chalk.red('Missing spec'));
          }
          this.skipPrompting = true;
          this.skipBuild = true;
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

  prompting: {
    promptAppType: function() {
      if (this.skipPrompting) return;

      var done = this.async();
      var prompts = [
        {
          name: 'type',
          message: 'Select the type of application',
          type: 'list',
          choices: ['Basic', 'Web', 'CRUD']
        }
      ];
      this.prompt(prompts, function(answer) {
        switch (answer.type) {
        case 'Basic': this.appType = 'basic'; break;
        case 'Web':   this.appType = 'web';   break;
        case 'CRUD':  this.appType = 'crud';  break;
        default:
          this.env.error(chalk.red('Internal error: unknown application type'));
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
          type: 'input',
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
        return;
      }

      var done = this.async();
      var prompts = [
        {
          type: 'input',
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
    /*
     * Configure the data store, asking the user what type of data store they
     * are using and configuring the data store if needed. These answers will
     * be the basis for the config.json.
     */
    promptDataStore: function() {
      if (this.skipPrompting) return;
      var done = this.async();
      var prompts = [
        {
          name: 'store',
          message: 'Select the data store',
          type: 'list',
          choices: ['memory (for development purposes)', 'cloudant'],
          filter: (store) => store.split(" ")[0]
        }
      ];
      this.prompt(prompts, function(answer) {
        this.storeType = answer.store;
        if(answer.store === 'memory') {
          //No need to ask for anything else
          done();
          return;
        }

        this.defaultHost = 'localhost';
        this.defaultPort = 5984;
        this.defaultSecured = false;
        var storeConfigPrompt = [
          {
            name: 'default',
            message: 'Use default configuration for CloudantStore?',
            type: 'confirm',
            default: true
          },
          {
            name: 'host',
            message: 'Enter the host name',
            default: this.defaultHost,
            when: (answers) => !answers.default
          },
          {
            name: 'port',
            message: 'Enter the port number',
            default: this.defaultPort,
            when: (answers) => !answers.default,
            validate: (port) => validatePort(port),
            filter: (port) => parseInt(port)
          },
          {
            name: 'secured',
            message: 'Is this secure?',
            type: 'confirm',
            default: this.defaultSecured,
            when: (answers) => !answers.default
          },
          {
            name: 'credentials',
            message: 'Set credentials?',
            type: 'confirm',
            default: false
          },
          {
            name: 'username',
            message: 'Enter username',
            when: (answers) => answers.credentials,
            validate: (username) => validateCredential(username)
          },
          {
            name: 'password',
            message: 'Enter password',
            type: 'password',
            when: (answers) => answers.credentials,
            validate: (password) => validateCredential(password)
          }
        ];
        this.prompt(storeConfigPrompt, function(answers) {
          this.store = {
            type: this.storeType,
            host: answers.host || this.defaultHost,
            port: answers.port || this.defaultPort,
            secured: answers.secured || this.defaultSecured,
            username: answers.username,
            password: answers.password
          }
          done();
        }.bind(this));
      }.bind(this));
    },

    promptMetrics: function() {
      if (this.skipToInstall) return;
      var done = this.async();
      var prompts = [
        {
          name: 'metrics',
          message: 'Application monitoring/metrics?',
          type: 'confirm',
          default: true
        }
      ];
      this.prompt(prompts, function(answer) {
        this.metrics = (answer.metrics === true);
        done();
      }.bind(this));
    },

    promptCloud: function() {
      if (this.skipToInstall) return;
      var done = this.async();
      var prompts = [
        {
          name: 'cloud',
          message: 'Cloud support?',
          type: 'list',
          choices: ['None', 'Bluemix']
        },
        {
          name: 'autoscale',
          message: 'Bluemix autoscaling?',
          type: 'confirm',
          default: true,
          when: (answers) => (answers.cloud === 'Bluemix')
        }
      ];
      this.prompt(prompts, function(answers) {
        switch (answers.cloud) {
          case 'Bluemix':
            this.bluemix = true;
            this.autoscale = answers.autoscale || undefined;
            break;
        }
        done();
      }.bind(this));
    }
  },

  install: {

    createSpecFromAnswers: function() {
      if (!this.spec) {
        this.spec = {
          appType: this.appType,
          appName: this.appname,
          bluemix: this.bluemix,
          capabilities: {
            metrics: this.metrics,
            autoscale: this.autoscale
          },
          services: {},
          config: {
            logger: 'helium',
            port: 8090
          }
        }
        if (this.storeType === 'cloudant') {
          this.store.name = 'cloudantCrudService';
          this.spec.services['cloudant'] = [this.store];
          this.spec.crudservice = this.store.name;
        }
      }
    },

    buildDefinitions: function() {

      // this.composeWith with just the subgenerator name doesn't work with the
      // Yeoman test framework (yeoman-test)

      // Defining settings.local for the path allows Yeoman to call the
      // subgenerators directly when 'integration testing' using yeoman-test.

      // Adding a testmode allows us to stub the subgenerators (for unit testing).
      // (This is to work around https://github.com/yeoman/yeoman-test/issues/16)

      this.composeWith('swiftserver:refresh', {
             // Pass in the option to refresh to decided whether or not we create the *-product.yml
             options: {
               apic: this.options.apic,
               specObj: this.spec,
               destinationSet: (this.destinationSet === true)
             }
           },
           this.options.testmode ? null : { local: require.resolve('../refresh')});
    },

    buildApp: function() {
      if (this.skipBuild || this.options['skip-build']) return;

      this.composeWith('swiftserver:build',
           {},
           this.options.testmode ? null : { local: require.resolve('../build')});
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
    var createModelInstruction = '    $ yo swiftserver:model';
    if (process.env.RUN_BY_COMMAND === 'swiftservergenerator') {
      createModelInstruction = '    $ swiftservergenerator --model';
    } else if (process.env.RUN_BY_COMMAND === 'apic') {
      createModelInstruction = '    $ apic create --type model-swiftserver';
    }

    this.log('  Create a model in your app');
    this.log(chalk.green(createModelInstruction));
    this.log();
    this.log('  Run the app');
    this.log(chalk.green('    $ .build/debug/' + this.appname));
    this.log();
  }
});
module.exports._yeoman = generators;
