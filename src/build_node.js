var fs = require('fs');

function getStyleSheet(src){
	var cssStr = fs.readFileSync(src,'UTF-8')
	
	//过滤注释
	var txt = cssStr.replace(/\/\*.*?\*\//g,'');
	//过滤换行
	var txt = txt.replace(/\r|\n/g,'');
	//过滤连续空格
	txt = txt.replace(/\s+/g,' ');
	//过滤不必要的空格
	txt = txt.replace(/\s*({|}|;|:)\s*/g,'$1');
	
	return txt;
}

function getJS(src){
	var JsStr = fs.readFileSync(src,'UTF-8');
	JsStr_match = JsStr.match(/define\(((?:.|\n|\r)+)\)/);
	
	return JsStr_match[1];
}

function getTemplate(src){
	var tmp = fs.readFileSync(src,'UTF-8')
	//过滤换行
	var tmp = tmp.replace(/\r|\n/g,'');
	//过滤连续空格
	tmp = tmp.replace(/\s+/g,' ');
	//过滤标签间的空格
	tmp = tmp.replace(/\>\s+\</g,'><');
	tmp = "'" + tmp + "'";
	return tmp;
}



function checkMainFiles(src){
	var str = fs.readFileSync(src,'UTF-8');
	str = str.replace(/requires\(((?:\,|\s|\w|\.|\/|\'|\")+)\)/g,function(a,b){
		//过滤无意义的空格
		b = b.replace(/\s*\,\s*/g,',');
		//过滤引号
		b = b.replace(/\'|\"/g,'');
		
		//获取参数
		var args = b.split(/\,/g);
		
		console.log('find require',args);
		
		//判断资源类型
		if(args[0].match(/\.css$/)){
			console.log('loading and min css\n');
			return "'" + getStyleSheet(args[0]) + "'";
		}else if(args[0].match(/\.js$/)){
			console.log('loading js\n');
			return getJS(args[0]);
		}else if(args[0].match(/\.html$/)){
			console.log('loading template\n');
			return getTemplate(args[0]);
		}else if(args[0] == 'Date'){
			var date = new Date();
			return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + ' ' + date.getHours() + ':' + date.getMinutes();
		}
	});
	
	console.log('build content over\n');
	return str;
}

function write(src,str){
	fs.writeFileSync(src,str);
}
//var txt = getStyleSheet('style.css','UI');
//var txt = getJS('utils.js');
//
//
function build(type,filename){
	if(filename == 'mditor.js'){
		return
	}
	var newContent = checkMainFiles('index.js');
	write('mditor.js',newContent);
	console.log('successful!\n');
}
fs.watch('./',build);
fs.watch('./template/',build);
fs.watch('./css/',build);
fs.watch('./js/',build);