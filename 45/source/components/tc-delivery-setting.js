/* eslint-disable strict */
Vue.component('tc-delivery-setting', {
  name: 'tc-delivery-setting',
  props: {
    scost        : { type: Number,  default: 0 },
    aryRecord    : { type: Array,   default: [] },
    holdingTicket: { type: Number,  default: 0 },
  },
  data() {
    return {
      sendTargetCount: 0,
      useTicket      : 0,
    }
  },
  computed: {
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
      const maxTargetLength = this.aryRecord.length / this.scost;

      for (let i = 0; i <= maxTargetLength; i++) {
        const targetCount = i * this.scost;
        if (targetCount > 0 && targetCount >= this.aryRecord.length) {
          targets.push({ text: "全員", value: this.aryRecord.length });
          break;
        }

        targets.push({ text: `${targetCount}人`, value: targetCount });
      }

      if (this.aryRecord.length % this.scost) {
        targets.push({ text: '全員', value: this.aryRecord.length });
      }

      return targets;
    },
  },
  methods: {
    /** *********************************************************************
     * LINEメッセージ送信
     * - #LINEMSG要素をクリック
     ********************************************************************* */
    sendLINE() {
      if (!this.targetCount) return;
      document.getElementById("LINEMSG").click();
    },
  },
  template: `
  <v-sheet
    class="px-4"
    color="grey lighten-4"
    elevation="1"
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
  </v-sheet>
  `,
})