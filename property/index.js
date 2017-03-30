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

var actions = require('../lib/actions');
var helpers = require('../lib/helpers');
var debug = require('debug')('generator-swiftserver:property');
var validatePropertyName = helpers.validatePropertyName;
var validateDefaultValue = helpers.validateDefaultValue;
var convertDefaultValue = helpers.convertDefaultValue;

module.exports = generators.Base.extend({

  constructor: function() {
    generators.Base.apply(this, arguments);

    this.option('skip-build', {
      type: Boolean,
      desc: 'Skip building the generated application',
      defaults: false
    });
  },

  initializing: {
    ensureInProject: actions.ensureInProject,
    ensureProjectIsCrud: actions.ensureProjectIsCrud,

    initProperties: function() {
      this.properties = {};
    }
  },

  prompting: {
    // Valid project directories will contain a models directory with
    // .json files representing the models. List the models so that the user
    // can select which one they wish to override or define new properties for.

    promptModel: function() {
      // If we get here by being composed with the model generator, then we should
      // have been passed a model name and can skip selecting a model.
      // TODO: update the property generator
      this.model = this.options.model;
      if (this.model) return;

      // We need to get a list of models that are available to choose from.
      // We cannot use the yeoman memfs to query which model files exist because
      // it lacks an API for reading directories. Therefore, use the real file
      // system. We shouldn't have to worry about files that are waiting to be
      // written in memfs, because that could only happen if we are composed with
      // the model generator and the above check should mean we don't get here
      var fs = require('fs');
      var results = [];

      var modelsDir = this.destinationPath('models');
      debug('using directory %s to search for model .json files', modelsDir);

      if (fs.existsSync(modelsDir)) {
        var files = fs.readdirSync(modelsDir);
        debug('found %d files in model directory %s:', files.length, modelsDir, files);
        results = files.filter((element) => element.endsWith('.json'))
                       .map((element) => element.substring(0, element.lastIndexOf('.json')));

        // Ensure that the results array contains at least one model.json file.
        if (results.length == 0) {
          this.env.error('There are no models to update (no files in the models directory).');
        }

        var done = this.async();
        var prompts = [
          {
            name: 'model',
            message: 'Select the model:',
            type: 'list',
            choices: results
          }
        ];
        this.prompt(prompts, function(answers) {
            this.model = this.fs.readJSON(this.destinationPath('models', `${answers.model}.json`));
            done();
        }.bind(this));
      } else {
        this.env.error('There are no models to update (no models directory).');
      }
    },

    promptProperty: function() {
      var done = this.async();

      var prompts = [
        {
          name: 'propertyName',
          message: 'Enter the property name:',
          validate: (name) => (this.options.repeatMultiple && !name) ||
                              validatePropertyName(name)
        }
      ];
      this.prompt(prompts, function(answers) {
        if (this.options.repeatMultiple && !answers.propertyName) {
          // Sentinel blank value to end looping
          done();
          return;
        }

        var parameterPrompts = [
          {
            name: 'type',
            message: 'Property type:',
            type: 'list',
            choices: ['string', 'number', 'boolean', 'object', 'array']
          },
          {
            name: 'required',
            message: 'Required?',
            type: 'confirm',
            default: false
          }
        ];
        this.prompt(parameterPrompts, function(parameters) {
          this.model.properties[answers.propertyName] = { type: parameters.type };
          this.model.properties[answers.propertyName].required = parameters.required ? true : undefined;

          var defaultPrompts = [
            {
              name: 'default',
              message: 'Default?',
              type: 'confirm',
              default: false
            },
            {
              name: 'defaultValue',
              message: 'Default value:',
              when: (defaultAnswers) => defaultAnswers.default,
              validate: (value) => validateDefaultValue(parameters.type, value)
            }
          ];
          if (parameters.type === 'boolean') {
            defaultPrompts[1].type = 'list';
            defaultPrompts[1].choices = ['true', 'false'];
          }
          this.prompt(defaultPrompts, function(defaultAnswers) {
            if (defaultAnswers.default) {
              this.model.properties[answers.propertyName].default = convertDefaultValue(parameters.type, defaultAnswers.defaultValue);
            }
            if (this.options.repeatMultiple) {
              this.env.runLoop.add('prompting', this.prompting.promptProperty.bind(this));
            }
            done();
          }.bind(this));
        }.bind(this));
      }.bind(this));
    }
  },

  install: {
    buildDefinitions: function() {
      this.composeWith(
        'swiftserver:refresh',
        {
          // Pass in the option to refresh to decided whether or not we create the *-product.yml
          options: {
            apic: this.options.apic,
            model: this.model
          }
        },
        this.options.testmode ? null : { local: require.resolve('../refresh')});
    },

    buildApp: function() {

      if(this.skipBuild || this.options['skip-build']) return;

      this.composeWith(
        'swiftserver:build',
        {}
      );
    }
  }
});
