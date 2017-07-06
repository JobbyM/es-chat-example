# es-chat-example
一个使用EventSource 的简易聊天客户端

## 系统依赖
* Node（>=7.9.0）
* npm（>=4.2.0）

## 开发环境准备
第一步，克隆项目到本地
```
$ git clone https://github.com/JobbyM/es-chat-example.git
```

第二步，进入项目，并安装项目依赖
```
$ cd es-chat-example
$ npm install
```

第三步，启动服务
```
$ npm start
```

第四步，浏览器方法：http://localhost:8000

## 代码分析
### chatclient.html
一个使用EventSource 的简易聊天客户端

### EventSourceEmulation.js
用XMLHttpRequest 模拟EventSource

### server.js
定制的Server-Sent Events 聊天服务器

当一个客户端请求根URL“/” 时，它会把chatclient.html 和EventSourceEmulation.js 发送到客户端。
当客户端创建了一个指向URL“/chat” 的GET 请求时，它会用一个数组来保存响应数据流并保持连接处于打开状态。
当客户端发起针对“chat” POST 请求时，它会将响应的主体部分作为一条聊天消息使用并写入数据，以“chat:”作为Server-Sent Events 的前缀，添加到每个已打开的响应数据流上。

# LICENSE
MIT
