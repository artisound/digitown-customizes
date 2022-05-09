(function() {
"use strict";
	/* -----------------------------------------------------------------------------
	 * タブメニューを作成するクラス
	 * -------------------------------------------------------------------------- */
	var Tab = function(type) {
		this.tab = [];
		this.type = type;
		this.initTab();
		this.initMenu();
		if (String(location.hash).match(/[#&]tab=(\d+)/)) {
			this.active(RegExp.$1);
		} else {
			this.active(0);
		}
		this.hideMask();
	}
	Tab.prototype = {
		initTab: function() {
			var tmp = [];
			var no  = -1;
			var layout = document.getElementsByClassName('layout-gaia')[0];
			var nodes  = layout.childNodes;
			for (var i1 = 0, j1 = nodes.length; i1 < j1; i1++) {
				var el = nodes[i1].getElementsByClassName('control-value-label-gaia')[0];
				if (el && el.textContent.match(/^\[([^@\]]+)\]$/)) {
					nodes[i1].style.display = 'none';
					this.tab.push(RegExp.$1);
					tmp[++no] = [];
					continue;
				}
				if (no == -1) continue;
				tmp[no].push(nodes[i1]);
			}
			for (var i2 = 0, j2 = tmp.length; i2 < j2; i2++) {
				var layer = document.createElement('div');
				layer.style.display = 'none';
				layer.id = 'tab-layer' + i2;
				layout.appendChild(layer);
				for (var i3 = 0, j3 = tmp[i2].length; i3 < j3; i3++) {
					layer.appendChild(tmp[i2][i3]);
					tmp[i2][i3] = null;
				}
				tmp[i2] = null;
			}
			tmp = null;
		},
		initMenu: function() {
			var menu = document.getElementById('user-js-tab-menu');
			menu.className = 'tab-menu';
			var inner = document.createElement('div');
			inner.className = 'tab-menu-inner';
			menu.appendChild(inner);
			var ul = document.createElement('ul');
			inner.appendChild(ul);
			var title = document.createElement('div');
			title.id = 'tab-menu-title';
			title.className = 'tab-menu-title';
			menu.appendChild(title);
			for (var i = 0, j = this.tab.length; i < j; i++) {
				var tab = this.tab[i];
				var li = document.createElement('li');
				var div = document.createElement('div');
				div.id = 'tab-menu-item' + i;
				div.className = 'tab-menu-item';
				if (i == 0) div.className += ' tab-menu-item-start';
				else if (i == (j -1)) div.className += ' tab-menu-item-end';
				div.appendChild(document.createTextNode(this.tab[i]));
				li.appendChild(div);
				ul.appendChild(li);
				li.addEventListener('click', this.clickListener.bind(this));
			}
		},
		clickListener: function(e) {
			var no = String(e.target.id).replace(/^tab-menu-item/, '');
			if (no == '') no = 0;
			this.active(parseInt(no, 10));
		},
		active: function(no) {
			var title = document.getElementById('tab-menu-title');
			while (title.firstChild) title.removeChild(title.firstChild);
			for (var i = 0, j = this.tab.length; i < j; i++) {
				var layer = document.getElementById('tab-layer' + i);
				var div = document.getElementById('tab-menu-item' + i);
				div.className = String(div.className).replace(/(?:\s+|^)tab-menu-item-active(?:\s+|$)/, '');
				var display = 'none';
				if (no == i) {
					display = '';
					div.className += ' tab-menu-item-active';
					title.appendChild(document.createTextNode(div.textContent));
				}
				layer.style.display = display;
			}
			if (this.type != 'app.record.create.show') {
				var hash = String(location.hash).replace(/[#&]tab=\d+/, '');
				location.hash =  hash + (hash == '' ? '#' : '&') + 'tab=' + no;
			}
		},
		hideMask: function() {
			var el = document.getElementById('user-js-tab-mask').parentNode;
			while (el) {
				if (String(el.className).match(/(\s+|^)row-gaia(\s+|$)/)) {
					el.style.display = 'none';
					break;
				}
				el = el.parentNode;
			}
		}
	};
	kintone.events.on(['app.record.detail.show', 'app.record.create.show', 'app.record.edit.show'], function(event) {
		new Tab(event.type);
		return event;
	});
})();
