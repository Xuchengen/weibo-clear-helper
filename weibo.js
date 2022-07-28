// ==UserScript==
// @name         新浪微博清道夫
// @namespace    https://xuchengen.cn/
// @version      0.1
// @description  新浪微博清道夫
// @author       徐承恩
// @match        https://weibo.com/*
// @icon         https://weibo.com/favicon.ico

// @require      https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js
// @require      https://cdn.jsdelivr.net/npm/jquery-ui@1.13.2/dist/jquery-ui.min.js

// @grant        GM_addStyle
// @grant        GM_addElement
// @grant        unsafeWindow
// ==/UserScript==

(function () {
    'use strict';

    // 注入jQuery-ui样式表
    GM_addElement("link", {
        href: "https://code.jquery.com/ui/1.13.2/themes/base/jquery-ui.css", rel: 'stylesheet'
    });

    // 注入自定义样式表
    GM_addElement('style', {
        textContent: '.fixed-dialog{position: fixed;z-index:999999999;}'
    });

    // 注入getCookie函数
    GM_addElement("script", {
        textContent: 'function getCookie(cookieName) {\n' + '   var name = cookieName + "=";\n' + '   var ca = document.cookie.split(\';\');\n' + '   for(var i = 0; i < ca.length; i++) {\n' + '       var c = ca[i].trim();\n' + '       if (c.indexOf(name) == 0) return c.substring(name.length,c.length);\n' + '   }\n' + '   return "";\n' + '}'
    });

    // 弹框模板
    const template = jQuery("<div id='weibo-clear-template'></div>")
        .append("<button id='weibo-clear-btn-guanzhu' class='ui-button ui-widget ui-corner-all' style='float:left;'>清空关注</button>")
        .append("<button id='weibo-clear-btn-fans' class='ui-button ui-widget ui-corner-all' style='float:right;'>清空粉丝</button>")
        .append("<div style='clear: both;padding: 5px;'></div>")
        .append("<hr style='border: 0;border-bottom: 1px solid #ccc;'>")
        .append("<p id='weibo-clear-message' style='display: block;width: 100%;height: 45px;line-height: 45px;text-align: center;'></p>");

    // 弹框
    jQuery(template).dialog({
        title: "新浪微博清道夫", resizable: false, dialogClass: 'fixed-dialog'
    });

    // 清除关注
    jQuery("#weibo-clear-btn-guanzhu").on("click", function () {
        let jq_weibo_clear_message = jQuery("#weibo-clear-message");
        jq_weibo_clear_message.text("努力解析中...");
        jQuery("button[id^='weibo-clear-btn']").button({disabled: true});

        jQuery.when(getFollowers()).done(function (data) {
            jq_weibo_clear_message.text("您有" + data.length + "个关注可供清理！");
            let s = 1000;
            let list = data.map(function (e) {
                return sleep(s += 2000).then(function () {
                    jq_weibo_clear_message.text("清除@" + e.name + "");
                }).then(function () {
                    return removeFollowers(e.id);
                }).then(function () {
                    sleep(500).then(function () {
                        jq_weibo_clear_message.text("清除@" + e.name + "成功！");
                    });
                });
            });

            Promise.all(list).then(function () {
                return sleep(1000).then(function () {
                    jq_weibo_clear_message.text("清除完毕！");
                }).then(function () {
                    sleep(1000).then(function () {
                        jq_weibo_clear_message.text("");
                        jQuery("button[id^='weibo-clear-btn']").button({disabled: false});
                    });
                });
            });
        });
    });

    // 清除粉丝
    jQuery("#weibo-clear-btn-fans").on("click", function () {
        let jq_weibo_clear_message = jQuery("#weibo-clear-message");
        jq_weibo_clear_message.text("努力解析中...");
        jQuery("button[id^='weibo-clear-btn']").button({disabled: true});

        jQuery.when(getFollowers()).done(function (data) {
            jq_weibo_clear_message.text("您有" + data.length + "个粉丝可供清理！");
            let s = 1000;
            let list = data.map(function (e) {
                return sleep(s += 2000).then(function () {
                    jq_weibo_clear_message.text("清除@" + e.name + "");
                }).then(function () {
                    return removeFollowers(e.id);
                }).then(function () {
                    sleep(500).then(function () {
                        jq_weibo_clear_message.text("清除@" + e.name + "成功！");
                    });
                });
            });

            Promise.all(list).then(function () {
                return sleep(1000).then(function () {
                    jq_weibo_clear_message.text("清除完毕！");
                }).then(function () {
                    sleep(1000).then(function () {
                        jq_weibo_clear_message.text("");
                        jQuery("button[id^='weibo-clear-btn']").button({disabled: false});
                    });
                });
            });
        });
    });

    /**
     * 清除关注
     */
    function removeFollowers(uid) {
        let url = "https://weibo.com/ajax/friendships/destory";
        let defer = jQuery.Deferred();

        jQuery.ajax({
            url: url,
            type: 'post',
            contentType: "application/json; charset=utf-8",
            dataType: 'json',
            data: JSON.stringify({"uid": uid}),
            beforeSend: function (request) {
                request.setRequestHeader("x-xsrf-token", getCookie("XSRF-TOKEN"));
            },
            success: function (data) {
                defer.resolve(("ok" in data && data.ok === 1));
            },
            error: function (e) {
                defer.resolve(false);
            }
        });

        return defer.promise();
    }

    /**
     * 获取关注列表
     */
    function getFollowers() {
        let fn = function (page) {
            let defer = jQuery.Deferred();
            let url = "https://weibo.com/ajax/profile/followContent?page={PAGE}";
            url = url.replace(/{PAGE}/, page);

            jQuery.get(url).done(function (data) {
                if (data.ok === 1 && data.data.follows.users.length) {
                    let users = [];

                    jQuery.each(data.data.follows.users, function (i, e) {
                        users.push({
                            "id": e.id, "name": e.name
                        });
                    });

                    sleep(200).then(() => {
                        jQuery.when(fn(page + 1)).done(function (final_result) {
                            defer.resolve([].concat(users, final_result));
                        });
                    });

                } else {
                    defer.resolve([]);
                }
            }).fail(function () {
                defer.resolve([]);
            });

            return defer.promise();
        }

        return fn(1);
    }

    function removeFans(uid) {
        var url = "https://weibo.com/ajax/profile/destroyFollowers";

        var defer = jQuery.Deferred();

        jQuery.ajax({
            url: url,
            type: 'post',
            contentType: "application/json; charset=utf-8",
            dataType: 'json',
            data: JSON.stringify({"uid": uid}),
            beforeSend: function (request) {
                request.setRequestHeader("x-xsrf-token", getCookie("XSRF-TOKEN"));
            },
            success: function (data) {
                defer.resolve(("ok" in data && data.ok === 1));
            },
            error: function (e) {
                defer.resolve(false);
            }
        });

        return defer.promise();
    }

    function getFans() {
        var fn = function (page) {
            let uid = getUserId();
            let url = "https://weibo.com/ajax/friendships/friends?uid={UID}&relate=fans&count=20&page={PAGE}&type=fans&fansSortType=fansCount";
            url = url.replace(/{UID}/, uid);
            url = url.replace(/{PAGE}/, page);
            let defer = jQuery.Deferred();

            jQuery.when((function (_url) {
                let _defer = jQuery.Deferred();
                jQuery.get(_url, function (data) {
                    _defer.resolve(data);
                });
                return _defer.promise();
            })(url)).done(function (data) {
                let page = data.next_page;
                let users = [];
                if (data.ok === 1 && data.users.length) {
                    jQuery.each(data.users, function (i, e) {
                        users.push({"id": e.id, "name": e.name});
                    });
                    sleep(200).then(() => {
                        jQuery.when(fn(page)).done(function (final_result) {
                            defer.resolve([].concat(users, final_result));
                        });
                    });
                } else {
                    defer.resolve([]);
                }
            });
            return defer.promise();
        }
        return fn(1);
    }

    /**
     * 获取用户ID
     */
    function getUserId() {
        return window.localStorage.getItem("WBStoreTid");
    }

    /**
     * 延迟函数
     * @param time 毫秒
     */
    function sleep(time) {
        return new Promise((resolve) => setTimeout(resolve, time));
    }

})();