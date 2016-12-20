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
var debug = require('debug')('generator-swiftserver:model');

var actions = require('../lib/actions');
var helpers = require('../lib/helpers');
var validateRequiredName = helpers.validateRequiredName;
var convertModelNametoSwiftClassname = helpers.convertModelNametoSwiftClassname;

module.exports = generators.Base.extend({

  constructor: function() {
    generators.Base.apply(this, arguments);

    // Allow user to pass the model name into the generator directly
    this.argument('name', {
      desc: 'Name of the model to create.',
      required: false,
      type: String
    });
  },

  initializing: {
    ensureInProject: actions.ensureInProject,

    initModelName: function() {
      this.skipPromptingAppName = false;

      if (this.name) {
        // User passed a desired model name as an argument
        var validation = validateRequiredName(this.name);
        if (validation === true) {
          // Desired model name is valid, skip prompting for it later
          this.skipPromptingModelName = true;
        } else {
          // Log reason for validation failure, if provided
          validation = validation || 'Model name not valid';
          this.log(validation);
        }
      }
    },

    readConfig: function() {
      debug('reading config json from: ', this.destinationPath('config.json'));
      this.config = this.fs.readJSON(this.destinationPath('config.json'));
    }
  },

  prompting: {
    promptModelName: function() {
      if (this.skipPromptingModelName) { return; }

      var done = this.async();
      var prompts = [
        {
          name: 'name',
          message: 'Enter the model name:',
          default: this.name,
          validate: validateRequiredName
        }
      ];
      this.prompt(prompts, function(props) {
        this.name = props.name;
        done();
      }.bind(this));
    },

    promptPlural: function() {
      var done = this.async();
      var prompts = [
        {
          name: 'plural',
          message: 'Custom plural form (used to build REST URL):',
          default: this.name + 's',
        }
      ];
      // TODO needs to handle plurals properly (check for function)
      this.prompt(prompts, function(props) {
        this.plural = props.plural;
        done();
      }.bind(this));
    }
  },

  writing: {
    writeModel: function() {

      // Convert modelname to valid Swift name (if required)
      this.classname = convertModelNametoSwiftClassname(this.name);

      // Create JSON file with model information
      var model = {
        name: this.name,
        plural: this.plural,
        classname: this.classname,
        properties: {
          "id": {
            "type": "string",
            "id": true
          }
        }
      }

      var modelFilename = this.destinationPath('models', `${this.name}.json`);
      if (this.fs.exists(modelFilename)) {
        debug('modifying the existing model: ', modelFilename);
        this.env.error(chalk.red(`\nAttempting to modify existing model '${this.name}'`,
                           `\nUse the property generator to modify the '${this.name}' model`));
      }
      this.fs.extendJSON(modelFilename, model, null, 2);

      // Create the stub model swift file
      var stubFilename = this.destinationPath('Sources', 'Generated', `${this.classname}.swift`);
      var stubModelSwift = `import GeneratedSwiftServer\n\nclass ${this.classname}: Model {\n}`;
      this.fs.write(stubFilename, stubModelSwift);
    },

    property: function() {
      this.log('Let\'s add some ' + this.name + ' properties now.\n');
      this.log('Enter an empty property name when done.');
      this.composeWith('swiftserver:property', {
        options: {
          apic: this.options.apic,
          repeatMultiple: true,
          modelName: this.name
        },
      });
    },
  },
});
