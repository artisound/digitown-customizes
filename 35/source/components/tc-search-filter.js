/* eslint-disable strict */
Vue.component('tc-search-filter', {
	name: 'tc-search-filter',
	props: {
		group			: { type: String,  	default: '' },
		ssect			: { type: String,  	default: '' },
		scost			: { type: Number,  	default: 0 },
		inputInfo	: { type: Object,		default: {} },
		userInfo	: { type: Object,		default: {} },
	},
	data() {
		return {
			year								: dayjs().format('YYYY'),
			aryGender						: [ "男性", "女性" ],
			aryAge							: [ "10代", "20代", "30代", "40代", "50代", "60代", "70代", "80代" ],
			aryCity							: [],
			// 勤務地一覧
			aryWorkLocation			: [ '高知県内全域', '高知市', '室戸市', '安芸市', '南国市', '土佐市', '須崎市', '宿毛市', '土佐清水市', '四万十市', '香南市', '香美市', '東洋町', '奈半利町', '田野町', '安田町', '北川村', '馬路村', '芸西村', '本山町', '大豊町', '土佐町', '大川村', 'いの町', '仁淀川町', '中土佐町', '佐川町', '越知町', '檮原町', '日高村', '津野町', '四万十町', '大月町', '三原村', '黒潮町' ],
			// 契約形態一覧
			aryEmploymentStatus	: [ 'アルバイト・パート', '日雇い', '臨時（季節雇用）', '正社員', '契約社員', '派遣社員', '請負', '業務委託', 'その他' ],
			// 曜日一覧
			aryDay							: [ '月', '火', '水', '木', '金', '土', '日', '祝' ],
		}
	},
	computed: {
		aryYear() {
			const years = [];
			for (let i = minBirthYear; i <= maxBirthYear; i++) {
				years.push({ text: i + '歳', value: i });
			}
			return years;
		},
		aryBirthYear() {
			const birthYears = [];
			for (let i = minBirthYear; i <= maxBirthYear; i++) {
				const year = this.year - i;
				birthYears.push({ text: year + '年', value: year });
			}
			return birthYears;
		},
		aryMonth() {
			const ary = [];
			for (let index = 1; index <= 12; index++) {
				ary.push({ text: index + '月', value: index });
			}
			return ary;
		}
	},
	mounted: async function() {
		this.aryCity = await _connectMySQLaxios({
			db		: { name: 'tc2_digitown' },
			action: 'get',
			table	: 'dt1_city_master'
		});
	},
	methods: {
		/** ---------------------------------------------------------------------
		 * 検索ボタンが押された時の処理
		--------------------------------------------------------------------- */
		onSearch() {
			const query			= encodeURI(_getQueryText(this.inputInfo, [ 'LINEユーザーID != ""', '年齢 >= 16' ]));
			// クエリパラメータ生成①
			const aryParam	= [];
			// 「スカウトする」にはssectの値がないのでif文はコメントアウト
			// if (this.ssect && this.scost && this.group) {
			const addParam	= {
				view				: VIEW_ID,
				query				: query,
				ssect				: this.ssect,
				scost				: this.scost,
				officeGroup	: this.group
			};
			for (const param in addParam) aryParam.push(`${param}=${addParam[param]}`);
			// }
			
			const aryUiQuery = [];
			for (const key in this.userInfo) {
				if (this.userInfo[key]) aryUiQuery.push(`${key} = ${this.userInfo[key]}`);
			}

			if (aryUiQuery.length) aryParam.push(`ui_query=${aryUiQuery.join(' and ')}`);

			window.location.href = APP_URL + '?' + aryParam.join('&');
		},
		onClear() {
			this.inputInfo  = { '年代': [], '性別': [] };
			this.userInfo   = {};
			this.onSearch();
		},
	},
	template: `
		<!-- 絞り込み -->
		<v-sheet
			class="p-4"
			color="grey lighten-4"
			elevation="1"
			style="margin-bottom: 24px;"
		>
			<!-- 見出し -->
			<h2 class="py-2 px-5 d-inline-block text-white bg-secondary fw-bold rounded-pill">ターゲット</h2>
			<p>配信対象を絞り込む場合は以下の内容を設定して、「絞り込む」ボタンを押してください。</p>
			<p class="m-0 text-secondary">※すべてAND条件で絞り込みます(例: 「男性」「30代」で絞り込んだ場合は、30代の男性のみがリスト表示されます)</p>

			<!-- 属性絞り込み -->
			<div class="border rounded mb-3 px-3 py-2 bg-white">
				<!-- 見出し -->
				<h2 class="fw-bold m-0 mb-2">属性で絞り込む</h2>
				
				<!-- 絞り込み条件 -->
				<div class="d-flex">
					<v-form class="d-flex flex-wrap align-items-center flex-wrap gap-4">
						<!-- 性別 -->
						<fieldset
							class="rounded-2 pt-0 pb-2 mt-n2"
							style="border-color: rgba(0, 0, 0, .38);"
						>
							<legend style="color: rgba(0, 0, 0, .6); font-size: 13px">
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
									style="padding: 6px 0; cursor: pointer; transitio: .2s;"
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
							v-model="inputInfo['年齢']"
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
							v-model="userInfo['誕生年']"
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
							v-model="userInfo['誕生月']"
							:items="aryMonth"
							item-text="text"
							item-value="value"
							label="誕生月"
							outlined
							clearable
							hide-details="auto"
							style="max-width: 150px;"
						></v-select>

						<!-- 郵便番号 -->
						<v-text-field
							v-model="inputInfo['郵便番号']"
							label="郵便番号"
							type="tel"
							outlined
							hide-details="auto"
							style="max-width: 200px;"
						></v-text-field>

						<!-- 市区町村 -->
						<v-select
							v-model="inputInfo['市名']"
							:items="aryCity"
							item-text="name"
							label="市区町村"
							outlined
							hide-details="auto"
						></v-select>
					</v-form>
				</div>
			</div>

			<!-- エントリー情報絞り込み -->
			<div class="border rounded mb-3 px-3 py-2 bg-white">
				<!-- 見出し -->
				<h2 class="fw-bold m-0 mb-2">エントリー情報で絞り込む</h2>

				<!-- 絞り込み条件 -->
				<div class="d-flex">
					<v-form class="d-flex flex-wrap align-items-center gap-4">
						<!-- 勤務地 -->
						<v-select
							v-model="inputInfo['勤務地']"
							:items="aryWorkLocation"
							label="勤務地"
							multiple
							outlined
							hide-details="auto"
						></v-select>

						<!-- 契約形態 -->
						<v-select
							v-model="inputInfo['契約形態']"
							:items="aryEmploymentStatus"
							label="契約形態"
							multiple
							outlined
							hide-details="auto"
						></v-select>

						<!--勤務開始日 -->
						<v-text-field
							v-model="inputInfo['開始日']"
							label="開始日"
							type="date"
							outlined
							hide-details="auto"
						></v-text-field>

						<!-- 曜日 -->
						<v-select
							v-model="inputInfo['曜日']"
							:items="aryDay"
							label="曜日"
							multiple
							outlined
							hide-details="auto"
						></v-select>

						<!-- 職種 -->
						<v-text-field
							v-model="inputInfo['希望職種']"
							label="職種"
							type="text"
							outlined
							hide-details="auto"
						></v-text-field>

						<!-- 詳細職種 -->
						<v-text-field
							v-model="inputInfo['希望詳細職種']"
							label="詳細職種"
							type="text"
							outlined
							hide-details="auto"
						></v-text-field>
					</v-form>
				</div>
			</div>

			<!-- ボタン -->
			<div class="d-flex align-items-center p-2">
				<v-spacer></v-spacer>
				<!-- 検索条件クリアボタン -->
				<v-btn
					class="fw-bold fs-3"
					x-large
					@click="onClear()"
				>クリア</v-btn>

				<!-- 絞り込むボタン -->
				<v-btn
					class="fw-bold fs-3"
					x-large
					color="primary"
					@click="onSearch()"
				>絞り込む</v-btn>
			</div>
		</v-sheet>
	`
});