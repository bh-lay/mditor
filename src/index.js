/**
 * @author bh-lay
 * 
 * @github https://github.com/bh-lay/mditor
 * @modified requires('Date')
 * 
 **/


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
		getItem : function(){},
		setItem : function(){}
	};
	
	var editor_tpl = requires('template/fullScreen.html');
	var mini_tpl = requires('template/mini.html');
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
    //代码
		code : {
			insert : '`code`'
		},
    //代码域
		precode : {
			insert : '\n\n```javascript\n{{//some code……}}\n```'
		},
    tab : {
      insert : '  '
    }
	};
	var keyCode_config = {
    9: 'tab',
		c66 : 'bold',
		c71 : 'image',
		c73 : 'italic',
		c75 : 'precode',
		cs75 : 'code',
		c76 : 'link',
	};
    
  function EDITOR($area,param){
    param = param || {};
    var me = this;
    
    this._$textarea = $area;
    this.onchange = param.onchange || null;
    //绑定快捷键
		var inputDelay;
    this._$textarea.on('keydown',function(e){
      var key = (e.ctrlKey ? 'c' : '') + (e.shiftKey ? 's' : '') + e.keyCode;
      if(keyCode_config[key]){
        me.action(keyCode_config[key]);
        e.preventDefault();
      }else{
        clearTimeout(inputDelay);
        inputDelay = setTimeout(function(){
          me.onchange && me.onchange.call(this,$(me._$textarea).val());
        },200);
      }
    });
  }
  EDITOR.prototype = {
		getContent : function(){
			var content = $(this._$textarea).val();
			localStorage.setItem('mditor',content);
			return content;
		},
		getHtml : function(){
			var text = this.getContent();
			var converter = new Showdown.converter();
		 	var html = converter.makeHtml(text);
		 	return html;
		},
    insert : function(txt){
      utils.insertTxt(this._$textarea[0],txt);
    },
		action : function(type){
			if( !action_config[type]){
				return;
			}
			var selection_txt = utils.Selection(this._$textarea[0])[2];
			var txt = action_config[type]['insert'];
			txt = txt.replace(/{{(.+?)}}/,function(a,b){
				return selection_txt ? selection_txt : b;
			});
			utils.insertTxt(this._$textarea[0],txt);
		}
	};
  

  /**
   * 全屏编辑器
   * 
   */
	function Full(param){
		var me = this,
        content = param.content || '',
        previewClass = param.previewClass || 'article';
		
		this._$dom = $(editor_tpl);
		this._$textarea = this._$dom.find('textarea');
		this._$viewScreen = this._$dom.find('.mditor_view');
		this._$viewer = this._$viewScreen.find('.md_html');
    
		this.closeFn = param['closeFn'] || null;
    this.editor = new EDITOR(this._$textarea,{
      onchange : function(){
        me.render();
      }
    });
		//初始化
		$('body').append(this._$dom);
    this._$viewer.addClass(previewClass);
    this._$textarea.val(content);
		this.render();
		
		this._$dom.find('.exist_fullscreen').on('click',function(){
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
        var moveDom = (scrollDom == me._$viewScreen[0]) ? me._$textarea : me._$viewScreen;
        moveDom.animate({
          scrollTop: percent * moveDom[0].scrollHeight
        },90);
        setTimeout(function(){
          isAdapt = false;
        },140);
      },200);
    }
    this._$textarea.on('scroll',scroll);
    this._$viewScreen.on('scroll',scroll);
    $('body').addClass('mditor-overflow');
	}
	Full.prototype = {
    render : function(){
      var html = this.editor.getHtml();
      this._$viewer.html(html);
    },
    close : function(){
      this.closeFn && this.closeFn.call(this);
      this._$dom.remove();
      $('body').removeClass('mditor-overflow');
    }
  };
  /**
   * mini编辑器
   *
   **/
	function MINI(area,param){
    if(! (this instanceof MINI)){
        return new MINI(area,param);
    }
    param = param || {};
		var me = this,
        previewClass = param.previewClass || 'article';
		
		this._$dom = $(mini_tpl);
    this._$textarea = $(area);
    this._$viewer = this._$dom.find('.mditor-mini-preview');
    this._$btn_preview = this._$dom.find('.mditor-btn-preview');
    this._$btn_edit = this._$dom.find('.mditor-btn-edit');
    this.editor = new EDITOR(this._$textarea,{
      onchange: param.onchange || null
    });
		
    this._$viewer.addClass(previewClass);
    //将编辑器dom放置在textarea前
    this._$textarea.before(this._$dom);
    //再将textarea移入编辑器内
    this._$dom[0].appendChild(this._$textarea[0]);
    //全屏
    this._$dom.on('click','.mditor-btn-full',function(){
      new Full({
        content: me.getContent(),
        previewClass: previewClass,
        closeFn: function(){
          me._$textarea.val(this.editor.getContent());
          me.render();
        }
      });
    });
    //预览
    this._$btn_preview.on('click',function(){
      me.preview();
    });
    //退出预览
    this._$btn_edit.on('click',function(){
      me.edit();
    });
	}
  MINI.prototype = {
		getContent : function(){
			return this.editor.getContent();;
		},
		getHtml : function(){
		 	return this.editor.getHtml();
		},
    render : function(){
      var html = this.editor.getHtml();
      this._$viewer.html(html);
    },
    insert : function(txt){
      //修复预览状态下，插入渲染不及时的问题
		 	this.editor.insert(txt);
      this.render();
    },
    preview : function(){
      this._$textarea.hide();
      this.render();
      this._$viewer.show();
      this._$btn_edit.removeClass('active');
      this._$btn_preview.addClass('active');
    },
    edit : function(){
      this._$textarea.show();
      this._$viewer.hide().html('');
      this._$btn_edit.addClass('active');
      this._$btn_preview.removeClass('active');
    }
	};
  return MINI;
},requires('selection.min.js'),requires('showdown.min.js'));