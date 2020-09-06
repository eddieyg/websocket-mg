/**
 * WebSocket消息通信管理
 */

class WebSocketMG {

  /**
   * @param {string} url ws连接路径
   */
  constructor(url) {
    this.url = url
    this.ws = null
    this.wsCB = { // ws事件回调函数
      onmessage: null,
      onopen: null,
      onclose: null,
      onerror: null,
      connecting: [], // 在open开启后到完成之间，去重复调用open函数传的回调；在完成之后去执行并清空
    }
    this.isOpen = false // ws当前是否已连接
    this.isConnecting = false // ws当前是否正在连接
    this.subscribe = {} // ws.onmessage对应消息类型的 订阅者回调
    this.catalog = {} // 订阅者ID 对应的消息类型 可查询目录
  }

  /**
   * 开启WebSocket连接
   * @param {function} cb 开启完成后执行回调（成功onopen 失败onerror）
   */
  open(cb) {
    const that = this
    const subscribe = that.subscribe
    let isInit = true
    let initFunc = res => {  // 初始化，只执行一次
      if (isInit) {
        isInit = false
        that.isConnecting = false
        typeof cb === 'function' && cb(res)
        let connTotal = that.wsCB.connecting.length
        let connIndex = 0
        while(connIndex < connTotal) {
          let func = that.wsCB.connecting[connIndex]
          if (typeof func === 'function') func(res)
          connIndex++
        }
        that.wsCB.connecting = []
      }
    }

    that.isConnecting = true
    that.ws = new WebSocket(that.url)
    that.ws.onopen = function(event) {
      that.isOpen = true
      that.wsCB.onopen && that.wsCB.onopen(event)
      initFunc({
        status: true,
        event
      })
    }
    that.ws.onclose = function(event) {
      that.isOpen = false
      that.wsCB.onopen && that.wsCB.onclose(event)
    }
    that.ws.onerror = function(event) {
      that.isOpen = false
      that.wsCB.onopen && that.wsCB.onerror(event)
      initFunc({
        status: false,
        event
      })
    }
    that.ws.onmessage = function(event) {
      that.wsCB.onmessage && that.wsCB.onmessage(event)
      if (typeof event.data == 'string') {
        let res
        try {
          res = JSON.parse(event.data)
        } catch(e) {}
        if (
          res && 
          res.type && 
          subscribe[res.type] &&
          subscribe[res.type].length
        ) {
          let total = subscribe[res.type].length
          let index = 0
          while(index < total) {
            let sub = subscribe[res.type][index]
            if (typeof sub.cb === 'function') sub.cb(res.data)
            index++
          }
        }
      }
    }
  }

  /**
   * 关闭WebSocket连接
   */
  close() {
    this.isOpen && this.ws.close()
  }

  /**
   * 发送WebSocket通信消息
   * 发送消息格式：
   *  {
   *    type: 'update_some',
   *    data: {}
   *  }
   * @param {string} msgType 消息类型（与接收端自行约定）
   * @param {string|number|array|object} params 发送的数据
   * @param {function} cb 发送后的回调
   */
  send(msgType, params, cb) {
    const that = this
    if (typeof msgType !== 'string') {
      that.consoleError('send', 'first parameter not a string')
      return
    }
    let body = JSON.stringify({
      type: msgType,
      data: params
    })
    if (that.isOpen) {
      that.ws.send(body)
      typeof cb === 'function' && cb({ status: true })
    } else if (that.isConnecting) {
      that.wsCB.connecting.push(res => {
        that.ws.send(body)
        typeof cb === 'function' && cb(res)
      })
    } else {
      that.open(res => {
        if (res.status) that.ws.send(body)
        typeof cb === 'function' && cb(res)
      }) 
    }
  }
  
  /**
   * 订阅 onmessage 接收消息
   * @param {string} msgType 消息类型（与接收端自行约定）
   * @param {function} cb 接收后的回调
   * @returns {string} id 此订阅消息的ID
   */
  onmsg(msgType, cb) {
    if (typeof msgType !== 'string') {
      that.consoleError('onmsg', 'first parameter not a string')
      return
    } else if (typeof cb !== 'function') {
      that.consoleError('onmsg', 'second parameter not a function')
      return
    }
    if (!this.subscribe[msgType]) this.subscribe[msgType] = []
    let id = `${+new Date()}_${Math.floor(Math.random() * 100000)}`
    this.subscribe[msgType].push({id, cb})
    this.catalog[id] = {type: msgType}
    return id
  }

  /**
   * 取消订阅消息
   * @param {string} id 订阅消息的ID
   */
  off(id) {
    if (!this.catalog[id]) return
    let type = this.catalog[id].type
    let index
    this.subscribe[type].some((sub, i) => {
      if (sub.id === id) {
        index = i
        return true
      }
    })
    this.subscribe[type].splice(i, 1)
    delete this.catalog[id]
  }

  /**
   * 取消所有订阅消息
   */
  offAll() {
    this.subscribe = {}
    this.catalog = {}
  }
  
  /**
   * onmessagen 原始监听回调
   * @param {function} cb 回调函数
   */
  onmessage(cb) {
    typeof cb === 'function' && (this.wsCB.onmessage = cb)
  }

  /**
   * onopen 原始监听回调
   * @param {function} cb 回调函数
   */
  onopen(cb) {
    typeof cb === 'function' && (this.wsCB.onopen = cb)
  }

  /**
   * onclose 原始监听回调
   * @param {function} cb 回调函数
   */
  onclose(cb) {
    typeof cb === 'function' && (this.wsCB.onclose = cb)
  }

  /**
   * onerror 原始监听回调
   * @param {function} cb 回调函数
   */
  onerror(cb) {
    typeof cb === 'function' && (this.wsCB.onerror = cb)
  }

  /**
   * 统一格式的错误报错提示
   * @param {string} func 函数名
   * @param {string} msg 错误消息
   */
  consoleError(func = '', msg = '') {
    console.error(`[WebSocketMG] (${func}) function: ${msg}`)
  }
}

// module.exports = WebSocketMG
export default WebSocketMG
