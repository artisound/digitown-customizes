
const { KintoneRestAPIClient } = require("@kintone/rest-api-client");

const client = new KintoneRestAPIClient();
console.log(client);
                                           // 1ページに表示する件数。リリースは100件を想定
                                                                            // テスト用に5件にしている。
const SUB_DOMAIN        = "digital-town";                                   // サブドメイン
const APP_ID            = kintone.app.getId();                              // LINE友だち管理のアプリID
const APP_URL           = `https://${SUB_DOMAIN}.cybozu.com/k/${APP_ID}/`;  // アプリのURL


let viewId;

(function(){
  'use strict';

  const vm = new Vue({
    // components: {
    //     'BootstrapTable': BootstrapTable                                // bootstrapのテーブルを使用するための記述
    // },
    vuetify: new Vuetify(),
    data() {
      return {
        client: client,
      }
    }
  });

// ********************************************************************************************************************************
// kintoneイベントハンドラ
// ********************************************************************************************************************************

  // ========================================================================================================
  // 画面表示時に実行
  // ========================================================================================================
  // 一覧画面
  kintone.events.on(['app.record.index.show'], async function(event) {
    // --------------------------------------------------------------------------------
    // セグメント配信一覧の場合
    // --------------------------------------------------------------------------------
    if ( location.href == `${APP_URL}?view=5690398` ) {

      // お知らせメッセージ表示
      Swal.fire({
          title: 'セグメント配信一覧',
          html: '一覧を絞り込んだうえで<br>セグメント配信ボタンを押してください。',
          icon: 'info',
          button: 'OK'
      }).then(function() {
      });

    }


    // LINEターゲット配信
    if (event.viewId == 5700739) {
      const appEl = document.getElementById('app');
      const vAppEl = document.createElement('v-app');
      vAppEl.innerHTML = '<tc-header :client="client"></tc-header>';
      appEl.appendChild(vAppEl);

      vm.$mount('#app');
    }

    return event;
  });

  // 詳細画面
  kintone.events.on(['app.record.detail.show'], function(event) {
    var record = event.record;
    return event;
  });

  // 入力画面
  kintone.events.on(['app.record.create.show', 'app.record.edit.show'], function(event) {
    var record = event.record;
    return event;
  });

})();


