import Foundation
import Kitura
import LoggerAPI
import Configuration
<% if(appType === 'crud') { -%>
import KituraNet
import SwiftyJSON
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

    func executableURL() -> URL? {
        var executableURL = Bundle.main.executableURL
        #if os(Linux)
            if (executableURL == nil) {
                executableURL = URL(fileURLWithPath: "/proc/self/exe").resolvingSymlinksInPath()
            }
        #endif
            return executableURL
    }

    func findProjectRoot(fromDir initialSearchDir: URL) -> URL? {
        let fileManager = FileManager()
        var searchDirectory = initialSearchDir
        while searchDirectory.path != "/" {
            let projectFilePath = searchDirectory.appendingPathComponent(".swiftservergenerator-project").path
            if fileManager.fileExists(atPath: projectFilePath) {
                return searchDirectory
            }
            searchDirectory.deleteLastPathComponent()
        }
        return nil
    }

    guard let searchDir = executableURL()?.deletingLastPathComponent(),
          let projectRoot = findProjectRoot(fromDir: searchDir) else {
        Log.error("Cannot find project root")
        exit(1)
    }

    manager.load(url: projectRoot.appendingPathComponent("config.json"))
           .load(.environmentVariables)

<% if(bluemix) { -%>
    port = manager.port
<% } else { -%>
    port = manager["port"] as? Int ?? port
<% } -%>

<% if (Object.keys(capabilities).length > 0) { -%>
<%   Object.keys(capabilities).forEach(function(capabilityType) { -%>
<%     if(capabilities[capabilityType]) { -%>
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
<% if (appType === 'web') { -%>
    router.all("/", middleware: StaticFileServer())
<% } -%>
<% if (appType === 'crud') { %>
    let factory = AdapterFactory(manager: manager)
<%   models.forEach(function(model) { -%>
    try <%- model.classname %>Resource(factory: factory).setupRoutes(router: router)
<%   }); -%>
<% } -%>
<% if (hostSwagger) { -%>
    initializeSwaggerRoute(path: projectRoot.appendingPathComponent("definitions/<%- appName %>.yaml").path)
<% } -%>
<% if (appType === 'bff') { -%>
    initializeBFFRoutes()
<% } -%>
}

public func run() throws {
    Kitura.addHTTPServer(onPort: port, with: router)
    Kitura.run()
}
