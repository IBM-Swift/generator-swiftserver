import Foundation
import Kitura
import LoggerAPI
import Configuration
import CloudEnvironment
<% if (appType === 'crud') { -%>
import <%- generatedModule %>
<% } -%>
<% if (healthCheck) { -%>
import Health
<% } -%>

public let router = Router()
public let cloudEnv = CloudEnv()
public let projectPath = ConfigurationManager.BasePath.project.path
public var port: Int = 8080
<% if (basepath) { -%>
public var basePath = "<%- basepath %>"
<% } -%>
<% if (healthCheck) { -%>
public let health = Health()
<% } -%>

public func initialize() throws {
    // Configuration
    port = cloudEnv.port

    // Capabilities
<% appInitCode.capabilities.forEach(function(capability) { -%>
    <%- capability %>
<% }); -%>

    // Services
<% appInitCode.services.forEach(function(service) { -%>
    <%- service %>
<% }); -%>

    // Middleware
    router.all(middleware: BodyParser())
<% appInitCode.middlewares.forEach(function(middleware) { -%>
    <%- middleware %>
<% }); -%>

    // Endpoints
<% appInitCode.endpoints.forEach(function(endpoint) { -%>
    <%- endpoint %>
<% }); -%>
}

public func run() throws {
    Kitura.addHTTPServer(onPort: port, with: router)
    Kitura.run()
}
