    let cloudantConfig = CloudantConfig(manager: manager)

    let couchDBConnProps = ConnectionProperties(host:     cloudantConfig.host,
                                                port:     cloudantConfig.port,
                                                secured:  cloudantConfig.secured,
                                                username: cloudantConfig.username,
                                                password: cloudantConfig.password )

    couchDBClient = CouchDBClient(connectionProperties: couchDBConnProps)
