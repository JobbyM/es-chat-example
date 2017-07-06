// 用XMLHttpRequest 模拟EventSource
// 在不支持EventSource API 的浏览器里进行模拟
// 需要有一个XMLHttpRequest 对象在新数据写到长期存在的HTTP 连接中时发送readystatechange 事件
// 注意，这个API 的实现是不完整的
// 它不支持readyState 属性、close() 方法、open 和error 事件
// 消息事件也是通过onmessage 属性注册的--这个版本还没有定义addEventListener() 方法

if(window.EventSource === undefined){       // 如果未定EventSource 对象
  window.EventSource = function(url){       // 像这样进行模拟
    var xhr;                    // HTTP 连接器
    var evtsrc = this;          // 在事件处理程序用到
    var charsReceived = 0;      // 这样我们就可以知道什么是新的
    var type = null;            // 检查属性响应类型
    var data = "";              // 存放消息数据
    var eventName = "message";  // 事件对象的类型字段
    var lastEventId = "";       // 用于和服务器再次同步
    var retrydelay = 1000;      // 在多个连接请求之间设置延迟
    var aborted = false;        // 设置为true 表示放弃连接器

    // 创建一个XHR 对象
    xhr = new XMLHttpRequest();

    // 定义一个事件处理程序
    xhr.onreadystatechange = function(){
      switch(xhr.readyState){
        case 3: processData(); break; // 当数据块到达时
        case 4: reconnect(); break;   // 当请求关闭的时候
      }
    }
    // 通过connect() 创建一个长期存在的连接
    connect();

    // 如果连接正常关闭，等待1 秒钟再尝试链接
    function reconnect(){
      if(aborted) return;             // 在终止连接后不进行重连操作
      if(xhr.status >= 300 ) return;  // 在报错之后不进行重连操作
      setTimeout(connect, retrydelay);// 等待1 秒后进行重连
    }

    // 这里的代码展示了如何建立一个连接
    function connect(){
      charsReceived = 0;
      type = null;
      xhr.open("GET", url);
      xhr.setRequestHeader("Cache-Control", "no-cache");
      if(lastEventId) xhr.setRequestHeader("Last-Event-ID", lastEventId);
      xhr.send(null);
    }

    // 每当数据到达的时候，会处理并触发onmessage 处理程序
    // 这个函数处理Server-Side Events 协议的细节
    function processData(){
      if(!type){  // 如果没有准备好，先检查响应类型
        type = xhr.getResponseHeader("Content-Type");
        if(type !== "text/event-stream"){
          aborted = true;
          xhr.abort();
          return;
        }
      }

      // 记录接收的数据
      // 获得响应中未处理的数据
      var chunk = xhr.responseText.substring(charsReceived);
      charsReceived = xhr.responseText.length;

      // 将大块的文本数据分成多行并遍历它们
      var lines = chunk.replace(/(\n\r|\r|\n)$/,"").split(/\n\r|\r|\n/);
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i], pos = line.indexOf(":"), name, value = "";
        if(pos === 0) continue;         // 忽略注释
        if(pos > 0){                    // 字段名称：值
          name = line.substring(0, pos);
          value = line.substring(pos+1);
          if(value.charAt(0) == " ") value = value.substring(1);
        }else{
          name = line;                  // 只有字段名称
        }

        switch(name){
          case "event": eventName = value; break;
          case "data": data += value + "\n"; break;
          case "id": lastEventId = value; break;
          case "retry": retrydelay = parseInt(value) || 1000; break;
          default: break; // 忽略其他行
        }

        if(line === ""){ // 一个空行意味着发送事件
          if(evtsrc.onmessage && data !== ""){
            // 如果末尾有新行，就裁剪新行
            if(data.charAt(data.length - 1) == "\n")
              data = data.substring(0, data.length - 1);
            evtsrc.onmessage({  // 这里是一个伪造的事件对象
              type: eventName,  // 事件类型
              data: data,       // 事件数据
              origin: url       // 数据源
            });
          }
          data = "";
          continue;
        }

      }
    }

  }
}
