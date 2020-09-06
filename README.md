# websocket-mg
对 WebSocket对象 进行封装处理，为 `web浏览器端` 提供了方便实际业务中使用、开箱即用的 websocket 通信消息管理功能

## 安装
```
npm install websocket-mg --save
import WebSocketMG from 'websocket-mg'

or

<script src="../dist/websocket-mg.min.js"></script>
new WebSocketMG('ws://...')
```

## 使用
```
import WebSocketMG from 'websocket-mg'

let ws = new WebSocketMG('ws://127.0.0.1:8080')

ws.onopen(() => {
  console.log('ws open')
})

ws.onerror(() => {
  console.log('ws error')
})

ws.onclose(() => {
  console.log('ws close')
})

ws.open()

let id = ws.onmsg('test_name', res => {
  console.log('test_name消息类型的数据：', res)
})

ws.off(id)
```

## API

### ws.open()
@param {function} cb `开启完成后执行回调`  

开启WebSocket连接   

```
ws.open(res => {
  res.status // true || false 开启后的成功或失败的状态
  res.event // onopen 或 onerror 的原参数
})
```

### ws.close()
关闭WebSocket连接   

### ws.send()
@param {string} msgType `消息类型（与接收端自行约定）`  
@param {string|number|array|object} params `发送的数据`  
@param {function} cb `发送后的回调`  

发送WebSocket通信消息，实际发送出的消息格式： `{ type: msgType, data: params }`    
如果在发送的时候WebSocke是没有连接的状态，那将会先去连接后发送
```
ws.send('msg_type', { name: 'edd' }, res => {
  res.status // true || false 发送后的成功或失败的状态
})
```

### ws.onmsg()
@param {string} msgType `消息类型（与接收端自行约定）`   
@param {function} cb `接收后的回调`   
@returns {string} id `此订阅消息的ID`   

订阅WebSocket通信消息，实际`需`接收的消息格式： `{ type: msgType, data: data }`
```
let id = ws.onmsg('test_name', res => {
  res // test_name消息类型的数据
})
id // "1599300520550_70992"
```

### ws.off()
@param {string} id `订阅消息的ID` 

取消订阅消息   

```
ws.off('1599300520550_70992')
```

### ws.offAll()

取消所有订阅消息   

### ws.onmessage()
@param {function} cb `回调函数`

onmessagen 原始监听回调 

### ws.onopen()
@param {function} cb `回调函数`

onopen 原始监听回调 

### ws.onclose()
@param {function} cb `回调函数`

onclose 原始监听回调 

### ws.onerror()
@param {function} cb `回调函数`

onerror 原始监听回调 
