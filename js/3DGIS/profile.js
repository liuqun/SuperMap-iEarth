define(['../lib/Convert'],function(Convert) {
    'use strict';
    var $ = require('jquery');

  /*
  * 剖面分析对象
  * 画线截取剖面
  * 起点信息和终点信息
  * 分析结果小窗口显示
  *
  * */
    var handlerLine, screenSpaceEventHandler = null, positions = [];
    var line;
    var profile = function () {
    };
    var crossProfile;
    profile.remove = function(viewer,parent){
        $("#profile-start-position").val('');
        $("#profile-end-position").val('');
         if(handlerLine){
             handlerLine.clear();
         }
        if(parent.profileForm){
            parent.profileForm.$el.hide();
            $("#pro").width(0);
            $("#pro").height(0);
        }
        if(crossProfile){
            crossProfile.destroy();
            crossProfile = undefined;
        }
    };

    profile.initializing = function(viewer, parent, sceneModel, isPCBroswer){
        var scene = viewer.scene;
        if(!crossProfile){
            crossProfile = new Cesium.Profile(scene);
        }
        if(handlerLine){
            handlerLine.clear();
        }
        handlerLine = new Cesium.DrawHandler(viewer,Cesium.DrawMode.Line);
        handlerLine.activeEvt.addEventListener(function(isActive){
            if(isActive == true){
                viewer.enableCursorStyle = false;
                viewer._element.style.cursor = '';
                $('body').removeClass('drawCur').addClass('drawCur');
            }
            else{
                viewer.enableCursorStyle = true;
                $('body').removeClass('drawCur');
            }
        });
        handlerLine.movingEvt.addEventListener(function(windowPosition){
        });
        handlerLine.drawEvt.addEventListener(function(result) {
            var linePosition = result.object ? result.object.positions : result;
            var startPoint = linePosition[0];
            var endPoint = linePosition[linePosition.length - 1];

            //起止点相关信息
            var scartographic = Cesium.Cartographic.fromCartesian(startPoint);
            var slongitude = Cesium.Math.toDegrees(scartographic.longitude);
            var slatitude = Cesium.Math.toDegrees(scartographic.latitude);
            var sheight = scartographic.height;

            var ecartographic = Cesium.Cartographic.fromCartesian(endPoint);
            var elongitude = Cesium.Math.toDegrees(ecartographic.longitude);
            var elatitude = Cesium.Math.toDegrees(ecartographic.latitude);
            var eheight = ecartographic.height;

            var profileStartPosition = slongitude.toFixed(4) + ', ' + slatitude.toFixed(4) + ', ' + sheight.toFixed(2);
            var profileEndPosition = elongitude.toFixed(4) + ', ' + elatitude.toFixed(4) + ', ' + eheight.toFixed(2);
            $("#profile-start-position").val(profileStartPosition);
            $("#profile-end-position").val(profileEndPosition);

            // 剖面分析的起止点
            crossProfile.startPoint = [slongitude, slatitude, sheight];
            crossProfile.endPoint = [elongitude, elatitude, eheight];
            crossProfile.extendHeight = 40;
            // 剖面数据
            crossProfile.getBuffer(function(buffer) {
                if(parent.profileForm){
                    var canvas = document.getElementById("pro");
                    canvas.height = crossProfile._textureHeight;
                    canvas.width = crossProfile._textureWidth;
                    var ctx = canvas.getContext("2d");
                    var imgData = ctx.createImageData(crossProfile._textureWidth, crossProfile._textureHeight);
                    imgData.data.set(buffer);
                    ctx.putImageData(imgData,0,0);
                    $("#pro").width(300);
                    $("#pro").height(150);
                    parent.profileForm.$el.show();
                }
                if(!parent.profileForm){
                    var me = parent;
                    // 结果显示窗口
                    require(['./views/profileForm'],function(profileForm){
                        var profileForm = new profileForm({
                            buffer : buffer,
                            profile : crossProfile,
                            sceneModel : me.model,
                            isPCBroswer : me.isPCBroswer
                        });
                        me.parent.addComponent(profileForm);
                        me.profileForm = profileForm;
                        profileForm.$el.show();
                    });
                }
            });
            crossProfile.build();
            positions = [];
        });
        handlerLine.activate();

        if(!isPCBroswer) {
            screenSpaceEventHandler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
            screenSpaceEventHandler.setInputAction(function (evt) {
                positions.push(viewer.scene.pickPosition(evt.position));
                if (positions.length >= 2) {
                    handlerLine.drawEvt.raiseEvent(positions);
                    handlerLine.deactivate();
                    screenSpaceEventHandler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
                }
            }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        }

        var store = {};
        store.startPoint = crossProfile.startPoint;
        store.endPoint = crossProfile.endPoint;
        store.extendHeight = crossProfile.extendHeight;
        sceneModel.analysisObjects.profileStore = store;
    }

    return profile;
});