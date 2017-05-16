{{!--
 * Copyright IBM Corporation 2017
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
--}}
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

