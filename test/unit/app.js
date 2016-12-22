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
  '.swiftservergenerator-project'
];

var testingDir;
//Deletes the temporary directory and the contents
//(should be called after test has completed).
function deleteTempDir() {
  rimraf(testingDir, function(err) {
    if(err) {
      console.log('Error: ', err);
    }
  });
}

//If the test creates the directory automatically then we have to go up one
//folder before trying to delete.
function getTempDir() {
  var temp = process.cwd().split("/");
  temp.pop();
  testingDir = temp.join("/");
}

describe('swiftserver:app', function () {

  describe('Application name and directory name are the same', function () {

    before(function () {
      // Mock the options, set up an output folder and run the generator
      return helpers.run(path.join( __dirname, '../../app'))
        .withGenerators(dependentGenerators) // Stub subgenerators
        .withOptions({ testmode:  true })    // Workaround to stub subgenerators
        .withPrompts({                       // Mock the prompt answers
          name: 'notes',
          dir:  'notes'
        })
        .toPromise();                        // Get a Promise back when the generator finishes
    });

    after(function() {
      deleteTempDir();
    });

    it('created and changed into a folder according to dir value', function () {
      getTempDir();
      assert.equal(path.basename(process.cwd()), 'notes');
    });

    it('generates the expected application files', function () {
      assert.file(expected);
    });

    it('has the appname in the Package.swift file', function () {
      assert.fileContent('Package.swift', 'name: "notes"');
    });
  });

  describe('Application name and directory names are not the same', function () {

    before(function () {
      // Mock the options, set up an output folder and run the generator
      return helpers.run(path.join( __dirname, '../../app'))
        .withGenerators(dependentGenerators)
        .withOptions({ testmode:  true })
        .withPrompts({      // Mock the prompt answers
                name: 'applicationName',
                dir:  'directoryName'
              })
        .toPromise();       // Get a Promise back for when the generator finishes
    });

    after(function() {
      deleteTempDir();
    });

    it('created and changed into a folder according to dir value', function () {
      getTempDir();
      assert.equal(path.basename(process.cwd()), 'directoryName');
    });

    it('generates the expected application files', function () {
      assert.file(expected);
    });

    it('has the appname in the Package.swift file', function () {
      assert.fileContent('Package.swift', 'name: "applicationName"');
    });
  });

  describe('Application name only is supplied (via the prompt)', function () {

    before(function () {
      // Mock the options, set up an output folder and run the generator
      return helpers.run(path.join( __dirname, '../../app'))
        .withGenerators(dependentGenerators)
        .withOptions({ testmode:  true })
        .withPrompts({      // Mock the prompt answers
                name: 'appNameOnly'
              })
        .toPromise();       // Get a Promise back for when the generator finishes
    });

    after(function() {
      deleteTempDir();
    });

    it('created and changed into a folder according to dir value', function () {
        getTempDir();
        assert.equal(path.basename(process.cwd()), 'appNameOnly');
    });

    it('generates the expected application files', function () {
      assert.file(expected);
    });

    it('has the appname in the Package.swift file', function () {
      assert.fileContent('Package.swift', 'name: "appNameOnly"');
    });
  });

  // Create a testing directory, then supply no arguments via the prompt.
  // We should default to this for the application and directory values.
  describe('Create an application directory and change into it. Supply no arguments via the prompt. ' +
           'The app and dir prompt values should default to application directory.', function () {

    before(function () {
      // Mock the options, set up an output folder and run the generator
      return helpers.run(path.join( __dirname, '../../app'))
        .withGenerators(dependentGenerators)
        .withOptions({ testmode:  true })
        .inTmpDir(function (tmpDir) {
          testingDir = tmpDir;
           this.inDir(path.join(tmpDir, 'appDir'));
        })
        .withPrompts({ })   // Mock the prompt answers
        .toPromise()        // Get a Promise back for when the generator finishes
        .then(function (dir) {
          assert.equal(path.basename(process.cwd()), 'appDir');
      });
    });

    after(function() {
      deleteTempDir();
    });

    it('created and changed into a folder according to dir value', function () {
        assert.equal(path.basename(process.cwd()), 'appDir');
    });

    it('generates the expected application files', function () {
      assert.file(expected);
    });

    it('has the appname in the Package.swift file', function () {
      assert.fileContent('Package.swift', 'name: "appDir"');
    });
  });

  // Create a directory and change into it for testing. Try supplying the directory
  // name as . (this should work)
  describe('Create an application directory and change into it. Supply dir prompt as .', function () {

    before(function () {
      // Mock the options, set up an output folder and run the generator
      return helpers.run(path.join( __dirname, '../../app'))
        .withGenerators(dependentGenerators)
        .withOptions({ testmode:  true })
        .inTmpDir(function (tmpDir) {
          testingDir = tmpDir;
           this.inDir(path.join(tmpDir, 'currentDir'));
        })
        .withPrompts({
                      name: 'differentAppName',
                      dir:  '.'
                    })
        .toPromise()        // Get a Promise back for when the generator finishes
        .then(function (dir) {
          assert.equal(path.basename(process.cwd()), 'currentDir');
      });
    });

    after(function() {
      deleteTempDir();
    });

    it('created and changed into a folder according to dir value', function () {
        assert.equal(path.basename(process.cwd()), 'currentDir');
    });

    it('generates the expected application files', function () {
      assert.file(expected);
    });

    it('has the appname in the Package.swift file', function () {
      assert.fileContent('Package.swift', 'name: "differentAppName"');
    });
  });


  describe('Application name is supplied via the command line options (not prompt)', function () {

    before(function () {
      // Mock the options, set up an output folder and run the generator
      return helpers.run(path.join( __dirname, '../../app'))
        .withGenerators(dependentGenerators)
        .withOptions({ testmode:  true })
        .withArguments(['nameOnCommandLine'])
        .toPromise();       // Get a Promise back for when the generator finishes
    });

    after(function() {
      deleteTempDir();
    });

    it('created and changed into a folder according to dir value', function () {
        getTempDir();
        assert.equal(path.basename(process.cwd()), 'nameOnCommandLine');
    });

    it('generates the expected application files', function () {
      assert.file(expected);
    });

    it('has the appname in the Package.swift file', function () {
      assert.fileContent('Package.swift', 'name: "nameOnCommandLine"');
    });
  });

  describe('An invalid application name is supplied via the command line options. ' +
           'Check that we fall back to using the current directory.',
            function () {

    before(function () {
      // Mock the options, set up an output folder and run the generator
      return helpers.run(path.join( __dirname, '../../app'))
        .withGenerators(dependentGenerators)
        .withOptions({ testmode:  true })
        .withArguments(['inva&%*lid'])
        .inTmpDir(function (tmpDir) {
          testingDir = tmpDir;
           this.inDir(path.join(tmpDir, 'validDir'));
        })
        .toPromise()        // Get a Promise back for when the generator finishes
        .then(function (dir) {
          assert.equal(path.basename(process.cwd()), 'validDir');
      });
    });

    after(function() {
      deleteTempDir();
    });

    it('created and changed into a folder according to dir value', function () {
        assert.equal(path.basename(process.cwd()), 'validDir');
    });

    it('generates the expected application files', function () {
      assert.file(expected);
    });

    it('has the appname in the Package.swift file', function () {
      assert.fileContent('Package.swift', 'name: "validDir"');
    });
  });

  describe('An invalid application name is supplied via the command line. ' +
           'The current directory is also an invalid application name format ' +
           'which cannot be santized. ' +
           'Ensure that we fall back to the default name of "app".',
            function () {

    before(function () {
      // Mock the options, set up an output folder and run the generator
      return helpers.run(path.join( __dirname, '../../app'))
        .withGenerators(dependentGenerators)
        .withOptions({ testmode:  true })
        .withArguments(['inva&%*lid'])
        .inTmpDir(function (tmpDir) {
          testingDir = tmpDir;
           this.inDir(path.join(tmpDir, 'inva&%*lid'));
        })
        .toPromise();        // Get a Promise back for when the generator finishes
    });

    after(function() {
      deleteTempDir();
    });

    it('created and changed into a folder according to dir value', function () {
        assert.equal(path.basename(process.cwd()), 'app');
    });

    it('generates the expected application files', function () {
      assert.file(expected);
    });

    it('has the appname in the Package.swift file', function () {
      assert.fileContent('Package.swift', 'name: "app"');
    });
  });


  describe('An invalid application name is supplied via the command line. ' +
           'The current directory is also an invalid application name format. ' +
           'Check that the current directory name can be sanitized and then used.',
           function () {

    before(function () {
      // Mock the options, set up an output folder and run the generator
      return helpers.run(path.join( __dirname, '../../app'))
        .withGenerators(dependentGenerators)
        .withOptions({ testmode:  true })
        .withArguments(['ext&%*ra'])
        .inTmpDir(function (tmpDir) {
          testingDir = tmpDir;
           this.inDir(path.join(tmpDir, 'inv@l+l%l:l.lid'));
        })
        .toPromise();        // Get a Promise back for when the generator finishes
    });

    after(function() {
      deleteTempDir();
    });

    it('created and changed into a folder according to dir value', function () {
        assert.equal(path.basename(process.cwd()), 'inv-l-l-l-l-lid');
    });

    it('generates the expected application files', function () {
      assert.file(expected);
    });

    it('has the appname in the Package.swift file', function () {
      assert.fileContent('Package.swift', 'name: "inv-l-l-l-l-lid"');
    });
  });

  describe('Create a directory and change into it for testing. ' +
           'Enter the application name as the same name, we should use the directory ' +
           'which already existed, not create a new one of the same name.',
           function () {

    before(function () {
      // Mock the options, set up an output folder and run the generator
      return helpers.run(path.join( __dirname, '../../app'))
        .withGenerators(dependentGenerators)
        .withOptions({ testmode:  true })
        .inTmpDir(function (tmpDir) {
          testingDir = tmpDir;
           this.inDir(path.join(tmpDir, 'testDir'));
        })
        .toPromise();        // Get a Promise back for when the generator finishes
    });

    after(function() {
      deleteTempDir();
    });

    it('created and changed into a folder according to dir value', function () {
        assert.equal(path.basename(process.cwd()), 'testDir');
    });

    it('generates the expected application files', function () {
      assert.file(expected);
    });

    it('has the appname in the Package.swift file', function () {
      assert.fileContent('Package.swift', 'name: "testDir"');
    });
  });

  describe('Configure the config.json with the prompts' +
           ' to have cloudant as the data store.',
           function () {

    before(function () {
      // Mock the options, set up an output folder and run the generator
      return helpers.run(path.join( __dirname, '../../app'))
        .withGenerators(dependentGenerators)
        .withOptions({ testmode:  true })
        .withPrompts({
          name: 'notes',
          dir:  'notes',
          store: 'cloudant'
        })
        .inTmpDir(function (tmpDir) {
          testingDir = tmpDir;
           this.inDir(path.join(tmpDir, 'testDir'));
        })
        .toPromise();        // Get a Promise back for when the generator finishes
    });

    after(function() {
      getTempDir();
      deleteTempDir();
    });

    it('created and changed into a folder according to dir value', function () {
        assert.equal(path.basename(process.cwd()), 'notes');
    });

    it('generates the expected application files', function () {
      assert.file(expected);
    });

    it('has the appname in the Package.swift file', function () {
      assert.jsonFileContent('config.json', {store: 'cloudant'})
    });
  });

  describe('Configure the config.json with the prompts' +
           ' to have cloudant as the data store and' +
           ' configure the connection properties.',
           function () {

    before(function () {
      // Mock the options, set up an output folder and run the generator
      return helpers.run(path.join( __dirname, '../../app'))
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
          testingDir = tmpDir;
           this.inDir(path.join(tmpDir, 'testDir'));
        })
        .toPromise();        // Get a Promise back for when the generator finishes
    });

    after(function() {
      getTempDir();
      deleteTempDir();
    });

    it('created and changed into a folder according to dir value', function () {
        assert.equal(path.basename(process.cwd()), 'notes');
    });

    it('generates the expected application files', function () {
      assert.file(expected);
    });

    it('has the appname in the Package.swift file', function () {
      var storeConfig = {
        type: 'cloudant',
        host: 'cloudanthost',
        port: 8080,
        secured: true
      }
      assert.jsonFileContent('config.json', {store: storeConfig})
    });
  });
  describe('Configure the config.json with the prompts' +
           ' to have cloudant as the data store and' +
           ' configure the credentials.',
           function () {

    before(function () {
      // Mock the options, set up an output folder and run the generator
      return helpers.run(path.join( __dirname, '../../app'))
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
          testingDir = tmpDir;
           this.inDir(path.join(tmpDir, 'testDir'));
        })
        .toPromise();        // Get a Promise back for when the generator finishes
    });

    after(function() {
      getTempDir();
      deleteTempDir();
    });

    it('created and changed into a folder according to dir value', function () {
        assert.equal(path.basename(process.cwd()), 'notes');
    });

    it('generates the expected application files', function () {
      assert.file(expected);
    });

    it('has the appname in the Package.swift file', function () {
      var storeConfig = {
        type: 'cloudant',
        host: 'localhost',
        port: 5984,
        secured: false,
        username: 'admin',
        password: 'password123'
      }
      assert.jsonFileContent('config.json', {store: storeConfig})
    });
  });

  describe('Attempt to create a project in a non-empty directory.', function () {

    before(function () {
      var success = false;
      // Mock the options, set up an output folder and run the generator
      return helpers.run(path.join( __dirname, '../../app'))
        .withGenerators(dependentGenerators) // Stub subgenerators
        .withOptions({ testmode:  true })    // Workaround to stub subgenerators
        .inTmpDir(function (tmpDir) {
          testingDir = tmpDir;
          var tmpFile = path.join(testingDir, "non_empty.txt");    //Created to make the dir a non-empty
          fs.writeFileSync(tmpFile, "");
        })
        .toPromise()                        // Get a Promise back when the generator finishes\
        .catch(function(err) {
          success = true;
          assert(err.message.match('is not an empty directory.*$'), 'Current directory is non-empty and should have thrown an error');
        })
        .then(function(){
          assert(success, 'Current directory is non-empty and should have thrown an error');
        });
    });

    after(function() {
      deleteTempDir();
    });

    it('did not generate a project in the current directory', function () {
      assert.noFile(expected);
    })
  });

  describe('Attempt to create a project in a non-empty directory with prompt.', function () {

    before(function () {
      var success = false;
      // Mock the options, set up an output folder and run the generator
      return helpers.run(path.join( __dirname, '../../app'))
        .withGenerators(dependentGenerators) // Stub subgenerators
        .withOptions({ testmode:  true })    // Workaround to stub subgenerators
        .inTmpDir(function (tmpDir) {
          testingDir = tmpDir;
          fs.mkdirSync(path.join(testingDir, 'testingDir'));
          var tmpFile = path.join(testingDir, 'testingDir', "non_empty.txt");    //Created to make the dir non-empty
          fs.writeFileSync(tmpFile, "");
        })
        .withPrompts({
          name: 'test',
          dir: 'testingDir'
        })
        .toPromise()                        // Get a Promise back when the generator finishes\
        .catch(function(err) {              // Should catch the expected error
          success = true;
          assert(err.message.match('is not an empty directory.*$'), 'Specified directory is non-empty and should have thrown an error');
        })
        .then(function(){
          assert(success, 'Specified directory is non-empty and should have thrown an error');
        });
    });

    after(function() {
      deleteTempDir();
    });

    it('did not generate a project in the specified directory', function () {
      assert.noFile(expected);
    })
  });

  describe('Attempt to create a project in a pre-existing project.', function () {

    before(function () {
      var success = false;
      // Mock the options, set up an output folder and run the generator
      return helpers.run(path.join( __dirname, '../../app'))
        .withGenerators(dependentGenerators) // Stub subgenerators
        .withOptions({ testmode:  true })    // Workaround to stub subgenerators
        .inTmpDir(function (tmpDir) {
          testingDir = tmpDir;
          var tmpFile = path.join(testingDir, ".swiftservergenerator-project");    //Created to make the dir non-empty
          fs.writeFileSync(tmpFile, "");
        })
        .toPromise()                        // Get a Promise back when the generator finishes\
        .catch(function(err) {
          success = true;
          assert(err.message.match('is already a Swift Server Generator project directory.*$'), 'Directory is already a project and should have thrown an error');
        })
        .then(function(){
          assert(success, 'Directory is already a project and should have thrown an error');
        });
    });

    after(function() {
      deleteTempDir();
    });

    it('did not generate a project', function () {
      assert.noFile('Package.swift');
    })
  });
});
