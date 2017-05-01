'use strict';
var path = require('path');
var assert = require('yeoman-assert');
var helpers = require('yeoman-test');
var rimraf = require('rimraf');

var appGeneratorPath = path.join(__dirname, '../../../app');

describe('Prompt and single-shot integration tests for app generator', function () {

  describe('Basic application', function() {
    this.timeout(300000); // Allow first test to be slow
    var runContext;

    before(function() {
      runContext = helpers.run(appGeneratorPath)
                          .withOptions({ 'single-shot': true })
                          .withPrompts({
                            appType: 'Scaffold a starter',
                            name: 'notes',
                            dir:  'notes',
                            capabilities: []
                          });
      return runContext.toPromise();
    });

    it('created and changed into a folder according to dir value', function () {
      assert.equal(path.basename(process.cwd()), 'notes');
    });

    it('created a .swiftservergenerator-project file', function() {
      assert.noFile('.swiftservergenerator-project');
    });

    it('created a .yo-rc.json file', function() {
      assert.noFile('.yo-rc.json');
    });

    it('created a LICENSE file', function() {
      assert.file('LICENSE');
    });

    it('created a spec.json file', function() {
      assert.file('spec.json');
    });

    it('created a Package.swift file', function() {
      assert.file('Package.swift');
    });

    it('created a main.swift file', function() {
      assert.file('Sources/notes/main.swift');
    });

    it('created an Application.swift file', function() {
      assert.file('Sources/Application/Application.swift');
    });

    it('Package.swift contains Configuration dependency', function() {
      assert.fileContent('Package.swift', '/Configuration');
    });

    it('Application.swift references Configuration', function() {
      assert.fileContent('Sources/Application/Application.swift', 'import Configuration');
    });

    it('did not create NOTICES.txt', function() {
      assert.noFile('NOTICES.txt');
    });
  });
});