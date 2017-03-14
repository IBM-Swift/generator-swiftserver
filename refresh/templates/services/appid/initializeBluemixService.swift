let appIDService = try manager.getAppIDService(name: "<%= service.name %>")
webappKituraCredentialsPlugin = WebAppKituraCredentialsPlugin(service: appIDService,
                                                              redirectUri: manager.url + "/api/appid/callback")

kituraCredentials = Credentials()
kituraCredentials?.register(plugin: webappKituraCredentialsPlugin!)
