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
import LoggerAPI

func initializeSwaggerRoute(path swaggerPath: String) {
    // Host swagger definition
    router.get("/swagger/api") { request, response, next in
        do {
            try response.send(fileName: swaggerPath).end()
        } catch {
            Log.error("Failed to serve OpenAPI Swagger definition from \(swaggerPath)")
        }
    }
}

