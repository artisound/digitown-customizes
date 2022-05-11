// レコード検索のデフォルトの条件
const ARY_DEFAULT_QUERY = [
  'LINEユーザーID not in ("")',
  '友達状態 in ("友だち")'
];

const SHOW_LENGTH       = 5;
const VIEW_ID           = 5700739;                      // アプリのビューID

const LOGIN_USER        = kintone.getLoginUser().code;  // kintoneのログインユーザー
const appId_entry       = 35;                           // ジョブエントリー
const office_info       = 28                            // 事業所管理

const APP_ID            = kintone.app.getId();          // LINE友だち管理のアプリID
const SUB_DOMAIN        = "digital-town";                                   // サブドメイン
const APP_URL           = `https://${SUB_DOMAIN}.cybozu.com/k/${APP_ID}/`;  // アプリのURL

Vue.component("tc-param", {
  name: 'tc-param',
  props: ['client', 'kintoneEvent'],
  data() {
    return {
      aryRecord: [], // 「LINEユーザーIDが有る かつ 友達状態が"友だち"」の条件に当てはまるレコード一覧
      // 一度取得したら、以降は変更しない

      jobEntryInfo: {},
      officeInfo  : {},
      inputInfo   : {
        // 検索で条件に指定された項目一覧
        // 年代と性別は配列を用意しておかないとチェックボックスの結果を受け取れない
        年代: [],
        性別: [],
      },

      isAdmin    : false,

      group: "",
      ssect: "",
      scost: 0,

      holdingTicket  : 0,
      officeInfoRecId: 0,
      officeName     : "",
    }
  },
  computed: {
    aryColumn() {
      let column = [];
      if (this.isAdmin)
        column.push({ label: "表示名(Adminのみ)", field: "表示名.value" });

      column.push(
        { label: "年代", field: "年代.value" },
        { label: "性別", field: "性別.value" },
        {
          label: "誕生年",
          field: "誕生年.value",
          formatFn: (value) => {
            return value + "年";
          },
        },
        {
          label: "誕生月",
          field: "誕生月.value",
          formatFn: (value) => {
            return value + "月";
          },
        },
        {
          label: "年齢",
          field: "年齢_年_.value",
          formatFn: (value) => {
            return value + "歳";
          },
        },
        { label: "郵便番号", field: "郵便番号.value" },
        { label: "市区町村", field: "市名.value" }
      );

      if (this.ssect && this.ssect.includes('求人')) {
        column.push(
          { label: "勤務地", field: "勤務地.value" },
          { label: "契約形態", field: "契約形態.value" },
          { label: "勤務開始日", field: "開始日.value" },
          { label: "曜日", field: "曜日.value" }
        );
      }

      return column;
    },
  },
  mounted: async function() {
    // kintone Rest API Client
    const client = this.client;

    /** *******************************************************
     * カスタマイズ一覧の選択等を非表示にする
     ******************************************************* */
    const el = document.getElementsByClassName("contents-actionmenu-gaia")[0];
    el.style.display = "none";

    /** *******************************************************
     * 各クエリパラメータを格納
     ******************************************************* */
    this.ssect = getParam("ssect");
    this.scost = Number(getParam("scost"));
    this.group = getParam("officeGroup");

    /** *******************************************************
     * ログインユーザーの組織取得
     ******************************************************* */
    kintone.api(
      kintone.api.url("/v1/user/groups", true),
      "GET",
      { code: LOGIN_USER },
      (resp) => {
        console.group("Current User's Group");

        // 全組織(グループ)を取得
        const groups = resp.groups;
        console.log('Groups', groups);

        // ログインしているユーザーに"Administrators"組織があればそれを抽出
        const grpAdmin = groups.find(group => group.code == "Administrators");
        console.log('AdminGroup', grpAdmin);

        // 「管理者のみ開く」を有効にする
        if (grpAdmin) this.isAdmin = true;
        console.log('isAdmin', this.isAdmin);

        console.groupEnd("Current User's Group");
      }
    );


    /** *******************************************************
     * 一気にデータ取得
     ******************************************************* */
    const [aryOfficeInfo, aryJobEntryInfo] = await Promise.all([
      // ******************************************************************************************************************************
		  // 事業所管理からレコードを取得する
      // ******************************************************************************************************************************
      client.record.getAllRecords({
        app: office_info,
        condition: `有料会員アカウント関連付け in ( "${LOGIN_USER}" )`,
        fields: ["レコード番号", "事業所名", "残高"],
      }).then(resp => { return resp; }).catch(console.error),

      // ******************************************************************************************************************************
		  // ジョブエントリーからレコードを取得する
      // ******************************************************************************************************************************
      client.record.getAllRecords({
        app  : APP_ID,
        condition: getParam("query"),
      }).then(resp => { return resp; }).catch(console.error),
    ]);

    // 絞り込み条件をフォームに反映させる
    this.paramsToForm(getParam("query"), this.inputInfo);


    // 事業所レコード情報を格納
    if(!aryOfficeInfo && !aryOfficeInfo.length) return;
    const userRecord     = aryOfficeInfo[0];
    this.officeName      = userRecord["事業所名"].value;
    this.holdingTicket   = Number(userRecord["残高"].value);
    this.officeInfoRecId = Number(userRecord["レコード番号"].value);

    console.log(this.inputInfo);

    // ジョブエントリー情報
    console.log(aryJobEntryInfo)
    if(aryJobEntryInfo && aryJobEntryInfo.length) {
      if (this.ssect.includes("求人")) {
        this.aryRecord = aryJobEntryInfo;
        return;
      } else {
        let aryRecord = aryJobEntryInfo;

        // ジョブエントリーアプリからレコードを取得する
        const objParam = {
          app: appId_entry,
          condition: 'LINEユーザーID != "" and ジョブエントリー状態 in ("エントリー中")',
          fields: [ "レコード番号", "LINEユーザーID", "勤務地", "契約形態", "開始日", "曜日" ],
        };

        // ジョブエントリー用クエリパラメータ確認
        const je_query = getParam("je_query");
        if (je_query) objParam.condition += " and " + je_query;


        const aryJobEntry = await client.record.getAllRecords(objParam);
        aryRecord = aryRecord.filter(record => {
          return aryJobEntry.find(v => v.LINEユーザーID.value == record.LINEユーザーID.value);
        });

        this.aryRecord = aryRecord.map((record) => {
          const matchRec = aryJobEntry.find(
            (v) => v.LINEユーザーID.value == record.LINEユーザーID.value
          );
          record["勤務地"] = { value: matchRec["勤務地"]["value"].join(", ") };
          record["契約形態"] = {
            value: matchRec["契約形態"]["value"].join(", "),
          };
          record["開始日"] = { value: matchRec["開始日"]["value"] };
          record["曜日"] = { value: matchRec["曜日"]["value"].join(", ") };

          return record;
        });

        // 絞り込み条件をフォームに反映させる
        this.paramsToForm(je_query, this.jobEntryInfo);
      }
    }
  },
  methods: {

    /** *********************************************************************
     * 管理者のみ表示する要素を制御
     ********************************************************************* */
    getJobEntryQuery(obj) {
      console.group('getJobEntryQuery()');
      const aryQuery = [];
      for (const key in obj) {
        const newValue = obj[key];

        if (Array.isArray(newValue)) {
          // ------------------------
          // 配列
          if (!newValue || newValue.length < 1) continue;
          const objQuery = {};
          for (const i in newValue) {
            if( !objQuery[key] ) objQuery[key] = [];
            objQuery[key].push(`"${newValue[i]}"`);
          }

          console.log('isArray', objQuery);
          aryQuery.push(`${key} in (${objQuery[key].join(", ")})`);
        } else {
          // ------------------------
          // 文字列
          if (!newValue) continue;
          if (newValue.length < 1) continue;
          switch (key) {
            case "開始日":
              aryQuery.push(`${key} = "${newValue}"`);
              break;
            default:
              aryQuery.push(`${key} in ("${newValue}")`);
              break;
          }
        }
      }
      console.log('Queries', aryQuery);

      console.groupEnd('getJobEntryQuery()');
      return aryQuery.join(" and ");
    },

    /** *********************************************************************
     * 絞り込み条件文字列から比較演算子を出力
     * @param {String} strQuery - 絞り込み条件文字列
     ********************************************************************* */
    getSepaText(strQuery) {
      const seps = [ ' >= ', ' != ', '=', ' = ', ' in ', ' like ' ];
      for (let sep of seps) if(strQuery.includes(sep)) return sep;
    },

    /** *********************************************************************
     * 絞り込み条件をフォームに反映させる
     * @param {String} params    - 絞り込み条件文字列
     * @param {Object} inputForm - 反映させる対象のdataプロパティ
     ********************************************************************* */
    paramsToForm(params, inputForm) {
      if (!params) return;

      let i = 0;
      console.group('paramsToForm');
      for (const param of params.split(" and ")) {
        if ( param.includes("LINEユーザーID") || param.includes("友達状態") || param.includes("求人配信") ) continue;
        console.group('paramsToForm'+i);

        const sepaText = this.getSepaText(param);
        const splits = param.split(sepaText);
        let value = splits[1].replace(/\"/g, "");

        switch (sepaText) {
          case "=":
          case " = ":
            if (Number(value)) value = Number(value);
            break;
          case " in ":
            // ()内の文字列を抽出し、カンマで分割
            value = value.match(/\((.+)\)/)[1].split(", ");
            break;
          default:
            break;
        }

        console.log('condition', param);
        console.log('separator', sepaText);
        console.log('value', value);

        inputForm[splits[0]] = value;
        console.groupEnd('paramsToForm'+i);
        i++;
      };
      console.groupEnd('paramsToForm');

      return inputForm;
    },
  },
  template: `
  <div>
    <!-- 管理者のみ見られる情報 -->
    <tc-header
      :is-admin="isAdmin"
      :group="group"
      :ssect="ssect"
      :scost="scost"
      :office-info-rec-id="officeInfoRecId"
      :office-name="officeName"
    ></tc-header>

    <!-- 絞り込み -->
    <tc-search-filter
      :group="group"
      :ssect="ssect"
      :scost="scost"
      :input-info="inputInfo"
      :job-entry-info="jobEntryInfo"
    ></tc-search-filter>

    <!-- 配信設定 -->
    <tc-delivery-setting
      :scost="scost"
      :ary-record="aryRecord"
      :holding-ticket="holdingTicket"
    ></tc-delivery-setting>

    <!-- 検索結果 -->
    <vue-good-table
      class="mb-5"
      :columns="aryColumn"
      :rows="aryRecord"
      :pagination-options="{
        enabled: true,
        position: 'both',
        perPage: 100,
        nextLabel: '次のページへ',
        prevLabel: '前のページへ',
        ofLabel: '/',
        rowsPerPageLabel: 'ページあたりの行数',
      }"
    ></vue-good-table>
  </div>
  `,
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
