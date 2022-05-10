const { KintoneRestAPIClient } = require("@kintone/rest-api-client");

const client = new KintoneRestAPIClient();


const ARY_DEFAULT_QUERY = [                                                 // レコード検索のデフォルトの条件
    'LINEユーザーID not in ("")',
    '友達状態 in ("友だち")'
];

const SHOW_LENGTH       = 5;                                                // 1ページに表示する件数。リリースは100件を想定
                                                                            // テスト用に5件にしている。
const SUB_DOMAIN        = "digital-town";                                   // サブドメイン
const APP_ID            = kintone.app.getId();                              // LINE友だち管理のアプリID
const VIEW_ID           = 5700739;                                          // アプリのビューID
const APP_URL           = `https://${SUB_DOMAIN}.cybozu.com/k/${APP_ID}/`;  // アプリのURL
const LOGIN_USER        = kintone.getLoginUser()['code'];                   // kintoneのログインユーザー
const appId_entry       = 35;                                               // ジョブエントリー
const office_info       = 28                                                // 事業所管理

const lxn               = luxon.DateTime.fromJSDate(new Date());
const lxnY              = lxn.toFormat('yyyy');
const lxnM              = lxn.toFormat('MM');
const lxnD              = lxn.toFormat('dd');
const lxnYmd            = lxn.toFormat('yyyy-MM-dd');
const lxnTime           = lxn.toFormat('HH:mm:ss');
const lxnYmdHms         = lxn.toFormat('yyyy-MM-dd HH:mm:ss');
const minBirthYear      = 10;
const maxBirthYear      = 89;

let viewId;


