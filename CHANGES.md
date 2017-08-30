# Change Log

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

<a name="2.8.0"></a>
# [2.8.0](https://github.com/IBM-Swift/generator-swiftserver/compare/2.7.0...2.8.0) (2017-08-30)


### Bug Fixes

* default toolchain type clone ([e0bb80d](https://github.com/IBM-Swift/generator-swiftserver/commit/e0bb80d))
* override default toolchain type ([4f8b681](https://github.com/IBM-Swift/generator-swiftserver/commit/4f8b681))


### Features

* improve swagger basepath handling ([#269](https://github.com/IBM-Swift/generator-swiftserver/issues/269)) ([810ba5e](https://github.com/IBM-Swift/generator-swiftserver/commit/810ba5e))



<a name="2.7.0"></a>
# [2.7.0](https://github.com/IBM-Swift/generator-swiftserver/compare/2.6.0...2.7.0) (2017-07-24)


### Features

* decouple swaggerize ([ead4636](https://github.com/IBM-Swift/generator-swiftserver/commit/ead4636))
* enable iOS sdk generation after invoking model generator ([#260](https://github.com/IBM-Swift/generator-swiftserver/issues/260)) ([f27a770](https://github.com/IBM-Swift/generator-swiftserver/commit/f27a770))



<a name="2.6.0"></a>
# [2.6.0](https://github.com/IBM-Swift/generator-swiftserver/compare/2.5.0...2.6.0) (2017-07-18)


### Bug Fixes

* moved init log to happen even if app name is passed in as a parameter ([24a2a8c](https://github.com/IBM-Swift/generator-swiftserver/commit/24a2a8c))


### Features

* colored logs to better categorize prompts ([e66f89d](https://github.com/IBM-Swift/generator-swiftserver/commit/e66f89d))



2017-07-13, Version 2.5.0
=========================

* fix: reject promises on failures (#253, #252)
* fix: improve Swagger validation (#244)
* fix: update AppID service label (#245)
* fix: ensure the Bff defaults for 'endpoints to generate' (#239)
* fix: add default region to PushNotification service init (#236)
* feat: added health endpoint to manifest.yml (#251)
* feat: add iOS and Swift server SDK generation (#225)
* feat: update health endpoint to utilize Health framework (#232)
* chore(deps): yeoman-generator@^1.1.1 and update (#246, #240, #238)
* chore: add config var for status check interval (#254)
* chore: change to standard code style (#241)
* test(deps): yeoman-assert@^3.0.0 (#250)
* test(deps): yeoman-test@^1.6.0 (#249)
* test(unit): add more sdkgen tests  (#256)
* test(unit): mock sdkgen requests with nock (#248, #242)
* test: add test for invalid region (#243)
* test: fix missing testmode option in unit test (#247)

2017-06-21, Version 2.4.1
=========================

* Update Watson Conversation service label (#231)
* Fix bug with non-root docker user support (#234)
* Add node 8 to Travis builds
* Add unit tests for http swagger retrieval (#230)
* Remove unused rimraf require (#229)

2017-06-15, Version 2.4.0
=========================

* Fix second non-root user has privilege failure (#227)
* Push SDK generator (#219)
* Data models should be required for POST, PUT and PATCH verbs (#226)
* Allow feature branches to be built by travis (#220)
* Improve code coverage and debug for Swagger parsing (#224)
* Fix undefined reference (#223)

2017-06-07, Version 2.3.0
=========================

* Generate from swagger (#218)
* Add SwaggerUI and Autoscaling service to the CRUD flow (#221)
* Support local cloudant for dev when packaging for Bluemix (#217)

2017-06-01, Version 2.2.0
=========================

* Rework service.version variable extraction (#216)
* Readme for Alert Notification (#215)
* Improve integration tests for new services (#211)
* Add initial health endpoint (#208)
* Increase mocha default timeout for test stability (#212)
* Fix docker using root user on Linux (#185)
* Improve support for debugging with docker (#210)
* Fix minor issues in watson tests (#209)
* Add Alert notification service (#206)
* Added Tests folder with a basic test example to common files (#202)
* Add Watson conversation service (#205)

2017-05-12, Version 2.1.0
=========================

* Swift 3.1.1 support (#191,#201,#203)
* Don't overwrite existing user-owned files (#199)
* Fix integration tests with custom generator dir (#200)
* Add Object Storage test (#184)
* Add badges to README.md for Travis and Codecov.io (#197)
* Add .build-ubuntu as a file to ignores (#192)
* Add validation of appType, fix tests (#193)
* Narrow dependency on Kitura-Credentials (#194)
* Add --single-shot option (#186)
* Generate extension to Configuration Manager for local projects (#183)
* Update debug port mapping in cli-config (#179)
* Update travis test configuration for latest Package-Builder changes (#176,#181)
* Fix XCode compilation by adding import Foundation to generated main.swift (#172)
* Update spec.json when a model is updated in a CRUD project (#169)
* Generate an <application>.xcodeproj file (#166)

2017-04-10, Version 2.0.2
=========================

* variable defs in travisCI
* Updated README to reflect docker changes (#161)
* Errors when non-CRUD type in property and model generator (#160)
* cfignore no longer created when non-Bluemix
* Doesn't overwrite the Application.swift (#164)
* Doesn't overwrite the SwaggerRoute.swift (#165)
* Generates CRUD error files (#163)
* Remove port 8090 references in tests (#167)
* Added credentials tests (#168)
* Pin Swift version to 3.0.2 in docker files (#170)


2017-03-29, Version 2.0.1
=========================

* Added codecov reports
* Added tests for validators
* Fixed CRUD name/crudservice name insconsitency
* Additional unit tests for helpers (#154)
* Additional unit tests for helpers
* Fix dependency problems since Kitura 1.7 (#156)
* Update Package.swift to reference SwiftMetrics version 1
* Tighten Kitura related dependencies to 1.6.x
* Reorder dependencies to fix graph problem
* Inject Kitura-Request dep to tighten version

2017-03-17, Version 2.0.0
=========================

Major update:

 * Remove dependency on GeneratedSwiftServer
 * Remove dependency on GeneratedSwiftServer-CloudantStore
 * Add scaffolding of starter applications
 * Bluemix deploy and services support
 * Docker support
 * Metrics dashboard support

2016-12-09, Version 1.0.4
=========================

 * Add copyright notice to apic-node-wrapper.js (Mike Tunnicliffe)


2016-12-08, Version 1.0.3
=========================

 * Update refresh APIC test (Mike Tunnicliffe)

 * Update refresh test (Mike Tunnicliffe)

 * Correctly changes required field (Robert Deans)

 * Fix bug in Swagger if app name and dir differ (Mike Tunnicliffe)


2016-12-08, Version 1.0.2
=========================

 * Add copyright to template files (Mike Tunnicliffe)


2016-12-06, Version 1.0.0
=========================

 * First release!
