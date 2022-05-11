/* eslint-disable strict */
Vue.component('tc-header', {
	name: 'tcHeader',
	props: [ 'group', 'ssect', 'scost', 'officeInfoRecId', 'officeName', 'isAdmin' ],
	data() {
		return {
			isAdminOpen: false,
		}
	},
	methods: {
		onAdmin() {
			const el = document.getElementsByClassName('contents-actionmenu-gaia')[0];
			el.style.display = el.style.display == 'block' ? 'none' : 'block';
			this.isAdminOpen = el.style.display == 'block';
		}
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
			></tc-param>

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
					large
					@click="onAdmin()"
				>
					管理者のみ開く
				</v-btn>
			</div>
		</div>
	`
});