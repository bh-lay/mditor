欢迎使用Mditor
======
Mditor是一款轻量级的markdown编辑器。取名自markdown + editor，用于实现页面markdown输入框的便利操作。

## 查看演示
[http://bh-lay.github.io/mditor/](http://bh-lay.github.io/mditor/)

## 常用格式及快捷键
- **加粗文字** `Ctrl + B`
- *斜体文字* `Ctrl + I`
- [链接文字](http://bh-lay.com/) `Ctrl + L`
- 图片![暴漫](src/images/baoman.jpg) `Ctrl + G`
- `code` `Ctrl + Shift + K`
- 代码块 `Ctrl + K`：
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


## 如何使用

### 第一步、页面内放置待使用的文本域textarea
```html
<textarea id="md_editor">……</textarea>
```
### 第二步、引入jQuery和Mditor，并初始化，
 注：因为后续Mditor会逐渐脱离对jQuery的依赖，参数请使用原生dom对象，而非jQuery对象。

```html
<script type="text/javascript" src="src/jquery.js"></script>
<script type="text/javascript" src="src/mditor.js"></script>
<script type="text/javascript">
  //获取textarea dom对象
  var ele_textarea = document.getElementById('md_editor');
  //实例化Mditor
  var editor = new mditor(ele_textarea);
</script>
```
## 高级操作
为了保证编辑、发布的显示效果一致，需要按照对应站点文章样式的css来展示编辑时的效果，默认显示效果class为`article`，可参照下面定义方式更改类名。

### 一、实例化Mditor时，可以传入自定义参数
```javascript
var editor = new mditor(document.getElementById('md_editor'),{
  //自定义显示效果class
  previewClass : 'article'
});
```

### 二、可以通过javascript对实例化后的Mditor进行操作，如：
```javascript
//获取转换后的html
editor.getHtml();

//获取markdown格式内容
editor.getContent();

//插入内容
editor.insert('**挤啊挤**')

//进入预览界面
editor.preview();

//返回编辑界面
editor.edit();
```
