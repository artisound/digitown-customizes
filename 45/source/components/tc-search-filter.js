/* eslint-disable strict */
const minBirthYear      = 10;
const maxBirthYear      = 89;

Vue.component('tc-search-filter', {
  name: 'tc-search-filter',
  props: {
    kintoneEvent: { type: Object,  default: {} },
    group: { type: String,  default: '' },
    ssect: { type: String,  default: '' },
    scost: { type: Number,  default: 0 },
    inputInfo   : { type: Object,  default: {} },
    jobEntryInfo: { type: Object,  default: {} },
  },
  data() {
    return {
      year: dayjs().format('YYYY'),
      /** *************************
       * 属性で絞り込み
       ************************* */
      // 年代一覧
      aryAge: [ "10歳未満", "10代", "20代", "30代", "40代", "50代", "60代", "70代", "80代", "90代", "100以上" ],
      // 性別一覧
      aryGender: ["男性", "女性"],
      // 市区町村一覧
      aryCity: [],

      /** *************************
       * エントリー情報で絞り込む
       ************************* */
      // 勤務地一覧
      aryWorkLocation: [ "高知県内全域", "高知市", "室戸市", "安芸市", "南国市", "土佐市", "須崎市", "宿毛市", "土佐清水市", "四万十市", "香南市", "香美市", "東洋町", "奈半利町", "田野町", "安田町", "北川村", "馬路村", "芸西村", "本山町", "大豊町", "土佐町", "大川村", "いの町", "仁淀川町", "中土佐町", "佐川町", "越知町", "檮原町", "日高村", "津野町", "四万十町", "大月町", "三原村", "黒潮町" ],
      // 契約形態一覧
      aryEmploymentStatus: [ "アルバイト・パート", "日雇い", "臨時（季節雇用）", "正社員", "契約社員", "派遣社員", "請負", "業務委託", "その他" ],
      // 曜日一覧
      aryDay: ["月", "火", "水", "木", "金", "土", "日", "祝"],
    }
  },
  mounted: async function() {
    console.group('tc-search-filter');
    console.log(this.inputInfo);
    console.log(this.jobEntryInfo);


    // ******************************************************************************************************************************
    // 市町村情報をMySQLから取得
    // ******************************************************************************************************************************
    this.aryCity = await _connectMySQLaxios({
      db: { name: "tc2_digitown" },
      action: "get",
      table: "dt1_city_master",
    });
    console.groupEnd('tc-search-filter');
  },
  computed: {
    aryYear() {
      const years = [];
      for (let i = minBirthYear; i <= maxBirthYear; i++) {
        years.push({ text: i + "歳", value: i });
      }

      return years;
    },
    aryBirthYear() {
      const birthYears = [];
      for (let i = minBirthYear; i <= maxBirthYear; i++) {
        const year = this.year - i;
        birthYears.push({ text: year + "年", value: year });
      }

      return birthYears;
    },
    aryMonth() {
      const ary = [];
      for (let index = 1; index <= 12; index++) {
        ary.push({ text: index + "月", value: index });
      }
      return ary;
    },
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
      const query = encodeURI(_getQueryText(this.inputInfo, [ 'LINEユーザーID != ""', '友達状態 in ("友だち")' ], isScout));

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
     * 絞り込み条件文字列から比較演算子を出力
     * @param {String} value - 絞り込み条件文字列
     ********************************************************************* */
    zipcodeAddHypen(value) {
      const zip = zipcodeAutoHyphen(value);
      this.$set(this.inputInfo, '郵便番号', zip);
    },
  },
  template: `
  <v-sheet
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
    <div class="border rounded mb-3 px-3 py-2 bg-white">
      <!-- 見出し -->
      <h2 class="fw-bold m-0 mb-2">属性で絞り込む</h2>
      <!-- 絞り込み条件 -->
      <v-form class="d-flex align-items-center flex-wrap gap-4">
        <!-- 性別 -->
        <fieldset
          class="rounded-2 pt-0 pb-2 mt-n2"
          style="border-color: rgba(0, 0, 0, .38);"
        >
          <legend style="color:rgba(0, 0, 0, .6); font-size: 13px;">
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
      v-if="ssect && ssect.includes('Jobエントリー')"
      class="border rounded mb-3 px-3 py-2 bg-white"
    >
      <!-- 見出し -->
      <h2 class="fw-bold m-0 mb-2">エントリー情報で絞り込む</h2>

      <!-- 絞り込み条件 -->
      <div class="d-flex">
        <v-form class="d-flex align-items-center gap-4">
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
  </v-sheet>
  `,
})