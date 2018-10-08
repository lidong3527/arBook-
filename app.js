//app.js
App({
  onLaunch: function () {
    globalData:{
      httpDomain:'http://192.168.50.15:9006/Excoord_ApiServer/webservice'
    }
    wx.getSystemInfo({
      success: (res) => {
        console.log(res.system); 
        var system = res.system;   
        system = system.split(' ')[0];
        // console.log(system);
        this.globalData.Number = system == 'iOS' || system == 'IOS' ?2:1;
        this.globalData.height = res.windowHeight;
        this.globalData.width = res.windowWidth;
      },
    });

    // update
    const updateManager = wx.getUpdateManager();
    updateManager.onUpdateReady(function(res){
      updateManager.applyUpdate();
    });
    // 登录
    // wx.login({
    //   success: res => {
    //     console.log(res.code)
    //     // 发送 res.code 到后台换取 openId, sessionKey, unionId
    //     wx.request({
    //       url: 'https://api.weixin.qq.com/sns/jscode2session',
    //       method:'GET',
    //       data:{
    //         appid: 'wx457a76668d51faa3',//开发者id
    //         secret: '2dd94abfa59b232641b0d26ce30098d6',//小程序的秘钥
    //         grant_type:'authorization_code',//固定
    //         js_code: res.code //登录接口返回的值
    //       },
    //       success:function(res){
    //         console.log(res);
    //       }
    //     })
    //   }
    // })
    // // 获取用户信息
    // wx.getSetting({
    //   success: res => {
    //     if (res.authSetting['scope.userInfo']) {
    //       // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
    //       wx.getUserInfo({
    //         success: res => {
    //           // 可以将 res 发送给后台解码出 unionId
    //           this.globalData.userInfo = res.userInfo
    //           // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
    //           // 所以此处加入 callback 以防止这种情况
    //           if (this.userInfoReadyCallback) {
    //             this.userInfoReadyCallback(res)
    //           }
    //         }
    //       })
    //     }
    //   }
    // })
  },
  globalData: {
    userInfo: null
  }
})