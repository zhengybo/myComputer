/*
  *
    @仿我的电脑
  *
*/
'use strict'
function MyComputer(options){

  this.init(options);
}

MyComputer.prototype = {
  construct : MyComputer,

  init : function (options){
    this.initialFixParameters();
    this.initialParameters(options);//初始化可选参数
    this.initialEvent();//初始化事件
    this.start();//启动
  },

  start:function(){//运行逻辑
      this.backupsData =JSON.parse(JSON.stringify(this.originalData));//备份数据
      let dom = this.treeDom(this.backupsData,this.startObj);//生成dom片段
      this.maxId = this.backupsData.length;
      this.treeRoot.appendChild(dom);//初始化目录列表
      this.preFolder = this.curFolder = dom.querySelector('.childrenValue');//当前文件
      // this.historyFolder.push(this.curFolder)//初始化历史目录
      this.folder(this.curFolder);//初始化展示区域
      this.rightElem = Array.prototype.slice.call(this.showArea.querySelectorAll('.dataFrame'))
  },

//----------------初始化操作
  initialFixParameters : function(){//初始化固定参数
    this.rightElem = [];//右侧所有文件或文件夹
    this.selectFile = [];//存储选中文件或文件夹
    this.rightFlag = false;//是否有选中文件或文件夹
    this.historyFolder = [];//历史的文件夹
    this.nextFolder = [];//前进栈中文件堆放
    this.preFolder = null;//前一个文件夹
    this.curFolder = null;//当前文件夹索引
    this.curFolderInner = [];//保存当前文件夹里面的文件或文件夹
    this.curFolderInnerNames = [];//保存当前文件夹里面文件文件夹名字
    this.parent = null;//当前文件或文件夹的父级
    this.historyAct = false;//是否是历史点击操作
    this.originalData = null;//原始请求过来的数据
    this.backupsData = null;//备份数据用于生成文件目录
    this.keyRightX = 0;//右键x坐标
    this.keyRightY = 0;//右键y坐标
    this.curMeauTarget = null;//当前右键菜单操作的对象
    this.lastId = 0; //最后文件的id
    this.right_left = {};//保存左边的引用
    this.maxId = 0;
    this.height = document.documentElement.clientHeight - document.querySelector('#gride').offsetHeight;
  },

  initialParameters : function(options){//初始化参数
    options || (options = {});
    this.originalData = options.data;//获取数据源
    this.startObj = options.startObj;
    this.treeRoot = options.treeRoot || this.getId('tree');//根目录节点节点
    this.window = options.treeRoot || this.getId('window');
    this.window.style.height = this.height + 'px';
    this.showArea = options.showArea || this.getId('fileFolderShow'); //显示区域
    this.back = options.back || this.getId('backPre');//返回上级
    this.pre = options.pre || this.getId('formNext');//前进记录
    this.newFile = options.newFile || this.getId('newFile');//打开文件
    this.newFolder = options.newFolder || this.getId('newFolder');//打开文件夹
    this.meauOpen = options.newFolder || this.getId('openFolder');//打开
    this.delete = options.newFolder || this.getId('delete');//删除
    this.newName = options.newFolder || this.getId('newName');//重命名
    this.attribute = options.newFolder || this.getId('attribute');//重命名
    this.meau = options.newFolder || this.getId('meau');//右键菜单
    this.gride = options.gride || this.getId('gride');//导航栏
    this.move = options.move || this.getId('move');
    this.windowCatalog = options.windowCatalog || this.getId('windowCatalog');
    this.windowContent = options.windowContent || this.getId('windowContent');
    this.floderNameClass = options.floderNameClass || 'titleName';
    this.telescopicClass = options.telescopicClass || 'telescopic';


    this.floderDom = this.changeDom('<div class="childrenNode"  type="folder"><div class="title"><span class="telescopic"></span><span class="titleName">新建文件夹</span></div><div class="childrenValue" style="display: block;"></div></div>');
    this.fileDom = this.changeDom('<div class="childrenNode grandsonNode" type="file">第二级别2-1</div>');
  },

  initialEvent : function(){//初始化事件
    this.handleTree();//注册目录左键点击事件
    this.handleShow();//注册展示左键区域事件
    this.backClick();//注册返回事件
    this.nextClick();//注册前进事件
    this.meauClick();//注册菜单栏事件
    this.rightKeyClick();//注册右键事件
    this.newNameBlur();//注册失去焦点事件
    this.movePosition();//注册窗口拖动事件
  },

  getResult : function(){//获取 操作的结果
    return JSON.parse(JSON.stringify(this.originalData));
  },

//-----------------一些逻辑处理

  handleTree : function(){//初始化目录事件
    this.addEvent(this.treeRoot,'click',(event) =>{
      let e = event || window.event;
      let target = e.target || e.srcElement;
      target.className.split(" ").forEach((value) => {
        (value == 'telescopic') && this.telescopic(target);
        (value == 'grandsonNode') && this.openFile(target);
        if(value == 'titleName'){
          this.curFolder = this.getNextSibling(target.parentNode);//当前文件
          if(this.preFolder == this.curFolder)return;//点击同一个目录不做操作
          this.preFolder = this.curFolder;//记录为历史目录
          this.nextFolder = [];//清空前进栈
          this.folder(this.curFolder);//展现文件
        }
        // (value == 'titleName') && this.folder(this.getNextSibling(target.parentNode));
      })
    })
  },



  handleShow : function(){//初始化展示区域事件
    //单机时候
    this.addEvent(this.showArea,'click',(event) =>{
      let e = event || window.event,
          target = e.target || e.srcElement,
          className = target.parentNode.className,
          check = className.indexOf("dataFrame");//若果是文件
      if(~ check){
        this.fileItem(target.parentNode);
        return;
      }
      if(this.rightFlag){//如果存在选中 的 元素
        this.rightFlag=false;//此时未选择
        this.removesClass(this.selectFile,'active');//移除选中元素
        this.selectFile=[];//清空选中数组
      }
    })

    //双击的时候
    this.addEvent(this.showArea,'dblclick',(event) =>{
      let e = event || window.event,
          target = (e.target || e.srcElement).parentNode,
          className = target.className,
          checkFile = className.indexOf("file-item"),//如果是文件
          checkFolder = className.indexOf("folder-item");//如果文件夹
      if(~checkFile){
        console.log("打开文件:" + target.getAttribute('name'));
      }
      (~checkFolder)&&this.openFolder(target);
      // if(~checkFolder){
      //   this.openFolder(target);//打开指定文件值
      //   this.nextFolder = [];//清空前进栈
      // }
    })
  },

  newNameBlur(){
    this.addEvent(this.showArea,'blur',(event) =>{
      let e = event || window.event,
          target = e.target || e.srcElement;
      this._newName_blur(target)
    },true);
  },

  rightKeyClick : function(){//右键事件
    this.addEvent(this.treeRoot,'contextmenu',(event) =>{//目录栏右击处理
      let e = event || window.event,
          target = e.target || e.srcElement;
      e.preventDefault();
      let x= e.clientX,y=e.clientY;
      // target.className.split(" ").forEach((value) => {
      //   // (value == 'grandsonNode') && console.log('右键文件');
      //   if(value == 'titleName'){
      //     console.log('右键文件夹');
      //     this.curMeauTarget = target.parentNode;
      //     this.setXY(this.meau,x,y);
      //     this.show(this.meau,true);
      //   }
      //
      //   if(value == 'grandsonNode'){
      //     console.log('右键文件');
      //     this.curMeauTarget = target;
      //     this.setXY(this.meau,x,y);
      //     this.show(this.meau,true);
      //   }
      //   // (value == 'titleName') && this.folder(this.getNextSibling(target.parentNode));
      // })
    })


    this.addEvent(this.showArea,'contextmenu',(event) =>{//展示区域右键菜单
      let e = event || window.event,
          x= e.clientX,y=e.clientY,
          target = e.target || e.srcElement,
          className = target.parentNode.className,
          check = className.indexOf("dataFrame");//若果是文件
      this.curMeauTarget = (~check)?target.parentNode:this.curFolder;//获取目标对象
      if(~check){//如果是文件
        let flag = this.selectFile.some(value => value == this.curMeauTarget);
        !flag && this.fileItem(this.curMeauTarget);
      }else if(this.rightFlag){//如果存在选中 的 元素
        this.rightFlag=false;//此时未选择
        this.removesClass(this.selectFile,'active');//移除选中元素
        this.selectFile=[];//清空选中数组
      }
      this.setMeau(this.curMeauTarget);
      this.show(this.meau,true);
      this.setXY(this.meau,x,y);

    });

    this.addEvent(document.body,'contextmenu',(event) => {//阻止右键默认
      let e = event || window.event;
      e.preventDefault();
    });

  },

  meauClick : function(target){//菜单栏事件处理
    this.addEvent(this.meau,'click',(event) =>{//点击
      let e = event || window.event,
          target = e.target || e.srcElement,
          id = target.getAttribute('id');
      (id == 'openFolder') && this.open(this.curMeauTarget);//打开
      (id == 'newFolder') && this.newFileFolder(this.curMeauTarget,'folder');
      (id == 'newFile') && this.newFileFolder(this.curMeauTarget,'file');//文件
      (id == 'attribute') && this._attribute(this.curMeauTarget);//属性
      (id == 'delete') && this._delete(this.curMeauTarget);//删除
      (id == 'newName') && this._newName_focus(this.curMeauTarget);//重命名

    });

    this.addEvent(document.body,'click',(event) =>{
      let e = event || window.event;
      this.show(this.meau,false);
    });
  },

  newFileFolder : function(target,type){//新建文件或文件夹位置、类型
    let title = (type == 'file')?"新建文件":"新建文件夹",
        k = 1,
        curNames= this.curFolderInnerNames,
        newF = curNames.some( value => value==title);
    if(newF){//用于查找是否重复命名
      while(k){
        let check =this.curFolderInnerNames.some( value => value==(title+"("+k+")"));
        if(!check){
          title += "("+k+")";
          break;
        }
        k++;
      }
    }
    this.maxId++;
    let dom = '<div type="'+type+'" id="'+this.maxId+'" name="'+title+'" class="'+type+'-item dataFrame"><div class="data-icon"></div><div class="dataName">'+title+'</div><textarea class="newName"></textarea></div>';

    this.addData(this.maxId,type,title);//添加到数据
    let Fragment = document.createElement('div');//转化为dom---
    Fragment.innerHTML = dom;
    let newFile = this.getChildNodes(Fragment)[0];
    this.showArea.appendChild(newFile);//加入右侧显示
    this.rightElem.push(newFile);//保存右侧引用
    this.curFolderInnerNames.push(title);//保存名字
    let newDom = (type == 'file') ? this.fileDom.cloneNode(true) : this.floderDom.cloneNode(true);//---
    newDom.setAttribute('id',this.maxId);//设置id
    (type == 'file')?(newDom.innerHTML=title)
        :(newDom.querySelector('.titleName').innerHTML = title)
    this.curFolderInner.push(newDom);//保存左边名字
    this.curFolder.appendChild(newDom);//加入目录
    this.right_left[this.maxId] = newDom;//加入引用
  },

  _delete : function(target){//删除文件或文件夹
      this.selectFile.forEach((value) => {//删除左边右边数据
        let id = value.getAttribute('id')
        this.right_left[id].remove();//移除左右关联
        value.remove();//移除元素
        this.deleteData(this.originalData,id,0);//删除数据
        this.originalData = this.originalData.filter(value => value != undefined)//过滤出剩余数据
      });
      this.curFolderInner = this.getChildNodes(this.curFolder);//保存子文件
      this.getCurNames();
  },

  _newName_focus : function(target){//重命名
    let newName = target.querySelector('.newName'),
        dataName = target.querySelector('.dataName');
    this.show(newName,true);
    this.show(dataName,false);
    newName.focus();
  },

  _newName_blur : function(target){//命名完成
    let title = target.parentNode.querySelector('.dataName'),//标题元素
        store=this.curFolderInnerNames.some(value => value == target.value.trim());//是否存在重复标题
    if(store){//存在
      alert('该名字存在,修改失败');
      target.value = title.innerHTML;
      this.show(title,true,'-webkit-box');
      this.show(target,false);
      return;
    }
    let flag = title.innerHTML == target.value.trim();//修改前后名字一样
    !flag && (target.value = title.innerHTML= target.value.trim());
    this.show(title,true,'-webkit-box');
    this.show(target,false);
    if(flag)return;
    console.log('开始修改数据');
    let id =target.parentNode.getAttribute('id');//根据id 修改数据
    for(let i = 0,data = this.originalData,len=data.length;i < len;i++){
      if(data[i].id == id){
        data[i].name =  title.innerHTML;
        console.log('修改数据成功');
        break;
      }
    }
  },

  _attribute : function(target){//属性操作
    console.log('查看',target,'属性');
  },

  open : function(target){//打开文件或文件夹
    console.log("打开");
    (target.getAttribute('type') == 'file') && this.openFile(target);
    (target.getAttribute('type') == 'folder') && this.openFolder(target);
  },

  getCurNames : function(){//获取当前文件名字
    this.curFolderInnerNames = [];
    this.curFolderInner.forEach(value => {//遍历元素
      let type =value.getAttribute('type');
      if(type == 'file'){
        this.curFolderInnerNames.push(value.innerHTML);
      }else{
        this.curFolderInnerNames.push(value.querySelector('.titleName').innerHTML);
      }
    })
  },

  backClick : function(){//上一步处理函数
    this.addEvent(this.back,'click',(event) =>{
      let e = event || window.event;
      event.stopPropagation();
      if(this.historyFolder.length == 1){//历史记录长度为1时
        return;
      }
      this.historyAct = true;//历史标记激活
      this.nextFolder.push(this.historyFolder.pop());//存入前进栈
      let len =this.historyFolder.length;
      this.curFolder = this.historyFolder[len-1];//更新当前目录
      this.preFolder = this.historyFolder[len-2];//更新历史目录
      this.folder(this.curFolder);//返回历史目录
      this.historyAct = false;//关闭历史标记
      // this.historyClick(this.historyFolder.pop());
    });
  },

  nextClick : function(){//下一步处理函数
    this.addEvent(this.pre,'click',(event) => {
      let e = event || window.event;
      event.stopPropagation();
      if(!this.nextFolder.length){//没有前进一步信息
        return;
      }
      this.historyAct = true;
      let next = this.nextFolder.pop();
      this.historyFolder.push(next);
      // console.log(this.historyFolder.pop());
      this.folder(next);//返回历史目录
      this.historyAct = false;//关闭历史标记
      // this.historyClick(this.historyFolder.pop());
    })
  },

  movePosition : function(){//移动事件
    let windowCatalog = this.windowCatalog,//目录
        winW = document.documentElement.clientWidth,
        windowContent = this.windowContent,//展示区
        startWidth = 250;
    windowCatalog.style.width = 250 + 'px';
    this.addEvent(this.move,'mousedown',(event) => {
      let e = event || window.event,
          fixX = e.clientX,
          fixY = e.clientY;
      document.onmousemove = (event) =>{
        let e = event || window.event,
            x = 0;
        if(e.clientX > winW-120){
          x = winW-120;
        }else if(e.clientX < 150){
          x = 150;
        }else{
          x = e.clientX
        }
        let offsetX = fixX - x;
        windowCatalog.style.width =startWidth - offsetX  +'px';
        windowContent.style.marginLeft =startWidth - offsetX +5 + "px"
      }
    });

    this.addEvent(document,'mouseup',(event) => {
      startWidth = parseInt(windowCatalog.style.width);
      document.onmousemove =null;

    });
  },
//-----------------事件处理函数

  changeDom : function(str){
    let div = document.createElement('div');
    div.innerHTML = str;
    return this.getChildNodes(div)[0];
  },
  telescopic : function(target){//伸缩处理
    var targetNode = this.getNextSibling(target.parentNode);
    let show,img;
    if(targetNode.style.display == 'none'){
      show = 'block';
      img = './hide.png';
    }else{
      show = 'none';
      img = './show.png';
    }
    targetNode.style.display = show;
    target.style.backgroundImage = 'url('+img+')';
  },

  addData : function(id,type,name){//添加到源数据
    let parent = this.curFolder.parentNode.getAttribute('id'),
        data = {
          parent : parent,
          id : id,
          name :name
        };
    this.originalData.push(data);
  },

  deleteData : function(data,id,k){//删除id父节点下的数据
    data.forEach((value,index) => {
      if(value.parent == id){
        delete data[index];
        this.deleteData.call(this,data,value.id,k++);
      }
      !k && (value.id == id) && delete data[index];
    })
    return data;
  },

  folder : function(target){//文件夹处理
    let html = '',
        className = '',
        id = null,
        title = '',
        slef = null;//自身索引

    this.setPath(target.parentNode);
    this.curFolderInner = this.getChildNodes(target);//保存子文件
    this.getCurNames();//获取名字
    !this.historyAct&&this.historyFolder.push(target);//是否历史操作对应处理
    this.curFolderInner.forEach((value) => {
      var check = this.hasClass(value,'grandsonNode');
      id = value.getAttribute('id');
      className = check?'file':'folder';
      title = check?value.innerHTML:
              value.querySelector('.titleName').innerHTML;
      this.right_left[id] = value;
      html += '<div type="'+className+'" id="'+id+'" name="'+title+'" class="'+className+'-item dataFrame"><div class="data-icon"></div><div class="dataName">'+title+'</div><textarea class="newName">'+title+'</textarea></div>';
    });
    this.showArea.innerHTML=html;
    this.rightElem = Array.prototype.slice.call(this.showArea.querySelectorAll('.dataFrame'));
  },

  openFolder : function(target){//双击打开文件夹
    this.nextFolder = [];
    let leftTarget=this.right_left[target.getAttribute('id')];
    this.curFolder = leftTarget.querySelector('.childrenValue');
    this.folder(this.curFolder);
  },

  openFile : function(target){//打开文件
    console.log('打开文件:',target);

  },

  setMeau : function(target){//设置目录选项
    let isValue=this.hasClass(target,'childrenValue')
    this.show([this.newFile,this.newFolder],isValue);
    this.show([this.delete,this.meauOpen,this.newName],!isValue);
  },

  setXY : function(target,x,y){//设置菜单位置
    let isValue=this.hasClass(target,'childrenValue'),
        wH = document.documentElement.clientHeight,
        wW = document.documentElement.clientWidth,
        mW= this.meau.offsetWidth,//菜单宽度
        mH = this.meau.offsetHeight,
        offsetX = (mW + x > wW) ? (x - mW) : x,
        offsetY = (mH + y > wH) ? (y - mH) : y;
        target.style.left = offsetX+"px";
        target.style.top = offsetY+"px"
  },


  setPath :function(target){//设置路劲
    let path =[];
    while(this.hasClass(target.parentNode,'childrenValue')){//获取路劲组
      let nodePath = target.querySelector('.titleName').innerHTML;
      path.push(nodePath);
      target = target.parentNode.parentNode;
    }
    path = path.reverse().join('\\');
    this.gride.querySelector('.formName').innerHTML = '\\' + path;
  },


  fileItem : function(target){//右边文件点击处理
    this.rightFlag = true;//存在选中
    // this.selectFile = [target];//保存选中引用
    if(window.event.ctrlKey){//按下ctrl
      //如果不在选中的 引用中
      let flag = this.selectFile.some(value => value == target);//点击已选文件
      if(flag){//点击已选文件
        this.selectFile = this.selectFile.filter(value => value != target);//过滤其他元素
        this.removeClass(target,'active');//移除自身样式
      }else{
        this.selectFile.push(target);//放入选中组
        this.addClass(target,'active');//添加自身样式
      }
    }else{//未按下ctrl
      this.removesClass(this.selectFile,'active');
      this.selectFile = [target];//
      this.addClass(target,'active');
    }
  },



  historyClick : function(target){
    this.folder(target);//返回历史目录
    this.historyAct = false;//关闭历史标记
  },

  //------------------功能部分函数
  treeData : function (arr,id,k){//解析数据
    var children = [];
    arr.forEach((value,index) => {
      if(id == value.parent){
        value.children = this.treeData.call(this,arr,value.id,k+1);
        children.push(value);
      }
    });
    if(!k){
      let clone = JSON.parse(JSON.stringify(arr[0]));
      clone.children = children;
      return clone;
    }
    return children;
  },

  inverseTree : function(data){//反解析
    let arr = [],counts = 0;//
    var inverseInner = function(data,k,key){//数据、第几组、属性值
      if(Array.isArray(data)){
        data.forEach((data,index) =>{
          this.inverseTree.call(this,data,counts)
        })
        return;
      }

      if(typeof data == 'object'){
        (!arr[counts]) && arr.push({});
        counts++;
        for (let attr in data) {
          this.inverseTree.call(this,data[attr],counts,attr)
        }
        return;
      }
      arr[k - 1][key] = data;
    }
    inverseInner(data);
    return arr;
  },
  //创造元素 元素class 元素 值
  createElement : function(elem,className,value){
    let childrenValue = document.createElement(elem),
        name = className.join(" ");
    childrenValue.setAttribute("class",name);
    switch (typeof value) {
      case 'object'://如果是dom
      {
        childrenValue.appendChild(value);
        break;
      }
      case 'undefined':
        break;
      default:{//其他
        childrenValue.innerHTML = value;
      }
    }
    return childrenValue;
  },

  creatTit : function(value){//创建标题
    let title = this.createElement('div',['title']),
        Telescopic = this.createElement('span',['telescopic']),//折叠处
        // titleIcon = createElement('i',['titleIcon']),//标题图标
        titleName = this.createElement('span',['titleName'],value);//标题名字

    // title.appendChild(titleIcon);
    title.appendChild(Telescopic);
    title.appendChild(titleName);

    return title;
  },

  treeDom : function(data,obj){//数据、第几组、属性值
    let childrenNode = this.createElement('div',['childrenNode']),//节点
        childrenValue = this.createElement('div',['childrenValue']),//节点值
        title = this.creatTit(obj.name);//节点标题
    childrenNode.setAttribute('id',obj.id);//设置节点id值
    childrenNode.appendChild(title);
    // let checkNode = false;//检查是否是node节点
    data.forEach((value,index) => {
      if(obj.id == value.parent){
        // checkNode = true;
        delete data[index];
        childrenValue.appendChild(this.treeDom.call(this,data,value));
      }
    });
    childrenNode.appendChild(childrenValue);
    if(obj.type == 'file'){//如果是文件
      childrenNode.innerHTML = obj.name;
      childrenNode.className += " grandsonNode";
      childrenNode.setAttribute('type','file');
    }else{
      childrenNode.setAttribute('type','folder');
    }
    return childrenNode;
  },

  getNextSibling : function(startNode){//获取下个节点
    let endNode=startNode.nextSibling;
    while(endNode.nodeType != 1){
      endNode = endNode.nextSibling;
    }
    return endNode;
  },

  getId : function(id){
    return document.getElementById(id);
  },

  removesClass : function(elems,className){//移除一组类
    for(let i = 0,len = elems.length;i < len;i++){
      this.removeClass(this.selectFile[i],className);
    }
  },

  removeClass : function(elem,className){//移除类
    elem.className = elem.className.replace(className,'');
  },

  addClass : function(elem,className){//添加类
    if(this.hasClass(elem,className)) return;
    elem.className =elem.className.trim()  + " " +className;
  },

  hasClass : function(elem,className){
    return ~ elem.className.indexOf(className) ? true : false;
  },

  getChildNodes : function(elem){//获取子元素
    let childArr = elem.children || elem.childNodes,
        childArrTem = [];
    for(let i = 0,len = childArr.length;i < len;i++){
        (childArr[i].nodeType == 1) && childArrTem.push(childArr[i])
    }
    return childArrTem;
  },

  show : function(elem,flag,type){
    let _static =type || (flag ? "block" : "none");
    if(Array.isArray(elem)){
      elem.forEach((value) =>{
        value.style.display = _static;
      })
      return;
    }
    elem.style.display = _static ;
  },

  addEvent : function(elem, evType, fn , useCapture) {//添加事件
    if(!elem.addEventListener){
      alert('兄弟，升级下浏览器吧！');
      return;
    }
    elem.addEventListener(evType, fn, useCapture);
  }
}


// export.MyComputer = MyComputer;
