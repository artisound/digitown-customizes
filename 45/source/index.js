(function () {
  'use strict';
  kintone.events.on('app.record.index.show', function (event) {
    console.log('Hello from kintone CLI');
    return event;
  });
})();
