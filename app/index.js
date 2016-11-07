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
  },

  initializing: {
    ensureNotInProject: actions.ensureNotInProject,

    initAppName: function() {
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
    promptAppName: function() {
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
          this.destinationRoot(answers.dir);
        }
        done();
      }.bind(this));
    },
    ensureEmptyDirectory: actions.ensureEmptyDirectory,
    /*
     * Configure the data store, asking the user what type of data store they
     * are using and configuring the data store if needed. These answers will
     * be the basis for the config.json.
     */
    promptDataStore: function() {
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
        if(answer.store === 'memory') {
          //No need to ask for anything else
          this.store = answer.store;
          done();
          return;
        } else {
          this.storeType = answer.store;
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
          if(!answers.default || answers.credentials) {
            this.store = {
              type: this.storeType,
              host: answers.host || this.defaultHost,
              port: answers.port || this.defaultPort,
              secured: answers.secured || this.defaultSecured,
              username: answers.username,
              password: answers.password
            }
          } else {
            this.store = this.storeType;
          }
          done();
        }.bind(this));
      }.bind(this));
    }
  },

  writing: {
    writeConfig: function() {
      this.config = {
        appName: this.appname,
        store: this.store,
        logger: 'helium',
        port: 8090
      };
      this.fs.writeJSON(this.destinationPath('config.json'), this.config);
    },

    writeGeneratorConfig: function() {
      this.fs.writeJSON(this.destinationPath('.yo-rc.json'), {});
    },

    writePackageSwift: function() {
      let packageSwift = helpers.generatePackageSwift(this.config);
      this.fs.write(this.destinationPath('Package.swift'), packageSwift);
    },

    writeMainSwift: function() {
      this.fs.copy(this.templatePath('main.swift'),
                   this.destinationPath('Sources', this.appname, 'main.swift'));
    },

    writeAppConfigSwift: function() {
      this.fs.copy(this.templatePath('ApplicationConfiguration.swift'),
                   this.destinationPath('Sources', 'Generated', 'ApplicationConfiguration.swift'));
    },

    writeProjectMarker: function() {
      // NOTE(tunniclm): Write a zero-byte file to mark this as a valid project
      // directory
      this.fs.write(this.destinationPath('.swiftservergenerator-project'), '');
    },

    writeModelsDirectory: function() {
      this.fs.write(this.destinationPath('models', '.keep'), '');
    },

    writeNodeWrapper: function() {
      if (this.options.apic) {
        this.fs.copy(this.templatePath('apic-node-wrapper.js'),
                     this.destinationPath('index.js'));
      }
    }
  },

  install: {
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
               apic: this.options.apic
             }
           },
           this.options.testmode ? null : { local: require.resolve('../refresh')});
    },

    buildApp: function() {

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
