/**
 * WebSocket消息通信管理
 * {
 *    type: 'update_some',
 *    data: {}
 * }
 */

class WebSocketMG {
  constructor(url) {
    this.url = url
    this.ws = null
    this.wsCB = {
      onopen: null,
      onclose: null,
      onerror: null,
      connecting: []
    }
    this.isOpen = false // ws当前是否已连接
    this.isConnecting = false // ws当前是否正在连接
    this.subscribe = {} // ws.onmessage对应消息类型的 订阅者回调
    this.catalog = {} // 订阅者ID 对应的消息类型 可查询目录
  }
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
            if (typeof sub.cb === 'function') sub.cb(res.data || {})
            index++
          }
        }
      }
    }
  }

  send(msgType, params = {}, cb) {
    const that = this
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

  close() {
    this.isOpen && this.ws.close()
  }
  
  onmsg(msgType, cb) {
    if (typeof msgType !== 'string' || typeof cb !== 'function') return
    if (!this.subscribe[msgType]) this.subscribe[msgType] = []
    let id = `${+new Date()}_${Math.floor(Math.random() * 100000)}`
    this.subscribe[msgType].push({id, cb})
    this.catalog[id] = {type: msgType}
    return id
  }
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
  offAll() {
    this.subscribe = {}
    this.catalog = {}
  }
  
  onopen(cb) {
    typeof cb === 'function' && (this.wsCB.onopen = cb)
  }
  onclose(cb) {
    typeof cb === 'function' && (this.wsCB.onclose = cb)
  }
  onerror(cb) {
    typeof cb === 'function' && (this.wsCB.onerror = cb)
  }
}

export default WebSocketMG
