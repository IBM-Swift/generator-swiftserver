import Foundation
import Configuration
import CloudEnvironment
<% if (crudService.type === 'cloudant') { -%>
import CouchDB
<% } -%>

public class AdapterFactory {
    let cloudEnv: CloudEnv

    init(cloudEnv: CloudEnv) {
        self.cloudEnv = cloudEnv
    }

<% models.forEach(function(model) { -%>
    public func get<%- model.classname %>Adapter() throws -> <%- model.classname %>Adapter {
<% if (crudService.type === 'cloudant') { -%>
      guard let credentials = cloudEnv.getCloudantCredentials(name: "cloudant") else {
          throw AdapterError.unavailable("Failed to get cloudant credentials")
      }
      return <%- model.classname %>CloudantAdapter(ConnectionProperties(
          host:     credentials.host,
          port:     Int16(credentials.port),
          secured:  credentials.secured,
          username: credentials.username,
          password: credentials.password
      ))
<% } -%>
<% if (crudService.type === '__memory__') { -%>
      return <%- model.classname %>MemoryAdapter()
<% } -%>
    }
<% }); -%>
}
