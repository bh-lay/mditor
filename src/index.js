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
	
	var editor_tpl = requires('template/fullScreen.html');
	var miniBar_tpl = requires('template/miniBar.html');
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
		
	
	function Full(param){
		var me = this,
            content = param.content || '';
		
		this.dom = $(editor_tpl.replace('{content}',content));
		this._textarea = this.dom.find('textarea');
        
		this._viewScreen = this.dom.find('.mditor_view');
		this._viewer = this._viewScreen.find('.md_html');
		this.closeFn = param['closeFn'] || null;
        this.editor = new MDITOR(this._textarea,{
            needFull : false,
            onchange : function(){
                me.render();
            }
        });
		//初始化
		$('body').append(this.dom);
        
		this.render();
		
		this.dom.find('.exist_fullscreen').on('click',function(){
            me.close();
        });
        var isAdapt = false;
        function scroll(){
            if(isAdapt){
                return;
            }
            isAdapt = true;
            var scrollDom = this;
            setTimeout(function(){
                var percent = $(scrollDom).scrollTop() / scrollDom.scrollHeight;
                var moveDom = (scrollDom == me._viewScreen[0]) ? me._textarea : me._viewScreen;
                moveDom.animate({
                    scrollTop: percent * moveDom[0].scrollHeight
                },90);
                setTimeout(function(){
                    isAdapt = false;
                },140);
            },200);
        }
        this._textarea.on('scroll',scroll);
        this._viewScreen.on('scroll',scroll);
        
	}
	Full.prototype = {
        render : function(){
            var html = this.editor.getHtml();
            this._viewer.html(html);
        },
        close : function(){
            this.closeFn && this.closeFn.call(this);
            this.dom.remove();
        }
    };
    
	var action_config = {
		//加粗
        bold : {
			insert : '**{{加粗}}**'
		},
        //斜体
		italic : {
			insert : '*{{斜体}}*'
		},
        //链接
		link : {
			insert : '[{{链接文字}}](http://)'
		},
        //图片
		image : {
			insert : '![{{图片描述}}](http://)'
		},
        //代码域
		code : {
			insert : '\n\n```javascript\n{{//some code……}}\n```\n\n'
		}
	};
	var keyCode_config = {
		c66 : 'bold',
		c73 : 'italic',
		c76 : 'link',
		c71 : 'image',
		c75 : 'code'
	};
    
    function MDITOR($area,param){
        if(! (this instanceof MDITOR)){
            return new MDITOR($area,param);
        }
        param = param || {};
        var me = this,
            needFull = typeof param.needFull == 'boolean' ? param.needFull : true;
        
        this._textarea = $area;
        this.onchange = param.onchange || null;
        //绑定快捷键
		var inputDelay;
        this._textarea.on('keydown',function(e){
            var key = (e.ctrlKey ? 'c' : '') + (e.shiftKey ? 's' : '') + e.keyCode;
            if(keyCode_config[key]){
                me.action(keyCode_config[key]);
                e.preventDefault();
            }else{
                clearTimeout(inputDelay);
                inputDelay = setTimeout(function(){
                    me.onchange && me.onchange();
                },200);
            }
        });
        if(needFull){
            var bar = $(miniBar_tpl);
            this._textarea.before(bar);
            bar.on('click','.mditor_full_btn',function(){
                new Full({
                    content: me.getContent(),
                    closeFn: function(){
                        me._textarea.val(this.editor.getContent());
                    }
                });
            });
        }
        
    }
    MDITOR.prototype = {
		getContent : function(){
			var content = $(this._textarea).val();
			localStorage.setItem('mditor',content);
			return content;
		},
		getHtml : function(){
			var text = this.getContent();
			var converter = new Showdown.converter();
		 	var html = converter.makeHtml(text);
		 	return html;
		},
		action : function(type){
			if( !action_config[type]){
				return;
			}
			var selection_txt = utils.Selection(this._textarea[0])[2];
			var txt = action_config[type]['insert'];
			txt = txt.replace(/{{(.+?)}}/,function(a,b){
				return selection_txt ? selection_txt : b;
			});
			utils.insertTxt(this._textarea[0],txt);
            this._textarea.trigger('change');
		}
	};
    return MDITOR;
    
},requires('selection.js'),requires('showdown.js'));