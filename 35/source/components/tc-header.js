const LOGIN_USER        = kintone.getLoginUser()['code'];                   // kintoneのログインユーザー
const minBirthYear      = 10;
const maxBirthYear      = 89;
const lxn               = luxon.DateTime.fromJSDate(new Date());
const lxnY              = lxn.toFormat('yyyy');
Vue.component('tc-header', {
	name: 'tc-header',
	props: ['client', 'aryMasterRecord'],
	data() {
		return {
			aryAge: [ "10代", "20代", "30代", "40代", "50代", "60代", "70代", "80代" ],
			aryCity: [],
			aryGender: [ "男性", "女性" ],
			inputInfo: { '年代': [], '性別': [] },
			userInfo: {},
			year: lxnY,
			isAdmin: false,
			isAdminOpen: false,
			group: '',
			ssect: '',
			scost: 0,
			officeInfoRecId: 0,
			officeName: ''
		}
	},
	computed: {
		aryYear() {
			let years = [];
			for (let i = minBirthYear; i <= maxBirthYear; i++) {
				years.push({
					text: i + '歳',
					value: i
				});;
			}
			return years;
		},
		aryBirthYear() {
			let birthYears = [];
			for (let i = minBirthYear; i <= maxBirthYear; i++) {
				const year = this.year - i;
				birthYears.push({
					text: year + '年',
					value: year
				});
			}
			return birthYears;
		},
		aryMonth() {
			let ary = [];
			for (let index = 1; index <= 12; index++) {
				ary.push({
					text: index + '月',
					value: index
				});
			}
			return ary;
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

		this.aryCity = await _connectMySQLaxios({
			db: { name: 'tc2_digitown' },
			action: 'get',
			table: 'dt1_city_master'
		});
	},
	methods: {
		onAdmin() {
			const el = document.getElementsByClassName('contents-actionmenu-gaia')[0];
			el.style.display = el.style.display == 'block' ? 'none' : 'block';
			this.isAdminOpen = el.style.display == 'block';
		},
	},
	template: `
		<div>
			<tc-param
				v-show="isAdminOpen"
				:group="group"
				:ssect="ssect"
				:scost="scost"
				:office-info-rec-id="officeInfoRecId"
				:office-name="officeName"
			>
			</tc-param>

			<!-- ヘッダー -->
			<div
				class="px-3 mb-3 d-flex justify-content-between align-items-center"
				style="background-color: #df5550;"
			>
				<h1
					class="my-1 text-white fw-normal"
					style="background-color: #df5550;"
				>
					Jobエントリー
				</h1>
				<v-btn
					v-if="isAdmin"
					large
					@click="onAdmin()"
				>
					管理者のみ開く
				</v-btn>
			</div>

			<!-- 絞り込み -->
			<v-sheet
				class="px-4 mb-3"
				color="grey lighten-4"
				elevation="1"
			>
				<!-- 見出し -->
				<h2
					class="py-2 px-5 d-inline-block text-white bg-secondary fw-bold rounded-pill"
				>
					ターゲット
				</h2>
				<p>配信対象を絞り込む場合は以下の内容を設定して、「絞り込む」ボタンを押してください。</p>
				<p
					class="m-0 text-secondary"
				>
					※すべてAND条件で絞り込みます(例: 「男性」「30代」で絞り込んだ場合は、30代の男性のみがリスト表示されます)
				</p>

				<!-- 属性絞り込み -->
				<div
					class="border rounded mb-3 px-3 py-2 bg-white"
				>
					<!-- 見出し -->
					<h2
						class="fw-bold m-0 mb-2"
					>
						属性で絞り込む
					</h2>
					
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
								style="color: rgba(0, 0, 0, .6); font-size: 13px"
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
									style="padding: 6px 0; cursor: pointer; transitio: .2s;"
									:for="'gender' + index"
								>
									{{ gender }}
								</label>
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
							@input="addHyphenToZipcode($event)"
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
			</v-sheet>
		</div>
	`
});