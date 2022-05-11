/* eslint-disable strict */
const VIEW_ID           = 5789206;                                          // アプリのビューID
const APP_ID            = kintone.app.getId();                              // LINE友だち管理のアプリID
const SUB_DOMAIN        = "digital-town";                                   // サブドメイン
const APP_URL           = `https://${SUB_DOMAIN}.cybozu.com/k/${APP_ID}/`;  // アプリのURL
const LOGIN_USER        = kintone.getLoginUser()['code'];                   // kintoneのログインユーザー
const appId_user        = 45;                                               // LINE友だち管理
const appId_scout       = 33;                                               // スカウト
const office_info       = 28
const minBirthYear      = 10;
const maxBirthYear      = 89;
const lxn               = luxon.DateTime.fromJSDate(new Date());
const lxnY              = lxn.toFormat('yyyy');
Vue.component('tc-header', {
	name: 'tc-header',
	props: ['client'],
	data() {
		return {
			aryAge: [ "10代", "20代", "30代", "40代", "50代", "60代", "70代", "80代" ],
			aryCity: [],
			aryGender: [ "男性", "女性" ],
			// 勤務地一覧
			aryWorkLocation: [ '高知県内全域', '高知市', '室戸市', '安芸市', '南国市', '土佐市', '須崎市', '宿毛市', '土佐清水市', '四万十市', '香南市', '香美市', '東洋町', '奈半利町', '田野町', '安田町', '北川村', '馬路村', '芸西村', '本山町', '大豊町', '土佐町', '大川村', 'いの町', '仁淀川町', '中土佐町', '佐川町', '越知町', '檮原町', '日高村', '津野町', '四万十町', '大月町', '三原村', '黒潮町' ],
			// 契約形態一覧
			aryEmploymentStatus: [ 'アルバイト・パート', '日雇い', '臨時（季節雇用）', '正社員', '契約社員', '派遣社員', '請負', '業務委託', 'その他' ],
			// 曜日一覧
			aryDay: [ '月', '火', '水', '木', '金', '土', '日', '祝' ],
			inputInfo: { '年代': [], '性別': [] },
			userInfo: {},
			aryRecord: [],
			year: lxnY,
			isAdmin: false,
			isAdminOpen: false,
			group: '',
			ssect: '',
			scost: 0,
			officeInfoRecId: 0,
			officeName: '',
			holdingTicket: 0,
			isShowScount: true,
		}
	},
	computed: {
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
			for (let i = minBirthYear; i <= maxBirthYear; i++) {
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
				ary.push({ text: index + '月', value: index });
			}
			return ary;
		}
	},
	watch: {
		isShowScout(newVal) {
			if (!newVal) {
				this.aryRecord = this.aryRecord.filter(record => record.スカウト状態.value == ' - ' );
			}
		}
	},
	async mounted() {
		const client = this.client;
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

    // --------------------------------------------------------
    // LINE友だち管理からレコード取得用パラメータ
		const objUserInfoParam = {
			app:    appId_user,
			condition:  'LINEユーザーID != "" and 友達状態 in ("友だち") and 年齢_年_ >= 16',
			fields: ['レコード番号', 'LINEユーザーID', '表示名', '誕生年', '誕生月']
		};
		if(getParam('ui_query')) objUserInfoParam.condition += ' and ' + getParam('ui_query');


    const [aryOfficeInfo, aryUserInfo, aryJobEntryInfo] = await new Promise.all([
      // ******************************************************************************************************************************
		  // 事業所管理からレコードを取得する
      // ******************************************************************************************************************************
      client.record.getRecords({
        app:				office_info,
        query:	`有料会員アカウント関連付け in ( "${LOGIN_USER}" )`,
        fields:			['レコード番号', '事業所名', '残高']
      }).then(resp => {
        if (!resp) return;
        const userRecord			= resp[0];
        this.holdingTicket		= Number(userRecord['残高']['value']);
        this.officeInfoRecId	= Number(userRecord['レコード番号']['value']);
      }),

      // ******************************************************************************************************************************
		  // LINE友だち管理からレコードを取得する
      // ******************************************************************************************************************************
      client.record.getAllRecords(objUserInfoParam),

      // ******************************************************************************************************************************
		  // ジョブエントリーからレコードを取得する
      // ******************************************************************************************************************************
      client.record.getRecords({
        app: APP_ID,
        query: `${getParam("query")}`
        // query: `${getParam("query")} limit 500 offset 0`
      }).then(async resp => {
        return resp;
      }).catch(console.error),
    ]);

    if(aryJobEntryInfo) {
      this.aryRecord = aryJobEntryInfo;
      // LINE友だち管理のレコードとをジョブエントリーのレコードとLINEユーザーIDが一致するものだけ抽出する
      this.aryRecord = this.aryRecord.filter(record => aryUserInfo.find(v => v.LINEユーザーID.value === record.LINEユーザーID.value) );
      // 配列の要素をカンマ区切りの文字列に変更する
      this.aryRecord = this.aryRecord.map(record => {
        record.勤務地   = { value: record.勤務地.value.join(', ') };
        record.契約形態 = { value: record.契約形態.value.join(', ') };
        record.曜日     = { value: record.曜日.value.join(', ') };

        return record;
      });

      this.aryRecord = this.aryRecord.map(record => {
        const rec = aryUserInfo.find(v => v.LINEユーザーID.value === record.LINEユーザーID.value);
        return rec ? Object.assign(rec, record) : record;
      });

      // スカウト情報を取得する
      const objScoutParam = {
        app:    appId_scout,
        condition:  'LINEユーザーID != ""',
        fields: ['レコード番号', 'LINEユーザーID', 'スカウト状態']
      };

      const aryScout = await client.record.getAllRecords(objScoutParam);
      this.aryRecord = this.aryRecord.map(record => {
        const recs = aryScout.filter(r => r.LINEユーザーID.value == record.LINEユーザーID.value );

        record.スカウト状態 = recs.length ? { value: recs[recs.length - 1].スカウト状態.value } : { value: ' - ' };
        return record;
      });

      this.aryRecord.map(record => {
        return record.link = `<div class="text-center"><a href="https://digital-town.cybozu.com/k/${APP_ID}/show#record=${record.$id.value}&ssect=${this.ssect}&scost=${this.scost}&group=${this.group}&officeInfoRecId=${this.officeInfoRecId}" class="d-inline-block border border-1 border-primary rounded py-2 px-3">詳細を見る</a></div>`;
      });

      this.aryCity = await _connectMySQLaxios({
        db: { name: 'tc2_digitown' },
        action: 'get',
        table: 'dt1_city_master'
      });

      // 絞り込み条件をフォームに反映させる
      this.paramsToForm(getParam('query'), this.inputInfo);
      this.paramsToForm(getParam('ui_query'), this.userInfo);
    }


		// kintone.api(
		// 	kintone.api.url('/k/v1/records', true),
		// 	'GET',
		// 	body,
		// 	async resp => {
		// 		this.aryRecord = resp.records;
		// 		// LINE友だち管理のレコードとをジョブエントリーのレコードとLINEユーザーIDが一致するものだけ抽出する
		// 		this.aryRecord = this.aryRecord.filter(record => aryUserInfo.find(v => v.LINEユーザーID.value === record.LINEユーザーID.value) );
		// 		// 配列の要素をカンマ区切りの文字列に変更する
		// 		this.aryRecord = this.aryRecord.map(record => {
		// 			record.勤務地   = { value: record.勤務地.value.join(', ') };
		// 			record.契約形態 = { value: record.契約形態.value.join(', ') };
		// 			record.曜日     = { value: record.曜日.value.join(', ') };

		// 			return record;
		// 		});

		// 		this.aryRecord = this.aryRecord.map(record => {
		// 			const rec = aryUserInfo.find(v => v.LINEユーザーID.value === record.LINEユーザーID.value);
		// 			return rec ? Object.assign(rec, record) : record;
		// 		});

		// 		// スカウト情報を取得する
		// 		const objScoutParam = {
		// 			app:    appId_scout,
		// 			condition:  'LINEユーザーID != ""',
		// 			fields: ['レコード番号', 'LINEユーザーID', 'スカウト状態']
		// 		};

		// 		const aryScout = await client.record.getAllRecords(objScoutParam);
		// 		this.aryRecord = this.aryRecord.map(record => {
		// 			const recs = aryScout.filter(r => r.LINEユーザーID.value == record.LINEユーザーID.value );

		// 			record.スカウト状態 = recs.length ? { value: recs[recs.length - 1].スカウト状態.value } : { value: ' - ' };
		// 			return record;
		// 		});

		// 		this.aryRecord.map(record => {
		// 			return record.link = `<div class="text-center"><a href="https://digital-town.cybozu.com/k/${APP_ID}/show#record=${record.$id.value}&ssect=${this.ssect}&scost=${this.scost}&group=${this.group}&officeInfoRecId=${this.officeInfoRecId}" class="d-inline-block border border-1 border-primary rounded py-2 px-3">詳細を見る</a></div>`;
		// 		});

		// 		this.aryCity = await _connectMySQLaxios({
		// 			db: { name: 'tc2_digitown' },
		// 			action: 'get',
		// 			table: 'dt1_city_master'
		// 		});

		// 		// // 絞り込み条件をフォームに反映させる
		// 		this.paramsToForm(getParam('query'), this.inputInfo);
		// 		this.paramsToForm(getParam('ui_query'), this.userInfo);
		// 	},
		// 	err => {
		// 		console.log(err);
		// 	}
		// );
	},
	methods: {
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
		getSepaText(text) {
      const seps = [ ' >= ', ' != ', ' = ', ' in ', ' like ' ];
      for (let sep of seps) if(text.includes(sep)) return sep;

			// let sepaText = '';
			// if (text.includes(' >= ')) {
			// 	sepaText = ' >= ';
			// } else if (text.includes(' != ')) {
			// 	sepaText = ' != ';
			// } else if (text.includes(' = ')) {
			// 	sepaText = ' = ';
			// } else if (text.includes(' in ')) {
			// 	sepaText = ' in ';
			// } else if (text.includes(' like ')) {
			// 	sepaText = ' like ';
			// }
			// return sepaText;
		},
		paramsToForm(params, inputData) {
			if (!params) return;
			const sepaParams = params.split(' and ');
			sepaParams.forEach(param => {
				const sepaText = this.getSepaText(param);
				const splits = param.split(sepaText);
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
		},
		onAdmin() {
			const el = document.getElementsByClassName('contents-actionmenu-gaia')[0];
			el.style.display = el.style.display == 'block' ? 'none' : 'block';
			this.isAdminOpen = el.style.display == 'block';
		},
		onClear() {
			this.inputInfo  = { '年代': [], '性別': [] };
			this.userInfo   = {};
			this.onSearch();
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
							:items="{
                let birthYears = [];
                for (let i = ${minBirthYear}; i <= ${maxBirthYear}; i++) {
                  const year = this.year - i;
                  birthYears.push({ text: year + '年', value: year });
                }
                return birthYears;
              }"
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

				<!-- エントリー情報絞り込み -->
				<div
					class="border rounded mb-3 px-3 py-2"
				>
					<!-- 見出し -->
					<h2
						class="fw-borld m-0 mb-2"
					>
						エントリー情報で絞り込む
					</h2>

					<!-- 絞り込み条件 -->
					<v-form
						class="d-flex align-items-center gap-4"
					>
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
					</v-form>

					<v-form
						class="d-flex align-items-center gap-4 mt-3"
					>
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

				<!-- ボタン -->
				<div
					class="d-flex align-items-center p-2"
				>
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
				</div>
			</v-sheet>

			<!-- 配信設定 -->
			<v-sheet
				class="px-4 mb-3"
			>
				<div
					class="d-flex"
				>
					<div
						class="py-4"
					>
						<!-- 見出し -->
						<div
							class="d-flex align-items-center"
						>
							<h2
								class="py-2 px-5 text-white bg-secondary fw-bold rounded-pill"
							>
								配信設定
							</h2>
							<p
								class="m-0 ml-5"
							>
								チケット1枚につき{{ scost }}人をスカウトできます。
							</p>
						</div>

						<div
							class="d-flex pt-2 gap-5"
						>
							<!-- ターゲット人数 -->
							<div>
								<p
									class="m-0 text-center"
								>
									ターゲット人数
								</p>
								<p
									class="m-0 py-2 text-end fw-bold fs-3"
								>
									<span
										id="target"
									>
										{{ aryRecord.length }}
									</span>
								</p>
							</div>

							<!-- 残チケット -->
							<div>
								<p
									class="m-0"
								>
									残チケット
								</p>
								<p
									class="m-0 py-2 fw-bold fs-3"
								>
									{{ holdingTicket }}枚
								</p>
							</div>
						</div>

						<!-- 配信対象情報等 -->
						<div
							class="pt-3"
						>
							<div>
								<input
									v-model="isShowScount"
									id="isShowScount"
									type="checkbox"
								>
								<label
									for="isShowScount"
								>
									スカウトした内容を表示する
								</label>
							</div>
							<p>エントリーの詳細情報を確認またはスカウトする場合は対象のエントリー者の行をクリックして詳細情報を開いてください。</p>
						</div>
					</div>
				</div>
			</v-sheet>

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
					rowsPerPageLabel: 'ページ当たりの行数'
				}"
			></vue-good-table>
		</div>
	`
});