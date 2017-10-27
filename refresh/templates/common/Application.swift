import Foundation
import Kitura
import LoggerAPI
import Configuration
import CloudEnvironment
import KituraContracts
<% if (appType === 'crud') { -%>
import <%- generatedModule %>
<% } -%>
<% if (healthcheck) { -%>
import Health
<% } -%>
<% if (appInitCode.service_imports.length > 0) { -%>

// Service imports
<%   appInitCode.service_imports.forEach(function(serviceimport) { -%>
<%- serviceimport %>
<%   }); -%>
<% } -%>

public let projectPath = ConfigurationManager.BasePath.project.path
<% if (basepath) { -%>
public var basePath = "<%- basepath %>"
<% } -%>
<% if (healthcheck) { -%>
public let health = Health()
<% } -%>
<% if (appInitCode.services.length > 0) { -%>

class ApplicationServices {
    // Service references
<% appInitCode.service_variables.forEach(function(variable) { -%>
    <%- variable %>
<% }); -%>

    public init(cloudEnv: CloudEnv) throws {
        // Run service initializers
<% appInitCode.services.forEach(function(service) { -%>
        <%- service %>
<% }); -%>
    }
}
<% } -%>

public class App {
    let router = Router()
    let cloudEnv = CloudEnv()
<% if (swaggerPath) { -%>
    <%- swaggerPath %>
<% } -%>
<% if (appInitCode.services.length > 0) { -%>
    let services: ApplicationServices
<% } -%>

    public init() throws {
<% if (appInitCode.services.length > 0) { -%>

        // Services
        services = try ApplicationServices(cloudEnv: cloudEnv)
<% } -%>
    }

    func postInit() throws {
<% if (appInitCode.capabilities.length > 0) { -%>
        // Capabilities
<%   appInitCode.capabilities.forEach(function(capability) { -%>
        <%- capability %>
<%   }); -%>
<% } -%>
<% if (appInitCode.middlewares.length > 0) { -%>

        // Middleware
<% appInitCode.middlewares.forEach(function(middleware) { -%>
        <%- middleware %>
<% }); -%>
<% } -%>

        // Endpoints
<% appInitCode.endpoints.forEach(function(endpoint) { -%>
        <%- endpoint %>
<% }); -%>
    }

    public func run() throws {
        try postInit()
        Kitura.addHTTPServer(onPort: cloudEnv.port, with: router)
        Kitura.run()
    }
}
