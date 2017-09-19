import PackageDescription

let package = Package(
    name: "<%- executableModule %>",
    targets: [
      Target(name: "<%- executableModule %>", dependencies: [ .Target(name: "<%- applicationModule %>") ]),
<% if (sdkTargets.length > 0 || appType === 'crud') { -%>
      Target(name: "<%- applicationModule %>", dependencies: [
<% if (appType === 'crud') { -%>
            .Target(name: "<%- generatedModule %>"),
<% } _%>
<% Object.keys(sdkTargets).forEach(function(target) { -%>
            .Target(name: "<%- sdkTargets[target] %>"),
<% }); -%>
      ]),
<% } _%>
    ],
    dependencies: [
        .Package(url: "https://github.com/IBM-Swift/Kitura.git",             majorVersion: 1, minor: 7),
        .Package(url: "https://github.com/IBM-Swift/HeliumLogger.git",       majorVersion: 1, minor: 7),
        .Package(url: "https://github.com/IBM-Swift/CloudEnvironment.git", majorVersion: 4),
<% dependencies.forEach(function(dependency) { -%>
        <%- dependency %>
<% }) -%>
    ],
    exclude: ["src"]
)
