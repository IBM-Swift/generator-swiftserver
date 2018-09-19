import Kitura
import CloudEnvironment

public func initializeCRUDResources(cloudEnv: CloudEnv, router: Router) throws {
{{#ifCond models.length '>' 0}}
    let factory = AdapterFactory(cloudEnv: cloudEnv)
{{#each models}}
    try {{classname}}Resource(factory: factory).setupRoutes(router: router)
{{/each}}
{{/ifCond}}
}
