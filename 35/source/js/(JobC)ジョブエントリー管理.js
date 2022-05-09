// ********************************************************************************************************************************
// ★デジ町_LINE友だち管理.js
//
// ▼メモ
//  - Cybozu CDN ( https://cybozudev.zendesk.com/hc/ja/articles/202960194 )
//
// ▼更新履歴
//  20210729	新規作成 (m.takeuchi)
//                                                                           Copyright(C)2014 TIME CONCIER Co.,Ltd.

// ********************************************************************************************************************************
const SHOW_LENGTH       = 5;                                                // 1ページに表示する件数。リリースは100件を想定
                                                                            // テスト用に5件にしている。
const SUB_DOMAIN        = "digital-town";                                   // サブドメイン
const APP_ID            = kintone.app.getId();                              // LINE友だち管理のアプリID
const VIEW_ID           = 5789206;                                          // アプリのビューID
const APP_URL           = `https://${SUB_DOMAIN}.cybozu.com/k/${APP_ID}/`;  // アプリのURL
const LOGIN_USER        = kintone.getLoginUser()['code'];                   // kintoneのログインユーザー
const appId_user        = 45;                                               // LINE友だち管理
const appId_scout       = 33;                                               // スカウト
const office_info       = 28

const lxn               = luxon.DateTime.fromJSDate(new Date());
const lxnY              = lxn.toFormat('yyyy');
const lxnM              = lxn.toFormat('MM');
const lxnD              = lxn.toFormat('dd');
const lxnYmd            = lxn.toFormat('yyyy-MM-dd');
const lxnTime           = lxn.toFormat('HH:mm:ss');
const lxnYmdHms         = lxn.toFormat('yyyy-MM-dd HH:mm:ss');
const minBirthYear      = 10;
const maxBirthYear      = 89;
// クライアントの作成
const client = new KintoneRestAPIClient();

let viewId;


