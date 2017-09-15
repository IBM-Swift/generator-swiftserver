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

    initSpec: function () {
      if (this.options.spec) {
        try {
          this.spec = JSON.parse(this.options.spec)
          this.skipPrompting = true
        } catch (err) {
          this.env.error(chalk.red(err))
        }
      }
    },

    initAppName: function () {
      if (this.skipPrompting) return
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

      // save the initial directory for use by the fromSwagger processing.
      this.initialWorkingDir = process.cwd()

      if (this.appname === null) {
        // Fall back to name of current working directory
        // Normalize if it contains special characters
        var sanitizedCWD = path.basename(process.cwd()).replace(/[/@\s+%:.]+?/g, '-')
        // We hope that sanitizedCWD is always valid, but check just
        // in case it isn't
        if (validateAppName(sanitizedCWD) === true) {
          this.appname = sanitizedCWD
        } else {
          // Fall back again to a known valid name
          this.log('Failed to produce a valid application name from the current working directory')
          debug(sanitizedCWD, ' is not a valid application name and defaulting to \'app\'')
          this.appname = 'app'
        }
      }
    }
  },

  _addService: function (serviceType, service) {
    this.services = this.services || {}
    this.services[serviceType] = this.services[serviceType] || []
    this.services[serviceType].push(service)
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
        this.log('working directory is %s', path.basename(this.destinationRoot()))
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
        choices: [ 'Scaffold a starter', 'Generate a CRUD application' ]
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
          case 'Backend for frontend': this.appPattern = 'Bff'; break
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
          case 'hostSwagger': return 'OpenAPI / Swagger endpoint'
          case 'swaggerUI': return 'Swagger UI'
          case 'metrics': return 'Embedded metrics dashboard'
          case 'docker': return 'Docker files'
          case 'fromSwagger': return 'From Swagger'
          case 'endpoints': return 'Generate endpoints'
          case 'bluemix': return 'Bluemix cloud deployment'
          default:
            self.env.error(chalk.red(`Internal error: unknown property ${property}`))
        }
      }

      function defaultCapabilities (appPattern) {
        switch (appPattern) {
          case 'Basic': return ['Docker files',
            'Embedded metrics dashboard',
            'Bluemix cloud deployment']
          case 'Web': return ['Static web file serving',
            'Embedded metrics dashboard',
            'Docker files',
            'Bluemix cloud deployment']
          case 'Bff': return ['Swagger UI',
            'Embedded metrics dashboard',
            'Static web file serving',
            'Docker files',
            'Bluemix cloud deployment']
          default:
            self.env.error(chalk.red(`Internal error: unknown application pattern ${appPattern}`))
        }
      }

      var choices = ['metrics', 'docker', 'bluemix']
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

      var choices = ['Swagger file serving endpoint', 'Endpoints from swagger file']
      var defaults = this.appPattern === 'Bff' ? choices : undefined

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

      this.hostSwagger = true
      var prompts = [{
        name: 'swaggerChoice',
        type: 'list',
        message: 'Swagger file to use to create endpoints and companion iOS SDK:',
        choices: [choices.customSwagger, choices.exampleEndpoints],
        default: []
      }, {
        name: 'path',
        type: 'input',
        message: 'Provide the path to a swagger file:',
        filter: function (response) { return response.trim() },
        validate: validateFilePathOrURL,
        when: function (question) {
          return (question.swaggerChoice === choices.customSwagger)
        }
      }]
      return this.prompt(prompts).then((answers) => {
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
        when: function (props) { return props[Object.keys(props)[0]] },
        name: 'serverSwaggerInputPath' + depth,
        type: 'input',
        message: 'Enter Swagger yaml file path:',
        filter: function (response) { return response.trim() },
        validate: validateFilePathOrURL
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

    promptServicesForScaffoldLocal: function () {
      if (this.skipPrompting) return
      if (this.appType !== 'scaffold') return
      if (this.bluemix) return

      var choices = ['CouchDB', 'Redis']

      var prompts = [{
        name: 'services',
        type: 'checkbox',
        message: 'Generate boilerplate for local services:',
        choices: choices,
        default: []
      }]
      return this.prompt(prompts).then((answers) => {
        if (answers.services.indexOf('CouchDB') !== -1) {
          this._addService('cloudant', { name: 'couchdb' })
        }
        if (answers.services.indexOf('Redis') !== -1) {
          this._addService('redis', { name: 'redis' })
        }
      })
    },

    promptServicesForScaffoldBluemix: function () {
      if (this.skipPrompting) return
      if (this.appType !== 'scaffold') return
      if (!this.bluemix) return

      var choices = ['Cloudant', 'Redis', 'Object Storage', 'AppID', 'Auto-scaling', 'Watson Conversation', 'Alert Notification', 'Push Notifications']

      var prompts = [{
        name: 'services',
        type: 'checkbox',
        message: 'Generate boilerplate for Bluemix services:',
        choices: choices,
        default: []
      }]
      return this.prompt(prompts).then((answers) => {
        if (answers.services.indexOf('Cloudant') !== -1) {
          this._addService('cloudant', { name: generateServiceName(this.appname, 'Cloudant') })
        }
        if (answers.services.indexOf('Redis') !== -1) {
          this._addService('redis', { name: generateServiceName(this.appname, 'Redis') })
        }
        if (answers.services.indexOf('Object Storage') !== -1) {
          this._addService('objectstorage', { name: generateServiceName(this.appname, 'ObjectStorage') })
        }
        if (answers.services.indexOf('AppID') !== -1) {
          this._addService('appid', { name: generateServiceName(this.appname, 'AppID') })
        }
        if (answers.services.indexOf('Watson Conversation') !== -1) {
          this._addService('watsonconversation', { name: generateServiceName(this.appname, 'WatsonConversation') })
        }
        if (answers.services.indexOf('Alert Notification') !== -1) {
          this._addService('alertnotification', { name: generateServiceName(this.appname, 'AlertNotification') })
        }
        if (answers.services.indexOf('Push Notifications') !== -1) {
          this._addService('pushnotifications', {
            name: generateServiceName(this.appname, 'PushNotifications'),
            region: 'US_SOUTH' })
        }
        if (answers.services.indexOf('Auto-scaling') !== -1) {
          this.autoscale = generateServiceName(this.appname, 'AutoScaling')
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
          this._addService('cloudant', { name: 'crudDataStore' })
          this.crudservice = 'crudDataStore'
        }
      })
    },

    promptServicesForCRUDBluemix: function () {
      if (this.skipPrompting) return
      if (this.appType !== 'crud') return
      if (!this.bluemix) return

      var choices = ['Auto-scaling']

      var prompts = [{
        name: 'services',
        type: 'checkbox',
        message: 'Generate boilerplate for Bluemix services:',
        choices: choices,
        default: []
      }]
      return this.prompt(prompts).then((answers) => {
        if (answers.services.indexOf('Auto-scaling') !== -1) {
          this.autoscale = generateServiceName(this.appname, 'AutoScaling')
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
          case 'objectstorage': return 'Object Storage'
          case 'appid': return 'AppID'
          case 'watsonconversation': return 'Watson Conversation'
          case 'alertnotification': return 'Alert Notification'
          case 'pushnotifications': return 'Push Notifications'
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
        this.services.cloudant[0].name = answers.cloudantName || this.services.cloudant[0].name
        this.services.cloudant[0].credentials = {
          host: answers.cloudantHost || undefined,
          port: answers.cloudantPort || undefined,
          secured: answers.cloudantSecured || undefined,
          username: answers.cloudantUsername || undefined,
          password: answers.cloudantPassword || undefined
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
          message: 'Enter name (blank for default):',
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
      ]
      return this.prompt(prompts).then((answers) => {
        this.services.redis[0].name = answers.redisName || this.services.redis[0].name
        this.services.redis[0].credentials = {
          host: answers.redisHost || undefined,
          port: answers.redisPort || undefined,
          password: answers.redisPassword || undefined
        }
      })
    },

    promptConfigureWatsonConversation: function () {
      if (this.skipPrompting) return
      if (!this.servicesToConfigure) return
      if (!this.servicesToConfigure.watsonconversation) return

      this.log()
      this.log('Configure Watson Conversation')
      var prompts = [
        { name: 'watsonConversationName',
          message: 'Enter name (blank for default):',
          when: (answers) => this.bluemix
        },
        { name: 'watsonConversationUsername', message: 'Enter username (blank for none):' },
        { name: 'watsonConversationPassword', message: 'Enter password:', type: 'password' },
        { name: 'watsonConversationUrl', message: 'Enter url (blank for none):' },
        { name: 'watsonConversationVersion', message: 'Enter version (blank for none):' }
      ]
      return this.prompt(prompts).then((answers) => {
        this.services.watsonconversation[0].name = answers.watsonConversationName || this.services.watsonconversation[0].name
        this.services.watsonconversation[0].version = answers.watsonConversationVersion || this.services.watsonconversation[0].version
        this.services.watsonconversation[0].credentials = {
          username: answers.watsonConversationUsername || undefined,
          password: answers.watsonConversationPassword || undefined,
          url: answers.watsonConversationUrl || undefined
        }
      })
    },

    promptConfigureAlertNotification: function () {
      if (this.skipPrompting) return
      if (!this.servicesToConfigure) return
      if (!this.servicesToConfigure.alertnotification) return

      this.log()
      this.log('Configure Alert Notification')
      var prompts = [
        { name: 'alertNotificationName',
          message: 'Enter service name (blank for default):',
          when: (answers) => this.bluemix
        },
        { name: 'alertNotificationUsername', message: 'Enter username (blank for none):' },
        { name: 'alertNotificationPassword', message: 'Enter password:', type: 'password' },
        { name: 'alertNotificationUrl', message: 'Enter url (blank for none):' }
      ]
      return this.prompt(prompts).then((answers) => {
        this.services.alertnotification[0].name = answers.alertNotificationName || this.services.alertnotification[0].name
        this.services.alertnotification[0].credentials = {
          name: answers.alertNotificationUsername || undefined,
          password: answers.alertNotificationPassword || undefined,
          url: answers.alertNotificationUrl || undefined
        }
      })
    },

    promptConfigurePushNotifications: function () {
      if (this.skipPrompting) return
      if (!this.servicesToConfigure) return
      if (!this.servicesToConfigure.pushnotifications) return

      this.log()
      this.log('Configure Push Notifications')

      var prompts = [
        { name: 'pushNotificationsName',
          message: 'Enter service name (blank for default):',
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
      ]
      return this.prompt(prompts).then((answers) => {
        this.services.pushnotifications[0].name = answers.pushNotificationsName || this.services.pushnotifications[0].name
        this.services.pushnotifications[0].credentials = {
          appGuid: answers.pushNotificationsAppGuid || undefined,
          appSecret: answers.pushNotificationsAppSecret || undefined
        }
        switch (answers.pushNotificationsRegion) {
          case 'US South': this.services.pushnotifications[0].region = 'US_SOUTH'; break
          case 'United Kingdom': this.services.pushnotifications[0].region = 'UK'; break
          case 'Sydney': this.services.pushnotifications[0].region = 'SYDNEY'; break
          default:
            this.env.error(chalk.red(`Internal error: unknown region ${answers.pushNotificationsRegion}`))
        }
      })
    },

    promptConfigureObjectStorage: function () {
      if (this.skipPrompting) return
      if (!this.servicesToConfigure) return
      if (!this.servicesToConfigure.objectstorage) return

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
        { name: 'objectstorageName',
          message: 'Enter name (blank for default):',
          when: (answers) => this.bluemix
        },
        { name: 'objectstorageRegion', message: 'Enter region:' },
        { name: 'objectstorageProjectId', message: 'Enter project ID:' },
        { name: 'objectstorageUserId', message: 'Enter user ID:' },
        { name: 'objectstoragePassword', message: 'Enter password:', type: 'password' }
      ]
      return this.prompt(prompts).then((answers) => {
        this.services.objectstorage[0].name = answers.objectstorageName || this.services.objectstorage[0].name
        this.services.objectstorage[0].credentials = {
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
          password: answers.objectstoragePassword || undefined
        }
      })
    },

    promptConfigureAppID: function () {
      if (this.skipPrompting) return
      if (!this.servicesToConfigure) return
      if (!this.servicesToConfigure.appid) return

      this.log()
      this.log('Configure AppID')
      var prompts = [
        { name: 'appIDName',
          message: 'Enter name (blank for default):',
          when: (answers) => this.bluemix
        },
        { name: 'appidTenantId', message: 'Enter tenant ID:' },
        { name: 'appidClientId', message: 'Enter client ID:' },
        { name: 'appidSecret', message: 'Enter secret:', type: 'password' }
      ]
      return this.prompt(prompts).then((answers) => {
        this.services.appid[0].name = answers.appIDName || this.services.appid[0].name
        this.services.appid[0].credentials = {
          tenantId: answers.appidTenantId || undefined,
          clientId: answers.appidClientId || undefined,
          secret: answers.appidSecret || undefined
        }
      })
    }
  },

  createSpecFromAnswers: function () {
    if (this.skipPrompting) return
    // NOTE(tunniclm): This spec object may not exploit all possible functionality,
    // some may only be available via non-prompting route.
    if (this.autoscale) this._addService('autoscale', { name: this.autoscale })

    this.spec = {
      appType: this.appType,
      appName: this.appname,
      bluemix: this.bluemix || undefined,
      docker: this.docker || undefined,
      web: this.web || undefined,
      exampleEndpoints: this.exampleEndpoints || undefined,
      fromSwagger: this.fromSwagger || undefined,
      serverSwaggerFiles: this.serverSwaggerFiles || undefined,
      hostSwagger: this.hostSwagger || undefined,
      swaggerUI: this.swaggerUI || undefined,
      services: this.services || {},
      crudservice: this.crudservice,
      capabilities: {
        metrics: this.metrics || undefined
      },
      config: {
        logger: 'helium',
        port: 8080
      }
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
