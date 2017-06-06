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
