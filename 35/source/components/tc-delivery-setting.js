/* eslint-disable strict */
Vue.component('tc-delivery-setting', {
	name: 'tc-delivery-setting',
	props: {
		scost:					{ type: Number, default: 0 },
		aryRecord:			{ type: Array, default: [] },
		holdingTicket:	{ type: Number, default: 0 },
	},
	data() {
		return {
			isShowScout: true,
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
						<a href="#">スカウト{{ isShowScout ? '対象' : '履歴' }}を表示する</a>
						<p>エントリーの詳細情報を確認またはスカウトする場合は対象のエントリー者の行をクリックして詳細情報を開いてください。</p>
					</div>
				</div>
			</div>
		</v-sheet>
	`
});