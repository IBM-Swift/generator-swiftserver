import PackageDescription

let package = Package(
    name: "<%- executableModule %>",
    targets: [
<% if (appType === 'crud') { -%>
      Target(name: "<%- applicationModule %>", dependencies: [ .Target(name: "<%- generatedModule %>") ]),
<% } _%>
      Target(name: "<%- executableModule %>", dependencies: [ .Target(name: "<%- applicationModule %>") ]),
<% Object.keys(sdkTargets).forEach(function(target) { -%>
      Target(name: "<%- applicationModule %>", dependencies: [ .Target(name: "<%- sdkTargets[target] %>") ]),
<% }); -%>
    ],
    dependencies: [
        .Package(url: "https://github.com/IBM-Swift/Kitura.git",             majorVersion: 1, minor: 7),
        .Package(url: "https://github.com/IBM-Swift/HeliumLogger.git",       majorVersion: 1, minor: 7),
<% if(bluemix) { -%>
        .Package(url: "https://github.com/IBM-Swift/CloudConfiguration.git", majorVersion: 2),
<% } else { -%>
        .Package(url: "https://github.com/IBM-Swift/Configuration.git",      majorVersion: 1),
<% } -%>
<% Object.keys(services).forEach(function(serviceType) { -%>
<%-  include(`../services/${serviceType}/importDependency.swift`) %>
<% }); _%>
<% Object.keys(capabilities).forEach(function(capabilityType) { -%>
<%   if(capabilities[capabilityType] === true || typeof(capabilities[capabilityType]) === 'string') { -%>
<%-    include(`../capabilities/${capabilityType}/importDependency.swift`) %>
<%_   } _%>
<%_ }); _%>
<%_ if (sdkPackages) { _%>
        <%- sdkPackages %>
<%_ } _%>
    ],
    exclude: ["src"]
)
