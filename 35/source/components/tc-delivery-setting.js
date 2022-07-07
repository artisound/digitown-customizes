/* eslint-disable strict */
Vue.component('tc-delivery-setting', {
	name: 'tc-delivery-setting',
	props: {
		client:					{ type: Object, default: {} },
		user:						{ type: Number, default: 0 },
		group:					{ type: String, default: '' },
		ssect:					{ type: String, default: '' },
		scost:					{ type: Number, default: 0 },
		aryRecord:			{ type: Array,	default: [] },
		holdingTicket:	{ type: Number, default: 0 },
	},
	data() {
		return {
			isShowScout: true,
			url: ''
		}
	},
	watch: {
		async group(newVal) {
			const client = this.client;
			/** ***********************************************************
			// ポータルメニューマスターアプリからレコード取得
			*********************************************************** */
			const aryPortalMenu = await client.record.getAllRecords({
				app:		97,
				fields:	['グループ情報テーブル', 'グループ選択', 'メニュー情報テーブル']
			}).then(resp => { return resp; }).catch(console.error);

			const portalMenu	= aryPortalMenu.find(v => v['グループ選択']['value'][0]['name'] == newVal);
			const tabs				= portalMenu['グループ情報テーブル']['value'];
			const menuInfos		= portalMenu['メニュー情報テーブル']['value'];
			const scoutTab		= tabs.find(v => v.value.グループ名.value == 'スカウトする');
			const scoutMenu		= menuInfos.find(v => v['value']['親グループNo']['value'] == scoutTab['value']['グループNo']['value']);
			this.url					= scoutMenu['value']['メニューURL']['value'];

			this.isShowScout	= getParam('query').includes('スカウト履歴');
			this.url += this.isShowScout ? `&query=LINEユーザーID != "" and 年齢 >= 16` : `&query=スカウト履歴.有料会員アカウント関連付け in ( "${this.user}" )`;
			this.url += `&ssect=${this.ssect}&scost=${this.scost}&officeGroup=${newVal}`;
		}
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
						<p class="m-0 ml-5">チケット1枚につき{{ scost }}人をスカウトできます。</p>
					</div>

					<div class="d-flex pt-2 gap-5">
						<!-- ターゲット人数 -->
						<div>
							<p class="m-0 text-center">ターゲット人数</p>
							<p class="m-0 py-2 text-end fw-bold fs-3">
								<span id="target">{{ aryRecord.length }}</span>
							</p>
						</div>

						<!-- 残チケット -->
						<div>
							<p class="m-0">残チケット</p>
							<p class="m-0 py-2 fw-bold fs-3">{{ holdingTicket }}枚</p>
						</div>
					</div>

					<!-- 配信対象情報等 -->
					<div class="pt-3">
						<a :href="url" class="d-inline-block border p-2 bg-primary text-white">スカウト{{ isShowScout ? '対象' : '履歴' }}を表示する</a>
						<p>エントリーの詳細情報を確認またはスカウトする場合は対象のエントリー者の行をクリックして詳細情報を開いてください。</p>
					</div>
				</div>
			</div>
		</v-sheet>
	`
});