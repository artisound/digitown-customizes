const { KintoneRestAPIClient } = require("@kintone/rest-api-client");

const client = new KintoneRestAPIClient();
console.log(client);

const VIEW_ID           = 5789206;                                          // アプリのビューID

(function () {
  'use strict';

  const vm = new Vue({
    vuetify: new Vuetify(),
    data() {
      return {
        client: client,
        aryMasterRecord: []
      }
    }
  });


  kintone.events.on('app.record.index.show', function (event) {
    console.log('Hello from kintone CLI');
    if (event.viewId != VIEW_ID) return event;

    console.log(event.records);

    const appEl = document.getElementById('app');
    const vAppEl = document.createElement('v-app');
    vAppEl.innerHTML = '<tc-header :client="client" :aryMasterRecord="aryMasterRecord"></tc-header>';
    appEl.appendChild(vAppEl);
    
    vm.$mount('#app');
    Vue.set(vm, 'aryMasterRecord', event.records);
    
    return event;
  });
})();
