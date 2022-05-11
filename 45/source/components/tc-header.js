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

const minBirthYear      = 10;
const maxBirthYear      = 89;

Vue.component("tc-header", {
  name: 'tc-header',
  props: ['client'],
  data() {
    return {
      aryRecord: [], // 「LINEユーザーIDが有る かつ 友達状態が"友だち"」の条件に当てはまるレコード一覧
      // 一度取得したら、以降は変更しない
      // 年代一覧
      aryAge: [ "10歳未満", "10代", "20代", "30代", "40代", "50代", "60代", "70代", "80代", "90代", "100以上" ],
      // 性別一覧
      aryGender: ["男性", "女性"],
      // 勤務地一覧
      aryWorkLocation: [ "高知県内全域", "高知市", "室戸市", "安芸市", "南国市", "土佐市", "須崎市", "宿毛市", "土佐清水市", "四万十市", "香南市", "香美市", "東洋町", "奈半利町", "田野町", "安田町", "北川村", "馬路村", "芸西村", "本山町", "大豊町", "土佐町", "大川村", "いの町", "仁淀川町", "中土佐町", "佐川町", "越知町", "檮原町", "日高村", "津野町", "四万十町", "大月町", "三原村", "黒潮町" ],
      // 契約形態一覧
      aryEmploymentStatus: [ "アルバイト・パート", "日雇い", "臨時（季節雇用）", "正社員", "契約社員", "派遣社員", "請負", "業務委託", "その他" ],
      // 曜日一覧
      aryDay: ["月", "火", "水", "木", "金", "土", "日", "祝"],
      // 市区町村一覧
      aryCity: [],

      jobEntryInfo: {},
      officeInfo  : {},
      inputInfo   : {
        // 検索で条件に指定された項目一覧
        // 年代と性別は配列を用意しておかないとチェックボックスの結果を受け取れない
        年代: [],
        性別: [],
      },

      year       : dayjs().format('YYYY'),
      isAdmin    : false,
      isAdminOpen: false,

      group: "",
      ssect: "",
      scost: 0,

      sendTargetCount: 0,
      useTicket      : 0,
      holdingTicket  : 0,
      officeInfoRecId: 0,
      officeName     : "",
    }
  },
  computed: {
    isSearch() {
      return window.location.href.indexOf("query", 0) > 0 ? true : false;
    },
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

      if (this.ssect && this.ssect.indexOf("求人") != -1) {
        column.push(
          { label: "勤務地", field: "勤務地.value" },
          { label: "契約形態", field: "契約形態.value" },
          { label: "勤務開始日", field: "開始日.value" },
          { label: "曜日", field: "曜日.value" }
        );
      }

      return column;
    },
    aryYear() {
      let years = [];
      for (let i = minBirthYear; i <= maxBirthYear; i++) {
        years.push({ text: i + "歳", value: i });
      }

      return years;
    },
    aryBirthYear() {
      let birthYears = [];
      for (let i = minBirthYear; i <= maxBirthYear; i++) {
        const year = this.year - i;
        birthYears.push({ text: year + "年", value: year });
      }

      return birthYears;
    },
    aryMonth() {
      let ary = [];
      for (let index = 1; index <= 12; index++) {
        ary.push({ text: index + "月", value: index });
      }
      return ary;
    },
    // 選択した配信対象の人数がターゲット人数を超えていれば、ターゲット人数分のポイントを使用する。
    targetCount() {
      return this.sendTargetCount > this.aryRecord.length
        ? this.aryRecord.length
        : this.sendTargetCount;
    },
    sendTargets() {
      let targets = [];
      if (this.scost <= 0) return targets;

      // 配信対象の人数の選択項目を作成する
      const maxTargetLength = 500 / this.scost;

      console.log(this.aryRecord.length);
      for (let i = 0; i <= maxTargetLength; i++) {
        const targetCount = i * this.scost;
        // console.log(targetCount);
        // 1度で配信できるのは1000人まで
        if (targetCount > 0 && targetCount >= this.aryRecord.length) {
          targets.push({ text: "全員", value: this.aryRecord.length });
          break;
        }

        targets.push({ text: `${targetCount}人`, value: targetCount });
      }

      return targets;
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
    const [aryCity, aryOfficeInfo, aryJobEntryInfo] = await Promise.all([
      // ******************************************************************************************************************************
		  // 市町村情報をMySQLから取得
      // ******************************************************************************************************************************
      _connectMySQLaxios({
        db: { name: "tc2_digitown" },
        action: "get",
        table: "dt1_city_master",
      }),

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

    // 市町村情報を格納
    this.aryCity = aryCity;


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
     * 検索ボタンが押された時の処理
     ********************************************************************* */
    onSearch() {
      // スカウトステータス更新
      let isScout = false;
      if (this.ssect.includes("求人")) {
        isScout = this.ssect.includes("スカウト") ? false : true;
      }

      // 入力値をURIエンコード
      const query = encodeURI(_getQueryText(this.inputInfo, isScout));

      // クエリパラメータ生成①
      const aryParam = [];
      if (this.ssect && this.scost && this.group) {
        const addParam = {
          view : VIEW_ID,
          query: query,
          ssect: this.ssect,
          scost: this.scost,
          officeGroup: this.group,
        };

        for (let param in addParam) aryParam.push(`${param}=${addParam[param]}`);
      }

      // クエリパラメータ生成②
      if (isScout && Object.keys(this.jobEntryInfo).length) {
        aryParam.push( 'je_query=' + encodeURI(this.getJobEntryQuery(this.jobEntryInfo)) );
      }

      // ページ遷移
      window.location.href = APP_URL + '?' + aryParam.join('&');
    },

    /** *********************************************************************
     * 入力値をクリア
     ********************************************************************* */
    onClear() {
      this.inputInfo = { 年代: [], 性別: [] };
      this.jobEntryInfo = {};
      this.onSearch();
    },

    /** *********************************************************************
     * 管理者のみ表示する要素を制御
     ********************************************************************* */
    onAdmin() {
      const el = document.getElementsByClassName("contents-actionmenu-gaia")[0];
      el.style.display = el.style.display == "block" ? "none" : "block";
      this.isAdminOpen = el.style.display == "block";
    },

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
     * LINEメッセージ送信
     * - #LINEMSG要素をクリック
     ********************************************************************* */
    sendLINE() {
      if (!this.targetCount) return;
      document.getElementById("LINEMSG").click();
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
     * 絞り込み条件文字列から比較演算子を出力
     * @param {String} value - 絞り込み条件文字列
     ********************************************************************* */
    zipcodeAddHypen(value) {
      const zip = zipcodeAutoHyphen(value);
      this.$set(this.inputInfo, '郵便番号', zip);
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
    <tc-param
      v-show="isAdminOpen"
      :is-admin="isAdmin"
      :group="group"
      :ssect="ssect"
      :scost="scost"
      :office-info-rec-id="officeInfoRecId"
      :office-name="officeName"
    ></tc-param>

    <!-- ヘッダー -->
    <div
      class="px-3 d-flex justify-content-between align-items-center"
      style="margin-bottom: 24px; background-color: #df5550;"
    >
      <h1
        class="my-1 text-white fw-normal"
        style="background-color: #df5550;"
      >
        LINEターゲット配信　
        <span class="fs-5">{{ ssect }}</span>
      </h1>
      <v-btn
        v-if="isAdmin"
        large
        @click="onAdmin()"
      >管理者のみ開く</v-btn>
    </div>

    <!-- 絞り込み -->
    <v-card
      class="p-4"
      color="grey lighten-4"
      style="margin-bottom: 24px;"
    >

      <!--見出し -->
      <h2
        class="py-2 px-5 d-inline-block text-white bg-secondary fw-bold rounded-pill"
      >ターゲット</h2>
      <p>配信対象を絞り込む場合は以下の内容を設定して、「絞り込む」ボタンを押してください。</p>
      <p
        class="m-0 text-secondary"
      >※すべてAND条件で絞り込みます(例:「男性」「30代」で絞り込んだ場合は、30代の男性のみがリスト表示されます)</p>


      <!-- 条件1 -->
      <div
        class="border rounded mb-3 px-3 py-2 bg-white"
      >
        <!-- 見出し -->
        <h2
          class="fw-bold m-0 mb-2"
        >属性で絞り込む</h2>
        <!-- 絞り込み条件 -->
        <v-form
          class="d-flex align-items-center flex-wrap gap-4"
        >
          <!-- 性別 -->
          <fieldset
            class="rounded-2 pt-0 pb-2 mt-n2"
            style="border-color: rgba(0, 0, 0, .38);"
          >
            <legend
              style="color:rgba(0, 0, 0, .6); font-size: 13px;"
            >
              <span>性別</span>
            </legend>
            <div
              class="gender d-inline-block position-relative"
              v-for="(gender, index) in aryGender"
            >
              <input
                class="opacity-0 position-absolute left-0"
                :value="gender"
                :id="'gender' + index"
                type="checkbox"
                v-model="inputInfo['性別']"
              >
              <label
                class="px-3 rounded-2 d-inline-block"
                :class="index > 0 ? 'm-0' : 'me-2'"
                style="padding: 6px 0; cursor: pointer; transition: .2s;"
                :for="'gender' + index"
              >{{ gender }}</label>
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
            style="max-width: 380px;"
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
            style="max-width: 150px;"
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
            style="max-width: 150px;"
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
            style="max-width: 150px;"
          ></v-select>

          <!-- 郵便番号 -->
          <v-text-field
            label="郵便番号"
            type="tel"
            v-model="inputInfo['郵便番号']"
            @change="zipcodeAddHypen($event)"
            outlined
            hide-details="auto"
            style="max-width: 200px;"
          ></v-text-field>

          <!-- 市区町村 -->
          <v-select
            v-model="inputInfo['市名']"
            label="市区町村"
            :items="aryCity"
            item-text="name"
            outlined
            hide-details="auto"
          ></v-select>
        </v-form>
      </div>

      <!-- 条件2 -->
      <div
        v-if="ssect && ssect.indexOf('Jobエントリー') != -1"
        class="border rounded mb-3 px-3 py-2 bg-white"
      >
        <!-- 見出し -->
        <h2
          class="fw-bold m-0 mb-2"
        >エントリー情報で絞り込む</h2>

        <!-- 絞り込み条件 -->
        <div
          class="d-flex"
        >
          <v-form
            class="d-flex align-items-center gap-4"
          >
            <!-- 勤務地 -->
            <v-select
              :items="aryWorkLocation"
              label="勤務地"
              v-model="jobEntryInfo['勤務地']"
              multiple
              outlined
              hide-details="auto"
            ></v-select>

            <!--契約形態 -->
            <v-select
              :items="aryEmploymentStatus"
              label="契約形態"
              v-model="jobEntryInfo['契約形態']"
              multiple
              outlined
              hide-details="auto"
            ></v-select>

            <!-- 勤務開始日 -->
            <v-text-field
              label="開始日"
              type="date"
              v-model="jobEntryInfo['開始日']"
              outlined
              hide-details="auto"
            ></v-text-field>

            <!-- 曜日 -->
            <v-select
              :items="aryDay"
              label="曜日"
              v-model="jobEntryInfo['曜日']"
              multiple
              outlined
              hide-details="auto"
            ></v-select>
          </v-form>
        </div>
      </div>

      <!-- ボタン -->
      <v-card-actions>
        <v-spacer></v-spacer>
        <!-- 検索条件クリアボタン -->
        <v-btn
          class="fw-bold fs-3"
          x-large
          @click="onClear()"
        >
          クリア
        </v-btn>
        <!-- 絞り込むボタン -->
        <v-btn
          class="fw-bold fs-3"
          x-large
          color="primary"
          @click="onSearch()"
        >
          絞り込む
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- 配信設定 -->
    <v-card
      class="px-4"
      color="grey lighten-4"
      style="margin-bottom: 24px;"
    >

      <div class="d-flex">
        <div class="py-4">
          <!-- 見出し -->
          <div class="d-flex align-items-center">
            <h2 class="py-2 px-5 text-white bg-secondary fw-bold rounded-pill">配信設定</h2>
            <p class="m-0 ml-5">チケット1枚につき{{ scost }}人に配信できます。</p>
          </div><!-- /.d-flex -->
          <div class="d-flex pt-2 gap-5">
            <!-- ターゲット人数 -->
            <div>
              <p class="m-0 text-center">ターゲット人数</p>
              <p class="m-0 py-2 text-end fw-bold fs-3"><span id="target">{{ aryRecord.length }}</span>人</p>
            </div>
            <!-- 配信対象 -->
            <div id="sendTargetCountSelect">
              <p class="m-0">配信対象</p>
              <v-select
                class="fw-bold fs-3 "
                v-model="sendTargetCount"
                :items="sendTargets"
                outlined
                hide-details="auto"
                @change="useTicket = Math.ceil(targetCount / scost)"
                style="width: 150px; overflow: auto;"
              ></v-select>
            </div>
            <!-- 利用チケット -->
            <div>
              <p class="m-0">利用チケット</p>
              <p class="m-0 py-2 fw-bold fs-3"><span id="useTicket">{{ useTicket }}</span>枚</p>
            </div>
            <!-- 残チケット -->
            <div>
              <p class="m-0">残チケット</p>
              <p class="m-0 py-2 fw-bold fs-3" :class="holdingTicket - useTicket < 0 ? 'text-danger' : ''">{{ holdingTicket - useTicket }}枚</p>
            </div>
          </div>
        </div>
        <v-spacer></v-spacer>
        <div class="d-flex align-items-center bg-danger px-5">

          <v-btn
            class="fw-bold fs-3 p-4"
            x-large
            @click="sendLINE()"
            :disabled="targetCount && (holdingTicket - useTicket) >= 0 ? false : true"
          >
            配信設定を行う
          </v-btn>
        </div>
      </div>


    </v-card>

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

/** ---------------------------------------------------------------------
 * kintoneで検索するためのクエリを作成する関数
 * @param {Object} obj      - selectedオブジェクト
 * @param {Boolean} isScout - true | false
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