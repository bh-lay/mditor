/**
 * @author bh-lay
 * 
 * @github https://github.com/bh-lay/mditor
 * @modified requires('Date')
 * 
 **/


(function(global,doc,editor_factory,selection_factory,maked_factory){
  var utils = selection_factory(doc),
      maked = maked_factory(),
      mditor = editor_factory(global,doc,utils,maked);
	global.mditor = global.mditor || mditor;
	global.define && define(function(){
		return mditor;
	});
})(window,document,function(window,document,utils,maked){
	var localStorage = window.localStorage || {
		getItem : function(){},
		setItem : function(){}
	};
	
	var editor_tpl = requires('template/fullScreen.html'),
			mini_tpl = requires('template/mini.html'),
			style_css = requires('css/style.css');
	
  // 创建style标签
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
		
	//处理自定义事件
	function ON(eventName,callback){
		this._events = this._events || {};
		//事件堆无该事件，创建一个事件堆
		if(!this._events[eventName]){
			this._events[eventName] = [];
		}
		this._events[eventName].push(callback);
		//提供链式调用的支持
		return this;
	}
	function EMIT(eventName,args){
		this._events = this._events || {};
		//事件堆无该事件，结束运行
		if(!this._events[eventName]){
			return
		}
		for(var i=0,total=this._events[eventName].length;i<total;i++){
			this._events[eventName][i].apply(this,args);
		}
	}
  /**
   * 历史记录
   **/
  function LOG(max){
    this.data = [];
    this.current = -1;
    this.maxLength = max || 20;
  }
  LOG.prototype = {
    push: function(item){
      if(this.data.length > this.current + 1){
        this.data.length = this.current + 1;
      }
      this.current++;
      this.data.push(item);
      if(this.data.length > this.maxLength){
        this.data = this.data.slice( -this.maxLength);
        this.current = this.maxLength - 1;
      }
    },
    undo: function(){
      if(this.current <= 0){
        return;
      }
      return this.data[--this.current];
    },
    redo: function (){
      if(this.data.length > this.current + 1){
        return this.data[++this.current];
      }else{
        return null;
      }
    }
  };
	var action_config = {
		//加粗
    bold : '**{{加粗}}**',
    //斜体
		italic : '*{{斜体}}*',
    //链接
		link : '[{{链接文字}}](http://)',
    //图片
		image : '![{{图片描述}}](http://)',
    //代码
		code :  '`code`',
    //代码域
		precode : '\n\n```javascript\n{{//some code……}}\n```',
    tab : '  '
	};
  var keyCode_config = {
    9: 'tab',
    c66 : 'bold',
    c71 : 'image',
    c73 : 'italic',
    c75 : 'precode',
    cs75 : 'code',
    c76 : 'link',
    c89 : 'redo',
    c90 : 'undo'
  };
  /**
   * 设置输入框属性
   */
  function setAreaProp(elem){
    elem.spellcheck = false;
    elem.autocapitalize = 'none';
    elem.autocorrect = 'off';
  }
  
  /**
   * 编辑类
   *  change:任何字符改动都会触发
   *  input: 用户输入才会触发
   *
   **/
  function EDITOR($area,param){
    param = param || {};
    var me = this;
    
    this._$textarea = $area;
    //事件中心
		this._events = {};
    //历史记录
    this._log = new LOG(20);
    //设置输入框属性
    this.content = '';
    setAreaProp(this._$textarea[0]);
    //绑定快捷键
    var inputDelay;
    this._$textarea.on('keydown',function(e){
      //监听热键
      var key = (e.ctrlKey ? 'c' : '') + (e.shiftKey ? 's' : '') + e.keyCode;
      if(keyCode_config[key]){
        me.action(keyCode_config[key]);
        e.preventDefault();
      }else{
        clearTimeout(inputDelay);
        inputDelay = setTimeout(function(){
          var cont = $(me._$textarea).val();
          if(cont != me.content){
            me.emit('change',[cont]);
            me.emit('input',[cont]);
            me.content = cont;
          }
        },100);
      }
    });
    
    this.content = this._$textarea.val();
    
    //记录初始状态
    this._logMe();
    //当进行输入操作时，记录状态
    this.on('input',function(val){
      me._logMe(val);
    });
  }
  EDITOR.prototype = {
    on : ON,
		emit : EMIT,
    redo : function(){
      var step = this._log.redo();
      this.writeStep(step);
    },
    undo : function(){
      var step = this._log.undo();
      this.writeStep(step);
    },
    //记录当前状态
    _logMe: function(val){
      this._log.push({
        selection : utils.getPosition(this._$textarea[0]),
        content: val || this._$textarea.val()
      });
    },
    //绘制当前步骤
    writeStep: function (step){
      if(!step || !step.content){
        return
      }
      this._$textarea.val(step.content);
      this.content = step.content;
      this.emit('change',[step.content]);
      if(step.selection){
        utils.setPosition(this._$textarea[0],step.selection[0],(step.selection[1] - step.selection[0]));
      }
    },
		getContent : function(){
			var content = this._$textarea.val();
			localStorage.setItem('mditor',content);
			return content;
		},
		getHtml : function(){
			var text = this.getContent();
		 	var html = maked(text);
		 	return html;
		},
    insert : function(txt){
      utils.insertTxt(this._$textarea[0],txt);
      me.emit('change',[$(me._$textarea).val()]);
    },
		action : function(name){
			var config = action_config[name];
      //第一顺序，执行action_config的插入方法
      if(typeof(config) == 'string'){
        var selection_txt = utils.getPosition(this._$textarea[0])[2];
        config = config.replace(/{{(.+?)}}/,function(a,b){
				  return selection_txt ? selection_txt : b;
        });
        utils.insertTxt(this._$textarea[0],config);
        this._logMe();
      }else if(typeof(config) == 'function'){
        //第二顺序，检查action_config是否为function
        config.call(this);
      }else if(typeof(this[name]) == 'function'){
        //第三顺序,从自身原型链上找方法
        this[name].call(this);
      }
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
    this.editor = new EDITOR(this._$textarea);
    this.editor.on('change',function(){
      me.render();
    });
		//初始化
		$('body').append(this._$dom);
    this._$viewer.addClass(previewClass);
    this._$textarea.val(content);
		this.render();
		
		this._$dom.find('.mditor-close').on('click',function(){
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
		this._$help = me._$dom.find('.mditor-mini-help');

		
    this._$viewer.addClass(previewClass);
    //将编辑器dom放置在textarea前
    this._$textarea.before(this._$dom);
    //再将textarea移入编辑器内
    this._$dom[0].appendChild(this._$textarea[0]);
    
    this.editor = new EDITOR(this._$textarea);
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
    }).on('click','.mditor-help',function(){
			me._$help.fadeIn(80);
		}).on('click','.mditor-close',function(){
			me._$help.fadeOut(100);
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
},requires('js/selection.min.js'),requires('js/maked.min.js'));