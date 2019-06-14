## Scaffolded Swift Kitura server application

This scaffolded application provides a starting point for creating Swift applications running on [Kitura](http://www.kitura.io/).

### Table of Contents
* [Requirements](#requirements)
* [Project contents](#project-contents)
* [Run](#run)
* [Configuration](#configuration)
* [Deploy to IBM Cloud](#deploy-to-ibm-cloud)
* [Service descriptions](#service-descriptions)
* [License](#license)
* [Generator](#generator)

#### Project contents
This application has been generated with the following capabilities and services, which are described in full in their respective sections below:

* [CloudEnvironment](#configuration)
{{#if web}}
* [Static web file serving](#static-web-file-serving)
{{/if}}
{{#if hostSwagger}}
* [OpenAPI / Swagger endpoint](#openapi--swagger-endpoint)
{{/if}}
{{#if exampleEndpoints}}
* [Example endpoints](#example-endpoints)
{{/if}}
{{#if metrics}}
* [Embedded metrics dashboard](#embedded-metrics-dashboard)
{{/if}}
{{#if docker}}
* [Docker files](#docker-files)
{{/if}}
* [Iterative Development](#iterative-development)
* [IBM Cloud deployment](#ibm-cloud-deployment)
{{#if cloudant}}
* [Cloudant](#cloudant)
{{/if}}
{{#if redis}}
* [Redis](#redis)
{{/if}}
{{#if appid}}
* [AppID](#appid)
{{/if}}
{{#if conversation}}
* [Watson Assistant](#watson-assistant)
{{/if}}
{{#if alertNotification}}
* [Alert Notification](#alert-notification)
{{/if}}
{{#if push}}
* [Push Notifications](#push-notifications)
{{/if}}
{{#if autoscaling}}
* [Auto-scaling](#auto-scaling)
{{/if}}


### Requirements
* [Swift 4](https://swift.org/download/)

### Run
To build and run the application:
1. `swift build`
1. `.build/debug/{{executableName}}`

{{#if docker}}
#### Docker
A description of the files related to Docker can be found in the [Docker files](#docker-files) section. To build the two Docker images, run the following commands from the root directory of the project.

First, build the 'tools' image. This image contains a full Linux Swift toolchain and is capable of compiling your application for Linux:
* `docker build --tag myapp-build --file Dockerfile-tools .`
You may customize the names of these images by specifying a different value after the `-t` option.

To compile the application for Linux using the tools Docker image, run:
* `docker run -v $PWD:/swift-project -w /swift-project myapp-build /swift-utils/tools-utils.sh build release`
This produces a `.build-ubuntu` directory which will be incorporated into your final image.

Now that your application has been built, you can build the final run image:
* `docker build --tag myapp-run .`

Finally, to run the application:
* `docker run -it --publish 8080:8080 --volume $PWD:/swift-project --workdir /swift-project myapp-run sh -c .build-ubuntu/release/{{executableName}}`


#### Kubernetes
To deploy your application to your Kubernetes cluster, run `helm install --name myapp .` in the `/chart/{{chartName}}` directory. You need to make sure you change the `repository` variable in your `chart/{{chartName}}/values.yaml` file points to the docker image containing your runnable application.
{{/if}}

### Configuration
Your application configuration information for any services is stored in the `localdev-config.json` file in the `config` directory. This file is in the `.gitignore` to prevent sensitive information from being stored in git. The connection information for any configured services that you would like to access when running locally, such as username, password and hostname, is stored in this file.

The application uses the [CloudEnvironment package](https://github.com/IBM-Swift/CloudEnvironment) to read the connection and configuration information from the environment and this file. It uses `mappings.json`, found in the `config` directory, to communicate where the credentials can be found for each service.

If the application is running locally, it can connect to IBM Cloud services using unbound credentials read from this file. If you need to create unbound credentials you can do so from the IBM Cloud web console ([example](https://cloud.ibm.com/docs/services/Cloudant/tutorials/create_service.html#creating-a-service-instance)), or using the CloudFoundry CLI [`cf create-service-key` command](http://cli.cloudfoundry.org/en-US/cf/create-service-key.html).

When you push your application to IBM Cloud, these values are no longer used, instead the application automatically connects to bound services using environment variables.

#### Iterative Development
The `iterative-dev.sh` script is included in the root of the generated Swift project and allows for fast & easy iterations for the developer. Instead of stopping the running Kitura server to see new code changes, while the script is running, it will automatically detect changes in the project's **.swift** files and recompile the app accordingly.

To use iterative development:
* For native OS, execute the `./iterative-dev.sh` script from the root of the project.
{{#if docker}}
* With docker, shell into the tools container mentioned above, and run the `./swift-project/iterative-dev.sh` script.  File system changes are detected using a low-tech infinitely looping poll mechanism, which works in both local OS/filesystem and across host OS->Docker container volume scenarios.
{{/if}}

### Deploy to IBM Cloud
You can deploy your application to IBM Cloud using:
* the [CloudFoundry CLI](#cloudfoundry-cli)
* an [IBM Cloud toolchain](#ibm-cloud-toolchain)

#### CloudFoundry CLI
You can deploy the application using the IBM Cloud command-line:
1. Install the [IBM Cloud CLI](https://cloud.ibm.com/docs/cli/index.html)
1. Ensure all configured services have been provisioned
1. Run `ibmcloud app push` from the project root directory

The Cloud Foundry CLI will not provision the configured services for you, so you will need to do this manually using the IBM Cloud web console ([example](https://cloud.ibm.com/docs/services/Cloudant/tutorials/create_service.html#creating-a-service-instance)) or the CloudFoundry CLI (`cf create-service` command)[http://cli.cloudfoundry.org/en-US/cf/create-service.html]. The service names and types will need to match your [configuration](#configuration).

#### IBM Cloud toolchain
You can also set up a default IBM Cloud Toolchain to handle deploying your application to IBM Cloud. This is achieved by publishing your application to a publicly accessible github repository and using the "Create Toolchain" button below. In this case configured services will be automatically provisioned, once, during toolchain creation.

[![Create Toolchain](https://cloud.ibm.com/devops/graphics/create_toolchain_button.png)](https://cloud.ibm.com/devops/setup/deploy/)

### Service descriptions
{{#if web}}
#### Static web file serving
This application includes a `public` directory in the root of the project. The contents of this directory will be served as static content using the built-in Kitura [StaticFileServer module](https://github.com/IBM-Swift/Kitura/wiki/Serving-Static-Content).

This content is hosted on `/`. For example, if you want to view `public/myfile.html` and the application is hosted at https://localhost:8080, go to https://localhost:8080/myfile.html.
{{/if}}
{{#if hostSwagger}}
#### OpenAPI / Swagger endpoint
This application hosts an endpoint for serving the OpenAPI Swagger definition for this application. It expects the definition file to be located in `definitions/{{{appName}}}.yaml`.

The endpoint is hosted on `/swagger/api`. For example, if the application is hosted at https://localhost:8080, go to https://localhost:8080/swagger/api.
{{/if}}
{{#if exampleEndpoints}}
#### Example endpoints
This application includes an OpenAPI Swagger definition and routes for a Product example resource. The OpenAPI Swagger definition is located in the `definitions/{{{appName}}}.yaml` directory.

{{#if hostSwagger}}
The specification of this interface is made available through an embedded Swagger UI hosted on `/explorer`. For example, if the application is hosted at https://localhost:8080, go to https://localhost:8080/explorer.

The Swagger UI will document the paths and http methods that are supported by the application.
{{/if}}
{{/if}}
{{#if metrics}}
#### Embedded metrics dashboard
This application uses the [SwiftMetrics package](https://github.com/RuntimeTools/SwiftMetrics) to gather application and system metrics.

These metrics can be viewed in an embedded dashboard on `/swiftmetrics-dash`. The dashboard displays various system and application metrics, including CPU, memory usage, HTTP response metrics and more.
{{/if}}
{{#if docker}}
#### Docker files
The application includes the following files for Docker support:
* `.dockerignore`
* `Dockerfile`
* `Dockerfile-tools`

The `.dockerignore` file contains the files/directories that should not be included in the built docker image. By default this file contains the `Dockerfile` and `Dockerfile-tools`. It can be modified as required.

The `Dockerfile` defines the specification of the default docker image for running the application. This image can be used to run the application.

The `Dockerfile-tools` is a docker specification file similar to the `Dockerfile`, except it includes the tools required for compiling the application. This image can be used to compile the application.

Details on how to build the docker images, compile and run the application within the docker image can be found in the [Run section](#run).
{{/if}}
#### IBM Cloud deployment
Your application has a set of cloud deployment configuration files defined to support deploying your application to IBM Cloud:
* `manifest.yml`
* `.bluemix/toolchain.yml`
* `.bluemix/pipeline.yml`

The [`manifest.yml`](https://cloud.ibm.com/docs/cloud-foundry/deploy-apps.html#appmanifest) defines options which are passed to the Cloud Foundry `cf push` command during application deployment.

[IBM Cloud DevOps](https://cloud.ibm.com/docs/services/ContinuousDelivery/index.html#cd_getting_started) service provides toolchains as a set of tool integrations that support development, deployment, and operations tasks inside IBM Cloud, for both Cloud Foundry and Kubernetes applications. The ["Create Toolchain"](#deploy-to-ibm-cloud) button creates a DevOps toolchain and acts as a single-click deploy to IBM Cloud including provisioning all required services.

{{#if cloudant}}
#### Cloudant
This application uses the [Kitura-CouchDB package](https://github.com/IBM-Swift/Kitura-CouchDB), which allows Kitura applications to interact with a Cloudant or CouchDB database.

CouchDB speaks JSON natively and supports binary for all your data storage needs.

Boilerplate code for creating a client object for the Kitura-CouchDB API is included inside `Sources/Application/Application.swift` as an `internal` variable available for use anywhere in the `Application` module.

The connection details for this client are loaded by the [configuration](#configuration) code and are passed to the Kitura-CouchDB client in the boilerplate code.
{{/if}}
{{#if redis}}
#### Redis
This application uses the [Kitura-redis](http://ibm-swift.github.io/Kitura-redis/) library, which allows Kitura applications to interact with a Redis database.

Redis is an open source (BSD licensed), in-memory data structure store, used as a database, cache and message broker. It supports a cracking array of data structures such as strings, hashes, lists, sets, sorted sets with range queries, bitmaps, hyperloglogs and geospatial indexes with radius queries.

Boilerplate code for creating a client object for the Kitura-redis API is included inside `Sources/Application/Application.swift` as an `internal` variable available for use anywhere in the `Application` module.

The connection details for this client are loaded by  the [configuration](#configuration) code and are passed to the Kitura-redis client in the boilerplate code.
{{/if}}
{{#if appid}}
#### AppID
This application uses [App ID package](https://github.com/ibm-cloud-security/appid-serversdk-swift) to connect to the IBM Cloud App ID service.

App ID provides authentication to secure your web applications and back-end systems. In addition App ID supports authentication using social identity providers so that users can login with their existing user accounts, such as Facebook and Google.

Boilerplate code for creating a client object for the App ID API is included inside `Sources/Application/Application.swift` as an `internal` variable available for use anywhere in the `Application` module. Extra routes and logic need to be added to make this a authentication boilerplate work. A working example can be found in the [App ID README](https://github.com/ibm-cloud-security/appid-serversdk-swift/blob/master/README.md#example-usage).

The connection details for this client are loaded by the [configuration](#configuration) code and are passed to the App ID client in the boilerplate code.
{{/if}}
{{#if conversation}}
#### Watson Assistant
This application uses the [Watson Developer Cloud Swift SDK ](https://github.com/watson-developer-cloud/swift-sdk), which allows Kitura applications to build Watson-powered applications, specifically in this case the IBM Watson Assistant service, formerly Watson Conversation.

With Watson Assistant you can create cognitive agents--virtual agents that combine machine learning, natural language understanding, and integrated dialog scripting tools to build outstanding projects, such as a chat room with an integrated Watson chatbot.

Boilerplate code for creating a client object for the Watson Assistant API is included inside `Sources/Application/Services/ServiceWatsonAssistant.swift` as an `internal` variable available for use anywhere in the `Application` module.

The connection details for this client are loaded by the [configuration](#configuration) code and are passed to the Watson Assistant client in the boilerplate code.

More information about the Watson Assistant can be found in the [README](https://github.com/watson-developer-cloud/swift-sdk#assistant).

##### Watson Assistant Authentication
The generated application relies on IAM API key authentication, provided by the [Watson Developer Cloud SDK](https://github.com/watson-developer-cloud/swift-sdk#watson-developer-cloud-swift-sdk).  If attempting to use an older service instance that relies on user/password credential authentication, you will need to make the following changes:

* Leverage **generator-swiftserver** before version `5.4.0`
or
* Use version `7.1.0` of [CloudEnvironment](https://github.com/IBM-Swift/CloudEnvironment/releases) to leverage the user/password credentials.
* If running locally, modify the `config/localdev-config.json` with the following payload:
```json
{
  "my-assistant-name": {
    "url": "https://gateway.watsonplatform.net/assistant/api",
    "username": "my-username",
    "password": "my-password"
  }
}
```
* Modify the provided instrumentation code to use the [user/password constructor]().
`let assistant = Assistant(username: assistantCredentials.username, password: assistantCredentials.password, version: version)`

{{/if}}
{{#if alertNotification}}
#### Alert Notification
This application uses the [Alert Notification Service SDK package](https://github.com/IBM-Swift/alert-notification-sdk), which allows Swift developers to utilize the Alert Notifications service in their applications, allowing for the proactive remediation of issues for applications running on IBM Cloud. Alerts and messages can be created, received and deleted through the use of this SDK.

This SDK is for the consumption/usage of the Alert Notification service and not for administration of the service. Adding users, groups, notification policies, etc. should be done through the IBM Cloud dashboard.

Boilerplate code for creating a client object for the Alert Notification API is included inside `Sources/Application/Application.swift` as an `internal` variable available for use anywhere in the `Application` module.

The connection details for this client are loaded by the [configuration](#configuration) code and are passed to the Alert Notification client in the boilerplate code.

A quick start guide to the Alert Notification Service on IBM Cloud can be found in the [official Alert Notification documentation](https://cloud.ibm.com/docs/services/AlertNotification/alert_overview.html#alert_overview).
{{/if}}
{{#if push}}
#### Push Notifications
This application uses the [Push notifications package](https://github.com/ibm-bluemix-mobile-services/bms-pushnotifications-serversdk-swift), which is a Swift server-side SDK for sending push notifications via the IBM Cloud Push Notifications services.

Boilerplate code for creating a client object for the Push Notifications API is included inside `Sources/Application/Application.swift` as an `internal` variable available for use anywhere in the `Application` module.

The connection details for this client are loaded by the [configuration](#configuration) code and are passed to the Push Notifications client in the boilerplate code.
{{/if}}
{{#if autoscaling}}
#### Auto-scaling
This application uses the [SwiftMetrics package](https://github.com/RuntimeTools/SwiftMetrics) for connecting to the IBM Cloud Auto-scaling service. You can use this to automatically manage your application capacity when deployed to the cloud.  You will need to define the Auto-Scaling policy (https://cloud.ibm.com/docs/services/Auto-Scaling/index.html#get-started) to define the rules used to scale the application.

The connection details for this client are loaded by the [configuration](#configuration) code and are passed to the SwiftMetrics auto-scaling client in the boilerplate code.
{{/if}}

### License
All generated content is available for use and modification under the permissive MIT License (see `LICENSE` file), with the exception of SwaggerUI which is licensed under an Apache-2.0 license (see `NOTICES.txt` file).

### Generator
This project was generated with [generator-swiftserver](https://github.com/IBM-Swift/generator-swiftserver) v{{generatorVersion}}.
