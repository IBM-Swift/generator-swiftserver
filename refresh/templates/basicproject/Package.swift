import PackageDescription

let package = Package(
    name: "<%- executableModule %>",
    targets: [
      Target(name: "<%- executableModule %>", dependencies: [ .Target(name: "<%- applicationModule %>") ])
    ],
    dependencies: [

<% if(bluemix) { -%>
        .Package(url: "https://github.com/IBM-Swift/CloudConfiguration.git", majorVersion: 0, minor: 0),
<% } else { -%>
        .Package(url: "https://github.com/IBM-Swift/Configuration.git", majorVersion: 0),
<% } -%>
<% Object.keys(services).forEach(function(serviceType) { -%>
        <%- include(`../services/${serviceType}/importDependency.swift`) %>
<% }); -%>
<% Object.keys(capabilities).forEach(function(capabilityType) { -%>
        <%- include(`../capabilities/${capabilityType}/importDependency.swift`) %>
<% }); -%>

        .Package(url: "https://github.com/IBM-Swift/Kitura.git",                 majorVersion: 1),
        .Package(url: "https://github.com/IBM-Swift/HeliumLogger.git",           majorVersion: 1)
    ],
    exclude: []
)
