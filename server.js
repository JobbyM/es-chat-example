// 定制的Server-Sent Events 聊天服务器
// 这个例子用的是服务器的JavaScript，运行在NodeJS 平台上
// 该聊天室的实现比较简单，而且是完全匿名的
// 将新的消息以POST 发送到/chat 地址，或者以GET 形式从同一个URL 获取消息的文本/事件流
// 创建一个GET 请求到“/” 来返回一个简单的HTML 文件
// 这个文件包括客户端聊天UI
var http = require("http"); // NodeJS HTTP 服务器API

// 聊天客户端使用的HTML 文件，在下面会用到
var clientui = require("fs").readFileSync("chatclient.html");
var emulation = require("fs").readFileSync("EventSourceEmulation.js");

// ServerResponse 对象数组，用于接收发送的事件
var clients = [];

// 每20 秒发送一条注释到客户端
// 这样它们就不会关闭连接再重连
setInterval(function(){
  clients.forEach(function(client){
    client.write(":ping?n")
  });
},20000);

// 创建一个新服务器
var server = new http.Server();

// 当服务器获取到一个新的请求，运行回调函数
server.on("request", function(request, response){
  // 解析请求的URL
  var url = require("url").parse(request.url);

  // 如果请求是发送的"/"，服务器就发送客户端聊天室UI
  if(url.pathname === "/"){ // 聊天客户端的UI 请求
    response.writeHead(200, {"Content-Type": "text/html"});
    response.write("<script>" + emulation + "</script>");
    response.write(clientui);
    response.end();
    return;
  }
  // 如果请求是发送到“/chat” 之外的地址，则返回404
  else if(url.pathname !== "/chat"){
    response.writeHead(404);
    response.end();
    return;
  }
  // 如果请求类型是post，那么就有一个客户端发送了一条新的消息
  if(request.method === "POST"){
    request.setEncoding("utf8");
    var body = "";

    // 在获取到数据之后，将其添加到请求主体中
    request.on("data", function(chunk){ body += chunk; });

    // 当请求完成时，发送一个空响应
    // 并将消息传播到所有处于监听状态的客户端中
    request.on("end", function(){
      response.writeHead(200); // 响应该请求
      response.end();

      // 将消息转换成文本/事件流格式
      // 确保每一行的前缀都是“data:”
      // 并以两个换行符结束
      message = "data: " + body.replace("\n", "\ndata: ") + "\r\n\r\n";
      // 发送消息给所有监听的客户端
      clients.forEach(function(client){ client.write(message); });
    });
  }
  // Otherwise, a client is requesting a  stream of messages
  else {
    // 如果不是POST 类型的请求，则客户端正在请求一组消息
    response.writeHead(200, {"Content-Type":"text/event-stream"});
    response.write("data: Connected\n\n");

    // 如果客户端关闭了连接
    // 从活动客户端数组中删除对应的响应对象
    request.connection.on("end", function(){
      clients.splice(clients.indexOf(response), 1);
      response.end();
    });

    // 记下响应对象，这样就可以向它发送未来的消息
    clients.push(response);
  }
});

// 启动服务器，监听8000 端口，访问http://location:8000/ 来进行使用它
server.listen(8000)
