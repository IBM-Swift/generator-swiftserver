{{license}}

import Kitura
import SwiftyJSON

func initialize{{resource}}Routes() {
{{#each routes}}
    router.{{this.method}}("{{this.route}}") { request, response, next in
        response.send(json: [:])
        next()
    }
{{/each}}
}
