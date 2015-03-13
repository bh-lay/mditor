欢迎使用Mditor
======
Mditor是一个轻量级的markdown编辑器。取名自markdown + editor，用于实现页面markdown输入框的便利操作。

##Markdown是什么
> Markdown 是一种轻量级标记语言，它允许人们使用易读易写的纯文本格式编写文档，然后转换成格式丰富的HTML页面。    —— [维基百科](https://zh.wikipedia.org/wiki/Markdown)


##常用格式及快捷键
- **加粗文字** `Ctrl + B`
- *斜体文字* `Ctrl + I`
- [链接文字](http://bh-lay.com/) `Ctrl + L`
- 图片![暴漫](src/baoman.jpg) `Ctrl + G`
- `code`
- 代码块`Ctrl + K`：
``` javascript
/**
 * 检测是否为数字
 * 兼容字符类数字 '23'
 */
function isNum(ipt){
	return (ipt !== '') && (ipt == +ipt) ? true : false;
}
```

---------

##如何使用
###一、页面内放置待使用的文本域textarea，如：
```html
<textarea id="mditor">……</textarea>
```
###二、引入jQuery和mditor，并执行mditor的初始化，
 注：因为后续mditor会逐渐脱离对jQuery的依赖，请使用原生dom对象，而非jQuery对象。

```html
<script type="text/javascript" src="src/jquery.js"></script>
<script type="text/javascript" src="src/mditor.js"></script>
<script type="text/javascript">
  var ele_textarea = document.getElementByID('mditor');
  var editor = new mditor(ele_textarea);
</script>
```
##高级操作
实例化mditor时，可以传入自定义参数
```javascript
var editor = new mditor(document.getElementByID('mditor'),{
  //自定义html文本的class
  previewClass : 'article',
  //内容变动回调
  onchange : function(content){
    //……
  }
});
```

实例化后的mditor，可以通过javascript进行操作，如：
```javascript
//获取转换后的html
editor.getHtml();

//获取markdown格式内容
editor.getContent();

//进入预览界面
editor.preview();

//返回编辑界面
editor.edit();
```