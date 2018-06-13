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

'use strict'
var debug = require('debug')('generator-swiftserver:app')

var Generator = require('yeoman-generator')
var chalk = require('chalk')
var path = require('path')

var actions = require('../lib/actions')
var helpers = require('../lib/helpers')
var validateDirName = helpers.validateDirName
var validateAppName = helpers.validateAppName
var validateCredential = helpers.validateRequiredCredential
var validatePort = helpers.validatePort
var validateFilePathOrURL = helpers.validateFilePathOrURL
var generateServiceName = helpers.generateServiceName

module.exports = Generator.extend({

  constructor: function () {
    Generator.apply(this, arguments)
    // Allow the user to pass the application name into the generator directly
    this.argument('name', {
      desc: 'Name of the application to scaffold.',
      required: false,
      type: String
    })

    this.option('init', {
      type: Boolean,
      desc: 'Generate basic default scaffold without prompting user for input.',
      defaults: false
    })

    this.option('skip-build', {
      type: Boolean,
      desc: 'Skip building the generated application',
      defaults: false
    })

    this.option('single-shot', {
      type: Boolean,
      desc: 'Creates application without including generator metadata files',
      defaults: false
    })
  },

  initializing: {
    ensureNotInProject: actions.ensureNotInProject,

    checkWorkingDirectory: function () {
        // check for %:;=<>”|\ since they break xcode if they are
        //  anywhere in the directory path.
      if (validateDirName(process.cwd()) !== true) {
        this.env.error(chalk.red(process.cwd(), 'directory path contains one or more of the following: %:;=<>”|\\ and will not compile in Xcode'))
      }
    },

    initAppName: function () {
      // save the initial directory for use by the fromSwagger processing.
      this.initialWorkingDir = process.cwd()

      this.appname = null // Discard yeoman default appname
      this.skipPromptingAppName = false
      if (this.options.name) {
        // User passed a desired application name as an argument
        var validation = validateAppName(this.options.name)
        if (validation === true) {
          // Desired application name is valid, skip prompting for it
          // later
          this.appname = this.options.name
          this.skipPromptingAppName = true
        } else {
          // Log reason for validation failure, if provided
          validation = validation || 'Application name not valid'
          debug(this.options.name, ' is not valid because ', validation)
          this.log(validation)
        }
      }

      if (this.appname === null) {
        // Fall back to name of current working directory
        var sanitizedCWD = path.basename(process.cwd()).replace(/[åç/]+?/g, '-')
        // if the name still contains characters %:;=<>”|\\ which
        // will cause Xcode to crash, default to 'app'
        if (validateAppName(sanitizedCWD) === true) {
          this.appname = sanitizedCWD
        } else {
          // Fall back again to a known valid name
          this.log('Failed to produce a valid application name from the current working directory')
          debug(sanitizedCWD, ' is not a valid application name and defaulting to \'app\'')
          this.appname = 'app'
        }
      }
    },

    initSpec: function () {
      function isTrue (value) {
        return (value === true || value === 'true')
      }

      if (this.options.bluemix) {
        this.skipPrompting = true

        if (this.options.type) {
          this.appType = this.options.type
        }

        if (typeof (this.options.bluemix) === 'string') {
          this.options.bluemix = JSON.parse(this.options.bluemix)
        }

        if (typeof (this.options.starterOptions) === 'string') {
          this.options.starterOptions = JSON.parse(this.options.starterOptions)
        }

        var appName = this.options.bluemix.name
        var metrics = isTrue(this.options.metrics) || undefined
        var docker = isTrue(this.options.docker) || undefined
        var usecase = isTrue(this.options.enableUsecase) || undefined
        var starterOptions = this.options.starterOptions || undefined
        var healthcheck = (typeof this.options.healthcheck === 'undefined') ? true : isTrue(this.options.healthcheck)

        var web = (this.appType === 'web' || this.appType === 'bff' || undefined)
        var hostSwagger = (this.appType === 'bff' || undefined)
        var exampleEndpoints = (this.appType === 'bff' || undefined)
        var swaggerUI = (this.appType === 'bff' || undefined)

        this.spec = {
          appName: appName,
          appType: 'scaffold',
          appDir: '.',
          docker: docker,
          web: web,
          hostSwagger: hostSwagger,
          exampleEndpoints: exampleEndpoints,
          swaggerUI: swaggerUI,
          bluemix: this.options.bluemix,
          metrics: metrics,
          repoType: 'clone',
          healthcheck: healthcheck,
          usecase: usecase,
          starterOptions: starterOptions
        }
      } else if (this.options.init) {
        // User passed the --init flag, so no prompts, just generate basic default scaffold
        this.destinationSet = true
        if (this.appname !== path.basename(this.destinationRoot())) {
          this.destinationRoot(path.resolve(this.appname))
        }
        this.skipPrompting = true
        this.appPattern = 'Basic'
        this.spec = {
          appType: 'scaffold',
          appName: this.appname,
          docker: true,
          metrics: true,
          bluemix: {}
        }
      } else if (this.options.spec) {
        try {
          this.spec = JSON.parse(this.options.spec)
          this.skipPrompting = true
        } catch (err) {
          this.env.error(chalk.red(err))
        }
      }
    },

    initForPrompting: function () {
      if (this.skipPrompting) return
      // initialize for prompting
      this.bluemix = { server: {} }
    }
  },

  _addService: function (serviceType, serviceName) {
    this.services = this.services || {}
    var service = {
      serviceInfo: {
        label: helpers.getBluemixServiceLabel(serviceType),
        name: serviceName,
        plan: helpers.getBluemixDefaultPlan(serviceType)
      }
    }
    if (helpers.isThisServiceAnArray(serviceType)) service = [service]
    this.services[serviceType] = service
  },

  prompting: {
    promptAppName: function () {
      if (this.skipPrompting) return
      this.log(chalk.magenta('Initialization prompts'))
      if (this.skipPromptingAppName) { return }

      var prompts = [
        {
          name: 'name',
          message: 'What\'s the name of your application?',
          default: this.appname,
          validate: validateAppName
        }
      ]
      return this.prompt(prompts).then((props) => {
        this.appname = props.name
      })
    },

    /*
     * Configure the destination directory, asking the user if required.
     * Set up the generator environment so that destinationRoot is set
     * to point to the directory where we want to generate code.
     */
    promptAppDir: function () {
      if (this.skipPrompting) return
      if (this.appname === path.basename(this.destinationRoot())) {
        // When the project name is the same as the current directory,
        // we are assuming the user has already created the project dir
        this.destinationSet = true
        return
      }

      var prompts = [
        {
          name: 'dir',
          message: 'Enter the name of the directory to contain the project:',
          default: this.appname,
          validate: validateDirName
        }
      ]
      return this.prompt(prompts).then((answers) => {
        if (answers.dir !== '.') {
          this.destinationSet = true
          this.destinationRoot(path.resolve(answers.dir))
        }
      })
    },

    ensureEmptyDirectory: function () {
      if (this.skipPrompting) return
      actions.ensureEmptyDirectory.call(this)
    },

    promptAppType: function () {
      if (this.skipPrompting) return

      var prompts = [{
        name: 'appType',
        type: 'list',
        message: 'Select type of project:',
        choices: [ 'Scaffold a starter', 'Generate a CRUD application' ],
        default: 'Scaffold a starter'
      }]
      return this.prompt(prompts).then((answers) => {
        switch (answers.appType) {
          case 'Scaffold a starter': this.appType = 'scaffold'; break
          case 'Generate a CRUD application': this.appType = 'crud'; break
          default:
            this.env.error(chalk.red(`Internal error: unknown application type ${answers.appType}`))
        }
      })
    },

    /*
     * Determine the application pattern so that the capability
     * defaults can be set appropriately.
     */
    promptApplicationPattern: function () {
      if (this.skipPrompting) return
      if (this.appType !== 'scaffold') return

      var prompts = [{
        name: 'appPattern',
        type: 'list',
        message: 'Select capability presets for application pattern:',
        choices: [ 'Basic', 'Web', 'Backend for frontend' ],
        default: 'Basic'
      }]
      return this.prompt(prompts).then((answers) => {
        switch (answers.appPattern) {
          case 'Basic': this.appPattern = 'Basic'; break
          case 'Web': this.appPattern = 'Web'; break
          case 'Backend for frontend': this.appPattern = 'BFF'; break
          default:
            this.env.error(chalk.red(`Internal error: unknown application pattern ${answers.appPattern}`))
        }
      })
    },

    promptCapabilities: function () {
      if (this.skipPrompting) return

      var self = this
      function displayName (property) {
        switch (property) {
          case 'web': return 'Static web file serving'
          case 'swaggerUI': return 'Swagger UI'
          case 'metrics': return 'Embedded metrics dashboard'
          case 'docker': return 'Docker files'
          default:
            self.env.error(chalk.red(`Internal error: unknown property ${property}`))
        }
      }

      function defaultCapabilities (appPattern) {
        switch (appPattern) {
          case 'Basic': return [
            'Docker files',
            'Embedded metrics dashboard'
          ]
          case 'Web': return [
            'Static web file serving',
            'Embedded metrics dashboard',
            'Docker files'
          ]
          case 'BFF': return [
            'Swagger UI',
            'Embedded metrics dashboard',
            'Static web file serving',
            'Docker files'
          ]
          default:
            self.env.error(chalk.red(`Internal error: unknown application pattern ${appPattern}`))
        }
      }

      var choices = ['metrics', 'docker']
      var defaults = choices.map(displayName)

      if (this.appType === 'scaffold') {
        choices.unshift('swaggerUI')
        choices.unshift('web')
        defaults = defaultCapabilities(this.appPattern)
      }

      var prompts = [{
        name: 'capabilities',
        type: 'checkbox',
        message: 'Select capabilities:',
        choices: choices.map(displayName),
        default: defaults
      }]
      return this.prompt(prompts).then((answers) => {
        choices.forEach((choice) => {
          this[choice] = (answers.capabilities.indexOf(displayName(choice)) !== -1)
        })
      })
    },

    promptGenerateEndpoints: function () {
      if (this.skipPrompting) return
      if (this.appType !== 'scaffold') return

      var choices = [ 'Swagger file serving endpoint', 'Endpoints from swagger file' ]
      var defaults = this.appPattern === 'BFF' ? choices : []

      var prompts = [{
        name: 'endpoints',
        type: 'checkbox',
        message: 'Select endpoints to generate:',
        choices: choices,
        default: defaults
      }]
      return this.prompt(prompts).then((answers) => {
        if (answers.endpoints) {
          if (answers.endpoints.indexOf('Swagger file serving endpoint') !== -1) {
            this.hostSwagger = true
          }
          if (answers.endpoints.indexOf('Endpoints from swagger file') !== -1) {
            this.swaggerEndpoints = true
          }
        }
      })
    },

    promptSwaggerEndpoints: function () {
      if (this.skipPrompting) return
      if (this.appType !== 'scaffold') return
      if (!this.swaggerEndpoints) return

      var choices = {'customSwagger': 'Custom swagger file',
        'exampleEndpoints': 'Example swagger file'}

      var prompts = [{
        name: 'swaggerChoice',
        type: 'list',
        message: 'Swagger file to use to create endpoints and companion iOS SDK:',
        choices: [choices.customSwagger, choices.exampleEndpoints],
        default: choices.customSwagger
      }, {
        name: 'path',
        type: 'input',
        message: 'Provide the path to a swagger file:',
        filter: (response) => response.trim(),
        validate: (response) => validateFilePathOrURL(response, this.initialWorkingDir),
        when: (question) => (question.swaggerChoice === choices.customSwagger)
      }, {
        name: 'generateCodableRoutes',
        type: 'confirm',
        message: 'Would you like to generate codable routes, (yes recommended)?',
        default: true
      }]
      return this.prompt(prompts).then((answers) => {
        this.generateCodableRoutes = answers.generateCodableRoutes
        if (answers.swaggerChoice === choices.exampleEndpoints) {
          this.exampleEndpoints = true
        } else if (answers.path) {
          var httpPattern = new RegExp(/^https?:\/\/\S+/)

          if (httpPattern.test(answers.path)) {
            this.fromSwagger = answers.path
          } else {
            this.fromSwagger = path.resolve(this.initialWorkingDir, answers.path)
          }
        }
      })
    },

    promptSwiftServerSwaggerFiles: function () {
      if (this.skipPrompting) return
      this.log(chalk.magenta('Service prompts'))

      var depth = 0
      var prompts = [{
        name: 'serverSwaggerInput' + depth,
        type: 'confirm',
        message: 'Would you like to generate a Swift server SDK from a Swagger file?',
        default: false
      }, {
        when: (props) => props[Object.keys(props)[0]],
        name: 'serverSwaggerInputPath' + depth,
        type: 'input',
        message: 'Enter Swagger yaml file path:',
        filter: (response) => response.trim(),
        validate: (response) => validateFilePathOrURL(response, this.initialWorkingDir)
      }]

      // Declaring a function to handle the answering of these prompts so that
      // we can repeat them until the user responds that they do not want to
      // generate any more SDKs
      var handleAnswers = (answers) => {
        // Creating and accessing dynamic answer keys for yeoman-test compatability.
        // It needs unique keys in order to simulate the generation of multiple swagger file paths.
        if (!answers['serverSwaggerInput' + depth]) {
          // Sentinel blank value to end looping
          return
        }

        if (this.serverSwaggerFiles === undefined) {
          this.serverSwaggerFiles = []
        }
        if (this.serverSwaggerFiles.indexOf(answers['serverSwaggerInputPath' + depth]) === -1) {
          this.serverSwaggerFiles.push(answers['serverSwaggerInputPath' + depth])
        } else {
          this.log(chalk.yellow('This Swagger file is already being used'))
        }
        depth += 1
        prompts[0].name = prompts[0].name.slice(0, -1) + depth
        prompts[1].name = prompts[1].name.slice(0, -1) + depth
        prompts[0].message = 'Would you like to generate another Swift server SDK from a Swagger file?'
        // Now we have processed the response, we need to ask if the user
        // wants to add any more SDKs. We do this by returning a new
        // promise here, which will be resolved before the promise
        // in which it is nested is resolved.
        return this.prompt(prompts).then(handleAnswers)
      }
      return this.prompt(prompts).then(handleAnswers)
    },

    promptServicesForScaffold: function () {
      if (this.skipPrompting) return
      if (this.appType !== 'scaffold') return

      var choices = [
        'Cloudant / CouchDB',
        'Redis',
        'MongoDB',
        'PostgreSQL',
        'ElephantSQL',
        'Object Storage',
        'AppID',
        'Auto-scaling',
        'Watson Conversation',
        'Alert Notification',
        'Push Notifications'
      ]
      var prompts = [{
        name: 'services',
        type: 'checkbox',
        message: 'Generate boilerplate for services:',
        choices: choices,
        default: []
      }]
      return this.prompt(prompts).then((answers) => {
        if (answers.services.indexOf('Cloudant / CouchDB') !== -1) {
          this._addService('cloudant', generateServiceName(this.appname, 'Cloudant'))
        }
        if (answers.services.indexOf('Redis') !== -1) {
          this._addService('redis', generateServiceName(this.appname, 'Redis'))
        }
        if (answers.services.indexOf('MongoDB') !== -1) {
          this._addService('mongodb', generateServiceName(this.appname, 'MongoDB'))
        }
        if (answers.services.indexOf('PostgreSQL') !== -1) {
          this._addService('postgresql', generateServiceName(this.appname, 'PostgreSQL'))
        }
        if (answers.services.indexOf('ElephantSQL') !== -1) {
          this._addService('elephantsql', generateServiceName(this.appname, 'ElephantSQL'))
        }
        if (answers.services.indexOf('Object Storage') !== -1) {
          this._addService('objectStorage', generateServiceName(this.appname, 'ObjectStorage'))
        }
        if (answers.services.indexOf('AppID') !== -1) {
          this._addService('auth', generateServiceName(this.appname, 'AppID'))
        }
        if (answers.services.indexOf('Watson Conversation') !== -1) {
          this._addService('conversation', generateServiceName(this.appname, 'WatsonConversation'))
        }
        if (answers.services.indexOf('Alert Notification') !== -1) {
          this._addService('alertNotification', generateServiceName(this.appname, 'AlertNotification'))
        }
        if (answers.services.indexOf('Push Notifications') !== -1) {
          this._addService('push', generateServiceName(this.appname, 'PushNotifications'))
        }
        if (answers.services.indexOf('Auto-scaling') !== -1) {
          this._addService('autoscaling', generateServiceName(this.appname, 'AutoScaling'))
        }
      })
    },

    /*
     * Configure the data store, asking the user what type of data store they
     * are using and configuring the data store if needed. These answers will
     * be the basis for the config.json.
     */
    promptDataStoreForCRUD: function () {
      if (this.skipPrompting) return
      if (this.appType !== 'crud') return

      var prompts = [
        {
          name: 'store',
          message: 'Select data store:',
          type: 'list',
          choices: ['Memory (for development purposes)', 'Cloudant / CouchDB'],
          filter: (store) => store.split(' ')[0]
        }
      ]
      return this.prompt(prompts).then((answer) => {
        // NOTE(tunniclm): no need to do anything for memory it is the default
        // if no crudservice is passed to the refresh generator
        if (answer.store === 'Cloudant') {
          this._addService('cloudant', 'crudDataStore')
          this.crudservice = 'crudDataStore'
        }
      })
    },

    promptServicesForCRUD: function () {
      if (this.skipPrompting) return
      if (this.appType !== 'crud') return

      var choices = ['Auto-scaling']

      var prompts = [{
        name: 'services',
        type: 'checkbox',
        message: 'Generate boilerplate for services:',
        choices: choices,
        default: []
      }]
      return this.prompt(prompts).then((answers) => {
        if (answers.services.indexOf('Auto-scaling') !== -1) {
          this._addService('autoscaling', generateServiceName(this.appname, 'AutoScaling'))
        }
      })
    },

    // NOTE(tunniclm): This part of the prompting assumes there can only
    // be one of each type of service.
    promptConfigureServices: function () {
      if (this.skipPrompting) return
      if (!this.services) return
      if (Object.keys(this.services).length === 0) return

      var self = this
      function serviceDisplayType (serviceType) {
        switch (serviceType) {
          case 'cloudant': return 'Cloudant / CouchDB'
          case 'redis': return 'Redis'
          case 'mongodb': return 'MongoDB'
          case 'postgresql': return 'PostgreSQL'
          case 'elephantsql': return 'ElephantSQL'
          case 'objectStorage': return 'Object Storage'
          case 'auth': return 'AppID'
          case 'autoscaling': return 'Auto-scaling'
          case 'conversation': return 'Watson Conversation'
          case 'alertNotification': return 'Alert Notification'
          case 'push': return 'Push Notifications'
          default:
            self.env.error(chalk.red(`Internal error: unknown service type ${serviceType}`))
        }
      }

      var choices = Object.keys(this.services)
      var prompts = [{
        name: 'configure',
        type: 'checkbox',
        message: 'Configure service credentials (leave unchecked for defaults):',
        choices: choices.map(serviceDisplayType),
        default: []
      }]
      return this.prompt(prompts).then((answers) => {
        this.servicesToConfigure = {}
        choices.forEach((serviceType) => {
          this.servicesToConfigure[serviceType] =
            (answers.configure.indexOf(serviceDisplayType(serviceType)) !== -1)
        })
      })
    },

    promptConfigureCloudant: function () {
      if (this.skipPrompting) return
      if (!this.servicesToConfigure) return
      if (!this.servicesToConfigure.cloudant) return

      this.log()
      this.log('Configure Cloudant / CouchDB')
      var prompts = [
        { name: 'cloudantName',
          message: 'Enter name (blank for default):',
          when: (answers) => this.appType !== 'crud'
        },
        { name: 'cloudantHost', message: 'Enter host name (blank for localhost):' },
        {
          name: 'cloudantPort',
          message: 'Enter port (blank for default):',
          validate: (port) => validatePort(port),
          filter: (port) => (port ? parseInt(port) : port)
        },
        {
          name: 'cloudantSecured',
          message: 'Secure (https)?',
          type: 'confirm',
          default: false
        },
        { name: 'cloudantUsername', message: 'Enter username (blank for none):' },
        {
          name: 'cloudantPassword',
          message: 'Enter password:',
          type: 'password',
          when: (answers) => answers.cloudantUsername,
          validate: (password) => validateCredential(password)
        }
      ]
      return this.prompt(prompts).then((answers) => {
        var cloudantService = this.services.cloudant[0]
        this.services.cloudant[0] = {
          host: answers.cloudantHost || undefined,
          port: answers.cloudantPort || undefined,
          secured: answers.cloudantSecured || undefined,
          username: answers.cloudantUsername || undefined,
          password: answers.cloudantPassword || undefined,
          serviceInfo: {
            label: cloudantService.serviceInfo.label,
            name: answers.cloudantName || cloudantService.serviceInfo.name,
            plan: cloudantService.serviceInfo.plan
          }
        }
      })
    },

    promptConfigureRedis: function () {
      if (this.skipPrompting) return
      if (!this.servicesToConfigure) return
      if (!this.servicesToConfigure.redis) return

      this.log()
      this.log('Configure Redis')
      var prompts = [
        { name: 'redisName',
          message: 'Enter name (blank for default):'
        },
        { name: 'redisHost', message: 'Enter host name:' },
        {
          name: 'redisPort',
          message: 'Enter port:',
          validate: (port) => validatePort(port),
          filter: (port) => (port ? parseInt(port) : port)
        },
        { name: 'redisPassword', message: 'Enter password:', type: 'password' }
      ]
      return this.prompt(prompts).then((answers) => {
        var redisService = this.services.redis
        this.services.redis = {
          host: answers.redisHost || undefined,
          port: answers.redisPort || undefined,
          password: answers.redisPassword || undefined,
          serviceInfo: {
            label: redisService.serviceInfo.label,
            name: answers.redisName || redisService.serviceInfo.name,
            plan: redisService.serviceInfo.plan
          }
        }
      })
    },

    promptConfigureMongoDB: function () {
      if (this.skipPrompting) return
      if (!this.servicesToConfigure) return
      if (!this.servicesToConfigure.mongodb) return

      this.log()
      this.log('Configure MongoDB')
      var prompts = [
        { name: 'mongodbName',
          message: 'Enter name (blank for default):'
        },
        { name: 'mongodbHost', message: 'Enter host name:' },
        {
          name: 'mongodbPort',
          message: 'Enter port:',
          validate: (port) => validatePort(port),
          filter: (port) => (port ? parseInt(port) : port)
        },
        { name: 'mongodbPassword', message: 'Enter password:', type: 'password' },
        { name: 'mongodbDatabase', message: 'Enter database name:' }
      ]
      return this.prompt(prompts).then((answers) => {
        var mongoService = this.services.mongodb
        this.services.mongodb = {
          host: answers.mongodbHost || undefined,
          port: answers.mongodbPort || undefined,
          password: answers.mongodbPassword || undefined,
          database: answers.mongodbDatabase || undefined,
          serviceInfo: {
            label: mongoService.serviceInfo.label,
            name: answers.mongodbName || mongoService.serviceInfo.name,
            plan: mongoService.serviceInfo.plan
          }
        }
      })
    },

    promptConfigurePostgreSQL: function () {
      if (this.skipPrompting) return
      if (!this.servicesToConfigure) return
      if (!this.servicesToConfigure.postgresql) return

      this.log()
      this.log('Configure PostgreSQL')
      var prompts = [
        { name: 'postgresqlName',
          message: 'Enter name (blank for default):'
        },
        { name: 'postgresqlHost', message: 'Enter host name:' },
        {
          name: 'postgresqlPort',
          message: 'Enter port:',
          validate: (port) => validatePort(port),
          filter: (port) => (port ? parseInt(port) : port)
        },
        { name: 'postgresqlUsername', message: 'Enter username:' },
        { name: 'postgresqlPassword', message: 'Enter password:', type: 'password' },
        { name: 'postgresqlDatabase', message: 'Enter database name:' }
      ]
      return this.prompt(prompts).then((answers) => {
        var postgreService = this.services.postgresql
        this.services.postgresql = {
          host: answers.postgresqlHost || undefined,
          port: answers.postgresqlPort || undefined,
          username: answers.postgresqlUsername || undefined,
          password: answers.postgresqlPassword || undefined,
          database: answers.postgresqlDatabase || undefined,
          serviceInfo: {
            label: postgreService.serviceInfo.label,
            name: answers.postgresqlName || postgreService.serviceInfo.name,
            plan: postgreService.serviceInfo.plan
          }
        }
      })
    },

    promptConfigureElephantSQL: function () {
      if (this.skipPrompting) return
      if (!this.servicesToConfigure) return
      if (!this.servicesToConfigure.elephantsql) return

      this.log()
      this.log('Configure ElephantSQL')
      var prompts = [
        { name: 'elephantsqlName',
          message: 'Enter name (blank for default):'
        },
        { name: 'elephantsqlHost', message: 'Enter host name:' },
        {
          name: 'elephantsqlPort',
          message: 'Enter port:',
          validate: (port) => validatePort(port),
          filter: (port) => (port ? parseInt(port) : port)
        },
        { name: 'elephantsqlUsername', message: 'Enter username:' },
        { name: 'elephantsqlPassword', message: 'Enter password:', type: 'password' },
        { name: 'elephantsqlDatabase', message: 'Enter database name:' }
      ]
      return this.prompt(prompts).then((answers) => {
        var elephantsqlService = this.services.elephantsql
        this.services.elephantsql = {
          host: answers.elephantsqlHost || undefined,
          port: answers.elephantsqlPort || undefined,
          username: answers.elephantsqlUsername || undefined,
          password: answers.elephantsqlPassword || undefined,
          database: answers.elephantsqlDatabase || undefined,
          serviceInfo: {
            label: elephantsqlService.serviceInfo.label,
            name: answers.elephantsqlName || elephantsqlService.serviceInfo.name,
            plan: elephantsqlService.serviceInfo.plan
          }
        }
      })
    },

    promptConfigureAutoscaling: function () {
      if (this.skipPrompting) return
      if (!this.servicesToConfigure) return
      if (!this.servicesToConfigure.autoscaling) return

      this.log()
      this.log('Configure Autoscaling')
      var prompts = [
        { name: 'autoscalingName', message: 'Enter name (blank for default):' }
      ]
      return this.prompt(prompts).then((answers) => {
        this.services.autoscaling.serviceInfo.name = answers.autoscalingName || this.services.autoscaling.serviceInfo.name
      })
    },

    promptConfigureWatsonConversation: function () {
      if (this.skipPrompting) return
      if (!this.servicesToConfigure) return
      if (!this.servicesToConfigure.conversation) return

      this.log()
      this.log('Configure Watson Conversation')
      var prompts = [
        { name: 'watsonConversationName', message: 'Enter name (blank for default):' },
        { name: 'watsonConversationUsername', message: 'Enter username (blank for none):' },
        { name: 'watsonConversationPassword', message: 'Enter password:', type: 'password' },
        { name: 'watsonConversationUrl', message: 'Enter url (blank for none):' }
      ]
      return this.prompt(prompts).then((answers) => {
        var watsonService = this.services.conversation
        this.services.conversation = {
          username: answers.watsonConversationUsername || undefined,
          password: answers.watsonConversationPassword || undefined,
          url: answers.watsonConversationUrl || undefined,
          serviceInfo: {
            label: watsonService.serviceInfo.label,
            name: answers.watsonConversationName || watsonService.name,
            plan: watsonService.serviceInfo.plan
          }
        }
      })
    },

    promptConfigureAlertNotification: function () {
      if (this.skipPrompting) return
      if (!this.servicesToConfigure) return
      if (!this.servicesToConfigure.alertNotification) return
      this.log()
      this.log('Configure Alert Notification')
      var prompts = [
        { name: 'alertNotificationName', message: 'Enter service name (blank for default):' },
        { name: 'alertNotificationUsername', message: 'Enter username (blank for none):' },
        { name: 'alertNotificationPassword', message: 'Enter password:', type: 'password' },
        { name: 'alertNotificationUrl', message: 'Enter url (blank for none):' }
      ]
      return this.prompt(prompts).then((answers) => {
        var alertNotificationService = this.services.alertNotification
        this.services.alertNotification = {
          name: answers.alertNotificationUsername || undefined,
          password: answers.alertNotificationPassword || undefined,
          url: answers.alertNotificationUrl || undefined,
          serviceInfo: {
            label: alertNotificationService.serviceInfo.label,
            name: answers.alertNotificationName || alertNotificationService.serviceInfo.name,
            plan: alertNotificationService.plan
          }
        }
      })
    },

    promptConfigurePushNotifications: function () {
      if (this.skipPrompting) return
      if (!this.servicesToConfigure) return
      if (!this.servicesToConfigure.push) return

      this.log()
      this.log('Configure Push Notifications')

      var prompts = [
        { name: 'pushNotificationsName', message: 'Enter service name (blank for default):' },
        { name: 'pushNotificationsAppGuid', message: 'Enter app GUID:' },
        { name: 'pushNotificationsAppSecret', message: 'Enter app secret:', type: 'password' },
        {
          name: 'pushNotificationsRegion',
          type: 'list',
          message: 'Enter Bluemix region:',
          choices: [ 'US South', 'United Kingdom', 'Sydney' ],
          default: 'US South'
        }
      ]
      return this.prompt(prompts).then((answers) => {
        var pushService = this.services.push
        this.services.push = {
          appGuid: answers.pushNotificationsAppGuid || undefined,
          appSecret: answers.pushNotificationsAppSecret || undefined,
          serviceInfo: {
            label: pushService.serviceInfo.label,
            name: answers.pushNotificationsName || pushService.serviceInfo.name,
            plan: pushService.serviceInfo.plan
          }
        }
        switch (answers.pushNotificationsRegion) {
          case 'US South': this.services.push.url = 'http://imfpush.ng.bluemix.net'; break
          case 'United Kingdom': this.services.push.url = 'http://imfpush.eu-gb.bluemix.net'; break
          case 'Sydney': this.services.push.url = 'http://imfpush.au-syd.bluemix.net'; break
          default:
            this.env.error(chalk.red(`Internal error: unknown region ${answers.pushNotificationsRegion}`))
        }
      })
    },

    promptConfigureObjectStorage: function () {
      if (this.skipPrompting) return
      if (!this.servicesToConfigure) return
      if (!this.servicesToConfigure.objectStorage) return

      this.log()
      this.log('Configure Object Storage')
      var prompts = [
        /*
        { name: 'objectstorageAuth_url'    message: 'Enter auth url:' },
        { name: 'objectstorageDomainId',   message: 'Enter domain ID:' },
        { name: 'objectstorageDomainName', message: 'Enter domain name:' },
        { name: 'objectstorageProject',    message: 'Enter project:' },
        { name: 'objectstorageRole',       message: 'Enter role:' },
        { name: 'objectstorageUsername',   message: 'Enter username:' },
        */
        { name: 'objectstorageName', message: 'Enter name (blank for default):' },
        { name: 'objectstorageRegion', message: 'Enter region:' },
        { name: 'objectstorageProjectId', message: 'Enter project ID:' },
        { name: 'objectstorageUserId', message: 'Enter user ID:' },
        { name: 'objectstoragePassword', message: 'Enter password:', type: 'password' }
      ]
      return this.prompt(prompts).then((answers) => {
        var objectStorageService = this.services.objectStorage[0]
        this.services.objectStorage[0] = {
          /*
          auth_url:   answers.objectstorageAuth_url || undefined,
          domainId:   answers.objectstorageDomainId || undefined,
          domainName: answers.objectstorageDomainName || undefined,
          project:    answers.objectstorageProject || undefined,
          role:       answers.objectstorageRole || undefined,
          username:   answers.objectstorageUsername || undefined,
          */
          region: answers.objectstorageRegion || undefined,
          projectId: answers.objectstorageProjectId || undefined,
          userId: answers.objectstorageUserId || undefined,
          password: answers.objectstoragePassword || undefined,
          serviceInfo: {
            label: objectStorageService.serviceInfo.label,
            name: answers.objectstorageName || objectStorageService.serviceInfo.name,
            plan: objectStorageService.serviceInfo.plan
          }
        }
      })
    },

    promptConfigureAppID: function () {
      if (this.skipPrompting) return
      if (!this.servicesToConfigure) return
      if (!this.servicesToConfigure.auth) return
      this.log()
      this.log('Configure AppID')
      var prompts = [
        { name: 'appIDName', message: 'Enter name (blank for default):' },
        { name: 'appidTenantId', message: 'Enter tenant ID:' },
        { name: 'appidClientId', message: 'Enter client ID:' },
        { name: 'appidSecret', message: 'Enter secret:', type: 'password' }
      ]
      return this.prompt(prompts).then((answers) => {
        var appIdService = this.services.auth
        this.services.auth = {
          tenantId: answers.appidTenantId || undefined,
          clientId: answers.appidClientId || undefined,
          secret: answers.appidSecret || undefined,
          serviceInfo: {
            label: appIdService.serviceInfo.label,
            name: answers.appIDName || appIdService.serviceInfo.name,
            plan: appIdService.serviceInfo.plan
          }
        }
      })
    }
  },

  createSpecFromAnswers: function () {
    if (this.skipPrompting) return
    // NOTE(tunniclm): This spec object may not exploit all possible functionality,
    // some may only be available via non-prompting route.
    if (this.services) {
      this.bluemix.server.services = []
      Object.keys(this.services).forEach(serviceType => {
        var services = Array.isArray(this.services[serviceType]) ? this.services[serviceType] : [this.services[serviceType]]
        services.forEach(service => {
          this.bluemix.server.services.push(service.serviceInfo.name)
        })
      })
    }
    this.spec = {
      appType: this.appType,
      appName: this.appname,
      docker: this.docker || undefined,
      web: this.web || undefined,
      exampleEndpoints: this.exampleEndpoints || undefined,
      fromSwagger: this.fromSwagger || undefined,
      generateCodableRoutes: this.generateCodableRoutes || undefined,
      serverSwaggerFiles: this.serverSwaggerFiles || undefined,
      hostSwagger: this.hostSwagger || undefined,
      swaggerUI: this.swaggerUI || undefined,
      metrics: this.metrics || undefined,
      crudservice: this.crudservice,
      bluemix: Object.assign(this.bluemix, this.services) || {}
    }
  },

  install: {

    buildDefinitions: function () {
      // this.composeWith() causes problems with testing using yeoman-test.
      //
      // When we composeWith() using the namespace:name format, then we
      // have trouble with errors finding the composed generator when testing
      // (it works usually when running while not testing.)
      //
      // So we resolve the generator to a real path to get around this, which
      // works in both cases. However, this means the yeoman-test RunContext
      // call withGenerators() no longer works to stub out dependent generators
      // with dummies for unit testing.
      //
      // This problem is documented in https://github.com/yeoman/yeoman-test/issues/16
      //
      // To work around the problem, our unit tests will pass in an option 'testmode'
      // and we will use the namespace:name form in that case.
      var refreshGenerator = this.options.testmode ? 'swiftserver:refresh' : require.resolve('../refresh')
      this.composeWith(refreshGenerator, {
        // Pass in the option to refresh to decided whether or not we create the *-product.yml
        apic: this.options.apic,
        specObj: this.spec,
        singleShot: this.options['single-shot'],
        destinationSet: (this.destinationSet === true)
      })
    },

    buildApp: function () {
      if (this.skipBuild || this.options['skip-build']) return

      var buildGenerator = this.options.testmode ? 'swiftserver:build' : require.resolve('../build')
      this.composeWith(buildGenerator, {
        // Pass in the option of doing single-shot so the appropriate checks are performed
        singleShot: this.options['single-shot']
      })
    }
  },

  end: function () {
    // Inform the user what they should do next
    this.log('Next steps:')
    this.log()
    if (this.destinationRoot() && this.destinationRoot() !== '.') {
      this.log('  Change directory to your app')
      this.log(chalk.green('    $ cd ' + this.destinationRoot()))
      this.log()
    }
    if (this.appType === 'crud') {
      var createModelInstruction = '    $ yo swiftserver:model'
      if (process.env.RUN_BY_COMMAND === 'swiftservergenerator') {
        createModelInstruction = '    $ swiftservergenerator --model'
      } else if (process.env.RUN_BY_COMMAND === 'apic') {
        createModelInstruction = '    $ apic create --type model-swiftserver'
      }

      this.log('  Create a model in your app')
      this.log(chalk.green(createModelInstruction))
      this.log()
    }
    this.log('  Run your app')
    this.log(chalk.green('    $ .build/debug/' + this.appname))
    this.log()
  }
})
module.exports._yeoman = Generator
