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
var path = require('path');
var assert = require('yeoman-assert');
var helpers = require('yeoman-test');
var rimraf = require('rimraf')
var fs = require('fs');

// Subgenerators to be stubbed
var dependentGenerators = [
  [helpers.createDummyGenerator(), 'swiftserver:refresh'],
  [helpers.createDummyGenerator(), 'swiftserver:build']
];

// Files which we assert are created each time the app generator is run.
var expected = [
  'Package.swift',
  '.swiftservergenerator-project',
  'manifest.yml'
];

describe('swiftserver:app', function () {

  describe('Application name and directory name are the same', function () {

    var runContext;
    before(function () {
      // Mock the options, set up an output folder and run the generator

      runContext = helpers.run(path.join( __dirname, '../../app'))
        .withGenerators(dependentGenerators) // Stub subgenerators
        .withOptions({ testmode:  true })    // Workaround to stub subgenerators
        .withPrompts({                       // Mock the prompt answers
          name: 'notes',
          dir:  'notes'
        });
        return runContext.toPromise();                        // Get a Promise back when the generator finishes
    });

    it('created and changed into a folder according to dir value', function () {
      assert.equal(path.basename(process.cwd()), 'notes');
    });

    it('create a spec object containing the config', function() {
      var spec = runContext.generator.spec;
      var expectedSpec = {
        config: {
          appName: 'notes',
          logger: 'helium',
          port: 8090
        }
      };
      assert.objectContent(spec, expectedSpec);
    });
  });

  describe('Application name and directory names are not the same', function () {

  var runContext;
    before(function () {
      // Mock the options, set up an output folder and run the generator
      runContext = helpers.run(path.join( __dirname, '../../app'))
        .withGenerators(dependentGenerators)
        .withOptions({ testmode:  true })
        .withPrompts({      // Mock the prompt answers
                name: 'applicationName',
                dir:  'directoryName'
              });
        return runContext.toPromise();       // Get a Promise back for when the generator finishes
    });

    it('created and changed into a folder according to dir value', function () {
      assert.equal(path.basename(process.cwd()), 'directoryName');
    });

    it('create a spec object containing the config', function() {
      var spec = runContext.generator.spec;
      var expectedSpec = {
        config: {
          appName: 'applicationName',
          logger: 'helium',
          port: 8090
        }
      };
      assert.objectContent(spec, expectedSpec);
    });

  });

  describe('Application name only is supplied (via the prompt)', function () {

  var runContext;
    before(function () {
      // Mock the options, set up an output folder and run the generator
      runContext = helpers.run(path.join( __dirname, '../../app'))
        .withGenerators(dependentGenerators)
        .withOptions({ testmode:  true })
        .withPrompts({      // Mock the prompt answers
                name: 'appNameOnly'
              });
        return runContext.toPromise();       // Get a Promise back for when the generator finishes
    });

    it('created and changed into a folder according to dir value', function () {
        assert.equal(path.basename(process.cwd()), 'appNameOnly');
    });

    it('create a spec object containing the config', function() {
      var spec = runContext.generator.spec;
      var expectedSpec = {
        config: {
          appName: 'appNameOnly',
          logger: 'helium',
          port: 8090
        }
      };
      assert.objectContent(spec, expectedSpec);
    });
  });

  // Create a testing directory, then supply no arguments via the prompt.
  // We should default to this for the application and directory values.
  describe('Create an application directory and change into it. Supply no arguments via the prompt. ' +
           'The app and dir prompt values should default to application directory.', function () {
  var runContext;
    before(function () {
      // Mock the options, set up an output folder and run the generator
      runContext = helpers.run(path.join( __dirname, '../../app'))
        .withGenerators(dependentGenerators)
        .withOptions({ testmode:  true })
        .inTmpDir(function (tmpDir) {
           this.inDir(path.join(tmpDir, 'appDir'));
        })
        .withPrompts({ });   // Mock the prompt answers
        return runContext.toPromise()        // Get a Promise back for when the generator finishes
        .then(function (dir) {
          assert.equal(path.basename(process.cwd()), 'appDir');
      });
    });

    it('created and changed into a folder according to dir value', function () {
        assert.equal(path.basename(process.cwd()), 'appDir');
    });

    it('create a spec object containing the config', function() {
      var spec = runContext.generator.spec;
      var expectedSpec = {
        config: {
          appName: 'appDir',
          logger: 'helium',
          port: 8090
        }
      };
      assert.objectContent(spec, expectedSpec);
    });
  });

  // Create a directory and change into it for testing. Try supplying the directory
  // name as . (this should work)
  describe('Create an application directory and change into it. Supply dir prompt as .', function () {

    var runContext;
    before(function () {
      // Mock the options, set up an output folder and run the generator
      runContext = helpers.run(path.join( __dirname, '../../app'))
        .withGenerators(dependentGenerators)
        .withOptions({ testmode:  true })
        .inTmpDir(function (tmpDir) {
           this.inDir(path.join(tmpDir, 'currentDir'));
        })
        .withPrompts({
                      name: 'differentAppName',
                      dir:  '.'
                    })
        return runContext.toPromise()        // Get a Promise back for when the generator finishes
        .then(function (dir) {
          assert.equal(path.basename(process.cwd()), 'currentDir');
      });
    });

    it('created and changed into a folder according to dir value', function () {
        assert.equal(path.basename(process.cwd()), 'currentDir');
    });

    it('create a spec object containing the config', function() {
      var spec = runContext.generator.spec;
      var expectedSpec = {
        config: {
          appName: 'differentAppName',
          logger: 'helium',
          port: 8090
        }
      };
      assert.objectContent(spec, expectedSpec);
    });
  });

  describe('Application name is supplied via the command line options (not prompt)', function () {

    var runContext;
    before(function () {
      // Mock the options, set up an output folder and run the generator
      runContext = helpers.run(path.join( __dirname, '../../app'))
        .withGenerators(dependentGenerators)
        .withOptions({ testmode:  true })
        .withArguments(['nameOnCommandLine'])
        return runContext.toPromise();       // Get a Promise back for when the generator finishes
    });

    it('created and changed into a folder according to dir value', function () {
        assert.equal(path.basename(process.cwd()), 'nameOnCommandLine');
    });

    it('create a spec object containing the config', function() {
      var spec = runContext.generator.spec;
      var expectedSpec = {
        config: {
          appName: 'nameOnCommandLine',
          logger: 'helium',
          port: 8090
        }
      };
      assert.objectContent(spec, expectedSpec);
    });
  });

  describe('An invalid application name is supplied via the command line options. ' +
           'Check that we fall back to using the current directory.',
            function () {

    var runContext;
    before(function () {
      // Mock the options, set up an output folder and run the generator
      runContext = helpers.run(path.join( __dirname, '../../app'))
        .withGenerators(dependentGenerators)
        .withOptions({ testmode:  true })
        .withArguments(['inva&%*lid'])
        .inTmpDir(function (tmpDir) {
           this.inDir(path.join(tmpDir, 'validDir'));
        })
        return runContext.toPromise()        // Get a Promise back for when the generator finishes
        .then(function (dir) {
          assert.equal(path.basename(process.cwd()), 'validDir');
      });
    });

    it('created and changed into a folder according to dir value', function () {
        assert.equal(path.basename(process.cwd()), 'validDir');
    });

    it('create a spec object containing the config', function() {
      var spec = runContext.generator.spec;
      var expectedSpec = {
        config: {
          appName: 'validDir',
          logger: 'helium',
          port: 8090
        }
      };
      assert.objectContent(spec, expectedSpec);
    });
  });

  describe('An invalid application name is supplied via the command line. ' +
           'The current directory is also an invalid application name format ' +
           'which cannot be santized. ' +
           'Ensure that we fall back to the default name of "app".',
            function () {

    var runContext;
    before(function () {
      // Mock the options, set up an output folder and run the generator
      runContext = helpers.run(path.join( __dirname, '../../app'))
        .withGenerators(dependentGenerators)
        .withOptions({ testmode:  true })
        .withArguments(['inva&%*lid'])
        .inTmpDir(function (tmpDir) {
           this.inDir(path.join(tmpDir, 'inva&%*lid'));
        })
        return runContext.toPromise();        // Get a Promise back for when the generator finishes
    });

    it('created and changed into a folder according to dir value', function () {
        assert.equal(path.basename(process.cwd()), 'app');
    });

    it('create a spec object containing the config', function() {
      var spec = runContext.generator.spec;
      var expectedSpec = {
        config: {
          appName: 'app',
          logger: 'helium',
          port: 8090
        }
      };
      assert.objectContent(spec, expectedSpec);
    });
  });


  describe('An invalid application name is supplied via the command line. ' +
           'The current directory is also an invalid application name format. ' +
           'Check that the current directory name can be sanitized and then used.',
           function () {
    var runContext;
    before(function () {
      // Mock the options, set up an output folder and run the generator
      runContext = helpers.run(path.join( __dirname, '../../app'))
        .withGenerators(dependentGenerators)
        .withOptions({ testmode:  true })
        .withArguments(['ext&%*ra'])
        .inTmpDir(function (tmpDir) {

           this.inDir(path.join(tmpDir, 'inv@l+l%l:l.lid'));
        })
        return runContext.toPromise();        // Get a Promise back for when the generator finishes
    });

    it('created and changed into a folder according to dir value', function () {
        assert.equal(path.basename(process.cwd()), 'inv-l-l-l-l-lid');
    });

    it('create a spec object containing the config', function() {
      var spec = runContext.generator.spec;
      var expectedSpec = {
        config: {
          appName: 'inv-l-l-l-l-lid',
          logger: 'helium',
          port: 8090
        }
      };
      assert.objectContent(spec, expectedSpec);
    });
  });

  describe('Create a directory and change into it for testing. ' +
           'Enter the application name as the same name, we should use the directory ' +
           'which already existed, not create a new one of the same name.',
           function () {
    var runContext;
    before(function () {
      // Mock the options, set up an output folder and run the generator
      runContext = helpers.run(path.join( __dirname, '../../app'))
        .withGenerators(dependentGenerators)
        .withOptions({ testmode:  true })
        .inTmpDir(function (tmpDir) {
          tmpDir = tmpDir;
          this.inDir(path.join(tmpDir, 'testDir'));
        });
        return runContext.toPromise();        // Get a Promise back for when the generator finishes
    });

    it('created and changed into a folder according to dir value', function () {
        assert.equal(path.basename(process.cwd()), 'testDir');
    });

    it('create a spec object containing the config', function() {
      var spec = runContext.generator.spec;
      var expectedSpec = {
        config: {
          appName: 'testDir',
          logger: 'helium',
          port: 8090
        }
      };
      assert.objectContent(spec, expectedSpec);
    });
  });

  describe('Configure the config.json with the prompts' +
           ' to have cloudant as the data store.',
           function () {

    var runContext;
    before(function () {
      // Mock the options, set up an output folder and run the generator
      runContext = helpers.run(path.join( __dirname, '../../app'))
        .withGenerators(dependentGenerators)
        .withOptions({ testmode:  true })
        .withPrompts({
          name: 'notes',
          dir:  'notes',
          store: 'cloudant'
        })
        .inTmpDir(function (tmpDir) {
           this.inDir(path.join(tmpDir, 'testDir'));
        });
        return runContext.toPromise();        // Get a Promise back for when the generator finishes
    });

    it('created and changed into a folder according to dir value', function () {
        assert.equal(path.basename(process.cwd()), 'notes');
    });

    it('create a spec object containing the config', function() {
      var spec = runContext.generator.spec;
      var expectedSpec = {
        config: {
          appName: 'notes',
          store: 'cloudant',
          logger: 'helium',
          port: 8090
        }
      };
      assert.objectContent(spec, expectedSpec);
    });
  });

  describe('Configure the config.json with the prompts' +
           ' to have cloudant as the data store and' +
           ' configure the connection properties.',
           function () {

    var runContext;
    before(function () {
      // Mock the options, set up an output folder and run the generator
      runContext = helpers.run(path.join( __dirname, '../../app'))
        .withGenerators(dependentGenerators)
        .withOptions({ testmode:  true })
        .withPrompts({
          name: 'notes',
          dir:  'notes',
          store: 'cloudant',
          default: false,
          host: 'cloudanthost',
          port: 8080,
          secured: true
        })
        .inTmpDir(function (tmpDir) {
           this.inDir(path.join(tmpDir, 'testDir'));
        });
        return runContext.toPromise();        // Get a Promise back for when the generator finishes
    });

    it('created and changed into a folder according to dir value', function () {
        assert.equal(path.basename(process.cwd()), 'notes');
    });

    it('create a spec object containing the config', function() {
      var spec = runContext.generator.spec;
      var expectedSpec = {
        config: {
          appName: 'notes',
          store: {
            type: 'cloudant',
            host: 'cloudanthost',
            port: 8080,
            secured: true
          },
          logger: 'helium',
          port: 8090
        }
      };
      assert.objectContent(spec, expectedSpec);
    });
  });

  describe('Configure the config.json with the prompts' +
           ' to have cloudant as the data store and' +
           ' configure the credentials.',
           function () {

    var runContext;
    before(function () {
      // Mock the options, set up an output folder and run the generator
      runContext = helpers.run(path.join( __dirname, '../../app'))
        .withGenerators(dependentGenerators)
        .withOptions({ testmode:  true })
        .withPrompts({
          name: 'notes',
          dir:  'notes',
          store: 'cloudant',
          credentials: true,
          username: 'admin',
          password: 'password123'
        })
        .inTmpDir(function (tmpDir) {
           this.inDir(path.join(tmpDir, 'testDir'));
        });
        return runContext.toPromise();        // Get a Promise back for when the generator finishes
    });

    it('created and changed into a folder according to dir value', function () {
        assert.equal(path.basename(process.cwd()), 'notes');
    });

    it('create a spec object containing the config', function() {
      var spec = runContext.generator.spec;
      var expectedSpec = {
        config: {
          appName: 'notes',
          store: {
            type: 'cloudant',
            host: 'localhost',
            port: 5984,
            secured: false,
            username: 'admin',
            password: 'password123'
          },
          logger: 'helium',
          port: 8090
        }
      };
      assert.objectContent(spec, expectedSpec);
    });
  });

  describe('Attempt to create a project in a non-empty directory.', function () {

    var runContext;
    before(function () {
      var success = false;
      // Mock the options, set up an output folder and run the generator
      runContext = helpers.run(path.join( __dirname, '../../app'))
        .withGenerators(dependentGenerators) // Stub subgenerators
        .withOptions({ testmode:  true })    // Workaround to stub subgenerators
        .inTmpDir(function (tmpDir) {
          var tmpFile = path.join(tmpDir, "non_empty.txt");    //Created to make the dir a non-empty
          fs.writeFileSync(tmpFile, "");
        });
        return runContext.toPromise()                        // Get a Promise back when the generator finishes\
        .catch(function(err) {
          success = true;
          assert(err.message.match('is not an empty directory.*$'), 'Current directory is non-empty and should have thrown an error');
        })
        .then(function(){
          assert(success, 'Current directory is non-empty and should have thrown an error');
        });
    });

    it('did not generate a project in the current directory', function () {
      var spec = runContext.generator.spec;
      assert.objectContent(spec, {});
    })
  });

  describe('Attempt to create a project in a non-empty directory with prompt.', function () {

    var runContext;
    before(function () {
      var success = false;
      // Mock the options, set up an output folder and run the generator
      runContext = helpers.run(path.join( __dirname, '../../app'))
        .withGenerators(dependentGenerators) // Stub subgenerators
        .withOptions({ testmode:  true })    // Workaround to stub subgenerators
        .inTmpDir(function (tmpDir) {
          fs.mkdirSync(path.join(tmpDir, 'tmpDir'));
          var tmpFile = path.join(tmpDir, 'tmpDir', "non_empty.txt");    //Created to make the dir non-empty
          fs.writeFileSync(tmpFile, "");
        })
        .withPrompts({
          name: 'test',
          dir: 'tmpDir'
        });
        return runContext.toPromise()                        // Get a Promise back when the generator finishes\
        .catch(function(err) {              // Should catch the expected error
          success = true;
          assert(err.message.match('is not an empty directory.*$'), 'Specified directory is non-empty and should have thrown an error');
        })
        .then(function(){
          assert(success, 'Specified directory is non-empty and should have thrown an error');
        });
    });

    it('did not generate a project in the specified directory', function () {
      var spec = runContext.generator.spec;
      assert.objectContent(spec, {});
    })
  });

  describe('Attempt to create a project in a pre-existing project.', function () {

    var runContext;
    before(function () {
      var success = false;
      // Mock the options, set up an output folder and run the generator
      runContext = helpers.run(path.join( __dirname, '../../app'))
        .withGenerators(dependentGenerators) // Stub subgenerators
        .withOptions({ testmode:  true })    // Workaround to stub subgenerators
        .inTmpDir(function (tmpDir) {
          var tmpFile = path.join(tmpDir, ".swiftservergenerator-project");    //Created to make the dir non-empty
          fs.writeFileSync(tmpFile, "");
        })
        return runContext.toPromise()                        // Get a Promise back when the generator finishes\
        .catch(function(err) {
          success = true;
          assert(err.message.match('is already a Swift Server Generator project directory.*$'), 'Directory is already a project and should have thrown an error');
        })
        .then(function(){
          assert(success, 'Directory is already a project and should have thrown an error');
        });
    });
    it('did not generate a project', function () {
      var spec = runContext.generator.spec;
      assert.objectContent(spec, {});
    })
  });
});
