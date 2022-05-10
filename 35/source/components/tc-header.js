Vue.component('tc-header', {
	name: 'tc-header',
	props: ['client', 'aryMasterRecord'],
	data() {
		return {
			isAdminOpen: true,
			group: '',
			ssect: '',
			scost: 0,
			officeInfoRecId: 0,
			officeName: ''
		}
	},
	async mounted() {
		// カスタマイズ一覧の選択等を非表示にする
		const el = document.getElementsByClassName('contents-actionmenu-gaia')[0];
		el.style.display = 'none';

		this.ssect = getParam('ssect');
		this.scost = Number(getParam('scost'));
		this.group = getParam('officeGroup');
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
		</div>
	`
});