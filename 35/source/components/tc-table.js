/* eslint-disable strict */
Vue.component('tc-table', {
	name: 'tcTable',
	props: [ 'isAdmin', 'aryRecord' ],
	data() {
		return {

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
	template: `
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
	`
});