(function(){
    'use strict';

    const vm = new Vue({
        components: {
            'BootstrapTable': BootstrapTable                                // bootstrapのテーブルを使用するための記述
        },
        vuetify: new Vuetify(),
        data: {
            aryRecord: [],                                                       // 「LINEユーザーIDが有る かつ 友達状態が"友だち"」の条件に当てはまるレコード一覧
                                                                                            // 一度取得したら、以降は変更しない
            // 年代一覧
            aryAge: [
                '10歳未満', "10代", "20代", "30代", "40代", "50代", "60代", "70代", "80代", '90代', '100以上'
            ],
            // 性別一覧
            aryGender: [
                "男性", "女性"
            ],
            // 勤務地一覧
            aryWorkLocation: [
                '高知県内全域', '高知市', '室戸市', '安芸市', '南国市', '土佐市', '須崎市', '宿毛市', '土佐清水市', '四万十市', '香南市', '香美市', '東洋町', '奈半利町', '田野町', '安田町', '北川村', '馬路村', '芸西村', '本山町', '大豊町', '土佐町', '大川村', 'いの町', '仁淀川町', '中土佐町', '佐川町', '越知町', '檮原町', '日高村', '津野町', '四万十町', '大月町', '三原村', '黒潮町'
            ],
            // 契約形態一覧
            aryEmploymentStatus: [
                'アルバイト・パート', '日雇い', '臨時（季節雇用）', '正社員', '契約社員', '派遣社員', '請負', '業務委託', 'その他'
            ],
            // 曜日一覧
            aryDay: [
                '月', '火', '水', '木', '金', '土', '日', '祝'
            ],
            // 市区町村一覧
            aryCity:            [],
            inputInfo           : {                                                         // 検索で条件に指定された項目一覧
                // 年代と性別は配列を用意しておかないとチェックボックスの結果を受け取れない
                '年代': [],
                '性別': []
            },
            jobEntryInfo        : {},
            year                : lxnY,
            isAdmin             : false,
            isAdminOpen         : false,
            deliveryCategory    : '求人配信依頼',
            group               : '',
            ssect               : '',
            scost               : 0,
            sendTargetCount     : 0,
            useTicket           : 0,
            holdingTicket       : 0,
            officeInfoRecId     : 0,
            officeName          : '',
            // sendTargets         : [],


            officeInfo          : {},
        },
        computed: {
            isSearch() {
                return window.location.href.indexOf('query', 0) > 0 ? true : false;
            },
            aryColumn() {
                let column = [];
                if (this.isAdmin) column.push({ label: '表示名(Adminのみ)', field: '表示名.value' });

                column.push(
                    { label: '年代',        field: '年代.value' },
                    { label: '性別',        field: '性別.value' },
                    { label: '誕生年',      field: '誕生年.value',      formatFn: (value => { return value + '年'; }) },
                    { label: '誕生月',      field: '誕生月.value',      formatFn: (value => { return value + '月'; }) },
                    { label: '年齢',        field: '年齢_年_.value',    formatFn: (value => { return value + '歳'; }) },
                    { label: '郵便番号',    field: '郵便番号.value' },
                    { label: '市区町村',    field: '市名.value' }
                );
                // if (this.deliveryCategory == '求人配信依頼') {
                if (this.ssect && this.ssect.indexOf('求人') != -1) {
                    column.push(
                        { label: '勤務地',      field: '勤務地.value' },
                        { label: '契約形態',    field: '契約形態.value' },
                        { label: '勤務開始日',  field: '開始日.value' },
                        { label: '曜日',        field: '曜日.value' },
                    );
                }

                return column;
            },
            aryYear() {
                let years = [];
                for (let i = minBirthYear; i <= maxBirthYear; i ++) {
                    years.push({ text: i + '歳', value: i });
                }

                return years;
            },
            aryBirthYear() {
                let birthYears = [];
                for (let i = minBirthYear; i <= maxBirthYear; i++) {
                    const year = this.year - i;
                    birthYears.push({ text: year + '年', value: year });
                }

                return birthYears;
            },
            aryMonth() {
                let ary = [];
                for (let index = 1; index <= 12; index++) {
                    ary.push( { text: index + '月', value: index } );
                }
                return ary;
            },
            // 選択した配信対象の人数がターゲット人数を超えていれば、ターゲット人数分のポイントを使用する。
            targetCount() {
                return this.sendTargetCount > this.aryRecord.length ? this.aryRecord.length : this.sendTargetCount;
            },
            sendTargets() {
                let targets = [];
                if (this.scost <= 0) return targets;

                // 配信対象の人数の選択項目を作成する
                const maxTargetLength = 500 / this.scost;
                
                console.log(this.aryRecord.length);
                for(let i = 0; i <= maxTargetLength; i++) {
                    const targetCount = i * this.scost;
                    console.log(targetCount);
                    // 1度で配信できるのは1000人まで
                    if (targetCount > 0 && targetCount >= this.aryRecord.length) {
                        targets.push({ text: '全員', value: this.aryRecord.length });
                        break;
                    }

                    targets.push({ text:   `${ targetCount }人`, value:  targetCount });
                }

                return targets;
            }
        },
        async mounted() {
            // カスタマイズ一覧の選択等を非表示にする
            const el = document.getElementsByClassName('contents-actionmenu-gaia')[0];
            el.style.display = 'none';

            this.ssect = getParam('ssect');
            this.scost = Number(getParam('scost'));
            this.group = getParam('officeGroup');

            // ログインユーザーの組織取得
            kintone.api(kintone.api.url('/v1/user/groups', true), 'GET', { 'code': LOGIN_USER }, resp => {
                const groups = resp.groups;
                if (!groups || !groups.length) return;

                // this.group = groups[0]['name'];

                const results = groups.filter(group => {
                    return group['code'] == "Administrators";
                });

                // 「管理者のみ開く」を有効にする
                if (results.length) this.isAdmin = true;
            });

            const officeInfoParam = {
                app:    office_info,
                query:  `有料会員アカウント関連付け in ( "${LOGIN_USER}" )`,
                fields: ['レコード番号', '事業所名', '残高']
            };

            const aryOfficeInfo = await _getRecord(client, officeInfoParam);
            if (!aryOfficeInfo) return;

            this.aryCity = await _connectMySQLaxios({
                db: { name: 'tc2_digitown' },
                action: 'get',
                table: 'dt1_city_master'
            });

            // 絞り込み条件をフォームに反映させる
            this.paramsToForm(getParam('query'), this.inputInfo);

            const userRecord        = aryOfficeInfo.records[0];
            this.holdingTicket      = Number(userRecord['残高']['value']);
            this.officeInfoRecId    = Number(userRecord['レコード番号']['value']);
            this.officeName         = userRecord['事業所名']['value'];

            const body = {
                app: APP_ID,
                query: `${getParam('query')} limit 500 offset 0`
            };

            kintone.api(kintone.api.url('/k/v1/records', true), 'GET', body, async resp => {
                let aryRecord = resp.records;
                if (this.ssect.indexOf('求人') == -1) {
                    this.aryRecord = resp.records;
                    return;
                }

                // ジョブエントリーアプリからレコードを取得する
                const objParam = {
                    app:    appId_entry,
                    query:  'LINEユーザーID != "" and ジョブエントリー状態 in ("エントリー中")',
                    fields: ['レコード番号', 'LINEユーザーID', '勤務地', '契約形態', '開始日', '曜日'],
                };

                const je_query = getParam('je_query');
                if (je_query) objParam.query = objParam.query + ' and ' + je_query;

                const aryJobEntry = await _getRecord(client, objParam);
                aryRecord = aryRecord.filter(record => {
                    return aryJobEntry.records.find(v => v.LINEユーザーID.value == record.LINEユーザーID.value);
                });

                this.aryRecord = aryRecord.map(record => {
                    const matchRec = aryJobEntry.records.find(v => v.LINEユーザーID.value == record.LINEユーザーID.value);
                    record['勤務地'] = { value: matchRec['勤務地']['value'].join(', ') };
                    record['契約形態'] = { value: matchRec['契約形態']['value'].join(', ') };
                    record['開始日'] = { value: matchRec['開始日']['value'] };
                    record['曜日'] = { value: matchRec['曜日']['value'].join(', ') };

                    return record;
                });

                this.paramsToForm(je_query, this.jobEntryInfo);
            }, err => {
                console.log(err);
            });
        },
        methods: {
            /** ---------------------------------------------------------------------
             * 検索ボタンが押された時の処理
             --------------------------------------------------------------------- */
            onSearch() {
                let isScout = false;
                if (this.ssect.indexOf('求人') != -1) {
                    isScout = true;
                    if (this.ssect.indexOf('スカウト') != -1) {
                        isScout = false;
                    }
                }
                const query     = encodeURI(_getQueryText(this.inputInfo, isScout));
                
                let url         = `${APP_URL}?view=${VIEW_ID}&query=${query}`;
                if (this.ssect && this.scost && this.group) {
                    url += `&ssect=${this.ssect}&scost=${this.scost}&officeGroup=${this.group}`;
                }

                let je_query            = '';
                if (isScout) {
                    je_query            = Object.keys(this.jobEntryInfo).length ? encodeURI(this.getJobEntryQuery(this.jobEntryInfo)) : '';
                }

                window.location.href    = je_query ? `${url}&je_query=${je_query}` : url;
            },
            onClear() {
                this.inputInfo = { '年代': [], '性別': [] };
                this.jobEntryInfo = {};
                this.onSearch();
            },
            onAdmin() {
                const el = document.getElementsByClassName('contents-actionmenu-gaia')[0];
                el.style.display = el.style.display == 'block' ? 'none' : 'block';
                this.isAdminOpen = el.style.display == 'block';
            },
            changeSendTargets() {
                this.useTicket = Math.ceil(this.targetCount / this.scost);
            },
            addHyphenToZipcode(val) {
                // -（ハイフン）を自動で入れる
                let zipcode = insertHyphenForZipcode(val);
                this.inputInfo['郵便番号'] = zipcode;
                console.log(`${val} -> ${zipcode}`);
                console.log(this.inputInfo['郵便番号']);
            },
            getJobEntryQuery(obj) {
                let aryQuery = [];
                for (const key in obj) {
                    const newValue = obj[key];
                    if (Array.isArray(newValue)) {
                        // 配列
                        if (!newValue) continue;
                        if (newValue.length < 1) continue;
                        let objQuery = {
                            [key]: []
                        };
                        for (const i in newValue) {
                            objQuery[key].push(`"${newValue[i]}"`);
                        }
                        aryQuery.push(`${key} in (${objQuery[key].join(", ")})`);
                    } else {
                        // 文字列
                        if (!newValue) continue;
                        if (newValue.length < 1) continue;
                        switch (key) {
                            case '開始日':
                                aryQuery.push(`${key} = "${newValue}"`);
                                break;
                            default:
                                aryQuery.push(`${key} in ("${newValue}")`);
                                break;
                        }
                    }
                }

                return aryQuery.join(' and ');
            },
            sendLINE() {
                if (!this.targetCount) return;
                document.getElementById('LINEMSG').click();
            },
            getSepaText(text) {
                let sepaText = '';
                if (text.indexOf(' >= ') >= 0) {
                    sepaText = ' >= ';
                } else if (text.indexOf(' = ') >= 0) {
                    sepaText = ' = ';
                } else if (text.indexOf(' in ') >= 0) {
                    sepaText = ' in ';
                } else if (text.indexOf(' like ') >= 0) {
                    sepaText = ' like ';
                }

                return sepaText;
            },
            paramsToForm(params, inputForm) {
                if (!params) return;

                const sepaParams = params.split(' and ');
                sepaParams.forEach(param => {
                    if (
                        param.indexOf('LINEユーザーID') >= 0 ||
                        param.indexOf('友達状態') >= 0 ||
                        param.indexOf('求人配信') >= 0
                    ) {
                        return;
                    }

                    const sepaText = this.getSepaText(param);
                    const splits = param.split(sepaText);
                    let value = splits[1];
                    value = value.replaceAll('"', '');

                    switch (sepaText) {
                        case '=':
                            if (Number(value)) {
                                value = Number(value);
                            }
                            break;
                        case ' in ':
                            value = value.replace('(', '');
                            value = value.replace(')', '');
                            value = value.split(', ');
                            break;
                        default:
                            break;
                    }

                    inputForm[splits[0]] = value;
                });

                return inputForm;
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
            // const officeInfoParam = {
            //     app:    office_info,
            //     query:  `有料会員アカウント関連付け in ( "${LOGIN_USER}" )`,
            //     fields: ['レコード番号', '事業所名', '残高']
            // };

            // const aryOfficeInfo = await _getRecord(client, officeInfoParam);
            // if (!aryOfficeInfo) return event;
            // const userRecord = aryOfficeInfo.records[0];
            // Vue.set(vm, 'holdingTicket', Number(userRecord['残高']['value']));
            
            // Vue.set(vm, 'officeInfoRecId', Number(userRecord['レコード番号']['value']));
            // Vue.set(vm, 'officeName', userRecord['事業所名']['value']);

            /**
             * kintoneと通信を行うクラス
             */
            // var KintoneRecordManager = (function() {
            //     KintoneRecordManager.prototype.records  = [];   // 取得したレコード
            //     KintoneRecordManager.prototype.appId    = null; // アプリID
            //     KintoneRecordManager.prototype.query    = '';   // 検索クエリ
            //     KintoneRecordManager.prototype.limit    = 100;  // 一回あたりの最大取得件数
            //     KintoneRecordManager.prototype.offset   = 0;    // オフセット

            //     function KintoneRecordManager() {
            //         this.appId = APP_ID;
            //         this.records = [];
            //     }

            //     // すべてのレコード取得する
            //     KintoneRecordManager.prototype.getRecords = function(callback) {
            //         kintone.api(
            //             kintone.api.url('/k/v1/records', true),
            //             'GET',
            //             {
            //                 app: this.appId,
            //                 query: this.query + (' limit ' + this.limit + ' offset ' + this.offset)
            //             },
            //             (function(_this) {
            //                 return function(res) {
            //                     var len;
            //                     Array.prototype.push.apply(_this.records, res.records);
            //                     len = res.records.length;
            //                     _this.offset += len;
            //                     if (len < _this.limit) { // まだレコードがあるか？
            //                         _this.ready = true;
            //                         if (callback !== null) {
            //                             callback(_this.records); // レコード取得後のcallback
            //                         }
            //                     } else {
            //                         if (_this.records.length >= 1000) {
            //                             // レコード総数1000件以上
            //                             callback(_this.records);
            //                         } else {
            //                             _this.getRecords(callback); // 自分自身をコール
            //                         }
            //                     }
            //                 };
            //             })(this)
            //         );
            //     };
            //     return KintoneRecordManager;
            // })();

            // const manager = new KintoneRecordManager;
            // manager.query = getParam('query');
            

            vm.$mount('#app');
            // Vue.set(vm, 'holdingTicket', Number(userRecord['残高']['value']));
            
            // Vue.set(vm, 'officeInfoRecId', Number(userRecord['レコード番号']['value']));
            // Vue.set(vm, 'officeName', userRecord['事業所名']['value']);

            // manager.getRecords(records => {
            //     console.log(records);
            //     Vue.set(vm, 'aryRecord', records);
            //     vm.$mount('#app');
            //     Vue.set(vm, 'holdingTicket', Number(userRecord['残高']['value']));

            //     Vue.set(vm, 'officeInfoRecId', Number(userRecord['レコード番号']['value']));
            //     Vue.set(vm, 'officeName', userRecord['事業所名']['value']);
            //     removeLoading();
            // });
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



// ********************************************************************************************************************************
// コール用関数・クラス
// ********************************************************************************************************************************

    // URLの?や#より前の文字列を取得
    function getUrlPath_() {
        var url = document.URL;
        if (url.indexOf('?') > 0) { return url.substr(0, url.indexOf('?')); }
        if (url.indexOf('#') > 0) { return url.substr(0, url.indexOf('#')); }
        return url;
    }

    // レコード追加画面ならtrue
    function isAddPage() {
        return getUrlPath_().match(/edit$/);
    }

    // レコード詳細画面ならtrue
    function isShowPage() {
        return getUrlPath_().match(/show$/) && !location.hash.match(/mode=edit/);
    }

    // レコード編集画面ならtrue
    function isEditPage() {
        return getUrlPath_().match(/show$/) && location.hash.match(/mode=edit/);
    }

    // レコード一覧画面ならtrue
    function isViewPage() {
        return getUrlPath_().match(/\/[0-9]+\/$/);
    }

    // ポータル画面ならtrue
    function isPortalPage() {
        var url = document.URL;
        return url.match(/portal$/);
    }

    // グラフ画面ならtrue
    function isGraphPage(graphId) {
        // グラフの表示ページの場合、グラフのIDを返す
        if ( getUrlPath_().match(/report$/) ) {
            var url = document.URL;
            var aryRet = url.split("=");
            if ( graphId == aryRet[1] ) { return true; }
        }
        // グラフの表示ページではない または 指定グラフIDが一致しない
        return false;
    }

    /** ************************************************************
     * Get the URL parameter value
     *
     * @param  name {string} パラメータのキー文字列
     * @return  url {url} 対象のURL文字列（任意）
     ************************************************************ */
    function getParam(name, url) {
        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }

    
    async function _getRecord(client, param) {
        // カーソル作成
        const cursor = await client.record.createCursor(param)
        .then(resp => {
            return resp;
        })
        .catch(error => {
            return error;
        });

        console.log(cursor);

        // レコード一括取得
        return await client.record.getRecordsByCursor(cursor)
        .then(resp => {
            return resp;
        })
        .catch(err => {
            return err;
        });
    }

    /** ---------------------------------------------------------------------
     * kintoneで検索するためのクエリを作成する関数
     * @param {object} obj selectedオブジェクト
     --------------------------------------------------------------------- */
    function _getQueryText(obj, isScout) {
        let aryQuery = [
            'LINEユーザーID!=""',
            '友達状態 in ("友だち")'
        ];

        for (const KEY in obj) {
            const NEW_VALUE = obj[KEY];
            if (Array.isArray(NEW_VALUE)) {
                // 配列
                if (!NEW_VALUE) continue;
                if (NEW_VALUE.length < 1) continue;
                let objyQuery = {
                    [KEY]: []
                };
                for (const INDEX in NEW_VALUE) {
                    objyQuery[KEY].push(`"${NEW_VALUE[INDEX]}"`);
                }
                aryQuery.push(`${KEY} in (${objyQuery[KEY].join(", ")})`);
            } else {
                // 文字列
                if (!NEW_VALUE) continue;
                if (NEW_VALUE.length < 1) continue;
                switch (KEY) {
                    case '郵便番号':
                    case '市名':
                        aryQuery.push(`${KEY} like "${NEW_VALUE}"`);
                        break;
                    default:
                        aryQuery.push(`${KEY}="${NEW_VALUE}"`);
                        break;
                }
            }
        }

        if (isScout) {
            aryQuery.push('求人配信 in ("受け取る")');
            if (!aryQuery.find(v => v.indexOf('年齢_年_') != -1))  aryQuery.push('年齢_年_>=16');
        }

        return aryQuery.join(' and ');
    }
})();

Vue.component('tc-param', {
    props: ['group', 'ssect', 'scost', 'officeInfoRecId', 'officeName'],
    template: `
    <!-- 管理者のみ見られる情報 -->
    <v-container>
        <v-spacer></v-spacer>
        <v-row class="gap-5 px-4">
            <v-col class="d-flex gap-3 align-items-center justify-content-center">
                <p class="fw-bold">事業所区分</p>
                <p class="border p-2" id="officeGroup">{{ group }}</p>
            </v-col>

            <v-col class="d-flex gap-3 align-items-center justify-content-center">
                <p class="fw-bold">サービス区分</p>
                <p class="border p-2" id="serviceClass">{{ ssect }}</p>
            </v-col>

            <v-col class="d-flex gap-3 align-items-center justify-content-center">
                <p class="fw-bold">サービス単価</p>
                <p><span class="border p-2 me-2" id="servicePrice">{{ scost }}</span>人/枚</p>
            </v-col>
        </v-row>
        <v-row class="d-none">
            <v-col>
                <p class="fw-bold">事業所レコード番号</p>
                <p class="border p-2" id="officeInfoRecId">{{ officeInfoRecId }}</p>
            </v-col>
            <v-col>
                <p class="fw-bold">事業所名</p>
                <p class="border p-2" id="officeName">{{ officeName }}</p>
            </v-col>
        </v-row>
        <v-spacer></v-spacer>
    </v-container>
    `
});

// 属性検索条件
Vue.component('tc-attribute-search', {
    data() {
        return {
            inputInfo           : {                                                         // 検索で条件に指定された項目一覧
                // 年代と性別は配列を用意しておかないとチェックボックスの結果を受け取れない
                '年代': [],
                '性別': []
            },
            // 性別一覧
            aryGender           : [
                "男性",
                "女性"
            ],
            // 年代一覧
            aryAge              : [
                '0代',
                "10代",
                "20代",
                "30代",
                "40代",
                "50代",
                "60代",
                "70代",
                "80代",
                '90代',
                '100以上'
            ],
        }
    },
    computed: {
        aryYear() {
            let years = [];
            for (let i = minBirthYear; i <= maxBirthYear; i ++) {
                years.push(
                    {
                        text: i + '歳',
                        value: i
                    });
            }

            return years;
        },
        aryBirthYear() {
            let birthYears = [];
            for (let i = minBirthYear; i <= maxBirthYear; i++) {
                const year = lxnY - i;
                birthYears.push(
                    {
                        text: year + '年',
                        value: year
                    }
                );
            }

            return birthYears;
        },
        aryMonth() {
            let ary = [];
            for (let index = 1; index <= 12; index++) {
                ary.push(
                    {
                        text: index + '月',
                        value: index
                    }
                );
            }
            return ary;
        }
    },
    methods: {
        addHyphenToZipcode(val) {
            // -（ハイフン）を自動で入れる
            this.inputInfo['郵便番号'] = insertHyphenForZipcode(val);
        },
    },
    template: `
    <div class="border rounded mb-3 px-3 py-2 bg-white">
        <!-- 見出し -->
        <h2 class="fw-bold m-0 mb-2">属性で絞り込む</h2>
        <!-- 絞り込み条件 -->
        <v-form class="d-flex align-items-center flex-wrap gap-4">
            <!-- 性別 -->
            <fieldset class="rounded-2 pt-0 pb-2 mt-n2" style="border-color: rgba(0, 0, 0, .38);">
                <legend style="color:rgba(0, 0, 0, .6); font-size: 13px;">
                    <span>性別</span>
                </legend>
                <div class="gender d-inline-block position-relative" v-for="(gender, index) in aryGender">
                    <input class="opacity-0 position-absolute left-0" :value="gender" :id="'gender' + index" type="checkbox" v-model="inputInfo['性別']">
                    <label class="px-3 rounded-2 d-inline-block" :class="index > 0 ? 'm-0' : 'me-2'" style="padding: 6px 0; cursor: pointer; transition: .2s;" :for="'gender' + index">{{ gender }}</label>
                </div>
            </fieldset>

            <!-- 年代 -->
            <v-select
                v-model="inputInfo['年代']"
                :items="aryAge"
                label="年代"
                multiple
                outlined
                hide-details="auto"
                style="max-width:380px;"
            ></v-select>

            <!-- 年齢 -->
            <v-select
                v-model="inputInfo['年齢_年_']"
                :items="aryYear"
                item-text="text"
                item-value="value"
                label="年齢"
                outlined
                clearable
                hide-details="auto"
                style="max-width:150px"
            ></v-select>

            <!-- 誕生年 -->
            <v-select
                v-model="inputInfo['誕生年']"
                :items="aryBirthYear"
                item-text="text"
                item-value="value"
                label="誕生年"
                outlined
                clearable
                hide-details="auto"
                style="max-width:150px"
            ></v-select>

            <!-- 誕生月 -->
            <v-select
                v-model="inputInfo['誕生月']"
                label="誕生月"
                :items="aryMonth"
                item-text="text"
                item-value="value"
                outlined
                clearable
                hide-details="auto"
                style="max-width:150px"
            ></v-select>

            <!-- 郵便番号 -->
            <v-text-field
                label="郵便番号"
                type="tel"
                v-model="inputInfo['郵便番号']"
                outlined
                hide-details="auto"
                @input="addHyphenToZipcode($event)"
                style="max-width:200px"
            ></v-text-field>

            <!-- 市区町村 -->
            <v-text-field
                label="市区町村"
                type="text"
                v-model="inputInfo['市名']"
                outlined
                hide-details="auto"
            ></v-text-field>
        </v-form>
    </div>`
});
