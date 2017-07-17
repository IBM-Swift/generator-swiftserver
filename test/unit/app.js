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
var path = require('path')
var assert = require('yeoman-assert')
var helpers = require('yeoman-test')
var fs = require('fs')

// Subgenerators to be stubbed
var dependentGenerators = [
  [helpers.createDummyGenerator(), 'swiftserver:refresh'],
  [helpers.createDummyGenerator(), 'swiftserver:build']
]

describe('swiftserver:app', function () {
  describe('Application name and directory name are the same', function () {
    var runContext
    before(function () {
      // Mock the options, set up an output folder and run the generator

      runContext = helpers.run(path.join(__dirname, '../../generators/app'))
        .withGenerators(dependentGenerators) // Stub subgenerators
        .withOptions({ testmode: true })    // Workaround to stub subgenerators
        .withPrompts({                       // Mock the prompt answers
          appType: 'Generate a CRUD application',
          name: 'notes',
          dir: 'notes'
        })
      return runContext.toPromise()                        // Get a Promise back when the generator finishes
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    it('created and changed into a folder according to dir value', function () {
      assert.equal(path.basename(process.cwd()), 'notes')
    })

    it('create a spec object containing the config', function () {
      var spec = runContext.generator.spec
      var expectedSpec = {
        appType: 'crud',
        appName: 'notes',
        config: {
          logger: 'helium',
          port: 8080
        }
      }
      assert.objectContent(spec, expectedSpec)
    })
  })

  describe('Application name and directory names are not the same', function () {
    var runContext
    before(function () {
      // Mock the options, set up an output folder and run the generator
      runContext = helpers.run(path.join(__dirname, '../../generators/app'))
        .withGenerators(dependentGenerators)
        .withOptions({ testmode: true })
        .withPrompts({      // Mock the prompt answers
          appType: 'Generate a CRUD application',
          name: 'applicationName',
          dir: 'directoryName'
        })
      return runContext.toPromise()       // Get a Promise back for when the generator finishes
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    it('created and changed into a folder according to dir value', function () {
      assert.equal(path.basename(process.cwd()), 'directoryName')
    })

    it('create a spec object containing the config', function () {
      var spec = runContext.generator.spec
      var expectedSpec = {
        appType: 'crud',
        appName: 'applicationName',
        config: {
          logger: 'helium',
          port: 8080
        }
      }
      assert.objectContent(spec, expectedSpec)
    })
  })

  describe('Application type and name only is supplied (via the prompt)', function () {
    var runContext
    before(function () {
      // Mock the options, set up an output folder and run the generator
      runContext = helpers.run(path.join(__dirname, '../../generators/app'))
        .withGenerators(dependentGenerators)
        .withOptions({ testmode: true })
        .withPrompts({      // Mock the prompt answers
          appType: 'Generate a CRUD application',
          name: 'appNameOnly'
        })
      return runContext.toPromise()       // Get a Promise back for when the generator finishes
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    it('created and changed into a folder according to dir value', function () {
      assert.equal(path.basename(process.cwd()), 'appNameOnly')
    })

    it('create a spec object containing the config', function () {
      var spec = runContext.generator.spec
      var expectedSpec = {
        appType: 'crud',
        appName: 'appNameOnly',
        config: {
          logger: 'helium',
          port: 8080
        }
      }
      assert.objectContent(spec, expectedSpec)
    })
  })

  // Create a testing directory, then supply no arguments via the prompt.
  // We should default to this for the application and directory values.
  describe('Create an application directory and change into it. Supply no arguments via the prompt. ' +
           'The app and dir prompt values should default to application directory.', function () {
    var runContext
    before(function () {
      // Mock the options, set up an output folder and run the generator
      runContext = helpers.run(path.join(__dirname, '../../generators/app'))
        .withGenerators(dependentGenerators)
        .withOptions({ testmode: true })
        .withPrompts({      // Mock the prompt answers
          appType: 'Generate a CRUD application'
        })
        .inTmpDir(function (tmpDir) {
          this.inDir(path.join(tmpDir, 'appDir'))
        })
      return runContext.toPromise()        // Get a Promise back for when the generator finishes
        .then(function (dir) {
          assert.equal(path.basename(process.cwd()), 'appDir')
        })
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    it('created and changed into a folder according to dir value', function () {
      assert.equal(path.basename(process.cwd()), 'appDir')
    })

    it('create a spec object containing the config', function () {
      var spec = runContext.generator.spec
      var expectedSpec = {
        appType: 'crud',
        appName: 'appDir',
        config: {
          logger: 'helium',
          port: 8080
        }
      }
      assert.objectContent(spec, expectedSpec)
    })
  })

  // Create a directory and change into it for testing. Try supplying the directory
  // name as . (this should work)
  describe('Create an application directory and change into it. Supply dir prompt as .', function () {
    var runContext
    before(function () {
      // Mock the options, set up an output folder and run the generator
      runContext = helpers.run(path.join(__dirname, '../../generators/app'))
        .withGenerators(dependentGenerators)
        .withOptions({ testmode: true })
        .withPrompts({      // Mock the prompt answers
          appType: 'Generate a CRUD application',
          name: 'differentAppName',
          dir: '.'
        })
        .inTmpDir(function (tmpDir) {
          this.inDir(path.join(tmpDir, 'currentDir'))
        })
      return runContext.toPromise()        // Get a Promise back for when the generator finishes
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    it('created and changed into a folder according to dir value', function () {
      assert.equal(path.basename(process.cwd()), 'currentDir')
    })

    it('create a spec object containing the config', function () {
      var spec = runContext.generator.spec
      var expectedSpec = {
        appType: 'crud',
        appName: 'differentAppName',
        config: {
          logger: 'helium',
          port: 8080
        }
      }
      assert.objectContent(spec, expectedSpec)
    })
  })

  describe('Application name is supplied via the command line options (not prompt)', function () {
    var runContext
    before(function () {
      // Mock the options, set up an output folder and run the generator
      runContext = helpers.run(path.join(__dirname, '../../generators/app'))
        .withGenerators(dependentGenerators)
        .withOptions({ testmode: true })
        .withArguments(['nameOnCommandLine'])
        .withPrompts({      // Mock the prompt answers
          appType: 'Generate a CRUD application'
        })
      return runContext.toPromise()       // Get a Promise back for when the generator finishes
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    it('created and changed into a folder according to dir value', function () {
      assert.equal(path.basename(process.cwd()), 'nameOnCommandLine')
    })

    it('create a spec object containing the config', function () {
      var spec = runContext.generator.spec
      var expectedSpec = {
        appType: 'crud',
        appName: 'nameOnCommandLine',
        config: {
          logger: 'helium',
          port: 8080
        }
      }
      assert.objectContent(spec, expectedSpec)
    })
  })

  describe('An invalid application name is supplied via the command line options. ' +
           'Check that we fall back to using the current directory.',
            function () {
              var runContext
              before(function () {
      // Mock the options, set up an output folder and run the generator
                runContext = helpers.run(path.join(__dirname, '../../generators/app'))
        .withGenerators(dependentGenerators)
        .withOptions({ testmode: true })
        .withArguments(['inva&%*lid'])
        .withPrompts({      // Mock the prompt answers
          appType: 'Generate a CRUD application'
        })
        .inTmpDir(function (tmpDir) {
          this.inDir(path.join(tmpDir, 'validDir'))
        })
                return runContext.toPromise()        // Get a Promise back for when the generator finishes
        .then(function (dir) {
          assert.equal(path.basename(process.cwd()), 'validDir')
        })
              })

              after(function () {
                runContext.cleanTestDirectory()
              })

              it('created and changed into a folder according to dir value', function () {
                assert.equal(path.basename(process.cwd()), 'validDir')
              })

              it('create a spec object containing the config', function () {
                var spec = runContext.generator.spec
                var expectedSpec = {
                  appType: 'crud',
                  appName: 'validDir',
                  config: {
                    logger: 'helium',
                    port: 8080
                  }
                }
                assert.objectContent(spec, expectedSpec)
              })
            })

  describe('An invalid application name is supplied via the command line. ' +
           'The current directory is also an invalid application name format ' +
           'which cannot be sanitized. ' +
           'Ensure that we fall back to the default name of "app".',
            function () {
              var runContext
              before(function () {
      // Mock the options, set up an output folder and run the generator
                runContext = helpers.run(path.join(__dirname, '../../generators/app'))
        .withGenerators(dependentGenerators)
        .withOptions({ testmode: true })
        .withArguments(['inva&%*lid'])
        .withPrompts({      // Mock the prompt answers
          appType: 'Generate a CRUD application'
        })
        .inTmpDir(function (tmpDir) {
          this.inDir(path.join(tmpDir, 'inva&%*lid'))
        })
                return runContext.toPromise()        // Get a Promise back for when the generator finishes
              })

              after(function () {
                runContext.cleanTestDirectory()
              })

              it('created and changed into a folder according to dir value', function () {
                assert.equal(path.basename(process.cwd()), 'app')
              })

              it('create a spec object containing the config', function () {
                var spec = runContext.generator.spec
                var expectedSpec = {
                  appType: 'crud',
                  appName: 'app',
                  config: {
                    logger: 'helium',
                    port: 8080
                  }
                }
                assert.objectContent(spec, expectedSpec)
              })
            })

  describe('An invalid application name is supplied via the command line. ' +
           'The current directory is also an invalid application name format. ' +
           'Check that the current directory name can be sanitized and then used.',
           function () {
             var runContext
             before(function () {
      // Mock the options, set up an output folder and run the generator
               runContext = helpers.run(path.join(__dirname, '../../generators/app'))
        .withGenerators(dependentGenerators)
        .withOptions({ testmode: true })
        .withArguments(['ext&%*ra'])
        .withPrompts({      // Mock the prompt answers
          appType: 'Generate a CRUD application'
        })
        .inTmpDir(function (tmpDir) {
          this.inDir(path.join(tmpDir, 'inv@l+l%l:l.lid'))
        })
               return runContext.toPromise()        // Get a Promise back for when the generator finishes
             })

             after(function () {
               runContext.cleanTestDirectory()
             })

             it('created and changed into a folder according to dir value', function () {
               assert.equal(path.basename(process.cwd()), 'inv-l-l-l-l-lid')
             })

             it('create a spec object containing the config', function () {
               var spec = runContext.generator.spec
               var expectedSpec = {
                 appType: 'crud',
                 appName: 'inv-l-l-l-l-lid',
                 config: {
                   logger: 'helium',
                   port: 8080
                 }
               }
               assert.objectContent(spec, expectedSpec)
             })
           })

  describe('Create a directory and change into it for testing. ' +
           'Enter the application name as the same name, we should use the directory ' +
           'which already existed, not create a new one of the same name.',
           function () {
             var runContext
             before(function () {
      // Mock the options, set up an output folder and run the generator
               runContext = helpers.run(path.join(__dirname, '../../generators/app'))
        .withGenerators(dependentGenerators)
        .withOptions({ testmode: true })
        .withPrompts({      // Mock the prompt answers
          appType: 'Generate a CRUD application'
        })
        .inTmpDir(function (tmpDir) {
          this.inDir(path.join(tmpDir, 'testDir'))
        })
               return runContext.toPromise()        // Get a Promise back for when the generator finishes
             })

             after(function () {
               runContext.cleanTestDirectory()
             })

             it('used the empty directory for the project', function () {
               assert.equal(path.basename(process.cwd()), 'testDir')
               assert(runContext.generator.destinationSet)
             })
           })

  describe('CRUD application with bluemix', function () {
    var runContext

    before(function () {
      runContext = helpers.run(path.join(__dirname, '../../generators/app'))
                          .withGenerators(dependentGenerators)
                          .withOptions({ testmode: true })
                          .withPrompts({
                            appType: 'Generate a CRUD application',
                            name: 'notes',
                            dir: 'notes',
                            store: 'Memory',
                            capabilities: ['Bluemix cloud deployment']
                          })
      return runContext.toPromise()
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    it('has the expected spec object', function () {
      var spec = runContext.generator.spec
      var expectedSpec = {
        appType: 'crud',
        appName: 'notes',
        bluemix: true,
        config: {
          logger: 'helium',
          port: 8080
        }
      }
      assert.objectContent(spec, expectedSpec)
    })
  })

  describe('CRUD application with metrics', function () {
    var runContext

    before(function () {
      runContext = helpers.run(path.join(__dirname, '../../generators/app'))
                          .withGenerators(dependentGenerators)
                          .withOptions({ testmode: true })
                          .withPrompts({
                            appType: 'Generate a CRUD application',
                            name: 'notes',
                            dir: 'notes',
                            store: 'Memory',
                            capabilities: ['Embedded metrics dashboard']
                          })
      return runContext.toPromise()
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    it('has the expected spec object', function () {
      var spec = runContext.generator.spec
      var expectedSpec = {
        appType: 'crud',
        appName: 'notes',
        capabilities: {
          metrics: true
        },
        config: {
          logger: 'helium',
          port: 8080
        }
      }
      assert.objectContent(spec, expectedSpec)
    })
  })

  describe('CRUD application using cloudant',
           function () {
             var runContext
             before(function () {
      // Mock the options, set up an output folder and run the generator
               runContext = helpers.run(path.join(__dirname, '../../generators/app'))
        .withGenerators(dependentGenerators)
        .withOptions({ testmode: true })
        .withPrompts({
          appType: 'Generate a CRUD application',
          name: 'notes',
          dir: 'notes',
          store: 'Cloudant'
        })
        .inTmpDir(function (tmpDir) {
          this.inDir(path.join(tmpDir, 'testDir'))
        })
               return runContext.toPromise()        // Get a Promise back for when the generator finishes
             })

             after(function () {
               runContext.cleanTestDirectory()
             })

             it('creates and changes into a folder according to dir value', function () {
               assert.equal(path.basename(process.cwd()), 'notes')
             })

             it('has the expected spec object', function () {
               var spec = runContext.generator.spec
               var expectedSpec = {
                 appType: 'crud',
                 appName: 'notes',
                 services: {
                   cloudant: [{
                     credentials: {}
                   }]
                 },
                 config: {
                   logger: 'helium',
                   port: 8080
                 }
               }
               assert.objectContent(spec, expectedSpec)
             })
           })

  describe('CRUD application using cloudant with non-default' +
           ' connection details',
           function () {
             var runContext
             before(function () {
      // Mock the options, set up an output folder and run the generator
               runContext = helpers.run(path.join(__dirname, '../../generators/app'))
        .withGenerators(dependentGenerators)
        .withOptions({ testmode: true })
        .withPrompts({
          appType: 'Generate a CRUD application',
          name: 'notes',
          dir: 'notes',
          store: 'Cloudant',
          configure: ['Cloudant / CouchDB'],
          cloudantHost: 'cloudanthost',
          cloudantPort: 4568,
          cloudantSecured: true
        })
        .inTmpDir(function (tmpDir) {
          this.inDir(path.join(tmpDir, 'testDir'))
        })
               return runContext.toPromise()        // Get a Promise back for when the generator finishes
             })

             after(function () {
               runContext.cleanTestDirectory()
             })

             it('created and changed into a folder according to dir value', function () {
               assert.equal(path.basename(process.cwd()), 'notes')
             })

             it('has the expected spec object', function () {
               var spec = runContext.generator.spec
               var expectedSpec = {
                 appType: 'crud',
                 appName: 'notes',
                 services: {
                   cloudant: [{
                     credentials: {
                       host: 'cloudanthost',
                       port: 4568,
                       secured: true
                     }
                   }]
                 },
                 config: {
                   logger: 'helium',
                   port: 8080
                 }
               }
               assert.objectContent(spec, expectedSpec)
             })
           })

  describe('CRUD application using cloudant with non-default' +
           ' connection details and credentials',
           function () {
             var runContext
             before(function () {
      // Mock the options, set up an output folder and run the generator
               runContext = helpers.run(path.join(__dirname, '../../generators/app'))
        .withGenerators(dependentGenerators)
        .withOptions({ testmode: true })
        .withPrompts({
          appType: 'Generate a CRUD application',
          name: 'notes',
          dir: 'notes',
          store: 'Cloudant',
          configure: ['Cloudant / CouchDB'],
          cloudantUsername: 'admin',
          cloudantPassword: 'password123'
        })
        .inTmpDir(function (tmpDir) {
          this.inDir(path.join(tmpDir, 'testDir'))
        })
               return runContext.toPromise()        // Get a Promise back for when the generator finishes
             })

             after(function () {
               runContext.cleanTestDirectory()
             })

             it('created and changed into a folder according to dir value', function () {
               assert.equal(path.basename(process.cwd()), 'notes')
             })

             it('has the expected spec object', function () {
               var spec = runContext.generator.spec
               var expectedSpec = {
                 appType: 'crud',
                 appName: 'notes',
                 services: {
                   cloudant: [{
                     credentials: {
                       username: 'admin',
                       password: 'password123'
                     }
                   }]
                 },
                 config: {
                   logger: 'helium',
                   port: 8080
                 }
               }
               assert.objectContent(spec, expectedSpec)
             })
           })

  describe('Attempt to create a project in a non-empty directory.', function () {
    var runContext
    before(function () {
      var success = false
      // Mock the options, set up an output folder and run the generator
      runContext = helpers.run(path.join(__dirname, '../../generators/app'))
        .withGenerators(dependentGenerators) // Stub subgenerators
        .withOptions({ testmode: true })    // Workaround to stub subgenerators
        .withPrompts({
          appType: 'Generate a CRUD application'
        })
        .inTmpDir(function (tmpDir) {
          var tmpFile = path.join(tmpDir, 'non_empty.txt')    // Created to make the dir a non-empty
          fs.writeFileSync(tmpFile, '')
        })
      return runContext.toPromise()                        // Get a Promise back when the generator finishes\
        .catch(function (err) {
          success = true
          assert(err.message.match('is not an empty directory.*$'), 'Current directory is non-empty and should have thrown an error')
        })
        .then(function () {
          assert(success, 'Current directory is non-empty and should have thrown an error')
        })
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    it('did not generate a project in the current directory', function () {
      var spec = runContext.generator.spec
      assert.objectContent(spec, {})
    })
  })

  describe('Attempt to create a project in a non-empty directory with prompt.', function () {
    var runContext
    before(function () {
      var success = false
      // Mock the options, set up an output folder and run the generator
      runContext = helpers.run(path.join(__dirname, '../../generators/app'))
        .withGenerators(dependentGenerators) // Stub subgenerators
        .withOptions({ testmode: true })    // Workaround to stub subgenerators
        .withPrompts({
          appType: 'Generate a CRUD application'
        })
        .inTmpDir(function (tmpDir) {
          fs.mkdirSync(path.join(tmpDir, 'tmpDir'))
          var tmpFile = path.join(tmpDir, 'tmpDir', 'non_empty.txt')    // Created to make the dir non-empty
          fs.writeFileSync(tmpFile, '')
        })
        .withPrompts({
          name: 'test',
          dir: 'tmpDir'
        })
      return runContext.toPromise()                        // Get a Promise back when the generator finishes\
        .catch(function (err) {              // Should catch the expected error
          success = true
          assert(err.message.match('is not an empty directory.*$'), 'Specified directory is non-empty and should have thrown an error')
        })
        .then(function () {
          assert(success, 'Specified directory is non-empty and should have thrown an error')
        })
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    it('did not generate a project in the specified directory', function () {
      var spec = runContext.generator.spec
      assert.objectContent(spec, {})
    })
  })

  describe('Attempt to create a project in a pre-existing project.', function () {
    var runContext
    before(function () {
      var success = false
      // Mock the options, set up an output folder and run the generator
      runContext = helpers.run(path.join(__dirname, '../../generators/app'))
        .withGenerators(dependentGenerators) // Stub subgenerators
        .withOptions({ testmode: true })    // Workaround to stub subgenerators
        .withPrompts({
          appType: 'Generate a CRUD application'
        })
        .inTmpDir(function (tmpDir) {
          var tmpFile = path.join(tmpDir, '.swiftservergenerator-project')    // Created to make the dir non-empty
          fs.writeFileSync(tmpFile, '')
        })
      return runContext.toPromise()                        // Get a Promise back when the generator finishes\
        .catch(function (err) {
          success = true
          assert(err.message.match('is already a Swift Server Generator project directory.*$'), 'Directory is already a project and should have thrown an error')
        })
        .then(function () {
          assert(success, 'Directory is already a project and should have thrown an error')
        })
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    it('did not generate a project', function () {
      var spec = runContext.generator.spec
      assert.objectContent(spec, {})
    })
  })

  describe('Basic application', function () {
    var runContext

    before(function () {
      runContext = helpers.run(path.join(__dirname, '../../generators/app'))
                          .withGenerators(dependentGenerators)
                          .withOptions({ testmode: true })
                          .withPrompts({
                            appType: 'Scaffold a starter',
                            name: 'mysite',
                            dir: 'mysite',
                            capabilities: []
                          })
      return runContext.toPromise()
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    it('spec object has no capabilities', function () {
      var spec = runContext.generator.spec
      var expectedSpec = {
        appType: 'scaffold',
        appName: 'mysite',
        bluemix: undefined,
        docker: undefined,
        web: undefined,
        hostSwagger: undefined,
        swaggerUI: undefined,
        capabilities: {},
        services: {}
      }
      assert.objectContent(spec, expectedSpec)
    })
  })

  describe('Basic application with bluemix, autoscaling and metrics', function () {
    var runContext
    before(function () {
      runContext = helpers.run(path.join(__dirname, '../../generators/app'))
                          .withGenerators(dependentGenerators)
                          .withOptions({ testmode: true })
                          .withPrompts({
                            appType: 'Scaffold a starter',
                            name: 'mysite',
                            dir: 'mysite',
                            capabilities: [
                              'Embedded metrics dashboard',
                              'Bluemix cloud deployment'
                            ],
                            services: ['Auto-scaling']
                          })
      return runContext.toPromise()
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    it('has expected spec object', function () {
      var spec = runContext.generator.spec
      var expectedSpec = {
        appType: 'scaffold',
        bluemix: true,
        capabilities: {
          metrics: true
        }
      }
      assert.objectContent(spec, expectedSpec)
      assert(spec.capabilities.autoscale.startsWith('mysite-AutoScaling-'))
    })
  })

  describe('Web application', function () {
    var runContext
    before(function () {
      runContext = helpers.run(path.join(__dirname, '../../generators/app'))
                          .withGenerators(dependentGenerators)
                          .withOptions({ testmode: true })
                          .withPrompts({
                            appType: 'Scaffold a starter',
                            name: 'mysite',
                            dir: 'mysite',
                            capabilities: ['Static web file serving']
                          })
      return runContext.toPromise()
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    it('spec object has web', function () {
      var spec = runContext.generator.spec
      var expectedSpec = {
        web: true
      }
      assert.objectContent(spec, expectedSpec)
    })
  })

  describe('Web application with bluemix, autoscaling and metrics', function () {
    var runContext

    before(function () {
      runContext = helpers.run(path.join(__dirname, '../../generators/app'))
                          .withGenerators(dependentGenerators)
                          .withOptions({ testmode: true })
                          .withPrompts({
                            appType: 'Scaffold a starter',
                            name: 'mysite',
                            dir: 'mysite',
                            capabilities: [
                              'Static web file serving',
                              'Embedded metrics dashboard',
                              'Bluemix cloud deployment'
                            ],
                            services: ['Auto-scaling']
                          })
      return runContext.toPromise()
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    it('has expected spec object', function () {
      var spec = runContext.generator.spec
      var expectedSpec = {
        appType: 'scaffold',
        web: true,
        bluemix: true,
        capabilities: {
          metrics: true
        }
      }
      assert.objectContent(spec, expectedSpec)
      assert(spec.capabilities.autoscale.startsWith('mysite-AutoScaling-'))
    })
  })

  describe('Rejected web application with push notifications service with invalid region', function () {
    var runContext
    var error = null

    before(function () {
      runContext = helpers.run(path.join(__dirname, '../../generators/app'))
        .withGenerators(dependentGenerators)
        .withOptions({ testmode: true })
        .withPrompts({
          appType: 'Scaffold a starter',
          capabilities: [
            'Bluemix cloud deployment'
          ],
          services: ['Push Notifications'],
          configure: ['Push Notifications'],
          pushNotificationsRegion: 'NotARegion'
        })
      return runContext.toPromise()
      .catch(function (err) {
        error = err
      })
    })

    after(function () {
      runContext.cleanTestDirectory()
    })

    it('aborts the generator with an error', function () {
      assert(error, 'Should throw an error')
      assert(error.message.match('^.*unknown region.*$'), 'Thrown error should be about unknown region')
    })
  })
})
