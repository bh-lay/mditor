/**
 * 
 */


(function(global,doc,editor_factory,selection_factory,showdown_factory){
	
	var utils = selection_factory(doc);
	var showdown = showdown_factory();
	
	var mditor = editor_factory(global,doc,utils,showdown);
	global.mditor = global.mditor || mditor;
	global.define && define(function(){
		return mditor;
	});
})(window,document,function(window,document,utils,Showdown){
	var localStorage = window.localStorage || {
		'getItem' : function(){},
		'setItem' : function(){}
	};
	
	var miniBar_tpl = requires('template/miniBar.html');
	var editor_tpl = requires('template/fullScreen.html');
	var style_css = requires('style.css');
	
	function createStyleSheet(cssStr,attr){
		var styleTag = document.createElement('style');
		
		attr = attr || {};
		attr.type = "text/css";
		for(var i in attr){
			styleTag.setAttribute(i, attr[i]);
		}
		
		// IE
		if (styleTag.styleSheet) {
			styleTag.styleSheet.cssText = cssStr;
		} else {
			var tt1 = document.createTextNode(cssStr);
			styleTag.appendChild(tt1);
		}
		
		return styleTag;
	}
		
	var private_head = document.head || document.getElementsByTagName('head')[0];
	var styleSheet = createStyleSheet(style_css,{'data-module' : "mditor"});
	private_head.appendChild(styleSheet);
		
	//激活状态的对象（最多同时存在一个）
	var private_active = null;
	
	var tools_config = {
		'bold' : {
			'title' : '加粗',
			'insert' : '**{{加粗}}**'
		},
		'italic' : {
			'title' : '斜体',
			'insert' : '*{{斜体}}*'
		},
		'link' : {
			'title' : '链接',
			'insert' : '[{{链接文字}}](http://)'
		},
		'image' : {	
			'title' : '图片',
			'insert' : '![{{图片描述}}](http://)'
		},
		'code' : {
			'title' : '代码域',
			'insert' : '\n\n```javascript\n{{//some code……}}\n```\n\n'
		}
	};
	function resize(){
		var parent_w = parseInt($(this._textarea).parent().width());
		var parent_h = parseInt($(this._textarea).parent().height());
		var padding_lr = parseInt($(this._textarea).css('paddingLeft'))*2;
		var padding_tb = parseInt($(this._textarea).css('paddingTop'))*2;
		$(this._textarea).css({
			'width' : parent_w - padding_lr,
			'height' : parent_h - padding_tb
		});
	}
	$(window).resize(function(){
		if(private_active){
			resize.call(private_active);
		}
	});
	function checkKeyBoard(code){
		console.log(code,12);
		if(code == 66){
			this.action('bold');
		}else if(code == 73){
			this.action('italic');
		}
	}
	function EDITOR(param){
		if(private_active){
			return
		}
		var me = this;
		var param = param || {};
		var content;
		if(param['editFor']){
			this.edit_for = param['editFor'];
			content = this.edit_for.val();
		}else{
			content = param['content'] || '';
		}
		if(content.length < 2 && localStorage.getItem('mditor')){
			content = localStorage.getItem('mditor');
		}
		
		var new_tpl = editor_tpl.replace('{content}',content);
		
		this.dom = $(new_tpl);
		this._textarea = this.dom.find('textarea')[0];
		this._view = this.dom.find('.md_html');
		this.closeFn = param['closeFn'] || null;
		//初始化
		$('body').append(this.dom);
		this.render();
		resize.call(this);
		private_active = this;
		var inputDelay;
		$(this._textarea).on('keydown keyup',function(e){
			clearTimeout(inputDelay);
			inputDelay = setTimeout(function(){
				me.render();
			},100);
		});
		$(this._textarea).on('keyup',function(e){
			if(e.ctrlKey){
				checkKeyBoard.call(me,e.keyCode)
				return false;
			}
		});
		
		this.dom.find('.mditor_toolBar').on('click','a',function(){
			var act_str = $(this).attr('data-action');
			me.action(act_str);
		});
	}
	EDITOR.prototype = {
		'getContent' : function(){
			var content = $(this._textarea).val();
			localStorage.setItem('mditor',content);
			return content;
		},
		'getHtml' : function(){
			console.log('refresh')
			var text = this.getContent();
			var converter = new Showdown.converter();
		 	var html = converter.makeHtml(text);
		 	return html;
		},
		'render' : function(){
			var html = this.getHtml();
			this._view.html(html);
		},
		'close' : function(){
			private_active = null;
			this.closeFn && this.closeFn(this.getContent());
			this.dom.remove();
		},
		'action' : function(type){
			if( !tools_config[type]){
				return;
			}
			var selection_txt = utils.Selection(this._textarea)[2];
			var txt = tools_config[type]['insert'];
			txt = txt.replace(/{{(.+?)}}/,function(a,b){
				console.log(a,b)
				return selection_txt ? selection_txt : b;
			});
			console.log(type,txt);
			utils.insertTxt(this._textarea,txt);
			this.render();
		/**
			if(name == 'exist_fullscreen'){
					me.close();
				}else if(name == "preview"){
					var viewDom = me.dom.find('.mditor_view');
					if(viewDom.css('display') == 'none'){
						viewDom.show();
					}else{
						viewDom.hide();
					}
				}
		**/
		}
	};
	
	return {
		'create' : function(param){
			return new EDITOR(param);
		}
	};
},requires('selection.js'),requires('showdown.js'));