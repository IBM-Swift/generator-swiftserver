import Foundation
import Configuration
import CloudEnvironment
{{#ifCond crudService.type '===' 'cloudant'}}
import CouchDB
{{/ifCond}}

public class AdapterFactory {
    let cloudEnv: CloudEnv

    init(cloudEnv: CloudEnv) {
        self.cloudEnv = cloudEnv
    }
{{#each models}}
    public func get{{classname}}Adapter() throws -> {{classname}}Adapter {
{{#ifCond ../crudService.type '===' 'cloudant'}}
      guard let credentials = cloudEnv.getCloudantCredentials(name: "cloudant") else {
          throw AdapterError.unavailable("Failed to get cloudant credentials")
      }
      return {{classname}}CloudantAdapter(ConnectionProperties(
          host:     credentials.host,
          port:     Int16(credentials.port),
          secured:  credentials.secured,
          username: credentials.username,
          password: credentials.password
      ))
{{/ifCond}}
{{#ifCond ../crudService.type '===' '__memory__'}}
      return {{classname}}MemoryAdapter()
{{/ifCond}}
    }
{{/each}}
}
