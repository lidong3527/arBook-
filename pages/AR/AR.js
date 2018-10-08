var app = getApp();
var upng = require('../upng-js/UPNG.js');
var SimpleConnection = require('../connection/simple_websocket_connection.js')
var timer; //调用识别计时器
var GifInter; //gif计时器
var connection;
const ctx = wx.createCanvasContext('myCanvas');
var interNumber = 0;
Page({
  data: {
    videoFlag: false,
    videoSrc: '',
    listData: [],
    windowHeight: 0,
    canvasFlag: true,
    tipText: '点击屏幕开始识别',
    moveNumber: -170,
    topPx: -170,
    bottomPx: 162,
    showMoveImage: false,
    dataFlag: false,
    btnText: '开启',
    uuid: null,
    sendSyncFlag: true,
    syncBgColor: '#2b84ef',
    syncColor:'white',
    pdfFlag:false,
    pdfPath:'',
    itemIndex:0
  },

  onLoad: function(options) {
    this.setData({
      windowHeight: app.globalData.height,
      windowWidth: app.globalData.width,
      Number: app.globalData.Number
    })
    wx.clearStorage();
    GifInter = setInterval(() => {
      if (this.data.moveNumber == this.data.topPx) {
        this.setData({
          moveNumber: this.data.bottomPx,
        })
      } else if (this.data.moveNumber == this.data.bottomPx) {
        this.setData({
          moveNumber: this.data.topPx,
        })
      } else {
        // console.log('不执行动画')
      }
    }, 2100)
  },

  uploadImageBase64(base64) {
    var params = {
      "method": "searchImage",
    };
    wx.uploadFile({
      // url: 'http://192.168.50.34:5890/Excoord_PastecServer/search', //仅为示例，非真实的接口地址
      url: 'https://eschool.maaee.com/Excoord_PastecServer/search',
      filePath: base64,
      name: 'file',
      success: (res) => {
        var res = JSON.parse(res.data);
        if (res.success && res.response.image_ids != undefined && res.response.image_ids.length > 0) {
          this.initData();
          console.log(res.response.image_ids[0], '已识别');
          var params = {
            "method": "getARBookItemByEasyARId",
            "targetId": res.response.image_ids[0]
          }
          wx.request({
            // url: 'http://192.168.50.15:9006/Excoord_ApiServer/webservice',
            url: 'https://www.maaee.com/Excoord_For_Education/webservice',
            method: 'GET',
            data: {
              params: JSON.stringify(params)
            },
            header: {
              //设置参数内容类型为x-www-form-urlencoded
              // 'content-type': 'application/json',
            },
            success: (res) => {
              if (!res.data.response) {
                console.log('识别出来的图片暂无数据')
                return;
              }
              this.setData({
                dataFlag: true,
              }, () => {
                var data = res.data.response.video;
                var arr = data.split(',');
                for (var k in arr) {
                  arr[k] = arr[k].replace('http://60.205.86.217', 'https://www.maaee.com');
                }
                var text = arr[0];
                text = text.substr(text.length - 3, text.length);
                console.log(text);
                if (text == 'mp4' || text == 'MP4' || text == 'Mp4') {
                  this.setData({
                    videoSrc: arr[0],
                    listData: arr,
                    text: 'mp4'
                  }, () => {
                    this.setData({
                      videoFlag: true,
                    }, () => {
                      if (this.data.uuid != null) {
                        this.simpleSendMessage("arsyc_play_playvideo", this.data.videoSrc);
                      }
                    })
                  })
                } else {
                  this.setData({
                    text: 'pdf',
                    listData: arr,
                    pdfPath:arr[0],
                    pdfFlag:true
                  })

                }
              })

            }
          })
        } else {
          interNumber++;
          if (interNumber < 3) {
            this.takePhoto();
          } else {
            this.initData();
          }
        }
      }
    });
  },

  //裁剪
  request: function(data) {
    var that = this;
    if (this.data.Number == 2) {
      data = this.reverseImgData(data);
    }
    // console.log(app.globalData.width);
    // console.log(app.globalData.height);
    var width = 500; //最终输出图片尺寸  width * width
    var height = app.globalData.height * (width / app.globalData.width);
    // this.setData({
    //   canvasWidth: width,
    //   canvasHeight:height,
    // })
    var query = wx.createSelectorQuery().in(this)
    query.select('.default_image').boundingClientRect((res) => {
      //  console.log(res.top);
      //  console.log(res.left);
      var imageLeft = res.left;
      var imageTop = res.top;
      var imageWidth = res.width;
      ctx.drawImage(data, -(imageLeft) + 80, -(imageTop) + 80, app.globalData.width, app.globalData.height);
      ctx.draw(false, () => {
        wx.canvasToTempFilePath({
          x: 0,
          y: 0,
          width: imageWidth + 160,
          height: imageWidth + 160,
          destWidth: width,
          destHeight: width,
          canvasId: 'myCanvas',
          fileType: 'jpg',
          success: function(res) {
            // return;
            // console.log(res.tempFilePath)
            that.uploadImageBase64(res.tempFilePath)
          }
        })
      })
    }).exec();

  },


  //打开pdf、文件
  openFile: function(pdfPath) {
    console.log('准备打开文件' + pdfPath)
    wx.getStorage({
      key: pdfPath,
      success: (res) => {
        wx.showLoading({
          title: '正在打开',
        })
        for (var i = 0; i < this.data.Number; i++) {
          wx.openDocument({
            // fileType: 'doc, xls, ppt, pdf, docx, xlsx, pptx',
            filePath: res.data,
            success: (res) => {
              setTimeout(() => {
                wx.hideLoading();
              }, 1000)
            },
            fail: function(error) {
              console.error(error, 'error')
            }
          })
        }

      },
      fail: function(res) {
        wx.showLoading({
          title: '正在下载...',
        })
        wx.downloadFile({
          url: pdfPath,
          success: function(res) {
            var filePath = res.tempFilePath;
            console.log('下载成功')
            wx.openDocument({
              filePath: filePath,
              // fileType: 'doc, xls, ppt, pdf, docx, xlsx, pptx',
              success: function(res) {
                console.log('打开成功')
                wx.setStorage({
                  key: pdfPath,
                  data: filePath,
                  success: function(res) {
                    setTimeout(() => {
                      wx.hideLoading();
                    }, 1000)
                  },
                  fail: function(res) {
                    console.log(res, 'error')
                  }
                })
              }
            })
          },
          fail: function(res) {
            wx.hideLoading();
            wx.showModal({
              title: '提示',
              content: '加载pdf失败',
            })
            console.log(res);
          }
        })
      }
    })

  },

  takePhoto() {
    this.setData({
      tipText: '正在识别...',
      showMoveImage: true,
      dataFlag: false,
    }, () => {
      const ctx = wx.createCameraContext(); //camera对象
      ctx.takePhoto({
        quality: 'normal',
        success: (res) => {
          this.request(res.tempImagePath);
        },
        fail: res => {
          // console.log(res);
        }
      })
    });
  },

  //点击开始扫描
  onclick: function(e) {
    console.log(e);
    if (this.data.tipText == '正在识别...' || this.data.listData.length > 0) {
      console.log('阻止了这次点击')
      return;
    } else {
      this.takePhoto();
    }
  },

  //点击切换列表项
  clickChangeVideo: function(e) {
    this.setData({
      itemIndex: e.currentTarget.dataset.index
    })
    console.log(e.currentTarget.dataset.index,'eeeeeee')
    var src = e.currentTarget.dataset.item;
    src = src.substr(src.length - 3, src.length);
    // return;
    if (src == 'mp4') {
      this.setData({
        pdfFlag: false,
        pdfPath: "",
        videoFlag:true,
        videoSrc: e.currentTarget.dataset.item
      }, () => {
        if (this.data.uuid != null) {
          this.simpleSendMessage('arsyc_play_playvideo', this.data.videoSrc);
        }
      })
    } else {
      this.setData({
        videoFlag: false,
        videoSrc:"",
        pdfFlag: true,
        pdfPath: e.currentTarget.dataset.item,
      })
    }
  },

  //点击打开pdf
  openFileClick(){
    this.openFile(this.data.pdfPath);
  },

  initData: function() {
    clearInterval(timer);
    interNumber = 0;
    this.setData({
      tipText: '点击屏幕开始识别',
      showMoveImage: false,
    })
  },

  goBack: function() {
    console.log('返回');
    this.setData({
      listData: [],
      videoFlag: false,
      videoSrc: '',
      text: '',
      pdfFlag:false,
      pdfPath:'',
      itemIndex:0
    })
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {
    this.initData();
    interNumber = 0;
    clearInterval(GifInter);
    wx.closeSocket();
  },


  //反转图片
  reverseImgData(res) {
    var w = res.width
    var h = res.height
    let con = 0
    for (var i = 0; i < h / 2; i++) {
      for (var j = 0; j < w * 4; j++) {
        con = res.data[i * w * 4 + j]
        res.data[i * w * 4 + j] = res.data[(h - i - 1) * w * 4 + j]
        res.data[(h - i - 1) * w * 4 + j] = con
      }
    }
    return res
  },



  //点击列表项移动
  clickTransform: function(e) {
    // console.log(e);
  },

  // 微信支付
  requestPayment: function() {
    var nonstr = this.createNonceStr();
    console.log(nonstr);
    wx.request({
      url: 'https://www.maaee.com/Excoord_Pay/payment/open',
      method: 'POST',
      data: {
        subject: '小程序支付测试',
        order_no: nonstr,
        amount: 10,
        body: "小程序支付测试",
        spbill_create_ip: '113.139.88.19',
        channel: "wxpayxcx",
        xcxId: "wx457a76668d51faa3",
        notify_url: "www.maaee.com"
      },
      header: {
        // 'content-type': 'application/json',
        'content-type': 'application/x-www-form-urlencoded'
      },
      success: (res) => {
        console.log(res);
      },
      fail: error => {
        console.log(error)
      }
    })
  },

  createNonceStr: function() {
    return Math.random().toString(36).substr(2, 15)
  },





  //创建soket连接并开启即时发送一次
  initSimpleConection: function(command) {
    wx.connectSocket({
      url: 'wss://www.maaee.com:7891/Excoord_SimpleWsServer/simple',
      data: {
        x: '',
        y: ''
      },
      header: {
        'content-type': 'application/json'
      },
      protocols: [],
      method: "GET",
      success: res => {
        console.log(res);
        wx.onSocketOpen((res) => {
          console.log('WebSocket连接已打开！');
          this.simpleSendMessage(command);
        })
      }
    })

  },


  //发送消息
  simpleSendMessage(command,videoSrc) {
    if(videoSrc){
      var protocal = {
        command: command,
        data: {
          uuid: this.data.uuid,
          videoPath: videoSrc
        }
      }
    }else{
      var protocal = {
        command: command,
        data: {
          uuid: this.data.uuid
        }
      }
    }
    wx.sendSocketMessage({
      data: JSON.stringify(protocal),
      success: res=>{
        console.log(res);
      }
    })
  },

  //点击开启大屏按钮事件
  start_sync: function() {
    

    // if (!this.data.sendSyncFlag) {
    //   console.log('已阻止');
    //   return;
    // }
    if (this.data.tipText == '正在识别...'){
      // wx.showModal({
      //   title: '确认操作',
      //   content: '请关闭识别后进行此操作',
      //   showCancel: false,
      // });
      return;
    }
    this.setData({
      sendSyncFlag: false
    }, () => {
      if (this.data.btnText == '开启') {
        this.goBack();
        wx.scanCode({
          onlyFromCamera: true,
          success: (res) => {
            var scanResult = JSON.parse(res.result);
            this.setData({
              uuid: scanResult.uuid,
              btnText:'已开启',
              syncBgColor: 'white',
              syncColor: '#2b84ef',
              sendSyncFlag:true
            }, () => {
              //初始化soket连接，开启后即时发送一次
              this.initSimpleConection('arsyc_play_inited');
            })
          },
          complete: () => {
            this.setData({
              sendSyncFlag: true,
            })
          }
        })
      } else {
        wx.showModal({
          title: '确认操作',
          content: '确定取消大屏同步?',
          showCacel:false,
          success: res =>{
            if (res.confirm){
              this.setData({
                uuid: null,
                btnText: '开启',
                sendSyncFlag: true,
                syncBgColor: '#2b84ef',
                syncColor: 'white'
              })
              wx.closeSocket();
            }
          }
        })
        
      }
    })
  }
})