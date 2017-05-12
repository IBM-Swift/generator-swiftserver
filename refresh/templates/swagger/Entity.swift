{{license}}

import SwiftyJSON

public {{classorstruct}} {{entity}}: Entity {
  {{#each properties}}
  public let {{this.name}}{{this.required}}
  {{/each}}

  public init({{prototype}}) {
    {{#each properties}}
    self.{{this.name}} = {{this.type}}{{this.required}}
    {{/each}}
  }

  public func toJSON() -> JSON {
    var result: [String: JSON] = [:]
    {{#each properties}}
    if let {{this.name}} = self.{{this.name}} {
      result["{{this.name}}"] = JSON({{this.name}})
    }
    {{/each}}
    return JSON(result)
  }
}

