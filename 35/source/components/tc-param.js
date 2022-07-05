/* eslint-disable strict */
const VIEW_ID           = 5789206;                                          // アプリのビューID
const SUB_DOMAIN        = "digital-town";                                   // サブドメイン
const APP_URL           = `https://${SUB_DOMAIN}.cybozu.com/k/${APP_ID}/`;  // アプリのURL
const LOGIN_USER        = kintone.getLoginUser()['code'];                   // kintoneのログインユーザー
const appId_user        = 45;                                               // LINE友だち管理
const appId_scout       = 33;                                               // スカウト
const office_info       = 28
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
			kintoneUserCode: LOGIN_USER,
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
		}
	},
	computed: {
		aryColumn() {
			let column = [];
			column.push({ field: 'link', html: true });
			if (this.isAdmin) column.push({ label: '表示名(Adminのみ)', field: '表示名.value' });

			if (this.ssect == 'スカウト配信') {
				column.push({ label: 'スカウト状態', field: 'スカウト状態.value' });
			}

			column.push(
				{ label: '性別'										, field: '性別.value' },
				{ label: '年齢'										, field: '年齢.value', formatFn: (value => { return value + '歳'; }) },
				{ label: '郵便番号'								, field: '郵便番号.value' },
				{ label: '都道府県名'							, field: '都道府県名.value' },
				{ label: '市名'										, field: '市名.value' },
				{ label: 'エントリー日'						, field: 'エントリー日.value' },
				{ label: '市区町村'								, field: '市名.value' },
				{ label: '勤務地'									, field: '勤務地.value' },
				{ label: '契約形態'								, field: '契約形態.value' },
				{ label: '副業・Wワーク'					, field: '副業_Wワーク.value' },
				{ label: 'リモートワーク'					, field: 'リモートワーク.value' },
				{ label: '残業'										, field: '残業.value' },
				{ label: '希望給与'								, field: '希望給与.value' },
				{ label: '希望額'									, field: '希望額.value' },
				{ label: '開始日'									, field: '開始日.value' },
				{ label: '勤務終了日指定'					, field: '勤務終了日指定.value' },
				{ label: '終了日'									, field: '終了日.value', },
				{ label: '時間帯'									, field: '時間帯.value', },
				{ label: '希望業務開始時間'				, field: '希望業務開始時間.value', },
				{ label: '希望業務終了時間'				, field: '希望業務終了時間.value', },
				{ label: '曜日指定'								, field: '曜日指定.value', },
				{ label: '曜日'										, field: '曜日.value', },
				{ label: '求人情報配信'						, field: '求人情報配信.value', },
				{ label: '希望職種'								, field: '希望職種.value' },
				{ label: '希望詳細職種'						, field: '希望詳細職種.value' },
				{ label: 'その他の希望詳細職種'		, field: 'その他の希望詳細職種.value' },
				{ label: '希望業種'								, field: '希望業種.value' },
				{ label: '希望詳細業種'						, field: '希望詳細業種.value' },
				{ label: 'その他の希望詳細業種'		, field: 'その他の希望詳細業種.value' },
				{ label: '経験職種・年数'					, field: '経験職種_年数.value' },
				{ label: '免許・資格・スキルなど'	, field: '免許_資格_スキルなど.value' },
				{ label: '語学'										, field: '語学.value' },
				{ label: '自己PR'									, field: '自己PR.value' },
				{ label: '希望事項'								, field: '希望事項.value' },
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
      client.record.getAllRecords({
        app:				office_info,
        condition:	`有料会員アカウント関連付け in ( "${LOGIN_USER}" )`,
        fields:			['レコード番号', '事業所名', '残高']
      }).then(resp => { return resp; }).catch(console.error),

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

    // 事業所レコード情報を格納
		if (!aryOfficeInfo && !aryOfficeInfo.length) return;
		const userRecord			= aryOfficeInfo[0];
    this.officeName				= userRecord["事業所名"].value;
		this.holdingTicket		= Number(userRecord['残高']['value']);
		this.officeInfoRecId	= Number(userRecord['レコード番号']['value']);

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

		// TC社員
		if (!this.isAdmin) {

			const adminRecords = [
				'U377a75b2e72a676753dc253c765416cf',
				'Uaca4df0e661c0d159052b9438f42f689',
				'U401c9d802cc20884f3b4cf4baf22a0a1', // タイムコンシェル秘書
				'Udfb9c783ed22b62f82341103fed70465',
				'Ub0141028dfb30809aeafc792a7676a09',
				'U0f3f6a565cc72a09ae06c5cb3f54c837'
			]

			// TC社員をはじく
			this.aryRecord = this.aryRecord.filter(record => {
				return !adminRecords.find(v => v.includes(record['LINEユーザーID']['value']))
			})
		}

		this.aryRecord.forEach(record => {
			for (const key in record) {
				if (!Array.isArray(record[key].value)) continue;

				switch(key) {
					case '副業_Wワーク':
					case 'リモートワーク':
						record[key].value = record[key].value.length ? record[key].value[0] : ''
						break;
					case '経験職種_年数':
						let texts = [];
						record[key].value.forEach(r => {
							const val = r.value;
							texts.push(`${val['経験職種']['value']}: ${val['年数']['value']}年`);
						})
						record[key].value = texts.join(',');
						break;
					case '免許_資格_スキルなど':
						let licenses = [];
						record[key].value.forEach(r => {
							licenses.push(r['value']['免許_資格_スキル']['value'])
						})

						record[key].value = licenses.join(',\n')
						break;
					case '語学':
						let languege = [];
						record[key].value.forEach(r => {
							const val = r.value
							languege.push(`${val['言語']['value']}: ${val['習得レベル']['value']}`);
						})
						record[key].value = languege.join(',')
						break;
				}
			}
		})

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

				this.$set(inputData, splits[0], value);
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
			<tc-delivery-setting
				:client="client"
				:user="kintoneUserCode"
				:group="group"
				:ssect="ssect"
				:scost="scost"
				:ary-record="aryRecord"
				:holding-ticket="holdingTicket"
			></tc-delivery-setting>

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