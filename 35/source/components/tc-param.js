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
Vue.component('tc-param', {
	name: 'tc-param',
	props: ['client'],
	data() {
		return {
			inputInfo   : {
        // 検索で条件に指定された項目一覧
        // 年代と性別は配列を用意しておかないとチェックボックスの結果を受け取れない
        年代: [],
        性別: [],
      },
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
				// { label: '希望業種',        field: '希望業種.value' },
				// { label: '希望詳細業種',    field: '希望詳細業種.value' }
			);

			return column;
		},
	},
	watch: {
		isShowScout(newVal) {
			if (!newVal) {
				this.aryRecord = this.aryRecord.filter(record => record.スカウト状態.value == ' - ' );
			}
		},
		"inputInfo.郵便番号"(newVal) {
			let zipcode = insertHyphenForZipcode(newVal);
			this.inputInfo.郵便番号 = zipcode;
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


    const [aryOfficeInfo, aryUserInfo, aryJobEntryInfo] = await Promise.all([
      // ******************************************************************************************************************************
		  // 事業所管理からレコードを取得する
      // ******************************************************************************************************************************
      client.record.getRecords({
        app:				office_info,
        query:	`有料会員アカウント関連付け in ( "${LOGIN_USER}" )`,
        fields:			['レコード番号', '事業所名', '残高']
      }).then(resp => {
        if (!resp) return;
        const userRecord			= resp.records[0];
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

    if(!aryJobEntryInfo) return;
		// LINE友だち管理のレコードとをジョブエントリーのレコードとLINEユーザーIDが一致するものだけ抽出する
		this.aryRecord = aryJobEntryInfo.records.filter(record => aryUserInfo.find(v => v.LINEユーザーID.value === record.LINEユーザーID.value) );
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

		// 絞り込み条件をフォームに反映させる
		this.paramsToForm(getParam('query'), this.inputInfo);
		this.paramsToForm(getParam('ui_query'), this.userInfo);
	},
	methods: {
		getSepaText(text) {
      const seps = [ ' >= ', ' != ', ' = ', ' in ', ' like ' ];
      for (let sep of seps) if(text.includes(sep)) return sep;
		},
		paramsToForm(params, inputData) {
			if (!params) return;
			const sepaParams = params.split(' and ');
			for (const param of sepaParams) {
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
					case ' like ':
						// breakすることでinputData[キー名]に値を入れることができる
						break;
					default:
						// 値を入れたくないのでcontinueする
						continue;
				}

				inputData[splits[0]] = value;
			}
		},
	},
	template: `
		<div>
			<tc-header
				:title="'Jobエントリー'"
				:is-admin="isAdmin"
				:group="group"
				:ssect="ssect"
				:scost="scost"
				:office-info-rec-id="officeInfoRecId"
				:office-name="officeName"
			></tc-header>

			<tc-search-filter
				:group="group"
				:ssect="ssect"
				:scost="scost"
				:input-info="inputInfo"
				:user-info="userInfo"
			></tc-search-filter>

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

			<tc-table
				:is-admin="isAdmin"
				:ary-record="aryRecord"
			></tc-table>
		</div>
	`
});