/* eslint-disable strict */
Vue.component('tc-header', {
  name: 'tc-header',
  props: {
    isAdmin        : { type: Boolean, default: false },
    group          : { type: String,  default: '' },
    ssect          : { type: String,  default: '' },
    scost          : { type: Number,  default: 0 },
    officeName     : { type: String,  default: '' },
    officeInfoRecId: { type: Number,  default: 0 },
  },
  data() {
    return {
      isAdminOpen: false,
    }
  },
  methods: {
    /** *********************************************************************
     * 管理者のみ表示する要素を制御
     ********************************************************************* */
    onAdmin() {
      const el = document.getElementsByClassName("contents-actionmenu-gaia")[0];
      el.style.display = el.style.display == "block" ? "none" : "block";
      this.isAdminOpen = el.style.display == "block";
    },
  },
  template: `
  <div>
    <!-- 管理者のみ見られる情報 -->
    <v-container v-show="isAdminOpen">
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
  </div>
  `
});