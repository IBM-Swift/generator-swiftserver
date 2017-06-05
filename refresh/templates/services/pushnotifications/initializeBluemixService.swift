
    let pushNotificationsService = try manager.getPushSDKService(name: "<%- service.name %>")

    let region = "<%- service.credentials.region %>".isEmpty ? PushNotifications.Region.US_SOUTH : "<%- service.credentials.region %>"

    pushNotifications = PushNotifications(service: pushNotificationsService, region: region)
