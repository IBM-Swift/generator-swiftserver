import Foundation
import Kitura
import LoggerAPI
import Configuration
<% if(appType == 'crud') { -%>
import KituraNet
import SwiftyJSON
<% } -%>

<% Object.keys(capabilities).forEach(function(capabilityType) { -%>
<% if(capabilities[capabilityType] !== false) { -%>
<%- include(`../capabilities/${capabilityType}/importModule.swift`) -%>
<% } -%>
<% }); -%>

<% Object.keys(services).forEach(function(serviceType) { -%>
<%- include(`../services/${serviceType}/importModule.swift`) -%>
<% }); -%>

public let router = Router()
public let manager = ConfigurationManager()
public var port: Int = 8080

<% Object.keys(services).forEach(function(serviceType) { %>
// Set up the <%- serviceType %>
<%- include(`../services/${serviceType}/declareService.swift`) -%>
<% }); -%>

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

<% Object.keys(capabilities).forEach(function(capabilityType) { -%>
<% if(capabilities[capabilityType]) { -%>
    <%- include(`../capabilities/${capabilityType}/declareCapability.swift`) %>
<% } -%>
<% }); -%>

<% Object.keys(services).forEach(function(serviceType) { %>
    // Configuring <%= serviceType %>
<% services[serviceType].forEach(function(serviceDef) { -%>
<% if(bluemix) { -%>
    <%- include(`../services/${serviceType}/initializeBluemixService.swift`, { serviceDef: serviceDef }) %>
<% } else { -%>
    <%- include(`../services/${serviceType}/initializeService.swift`, { serviceDef: serviceDef }) %>
<% } -%>
<% }); -%>
<% }); -%>

<% if(appType == 'crud') { -%>
    <%- include('../fragments/_crud.swift.ejs', { models: models }) %>
<% } -%>
<% if(appType == 'web') { -%>
    <%- include('../fragments/_basicweb.swift.ejs', { services: services }) %>
<% } -%>
}

public func run() throws {
    Kitura.addHTTPServer(onPort: port, with: router)
    Kitura.run()
}
