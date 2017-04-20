import PackageDescription

let package = Package(
    name: "<%- executableModule %>",
    targets: [
<% if (appType === 'crud') { -%>
      Target(name: "<%- applicationModule %>", dependencies: [ .Target(name: "<%- generatedModule %>") ]),
<% } -%>
      Target(name: "<%- executableModule %>", dependencies: [ .Target(name: "<%- applicationModule %>") ])
    ],
    dependencies: [
        .Package(url: "https://github.com/IBM-Swift/HeliumLogger.git", majorVersion: 1, minor: 6),
<% if(bluemix) { -%>
        .Package(url: "https://github.com/IBM-Swift/CloudConfiguration.git", majorVersion: 1),
<% } else { -%>
        .Package(url: "https://github.com/IBM-Swift/Configuration.git", majorVersion: 0),
<% } -%>
<% if(capabilities["metrics"] === false || typeof(capabilities["metrics"]) != 'string') { -%>
        .Package(url: "https://github.com/IBM-Swift/Kitura.git", majorVersion: 1, minor: 6),
<% } -%>
<% Object.keys(services).forEach(function(serviceType) { -%>
<%-  include(`../services/${serviceType}/importDependency.swift`) %>
<% }); -%>
<% Object.keys(capabilities).forEach(function(capabilityType) { -%>
<%   if(capabilities[capabilityType] === true || typeof(capabilities[capabilityType]) === 'string') { -%>
<%-    include(`../capabilities/${capabilityType}/importDependency.swift`) %>
<%   } -%>
<% }); -%>
    ],
    exclude: ["src"]
)
