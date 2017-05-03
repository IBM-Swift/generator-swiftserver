import Foundation
import Kitura
import LoggerAPI
import Configuration
<% if (appType === 'crud') { -%>
import <%- generatedModule %>
<% } -%>
<% if(bluemix) { -%>
import CloudFoundryConfig
<% } -%>
<% if (Object.keys(capabilities).length > 0) { -%>
<%   Object.keys(capabilities).forEach(function(capabilityType) { -%>
<%     if(capabilities[capabilityType] === true || typeof(capabilities[capabilityType]) === 'string') { -%>
<%-      include(`../capabilities/${capabilityType}/importModule.swift`) -%>
<%     } -%>
<%   }); -%>
<% } -%>
<% if (Object.keys(services).length > 0) { -%>
<%   Object.keys(services).forEach(function(serviceType) { -%>
<%-    include(`../services/${serviceType}/importModule.swift`) -%>
<%   }); -%>
<% } %>
public let router = Router()
public let manager = ConfigurationManager()
public var port: Int = 8080

<% if (Object.keys(services).length > 0) { -%>
<%   Object.keys(services).forEach(function(serviceType) { -%>
<%-    include(`../services/${serviceType}/declareService.swift`) -%>
<%   }); %>
<% } -%>
public func initialize() throws {

    manager.load(file: "config.json", relativeFrom: .project)
           .load(file: "auth.json", relativeFrom: .project)
           .load(.environmentVariables)

    port = manager.port

<% if (Object.keys(capabilities).length > 0) { -%>
<%   Object.keys(capabilities).forEach(function(capabilityType) { -%>
<%     if (capabilities[capabilityType]) { -%>
<%-      include(`../capabilities/${capabilityType}/declareCapability.swift`) %>
<%     } -%>
<%   }); -%>
<% } -%>
<% if (Object.keys(services).length > 0) { -%>
<%   Object.keys(services).forEach(function(serviceType) { -%>
<%     services[serviceType].forEach(function(service) { -%>
<%       if (bluemix) { -%>
<%-        include(`../services/${serviceType}/initializeBluemixService.swift`, { service: service }) %>
<%       } else { -%>
<%-        include(`../services/${serviceType}/initializeService.swift`, { service: service}) %>
<%       } -%>
<%     }); -%>
<%   }); -%>
<% } -%>
    router.all("/*", middleware: BodyParser())
<% if (web) { -%>
    router.all("/", middleware: StaticFileServer())
<% } -%>
<% if (appType === 'crud') { %>
    try initializeCRUDResources(manager: manager, router: router)
<% } -%>
<% if (hostSwagger) { -%>
    initializeSwaggerRoute(path: ConfigurationManager.BasePath.project.path + "/definitions/<%- appName %>.yaml")
<% } -%>
<% if (exampleEndpoints) { -%>
    initializeProductRoutes()
<% } -%>
}

public func run() throws {
    Kitura.addHTTPServer(onPort: port, with: router)
    Kitura.run()
}
