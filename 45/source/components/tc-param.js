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