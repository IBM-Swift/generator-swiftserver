import Foundation
import Kitura
import LoggerAPI
import Configuration
import CloudEnvironment
import KituraContracts
{{#ifCond appType '===' 'crud'}}
import {{{generatedModule}}}
{{/ifCond}}
{{#if healthcheck}}
import Health
{{/if}}
{{#if openapi}}
import KituraOpenAPI
{{/if}}
{{#ifCond appInitCode.service_imports.length '>' 0}}

// Service imports
{{#each appInitCode.service_imports}}
{{{this}}}
{{/each}}
{{/ifCond}}

public let projectPath = ConfigurationManager.BasePath.project.path
{{#if basepath}}
public var basePath = "{{{basepath}}}"
{{/if}}
{{#if healthcheck}}
public let health = Health()
{{/if}}
{{#ifCond appInitCode.services.length '>' 0}}

class ApplicationServices {
    // Initialize services
{{#each appInitCode.service_variables}}
    {{{this}}}
{{/each}}

    public init(cloudEnv: CloudEnv) throws {
        // Run service initializers
{{#each appInitCode.services}}
        {{{this}}}
{{/each}}
    }
}
{{/ifCond}}

public class App {
    let router = Router()
    let cloudEnv = CloudEnv()
{{#if swaggerPath}}
    {{{swaggerPath}}}
{{/if}}
{{#ifCond appInitCode.services.length '>' 0}}
    let services: ApplicationServices
{{/ifCond}}

    public init() throws {
        // Configure logging
        initializeLogging()
{{#if appInitCode.metrics}}
        // Run the metrics initializer
        {{{appInitCode.metrics}}}
{{/if}}
{{#ifCond appInitCode.services.length '>' 0}}
        // Services
        services = try ApplicationServices(cloudEnv: cloudEnv)
{{/ifCond}}
    }

    func postInit() throws {
{{#ifCond appInitCode.capabilities.length '>' 0}}
        // Capabilities
        {{#each appInitCode.capabilities}}
        {{{this}}}
        {{/each}}
{{/ifCond}}
{{#ifCond appInitCode.middlewares.length '>' 0}}
        // Middleware
{{#each appInitCode.middlewares}}
        {{{this}}}
{{/each}}
{{/ifCond}}
        // Endpoints
{{#each appInitCode.endpoints}}
        {{{this}}}
{{/each}}
{{#if appInitCode.openapi}}
        {{{appInitCode.openapi}}}
{{/if}}
    }

    public func run() throws {
        try postInit()
        Kitura.addHTTPServer(onPort: cloudEnv.port, with: router)
        Kitura.run()
    }
}
