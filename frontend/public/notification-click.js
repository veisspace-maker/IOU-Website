/* Service worker (importScripts): handle taps on birthday / test notifications. */
self.addEventListener('notificationclick', function (event) {
  if (event.action === 'dismiss') {
    event.notification.close();
    return;
  }

  event.notification.close();

  var data = event.notification.data;
  var targetUrl =
    data && typeof data === 'object' && typeof data.url === 'string' && data.url.length > 0
      ? data.url
      : self.location.origin + '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.indexOf(self.location.origin) !== 0) {
          continue;
        }
        if ('navigate' in client && typeof client.navigate === 'function') {
          return client
            .navigate(targetUrl)
            .then(function () {
              return client.focus();
            })
            .catch(function () {
              if (self.clients.openWindow) {
                return self.clients.openWindow(targetUrl);
              }
            });
        }
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