(function(){
    'use strict';

    const vm = new Vue({
        vuetify: new Vuetify(),
        data: {
            aryMasterRecord: [],
            aryRecord: [],                                                       // 「LINEユーザーIDが有る かつ 友達状態が"友だち"」の条件に当てはまるレコード一覧
                                                                                            // 一度取得したら、以降は変更しない
            // 年代一覧
            aryAge: [
                "10代", "20代", "30代", "40代", "50代", "60代", "70代", "80代"
            ],
            // 性別一覧
            aryGender: [
                "男性",
                "女性"
            ],
            // 勤務地一覧
            aryWorkLocation: [ '高知県内全域', '高知市', '室戸市', '安芸市', '南国市', '土佐市', '須崎市', '宿毛市', '土佐清水市', '四万十市', '香南市', '香美市', '東洋町', '奈半利町', '田野町', '安田町', '北川村', '馬路村', '芸西村', '本山町', '大豊町', '土佐町', '大川村', 'いの町', '仁淀川町', '中土佐町', '佐川町', '越知町', '檮原町', '日高村', '津野町', '四万十町', '大月町', '三原村', '黒潮町'
            ],
            // 契約形態一覧
            aryEmploymentStatus: [ 'アルバイト・パート', '日雇い', '臨時（季節雇用）', '正社員', '契約社員', '派遣社員', '請負', '業務委託', 'その他'
            ],
            // 曜日一覧
            aryDay: [ '月', '火', '水', '木', '金', '土', '日', '祝'
            ],
            aryCity: [],
            // 検索で条件に指定された項目一覧
            inputInfo: {
                // 年代と性別は配列を用意しておかないとチェックボックスの結果を受け取れない
                '年代': [],
                '性別': []
            },
            userInfo:               {},
            year:                   lxnY,
            isAdmin:                false,
            isAdminOpen:            false,
            isShowScout:            true,
            group:                  '',
            ssect:                  '',
            scost:                  0,
            holdingTicket:          0,
            officeInfoRecId:        0,
            officeName:             ''
        },
        computed: {
            isSearch() {
                return window.location.href.indexOf('query', 0) > 0 ? true : false;
            },
            aryColumn() {
                let column = [];
                column.push({ field: 'link', html: true });
                if (this.isAdmin) column.push({ label: '表示名(Adminのみ)', field: '表示名.value' });

                column.push(
                    { label: 'スカウト状態',    field: 'スカウト状態.value' },
                    { label: 'エントリー日',    field: 'エントリー日.value' },
                    { label: '年齢',            field: '年齢.value', formatFn: (value => { return value + '歳'; }) },
                    { label: '性別',            field: '性別.value' },
                    { label: '市区町村',        field: '市名.value' },
                    { label: '希望勤務地',      field: '勤務地.value' },
                    { label: '希望契約形態',    field: '契約形態.value' },
                    { label: '希望勤務開始日',  field: '開始日.value' },
                    { label: '希望勤務終了日',  field: '終了日.value', },
                    { label: '希望曜日',        field: '曜日.value', },
                    { label: '希望職種',        field: '希望職種.value' },
                    { label: '希望詳細職種',    field: '希望詳細職種.value' },
                    { label: '希望業種',        field: '希望業種.value' },
                    { label: '希望詳細業種',    field: '希望詳細業種.value' }
                );
                
                return column;
            },
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
                    const year = this.year - i;
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
        watch: {
            isShowScout(newVal) {
                if (newVal) {
                    this.aryRecord = this.aryMasterRecord;
                } else {
                    this.aryRecord = this.aryMasterRecord.filter(record => record.スカウト状態.value == ' - ' );
                }
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

                const results = groups.filter(group => group['code'] == "Administrators" );

                // 「管理者のみ開く」を有効にする
                if (results.length) this.isAdmin = true;
            });

            const officeInfoParam = {
                app: office_info,
                query: `有料会員アカウント関連付け in ( "${LOGIN_USER}" )`,
                fields: ['レコード番号', '事業所名', '残高']
            };
            const aryOfficeInfo = await this.getRecord(client, officeInfoParam);
            if (!aryOfficeInfo) return;

            const userRecord = aryOfficeInfo[0];
            this.holdingTicket = Number(userRecord['残高']['value']);
            this.officeInfoRecId = Number(userRecord['レコード番号']['value']);

            const objUserInfoParam = {
                app:    appId_user,
                query:  'LINEユーザーID != "" and 友達状態 in ("友だち") and 年齢_年_ >= 16',
                fields: ['レコード番号', 'LINEユーザーID', '表示名', '誕生年', '誕生月']
            };

            if(getParam('ui_query')) objUserInfoParam.query = objUserInfoParam.query + ' and ' + getParam('ui_query');

            // LINE友だち管理からレコードを取得する
            const aryUserInfo = await this.getRecord(client, objUserInfoParam);

            // LINE友だち管理のレコードとをジョブエントリーのレコードとLINEユーザーIDが一致するものだけ抽出する
            // const result = aryUserInfo.records.filter(record => this.aryMasterRecord.find(v => v.LINEユーザーID.value === record.LINEユーザーID.value) );
            this.aryMasterRecord = this.aryMasterRecord.filter(record => aryUserInfo.find(v => v.LINEユーザーID.value === record.LINEユーザーID.value) );

            // console.log(result);

            // 配列の要素をカンマ区切りの文字列に変更する
            this.aryMasterRecord = this.aryMasterRecord.map(record => {
                record.勤務地   = { value: record.勤務地.value.join(', ') };
                record.契約形態 = { value: record.契約形態.value.join(', ') };
                record.曜日     = { value: record.曜日.value.join(', ') };

                return record;
            });

            // MEMO: 必要？
            // this.aryMasterRecord = this.aryMasterRecord.filter(record => result.find(v => v.LINEユーザーID.value === record.LINEユーザーID.value) );
            this.aryMasterRecord = this.aryMasterRecord.map(record => {
                const rec = aryUserInfo.find(v => v.LINEユーザーID.value === record.LINEユーザーID.value);
                return rec ? Object.assign(rec, record) : record;
                // record.表示名 = { value: rec ? rec.表示名.value : '' };
            });
            console.log(this.aryMasterRecord);

            // スカウト情報を取得する
            const objScoutParam = {
                app:    appId_scout,
                query:  'LINEユーザーID != ""',
                fields: ['レコード番号', 'LINEユーザーID', 'スカウト状態']
            };

            const aryScout = await this.getRecord(client, objScoutParam);
            this.aryMasterRecord = this.aryMasterRecord.map(record => {
                const recs = aryScout.filter(r => r.LINEユーザーID.value == record.LINEユーザーID.value );

                record.スカウト状態 = recs.length ? { value: recs[recs.length - 1].スカウト状態.value } : { value: ' - ' };
                return record;
            });

            this.aryMasterRecord.map(record => {
                return record.link = `<div class="text-center"><a href="https://digital-town.cybozu.com/k/${APP_ID}/show#record=${record.$id.value}&ssect=${this.ssect}&scost=${this.scost}&group=${this.group}&officeInfoRecId=${this.officeInfoRecId}" class="d-inline-block border border-1 border-primary rounded py-2 px-3">詳細を見る</a></div>`;
            });

            this.aryRecord = this.aryMasterRecord;

            this.aryCity = await _connectMySQLaxios({
                db: { name: 'tc2_digitown' },
                action: 'get',
                table: 'dt1_city_master'
            });

            // // 絞り込み条件をフォームに反映させる
            this.paramsToForm(getParam('query'), this.inputInfo);
            this.paramsToForm(getParam('ui_query'), this.userInfo);
        },
        methods: {
            async getRecord(client, param) {
                // カーソル作成
                const cursor = await client.record.createCursor(param)
                .then(resp => {
                    return resp;
                })
                .catch(error => {
                    return error;
                });

                // レコード一括取得
                const result = await client.record.getRecordsByCursor(cursor)
                .then(resp => {
                    return resp;
                })
                .catch(err => {
                    return err;
                });

                return result ? result.records : [];
            },
            /** ---------------------------------------------------------------------
             * 検索ボタンが押された時の処理
             --------------------------------------------------------------------- */
            onSearch() {
                const query             = encodeURI(this.getQueryText(this.inputInfo));
                const url               = `${APP_URL}?view=${VIEW_ID}&query=${query}&ssect=${this.ssect}&scost=${this.scost}&officeGroup=${this.group}`;
                let ui_query            = '';
                let aryUiQuery          = [];
                for (let key in this.userInfo) {
                    if (this.userInfo[key]) aryUiQuery.push(`${key} = ${this.userInfo[key]}`);
                }

                if (aryUiQuery.length) ui_query = aryUiQuery.join(' and ');

                window.location.href    = ui_query ? `${url}&ui_query=${ui_query}` : url;
            },
            onClear() {
                console.log(this.inputInfo);
                this.inputInfo  = { '年代': [], '性別': [] };
                this.userInfo   = {};
                this.onSearch();
            },
            /** ---------------------------------------------------------------------
             * 検索画面に戻るボタンが押された時の処理
             --------------------------------------------------------------------- */
            onBack() {
                window.location.href = `${APP_URL}?view=${VIEW_ID}`;
            },
            onAdmin() {
                const el = document.getElementsByClassName('contents-actionmenu-gaia')[0];
                el.style.display = el.style.display == 'block' ? 'none' : 'block';
                this.isAdminOpen = el.style.display == 'block';
            },
            addHyphenToZipcode(val) {
                // -（ハイフン）を自動で入れる
                let zipcode = insertHyphenForZipcode(val);
                this.inputInfo['郵便番号'] = zipcode;
            },
            /** ---------------------------------------------------------------------
             * kintoneで検索するためのクエリを作成する関数
             * @param {object} obj selectedオブジェクト
             --------------------------------------------------------------------- */
            getQueryText(obj) {
                let aryQuery = [
                    'LINEユーザーID != ""'
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
                            case '希望職種':
                            case '希望詳細職種':
                            case '希望業種':
                            case '希望詳細業種':
                                aryQuery.push(`${KEY} like "${NEW_VALUE}"`);
                                break;
                            default:
                                aryQuery.push(`${KEY} = "${NEW_VALUE}"`);
                                break;
                        }
                    }
                }
                return aryQuery.join(' and ');
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
                                aryQuery.push(`${key}="${newValue}"`);
                                break;
                            default:
                                aryQuery.push(`${key} in ("${newValue}")`);
                                break;
                        }
                    }
                }

                return aryQuery.join(' and ');
            },
            getSepaText(text) {
                let sepaText = '';
                if (text.indexOf(' >= ') >= 0) {
                    sepaText = ' >= ';
                } else if (text.indexOf(' != ') >= 0) {
                    sepaText = ' != ';
                } else if (text.indexOf(' = ') >= 0) {
                    sepaText = ' = ';
                } else if (text.indexOf(' in ') >= 0) {
                    sepaText = ' in ';
                } else if (text.indexOf(' like ') >= 0) {
                    sepaText = ' like ';
                }

                console.log(text);
                console.log(sepaText);
                return sepaText;
            },
            paramsToForm(params, inputData) {
                if (!params) return;
                console.log(params);
                const sepaParams = params.split(' and ');
                sepaParams.forEach(param => {
                    console.log(param);
                    const sepaText = this.getSepaText(param);
                    const splits = param.split(sepaText);
                    console.log(splits);
                    let value = splits[1];
                    value = value.replaceAll('"', '');

                    switch (sepaText) {
                        case ' = ':
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

                    inputData[splits[0]] = value;
                });
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
    kintone.events.on(['app.record.index.show'], function(event) {
        if (event.viewId != VIEW_ID) {
            return event;
        }

        console.log(event.records);
        vm.$mount('#app');
        Vue.set(vm, 'aryMasterRecord', event.records);

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
        </v-container>
    `
})