var Module = typeof Module != "undefined" ? Module : {};
if (!Module.expectedDataFileDownloads) {
    Module.expectedDataFileDownloads = 0
}
Module.expectedDataFileDownloads++;
(function() {
    if (Module["ENVIRONMENT_IS_PTHREAD"] || Module["$ww"])
        return;
    var loadPackage = function(metadata) {
        var PACKAGE_PATH = "";
        if (typeof window === "object") {
            PACKAGE_PATH = window["encodeURIComponent"](window.location.pathname.toString().substring(0, window.location.pathname.toString().lastIndexOf("/")) + "/")
        } else if (typeof process === "undefined" && typeof location !== "undefined") {
            PACKAGE_PATH = encodeURIComponent(location.pathname.toString().substring(0, location.pathname.toString().lastIndexOf("/")) + "/")
        }
        var PACKAGE_NAME = "index.data";
        var REMOTE_PACKAGE_BASE = "index.data";
        if (typeof Module["locateFilePackage"] === "function" && !Module["locateFile"]) {
            Module["locateFile"] = Module["locateFilePackage"];
            err("warning: you defined Module.locateFilePackage, that has been renamed to Module.locateFile (using your locateFilePackage for now)")
        }
        var REMOTE_PACKAGE_NAME = Module["locateFile"] ? Module["locateFile"](REMOTE_PACKAGE_BASE, "") : REMOTE_PACKAGE_BASE;
        var REMOTE_PACKAGE_SIZE = metadata["remote_package_size"];
        function fetchRemotePackage(packageName, packageSize, callback, errback) {
            if (typeof process === "object" && typeof process.versions === "object" && typeof process.versions.node === "string") {
                require("fs").readFile(packageName, function(err, contents) {
                    if (err) {
                        errback(err)
                    } else {
                        callback(contents.buffer)
                    }
                });
                return
            }
            var xhr = new XMLHttpRequest;
            xhr.open("GET", packageName, true);
            xhr.responseType = "arraybuffer";
            xhr.onprogress = function(event) {
                var url = packageName;
                var size = packageSize;
                if (event.total)
                    size = event.total;
                if (event.loaded) {
                    if (!xhr.addedTotal) {
                        xhr.addedTotal = true;
                        if (!Module.dataFileDownloads)
                            Module.dataFileDownloads = {};
                        Module.dataFileDownloads[url] = {
                            loaded: event.loaded,
                            total: size
                        }
                    } else {
                        Module.dataFileDownloads[url].loaded = event.loaded
                    }
                    var total = 0;
                    var loaded = 0;
                    var num = 0;
                    for (var download in Module.dataFileDownloads) {
                        var data = Module.dataFileDownloads[download];
                        total += data.total;
                        loaded += data.loaded;
                        num++
                    }
                    total = Math.ceil(total * Module.expectedDataFileDownloads / num);
                    if (Module["setStatus"])
                        Module["setStatus"](`Downloading data... (${loaded}/${total})`)
                } else if (!Module.dataFileDownloads) {
                    if (Module["setStatus"])
                        Module["setStatus"]("Downloading data...")
                }
            }
            ;
            xhr.onerror = function(event) {
                throw new Error("NetworkError for: " + packageName)
            }
            ;
            xhr.onload = function(event) {
                if (xhr.status == 200 || xhr.status == 304 || xhr.status == 206 || xhr.status == 0 && xhr.response) {
                    var packageData = xhr.response;
                    callback(packageData)
                } else {
                    throw new Error(xhr.statusText + " : " + xhr.responseURL)
                }
            }
            ;
            xhr.send(null)
        }
        function handleError(error) {
            console.error("package error:", error)
        }
        var fetchedCallback = null;
        var fetched = Module["getPreloadedPackage"] ? Module["getPreloadedPackage"](REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE) : null;
        if (!fetched)
            fetchRemotePackage(REMOTE_PACKAGE_NAME, REMOTE_PACKAGE_SIZE, function(data) {
                if (fetchedCallback) {
                    fetchedCallback(data);
                    fetchedCallback = null
                } else {
                    fetched = data
                }
            }, handleError);
        function runWithFS() {
            function assert(check, msg) {
                if (!check)
                    throw msg + (new Error).stack
            }
            Module["FS_createPath"]("/", "assets", true, true);
            Module["FS_createPath"]("/assets", "blocks", true, true);
            Module["FS_createPath"]("/assets", "games", true, true);
            Module["FS_createPath"]("/assets", "sounds", true, true);
            Module["FS_createPath"]("/assets", "views", true, true);
            function DataRequest(start, end, audio) {
                this.start = start;
                this.end = end;
                this.audio = audio
            }
            DataRequest.prototype = {
                requests: {},
                open: function(mode, name) {
                    this.name = name;
                    this.requests[name] = this;
                    Module["addRunDependency"](`fp ${this.name}`)
                },
                send: function() {},
                onload: function() {
                    var byteArray = this.byteArray.subarray(this.start, this.end);
                    this.finish(byteArray)
                },
                finish: function(byteArray) {
                    var that = this;
                    Module["FS_createDataFile"](this.name, null, byteArray, true, true, true);
                    Module["removeRunDependency"](`fp ${that.name}`);
                    this.requests[this.name] = null
                }
            };
            var files = metadata["files"];
            for (var i = 0; i < files.length; ++i) {
                new DataRequest(files[i]["start"],files[i]["end"],files[i]["audio"] || 0).open("GET", files[i]["filename"])
            }
            function processPackageData(arrayBuffer) {
                assert(arrayBuffer, "Loading data file failed.");
                assert(arrayBuffer.constructor.name === ArrayBuffer.name, "bad input to processPackageData");
                var byteArray = new Uint8Array(arrayBuffer);
                DataRequest.prototype.byteArray = byteArray;
                var files = metadata["files"];
                for (var i = 0; i < files.length; ++i) {
                    DataRequest.prototype.requests[files[i].filename].onload()
                }
                Module["removeRunDependency"]("datafile_index.data")
            }
            Module["addRunDependency"]("datafile_index.data");
            if (!Module.preloadResults)
                Module.preloadResults = {};
            Module.preloadResults[PACKAGE_NAME] = {
                fromCache: false
            };
            if (fetched) {
                processPackageData(fetched);
                fetched = null
            } else {
                fetchedCallback = processPackageData
            }
        }
        if (Module["calledRun"]) {
            runWithFS()
        } else {
            if (!Module["preRun"])
                Module["preRun"] = [];
            Module["preRun"].push(runWithFS)
        }
    };
    loadPackage({
        "files": [{
            "filename": "/assets/atlas.png",
            "start": 0,
            "end": 256825
        }, {
            "filename": "/assets/blocks/ACCELEROMETER_V",
            "start": 256825,
            "end": 257138
        }, {
            "filename": "/assets/blocks/ARCH",
            "start": 257138,
            "end": 257315
        }, {
            "filename": "/assets/blocks/BALL",
            "start": 257315,
            "end": 257460
        }, {
            "filename": "/assets/blocks/BOX",
            "start": 257460,
            "end": 257675
        }, {
            "filename": "/assets/blocks/BRICKS",
            "start": 257675,
            "end": 257858
        }, {
            "filename": "/assets/blocks/BUTTERFLY",
            "start": 257858,
            "end": 259155
        }, {
            "filename": "/assets/blocks/BUTTON",
            "start": 259155,
            "end": 259678
        }, {
            "filename": "/assets/blocks/BUTTON_B",
            "start": 259678,
            "end": 260563
        }, {
            "filename": "/assets/blocks/CAMERA_ORBIT",
            "start": 260563,
            "end": 261951
        }, {
            "filename": "/assets/blocks/COMMENT",
            "start": 261951,
            "end": 262065
        }, {
            "filename": "/assets/blocks/CpF_LIST_ELEMENT_Cp",
            "start": 262065,
            "end": 262431
        }, {
            "filename": "/assets/blocks/DASH_CAT",
            "start": 262431,
            "end": 264296
        }, {
            "filename": "/assets/blocks/DINO",
            "start": 264296,
            "end": 268915
        }, {
            "filename": "/assets/blocks/DINO_RED",
            "start": 268915,
            "end": 270650
        }, {
            "filename": "/assets/blocks/DIRT",
            "start": 270650,
            "end": 270743
        }, {
            "filename": "/assets/blocks/DIRT_B",
            "start": 270743,
            "end": 270922
        }, {
            "filename": "/assets/blocks/DIRT_SLAB",
            "start": 270922,
            "end": 271044
        }, {
            "filename": "/assets/blocks/ECVV_SET_ANG_LIMITS_E",
            "start": 271044,
            "end": 271501
        }, {
            "filename": "/assets/blocks/ECVV_SET_ANG_MOTOR_E",
            "start": 271501,
            "end": 271956
        }, {
            "filename": "/assets/blocks/ECVV_SET_ANG_SPRING_E",
            "start": 271956,
            "end": 272411
        }, {
            "filename": "/assets/blocks/ECVV_SET_LIN_LIMITS_E",
            "start": 272411,
            "end": 272866
        }, {
            "filename": "/assets/blocks/ECVV_SET_LIN_MOTOR_E",
            "start": 272866,
            "end": 273322
        }, {
            "filename": "/assets/blocks/ECVV_SET_LIN_SPRING_E",
            "start": 273322,
            "end": 273772
        }, {
            "filename": "/assets/blocks/EC_SET_VAR_E",
            "start": 273772,
            "end": 274027
        }, {
            "filename": "/assets/blocks/ECpC_SET_VAR_E",
            "start": 274027,
            "end": 274404
        }, {
            "filename": "/assets/blocks/EFFF_VOLUME_PITCH_E",
            "start": 274404,
            "end": 274847
        }, {
            "filename": "/assets/blocks/EFF_LOOP_EFE",
            "start": 274847,
            "end": 275217
        }, {
            "filename": "/assets/blocks/EFF_SET_SCORE_E",
            "start": 275217,
            "end": 275601
        }, {
            "filename": "/assets/blocks/EFF_SFX_PLAY_FE",
            "start": 275601,
            "end": 275983
        }, {
            "filename": "/assets/blocks/EF_INSPECT_E",
            "start": 275983,
            "end": 276332
        }, {
            "filename": "/assets/blocks/EF_RANDOM_SEED_E",
            "start": 276332,
            "end": 276720
        }, {
            "filename": "/assets/blocks/EF_SET_VAR_E",
            "start": 276720,
            "end": 276971
        }, {
            "filename": "/assets/blocks/EF_SFX_STOP_E",
            "start": 276971,
            "end": 277347
        }, {
            "filename": "/assets/blocks/EFpF_SET_VAR_E",
            "start": 277347,
            "end": 277721
        }, {
            "filename": "/assets/blocks/EFpO_MENU_ITEM_E",
            "start": 277721,
            "end": 278093
        }, {
            "filename": "/assets/blocks/EFp_DEC_VAR_E",
            "start": 278093,
            "end": 278359
        }, {
            "filename": "/assets/blocks/EFp_INC_VAR_E",
            "start": 278359,
            "end": 278631
        }, {
            "filename": "/assets/blocks/EOF_SET_BOUNCE_E",
            "start": 278631,
            "end": 279023
        }, {
            "filename": "/assets/blocks/EOF_SET_FRICTION_E",
            "start": 279023,
            "end": 279419
        }, {
            "filename": "/assets/blocks/EOF_SET_MASS_E",
            "start": 279419,
            "end": 279802
        }, {
            "filename": "/assets/blocks/EOOV_ADD_CONSTRAINT_EC",
            "start": 279802,
            "end": 280253
        }, {
            "filename": "/assets/blocks/EOT_SET_VISIBLE_E",
            "start": 280253,
            "end": 280631
        }, {
            "filename": "/assets/blocks/EOVQ_SET_POS_E",
            "start": 280631,
            "end": 281093
        }, {
            "filename": "/assets/blocks/EOVVV_ADD_FORCE_E",
            "start": 281093,
            "end": 281606
        }, {
            "filename": "/assets/blocks/EOVV_SET_LOCKED_E",
            "start": 281606,
            "end": 282068
        }, {
            "filename": "/assets/blocks/EOVV_SET_VEL_E",
            "start": 282068,
            "end": 282526
        }, {
            "filename": "/assets/blocks/EO_COLLISION_EOFVE",
            "start": 282526,
            "end": 283047
        }, {
            "filename": "/assets/blocks/EO_CREATE_EO",
            "start": 283047,
            "end": 283423
        }, {
            "filename": "/assets/blocks/EO_DESTROY_E",
            "start": 283423,
            "end": 283800
        }, {
            "filename": "/assets/blocks/EO_INSPECT_E",
            "start": 283800,
            "end": 284148
        }, {
            "filename": "/assets/blocks/EO_SET_VAR_E",
            "start": 284148,
            "end": 284399
        }, {
            "filename": "/assets/blocks/EOpO_SET_VAR_E",
            "start": 284399,
            "end": 284773
        }, {
            "filename": "/assets/blocks/EQ_INSPECT_E",
            "start": 284773,
            "end": 285124
        }, {
            "filename": "/assets/blocks/EQ_SET_VAR_E",
            "start": 285124,
            "end": 285377
        }, {
            "filename": "/assets/blocks/EQpQ_SET_VAR_E",
            "start": 285377,
            "end": 285753
        }, {
            "filename": "/assets/blocks/ET_IF_EEE",
            "start": 285753,
            "end": 286117
        }, {
            "filename": "/assets/blocks/ET_INSPECT_E",
            "start": 286117,
            "end": 286466
        }, {
            "filename": "/assets/blocks/ET_SET_VAR_E",
            "start": 286466,
            "end": 286716
        }, {
            "filename": "/assets/blocks/ETpT_SET_VAR_E",
            "start": 286716,
            "end": 287090
        }, {
            "filename": "/assets/blocks/EVQF_SET_CAM_E",
            "start": 287090,
            "end": 287540
        }, {
            "filename": "/assets/blocks/EVQ_SET_LIT_E",
            "start": 287540,
            "end": 287937
        }, {
            "filename": "/assets/blocks/EV_INSPECT_E",
            "start": 287937,
            "end": 288285
        }, {
            "filename": "/assets/blocks/EV_SET_GRAVITY_E",
            "start": 288285,
            "end": 288664
        }, {
            "filename": "/assets/blocks/EV_SET_VAR_E",
            "start": 288664,
            "end": 288916
        }, {
            "filename": "/assets/blocks/EVpV_SET_VAR_E",
            "start": 288916,
            "end": 289291
        }, {
            "filename": "/assets/blocks/E_BUT_SENSOR_EE",
            "start": 289291,
            "end": 289661
        }, {
            "filename": "/assets/blocks/E_JOY_SENSOR_VE",
            "start": 289661,
            "end": 290023
        }, {
            "filename": "/assets/blocks/E_LATE_UPDATE_EE",
            "start": 290023,
            "end": 290388
        }, {
            "filename": "/assets/blocks/E_LOSE_E",
            "start": 290388,
            "end": 290761
        }, {
            "filename": "/assets/blocks/E_PLAY_EE",
            "start": 290761,
            "end": 291123
        }, {
            "filename": "/assets/blocks/E_SCREENSHOT_EE",
            "start": 291123,
            "end": 291512
        }, {
            "filename": "/assets/blocks/E_SWIPE_EVE",
            "start": 291512,
            "end": 291884
        }, {
            "filename": "/assets/blocks/E_TOUCH_EFFE",
            "start": 291884,
            "end": 292319
        }, {
            "filename": "/assets/blocks/E_WIN_E",
            "start": 292319,
            "end": 292696
        }, {
            "filename": "/assets/blocks/FALSE_T",
            "start": 292696,
            "end": 292943
        }, {
            "filename": "/assets/blocks/FFF_EULER_Q",
            "start": 292943,
            "end": 293332
        }, {
            "filename": "/assets/blocks/FFF_JOIN_V",
            "start": 293332,
            "end": 293719
        }, {
            "filename": "/assets/blocks/FF_ADD_F",
            "start": 293719,
            "end": 294018
        }, {
            "filename": "/assets/blocks/FF_DIV_F",
            "start": 294018,
            "end": 294312
        }, {
            "filename": "/assets/blocks/FF_EQL_T",
            "start": 294312,
            "end": 294613
        }, {
            "filename": "/assets/blocks/FF_GT_T",
            "start": 294613,
            "end": 294922
        }, {
            "filename": "/assets/blocks/FF_LOG_F",
            "start": 294922,
            "end": 295238
        }, {
            "filename": "/assets/blocks/FF_LT_T",
            "start": 295238,
            "end": 295545
        }, {
            "filename": "/assets/blocks/FF_MAX_F",
            "start": 295545,
            "end": 295850
        }, {
            "filename": "/assets/blocks/FF_MIN_F",
            "start": 295850,
            "end": 296156
        }, {
            "filename": "/assets/blocks/FF_MOD_F",
            "start": 296156,
            "end": 296450
        }, {
            "filename": "/assets/blocks/FF_MUL_F",
            "start": 296450,
            "end": 296755
        }, {
            "filename": "/assets/blocks/FF_POW_F",
            "start": 296755,
            "end": 297054
        }, {
            "filename": "/assets/blocks/FF_RANDOM_F",
            "start": 297054,
            "end": 297370
        }, {
            "filename": "/assets/blocks/FF_S2W_VV",
            "start": 297370,
            "end": 297701
        }, {
            "filename": "/assets/blocks/FF_SUB_F",
            "start": 297701,
            "end": 297999
        }, {
            "filename": "/assets/blocks/FLOWERS",
            "start": 297999,
            "end": 298136
        }, {
            "filename": "/assets/blocks/FOLDER_EMPTY",
            "start": 298136,
            "end": 298276
        }, {
            "filename": "/assets/blocks/FOLDER_LOCKED",
            "start": 298276,
            "end": 298469
        }, {
            "filename": "/assets/blocks/FOLDER_UNKNOWN",
            "start": 298469,
            "end": 298634
        }, {
            "filename": "/assets/blocks/FOLIAGE",
            "start": 298634,
            "end": 298726
        }, {
            "filename": "/assets/blocks/FOLIAGE_B",
            "start": 298726,
            "end": 298901
        }, {
            "filename": "/assets/blocks/FOLIAGE_BOT",
            "start": 298901,
            "end": 299034
        }, {
            "filename": "/assets/blocks/FOLIAGE_SLAB",
            "start": 299034,
            "end": 299195
        }, {
            "filename": "/assets/blocks/FOLIAGE_TOP",
            "start": 299195,
            "end": 299324
        }, {
            "filename": "/assets/blocks/FRAME_F",
            "start": 299324,
            "end": 299534
        }, {
            "filename": "/assets/blocks/F_ABS_F",
            "start": 299534,
            "end": 299751
        }, {
            "filename": "/assets/blocks/F_CEIL_F",
            "start": 299751,
            "end": 299969
        }, {
            "filename": "/assets/blocks/F_COS_F",
            "start": 299969,
            "end": 300187
        }, {
            "filename": "/assets/blocks/F_FLOOR_F",
            "start": 300187,
            "end": 300408
        }, {
            "filename": "/assets/blocks/F_NEG_F",
            "start": 300408,
            "end": 300621
        }, {
            "filename": "/assets/blocks/F_ROUND_F",
            "start": 300621,
            "end": 300841
        }, {
            "filename": "/assets/blocks/F_SIN_F",
            "start": 300841,
            "end": 301063
        }, {
            "filename": "/assets/blocks/FpF_LIST_ELEMENT_Fp",
            "start": 301063,
            "end": 301425
        }, {
            "filename": "/assets/blocks/GOAL",
            "start": 301425,
            "end": 301864
        }, {
            "filename": "/assets/blocks/GRASS_A",
            "start": 301864,
            "end": 302007
        }, {
            "filename": "/assets/blocks/GRASS_B",
            "start": 302007,
            "end": 302169
        }, {
            "filename": "/assets/blocks/IO",
            "start": 302169,
            "end": 302273
        }, {
            "filename": "/assets/blocks/L2R",
            "start": 302273,
            "end": 302381
        }, {
            "filename": "/assets/blocks/MARKER",
            "start": 302381,
            "end": 302494
        }, {
            "filename": "/assets/blocks/MOTOR_X",
            "start": 302494,
            "end": 303125
        }, {
            "filename": "/assets/blocks/MOTOR_Y",
            "start": 303125,
            "end": 303982
        }, {
            "filename": "/assets/blocks/MOTOR_Z",
            "start": 303982,
            "end": 304639
        }, {
            "filename": "/assets/blocks/MULTI_IN",
            "start": 304639,
            "end": 304748
        }, {
            "filename": "/assets/blocks/MULTI_IN_E",
            "start": 304748,
            "end": 304861
        }, {
            "filename": "/assets/blocks/MULTI_OUT",
            "start": 304861,
            "end": 304973
        }, {
            "filename": "/assets/blocks/MULTI_OUT_E",
            "start": 304973,
            "end": 305088
        }, {
            "filename": "/assets/blocks/NONE",
            "start": 305088,
            "end": 305298
        }, {
            "filename": "/assets/blocks/NUMBER_F",
            "start": 305298,
            "end": 305547
        }, {
            "filename": "/assets/blocks/OBSTACLE",
            "start": 305547,
            "end": 305675
        }, {
            "filename": "/assets/blocks/OO_EQL_T",
            "start": 305675,
            "end": 305978
        }, {
            "filename": "/assets/blocks/O_GET_POS_VQ",
            "start": 305978,
            "end": 306312
        }, {
            "filename": "/assets/blocks/O_GET_SIZE_VV",
            "start": 306312,
            "end": 306636
        }, {
            "filename": "/assets/blocks/O_GET_VEL_VV",
            "start": 306636,
            "end": 306968
        }, {
            "filename": "/assets/blocks/OpF_LIST_ELEMENT_Op",
            "start": 306968,
            "end": 307329
        }, {
            "filename": "/assets/blocks/PARTICLE",
            "start": 307329,
            "end": 307441
        }, {
            "filename": "/assets/blocks/PASS_THROUGH",
            "start": 307441,
            "end": 307565
        }, {
            "filename": "/assets/blocks/QQF_LERP_Q",
            "start": 307565,
            "end": 307954
        }, {
            "filename": "/assets/blocks/QQ_MUL_Q",
            "start": 307954,
            "end": 308257
        }, {
            "filename": "/assets/blocks/QUATERNION_Q",
            "start": 308257,
            "end": 308602
        }, {
            "filename": "/assets/blocks/Q_EULER_FFF",
            "start": 308602,
            "end": 308991
        }, {
            "filename": "/assets/blocks/Q_INV_Q",
            "start": 308991,
            "end": 309206
        }, {
            "filename": "/assets/blocks/QpF_LIST_ELEMENT_Qp",
            "start": 309206,
            "end": 309570
        }, {
            "filename": "/assets/blocks/SCREEN_SIZE_FF",
            "start": 309570,
            "end": 309885
        }, {
            "filename": "/assets/blocks/SCRIPT",
            "start": 309885,
            "end": 310031
        }, {
            "filename": "/assets/blocks/SFX_Fp",
            "start": 310031,
            "end": 310353
        }, {
            "filename": "/assets/blocks/SHRUB",
            "start": 310353,
            "end": 310552
        }, {
            "filename": "/assets/blocks/SLATE",
            "start": 310552,
            "end": 310646
        }, {
            "filename": "/assets/blocks/SLATE_B",
            "start": 310646,
            "end": 310851
        }, {
            "filename": "/assets/blocks/SLATE_BOT",
            "start": 310851,
            "end": 310989
        }, {
            "filename": "/assets/blocks/SLATE_NE",
            "start": 310989,
            "end": 311102
        }, {
            "filename": "/assets/blocks/SLATE_NW",
            "start": 311102,
            "end": 311222
        }, {
            "filename": "/assets/blocks/SLATE_SE",
            "start": 311222,
            "end": 311338
        }, {
            "filename": "/assets/blocks/SLATE_SW",
            "start": 311338,
            "end": 311458
        }, {
            "filename": "/assets/blocks/SLATE_TOP",
            "start": 311458,
            "end": 311582
        }, {
            "filename": "/assets/blocks/SLIDER",
            "start": 311582,
            "end": 313484
        }, {
            "filename": "/assets/blocks/SLIDER_X",
            "start": 313484,
            "end": 313764
        }, {
            "filename": "/assets/blocks/SLIDER_Y",
            "start": 313764,
            "end": 314085
        }, {
            "filename": "/assets/blocks/SLIDER_Z",
            "start": 314085,
            "end": 314383
        }, {
            "filename": "/assets/blocks/SPHERE",
            "start": 314383,
            "end": 314523
        }, {
            "filename": "/assets/blocks/STEEL",
            "start": 314523,
            "end": 314663
        }, {
            "filename": "/assets/blocks/STICK_DE",
            "start": 314663,
            "end": 314814
        }, {
            "filename": "/assets/blocks/STICK_DN",
            "start": 314814,
            "end": 314966
        }, {
            "filename": "/assets/blocks/STICK_DS",
            "start": 314966,
            "end": 315123
        }, {
            "filename": "/assets/blocks/STICK_DW",
            "start": 315123,
            "end": 315281
        }, {
            "filename": "/assets/blocks/STICK_NE",
            "start": 315281,
            "end": 315435
        }, {
            "filename": "/assets/blocks/STICK_NW",
            "start": 315435,
            "end": 315598
        }, {
            "filename": "/assets/blocks/STICK_SE",
            "start": 315598,
            "end": 315755
        }, {
            "filename": "/assets/blocks/STICK_SW",
            "start": 315755,
            "end": 315915
        }, {
            "filename": "/assets/blocks/STICK_UE",
            "start": 315915,
            "end": 316069
        }, {
            "filename": "/assets/blocks/STICK_UN",
            "start": 316069,
            "end": 316239
        }, {
            "filename": "/assets/blocks/STICK_US",
            "start": 316239,
            "end": 316396
        }, {
            "filename": "/assets/blocks/STICK_UW",
            "start": 316396,
            "end": 316551
        }, {
            "filename": "/assets/blocks/STICK_X",
            "start": 316551,
            "end": 316693
        }, {
            "filename": "/assets/blocks/STICK_Y",
            "start": 316693,
            "end": 316842
        }, {
            "filename": "/assets/blocks/STICK_Z",
            "start": 316842,
            "end": 316980
        }, {
            "filename": "/assets/blocks/STONE",
            "start": 316980,
            "end": 317074
        }, {
            "filename": "/assets/blocks/STONE_B",
            "start": 317074,
            "end": 317251
        }, {
            "filename": "/assets/blocks/STONE_BLOCK",
            "start": 317251,
            "end": 317449
        }, {
            "filename": "/assets/blocks/STONE_BOT",
            "start": 317449,
            "end": 317587
        }, {
            "filename": "/assets/blocks/STONE_LOWER",
            "start": 317587,
            "end": 317728
        }, {
            "filename": "/assets/blocks/STONE_PILLAR",
            "start": 317728,
            "end": 317883
        }, {
            "filename": "/assets/blocks/STONE_SLAB",
            "start": 317883,
            "end": 318031
        }, {
            "filename": "/assets/blocks/STONE_TOP",
            "start": 318031,
            "end": 318156
        }, {
            "filename": "/assets/blocks/SWIPE_CHICK",
            "start": 318156,
            "end": 320933
        }, {
            "filename": "/assets/blocks/THIS_O",
            "start": 320933,
            "end": 321048
        }, {
            "filename": "/assets/blocks/TILT_BALL",
            "start": 321048,
            "end": 321295
        }, {
            "filename": "/assets/blocks/TRUE_T",
            "start": 321295,
            "end": 321541
        }, {
            "filename": "/assets/blocks/TT_AND_T",
            "start": 321541,
            "end": 321834
        }, {
            "filename": "/assets/blocks/TT_EQL_T",
            "start": 321834,
            "end": 322135
        }, {
            "filename": "/assets/blocks/TT_OR_T",
            "start": 322135,
            "end": 322426
        }, {
            "filename": "/assets/blocks/T_NOT_T",
            "start": 322426,
            "end": 322640
        }, {
            "filename": "/assets/blocks/TpF_LIST_ELEMENT_Tp",
            "start": 322640,
            "end": 323002
        }, {
            "filename": "/assets/blocks/VAR_Cp",
            "start": 323002,
            "end": 323255
        }, {
            "filename": "/assets/blocks/VAR_Fp",
            "start": 323255,
            "end": 323504
        }, {
            "filename": "/assets/blocks/VAR_Op",
            "start": 323504,
            "end": 323754
        }, {
            "filename": "/assets/blocks/VAR_Qp",
            "start": 323754,
            "end": 324006
        }, {
            "filename": "/assets/blocks/VAR_Tp",
            "start": 324006,
            "end": 324256
        }, {
            "filename": "/assets/blocks/VAR_Vp",
            "start": 324256,
            "end": 324506
        }, {
            "filename": "/assets/blocks/VECTOR_V",
            "start": 324506,
            "end": 324849
        }, {
            "filename": "/assets/blocks/VF_AXIS_ANG_Q",
            "start": 324849,
            "end": 325174
        }, {
            "filename": "/assets/blocks/VF_MUL_V",
            "start": 325174,
            "end": 325475
        }, {
            "filename": "/assets/blocks/VQ_MUL_V",
            "start": 325475,
            "end": 325777
        }, {
            "filename": "/assets/blocks/VVVV_LINE_VS_PLANE_V",
            "start": 325777,
            "end": 326222
        }, {
            "filename": "/assets/blocks/VV_ADD_V",
            "start": 326222,
            "end": 326521
        }, {
            "filename": "/assets/blocks/VV_CROSS_V",
            "start": 326521,
            "end": 326826
        }, {
            "filename": "/assets/blocks/VV_DIST_F",
            "start": 326826,
            "end": 327125
        }, {
            "filename": "/assets/blocks/VV_DOT_F",
            "start": 327125,
            "end": 327438
        }, {
            "filename": "/assets/blocks/VV_EQL_T",
            "start": 327438,
            "end": 327740
        }, {
            "filename": "/assets/blocks/VV_LOOK_ROT_Q",
            "start": 327740,
            "end": 328067
        }, {
            "filename": "/assets/blocks/VV_RAYCAST_TVO",
            "start": 328067,
            "end": 328452
        }, {
            "filename": "/assets/blocks/VV_SUB_V",
            "start": 328452,
            "end": 328750
        }, {
            "filename": "/assets/blocks/V_NORMALIZE_V",
            "start": 328750,
            "end": 328974
        }, {
            "filename": "/assets/blocks/V_SPLIT_FFF",
            "start": 328974,
            "end": 329360
        }, {
            "filename": "/assets/blocks/V_W2S_FF",
            "start": 329360,
            "end": 329692
        }, {
            "filename": "/assets/blocks/VpF_LIST_ELEMENT_Vp",
            "start": 329692,
            "end": 330055
        }, {
            "filename": "/assets/blocks/WHEEL",
            "start": 330055,
            "end": 331796
        }, {
            "filename": "/assets/blocks/WOOD_LOWER_X",
            "start": 331796,
            "end": 331987
        }, {
            "filename": "/assets/blocks/WOOD_LOWER_Z",
            "start": 331987,
            "end": 332177
        }, {
            "filename": "/assets/blocks/WOOD_UPPER_X",
            "start": 332177,
            "end": 332368
        }, {
            "filename": "/assets/blocks/WOOD_UPPER_Z",
            "start": 332368,
            "end": 332558
        }, {
            "filename": "/assets/blocks/WOOD_X",
            "start": 332558,
            "end": 332733
        }, {
            "filename": "/assets/blocks/WOOD_Y",
            "start": 332733,
            "end": 332923
        }, {
            "filename": "/assets/blocks/WOOD_Z",
            "start": 332923,
            "end": 333094
        }, {
            "filename": "/assets/db",
            "start": 333094,
            "end": 333336
        }, {
            "filename": "/assets/games/5E72248DB8B551A1",
            "start": 333336,
            "end": 351780
        }, {
            "filename": "/assets/games/menu",
            "start": 351780,
            "end": 357375
        }, {
            "filename": "/assets/sounds/125404_clang.wav",
            "start": 357375,
            "end": 370447,
            "audio": 1
        }, {
            "filename": "/assets/sounds/146721_ui_beep.wav",
            "start": 370447,
            "end": 374949,
            "audio": 1
        }, {
            "filename": "/assets/sounds/194795_ui_button.wav",
            "start": 374949,
            "end": 377051,
            "audio": 1
        }, {
            "filename": "/assets/sounds/257357_button.wav",
            "start": 377051,
            "end": 378415,
            "audio": 1
        }, {
            "filename": "/assets/sounds/363090_coin.wav",
            "start": 378415,
            "end": 383173,
            "audio": 1
        }, {
            "filename": "/assets/sounds/378355_ball.wav",
            "start": 383173,
            "end": 391339,
            "audio": 1
        }, {
            "filename": "/assets/sounds/399095_jump.wav",
            "start": 391339,
            "end": 396717,
            "audio": 1
        }, {
            "filename": "/assets/sounds/521481_camera.wav",
            "start": 396717,
            "end": 412149,
            "audio": 1
        }, {
            "filename": "/assets/sounds/chaching.wav",
            "start": 412149,
            "end": 461429,
            "audio": 1
        }, {
            "filename": "/assets/sounds/coin02_band.wav",
            "start": 461429,
            "end": 473413,
            "audio": 1
        }, {
            "filename": "/assets/sounds/error1.wav",
            "start": 473413,
            "end": 494673,
            "audio": 1
        }, {
            "filename": "/assets/sounds/floor6.wav",
            "start": 494673,
            "end": 525697,
            "audio": 1
        }, {
            "filename": "/assets/views/baloo2.woff",
            "start": 525697,
            "end": 549769
        }, {
            "filename": "/assets/views/block_settings.html",
            "start": 549769,
            "end": 551758
        }, {
            "filename": "/assets/views/common.css",
            "start": 551758,
            "end": 557031
        }, {
            "filename": "/assets/views/common.js",
            "start": 557031,
            "end": 564702
        }, {
            "filename": "/assets/views/confirm_deletion.html",
            "start": 564702,
            "end": 566993
        }, {
            "filename": "/assets/views/create_user.html",
            "start": 566993,
            "end": 569151
        }, {
            "filename": "/assets/views/editor_script.html",
            "start": 569151,
            "end": 577161
        }, {
            "filename": "/assets/views/editor_script_blockly.html",
            "start": 577161,
            "end": 589587
        }, {
            "filename": "/assets/views/game_moderation.html",
            "start": 589587,
            "end": 594101
        }, {
            "filename": "/assets/views/messagebox.html",
            "start": 594101,
            "end": 596140
        }, {
            "filename": "/assets/views/select_level.html",
            "start": 596140,
            "end": 608441
        }, {
            "filename": "/assets/views/show_hint.html",
            "start": 608441,
            "end": 609883
        }, {
            "filename": "/assets/views/sign_in.html",
            "start": 609883,
            "end": 612284
        }, {
            "filename": "/bundle_games.txt",
            "start": 612284,
            "end": 612300
        }],
        "remote_package_size": 612300
    })
}
)();
var moduleOverrides = Object.assign({}, Module);
var arguments_ = [];
var thisProgram = "./this.program";
var quit_ = (status,toThrow)=>{
    throw toThrow
}
;
var ENVIRONMENT_IS_WEB = typeof window == "object";
var ENVIRONMENT_IS_WORKER = typeof importScripts == "function";
var ENVIRONMENT_IS_NODE = typeof process == "object" && typeof process.versions == "object" && typeof process.versions.node == "string";
var scriptDirectory = "";
function locateFile(path) {
    if (Module["locateFile"]) {
        return Module["locateFile"](path, scriptDirectory)
    }
    return scriptDirectory + path
}
var read_, readAsync, readBinary;
if (ENVIRONMENT_IS_NODE) {
    var fs = require("fs");
    var nodePath = require("path");
    if (ENVIRONMENT_IS_WORKER) {
        scriptDirectory = nodePath.dirname(scriptDirectory) + "/"
    } else {
        scriptDirectory = __dirname + "/"
    }
    read_ = (filename,binary)=>{
        filename = isFileURI(filename) ? new URL(filename) : nodePath.normalize(filename);
        return fs.readFileSync(filename, binary ? undefined : "utf8")
    }
    ;
    readBinary = filename=>{
        var ret = read_(filename, true);
        if (!ret.buffer) {
            ret = new Uint8Array(ret)
        }
        return ret
    }
    ;
    readAsync = (filename,onload,onerror,binary=true)=>{
        filename = isFileURI(filename) ? new URL(filename) : nodePath.normalize(filename);
        fs.readFile(filename, binary ? undefined : "utf8", (err,data)=>{
            if (err)
                onerror(err);
            else
                onload(binary ? data.buffer : data)
        }
        )
    }
    ;
    if (!Module["thisProgram"] && process.argv.length > 1) {
        thisProgram = process.argv[1].replace(/\\/g, "/")
    }
    arguments_ = process.argv.slice(2);
    if (typeof module != "undefined") {
        module["exports"] = Module
    }
    process.on("uncaughtException", ex=>{
        if (ex !== "unwind" && !(ex instanceof ExitStatus) && !(ex.context instanceof ExitStatus)) {
            throw ex
        }
    }
    );
    quit_ = (status,toThrow)=>{
        process.exitCode = status;
        throw toThrow
    }
    ;
    Module["inspect"] = ()=>"[Emscripten Module object]"
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
    if (ENVIRONMENT_IS_WORKER) {
        scriptDirectory = self.location.href
    } else if (typeof document != "undefined" && document.currentScript) {
        scriptDirectory = document.currentScript.src
    }
    if (scriptDirectory.indexOf("blob:") !== 0) {
        scriptDirectory = scriptDirectory.substr(0, scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1)
    } else {
        scriptDirectory = ""
    }
    {
        read_ = url=>{
            var xhr = new XMLHttpRequest;
            xhr.open("GET", url, false);
            xhr.send(null);
            return xhr.responseText
        }
        ;
        if (ENVIRONMENT_IS_WORKER) {
            readBinary = url=>{
                var xhr = new XMLHttpRequest;
                xhr.open("GET", url, false);
                xhr.responseType = "arraybuffer";
                xhr.send(null);
                return new Uint8Array(xhr.response)
            }
        }
        readAsync = (url,onload,onerror)=>{
            var xhr = new XMLHttpRequest;
            xhr.open("GET", url, true);
            xhr.responseType = "arraybuffer";
            xhr.onload = ()=>{
                if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
                    onload(xhr.response);
                    return
                }
                onerror()
            }
            ;
            xhr.onerror = onerror;
            xhr.send(null)
        }
    }
} else {}
var out = Module["print"] || console.log.bind(console);
var err = Module["printErr"] || console.error.bind(console);
Object.assign(Module, moduleOverrides);
moduleOverrides = null;
if (Module["arguments"])
    arguments_ = Module["arguments"];
if (Module["thisProgram"])
    thisProgram = Module["thisProgram"];
if (Module["quit"])
    quit_ = Module["quit"];
var wasmBinary;
if (Module["wasmBinary"])
    wasmBinary = Module["wasmBinary"];
if (typeof WebAssembly != "object") {
    abort("no native wasm support detected")
}
var wasmMemory;
var ABORT = false;
var EXITSTATUS;
function assert(condition, text) {
    if (!condition) {
        abort(text)
    }
}
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
function updateMemoryViews() {
    var b = wasmMemory.buffer;
    Module["HEAP8"] = HEAP8 = new Int8Array(b);
    Module["HEAP16"] = HEAP16 = new Int16Array(b);
    Module["HEAPU8"] = HEAPU8 = new Uint8Array(b);
    Module["HEAPU16"] = HEAPU16 = new Uint16Array(b);
    Module["HEAP32"] = HEAP32 = new Int32Array(b);
    Module["HEAPU32"] = HEAPU32 = new Uint32Array(b);
    Module["HEAPF32"] = HEAPF32 = new Float32Array(b);
    Module["HEAPF64"] = HEAPF64 = new Float64Array(b)
}
var __ATPRERUN__ = [];
var __ATINIT__ = [];
var __ATMAIN__ = [];
var __ATEXIT__ = [];
var __ATPOSTRUN__ = [];
var runtimeInitialized = false;
function preRun() {
    if (Module["preRun"]) {
        if (typeof Module["preRun"] == "function")
            Module["preRun"] = [Module["preRun"]];
        while (Module["preRun"].length) {
            addOnPreRun(Module["preRun"].shift())
        }
    }
    callRuntimeCallbacks(__ATPRERUN__)
}
function initRuntime() {
    runtimeInitialized = true;
    if (!Module["noFSInit"] && !FS.init.initialized)
        FS.init();
    FS.ignorePermissions = false;
    TTY.init();
    callRuntimeCallbacks(__ATINIT__)
}
function preMain() {
    callRuntimeCallbacks(__ATMAIN__)
}
function postRun() {
    if (Module["postRun"]) {
        if (typeof Module["postRun"] == "function")
            Module["postRun"] = [Module["postRun"]];
        while (Module["postRun"].length) {
            addOnPostRun(Module["postRun"].shift())
        }
    }
    callRuntimeCallbacks(__ATPOSTRUN__)
}
function addOnPreRun(cb) {
    __ATPRERUN__.unshift(cb)
}
function addOnInit(cb) {
    __ATINIT__.unshift(cb)
}
function addOnPostRun(cb) {
    __ATPOSTRUN__.unshift(cb)
}
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null;
function getUniqueRunDependency(id) {
    return id
}
function addRunDependency(id) {
    runDependencies++;
    Module["monitorRunDependencies"]?.(runDependencies)
}
function removeRunDependency(id) {
    runDependencies--;
    Module["monitorRunDependencies"]?.(runDependencies);
    if (runDependencies == 0) {
        if (runDependencyWatcher !== null) {
            clearInterval(runDependencyWatcher);
            runDependencyWatcher = null
        }
        if (dependenciesFulfilled) {
            var callback = dependenciesFulfilled;
            dependenciesFulfilled = null;
            callback()
        }
    }
}
function abort(what) {
    Module["onAbort"]?.(what);
    what = "Aborted(" + what + ")";
    err(what);
    ABORT = true;
    EXITSTATUS = 1;
    what += ". Build with -sASSERTIONS for more info.";
    var e = new WebAssembly.RuntimeError(what);
    throw e
}
var dataURIPrefix = "data:application/octet-stream;base64,";
var isDataURI = filename=>filename.startsWith(dataURIPrefix);
var isFileURI = filename=>filename.startsWith("file://");
var wasmBinaryFile;
wasmBinaryFile = "index.wasm";
if (!isDataURI(wasmBinaryFile)) {
    wasmBinaryFile = locateFile(wasmBinaryFile)
}
function getBinarySync(file) {
    if (file == wasmBinaryFile && wasmBinary) {
        return new Uint8Array(wasmBinary)
    }
    if (readBinary) {
        return readBinary(file)
    }
    throw "both async and sync fetching of the wasm failed"
}
function getBinaryPromise(binaryFile) {
    if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER)) {
        if (typeof fetch == "function" && !isFileURI(binaryFile)) {
            return fetch(binaryFile, {
                credentials: "same-origin"
            }).then(response=>{
                if (!response["ok"]) {
                    throw "failed to load wasm binary file at '" + binaryFile + "'"
                }
                return response["arrayBuffer"]()
            }
            ).catch(()=>getBinarySync(binaryFile))
        } else if (readAsync) {
            return new Promise((resolve,reject)=>{
                readAsync(binaryFile, response=>resolve(new Uint8Array(response)), reject)
            }
            )
        }
    }
    return Promise.resolve().then(()=>getBinarySync(binaryFile))
}
function instantiateArrayBuffer(binaryFile, imports, receiver) {
    return getBinaryPromise(binaryFile).then(binary=>WebAssembly.instantiate(binary, imports)).then(instance=>instance).then(receiver, reason=>{
        err(`failed to asynchronously prepare wasm: ${reason}`);
        abort(reason)
    }
    )
}
function instantiateAsync(binary, binaryFile, imports, callback) {
    if (!binary && typeof WebAssembly.instantiateStreaming == "function" && !isDataURI(binaryFile) && !isFileURI(binaryFile) && !ENVIRONMENT_IS_NODE && typeof fetch == "function") {
        return fetch(binaryFile, {
            credentials: "same-origin"
        }).then(response=>{
            var result = WebAssembly.instantiateStreaming(response, imports);
            return result.then(callback, function(reason) {
                err(`wasm streaming compile failed: ${reason}`);
                err("falling back to ArrayBuffer instantiation");
                return instantiateArrayBuffer(binaryFile, imports, callback)
            })
        }
        )
    }
    return instantiateArrayBuffer(binaryFile, imports, callback)
}
function createWasm() {
    var info = {
        "a": wasmImports
    };
    function receiveInstance(instance, module) {
        wasmExports = instance.exports;
        wasmMemory = wasmExports["$a"];
        updateMemoryViews();
        wasmTable = wasmExports["db"];
        addOnInit(wasmExports["ab"]);
        removeRunDependency("wasm-instantiate");
        return wasmExports
    }
    addRunDependency("wasm-instantiate");
    function receiveInstantiationResult(result) {
        receiveInstance(result["instance"])
    }
    if (Module["instantiateWasm"]) {
        try {
            return Module["instantiateWasm"](info, receiveInstance)
        } catch (e) {
            err(`Module.instantiateWasm callback failed with error: ${e}`);
            return false
        }
    }
    instantiateAsync(wasmBinary, wasmBinaryFile, info, receiveInstantiationResult);
    return {}
}
var tempDouble;
var tempI64;
var ASM_CONSTS = {
    577592: ($0,$1,$2)=>{
        fetchUrl(UTF8ToString($0), $1, $2)
    }
    ,
    577629: $0=>{
        webViewOpen(UTF8ToString($0))
    }
    ,
    577662: ()=>{
        webViewClose()
    }
    ,
    577680: $0=>{
        webViewExecuteJS(UTF8ToString($0))
    }
    ,
    577718: ($0,$1)=>{
        Audio.init($0, $1)
    }
    ,
    577742: ()=>{
        Audio.deinit()
    }
    ,
    577762: ()=>{
        Audio.pause()
    }
    ,
    577781: ()=>{
        Audio.resume()
    }
    ,
    577801: ()=>{
        hideOverlayGradient()
    }
    ,
    577826: ()=>{
        if (fsSyncStatus === "to")
            return;
        fsSyncStatus = "to";
        FS.syncfs(false, function(err) {
            if (err) {
                simpleLogC("syncfs error " + err)
            }
            fsSyncStatus = ""
        })
    }
    ,
    577987: ()=>{
        if (fsSyncStatus === "from")
            return;
        fsSyncStatus = "from";
        FS.syncfs(true, function(err) {
            if (err) {
                simpleLogC("syncfs error " + err)
            }
            fsSyncStatus = ""
        })
    }
    ,
    578151: ()=>{
        firebaseSignout()
    }
    ,
    578172: ()=>{
        adInit()
    }
    ,
    578186: ()=>{
        adInterstitialShow()
    }
    ,
    578212: ()=>{
        adRewardedShow()
    }
    ,
    578234: ()=>{
        adInterstitialLoad()
    }
    ,
    578260: ()=>{
        adInterstitialShow()
    }
    ,
    578286: ()=>{
        adRewardedLoad()
    }
    ,
    578308: ($0,$1,$2)=>{
        adRewardedShow(UTF8ToString($0), UTF8ToString($1), UTF8ToString($2))
    }
    ,
    578382: ()=>{
        adInit()
    }
    ,
    578396: ($0,$1,$2)=>{
        showShareFileModal(UTF8ToString($0), UTF8ToString($1), UTF8ToString($2))
    }
    ,
    578471: $0=>{
        window.open(UTF8ToString($0), "_blank")
    }
    ,
    578516: ()=>{
        location.reload()
    }
    ,
    578539: ($0,$1,$2,$3)=>{
        showStoreLinkModal(UTF8ToString($0), $1, $2, $3)
    }
    ,
    578591: ()=>{
        FS.mkdir("/sandbox");
        FS.mount(IDBFS, {}, "/sandbox");
        FS.syncfs(true, function(err) {
            if (err) {
                simpleLogC("syncfs error " + err)
            }
            try {
                ccall("app_init", "v")
            } catch (err) {
                let play_content = document.getElementById("play_content");
                let error_text = document.createElement("p");
                error_text.classList.add("error_message");
                error_text.textContent = err;
                play_content.appendChild(error_text);
                throw err
            }
            hideOverlay()
        })
    }
    ,
    579026: ()=>document.getElementById("canvas").width,
    579076: ()=>document.getElementById("canvas").height,
    579127: $0=>{
        downloadFileInBrowser(UTF8ToString($0))
    }
    ,
    579169: ()=>{
        hideOverlayGradient()
    }
    ,
    579194: $0=>{
        setDeepLinkLoadingFraction($0)
    }
    ,
    579227: ()=>{
        try {
            PokiSDK.customEvent("game", "segment", {
                label: "level",
                value: li.toString()
            })
        } catch (err) {}
        pokiSendLevelData()
    }
    ,
    579357: ()=>{
        pokiEnsureStop()
    }
    ,
    579379: ()=>{
        pokiEnsureStart()
    }
    ,
    579402: $0=>{
        Storage.init($0)
    }
    ,
    579424: $0=>{
        Storage.remove($0)
    }
    ,
    579448: ($0,$1,$2)=>{
        Storage.write($0, $1, $2)
    }
    ,
    579479: ($0,$1)=>{
        checkHintFileExist(UTF8ToString($0), $1)
    }
};
function is_daily_reward_possible() {
    return dailyRewardPossible
}
function is_latest_browser_tab() {
    try {
        return localStorage["startup-time"] == startupTimeStr
    } catch (err) {
        return true
    }
}
function set_latest_browser_tab() {
    startupTimeStr = Date.now().toString();
    try {
        localStorage["startup-time"] = startupTimeStr
    } catch (err) {}
}
function get_device_pixel_ratio() {
    return window.devicePixelRatio
}
function get_hostname() {
    return getHostname()
}
function get_url_level_index() {
    return getUrlLevelIndex()
}
function ExitStatus(status) {
    this.name = "ExitStatus";
    this.message = `Program terminated with exit(${status})`;
    this.status = status
}
var callRuntimeCallbacks = callbacks=>{
    while (callbacks.length > 0) {
        callbacks.shift()(Module)
    }
}
;
function getValue(ptr, type="i8") {
    if (type.endsWith("*"))
        type = "*";
    switch (type) {
    case "i1":
        return HEAP8[ptr >> 0];
    case "i8":
        return HEAP8[ptr >> 0];
    case "i16":
        return HEAP16[ptr >> 1];
    case "i32":
        return HEAP32[ptr >> 2];
    case "i64":
        abort("to do getValue(i64) use WASM_BIGINT");
    case "float":
        return HEAPF32[ptr >> 2];
    case "double":
        return HEAPF64[ptr >> 3];
    case "*":
        return HEAPU32[ptr >> 2];
    default:
        abort(`invalid type for getValue: ${type}`)
    }
}
var noExitRuntime = Module["noExitRuntime"] || true;
var UTF8Decoder = typeof TextDecoder != "undefined" ? new TextDecoder("utf8") : undefined;
var UTF8ArrayToString = (heapOrArray,idx,maxBytesToRead)=>{
    var endIdx = idx + maxBytesToRead;
    var endPtr = idx;
    while (heapOrArray[endPtr] && !(endPtr >= endIdx))
        ++endPtr;
    if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
        return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr))
    }
    var str = "";
    while (idx < endPtr) {
        var u0 = heapOrArray[idx++];
        if (!(u0 & 128)) {
            str += String.fromCharCode(u0);
            continue
        }
        var u1 = heapOrArray[idx++] & 63;
        if ((u0 & 224) == 192) {
            str += String.fromCharCode((u0 & 31) << 6 | u1);
            continue
        }
        var u2 = heapOrArray[idx++] & 63;
        if ((u0 & 240) == 224) {
            u0 = (u0 & 15) << 12 | u1 << 6 | u2
        } else {
            u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heapOrArray[idx++] & 63
        }
        if (u0 < 65536) {
            str += String.fromCharCode(u0)
        } else {
            var ch = u0 - 65536;
            str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023)
        }
    }
    return str
}
;
var UTF8ToString = (ptr,maxBytesToRead)=>ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : "";
var ___assert_fail = (condition,filename,line,func)=>{
    abort(`Assertion failed: ${UTF8ToString(condition)}, at: ` + [filename ? UTF8ToString(filename) : "unknown filename", line, func ? UTF8ToString(func) : "unknown function"])
}
;
var PATH = {
    isAbs: path=>path.charAt(0) === "/",
    splitPath: filename=>{
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1)
    }
    ,
    normalizeArray: (parts,allowAboveRoot)=>{
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
            var last = parts[i];
            if (last === ".") {
                parts.splice(i, 1)
            } else if (last === "..") {
                parts.splice(i, 1);
                up++
            } else if (up) {
                parts.splice(i, 1);
                up--
            }
        }
        if (allowAboveRoot) {
            for (; up; up--) {
                parts.unshift("..")
            }
        }
        return parts
    }
    ,
    normalize: path=>{
        var isAbsolute = PATH.isAbs(path)
          , trailingSlash = path.substr(-1) === "/";
        path = PATH.normalizeArray(path.split("/").filter(p=>!!p), !isAbsolute).join("/");
        if (!path && !isAbsolute) {
            path = "."
        }
        if (path && trailingSlash) {
            path += "/"
        }
        return (isAbsolute ? "/" : "") + path
    }
    ,
    dirname: path=>{
        var result = PATH.splitPath(path)
          , root = result[0]
          , dir = result[1];
        if (!root && !dir) {
            return "."
        }
        if (dir) {
            dir = dir.substr(0, dir.length - 1)
        }
        return root + dir
    }
    ,
    basename: path=>{
        if (path === "/")
            return "/";
        path = PATH.normalize(path);
        path = path.replace(/\/$/, "");
        var lastSlash = path.lastIndexOf("/");
        if (lastSlash === -1)
            return path;
        return path.substr(lastSlash + 1)
    }
    ,
    join: function() {
        var paths = Array.prototype.slice.call(arguments);
        return PATH.normalize(paths.join("/"))
    },
    join2: (l,r)=>PATH.normalize(l + "/" + r)
};
var initRandomFill = ()=>{
    if (typeof crypto == "object" && typeof crypto["getRandomValues"] == "function") {
        return view=>crypto.getRandomValues(view)
    } else if (ENVIRONMENT_IS_NODE) {
        try {
            var crypto_module = require("crypto");
            var randomFillSync = crypto_module["randomFillSync"];
            if (randomFillSync) {
                return view=>crypto_module["randomFillSync"](view)
            }
            var randomBytes = crypto_module["randomBytes"];
            return view=>(view.set(randomBytes(view.byteLength)),
            view)
        } catch (e) {}
    }
    abort("initRandomDevice")
}
;
var randomFill = view=>(randomFill = initRandomFill())(view);
var PATH_FS = {
    resolve: function() {
        var resolvedPath = ""
          , resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
            var path = i >= 0 ? arguments[i] : FS.cwd();
            if (typeof path != "string") {
                throw new TypeError("Arguments to path.resolve must be strings")
            } else if (!path) {
                return ""
            }
            resolvedPath = path + "/" + resolvedPath;
            resolvedAbsolute = PATH.isAbs(path)
        }
        resolvedPath = PATH.normalizeArray(resolvedPath.split("/").filter(p=>!!p), !resolvedAbsolute).join("/");
        return (resolvedAbsolute ? "/" : "") + resolvedPath || "."
    },
    relative: (from,to)=>{
        from = PATH_FS.resolve(from).substr(1);
        to = PATH_FS.resolve(to).substr(1);
        function trim(arr) {
            var start = 0;
            for (; start < arr.length; start++) {
                if (arr[start] !== "")
                    break
            }
            var end = arr.length - 1;
            for (; end >= 0; end--) {
                if (arr[end] !== "")
                    break
            }
            if (start > end)
                return [];
            return arr.slice(start, end - start + 1)
        }
        var fromParts = trim(from.split("/"));
        var toParts = trim(to.split("/"));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
            if (fromParts[i] !== toParts[i]) {
                samePartsLength = i;
                break
            }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
            outputParts.push("..")
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join("/")
    }
};
var FS_stdin_getChar_buffer = [];
var lengthBytesUTF8 = str=>{
    var len = 0;
    for (var i = 0; i < str.length; ++i) {
        var c = str.charCodeAt(i);
        if (c <= 127) {
            len++
        } else if (c <= 2047) {
            len += 2
        } else if (c >= 55296 && c <= 57343) {
            len += 4;
            ++i
        } else {
            len += 3
        }
    }
    return len
}
;
var stringToUTF8Array = (str,heap,outIdx,maxBytesToWrite)=>{
    if (!(maxBytesToWrite > 0))
        return 0;
    var startIdx = outIdx;
    var endIdx = outIdx + maxBytesToWrite - 1;
    for (var i = 0; i < str.length; ++i) {
        var u = str.charCodeAt(i);
        if (u >= 55296 && u <= 57343) {
            var u1 = str.charCodeAt(++i);
            u = 65536 + ((u & 1023) << 10) | u1 & 1023
        }
        if (u <= 127) {
            if (outIdx >= endIdx)
                break;
            heap[outIdx++] = u
        } else if (u <= 2047) {
            if (outIdx + 1 >= endIdx)
                break;
            heap[outIdx++] = 192 | u >> 6;
            heap[outIdx++] = 128 | u & 63
        } else if (u <= 65535) {
            if (outIdx + 2 >= endIdx)
                break;
            heap[outIdx++] = 224 | u >> 12;
            heap[outIdx++] = 128 | u >> 6 & 63;
            heap[outIdx++] = 128 | u & 63
        } else {
            if (outIdx + 3 >= endIdx)
                break;
            heap[outIdx++] = 240 | u >> 18;
            heap[outIdx++] = 128 | u >> 12 & 63;
            heap[outIdx++] = 128 | u >> 6 & 63;
            heap[outIdx++] = 128 | u & 63
        }
    }
    heap[outIdx] = 0;
    return outIdx - startIdx
}
;
function intArrayFromString(stringy, dontAddNull, length) {
    var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
    var u8array = new Array(len);
    var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
    if (dontAddNull)
        u8array.length = numBytesWritten;
    return u8array
}
var FS_stdin_getChar = ()=>{
    if (!FS_stdin_getChar_buffer.length) {
        var result = null;
        if (ENVIRONMENT_IS_NODE) {
            var BUFSIZE = 256;
            var buf = Buffer.alloc(BUFSIZE);
            var bytesRead = 0;
            var fd = process.stdin.fd;
            try {
                bytesRead = fs.readSync(fd, buf)
            } catch (e) {
                if (e.toString().includes("EOF"))
                    bytesRead = 0;
                else
                    throw e
            }
            if (bytesRead > 0) {
                result = buf.slice(0, bytesRead).toString("utf-8")
            } else {
                result = null
            }
        } else if (typeof window != "undefined" && typeof window.prompt == "function") {
            result = window.prompt("Input: ");
            if (result !== null) {
                result += "\n"
            }
        } else if (typeof readline == "function") {
            result = readline();
            if (result !== null) {
                result += "\n"
            }
        }
        if (!result) {
            return null
        }
        FS_stdin_getChar_buffer = intArrayFromString(result, true)
    }
    return FS_stdin_getChar_buffer.shift()
}
;
var TTY = {
    ttys: [],
    init() {},
    shutdown() {},
    register(dev, ops) {
        TTY.ttys[dev] = {
            input: [],
            output: [],
            ops: ops
        };
        FS.registerDevice(dev, TTY.stream_ops)
    },
    stream_ops: {
        open(stream) {
            var tty = TTY.ttys[stream.node.rdev];
            if (!tty) {
                throw new FS.ErrnoError(43)
            }
            stream.tty = tty;
            stream.seekable = false
        },
        close(stream) {
            stream.tty.ops.fsync(stream.tty)
        },
        fsync(stream) {
            stream.tty.ops.fsync(stream.tty)
        },
        read(stream, buffer, offset, length, pos) {
            if (!stream.tty || !stream.tty.ops.get_char) {
                throw new FS.ErrnoError(60)
            }
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
                var result;
                try {
                    result = stream.tty.ops.get_char(stream.tty)
                } catch (e) {
                    throw new FS.ErrnoError(29)
                }
                if (result === undefined && bytesRead === 0) {
                    throw new FS.ErrnoError(6)
                }
                if (result === null || result === undefined)
                    break;
                bytesRead++;
                buffer[offset + i] = result
            }
            if (bytesRead) {
                stream.node.timestamp = Date.now()
            }
            return bytesRead
        },
        write(stream, buffer, offset, length, pos) {
            if (!stream.tty || !stream.tty.ops.put_char) {
                throw new FS.ErrnoError(60)
            }
            try {
                for (var i = 0; i < length; i++) {
                    stream.tty.ops.put_char(stream.tty, buffer[offset + i])
                }
            } catch (e) {
                throw new FS.ErrnoError(29)
            }
            if (length) {
                stream.node.timestamp = Date.now()
            }
            return i
        }
    },
    default_tty_ops: {
        get_char(tty) {
            return FS_stdin_getChar()
        },
        put_char(tty, val) {
            if (val === null || val === 10) {
                out(UTF8ArrayToString(tty.output, 0));
                tty.output = []
            } else {
                if (val != 0)
                    tty.output.push(val)
            }
        },
        fsync(tty) {
            if (tty.output && tty.output.length > 0) {
                out(UTF8ArrayToString(tty.output, 0));
                tty.output = []
            }
        },
        ioctl_tcgets(tty) {
            return {
                c_iflag: 25856,
                c_oflag: 5,
                c_cflag: 191,
                c_lflag: 35387,
                c_cc: [3, 28, 127, 21, 4, 0, 1, 0, 17, 19, 26, 0, 18, 15, 23, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            }
        },
        ioctl_tcsets(tty, optional_actions, data) {
            return 0
        },
        ioctl_tiocgwinsz(tty) {
            return [24, 80]
        }
    },
    default_tty1_ops: {
        put_char(tty, val) {
            if (val === null || val === 10) {
                err(UTF8ArrayToString(tty.output, 0));
                tty.output = []
            } else {
                if (val != 0)
                    tty.output.push(val)
            }
        },
        fsync(tty) {
            if (tty.output && tty.output.length > 0) {
                err(UTF8ArrayToString(tty.output, 0));
                tty.output = []
            }
        }
    }
};
var mmapAlloc = size=>{
    abort()
}
;
var MEMFS = {
    ops_table: null,
    mount(mount) {
        return MEMFS.createNode(null, "/", 16384 | 511, 0)
    },
    createNode(parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
            throw new FS.ErrnoError(63)
        }
        MEMFS.ops_table ||= {
            dir: {
                node: {
                    getattr: MEMFS.node_ops.getattr,
                    setattr: MEMFS.node_ops.setattr,
                    lookup: MEMFS.node_ops.lookup,
                    mknod: MEMFS.node_ops.mknod,
                    rename: MEMFS.node_ops.rename,
                    unlink: MEMFS.node_ops.unlink,
                    rmdir: MEMFS.node_ops.rmdir,
                    readdir: MEMFS.node_ops.readdir,
                    symlink: MEMFS.node_ops.symlink
                },
                stream: {
                    llseek: MEMFS.stream_ops.llseek
                }
            },
            file: {
                node: {
                    getattr: MEMFS.node_ops.getattr,
                    setattr: MEMFS.node_ops.setattr
                },
                stream: {
                    llseek: MEMFS.stream_ops.llseek,
                    read: MEMFS.stream_ops.read,
                    write: MEMFS.stream_ops.write,
                    allocate: MEMFS.stream_ops.allocate,
                    mmap: MEMFS.stream_ops.mmap,
                    msync: MEMFS.stream_ops.msync
                }
            },
            link: {
                node: {
                    getattr: MEMFS.node_ops.getattr,
                    setattr: MEMFS.node_ops.setattr,
                    readlink: MEMFS.node_ops.readlink
                },
                stream: {}
            },
            chrdev: {
                node: {
                    getattr: MEMFS.node_ops.getattr,
                    setattr: MEMFS.node_ops.setattr
                },
                stream: FS.chrdev_stream_ops
            }
        };
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
            node.node_ops = MEMFS.ops_table.dir.node;
            node.stream_ops = MEMFS.ops_table.dir.stream;
            node.contents = {}
        } else if (FS.isFile(node.mode)) {
            node.node_ops = MEMFS.ops_table.file.node;
            node.stream_ops = MEMFS.ops_table.file.stream;
            node.usedBytes = 0;
            node.contents = null
        } else if (FS.isLink(node.mode)) {
            node.node_ops = MEMFS.ops_table.link.node;
            node.stream_ops = MEMFS.ops_table.link.stream
        } else if (FS.isChrdev(node.mode)) {
            node.node_ops = MEMFS.ops_table.chrdev.node;
            node.stream_ops = MEMFS.ops_table.chrdev.stream
        }
        node.timestamp = Date.now();
        if (parent) {
            parent.contents[name] = node;
            parent.timestamp = node.timestamp
        }
        return node
    },
    getFileDataAsTypedArray(node) {
        if (!node.contents)
            return new Uint8Array(0);
        if (node.contents.subarray)
            return node.contents.subarray(0, node.usedBytes);
        return new Uint8Array(node.contents)
    },
    expandFileStorage(node, newCapacity) {
        var prevCapacity = node.contents ? node.contents.length : 0;
        if (prevCapacity >= newCapacity)
            return;
        var CAPACITY_DOUBLING_MAX = 1024 * 1024;
        newCapacity = Math.max(newCapacity, prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125) >>> 0);
        if (prevCapacity != 0)
            newCapacity = Math.max(newCapacity, 256);
        var oldContents = node.contents;
        node.contents = new Uint8Array(newCapacity);
        if (node.usedBytes > 0)
            node.contents.set(oldContents.subarray(0, node.usedBytes), 0)
    },
    resizeFileStorage(node, newSize) {
        if (node.usedBytes == newSize)
            return;
        if (newSize == 0) {
            node.contents = null;
            node.usedBytes = 0
        } else {
            var oldContents = node.contents;
            node.contents = new Uint8Array(newSize);
            if (oldContents) {
                node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)))
            }
            node.usedBytes = newSize
        }
    },
    node_ops: {
        getattr(node) {
            var attr = {};
            attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
            attr.ino = node.id;
            attr.mode = node.mode;
            attr.nlink = 1;
            attr.uid = 0;
            attr.gid = 0;
            attr.rdev = node.rdev;
            if (FS.isDir(node.mode)) {
                attr.size = 4096
            } else if (FS.isFile(node.mode)) {
                attr.size = node.usedBytes
            } else if (FS.isLink(node.mode)) {
                attr.size = node.link.length
            } else {
                attr.size = 0
            }
            attr.atime = new Date(node.timestamp);
            attr.mtime = new Date(node.timestamp);
            attr.ctime = new Date(node.timestamp);
            attr.blksize = 4096;
            attr.blocks = Math.ceil(attr.size / attr.blksize);
            return attr
        },
        setattr(node, attr) {
            if (attr.mode !== undefined) {
                node.mode = attr.mode
            }
            if (attr.timestamp !== undefined) {
                node.timestamp = attr.timestamp
            }
            if (attr.size !== undefined) {
                MEMFS.resizeFileStorage(node, attr.size)
            }
        },
        lookup(parent, name) {
            throw FS.genericErrors[44]
        },
        mknod(parent, name, mode, dev) {
            return MEMFS.createNode(parent, name, mode, dev)
        },
        rename(old_node, new_dir, new_name) {
            if (FS.isDir(old_node.mode)) {
                var new_node;
                try {
                    new_node = FS.lookupNode(new_dir, new_name)
                } catch (e) {}
                if (new_node) {
                    for (var i in new_node.contents) {
                        throw new FS.ErrnoError(55)
                    }
                }
            }
            delete old_node.parent.contents[old_node.name];
            old_node.parent.timestamp = Date.now();
            old_node.name = new_name;
            new_dir.contents[new_name] = old_node;
            new_dir.timestamp = old_node.parent.timestamp;
            old_node.parent = new_dir
        },
        unlink(parent, name) {
            delete parent.contents[name];
            parent.timestamp = Date.now()
        },
        rmdir(parent, name) {
            var node = FS.lookupNode(parent, name);
            for (var i in node.contents) {
                throw new FS.ErrnoError(55)
            }
            delete parent.contents[name];
            parent.timestamp = Date.now()
        },
        readdir(node) {
            var entries = [".", ".."];
            for (var key of Object.keys(node.contents)) {
                entries.push(key)
            }
            return entries
        },
        symlink(parent, newname, oldpath) {
            var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
            node.link = oldpath;
            return node
        },
        readlink(node) {
            if (!FS.isLink(node.mode)) {
                throw new FS.ErrnoError(28)
            }
            return node.link
        }
    },
    stream_ops: {
        read(stream, buffer, offset, length, position) {
            var contents = stream.node.contents;
            if (position >= stream.node.usedBytes)
                return 0;
            var size = Math.min(stream.node.usedBytes - position, length);
            if (size > 8 && contents.subarray) {
                buffer.set(contents.subarray(position, position + size), offset)
            } else {
                for (var i = 0; i < size; i++)
                    buffer[offset + i] = contents[position + i]
            }
            return size
        },
        write(stream, buffer, offset, length, position, canOwn) {
            if (buffer.buffer === HEAP8.buffer) {
                canOwn = false
            }
            if (!length)
                return 0;
            var node = stream.node;
            node.timestamp = Date.now();
            if (buffer.subarray && (!node.contents || node.contents.subarray)) {
                if (canOwn) {
                    node.contents = buffer.subarray(offset, offset + length);
                    node.usedBytes = length;
                    return length
                } else if (node.usedBytes === 0 && position === 0) {
                    node.contents = buffer.slice(offset, offset + length);
                    node.usedBytes = length;
                    return length
                } else if (position + length <= node.usedBytes) {
                    node.contents.set(buffer.subarray(offset, offset + length), position);
                    return length
                }
            }
            MEMFS.expandFileStorage(node, position + length);
            if (node.contents.subarray && buffer.subarray) {
                node.contents.set(buffer.subarray(offset, offset + length), position)
            } else {
                for (var i = 0; i < length; i++) {
                    node.contents[position + i] = buffer[offset + i]
                }
            }
            node.usedBytes = Math.max(node.usedBytes, position + length);
            return length
        },
        llseek(stream, offset, whence) {
            var position = offset;
            if (whence === 1) {
                position += stream.position
            } else if (whence === 2) {
                if (FS.isFile(stream.node.mode)) {
                    position += stream.node.usedBytes
                }
            }
            if (position < 0) {
                throw new FS.ErrnoError(28)
            }
            return position
        },
        allocate(stream, offset, length) {
            MEMFS.expandFileStorage(stream.node, offset + length);
            stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length)
        },
        mmap(stream, length, position, prot, flags) {
            if (!FS.isFile(stream.node.mode)) {
                throw new FS.ErrnoError(43)
            }
            var ptr;
            var allocated;
            var contents = stream.node.contents;
            if (!(flags & 2) && contents.buffer === HEAP8.buffer) {
                allocated = false;
                ptr = contents.byteOffset
            } else {
                if (position > 0 || position + length < contents.length) {
                    if (contents.subarray) {
                        contents = contents.subarray(position, position + length)
                    } else {
                        contents = Array.prototype.slice.call(contents, position, position + length)
                    }
                }
                allocated = true;
                ptr = mmapAlloc(length);
                if (!ptr) {
                    throw new FS.ErrnoError(48)
                }
                HEAP8.set(contents, ptr)
            }
            return {
                ptr: ptr,
                allocated: allocated
            }
        },
        msync(stream, buffer, offset, length, mmapFlags) {
            MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
            return 0
        }
    }
};
var asyncLoad = (url,onload,onerror,noRunDep)=>{
    var dep = !noRunDep ? getUniqueRunDependency(`al ${url}`) : "";
    readAsync(url, arrayBuffer=>{
        assert(arrayBuffer, `Loading data file "${url}" failed (no arrayBuffer).`);
        onload(new Uint8Array(arrayBuffer));
        if (dep)
            removeRunDependency(dep)
    }
    , event=>{
        if (onerror) {
            onerror()
        } else {
            throw `Loading data file "${url}" failed.`
        }
    }
    );
    if (dep)
        addRunDependency(dep)
}
;
var FS_createDataFile = (parent,name,fileData,canRead,canWrite,canOwn)=>{
    FS.createDataFile(parent, name, fileData, canRead, canWrite, canOwn)
}
;
var preloadPlugins = Module["preloadPlugins"] || [];
var FS_handledByPreloadPlugin = (byteArray,fullname,finish,onerror)=>{
    if (typeof Browser != "undefined")
        Browser.init();
    var handled = false;
    preloadPlugins.forEach(plugin=>{
        if (handled)
            return;
        if (plugin["canHandle"](fullname)) {
            plugin["handle"](byteArray, fullname, finish, onerror);
            handled = true
        }
    }
    );
    return handled
}
;
var FS_createPreloadedFile = (parent,name,url,canRead,canWrite,onload,onerror,dontCreateFile,canOwn,preFinish)=>{
    var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
    var dep = getUniqueRunDependency(`cp ${fullname}`);
    function processData(byteArray) {
        function finish(byteArray) {
            preFinish?.();
            if (!dontCreateFile) {
                FS_createDataFile(parent, name, byteArray, canRead, canWrite, canOwn)
            }
            onload?.();
            removeRunDependency(dep)
        }
        if (FS_handledByPreloadPlugin(byteArray, fullname, finish, ()=>{
            onerror?.();
            removeRunDependency(dep)
        }
        )) {
            return
        }
        finish(byteArray)
    }
    addRunDependency(dep);
    if (typeof url == "string") {
        asyncLoad(url, byteArray=>processData(byteArray), onerror)
    } else {
        processData(url)
    }
}
;
var FS_modeStringToFlags = str=>{
    var flagModes = {
        "r": 0,
        "r+": 2,
        "w": 512 | 64 | 1,
        "w+": 512 | 64 | 2,
        "a": 1024 | 64 | 1,
        "a+": 1024 | 64 | 2
    };
    var flags = flagModes[str];
    if (typeof flags == "undefined") {
        throw new Error(`Unknown file open mode: ${str}`)
    }
    return flags
}
;
var FS_getMode = (canRead,canWrite)=>{
    var mode = 0;
    if (canRead)
        mode |= 292 | 73;
    if (canWrite)
        mode |= 146;
    return mode
}
;
var IDBFS = {
    dbs: {},
    indexedDB: ()=>{
        if (typeof indexedDB != "undefined")
            return indexedDB;
        var ret = null;
        if (typeof window == "object")
            ret = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        assert(ret, "IDBFS used, but indexedDB not supported");
        return ret
    }
    ,
    DB_VERSION: 21,
    DB_STORE_NAME: "FILE_DATA",
    mount: function(mount) {
        return MEMFS.mount.apply(null, arguments)
    },
    syncfs: (mount,populate,callback)=>{
        IDBFS.getLocalSet(mount, (err,local)=>{
            if (err)
                return callback(err);
            IDBFS.getRemoteSet(mount, (err,remote)=>{
                if (err)
                    return callback(err);
                var src = populate ? remote : local;
                var dst = populate ? local : remote;
                IDBFS.reconcile(src, dst, callback)
            }
            )
        }
        )
    }
    ,
    quit: ()=>{
        Object.values(IDBFS.dbs).forEach(value=>value.close());
        IDBFS.dbs = {}
    }
    ,
    getDB: (name,callback)=>{
        var db = IDBFS.dbs[name];
        if (db) {
            return callback(null, db)
        }
        var req;
        try {
            req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION)
        } catch (e) {
            return callback(e)
        }
        if (!req) {
            return callback("Unable to connect to IndexedDB")
        }
        req.onupgradeneeded = e=>{
            var db = e.target.result;
            var transaction = e.target.transaction;
            var fileStore;
            if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
                fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME)
            } else {
                fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME)
            }
            if (!fileStore.indexNames.contains("timestamp")) {
                fileStore.createIndex("timestamp", "timestamp", {
                    unique: false
                })
            }
        }
        ;
        req.onsuccess = ()=>{
            db = req.result;
            IDBFS.dbs[name] = db;
            callback(null, db)
        }
        ;
        req.onerror = e=>{
            callback(e.target.error);
            e.preventDefault()
        }
    }
    ,
    getLocalSet: (mount,callback)=>{
        var entries = {};
        function isRealDir(p) {
            return p !== "." && p !== ".."
        }
        function toAbsolute(root) {
            return p=>PATH.join2(root, p)
        }
        var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
        while (check.length) {
            var path = check.pop();
            var stat;
            try {
                stat = FS.stat(path)
            } catch (e) {
                return callback(e)
            }
            if (FS.isDir(stat.mode)) {
                check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)))
            }
            entries[path] = {
                "timestamp": stat.mtime
            }
        }
        return callback(null, {
            type: "local",
            entries: entries
        })
    }
    ,
    getRemoteSet: (mount,callback)=>{
        var entries = {};
        IDBFS.getDB(mount.mountpoint, (err,db)=>{
            if (err)
                return callback(err);
            try {
                var transaction = db.transaction([IDBFS.DB_STORE_NAME], "readonly");
                transaction.onerror = e=>{
                    callback(e.target.error);
                    e.preventDefault()
                }
                ;
                var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
                var index = store.index("timestamp");
                index.openKeyCursor().onsuccess = event=>{
                    var cursor = event.target.result;
                    if (!cursor) {
                        return callback(null, {
                            type: "remote",
                            db: db,
                            entries: entries
                        })
                    }
                    entries[cursor.primaryKey] = {
                        "timestamp": cursor.key
                    };
                    cursor.continue()
                }
            } catch (e) {
                return callback(e)
            }
        }
        )
    }
    ,
    loadLocalEntry: (path,callback)=>{
        var stat, node;
        try {
            var lookup = FS.lookupPath(path);
            node = lookup.node;
            stat = FS.stat(path)
        } catch (e) {
            return callback(e)
        }
        if (FS.isDir(stat.mode)) {
            return callback(null, {
                "timestamp": stat.mtime,
                "mode": stat.mode
            })
        } else if (FS.isFile(stat.mode)) {
            node.contents = MEMFS.getFileDataAsTypedArray(node);
            return callback(null, {
                "timestamp": stat.mtime,
                "mode": stat.mode,
                "contents": node.contents
            })
        } else {
            return callback(new Error("node type not supported"))
        }
    }
    ,
    storeLocalEntry: (path,entry,callback)=>{
        try {
            if (FS.isDir(entry["mode"])) {
                FS.mkdirTree(path, entry["mode"])
            } else if (FS.isFile(entry["mode"])) {
                FS.writeFile(path, entry["contents"], {
                    canOwn: true
                })
            } else {
                return callback(new Error("node type not supported"))
            }
            FS.chmod(path, entry["mode"]);
            FS.utime(path, entry["timestamp"], entry["timestamp"])
        } catch (e) {
            return callback(e)
        }
        callback(null)
    }
    ,
    removeLocalEntry: (path,callback)=>{
        try {
            var stat = FS.stat(path);
            if (FS.isDir(stat.mode)) {
                FS.rmdir(path)
            } else if (FS.isFile(stat.mode)) {
                FS.unlink(path)
            }
        } catch (e) {
            return callback(e)
        }
        callback(null)
    }
    ,
    loadRemoteEntry: (store,path,callback)=>{
        var req = store.get(path);
        req.onsuccess = event=>callback(null, event.target.result);
        req.onerror = e=>{
            callback(e.target.error);
            e.preventDefault()
        }
    }
    ,
    storeRemoteEntry: (store,path,entry,callback)=>{
        try {
            var req = store.put(entry, path)
        } catch (e) {
            callback(e);
            return
        }
        req.onsuccess = event=>callback();
        req.onerror = e=>{
            callback(e.target.error);
            e.preventDefault()
        }
    }
    ,
    removeRemoteEntry: (store,path,callback)=>{
        var req = store.delete(path);
        req.onsuccess = event=>callback();
        req.onerror = e=>{
            callback(e.target.error);
            e.preventDefault()
        }
    }
    ,
    reconcile: (src,dst,callback)=>{
        var total = 0;
        var create = [];
        Object.keys(src.entries).forEach(function(key) {
            var e = src.entries[key];
            var e2 = dst.entries[key];
            if (!e2 || e["timestamp"].getTime() != e2["timestamp"].getTime()) {
                create.push(key);
                total++
            }
        });
        var remove = [];
        Object.keys(dst.entries).forEach(function(key) {
            if (!src.entries[key]) {
                remove.push(key);
                total++
            }
        });
        if (!total) {
            return callback(null)
        }
        var errored = false;
        var db = src.type === "remote" ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], "readwrite");
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
        function done(err) {
            if (err && !errored) {
                errored = true;
                return callback(err)
            }
        }
        transaction.onerror = e=>{
            done(this.error);
            e.preventDefault()
        }
        ;
        transaction.oncomplete = e=>{
            if (!errored) {
                callback(null)
            }
        }
        ;
        create.sort().forEach(path=>{
            if (dst.type === "local") {
                IDBFS.loadRemoteEntry(store, path, (err,entry)=>{
                    if (err)
                        return done(err);
                    IDBFS.storeLocalEntry(path, entry, done)
                }
                )
            } else {
                IDBFS.loadLocalEntry(path, (err,entry)=>{
                    if (err)
                        return done(err);
                    IDBFS.storeRemoteEntry(store, path, entry, done)
                }
                )
            }
        }
        );
        remove.sort().reverse().forEach(path=>{
            if (dst.type === "local") {
                IDBFS.removeLocalEntry(path, done)
            } else {
                IDBFS.removeRemoteEntry(store, path, done)
            }
        }
        )
    }
};
var FS = {
    root: null,
    mounts: [],
    devices: {},
    streams: [],
    nextInode: 1,
    nameTable: null,
    currentPath: "/",
    initialized: false,
    ignorePermissions: true,
    ErrnoError: null,
    genericErrors: {},
    filesystems: null,
    syncFSRequests: 0,
    lookupPath(path, opts={}) {
        path = PATH_FS.resolve(path);
        if (!path)
            return {
                path: "",
                node: null
            };
        var defaults = {
            follow_mount: true,
            recurse_count: 0
        };
        opts = Object.assign(defaults, opts);
        if (opts.recurse_count > 8) {
            throw new FS.ErrnoError(32)
        }
        var parts = path.split("/").filter(p=>!!p);
        var current = FS.root;
        var current_path = "/";
        for (var i = 0; i < parts.length; i++) {
            var islast = i === parts.length - 1;
            if (islast && opts.parent) {
                break
            }
            current = FS.lookupNode(current, parts[i]);
            current_path = PATH.join2(current_path, parts[i]);
            if (FS.isMountpoint(current)) {
                if (!islast || islast && opts.follow_mount) {
                    current = current.mounted.root
                }
            }
            if (!islast || opts.follow) {
                var count = 0;
                while (FS.isLink(current.mode)) {
                    var link = FS.readlink(current_path);
                    current_path = PATH_FS.resolve(PATH.dirname(current_path), link);
                    var lookup = FS.lookupPath(current_path, {
                        recurse_count: opts.recurse_count + 1
                    });
                    current = lookup.node;
                    if (count++ > 40) {
                        throw new FS.ErrnoError(32)
                    }
                }
            }
        }
        return {
            path: current_path,
            node: current
        }
    },
    getPath(node) {
        var path;
        while (true) {
            if (FS.isRoot(node)) {
                var mount = node.mount.mountpoint;
                if (!path)
                    return mount;
                return mount[mount.length - 1] !== "/" ? `${mount}/${path}` : mount + path
            }
            path = path ? `${node.name}/${path}` : node.name;
            node = node.parent
        }
    },
    hashName(parentid, name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
            hash = (hash << 5) - hash + name.charCodeAt(i) | 0
        }
        return (parentid + hash >>> 0) % FS.nameTable.length
    },
    hashAddNode(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node
    },
    hashRemoveNode(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
            FS.nameTable[hash] = node.name_next
        } else {
            var current = FS.nameTable[hash];
            while (current) {
                if (current.name_next === node) {
                    current.name_next = node.name_next;
                    break
                }
                current = current.name_next
            }
        }
    },
    lookupNode(parent, name) {
        var errCode = FS.mayLookup(parent);
        if (errCode) {
            throw new FS.ErrnoError(errCode,parent)
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
            var nodeName = node.name;
            if (node.parent.id === parent.id && nodeName === name) {
                return node
            }
        }
        return FS.lookup(parent, name)
    },
    createNode(parent, name, mode, rdev) {
        var node = new FS.FSNode(parent,name,mode,rdev);
        FS.hashAddNode(node);
        return node
    },
    destroyNode(node) {
        FS.hashRemoveNode(node)
    },
    isRoot(node) {
        return node === node.parent
    },
    isMountpoint(node) {
        return !!node.mounted
    },
    isFile(mode) {
        return (mode & 61440) === 32768
    },
    isDir(mode) {
        return (mode & 61440) === 16384
    },
    isLink(mode) {
        return (mode & 61440) === 40960
    },
    isChrdev(mode) {
        return (mode & 61440) === 8192
    },
    isBlkdev(mode) {
        return (mode & 61440) === 24576
    },
    isFIFO(mode) {
        return (mode & 61440) === 4096
    },
    isSocket(mode) {
        return (mode & 49152) === 49152
    },
    flagsToPermissionString(flag) {
        var perms = ["r", "w", "rw"][flag & 3];
        if (flag & 512) {
            perms += "w"
        }
        return perms
    },
    nodePermissions(node, perms) {
        if (FS.ignorePermissions) {
            return 0
        }
        if (perms.includes("r") && !(node.mode & 292)) {
            return 2
        } else if (perms.includes("w") && !(node.mode & 146)) {
            return 2
        } else if (perms.includes("x") && !(node.mode & 73)) {
            return 2
        }
        return 0
    },
    mayLookup(dir) {
        var errCode = FS.nodePermissions(dir, "x");
        if (errCode)
            return errCode;
        if (!dir.node_ops.lookup)
            return 2;
        return 0
    },
    mayCreate(dir, name) {
        try {
            var node = FS.lookupNode(dir, name);
            return 20
        } catch (e) {}
        return FS.nodePermissions(dir, "wx")
    },
    mayDelete(dir, name, isdir) {
        var node;
        try {
            node = FS.lookupNode(dir, name)
        } catch (e) {
            return e.errno
        }
        var errCode = FS.nodePermissions(dir, "wx");
        if (errCode) {
            return errCode
        }
        if (isdir) {
            if (!FS.isDir(node.mode)) {
                return 54
            }
            if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
                return 10
            }
        } else {
            if (FS.isDir(node.mode)) {
                return 31
            }
        }
        return 0
    },
    mayOpen(node, flags) {
        if (!node) {
            return 44
        }
        if (FS.isLink(node.mode)) {
            return 32
        } else if (FS.isDir(node.mode)) {
            if (FS.flagsToPermissionString(flags) !== "r" || flags & 512) {
                return 31
            }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags))
    },
    MAX_OPEN_FDS: 4096,
    nextfd() {
        for (var fd = 0; fd <= FS.MAX_OPEN_FDS; fd++) {
            if (!FS.streams[fd]) {
                return fd
            }
        }
        throw new FS.ErrnoError(33)
    },
    getStreamChecked(fd) {
        var stream = FS.getStream(fd);
        if (!stream) {
            throw new FS.ErrnoError(8)
        }
        return stream
    },
    getStream: fd=>FS.streams[fd],
    createStream(stream, fd=-1) {
        if (!FS.FSStream) {
            FS.FSStream = function() {
                this.shared = {}
            }
            ;
            FS.FSStream.prototype = {};
            Object.defineProperties(FS.FSStream.prototype, {
                object: {
                    get() {
                        return this.node
                    },
                    set(val) {
                        this.node = val
                    }
                },
                isRead: {
                    get() {
                        return (this.flags & 2097155) !== 1
                    }
                },
                isWrite: {
                    get() {
                        return (this.flags & 2097155) !== 0
                    }
                },
                isAppend: {
                    get() {
                        return this.flags & 1024
                    }
                },
                flags: {
                    get() {
                        return this.shared.flags
                    },
                    set(val) {
                        this.shared.flags = val
                    }
                },
                position: {
                    get() {
                        return this.shared.position
                    },
                    set(val) {
                        this.shared.position = val
                    }
                }
            })
        }
        stream = Object.assign(new FS.FSStream, stream);
        if (fd == -1) {
            fd = FS.nextfd()
        }
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream
    },
    closeStream(fd) {
        FS.streams[fd] = null
    },
    chrdev_stream_ops: {
        open(stream) {
            var device = FS.getDevice(stream.node.rdev);
            stream.stream_ops = device.stream_ops;
            stream.stream_ops.open?.(stream)
        },
        llseek() {
            throw new FS.ErrnoError(70)
        }
    },
    major: dev=>dev >> 8,
    minor: dev=>dev & 255,
    makedev: (ma,mi)=>ma << 8 | mi,
    registerDevice(dev, ops) {
        FS.devices[dev] = {
            stream_ops: ops
        }
    },
    getDevice: dev=>FS.devices[dev],
    getMounts(mount) {
        var mounts = [];
        var check = [mount];
        while (check.length) {
            var m = check.pop();
            mounts.push(m);
            check.push.apply(check, m.mounts)
        }
        return mounts
    },
    syncfs(populate, callback) {
        if (typeof populate == "function") {
            callback = populate;
            populate = false
        }
        FS.syncFSRequests++;
        if (FS.syncFSRequests > 1) {
            err(`warning: ${FS.syncFSRequests} FS.syncfs operations in flight at once, probably just doing extra work`)
        }
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
        function doCallback(errCode) {
            FS.syncFSRequests--;
            return callback(errCode)
        }
        function done(errCode) {
            if (errCode) {
                if (!done.errored) {
                    done.errored = true;
                    return doCallback(errCode)
                }
                return
            }
            if (++completed >= mounts.length) {
                doCallback(null)
            }
        }
        mounts.forEach(mount=>{
            if (!mount.type.syncfs) {
                return done(null)
            }
            mount.type.syncfs(mount, populate, done)
        }
        )
    },
    mount(type, opts, mountpoint) {
        var root = mountpoint === "/";
        var pseudo = !mountpoint;
        var node;
        if (root && FS.root) {
            throw new FS.ErrnoError(10)
        } else if (!root && !pseudo) {
            var lookup = FS.lookupPath(mountpoint, {
                follow_mount: false
            });
            mountpoint = lookup.path;
            node = lookup.node;
            if (FS.isMountpoint(node)) {
                throw new FS.ErrnoError(10)
            }
            if (!FS.isDir(node.mode)) {
                throw new FS.ErrnoError(54)
            }
        }
        var mount = {
            type: type,
            opts: opts,
            mountpoint: mountpoint,
            mounts: []
        };
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
        if (root) {
            FS.root = mountRoot
        } else if (node) {
            node.mounted = mount;
            if (node.mount) {
                node.mount.mounts.push(mount)
            }
        }
        return mountRoot
    },
    unmount(mountpoint) {
        var lookup = FS.lookupPath(mountpoint, {
            follow_mount: false
        });
        if (!FS.isMountpoint(lookup.node)) {
            throw new FS.ErrnoError(28)
        }
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
        Object.keys(FS.nameTable).forEach(hash=>{
            var current = FS.nameTable[hash];
            while (current) {
                var next = current.name_next;
                if (mounts.includes(current.mount)) {
                    FS.destroyNode(current)
                }
                current = next
            }
        }
        );
        node.mounted = null;
        var idx = node.mount.mounts.indexOf(mount);
        node.mount.mounts.splice(idx, 1)
    },
    lookup(parent, name) {
        return parent.node_ops.lookup(parent, name)
    },
    mknod(path, mode, dev) {
        var lookup = FS.lookupPath(path, {
            parent: true
        });
        var parent = lookup.node;
        var name = PATH.basename(path);
        if (!name || name === "." || name === "..") {
            throw new FS.ErrnoError(28)
        }
        var errCode = FS.mayCreate(parent, name);
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        if (!parent.node_ops.mknod) {
            throw new FS.ErrnoError(63)
        }
        return parent.node_ops.mknod(parent, name, mode, dev)
    },
    create(path, mode) {
        mode = mode !== undefined ? mode : 438;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0)
    },
    mkdir(path, mode) {
        mode = mode !== undefined ? mode : 511;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0)
    },
    mkdirTree(path, mode) {
        var dirs = path.split("/");
        var d = "";
        for (var i = 0; i < dirs.length; ++i) {
            if (!dirs[i])
                continue;
            d += "/" + dirs[i];
            try {
                FS.mkdir(d, mode)
            } catch (e) {
                if (e.errno != 20)
                    throw e
            }
        }
    },
    mkdev(path, mode, dev) {
        if (typeof dev == "undefined") {
            dev = mode;
            mode = 438
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev)
    },
    symlink(oldpath, newpath) {
        if (!PATH_FS.resolve(oldpath)) {
            throw new FS.ErrnoError(44)
        }
        var lookup = FS.lookupPath(newpath, {
            parent: true
        });
        var parent = lookup.node;
        if (!parent) {
            throw new FS.ErrnoError(44)
        }
        var newname = PATH.basename(newpath);
        var errCode = FS.mayCreate(parent, newname);
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        if (!parent.node_ops.symlink) {
            throw new FS.ErrnoError(63)
        }
        return parent.node_ops.symlink(parent, newname, oldpath)
    },
    rename(old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        var lookup, old_dir, new_dir;
        lookup = FS.lookupPath(old_path, {
            parent: true
        });
        old_dir = lookup.node;
        lookup = FS.lookupPath(new_path, {
            parent: true
        });
        new_dir = lookup.node;
        if (!old_dir || !new_dir)
            throw new FS.ErrnoError(44);
        if (old_dir.mount !== new_dir.mount) {
            throw new FS.ErrnoError(75)
        }
        var old_node = FS.lookupNode(old_dir, old_name);
        var relative = PATH_FS.relative(old_path, new_dirname);
        if (relative.charAt(0) !== ".") {
            throw new FS.ErrnoError(28)
        }
        relative = PATH_FS.relative(new_path, old_dirname);
        if (relative.charAt(0) !== ".") {
            throw new FS.ErrnoError(55)
        }
        var new_node;
        try {
            new_node = FS.lookupNode(new_dir, new_name)
        } catch (e) {}
        if (old_node === new_node) {
            return
        }
        var isdir = FS.isDir(old_node.mode);
        var errCode = FS.mayDelete(old_dir, old_name, isdir);
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        errCode = new_node ? FS.mayDelete(new_dir, new_name, isdir) : FS.mayCreate(new_dir, new_name);
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        if (!old_dir.node_ops.rename) {
            throw new FS.ErrnoError(63)
        }
        if (FS.isMountpoint(old_node) || new_node && FS.isMountpoint(new_node)) {
            throw new FS.ErrnoError(10)
        }
        if (new_dir !== old_dir) {
            errCode = FS.nodePermissions(old_dir, "w");
            if (errCode) {
                throw new FS.ErrnoError(errCode)
            }
        }
        FS.hashRemoveNode(old_node);
        try {
            old_dir.node_ops.rename(old_node, new_dir, new_name)
        } catch (e) {
            throw e
        } finally {
            FS.hashAddNode(old_node)
        }
    },
    rmdir(path) {
        var lookup = FS.lookupPath(path, {
            parent: true
        });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, true);
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        if (!parent.node_ops.rmdir) {
            throw new FS.ErrnoError(63)
        }
        if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(10)
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node)
    },
    readdir(path) {
        var lookup = FS.lookupPath(path, {
            follow: true
        });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
            throw new FS.ErrnoError(54)
        }
        return node.node_ops.readdir(node)
    },
    unlink(path) {
        var lookup = FS.lookupPath(path, {
            parent: true
        });
        var parent = lookup.node;
        if (!parent) {
            throw new FS.ErrnoError(44)
        }
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var errCode = FS.mayDelete(parent, name, false);
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        if (!parent.node_ops.unlink) {
            throw new FS.ErrnoError(63)
        }
        if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(10)
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node)
    },
    readlink(path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link) {
            throw new FS.ErrnoError(44)
        }
        if (!link.node_ops.readlink) {
            throw new FS.ErrnoError(28)
        }
        return PATH_FS.resolve(FS.getPath(link.parent), link.node_ops.readlink(link))
    },
    stat(path, dontFollow) {
        var lookup = FS.lookupPath(path, {
            follow: !dontFollow
        });
        var node = lookup.node;
        if (!node) {
            throw new FS.ErrnoError(44)
        }
        if (!node.node_ops.getattr) {
            throw new FS.ErrnoError(63)
        }
        return node.node_ops.getattr(node)
    },
    lstat(path) {
        return FS.stat(path, true)
    },
    chmod(path, mode, dontFollow) {
        var node;
        if (typeof path == "string") {
            var lookup = FS.lookupPath(path, {
                follow: !dontFollow
            });
            node = lookup.node
        } else {
            node = path
        }
        if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(63)
        }
        node.node_ops.setattr(node, {
            mode: mode & 4095 | node.mode & ~4095,
            timestamp: Date.now()
        })
    },
    lchmod(path, mode) {
        FS.chmod(path, mode, true)
    },
    fchmod(fd, mode) {
        var stream = FS.getStreamChecked(fd);
        FS.chmod(stream.node, mode)
    },
    chown(path, uid, gid, dontFollow) {
        var node;
        if (typeof path == "string") {
            var lookup = FS.lookupPath(path, {
                follow: !dontFollow
            });
            node = lookup.node
        } else {
            node = path
        }
        if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(63)
        }
        node.node_ops.setattr(node, {
            timestamp: Date.now()
        })
    },
    lchown(path, uid, gid) {
        FS.chown(path, uid, gid, true)
    },
    fchown(fd, uid, gid) {
        var stream = FS.getStreamChecked(fd);
        FS.chown(stream.node, uid, gid)
    },
    truncate(path, len) {
        if (len < 0) {
            throw new FS.ErrnoError(28)
        }
        var node;
        if (typeof path == "string") {
            var lookup = FS.lookupPath(path, {
                follow: true
            });
            node = lookup.node
        } else {
            node = path
        }
        if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(63)
        }
        if (FS.isDir(node.mode)) {
            throw new FS.ErrnoError(31)
        }
        if (!FS.isFile(node.mode)) {
            throw new FS.ErrnoError(28)
        }
        var errCode = FS.nodePermissions(node, "w");
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        node.node_ops.setattr(node, {
            size: len,
            timestamp: Date.now()
        })
    },
    ftruncate(fd, len) {
        var stream = FS.getStreamChecked(fd);
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(28)
        }
        FS.truncate(stream.node, len)
    },
    utime(path, atime, mtime) {
        var lookup = FS.lookupPath(path, {
            follow: true
        });
        var node = lookup.node;
        node.node_ops.setattr(node, {
            timestamp: Math.max(atime, mtime)
        })
    },
    open(path, flags, mode) {
        if (path === "") {
            throw new FS.ErrnoError(44)
        }
        flags = typeof flags == "string" ? FS_modeStringToFlags(flags) : flags;
        mode = typeof mode == "undefined" ? 438 : mode;
        if (flags & 64) {
            mode = mode & 4095 | 32768
        } else {
            mode = 0
        }
        var node;
        if (typeof path == "object") {
            node = path
        } else {
            path = PATH.normalize(path);
            try {
                var lookup = FS.lookupPath(path, {
                    follow: !(flags & 131072)
                });
                node = lookup.node
            } catch (e) {}
        }
        var created = false;
        if (flags & 64) {
            if (node) {
                if (flags & 128) {
                    throw new FS.ErrnoError(20)
                }
            } else {
                node = FS.mknod(path, mode, 0);
                created = true
            }
        }
        if (!node) {
            throw new FS.ErrnoError(44)
        }
        if (FS.isChrdev(node.mode)) {
            flags &= ~512
        }
        if (flags & 65536 && !FS.isDir(node.mode)) {
            throw new FS.ErrnoError(54)
        }
        if (!created) {
            var errCode = FS.mayOpen(node, flags);
            if (errCode) {
                throw new FS.ErrnoError(errCode)
            }
        }
        if (flags & 512 && !created) {
            FS.truncate(node, 0)
        }
        flags &= ~(128 | 512 | 131072);
        var stream = FS.createStream({
            node: node,
            path: FS.getPath(node),
            flags: flags,
            seekable: true,
            position: 0,
            stream_ops: node.stream_ops,
            ungotten: [],
            error: false
        });
        if (stream.stream_ops.open) {
            stream.stream_ops.open(stream)
        }
        if (Module["logReadFiles"] && !(flags & 1)) {
            if (!FS.readFiles)
                FS.readFiles = {};
            if (!(path in FS.readFiles)) {
                FS.readFiles[path] = 1
            }
        }
        return stream
    },
    close(stream) {
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8)
        }
        if (stream.getdents)
            stream.getdents = null;
        try {
            if (stream.stream_ops.close) {
                stream.stream_ops.close(stream)
            }
        } catch (e) {
            throw e
        } finally {
            FS.closeStream(stream.fd)
        }
        stream.fd = null
    },
    isClosed(stream) {
        return stream.fd === null
    },
    llseek(stream, offset, whence) {
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8)
        }
        if (!stream.seekable || !stream.stream_ops.llseek) {
            throw new FS.ErrnoError(70)
        }
        if (whence != 0 && whence != 1 && whence != 2) {
            throw new FS.ErrnoError(28)
        }
        stream.position = stream.stream_ops.llseek(stream, offset, whence);
        stream.ungotten = [];
        return stream.position
    },
    read(stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
            throw new FS.ErrnoError(28)
        }
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8)
        }
        if ((stream.flags & 2097155) === 1) {
            throw new FS.ErrnoError(8)
        }
        if (FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(31)
        }
        if (!stream.stream_ops.read) {
            throw new FS.ErrnoError(28)
        }
        var seeking = typeof position != "undefined";
        if (!seeking) {
            position = stream.position
        } else if (!stream.seekable) {
            throw new FS.ErrnoError(70)
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking)
            stream.position += bytesRead;
        return bytesRead
    },
    write(stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
            throw new FS.ErrnoError(28)
        }
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8)
        }
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(8)
        }
        if (FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(31)
        }
        if (!stream.stream_ops.write) {
            throw new FS.ErrnoError(28)
        }
        if (stream.seekable && stream.flags & 1024) {
            FS.llseek(stream, 0, 2)
        }
        var seeking = typeof position != "undefined";
        if (!seeking) {
            position = stream.position
        } else if (!stream.seekable) {
            throw new FS.ErrnoError(70)
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking)
            stream.position += bytesWritten;
        return bytesWritten
    },
    allocate(stream, offset, length) {
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8)
        }
        if (offset < 0 || length <= 0) {
            throw new FS.ErrnoError(28)
        }
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(8)
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(43)
        }
        if (!stream.stream_ops.allocate) {
            throw new FS.ErrnoError(138)
        }
        stream.stream_ops.allocate(stream, offset, length)
    },
    mmap(stream, length, position, prot, flags) {
        if ((prot & 2) !== 0 && (flags & 2) === 0 && (stream.flags & 2097155) !== 2) {
            throw new FS.ErrnoError(2)
        }
        if ((stream.flags & 2097155) === 1) {
            throw new FS.ErrnoError(2)
        }
        if (!stream.stream_ops.mmap) {
            throw new FS.ErrnoError(43)
        }
        return stream.stream_ops.mmap(stream, length, position, prot, flags)
    },
    msync(stream, buffer, offset, length, mmapFlags) {
        if (!stream.stream_ops.msync) {
            return 0
        }
        return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags)
    },
    munmap: stream=>0,
    ioctl(stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
            throw new FS.ErrnoError(59)
        }
        return stream.stream_ops.ioctl(stream, cmd, arg)
    },
    readFile(path, opts={}) {
        opts.flags = opts.flags || 0;
        opts.encoding = opts.encoding || "binary";
        if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
            throw new Error(`Invalid encoding type "${opts.encoding}"`)
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === "utf8") {
            ret = UTF8ArrayToString(buf, 0)
        } else if (opts.encoding === "binary") {
            ret = buf
        }
        FS.close(stream);
        return ret
    },
    writeFile(path, data, opts={}) {
        opts.flags = opts.flags || 577;
        var stream = FS.open(path, opts.flags, opts.mode);
        if (typeof data == "string") {
            var buf = new Uint8Array(lengthBytesUTF8(data) + 1);
            var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
            FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn)
        } else if (ArrayBuffer.isView(data)) {
            FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn)
        } else {
            throw new Error("Unsupported data type")
        }
        FS.close(stream)
    },
    cwd: ()=>FS.currentPath,
    chdir(path) {
        var lookup = FS.lookupPath(path, {
            follow: true
        });
        if (lookup.node === null) {
            throw new FS.ErrnoError(44)
        }
        if (!FS.isDir(lookup.node.mode)) {
            throw new FS.ErrnoError(54)
        }
        var errCode = FS.nodePermissions(lookup.node, "x");
        if (errCode) {
            throw new FS.ErrnoError(errCode)
        }
        FS.currentPath = lookup.path
    },
    createDefaultDirectories() {
        FS.mkdir("/tmp");
        FS.mkdir("/home");
        FS.mkdir("/home/web_user")
    },
    createDefaultDevices() {
        FS.mkdir("/dev");
        FS.registerDevice(FS.makedev(1, 3), {
            read: ()=>0,
            write: (stream,buffer,offset,length,pos)=>length
        });
        FS.mkdev("/dev/null", FS.makedev(1, 3));
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev("/dev/tty", FS.makedev(5, 0));
        FS.mkdev("/dev/tty1", FS.makedev(6, 0));
        var randomBuffer = new Uint8Array(1024)
          , randomLeft = 0;
        var randomByte = ()=>{
            if (randomLeft === 0) {
                randomLeft = randomFill(randomBuffer).byteLength
            }
            return randomBuffer[--randomLeft]
        }
        ;
        FS.createDevice("/dev", "random", randomByte);
        FS.createDevice("/dev", "urandom", randomByte);
        FS.mkdir("/dev/shm");
        FS.mkdir("/dev/shm/tmp")
    },
    createSpecialDirectories() {
        FS.mkdir("/proc");
        var proc_self = FS.mkdir("/proc/self");
        FS.mkdir("/proc/self/fd");
        FS.mount({
            mount() {
                var node = FS.createNode(proc_self, "fd", 16384 | 511, 73);
                node.node_ops = {
                    lookup(parent, name) {
                        var fd = +name;
                        var stream = FS.getStreamChecked(fd);
                        var ret = {
                            parent: null,
                            mount: {
                                mountpoint: "fake"
                            },
                            node_ops: {
                                readlink: ()=>stream.path
                            }
                        };
                        ret.parent = ret;
                        return ret
                    }
                };
                return node
            }
        }, {}, "/proc/self/fd")
    },
    createStandardStreams() {
        if (Module["stdin"]) {
            FS.createDevice("/dev", "stdin", Module["stdin"])
        } else {
            FS.symlink("/dev/tty", "/dev/stdin")
        }
        if (Module["stdout"]) {
            FS.createDevice("/dev", "stdout", null, Module["stdout"])
        } else {
            FS.symlink("/dev/tty", "/dev/stdout")
        }
        if (Module["stderr"]) {
            FS.createDevice("/dev", "stderr", null, Module["stderr"])
        } else {
            FS.symlink("/dev/tty1", "/dev/stderr")
        }
        var stdin = FS.open("/dev/stdin", 0);
        var stdout = FS.open("/dev/stdout", 1);
        var stderr = FS.open("/dev/stderr", 1)
    },
    ensureErrnoError() {
        if (FS.ErrnoError)
            return;
        FS.ErrnoError = function ErrnoError(errno, node) {
            this.name = "ErrnoError";
            this.node = node;
            this.setErrno = function(errno) {
                this.errno = errno
            }
            ;
            this.setErrno(errno);
            this.message = "FS error"
        }
        ;
        FS.ErrnoError.prototype = new Error;
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        [44].forEach(code=>{
            FS.genericErrors[code] = new FS.ErrnoError(code);
            FS.genericErrors[code].stack = "<generic error, no stack>"
        }
        )
    },
    staticInit() {
        FS.ensureErrnoError();
        FS.nameTable = new Array(4096);
        FS.mount(MEMFS, {}, "/");
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
        FS.createSpecialDirectories();
        FS.filesystems = {
            "MEMFS": MEMFS,
            "IDBFS": IDBFS
        }
    },
    init(input, output, error) {
        FS.init.initialized = true;
        FS.ensureErrnoError();
        Module["stdin"] = input || Module["stdin"];
        Module["stdout"] = output || Module["stdout"];
        Module["stderr"] = error || Module["stderr"];
        FS.createStandardStreams()
    },
    quit() {
        FS.init.initialized = false;
        for (var i = 0; i < FS.streams.length; i++) {
            var stream = FS.streams[i];
            if (!stream) {
                continue
            }
            FS.close(stream)
        }
    },
    findObject(path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (!ret.exists) {
            return null
        }
        return ret.object
    },
    analyzePath(path, dontResolveLastLink) {
        try {
            var lookup = FS.lookupPath(path, {
                follow: !dontResolveLastLink
            });
            path = lookup.path
        } catch (e) {}
        var ret = {
            isRoot: false,
            exists: false,
            error: 0,
            name: null,
            path: null,
            object: null,
            parentExists: false,
            parentPath: null,
            parentObject: null
        };
        try {
            var lookup = FS.lookupPath(path, {
                parent: true
            });
            ret.parentExists = true;
            ret.parentPath = lookup.path;
            ret.parentObject = lookup.node;
            ret.name = PATH.basename(path);
            lookup = FS.lookupPath(path, {
                follow: !dontResolveLastLink
            });
            ret.exists = true;
            ret.path = lookup.path;
            ret.object = lookup.node;
            ret.name = lookup.node.name;
            ret.isRoot = lookup.path === "/"
        } catch (e) {
            ret.error = e.errno
        }
        return ret
    },
    createPath(parent, path, canRead, canWrite) {
        parent = typeof parent == "string" ? parent : FS.getPath(parent);
        var parts = path.split("/").reverse();
        while (parts.length) {
            var part = parts.pop();
            if (!part)
                continue;
            var current = PATH.join2(parent, part);
            try {
                FS.mkdir(current)
            } catch (e) {}
            parent = current
        }
        return current
    },
    createFile(parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent == "string" ? parent : FS.getPath(parent), name);
        var mode = FS_getMode(canRead, canWrite);
        return FS.create(path, mode)
    },
    createDataFile(parent, name, data, canRead, canWrite, canOwn) {
        var path = name;
        if (parent) {
            parent = typeof parent == "string" ? parent : FS.getPath(parent);
            path = name ? PATH.join2(parent, name) : parent
        }
        var mode = FS_getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
            if (typeof data == "string") {
                var arr = new Array(data.length);
                for (var i = 0, len = data.length; i < len; ++i)
                    arr[i] = data.charCodeAt(i);
                data = arr
            }
            FS.chmod(node, mode | 146);
            var stream = FS.open(node, 577);
            FS.write(stream, data, 0, data.length, 0, canOwn);
            FS.close(stream);
            FS.chmod(node, mode)
        }
    },
    createDevice(parent, name, input, output) {
        var path = PATH.join2(typeof parent == "string" ? parent : FS.getPath(parent), name);
        var mode = FS_getMode(!!input, !!output);
        if (!FS.createDevice.major)
            FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        FS.registerDevice(dev, {
            open(stream) {
                stream.seekable = false
            },
            close(stream) {
                if (output?.buffer?.length) {
                    output(10)
                }
            },
            read(stream, buffer, offset, length, pos) {
                var bytesRead = 0;
                for (var i = 0; i < length; i++) {
                    var result;
                    try {
                        result = input()
                    } catch (e) {
                        throw new FS.ErrnoError(29)
                    }
                    if (result === undefined && bytesRead === 0) {
                        throw new FS.ErrnoError(6)
                    }
                    if (result === null || result === undefined)
                        break;
                    bytesRead++;
                    buffer[offset + i] = result
                }
                if (bytesRead) {
                    stream.node.timestamp = Date.now()
                }
                return bytesRead
            },
            write(stream, buffer, offset, length, pos) {
                for (var i = 0; i < length; i++) {
                    try {
                        output(buffer[offset + i])
                    } catch (e) {
                        throw new FS.ErrnoError(29)
                    }
                }
                if (length) {
                    stream.node.timestamp = Date.now()
                }
                return i
            }
        });
        return FS.mkdev(path, mode, dev)
    },
    forceLoadFile(obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents)
            return true;
        if (typeof XMLHttpRequest != "undefined") {
            throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.")
        } else if (read_) {
            try {
                obj.contents = intArrayFromString(read_(obj.url), true);
                obj.usedBytes = obj.contents.length
            } catch (e) {
                throw new FS.ErrnoError(29)
            }
        } else {
            throw new Error("Cannot load without read() or XMLHttpRequest.")
        }
    },
    createLazyFile(parent, name, url, canRead, canWrite) {
        function LazyUint8Array() {
            this.lengthKnown = false;
            this.chunks = []
        }
        LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
            if (idx > this.length - 1 || idx < 0) {
                return undefined
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = idx / this.chunkSize | 0;
            return this.getter(chunkNum)[chunkOffset]
        }
        ;
        LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
            this.getter = getter
        }
        ;
        LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
            var xhr = new XMLHttpRequest;
            xhr.open("HEAD", url, false);
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304))
                throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            var datalength = Number(xhr.getResponseHeader("Content-length"));
            var header;
            var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
            var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
            var chunkSize = 1024 * 1024;
            if (!hasByteServing)
                chunkSize = datalength;
            var doXHR = (from,to)=>{
                if (from > to)
                    throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength - 1)
                    throw new Error("only " + datalength + " bytes available! programmer error!");
                var xhr = new XMLHttpRequest;
                xhr.open("GET", url, false);
                if (datalength !== chunkSize)
                    xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
                xhr.responseType = "arraybuffer";
                if (xhr.overrideMimeType) {
                    xhr.overrideMimeType("text/plain; charset=x-user-defined")
                }
                xhr.send(null);
                if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304))
                    throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                    return new Uint8Array(xhr.response || [])
                }
                return intArrayFromString(xhr.responseText || "", true)
            }
            ;
            var lazyArray = this;
            lazyArray.setDataGetter(chunkNum=>{
                var start = chunkNum * chunkSize;
                var end = (chunkNum + 1) * chunkSize - 1;
                end = Math.min(end, datalength - 1);
                if (typeof lazyArray.chunks[chunkNum] == "undefined") {
                    lazyArray.chunks[chunkNum] = doXHR(start, end)
                }
                if (typeof lazyArray.chunks[chunkNum] == "undefined")
                    throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum]
            }
            );
            if (usesGzip || !datalength) {
                chunkSize = datalength = 1;
                datalength = this.getter(0).length;
                chunkSize = datalength;
                out("LazyFiles on gzip forces download of the whole file when length is accessed")
            }
            this._length = datalength;
            this._chunkSize = chunkSize;
            this.lengthKnown = true
        }
        ;
        if (typeof XMLHttpRequest != "undefined") {
            if (!ENVIRONMENT_IS_WORKER)
                throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
            var lazyArray = new LazyUint8Array;
            Object.defineProperties(lazyArray, {
                length: {
                    get: function() {
                        if (!this.lengthKnown) {
                            this.cacheLength()
                        }
                        return this._length
                    }
                },
                chunkSize: {
                    get: function() {
                        if (!this.lengthKnown) {
                            this.cacheLength()
                        }
                        return this._chunkSize
                    }
                }
            });
            var properties = {
                isDevice: false,
                contents: lazyArray
            }
        } else {
            var properties = {
                isDevice: false,
                url: url
            }
        }
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        if (properties.contents) {
            node.contents = properties.contents
        } else if (properties.url) {
            node.contents = null;
            node.url = properties.url
        }
        Object.defineProperties(node, {
            usedBytes: {
                get: function() {
                    return this.contents.length
                }
            }
        });
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(key=>{
            var fn = node.stream_ops[key];
            stream_ops[key] = function forceLoadLazyFile() {
                FS.forceLoadFile(node);
                return fn.apply(null, arguments)
            }
        }
        );
        function writeChunks(stream, buffer, offset, length, position) {
            var contents = stream.node.contents;
            if (position >= contents.length)
                return 0;
            var size = Math.min(contents.length - position, length);
            if (contents.slice) {
                for (var i = 0; i < size; i++) {
                    buffer[offset + i] = contents[position + i]
                }
            } else {
                for (var i = 0; i < size; i++) {
                    buffer[offset + i] = contents.get(position + i)
                }
            }
            return size
        }
        stream_ops.read = (stream,buffer,offset,length,position)=>{
            FS.forceLoadFile(node);
            return writeChunks(stream, buffer, offset, length, position)
        }
        ;
        stream_ops.mmap = (stream,length,position,prot,flags)=>{
            FS.forceLoadFile(node);
            var ptr = mmapAlloc(length);
            if (!ptr) {
                throw new FS.ErrnoError(48)
            }
            writeChunks(stream, HEAP8, ptr, length, position);
            return {
                ptr: ptr,
                allocated: true
            }
        }
        ;
        node.stream_ops = stream_ops;
        return node
    }
};
var SYSCALLS = {
    DEFAULT_POLLMASK: 5,
    calculateAt(dirfd, path, allowEmpty) {
        if (PATH.isAbs(path)) {
            return path
        }
        var dir;
        if (dirfd === -100) {
            dir = FS.cwd()
        } else {
            var dirstream = SYSCALLS.getStreamFromFD(dirfd);
            dir = dirstream.path
        }
        if (path.length == 0) {
            if (!allowEmpty) {
                throw new FS.ErrnoError(44)
            }
            return dir
        }
        return PATH.join2(dir, path)
    },
    doStat(func, path, buf) {
        try {
            var stat = func(path)
        } catch (e) {
            if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
                return -54
            }
            throw e
        }
        HEAP32[buf >> 2] = stat.dev;
        HEAP32[buf + 4 >> 2] = stat.mode;
        HEAPU32[buf + 8 >> 2] = stat.nlink;
        HEAP32[buf + 12 >> 2] = stat.uid;
        HEAP32[buf + 16 >> 2] = stat.gid;
        HEAP32[buf + 20 >> 2] = stat.rdev;
        tempI64 = [stat.size >>> 0, (tempDouble = stat.size,
        +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? +Math.floor(tempDouble / 4294967296) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)],
        HEAP32[buf + 24 >> 2] = tempI64[0],
        HEAP32[buf + 28 >> 2] = tempI64[1];
        HEAP32[buf + 32 >> 2] = 4096;
        HEAP32[buf + 36 >> 2] = stat.blocks;
        var atime = stat.atime.getTime();
        var mtime = stat.mtime.getTime();
        var ctime = stat.ctime.getTime();
        tempI64 = [Math.floor(atime / 1e3) >>> 0, (tempDouble = Math.floor(atime / 1e3),
        +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? +Math.floor(tempDouble / 4294967296) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)],
        HEAP32[buf + 40 >> 2] = tempI64[0],
        HEAP32[buf + 44 >> 2] = tempI64[1];
        HEAPU32[buf + 48 >> 2] = atime % 1e3 * 1e3;
        tempI64 = [Math.floor(mtime / 1e3) >>> 0, (tempDouble = Math.floor(mtime / 1e3),
        +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? +Math.floor(tempDouble / 4294967296) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)],
        HEAP32[buf + 56 >> 2] = tempI64[0],
        HEAP32[buf + 60 >> 2] = tempI64[1];
        HEAPU32[buf + 64 >> 2] = mtime % 1e3 * 1e3;
        tempI64 = [Math.floor(ctime / 1e3) >>> 0, (tempDouble = Math.floor(ctime / 1e3),
        +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? +Math.floor(tempDouble / 4294967296) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)],
        HEAP32[buf + 72 >> 2] = tempI64[0],
        HEAP32[buf + 76 >> 2] = tempI64[1];
        HEAPU32[buf + 80 >> 2] = ctime % 1e3 * 1e3;
        tempI64 = [stat.ino >>> 0, (tempDouble = stat.ino,
        +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? +Math.floor(tempDouble / 4294967296) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)],
        HEAP32[buf + 88 >> 2] = tempI64[0],
        HEAP32[buf + 92 >> 2] = tempI64[1];
        return 0
    },
    doMsync(addr, stream, len, flags, offset) {
        if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(43)
        }
        if (flags & 2) {
            return 0
        }
        var buffer = HEAPU8.slice(addr, addr + len);
        FS.msync(stream, buffer, offset, len, flags)
    },
    varargs: undefined,
    get() {
        var ret = HEAP32[+SYSCALLS.varargs >> 2];
        SYSCALLS.varargs += 4;
        return ret
    },
    getp() {
        return SYSCALLS.get()
    },
    getStr(ptr) {
        var ret = UTF8ToString(ptr);
        return ret
    },
    getStreamFromFD(fd) {
        var stream = FS.getStreamChecked(fd);
        return stream
    }
};
function ___syscall_faccessat(dirfd, path, amode, flags) {
    try {
        path = SYSCALLS.getStr(path);
        path = SYSCALLS.calculateAt(dirfd, path);
        if (amode & ~7) {
            return -28
        }
        var lookup = FS.lookupPath(path, {
            follow: true
        });
        var node = lookup.node;
        if (!node) {
            return -44
        }
        var perms = "";
        if (amode & 4)
            perms += "r";
        if (amode & 2)
            perms += "w";
        if (amode & 1)
            perms += "x";
        if (perms && FS.nodePermissions(node, perms)) {
            return -2
        }
        return 0
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError"))
            throw e;
        return -e.errno
    }
}
var setErrNo = value=>{
    HEAP32[___errno_location() >> 2] = value;
    return value
}
;
function ___syscall_fcntl64(fd, cmd, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        switch (cmd) {
        case 0:
            {
                var arg = SYSCALLS.get();
                if (arg < 0) {
                    return -28
                }
                while (FS.streams[arg]) {
                    arg++
                }
                var newStream;
                newStream = FS.createStream(stream, arg);
                return newStream.fd
            }
        case 1:
        case 2:
            return 0;
        case 3:
            return stream.flags;
        case 4:
            {
                var arg = SYSCALLS.get();
                stream.flags |= arg;
                return 0
            }
        case 5:
            {
                var arg = SYSCALLS.getp();
                var offset = 0;
                HEAP16[arg + offset >> 1] = 2;
                return 0
            }
        case 6:
        case 7:
            return 0;
        case 16:
        case 8:
            return -28;
        case 9:
            setErrNo(28);
            return -1;
        default:
            {
                return -28
            }
        }
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError"))
            throw e;
        return -e.errno
    }
}
var stringToUTF8 = (str,outPtr,maxBytesToWrite)=>stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
function ___syscall_getdents64(fd, dirp, count) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        stream.getdents ||= FS.readdir(stream.path);
        var struct_size = 280;
        var pos = 0;
        var off = FS.llseek(stream, 0, 1);
        var idx = Math.floor(off / struct_size);
        while (idx < stream.getdents.length && pos + struct_size <= count) {
            var id;
            var type;
            var name = stream.getdents[idx];
            if (name === ".") {
                id = stream.node.id;
                type = 4
            } else if (name === "..") {
                var lookup = FS.lookupPath(stream.path, {
                    parent: true
                });
                id = lookup.node.id;
                type = 4
            } else {
                var child = FS.lookupNode(stream.node, name);
                id = child.id;
                type = FS.isChrdev(child.mode) ? 2 : FS.isDir(child.mode) ? 4 : FS.isLink(child.mode) ? 10 : 8
            }
            tempI64 = [id >>> 0, (tempDouble = id,
            +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? +Math.floor(tempDouble / 4294967296) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)],
            HEAP32[dirp + pos >> 2] = tempI64[0],
            HEAP32[dirp + pos + 4 >> 2] = tempI64[1];
            tempI64 = [(idx + 1) * struct_size >>> 0, (tempDouble = (idx + 1) * struct_size,
            +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? +Math.floor(tempDouble / 4294967296) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)],
            HEAP32[dirp + pos + 8 >> 2] = tempI64[0],
            HEAP32[dirp + pos + 12 >> 2] = tempI64[1];
            HEAP16[dirp + pos + 16 >> 1] = 280;
            HEAP8[dirp + pos + 18 >> 0] = type;
            stringToUTF8(name, dirp + pos + 19, 256);
            pos += struct_size;
            idx += 1
        }
        FS.llseek(stream, idx * struct_size, 0);
        return pos
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError"))
            throw e;
        return -e.errno
    }
}
function ___syscall_ioctl(fd, op, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        switch (op) {
        case 21509:
            {
                if (!stream.tty)
                    return -59;
                return 0
            }
        case 21505:
            {
                if (!stream.tty)
                    return -59;
                if (stream.tty.ops.ioctl_tcgets) {
                    var termios = stream.tty.ops.ioctl_tcgets(stream);
                    var argp = SYSCALLS.getp();
                    HEAP32[argp >> 2] = termios.c_iflag || 0;
                    HEAP32[argp + 4 >> 2] = termios.c_oflag || 0;
                    HEAP32[argp + 8 >> 2] = termios.c_cflag || 0;
                    HEAP32[argp + 12 >> 2] = termios.c_lflag || 0;
                    for (var i = 0; i < 32; i++) {
                        HEAP8[argp + i + 17 >> 0] = termios.c_cc[i] || 0
                    }
                    return 0
                }
                return 0
            }
        case 21510:
        case 21511:
        case 21512:
            {
                if (!stream.tty)
                    return -59;
                return 0
            }
        case 21506:
        case 21507:
        case 21508:
            {
                if (!stream.tty)
                    return -59;
                if (stream.tty.ops.ioctl_tcsets) {
                    var argp = SYSCALLS.getp();
                    var c_iflag = HEAP32[argp >> 2];
                    var c_oflag = HEAP32[argp + 4 >> 2];
                    var c_cflag = HEAP32[argp + 8 >> 2];
                    var c_lflag = HEAP32[argp + 12 >> 2];
                    var c_cc = [];
                    for (var i = 0; i < 32; i++) {
                        c_cc.push(HEAP8[argp + i + 17 >> 0])
                    }
                    return stream.tty.ops.ioctl_tcsets(stream.tty, op, {
                        c_iflag: c_iflag,
                        c_oflag: c_oflag,
                        c_cflag: c_cflag,
                        c_lflag: c_lflag,
                        c_cc: c_cc
                    })
                }
                return 0
            }
        case 21519:
            {
                if (!stream.tty)
                    return -59;
                var argp = SYSCALLS.getp();
                HEAP32[argp >> 2] = 0;
                return 0
            }
        case 21520:
            {
                if (!stream.tty)
                    return -59;
                return -28
            }
        case 21531:
            {
                var argp = SYSCALLS.getp();
                return FS.ioctl(stream, op, argp)
            }
        case 21523:
            {
                if (!stream.tty)
                    return -59;
                if (stream.tty.ops.ioctl_tiocgwinsz) {
                    var winsize = stream.tty.ops.ioctl_tiocgwinsz(stream.tty);
                    var argp = SYSCALLS.getp();
                    HEAP16[argp >> 1] = winsize[0];
                    HEAP16[argp + 2 >> 1] = winsize[1]
                }
                return 0
            }
        case 21524:
            {
                if (!stream.tty)
                    return -59;
                return 0
            }
        case 21515:
            {
                if (!stream.tty)
                    return -59;
                return 0
            }
        default:
            return -28
        }
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError"))
            throw e;
        return -e.errno
    }
}
function ___syscall_mkdirat(dirfd, path, mode) {
    try {
        path = SYSCALLS.getStr(path);
        path = SYSCALLS.calculateAt(dirfd, path);
        path = PATH.normalize(path);
        if (path[path.length - 1] === "/")
            path = path.substr(0, path.length - 1);
        FS.mkdir(path, mode, 0);
        return 0
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError"))
            throw e;
        return -e.errno
    }
}
function ___syscall_openat(dirfd, path, flags, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        path = SYSCALLS.getStr(path);
        path = SYSCALLS.calculateAt(dirfd, path);
        var mode = varargs ? SYSCALLS.get() : 0;
        return FS.open(path, flags, mode).fd
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError"))
            throw e;
        return -e.errno
    }
}
function ___syscall_renameat(olddirfd, oldpath, newdirfd, newpath) {
    try {
        oldpath = SYSCALLS.getStr(oldpath);
        newpath = SYSCALLS.getStr(newpath);
        oldpath = SYSCALLS.calculateAt(olddirfd, oldpath);
        newpath = SYSCALLS.calculateAt(newdirfd, newpath);
        FS.rename(oldpath, newpath);
        return 0
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError"))
            throw e;
        return -e.errno
    }
}
function ___syscall_rmdir(path) {
    try {
        path = SYSCALLS.getStr(path);
        FS.rmdir(path);
        return 0
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError"))
            throw e;
        return -e.errno
    }
}
function ___syscall_stat64(path, buf) {
    try {
        path = SYSCALLS.getStr(path);
        return SYSCALLS.doStat(FS.stat, path, buf)
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError"))
            throw e;
        return -e.errno
    }
}
function ___syscall_unlinkat(dirfd, path, flags) {
    try {
        path = SYSCALLS.getStr(path);
        path = SYSCALLS.calculateAt(dirfd, path);
        if (flags === 0) {
            FS.unlink(path)
        } else if (flags === 512) {
            FS.rmdir(path)
        } else {
            abort("Invalid flags passed to unlinkat")
        }
        return 0
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError"))
            throw e;
        return -e.errno
    }
}
var readI53FromI64 = ptr=>HEAPU32[ptr >> 2] + HEAP32[ptr + 4 >> 2] * 4294967296;
function ___syscall_utimensat(dirfd, path, times, flags) {
    try {
        path = SYSCALLS.getStr(path);
        path = SYSCALLS.calculateAt(dirfd, path, true);
        if (!times) {
            var atime = Date.now();
            var mtime = atime
        } else {
            var seconds = readI53FromI64(times);
            var nanoseconds = HEAP32[times + 8 >> 2];
            atime = seconds * 1e3 + nanoseconds / (1e3 * 1e3);
            times += 16;
            seconds = readI53FromI64(times);
            nanoseconds = HEAP32[times + 8 >> 2];
            mtime = seconds * 1e3 + nanoseconds / (1e3 * 1e3)
        }
        FS.utime(path, atime, mtime);
        return 0
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError"))
            throw e;
        return -e.errno
    }
}
var isLeapYear = year=>year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
var MONTH_DAYS_LEAP_CUMULATIVE = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];
var MONTH_DAYS_REGULAR_CUMULATIVE = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
var ydayFromDate = date=>{
    var leap = isLeapYear(date.getFullYear());
    var monthDaysCumulative = leap ? MONTH_DAYS_LEAP_CUMULATIVE : MONTH_DAYS_REGULAR_CUMULATIVE;
    var yday = monthDaysCumulative[date.getMonth()] + date.getDate() - 1;
    return yday
}
;
var convertI32PairToI53Checked = (lo,hi)=>hi + 2097152 >>> 0 < 4194305 - !!lo ? (lo >>> 0) + hi * 4294967296 : NaN;
function __localtime_js(time_low, time_high, tmPtr) {
    var time = convertI32PairToI53Checked(time_low, time_high);
    var date = new Date(time * 1e3);
    HEAP32[tmPtr >> 2] = date.getSeconds();
    HEAP32[tmPtr + 4 >> 2] = date.getMinutes();
    HEAP32[tmPtr + 8 >> 2] = date.getHours();
    HEAP32[tmPtr + 12 >> 2] = date.getDate();
    HEAP32[tmPtr + 16 >> 2] = date.getMonth();
    HEAP32[tmPtr + 20 >> 2] = date.getFullYear() - 1900;
    HEAP32[tmPtr + 24 >> 2] = date.getDay();
    var yday = ydayFromDate(date) | 0;
    HEAP32[tmPtr + 28 >> 2] = yday;
    HEAP32[tmPtr + 36 >> 2] = -(date.getTimezoneOffset() * 60);
    var start = new Date(date.getFullYear(),0,1);
    var summerOffset = new Date(date.getFullYear(),6,1).getTimezoneOffset();
    var winterOffset = start.getTimezoneOffset();
    var dst = (summerOffset != winterOffset && date.getTimezoneOffset() == Math.min(winterOffset, summerOffset)) | 0;
    HEAP32[tmPtr + 32 >> 2] = dst
}
var __mktime_js = function(tmPtr) {
    var ret = (()=>{
        var date = new Date(HEAP32[tmPtr + 20 >> 2] + 1900,HEAP32[tmPtr + 16 >> 2],HEAP32[tmPtr + 12 >> 2],HEAP32[tmPtr + 8 >> 2],HEAP32[tmPtr + 4 >> 2],HEAP32[tmPtr >> 2],0);
        var dst = HEAP32[tmPtr + 32 >> 2];
        var guessedOffset = date.getTimezoneOffset();
        var start = new Date(date.getFullYear(),0,1);
        var summerOffset = new Date(date.getFullYear(),6,1).getTimezoneOffset();
        var winterOffset = start.getTimezoneOffset();
        var dstOffset = Math.min(winterOffset, summerOffset);
        if (dst < 0) {
            HEAP32[tmPtr + 32 >> 2] = Number(summerOffset != winterOffset && dstOffset == guessedOffset)
        } else if (dst > 0 != (dstOffset == guessedOffset)) {
            var nonDstOffset = Math.max(winterOffset, summerOffset);
            var trueOffset = dst > 0 ? dstOffset : nonDstOffset;
            date.setTime(date.getTime() + (trueOffset - guessedOffset) * 6e4)
        }
        HEAP32[tmPtr + 24 >> 2] = date.getDay();
        var yday = ydayFromDate(date) | 0;
        HEAP32[tmPtr + 28 >> 2] = yday;
        HEAP32[tmPtr >> 2] = date.getSeconds();
        HEAP32[tmPtr + 4 >> 2] = date.getMinutes();
        HEAP32[tmPtr + 8 >> 2] = date.getHours();
        HEAP32[tmPtr + 12 >> 2] = date.getDate();
        HEAP32[tmPtr + 16 >> 2] = date.getMonth();
        HEAP32[tmPtr + 20 >> 2] = date.getYear();
        var timeMs = date.getTime();
        if (isNaN(timeMs)) {
            setErrNo(61);
            return -1
        }
        return timeMs / 1e3
    }
    )();
    return setTempRet0((tempDouble = ret,
    +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? +Math.floor(tempDouble / 4294967296) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)),
    ret >>> 0
};
var stringToNewUTF8 = str=>{
    var size = lengthBytesUTF8(str) + 1;
    var ret = _malloc(size);
    if (ret)
        stringToUTF8(str, ret, size);
    return ret
}
;
var __tzset_js = (timezone,daylight,tzname)=>{
    var currentYear = (new Date).getFullYear();
    var winter = new Date(currentYear,0,1);
    var summer = new Date(currentYear,6,1);
    var winterOffset = winter.getTimezoneOffset();
    var summerOffset = summer.getTimezoneOffset();
    var stdTimezoneOffset = Math.max(winterOffset, summerOffset);
    HEAPU32[timezone >> 2] = stdTimezoneOffset * 60;
    HEAP32[daylight >> 2] = Number(winterOffset != summerOffset);
    function extractZone(date) {
        var match = date.toTimeString().match(/\(([A-Za-z ]+)\)$/);
        return match ? match[1] : "GMT"
    }
    var winterName = extractZone(winter);
    var summerName = extractZone(summer);
    var winterNamePtr = stringToNewUTF8(winterName);
    var summerNamePtr = stringToNewUTF8(summerName);
    if (summerOffset < winterOffset) {
        HEAPU32[tzname >> 2] = winterNamePtr;
        HEAPU32[tzname + 4 >> 2] = summerNamePtr
    } else {
        HEAPU32[tzname >> 2] = summerNamePtr;
        HEAPU32[tzname + 4 >> 2] = winterNamePtr
    }
}
;
var _abort = ()=>{
    abort("")
}
;
var readEmAsmArgsArray = [];
var readEmAsmArgs = (sigPtr,buf)=>{
    readEmAsmArgsArray.length = 0;
    var ch;
    while (ch = HEAPU8[sigPtr++]) {
        var wide = ch != 105;
        wide &= ch != 112;
        buf += wide && buf % 8 ? 4 : 0;
        readEmAsmArgsArray.push(ch == 112 ? HEAPU32[buf >> 2] : ch == 105 ? HEAP32[buf >> 2] : HEAPF64[buf >> 3]);
        buf += wide ? 8 : 4
    }
    return readEmAsmArgsArray
}
;
var runEmAsmFunction = (code,sigPtr,argbuf)=>{
    var args = readEmAsmArgs(sigPtr, argbuf);
    return ASM_CONSTS[code].apply(null, args)
}
;
var _emscripten_asm_const_int = (code,sigPtr,argbuf)=>runEmAsmFunction(code, sigPtr, argbuf);
var _emscripten_set_main_loop_timing = (mode,value)=>{
    Browser.mainLoop.timingMode = mode;
    Browser.mainLoop.timingValue = value;
    if (!Browser.mainLoop.func) {
        return 1
    }
    if (!Browser.mainLoop.running) {
        Browser.mainLoop.running = true
    }
    if (mode == 0) {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setTimeout() {
            var timeUntilNextTick = Math.max(0, Browser.mainLoop.tickStartTime + value - _emscripten_get_now()) | 0;
            setTimeout(Browser.mainLoop.runner, timeUntilNextTick)
        }
        ;
        Browser.mainLoop.method = "timeout"
    } else if (mode == 1) {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_rAF() {
            Browser.requestAnimationFrame(Browser.mainLoop.runner)
        }
        ;
        Browser.mainLoop.method = "rAF"
    } else if (mode == 2) {
        if (typeof Browser.setImmediate == "undefined") {
            if (typeof setImmediate == "undefined") {
                var setImmediates = [];
                var emscriptenMainLoopMessageId = "setimmediate";
                var Browser_setImmediate_messageHandler = event=>{
                    if (event.data === emscriptenMainLoopMessageId || event.data.target === emscriptenMainLoopMessageId) {
                        event.stopPropagation();
                        setImmediates.shift()()
                    }
                }
                ;
                addEventListener("message", Browser_setImmediate_messageHandler, true);
                Browser.setImmediate = function Browser_emulated_setImmediate(func) {
                    setImmediates.push(func);
                    if (ENVIRONMENT_IS_WORKER) {
                        if (Module["setImmediates"] === undefined)
                            Module["setImmediates"] = [];
                        Module["setImmediates"].push(func);
                        postMessage({
                            target: emscriptenMainLoopMessageId
                        })
                    } else
                        postMessage(emscriptenMainLoopMessageId, "*")
                }
            } else {
                Browser.setImmediate = setImmediate
            }
        }
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setImmediate() {
            Browser.setImmediate(Browser.mainLoop.runner)
        }
        ;
        Browser.mainLoop.method = "immediate"
    }
    return 0
}
;
var _emscripten_get_now;
_emscripten_get_now = ()=>performance.now();
var setMainLoop = (browserIterationFunc,fps,simulateInfiniteLoop,arg,noSetTiming)=>{
    assert(!Browser.mainLoop.func, "emscripten_set_main_loop: there can only be one main loop function at once: call emscripten_cancel_main_loop to cancel the previous one before setting a new one with different parameters.");
    Browser.mainLoop.func = browserIterationFunc;
    Browser.mainLoop.arg = arg;
    var thisMainLoopId = Browser.mainLoop.currentlyRunningMainloop;
    function checkIsRunning() {
        if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) {
            return false
        }
        return true
    }
    Browser.mainLoop.running = false;
    Browser.mainLoop.runner = function Browser_mainLoop_runner() {
        if (ABORT)
            return;
        if (Browser.mainLoop.queue.length > 0) {
            var start = Date.now();
            var blocker = Browser.mainLoop.queue.shift();
            blocker.func(blocker.arg);
            if (Browser.mainLoop.remainingBlockers) {
                var remaining = Browser.mainLoop.remainingBlockers;
                var next = remaining % 1 == 0 ? remaining - 1 : Math.floor(remaining);
                if (blocker.counted) {
                    Browser.mainLoop.remainingBlockers = next
                } else {
                    next = next + .5;
                    Browser.mainLoop.remainingBlockers = (8 * remaining + next) / 9
                }
            }
            Browser.mainLoop.updateStatus();
            if (!checkIsRunning())
                return;
            setTimeout(Browser.mainLoop.runner, 0);
            return
        }
        if (!checkIsRunning())
            return;
        Browser.mainLoop.currentFrameNumber = Browser.mainLoop.currentFrameNumber + 1 | 0;
        if (Browser.mainLoop.timingMode == 1 && Browser.mainLoop.timingValue > 1 && Browser.mainLoop.currentFrameNumber % Browser.mainLoop.timingValue != 0) {
            Browser.mainLoop.scheduler();
            return
        } else if (Browser.mainLoop.timingMode == 0) {
            Browser.mainLoop.tickStartTime = _emscripten_get_now()
        }
        Browser.mainLoop.runIter(browserIterationFunc);
        if (!checkIsRunning())
            return;
        if (typeof SDL == "object")
            SDL.audio?.queueNewAudioData?.();
        Browser.mainLoop.scheduler()
    }
    ;
    if (!noSetTiming) {
        if (fps && fps > 0) {
            _emscripten_set_main_loop_timing(0, 1e3 / fps)
        } else {
            _emscripten_set_main_loop_timing(1, 1)
        }
        Browser.mainLoop.scheduler()
    }
    if (simulateInfiniteLoop) {
        throw "unwind"
    }
}
;
var handleException = e=>{
    if (e instanceof ExitStatus || e == "unwind") {
        return EXITSTATUS
    }
    quit_(1, e)
}
;
var runtimeKeepaliveCounter = 0;
var keepRuntimeAlive = ()=>noExitRuntime || runtimeKeepaliveCounter > 0;
var _proc_exit = code=>{
    EXITSTATUS = code;
    if (!keepRuntimeAlive()) {
        Module["onExit"]?.(code);
        ABORT = true
    }
    quit_(code, new ExitStatus(code))
}
;
var exitJS = (status,implicit)=>{
    EXITSTATUS = status;
    _proc_exit(status)
}
;
var _exit = exitJS;
var maybeExit = ()=>{
    if (!keepRuntimeAlive()) {
        try {
            _exit(EXITSTATUS)
        } catch (e) {
            handleException(e)
        }
    }
}
;
var callUserCallback = func=>{
    if (ABORT) {
        return
    }
    try {
        func();
        maybeExit()
    } catch (e) {
        handleException(e)
    }
}
;
var safeSetTimeout = (func,timeout)=>setTimeout(()=>{
    callUserCallback(func)
}
, timeout);
var warnOnce = text=>{
    warnOnce.shown ||= {};
    if (!warnOnce.shown[text]) {
        warnOnce.shown[text] = 1;
        if (ENVIRONMENT_IS_NODE)
            text = "warning: " + text;
        err(text)
    }
}
;
var Browser = {
    mainLoop: {
        running: false,
        scheduler: null,
        method: "",
        currentlyRunningMainloop: 0,
        func: null,
        arg: 0,
        timingMode: 0,
        timingValue: 0,
        currentFrameNumber: 0,
        queue: [],
        pause() {
            Browser.mainLoop.scheduler = null;
            Browser.mainLoop.currentlyRunningMainloop++
        },
        resume() {
            Browser.mainLoop.currentlyRunningMainloop++;
            var timingMode = Browser.mainLoop.timingMode;
            var timingValue = Browser.mainLoop.timingValue;
            var func = Browser.mainLoop.func;
            Browser.mainLoop.func = null;
            setMainLoop(func, 0, false, Browser.mainLoop.arg, true);
            _emscripten_set_main_loop_timing(timingMode, timingValue);
            Browser.mainLoop.scheduler()
        },
        updateStatus() {
            if (Module["setStatus"]) {
                var message = Module["statusMessage"] || "Please wait...";
                var remaining = Browser.mainLoop.remainingBlockers;
                var expected = Browser.mainLoop.expectedBlockers;
                if (remaining) {
                    if (remaining < expected) {
                        Module["setStatus"](message + " (" + (expected - remaining) + "/" + expected + ")")
                    } else {
                        Module["setStatus"](message)
                    }
                } else {
                    Module["setStatus"]("")
                }
            }
        },
        runIter(func) {
            if (ABORT)
                return;
            if (Module["preMainLoop"]) {
                var preRet = Module["preMainLoop"]();
                if (preRet === false) {
                    return
                }
            }
            callUserCallback(func);
            Module["postMainLoop"]?.()
        }
    },
    isFullscreen: false,
    pointerLock: false,
    moduleContextCreatedCallbacks: [],
    workers: [],
    init() {
        if (Browser.initted)
            return;
        Browser.initted = true;
        var imagePlugin = {};
        imagePlugin["canHandle"] = function imagePlugin_canHandle(name) {
            return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name)
        }
        ;
        imagePlugin["handle"] = function imagePlugin_handle(byteArray, name, onload, onerror) {
            var b = new Blob([byteArray],{
                type: Browser.getMimetype(name)
            });
            if (b.size !== byteArray.length) {
                b = new Blob([new Uint8Array(byteArray).buffer],{
                    type: Browser.getMimetype(name)
                })
            }
            var url = URL.createObjectURL(b);
            var img = new Image;
            img.onload = ()=>{
                assert(img.complete, `Image ${name} could not be decoded`);
                var canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                var ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);
                preloadedImages[name] = canvas;
                URL.revokeObjectURL(url);
                onload?.(byteArray)
            }
            ;
            img.onerror = event=>{
                err(`Image ${url} could not be decoded`);
                onerror?.()
            }
            ;
            img.src = url
        }
        ;
        preloadPlugins.push(imagePlugin);
        var audioPlugin = {};
        audioPlugin["canHandle"] = function audioPlugin_canHandle(name) {
            return !Module.noAudioDecoding && name.substr(-4)in {
                ".ogg": 1,
                ".wav": 1,
                ".mp3": 1
            }
        }
        ;
        audioPlugin["handle"] = function audioPlugin_handle(byteArray, name, onload, onerror) {
            var done = false;
            function finish(audio) {
                if (done)
                    return;
                done = true;
                preloadedAudios[name] = audio;
                onload?.(byteArray)
            }
            var b = new Blob([byteArray],{
                type: Browser.getMimetype(name)
            });
            var url = URL.createObjectURL(b);
            var audio = new Audio;
            audio.addEventListener("canplaythrough", ()=>finish(audio), false);
            audio.onerror = function audio_onerror(event) {
                if (done)
                    return;
                err(`warning: browser could not fully decode audio ${name}, trying slower base64 approach`);
                function encode64(data) {
                    var BASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
                    var PAD = "=";
                    var ret = "";
                    var leftchar = 0;
                    var leftbits = 0;
                    for (var i = 0; i < data.length; i++) {
                        leftchar = leftchar << 8 | data[i];
                        leftbits += 8;
                        while (leftbits >= 6) {
                            var curr = leftchar >> leftbits - 6 & 63;
                            leftbits -= 6;
                            ret += BASE[curr]
                        }
                    }
                    if (leftbits == 2) {
                        ret += BASE[(leftchar & 3) << 4];
                        ret += PAD + PAD
                    } else if (leftbits == 4) {
                        ret += BASE[(leftchar & 15) << 2];
                        ret += PAD
                    }
                    return ret
                }
                audio.src = "data:audio/x-" + name.substr(-3) + ";base64," + encode64(byteArray);
                finish(audio)
            }
            ;
            audio.src = url;
            safeSetTimeout(()=>{
                finish(audio)
            }
            , 1e4)
        }
        ;
        preloadPlugins.push(audioPlugin);
        function pointerLockChange() {
            Browser.pointerLock = document["pointerLockElement"] === Module["canvas"] || document["mozPointerLockElement"] === Module["canvas"] || document["webkitPointerLockElement"] === Module["canvas"] || document["msPointerLockElement"] === Module["canvas"]
        }
        var canvas = Module["canvas"];
        if (canvas) {
            canvas.requestPointerLock = canvas["requestPointerLock"] || canvas["mozRequestPointerLock"] || canvas["webkitRequestPointerLock"] || canvas["msRequestPointerLock"] || (()=>{}
            );
            canvas.exitPointerLock = document["exitPointerLock"] || document["mozExitPointerLock"] || document["webkitExitPointerLock"] || document["msExitPointerLock"] || (()=>{}
            );
            canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
            document.addEventListener("pointerlockchange", pointerLockChange, false);
            document.addEventListener("mozpointerlockchange", pointerLockChange, false);
            document.addEventListener("webkitpointerlockchange", pointerLockChange, false);
            document.addEventListener("mspointerlockchange", pointerLockChange, false);
            if (Module["elementPointerLock"]) {
                canvas.addEventListener("click", ev=>{
                    if (!Browser.pointerLock && Module["canvas"].requestPointerLock) {
                        Module["canvas"].requestPointerLock();
                        ev.preventDefault()
                    }
                }
                , false)
            }
        }
    },
    createContext(canvas, useWebGL, setInModule, webGLContextAttributes) {
        if (useWebGL && Module.ctx && canvas == Module.canvas)
            return Module.ctx;
        var ctx;
        var contextHandle;
        if (useWebGL) {
            var contextAttributes = {
                antialias: false,
                alpha: false,
                majorVersion: 1
            };
            if (webGLContextAttributes) {
                for (var attribute in webGLContextAttributes) {
                    contextAttributes[attribute] = webGLContextAttributes[attribute]
                }
            }
            if (typeof GL != "undefined") {
                contextHandle = GL.createContext(canvas, contextAttributes);
                if (contextHandle) {
                    ctx = GL.getContext(contextHandle).GLctx
                }
            }
        } else {
            ctx = canvas.getContext("2d")
        }
        if (!ctx)
            return null;
        if (setInModule) {
            if (!useWebGL)
                assert(typeof GLctx == "undefined", "cannot set in module if GLctx is used, but we are a non-GL context that would replace it");
            Module.ctx = ctx;
            if (useWebGL)
                GL.makeContextCurrent(contextHandle);
            Module.useWebGL = useWebGL;
            Browser.moduleContextCreatedCallbacks.forEach(callback=>callback());
            Browser.init()
        }
        return ctx
    },
    destroyContext(canvas, useWebGL, setInModule) {},
    fullscreenHandlersInstalled: false,
    lockPointer: undefined,
    resizeCanvas: undefined,
    requestFullscreen(lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer == "undefined")
            Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas == "undefined")
            Browser.resizeCanvas = false;
        var canvas = Module["canvas"];
        function fullscreenChange() {
            Browser.isFullscreen = false;
            var canvasContainer = canvas.parentNode;
            if ((document["fullscreenElement"] || document["mozFullScreenElement"] || document["msFullscreenElement"] || document["webkitFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvasContainer) {
                canvas.exitFullscreen = Browser.exitFullscreen;
                if (Browser.lockPointer)
                    canvas.requestPointerLock();
                Browser.isFullscreen = true;
                if (Browser.resizeCanvas) {
                    Browser.setFullscreenCanvasSize()
                } else {
                    Browser.updateCanvasDimensions(canvas)
                }
            } else {
                canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
                canvasContainer.parentNode.removeChild(canvasContainer);
                if (Browser.resizeCanvas) {
                    Browser.setWindowedCanvasSize()
                } else {
                    Browser.updateCanvasDimensions(canvas)
                }
            }
            Module["onFullScreen"]?.(Browser.isFullscreen);
            Module["onFullscreen"]?.(Browser.isFullscreen)
        }
        if (!Browser.fullscreenHandlersInstalled) {
            Browser.fullscreenHandlersInstalled = true;
            document.addEventListener("fullscreenchange", fullscreenChange, false);
            document.addEventListener("mozfullscreenchange", fullscreenChange, false);
            document.addEventListener("webkitfullscreenchange", fullscreenChange, false);
            document.addEventListener("MSFullscreenChange", fullscreenChange, false)
        }
        var canvasContainer = document.createElement("div");
        canvas.parentNode.insertBefore(canvasContainer, canvas);
        canvasContainer.appendChild(canvas);
        canvasContainer.requestFullscreen = canvasContainer["requestFullscreen"] || canvasContainer["mozRequestFullScreen"] || canvasContainer["msRequestFullscreen"] || (canvasContainer["webkitRequestFullscreen"] ? ()=>canvasContainer["webkitRequestFullscreen"](Element["ALLOW_KEYBOARD_INPUT"]) : null) || (canvasContainer["webkitRequestFullScreen"] ? ()=>canvasContainer["webkitRequestFullScreen"](Element["ALLOW_KEYBOARD_INPUT"]) : null);
        canvasContainer.requestFullscreen()
    },
    exitFullscreen() {
        if (!Browser.isFullscreen) {
            return false
        }
        var CFS = document["exitFullscreen"] || document["cancelFullScreen"] || document["mozCancelFullScreen"] || document["msExitFullscreen"] || document["webkitCancelFullScreen"] || (()=>{}
        );
        CFS.apply(document, []);
        return true
    },
    nextRAF: 0,
    fakeRequestAnimationFrame(func) {
        var now = Date.now();
        if (Browser.nextRAF === 0) {
            Browser.nextRAF = now + 1e3 / 60
        } else {
            while (now + 2 >= Browser.nextRAF) {
                Browser.nextRAF += 1e3 / 60
            }
        }
        var delay = Math.max(Browser.nextRAF - now, 0);
        setTimeout(func, delay)
    },
    requestAnimationFrame(func) {
        if (typeof requestAnimationFrame == "function") {
            requestAnimationFrame(func);
            return
        }
        var RAF = Browser.fakeRequestAnimationFrame;
        RAF(func)
    },
    safeSetTimeout(func, timeout) {
        return safeSetTimeout(func, timeout)
    },
    safeRequestAnimationFrame(func) {
        return Browser.requestAnimationFrame(()=>{
            callUserCallback(func)
        }
        )
    },
    getMimetype(name) {
        return {
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "png": "image/png",
            "bmp": "image/bmp",
            "ogg": "audio/ogg",
            "wav": "audio/wav",
            "mp3": "audio/mpeg"
        }[name.substr(name.lastIndexOf(".") + 1)]
    },
    getUserMedia(func) {
        window.getUserMedia ||= navigator["getUserMedia"] || navigator["mozGetUserMedia"];
        window.getUserMedia(func)
    },
    getMovementX(event) {
        return event["movementX"] || event["mozMovementX"] || event["webkitMovementX"] || 0
    },
    getMovementY(event) {
        return event["movementY"] || event["mozMovementY"] || event["webkitMovementY"] || 0
    },
    getMouseWheelDelta(event) {
        var delta = 0;
        switch (event.type) {
        case "DOMMouseScroll":
            delta = event.detail / 3;
            break;
        case "mousewheel":
            delta = event.wheelDelta / 120;
            break;
        case "wheel":
            delta = event.deltaY;
            switch (event.deltaMode) {
            case 0:
                delta /= 100;
                break;
            case 1:
                delta /= 3;
                break;
            case 2:
                delta *= 80;
                break;
            default:
                throw "unrecognized mouse wheel delta mode: " + event.deltaMode
            }
            break;
        default:
            throw "unrecognized mouse wheel event: " + event.type
        }
        return delta
    },
    mouseX: 0,
    mouseY: 0,
    mouseMovementX: 0,
    mouseMovementY: 0,
    touches: {},
    lastTouches: {},
    calculateMouseCoords(pageX, pageY) {
        var rect = Module["canvas"].getBoundingClientRect();
        var cw = Module["canvas"].width;
        var ch = Module["canvas"].height;
        var scrollX = typeof window.scrollX != "undefined" ? window.scrollX : window.pageXOffset;
        var scrollY = typeof window.scrollY != "undefined" ? window.scrollY : window.pageYOffset;
        var adjustedX = pageX - (scrollX + rect.left);
        var adjustedY = pageY - (scrollY + rect.top);
        adjustedX = adjustedX * (cw / rect.width);
        adjustedY = adjustedY * (ch / rect.height);
        return {
            x: adjustedX,
            y: adjustedY
        }
    },
    setMouseCoords(pageX, pageY) {
        const {x: x, y: y} = Browser.calculateMouseCoords(pageX, pageY);
        Browser.mouseMovementX = x - Browser.mouseX;
        Browser.mouseMovementY = y - Browser.mouseY;
        Browser.mouseX = x;
        Browser.mouseY = y
    },
    calculateMouseEvent(event) {
        if (Browser.pointerLock) {
            if (event.type != "mousemove" && "mozMovementX"in event) {
                Browser.mouseMovementX = Browser.mouseMovementY = 0
            } else {
                Browser.mouseMovementX = Browser.getMovementX(event);
                Browser.mouseMovementY = Browser.getMovementY(event)
            }
            if (typeof SDL != "undefined") {
                Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
                Browser.mouseY = SDL.mouseY + Browser.mouseMovementY
            } else {
                Browser.mouseX += Browser.mouseMovementX;
                Browser.mouseY += Browser.mouseMovementY
            }
        } else {
            if (event.type === "touchstart" || event.type === "touchend" || event.type === "touchmove") {
                var touch = event.touch;
                if (touch === undefined) {
                    return
                }
                var coords = Browser.calculateMouseCoords(touch.pageX, touch.pageY);
                if (event.type === "touchstart") {
                    Browser.lastTouches[touch.identifier] = coords;
                    Browser.touches[touch.identifier] = coords
                } else if (event.type === "touchend" || event.type === "touchmove") {
                    var last = Browser.touches[touch.identifier];
                    last ||= coords;
                    Browser.lastTouches[touch.identifier] = last;
                    Browser.touches[touch.identifier] = coords
                }
                return
            }
            Browser.setMouseCoords(event.pageX, event.pageY)
        }
    },
    resizeListeners: [],
    updateResizeListeners() {
        var canvas = Module["canvas"];
        Browser.resizeListeners.forEach(listener=>listener(canvas.width, canvas.height))
    },
    setCanvasSize(width, height, noUpdates) {
        var canvas = Module["canvas"];
        Browser.updateCanvasDimensions(canvas, width, height);
        if (!noUpdates)
            Browser.updateResizeListeners()
    },
    windowedWidth: 0,
    windowedHeight: 0,
    setFullscreenCanvasSize() {
        if (typeof SDL != "undefined") {
            var flags = HEAPU32[SDL.screen >> 2];
            flags = flags | 8388608;
            HEAP32[SDL.screen >> 2] = flags
        }
        Browser.updateCanvasDimensions(Module["canvas"]);
        Browser.updateResizeListeners()
    },
    setWindowedCanvasSize() {
        if (typeof SDL != "undefined") {
            var flags = HEAPU32[SDL.screen >> 2];
            flags = flags & ~8388608;
            HEAP32[SDL.screen >> 2] = flags
        }
        Browser.updateCanvasDimensions(Module["canvas"]);
        Browser.updateResizeListeners()
    },
    updateCanvasDimensions(canvas, wNative, hNative) {
        if (wNative && hNative) {
            canvas.widthNative = wNative;
            canvas.heightNative = hNative
        } else {
            wNative = canvas.widthNative;
            hNative = canvas.heightNative
        }
        var w = wNative;
        var h = hNative;
        if (Module["forcedAspectRatio"] && Module["forcedAspectRatio"] > 0) {
            if (w / h < Module["forcedAspectRatio"]) {
                w = Math.round(h * Module["forcedAspectRatio"])
            } else {
                h = Math.round(w / Module["forcedAspectRatio"])
            }
        }
        if ((document["fullscreenElement"] || document["mozFullScreenElement"] || document["msFullscreenElement"] || document["webkitFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvas.parentNode && typeof screen != "undefined") {
            var factor = Math.min(screen.width / w, screen.height / h);
            w = Math.round(w * factor);
            h = Math.round(h * factor)
        }
        if (Browser.resizeCanvas) {
            if (canvas.width != w)
                canvas.width = w;
            if (canvas.height != h)
                canvas.height = h;
            if (typeof canvas.style != "undefined") {
                canvas.style.removeProperty("width");
                canvas.style.removeProperty("height")
            }
        } else {
            if (canvas.width != wNative)
                canvas.width = wNative;
            if (canvas.height != hNative)
                canvas.height = hNative;
            if (typeof canvas.style != "undefined") {
                if (w != wNative || h != hNative) {
                    canvas.style.setProperty("width", w + "px", "important");
                    canvas.style.setProperty("height", h + "px", "important")
                } else {
                    canvas.style.removeProperty("width");
                    canvas.style.removeProperty("height")
                }
            }
        }
    }
};
var _emscripten_cancel_main_loop = ()=>{
    Browser.mainLoop.pause();
    Browser.mainLoop.func = null
}
;
var _emscripten_date_now = ()=>Date.now();
var _emscripten_memcpy_js = (dest,src,num)=>HEAPU8.copyWithin(dest, src, src + num);
var _emscripten_pause_main_loop = ()=>{
    Browser.mainLoop.pause()
}
;
var withStackSave = f=>{
    var stack = stackSave();
    var ret = f();
    stackRestore(stack);
    return ret
}
;
var JSEvents = {
    inEventHandler: 0,
    removeAllEventListeners() {
        for (var i = JSEvents.eventHandlers.length - 1; i >= 0; --i) {
            JSEvents._removeHandler(i)
        }
        JSEvents.eventHandlers = [];
        JSEvents.deferredCalls = []
    },
    registerRemoveEventListeners() {
        if (!JSEvents.removeEventListenersRegistered) {
            __ATEXIT__.push(JSEvents.removeAllEventListeners);
            JSEvents.removeEventListenersRegistered = true
        }
    },
    deferredCalls: [],
    deferCall(targetFunction, precedence, argsList) {
        function arraysHaveEqualContent(arrA, arrB) {
            if (arrA.length != arrB.length)
                return false;
            for (var i in arrA) {
                if (arrA[i] != arrB[i])
                    return false
            }
            return true
        }
        for (var i in JSEvents.deferredCalls) {
            var call = JSEvents.deferredCalls[i];
            if (call.targetFunction == targetFunction && arraysHaveEqualContent(call.argsList, argsList)) {
                return
            }
        }
        JSEvents.deferredCalls.push({
            targetFunction: targetFunction,
            precedence: precedence,
            argsList: argsList
        });
        JSEvents.deferredCalls.sort((x,y)=>x.precedence < y.precedence)
    },
    removeDeferredCalls(targetFunction) {
        for (var i = 0; i < JSEvents.deferredCalls.length; ++i) {
            if (JSEvents.deferredCalls[i].targetFunction == targetFunction) {
                JSEvents.deferredCalls.splice(i, 1);
                --i
            }
        }
    },
    canPerformEventHandlerRequests() {
        if (navigator.userActivation) {
            return navigator.userActivation.isActive
        }
        return JSEvents.inEventHandler && JSEvents.currentEventHandler.allowsDeferredCalls
    },
    runDeferredCalls() {
        if (!JSEvents.canPerformEventHandlerRequests()) {
            return
        }
        for (var i = 0; i < JSEvents.deferredCalls.length; ++i) {
            var call = JSEvents.deferredCalls[i];
            JSEvents.deferredCalls.splice(i, 1);
            --i;
            call.targetFunction.apply(null, call.argsList)
        }
    },
    eventHandlers: [],
    removeAllHandlersOnTarget: (target,eventTypeString)=>{
        for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
            if (JSEvents.eventHandlers[i].target == target && (!eventTypeString || eventTypeString == JSEvents.eventHandlers[i].eventTypeString)) {
                JSEvents._removeHandler(i--)
            }
        }
    }
    ,
    _removeHandler(i) {
        var h = JSEvents.eventHandlers[i];
        h.target.removeEventListener(h.eventTypeString, h.eventListenerFunc, h.useCapture);
        JSEvents.eventHandlers.splice(i, 1)
    },
    registerOrRemoveHandler(eventHandler) {
        if (!eventHandler.target) {
            return -4
        }
        var jsEventHandler = function jsEventHandler(event) {
            ++JSEvents.inEventHandler;
            JSEvents.currentEventHandler = eventHandler;
            JSEvents.runDeferredCalls();
            eventHandler.handlerFunc(event);
            JSEvents.runDeferredCalls();
            --JSEvents.inEventHandler
        };
        if (eventHandler.callbackfunc) {
            eventHandler.eventListenerFunc = jsEventHandler;
            eventHandler.target.addEventListener(eventHandler.eventTypeString, jsEventHandler, eventHandler.useCapture);
            JSEvents.eventHandlers.push(eventHandler);
            JSEvents.registerRemoveEventListeners()
        } else {
            for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
                if (JSEvents.eventHandlers[i].target == eventHandler.target && JSEvents.eventHandlers[i].eventTypeString == eventHandler.eventTypeString) {
                    JSEvents._removeHandler(i--)
                }
            }
        }
        return 0
    },
    getNodeNameForTarget(target) {
        if (!target)
            return "";
        if (target == window)
            return "#window";
        if (target == screen)
            return "#screen";
        return target?.nodeName || ""
    },
    fullscreenEnabled() {
        return document.fullscreenEnabled || document.webkitFullscreenEnabled
    }
};
var setLetterbox = (element,topBottom,leftRight)=>{
    element.style.paddingLeft = element.style.paddingRight = leftRight + "px";
    element.style.paddingTop = element.style.paddingBottom = topBottom + "px"
}
;
var maybeCStringToJsString = cString=>cString > 2 ? UTF8ToString(cString) : cString;
var specialHTMLTargets = [0, typeof document != "undefined" ? document : 0, typeof window != "undefined" ? window : 0];
var findEventTarget = target=>{
    target = maybeCStringToJsString(target);
    var domElement = specialHTMLTargets[target] || (typeof document != "undefined" ? document.querySelector(target) : undefined);
    return domElement
}
;
var findCanvasEventTarget = target=>findEventTarget(target);
var _emscripten_set_canvas_element_size = (target,width,height)=>{
    var canvas = findCanvasEventTarget(target);
    if (!canvas)
        return -4;
    canvas.width = width;
    canvas.height = height;
    return 0
}
;
var _emscripten_get_canvas_element_size = (target,width,height)=>{
    var canvas = findCanvasEventTarget(target);
    if (!canvas)
        return -4;
    HEAP32[width >> 2] = canvas.width;
    HEAP32[height >> 2] = canvas.height
}
;
var stringToUTF8OnStack = str=>{
    var size = lengthBytesUTF8(str) + 1;
    var ret = stackAlloc(size);
    stringToUTF8(str, ret, size);
    return ret
}
;
var getCanvasElementSize = target=>withStackSave(()=>{
    var w = stackAlloc(8);
    var h = w + 4;
    var targetInt = stringToUTF8OnStack(target.id);
    var ret = _emscripten_get_canvas_element_size(targetInt, w, h);
    var size = [HEAP32[w >> 2], HEAP32[h >> 2]];
    return size
}
);
var setCanvasElementSize = (target,width,height)=>{
    if (!target.controlTransferredOffscreen) {
        target.width = width;
        target.height = height
    } else {
        withStackSave(()=>{
            var targetInt = stringToUTF8OnStack(target.id);
            _emscripten_set_canvas_element_size(targetInt, width, height)
        }
        )
    }
}
;
var wasmTableMirror = [];
var wasmTable;
var getWasmTableEntry = funcPtr=>{
    var func = wasmTableMirror[funcPtr];
    if (!func) {
        if (funcPtr >= wasmTableMirror.length)
            wasmTableMirror.length = funcPtr + 1;
        wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr)
    }
    return func
}
;
var registerRestoreOldStyle = canvas=>{
    var canvasSize = getCanvasElementSize(canvas);
    var oldWidth = canvasSize[0];
    var oldHeight = canvasSize[1];
    var oldCssWidth = canvas.style.width;
    var oldCssHeight = canvas.style.height;
    var oldBackgroundColor = canvas.style.backgroundColor;
    var oldDocumentBackgroundColor = document.body.style.backgroundColor;
    var oldPaddingLeft = canvas.style.paddingLeft;
    var oldPaddingRight = canvas.style.paddingRight;
    var oldPaddingTop = canvas.style.paddingTop;
    var oldPaddingBottom = canvas.style.paddingBottom;
    var oldMarginLeft = canvas.style.marginLeft;
    var oldMarginRight = canvas.style.marginRight;
    var oldMarginTop = canvas.style.marginTop;
    var oldMarginBottom = canvas.style.marginBottom;
    var oldDocumentBodyMargin = document.body.style.margin;
    var oldDocumentOverflow = document.documentElement.style.overflow;
    var oldDocumentScroll = document.body.scroll;
    var oldImageRendering = canvas.style.imageRendering;
    function restoreOldStyle() {
        var fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement;
        if (!fullscreenElement) {
            document.removeEventListener("fullscreenchange", restoreOldStyle);
            document.removeEventListener("webkitfullscreenchange", restoreOldStyle);
            setCanvasElementSize(canvas, oldWidth, oldHeight);
            canvas.style.width = oldCssWidth;
            canvas.style.height = oldCssHeight;
            canvas.style.backgroundColor = oldBackgroundColor;
            if (!oldDocumentBackgroundColor)
                document.body.style.backgroundColor = "white";
            document.body.style.backgroundColor = oldDocumentBackgroundColor;
            canvas.style.paddingLeft = oldPaddingLeft;
            canvas.style.paddingRight = oldPaddingRight;
            canvas.style.paddingTop = oldPaddingTop;
            canvas.style.paddingBottom = oldPaddingBottom;
            canvas.style.marginLeft = oldMarginLeft;
            canvas.style.marginRight = oldMarginRight;
            canvas.style.marginTop = oldMarginTop;
            canvas.style.marginBottom = oldMarginBottom;
            document.body.style.margin = oldDocumentBodyMargin;
            document.documentElement.style.overflow = oldDocumentOverflow;
            document.body.scroll = oldDocumentScroll;
            canvas.style.imageRendering = oldImageRendering;
            if (canvas.GLctxObject)
                canvas.GLctxObject.GLctx.viewport(0, 0, oldWidth, oldHeight);
            if (currentFullscreenStrategy.canvasResizedCallback) {
                getWasmTableEntry(currentFullscreenStrategy.canvasResizedCallback)(37, 0, currentFullscreenStrategy.canvasResizedCallbackUserData)
            }
        }
    }
    document.addEventListener("fullscreenchange", restoreOldStyle);
    document.addEventListener("webkitfullscreenchange", restoreOldStyle);
    return restoreOldStyle
}
;
var getBoundingClientRect = e=>specialHTMLTargets.indexOf(e) < 0 ? e.getBoundingClientRect() : {
    "left": 0,
    "top": 0
};
var JSEvents_resizeCanvasForFullscreen = (target,strategy)=>{
    var restoreOldStyle = registerRestoreOldStyle(target);
    var cssWidth = strategy.softFullscreen ? innerWidth : screen.width;
    var cssHeight = strategy.softFullscreen ? innerHeight : screen.height;
    var rect = getBoundingClientRect(target);
    var windowedCssWidth = rect.width;
    var windowedCssHeight = rect.height;
    var canvasSize = getCanvasElementSize(target);
    var windowedRttWidth = canvasSize[0];
    var windowedRttHeight = canvasSize[1];
    if (strategy.scaleMode == 3) {
        setLetterbox(target, (cssHeight - windowedCssHeight) / 2, (cssWidth - windowedCssWidth) / 2);
        cssWidth = windowedCssWidth;
        cssHeight = windowedCssHeight
    } else if (strategy.scaleMode == 2) {
        if (cssWidth * windowedRttHeight < windowedRttWidth * cssHeight) {
            var desiredCssHeight = windowedRttHeight * cssWidth / windowedRttWidth;
            setLetterbox(target, (cssHeight - desiredCssHeight) / 2, 0);
            cssHeight = desiredCssHeight
        } else {
            var desiredCssWidth = windowedRttWidth * cssHeight / windowedRttHeight;
            setLetterbox(target, 0, (cssWidth - desiredCssWidth) / 2);
            cssWidth = desiredCssWidth
        }
    }
    if (!target.style.backgroundColor)
        target.style.backgroundColor = "black";
    if (!document.body.style.backgroundColor)
        document.body.style.backgroundColor = "black";
    target.style.width = cssWidth + "px";
    target.style.height = cssHeight + "px";
    if (strategy.filteringMode == 1) {
        target.style.imageRendering = "optimizeSpeed";
        target.style.imageRendering = "-moz-crisp-edges";
        target.style.imageRendering = "-o-crisp-edges";
        target.style.imageRendering = "-webkit-optimize-contrast";
        target.style.imageRendering = "optimize-contrast";
        target.style.imageRendering = "crisp-edges";
        target.style.imageRendering = "pixelated"
    }
    var dpiScale = strategy.canvasResolutionScaleMode == 2 ? devicePixelRatio : 1;
    if (strategy.canvasResolutionScaleMode != 0) {
        var newWidth = cssWidth * dpiScale | 0;
        var newHeight = cssHeight * dpiScale | 0;
        setCanvasElementSize(target, newWidth, newHeight);
        if (target.GLctxObject)
            target.GLctxObject.GLctx.viewport(0, 0, newWidth, newHeight)
    }
    return restoreOldStyle
}
;
var JSEvents_requestFullscreen = (target,strategy)=>{
    if (strategy.scaleMode != 0 || strategy.canvasResolutionScaleMode != 0) {
        JSEvents_resizeCanvasForFullscreen(target, strategy)
    }
    if (target.requestFullscreen) {
        target.requestFullscreen()
    } else if (target.webkitRequestFullscreen) {
        target.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT)
    } else {
        return JSEvents.fullscreenEnabled() ? -3 : -1
    }
    currentFullscreenStrategy = strategy;
    if (strategy.canvasResizedCallback) {
        getWasmTableEntry(strategy.canvasResizedCallback)(37, 0, strategy.canvasResizedCallbackUserData)
    }
    return 0
}
;
var doRequestFullscreen = (target,strategy)=>{
    if (!JSEvents.fullscreenEnabled())
        return -1;
    target = findEventTarget(target);
    if (!target)
        return -4;
    if (!target.requestFullscreen && !target.webkitRequestFullscreen) {
        return -3
    }
    var canPerformRequests = JSEvents.canPerformEventHandlerRequests();
    if (!canPerformRequests) {
        if (strategy.deferUntilInEventHandler) {
            JSEvents.deferCall(JSEvents_requestFullscreen, 1, [target, strategy]);
            return 1
        }
        return -2
    }
    return JSEvents_requestFullscreen(target, strategy)
}
;
var currentFullscreenStrategy = {};
var _emscripten_request_fullscreen_strategy = (target,deferUntilInEventHandler,fullscreenStrategy)=>{
    var strategy = {
        scaleMode: HEAP32[fullscreenStrategy >> 2],
        canvasResolutionScaleMode: HEAP32[fullscreenStrategy + 4 >> 2],
        filteringMode: HEAP32[fullscreenStrategy + 8 >> 2],
        deferUntilInEventHandler: deferUntilInEventHandler,
        canvasResizedCallback: HEAP32[fullscreenStrategy + 12 >> 2],
        canvasResizedCallbackUserData: HEAP32[fullscreenStrategy + 16 >> 2]
    };
    return doRequestFullscreen(target, strategy)
}
;
var getHeapMax = ()=>2147483648;
var growMemory = size=>{
    var b = wasmMemory.buffer;
    var pages = (size - b.byteLength + 65535) / 65536;
    try {
        wasmMemory.grow(pages);
        updateMemoryViews();
        return 1
    } catch (e) {}
}
;
var _emscripten_resize_heap = requestedSize=>{
    var oldSize = HEAPU8.length;
    requestedSize >>>= 0;
    var maxHeapSize = getHeapMax();
    if (requestedSize > maxHeapSize) {
        return false
    }
    var alignUp = (x,multiple)=>x + (multiple - x % multiple) % multiple;
    for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
        var overGrownHeapSize = oldSize * (1 + .2 / cutDown);
        overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
        var newSize = Math.min(maxHeapSize, alignUp(Math.max(requestedSize, overGrownHeapSize), 65536));
        var replacement = growMemory(newSize);
        if (replacement) {
            return true
        }
    }
    return false
}
;
var _emscripten_resume_main_loop = ()=>{
    Browser.mainLoop.resume()
}
;
var _emscripten_set_main_loop = (func,fps,simulateInfiniteLoop)=>{
    var browserIterationFunc = getWasmTableEntry(func);
    setMainLoop(browserIterationFunc, fps, simulateInfiniteLoop)
}
;
function _fd_close(fd) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        FS.close(stream);
        return 0
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError"))
            throw e;
        return e.errno
    }
}
var doReadv = (stream,iov,iovcnt,offset)=>{
    var ret = 0;
    for (var i = 0; i < iovcnt; i++) {
        var ptr = HEAPU32[iov >> 2];
        var len = HEAPU32[iov + 4 >> 2];
        iov += 8;
        var curr = FS.read(stream, HEAP8, ptr, len, offset);
        if (curr < 0)
            return -1;
        ret += curr;
        if (curr < len)
            break;
        if (typeof offset !== "undefined") {
            offset += curr
        }
    }
    return ret
}
;
function _fd_read(fd, iov, iovcnt, pnum) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        var num = doReadv(stream, iov, iovcnt);
        HEAPU32[pnum >> 2] = num;
        return 0
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError"))
            throw e;
        return e.errno
    }
}
function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
    var offset = convertI32PairToI53Checked(offset_low, offset_high);
    try {
        if (isNaN(offset))
            return 61;
        var stream = SYSCALLS.getStreamFromFD(fd);
        FS.llseek(stream, offset, whence);
        tempI64 = [stream.position >>> 0, (tempDouble = stream.position,
        +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? +Math.floor(tempDouble / 4294967296) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)],
        HEAP32[newOffset >> 2] = tempI64[0],
        HEAP32[newOffset + 4 >> 2] = tempI64[1];
        if (stream.getdents && offset === 0 && whence === 0)
            stream.getdents = null;
        return 0
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError"))
            throw e;
        return e.errno
    }
}
var doWritev = (stream,iov,iovcnt,offset)=>{
    var ret = 0;
    for (var i = 0; i < iovcnt; i++) {
        var ptr = HEAPU32[iov >> 2];
        var len = HEAPU32[iov + 4 >> 2];
        iov += 8;
        var curr = FS.write(stream, HEAP8, ptr, len, offset);
        if (curr < 0)
            return -1;
        ret += curr;
        if (typeof offset !== "undefined") {
            offset += curr
        }
    }
    return ret
}
;
function _fd_write(fd, iov, iovcnt, pnum) {
    try {
        var stream = SYSCALLS.getStreamFromFD(fd);
        var num = doWritev(stream, iov, iovcnt);
        HEAPU32[pnum >> 2] = num;
        return 0
    } catch (e) {
        if (typeof FS == "undefined" || !(e.name === "ErrnoError"))
            throw e;
        return e.errno
    }
}
var webgl_enable_ANGLE_instanced_arrays = ctx=>{
    var ext = ctx.getExtension("ANGLE_instanced_arrays");
    if (ext) {
        ctx["vertexAttribDivisor"] = (index,divisor)=>ext["vertexAttribDivisorANGLE"](index, divisor);
        ctx["drawArraysInstanced"] = (mode,first,count,primcount)=>ext["drawArraysInstancedANGLE"](mode, first, count, primcount);
        ctx["drawElementsInstanced"] = (mode,count,type,indices,primcount)=>ext["drawElementsInstancedANGLE"](mode, count, type, indices, primcount);
        return 1
    }
}
;
var webgl_enable_OES_vertex_array_object = ctx=>{
    var ext = ctx.getExtension("OES_vertex_array_object");
    if (ext) {
        ctx["createVertexArray"] = ()=>ext["createVertexArrayOES"]();
        ctx["deleteVertexArray"] = vao=>ext["deleteVertexArrayOES"](vao);
        ctx["bindVertexArray"] = vao=>ext["bindVertexArrayOES"](vao);
        ctx["isVertexArray"] = vao=>ext["isVertexArrayOES"](vao);
        return 1
    }
}
;
var webgl_enable_WEBGL_draw_buffers = ctx=>{
    var ext = ctx.getExtension("WEBGL_draw_buffers");
    if (ext) {
        ctx["drawBuffers"] = (n,bufs)=>ext["drawBuffersWEBGL"](n, bufs);
        return 1
    }
}
;
var webgl_enable_WEBGL_multi_draw = ctx=>!!(ctx.multiDrawWebgl = ctx.getExtension("WEBGL_multi_draw"));
var GL = {
    counter: 1,
    buffers: [],
    programs: [],
    framebuffers: [],
    renderbuffers: [],
    textures: [],
    shaders: [],
    vaos: [],
    contexts: [],
    offscreenCanvases: {},
    queries: [],
    stringCache: {},
    unpackAlignment: 4,
    recordError: function recordError(errorCode) {
        if (!GL.lastError) {
            GL.lastError = errorCode
        }
    },
    getNewId: table=>{
        var ret = GL.counter++;
        for (var i = table.length; i < ret; i++) {
            table[i] = null
        }
        return ret
    }
    ,
    getSource: (shader,count,string,length)=>{
        var source = "";
        for (var i = 0; i < count; ++i) {
            var len = length ? HEAP32[length + i * 4 >> 2] : -1;
            source += UTF8ToString(HEAP32[string + i * 4 >> 2], len < 0 ? undefined : len)
        }
        return source
    }
    ,
    createContext: (canvas,webGLContextAttributes)=>{
        if (!canvas.getContextSafariWebGL2Fixed) {
            canvas.getContextSafariWebGL2Fixed = canvas.getContext;
            function fixedGetContext(ver, attrs) {
                var gl = canvas.getContextSafariWebGL2Fixed(ver, attrs);
                return ver == "webgl" == gl instanceof WebGLRenderingContext ? gl : null
            }
            canvas.getContext = fixedGetContext
        }
        var ctx = canvas.getContext("webgl", webGLContextAttributes);
        if (!ctx)
            return 0;
        var handle = GL.registerContext(ctx, webGLContextAttributes);
        return handle
    }
    ,
    registerContext: (ctx,webGLContextAttributes)=>{
        var handle = GL.getNewId(GL.contexts);
        var context = {
            handle: handle,
            attributes: webGLContextAttributes,
            version: webGLContextAttributes.majorVersion,
            GLctx: ctx
        };
        if (ctx.canvas)
            ctx.canvas.GLctxObject = context;
        GL.contexts[handle] = context;
        if (typeof webGLContextAttributes.enableExtensionsByDefault == "undefined" || webGLContextAttributes.enableExtensionsByDefault) {
            GL.initExtensions(context)
        }
        return handle
    }
    ,
    makeContextCurrent: contextHandle=>{
        GL.currentContext = GL.contexts[contextHandle];
        Module.ctx = GLctx = GL.currentContext?.GLctx;
        return !(contextHandle && !GLctx)
    }
    ,
    getContext: contextHandle=>GL.contexts[contextHandle],
    deleteContext: contextHandle=>{
        if (GL.currentContext === GL.contexts[contextHandle]) {
            GL.currentContext = null
        }
        if (typeof JSEvents == "object") {
            JSEvents.removeAllHandlersOnTarget(GL.contexts[contextHandle].GLctx.canvas)
        }
        if (GL.contexts[contextHandle] && GL.contexts[contextHandle].GLctx.canvas) {
            GL.contexts[contextHandle].GLctx.canvas.GLctxObject = undefined
        }
        GL.contexts[contextHandle] = null
    }
    ,
    initExtensions: context=>{
        context ||= GL.currentContext;
        if (context.initExtensionsDone)
            return;
        context.initExtensionsDone = true;
        var GLctx = context.GLctx;
        webgl_enable_ANGLE_instanced_arrays(GLctx);
        webgl_enable_OES_vertex_array_object(GLctx);
        webgl_enable_WEBGL_draw_buffers(GLctx);
        {
            GLctx.disjointTimerQueryExt = GLctx.getExtension("EXT_disjoint_timer_query")
        }
        webgl_enable_WEBGL_multi_draw(GLctx);
        var exts = GLctx.getSupportedExtensions() || [];
        exts.forEach(ext=>{
            if (!ext.includes("lose_context") && !ext.includes("debug")) {
                GLctx.getExtension(ext)
            }
        }
        )
    }
    ,
    getExtensions() {
        var exts = GLctx.getSupportedExtensions() || [];
        exts = exts.concat(exts.map(e=>"GL_" + e));
        return exts
    }
};
function _glActiveTexture(x0) {
    GLctx.activeTexture(x0)
}
var _glAttachShader = (program,shader)=>{
    GLctx.attachShader(GL.programs[program], GL.shaders[shader])
}
;
var _glBindBuffer = (target,buffer)=>{
    GLctx.bindBuffer(target, GL.buffers[buffer])
}
;
var _glBindFramebuffer = (target,framebuffer)=>{
    GLctx.bindFramebuffer(target, GL.framebuffers[framebuffer])
}
;
var _glBindRenderbuffer = (target,renderbuffer)=>{
    GLctx.bindRenderbuffer(target, GL.renderbuffers[renderbuffer])
}
;
var _glBindTexture = (target,texture)=>{
    GLctx.bindTexture(target, GL.textures[texture])
}
;
function _glBlendFunc(x0, x1) {
    GLctx.blendFunc(x0, x1)
}
var _glBufferData = (target,size,data,usage)=>{
    GLctx.bufferData(target, data ? HEAPU8.subarray(data, data + size) : size, usage)
}
;
function _glCheckFramebufferStatus(x0) {
    return GLctx.checkFramebufferStatus(x0)
}
function _glClear(x0) {
    GLctx.clear(x0)
}
function _glClearColor(x0, x1, x2, x3) {
    GLctx.clearColor(x0, x1, x2, x3)
}
var _glCompileShader = shader=>{
    GLctx.compileShader(GL.shaders[shader])
}
;
var _glCreateProgram = ()=>{
    var id = GL.getNewId(GL.programs);
    var program = GLctx.createProgram();
    program.name = id;
    program.maxUniformLength = program.maxAttributeLength = program.maxUniformBlockNameLength = 0;
    program.uniformIdCounter = 1;
    GL.programs[id] = program;
    return id
}
;
var _glCreateShader = shaderType=>{
    var id = GL.getNewId(GL.shaders);
    GL.shaders[id] = GLctx.createShader(shaderType);
    return id
}
;
var _glDeleteBuffers = (n,buffers)=>{
    for (var i = 0; i < n; i++) {
        var id = HEAP32[buffers + i * 4 >> 2];
        var buffer = GL.buffers[id];
        if (!buffer)
            continue;
        GLctx.deleteBuffer(buffer);
        buffer.name = 0;
        GL.buffers[id] = null
    }
}
;
var _glDeleteFramebuffers = (n,framebuffers)=>{
    for (var i = 0; i < n; ++i) {
        var id = HEAP32[framebuffers + i * 4 >> 2];
        var framebuffer = GL.framebuffers[id];
        if (!framebuffer)
            continue;
        GLctx.deleteFramebuffer(framebuffer);
        framebuffer.name = 0;
        GL.framebuffers[id] = null
    }
}
;
var _glDeleteRenderbuffers = (n,renderbuffers)=>{
    for (var i = 0; i < n; i++) {
        var id = HEAP32[renderbuffers + i * 4 >> 2];
        var renderbuffer = GL.renderbuffers[id];
        if (!renderbuffer)
            continue;
        GLctx.deleteRenderbuffer(renderbuffer);
        renderbuffer.name = 0;
        GL.renderbuffers[id] = null
    }
}
;
var _glDeleteTextures = (n,textures)=>{
    for (var i = 0; i < n; i++) {
        var id = HEAP32[textures + i * 4 >> 2];
        var texture = GL.textures[id];
        if (!texture)
            continue;
        GLctx.deleteTexture(texture);
        texture.name = 0;
        GL.textures[id] = null
    }
}
;
function _glDepthFunc(x0) {
    GLctx.depthFunc(x0)
}
var _glDepthMask = flag=>{
    GLctx.depthMask(!!flag)
}
;
function _glDisable(x0) {
    GLctx.disable(x0)
}
var _glDisableVertexAttribArray = index=>{
    GLctx.disableVertexAttribArray(index)
}
;
var _glDrawArrays = (mode,first,count)=>{
    GLctx.drawArrays(mode, first, count)
}
;
function _glEnable(x0) {
    GLctx.enable(x0)
}
var _glEnableVertexAttribArray = index=>{
    GLctx.enableVertexAttribArray(index)
}
;
var _glFramebufferRenderbuffer = (target,attachment,renderbuffertarget,renderbuffer)=>{
    GLctx.framebufferRenderbuffer(target, attachment, renderbuffertarget, GL.renderbuffers[renderbuffer])
}
;
var _glFramebufferTexture2D = (target,attachment,textarget,texture,level)=>{
    GLctx.framebufferTexture2D(target, attachment, textarget, GL.textures[texture], level)
}
;
var __glGenObject = (n,buffers,createFunction,objectTable)=>{
    for (var i = 0; i < n; i++) {
        var buffer = GLctx[createFunction]();
        var id = buffer && GL.getNewId(objectTable);
        if (buffer) {
            buffer.name = id;
            objectTable[id] = buffer
        } else {
            GL.recordError(1282)
        }
        HEAP32[buffers + i * 4 >> 2] = id
    }
}
;
var _glGenBuffers = (n,buffers)=>{
    __glGenObject(n, buffers, "createBuffer", GL.buffers)
}
;
var _glGenFramebuffers = (n,ids)=>{
    __glGenObject(n, ids, "createFramebuffer", GL.framebuffers)
}
;
var _glGenRenderbuffers = (n,renderbuffers)=>{
    __glGenObject(n, renderbuffers, "createRenderbuffer", GL.renderbuffers)
}
;
var _glGenTextures = (n,textures)=>{
    __glGenObject(n, textures, "createTexture", GL.textures)
}
;
var _glGetAttribLocation = (program,name)=>GLctx.getAttribLocation(GL.programs[program], UTF8ToString(name));
var writeI53ToI64 = (ptr,num)=>{
    HEAPU32[ptr >> 2] = num;
    var lower = HEAPU32[ptr >> 2];
    HEAPU32[ptr + 4 >> 2] = (num - lower) / 4294967296
}
;
var emscriptenWebGLGet = (name_,p,type)=>{
    if (!p) {
        GL.recordError(1281);
        return
    }
    var ret = undefined;
    switch (name_) {
    case 36346:
        ret = 1;
        break;
    case 36344:
        if (type != 0 && type != 1) {
            GL.recordError(1280)
        }
        return;
    case 36345:
        ret = 0;
        break;
    case 34466:
        var formats = GLctx.getParameter(34467);
        ret = formats ? formats.length : 0;
        break
    }
    if (ret === undefined) {
        var result = GLctx.getParameter(name_);
        switch (typeof result) {
        case "number":
            ret = result;
            break;
        case "boolean":
            ret = result ? 1 : 0;
            break;
        case "string":
            GL.recordError(1280);
            return;
        case "object":
            if (result === null) {
                switch (name_) {
                case 34964:
                case 35725:
                case 34965:
                case 36006:
                case 36007:
                case 32873:
                case 34229:
                case 34068:
                    {
                        ret = 0;
                        break
                    }
                default:
                    {
                        GL.recordError(1280);
                        return
                    }
                }
            } else if (result instanceof Float32Array || result instanceof Uint32Array || result instanceof Int32Array || result instanceof Array) {
                for (var i = 0; i < result.length; ++i) {
                    switch (type) {
                    case 0:
                        HEAP32[p + i * 4 >> 2] = result[i];
                        break;
                    case 2:
                        HEAPF32[p + i * 4 >> 2] = result[i];
                        break;
                    case 4:
                        HEAP8[p + i >> 0] = result[i] ? 1 : 0;
                        break
                    }
                }
                return
            } else {
                try {
                    ret = result.name | 0
                } catch (e) {
                    GL.recordError(1280);
                    err(`GL_INVALID_ENUM in glGet${type}v: Unknown object returned from WebGL getParameter(${name_})! (error: ${e})`);
                    return
                }
            }
            break;
        default:
            GL.recordError(1280);
            err(`GL_INVALID_ENUM in glGet${type}v: Native code calling glGet${type}v(${name_}) and it returns ${result} of type ${typeof result}!`);
            return
        }
    }
    switch (type) {
    case 1:
        writeI53ToI64(p, ret);
        break;
    case 0:
        HEAP32[p >> 2] = ret;
        break;
    case 2:
        HEAPF32[p >> 2] = ret;
        break;
    case 4:
        HEAP8[p >> 0] = ret ? 1 : 0;
        break
    }
}
;
var _glGetIntegerv = (name_,p)=>emscriptenWebGLGet(name_, p, 0);
var _glGetProgramInfoLog = (program,maxLength,length,infoLog)=>{
    var log = GLctx.getProgramInfoLog(GL.programs[program]);
    if (log === null)
        log = "(unknown error)";
    var numBytesWrittenExclNull = maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
    if (length)
        HEAP32[length >> 2] = numBytesWrittenExclNull
}
;
var _glGetProgramiv = (program,pname,p)=>{
    if (!p) {
        GL.recordError(1281);
        return
    }
    if (program >= GL.counter) {
        GL.recordError(1281);
        return
    }
    program = GL.programs[program];
    if (pname == 35716) {
        var log = GLctx.getProgramInfoLog(program);
        if (log === null)
            log = "(unknown error)";
        HEAP32[p >> 2] = log.length + 1
    } else if (pname == 35719) {
        if (!program.maxUniformLength) {
            for (var i = 0; i < GLctx.getProgramParameter(program, 35718); ++i) {
                program.maxUniformLength = Math.max(program.maxUniformLength, GLctx.getActiveUniform(program, i).name.length + 1)
            }
        }
        HEAP32[p >> 2] = program.maxUniformLength
    } else if (pname == 35722) {
        if (!program.maxAttributeLength) {
            for (var i = 0; i < GLctx.getProgramParameter(program, 35721); ++i) {
                program.maxAttributeLength = Math.max(program.maxAttributeLength, GLctx.getActiveAttrib(program, i).name.length + 1)
            }
        }
        HEAP32[p >> 2] = program.maxAttributeLength
    } else if (pname == 35381) {
        if (!program.maxUniformBlockNameLength) {
            for (var i = 0; i < GLctx.getProgramParameter(program, 35382); ++i) {
                program.maxUniformBlockNameLength = Math.max(program.maxUniformBlockNameLength, GLctx.getActiveUniformBlockName(program, i).length + 1)
            }
        }
        HEAP32[p >> 2] = program.maxUniformBlockNameLength
    } else {
        HEAP32[p >> 2] = GLctx.getProgramParameter(program, pname)
    }
}
;
var _glGetShaderInfoLog = (shader,maxLength,length,infoLog)=>{
    var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
    if (log === null)
        log = "(unknown error)";
    var numBytesWrittenExclNull = maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
    if (length)
        HEAP32[length >> 2] = numBytesWrittenExclNull
}
;
var _glGetShaderiv = (shader,pname,p)=>{
    if (!p) {
        GL.recordError(1281);
        return
    }
    if (pname == 35716) {
        var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
        if (log === null)
            log = "(unknown error)";
        var logLength = log ? log.length + 1 : 0;
        HEAP32[p >> 2] = logLength
    } else if (pname == 35720) {
        var source = GLctx.getShaderSource(GL.shaders[shader]);
        var sourceLength = source ? source.length + 1 : 0;
        HEAP32[p >> 2] = sourceLength
    } else {
        HEAP32[p >> 2] = GLctx.getShaderParameter(GL.shaders[shader], pname)
    }
}
;
var jstoi_q = str=>parseInt(str);
var webglGetLeftBracePos = name=>name.slice(-1) == "]" && name.lastIndexOf("[");
var webglPrepareUniformLocationsBeforeFirstUse = program=>{
    var uniformLocsById = program.uniformLocsById, uniformSizeAndIdsByName = program.uniformSizeAndIdsByName, i, j;
    if (!uniformLocsById) {
        program.uniformLocsById = uniformLocsById = {};
        program.uniformArrayNamesById = {};
        for (i = 0; i < GLctx.getProgramParameter(program, 35718); ++i) {
            var u = GLctx.getActiveUniform(program, i);
            var nm = u.name;
            var sz = u.size;
            var lb = webglGetLeftBracePos(nm);
            var arrayName = lb > 0 ? nm.slice(0, lb) : nm;
            var id = program.uniformIdCounter;
            program.uniformIdCounter += sz;
            uniformSizeAndIdsByName[arrayName] = [sz, id];
            for (j = 0; j < sz; ++j) {
                uniformLocsById[id] = j;
                program.uniformArrayNamesById[id++] = arrayName
            }
        }
    }
}
;
var _glGetUniformLocation = (program,name)=>{
    name = UTF8ToString(name);
    if (program = GL.programs[program]) {
        webglPrepareUniformLocationsBeforeFirstUse(program);
        var uniformLocsById = program.uniformLocsById;
        var arrayIndex = 0;
        var uniformBaseName = name;
        var leftBrace = webglGetLeftBracePos(name);
        if (leftBrace > 0) {
            arrayIndex = jstoi_q(name.slice(leftBrace + 1)) >>> 0;
            uniformBaseName = name.slice(0, leftBrace)
        }
        var sizeAndId = program.uniformSizeAndIdsByName[uniformBaseName];
        if (sizeAndId && arrayIndex < sizeAndId[0]) {
            arrayIndex += sizeAndId[1];
            if (uniformLocsById[arrayIndex] = uniformLocsById[arrayIndex] || GLctx.getUniformLocation(program, name)) {
                return arrayIndex
            }
        }
    } else {
        GL.recordError(1281)
    }
    return -1
}
;
var _glLinkProgram = program=>{
    program = GL.programs[program];
    GLctx.linkProgram(program);
    program.uniformLocsById = 0;
    program.uniformSizeAndIdsByName = {}
}
;
var computeUnpackAlignedImageSize = (width,height,sizePerPixel,alignment)=>{
    function roundedToNextMultipleOf(x, y) {
        return x + y - 1 & -y
    }
    var plainRowSize = width * sizePerPixel;
    var alignedRowSize = roundedToNextMultipleOf(plainRowSize, alignment);
    return height * alignedRowSize
}
;
var colorChannelsInGlTextureFormat = format=>{
    var colorChannels = {
        5: 3,
        6: 4,
        8: 2,
        29502: 3,
        29504: 4
    };
    return colorChannels[format - 6402] || 1
}
;
var heapObjectForWebGLType = type=>{
    type -= 5120;
    if (type == 1)
        return HEAPU8;
    if (type == 4)
        return HEAP32;
    if (type == 6)
        return HEAPF32;
    if (type == 5 || type == 28922)
        return HEAPU32;
    return HEAPU16
}
;
var heapAccessShiftForWebGLHeap = heap=>31 - Math.clz32(heap.BYTES_PER_ELEMENT);
var emscriptenWebGLGetTexPixelData = (type,format,width,height,pixels,internalFormat)=>{
    var heap = heapObjectForWebGLType(type);
    var shift = heapAccessShiftForWebGLHeap(heap);
    var byteSize = 1 << shift;
    var sizePerPixel = colorChannelsInGlTextureFormat(format) * byteSize;
    var bytes = computeUnpackAlignedImageSize(width, height, sizePerPixel, GL.unpackAlignment);
    return heap.subarray(pixels >> shift, pixels + bytes >> shift)
}
;
var _glReadPixels = (x,y,width,height,format,type,pixels)=>{
    var pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, format);
    if (!pixelData) {
        GL.recordError(1280);
        return
    }
    GLctx.readPixels(x, y, width, height, format, type, pixelData)
}
;
function _glRenderbufferStorage(x0, x1, x2, x3) {
    GLctx.renderbufferStorage(x0, x1, x2, x3)
}
var _glShaderSource = (shader,count,string,length)=>{
    var source = GL.getSource(shader, count, string, length);
    GLctx.shaderSource(GL.shaders[shader], source)
}
;
var _glTexImage2D = (target,level,internalFormat,width,height,border,format,type,pixels)=>{
    GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixels ? emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, internalFormat) : null)
}
;
function _glTexParameterf(x0, x1, x2) {
    GLctx.texParameterf(x0, x1, x2)
}
function _glTexParameteri(x0, x1, x2) {
    GLctx.texParameteri(x0, x1, x2)
}
var _glTexSubImage2D = (target,level,xoffset,yoffset,width,height,format,type,pixels)=>{
    var pixelData = null;
    if (pixels)
        pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, 0);
    GLctx.texSubImage2D(target, level, xoffset, yoffset, width, height, format, type, pixelData)
}
;
var webglGetUniformLocation = location=>{
    var p = GLctx.currentProgram;
    if (p) {
        var webglLoc = p.uniformLocsById[location];
        if (typeof webglLoc == "number") {
            p.uniformLocsById[location] = webglLoc = GLctx.getUniformLocation(p, p.uniformArrayNamesById[location] + (webglLoc > 0 ? `[${webglLoc}]` : ""))
        }
        return webglLoc
    } else {
        GL.recordError(1282)
    }
}
;
var _glUniform1f = (location,v0)=>{
    GLctx.uniform1f(webglGetUniformLocation(location), v0)
}
;
var _glUniform1i = (location,v0)=>{
    GLctx.uniform1i(webglGetUniformLocation(location), v0)
}
;
var _glUniform2f = (location,v0,v1)=>{
    GLctx.uniform2f(webglGetUniformLocation(location), v0, v1)
}
;
var miniTempWebGLFloatBuffers = [];
var _glUniform3fv = (location,count,value)=>{
    if (count <= 96) {
        var view = miniTempWebGLFloatBuffers[3 * count - 1];
        for (var i = 0; i < 3 * count; i += 3) {
            view[i] = HEAPF32[value + 4 * i >> 2];
            view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2];
            view[i + 2] = HEAPF32[value + (4 * i + 8) >> 2]
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, value + count * 12 >> 2)
    }
    GLctx.uniform3fv(webglGetUniformLocation(location), view)
}
;
var _glUniformMatrix4fv = (location,count,transpose,value)=>{
    if (count <= 18) {
        var view = miniTempWebGLFloatBuffers[16 * count - 1];
        var heap = HEAPF32;
        value >>= 2;
        for (var i = 0; i < 16 * count; i += 16) {
            var dst = value + i;
            view[i] = heap[dst];
            view[i + 1] = heap[dst + 1];
            view[i + 2] = heap[dst + 2];
            view[i + 3] = heap[dst + 3];
            view[i + 4] = heap[dst + 4];
            view[i + 5] = heap[dst + 5];
            view[i + 6] = heap[dst + 6];
            view[i + 7] = heap[dst + 7];
            view[i + 8] = heap[dst + 8];
            view[i + 9] = heap[dst + 9];
            view[i + 10] = heap[dst + 10];
            view[i + 11] = heap[dst + 11];
            view[i + 12] = heap[dst + 12];
            view[i + 13] = heap[dst + 13];
            view[i + 14] = heap[dst + 14];
            view[i + 15] = heap[dst + 15]
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, value + count * 64 >> 2)
    }
    GLctx.uniformMatrix4fv(webglGetUniformLocation(location), !!transpose, view)
}
;
var _glUseProgram = program=>{
    program = GL.programs[program];
    GLctx.useProgram(program);
    GLctx.currentProgram = program
}
;
var _glVertexAttribPointer = (index,size,type,normalized,stride,ptr)=>{
    GLctx.vertexAttribPointer(index, size, type, !!normalized, stride, ptr)
}
;
function _glViewport(x0, x1, x2, x3) {
    GLctx.viewport(x0, x1, x2, x3)
}
function GLFW_Window(id, width, height, framebufferWidth, framebufferHeight, title, monitor, share) {
    this.id = id;
    this.x = 0;
    this.y = 0;
    this.fullscreen = false;
    this.storedX = 0;
    this.storedY = 0;
    this.width = width;
    this.height = height;
    this.framebufferWidth = framebufferWidth;
    this.framebufferHeight = framebufferHeight;
    this.storedWidth = width;
    this.storedHeight = height;
    this.title = title;
    this.monitor = monitor;
    this.share = share;
    this.attributes = Object.assign({}, GLFW.hints);
    this.inputModes = {
        208897: 212993,
        208898: 0,
        208899: 0
    };
    this.buttons = 0;
    this.keys = new Array;
    this.domKeys = new Array;
    this.shouldClose = 0;
    this.title = null;
    this.windowPosFunc = 0;
    this.windowSizeFunc = 0;
    this.windowCloseFunc = 0;
    this.windowRefreshFunc = 0;
    this.windowFocusFunc = 0;
    this.windowIconifyFunc = 0;
    this.windowMaximizeFunc = 0;
    this.framebufferSizeFunc = 0;
    this.windowContentScaleFunc = 0;
    this.mouseButtonFunc = 0;
    this.cursorPosFunc = 0;
    this.cursorEnterFunc = 0;
    this.scrollFunc = 0;
    this.dropFunc = 0;
    this.keyFunc = 0;
    this.charFunc = 0;
    this.userptr = 0
}
var _emscripten_set_window_title = title=>document.title = UTF8ToString(title);
var GLFW = {
    WindowFromId: id=>{
        if (id <= 0 || !GLFW.windows)
            return null;
        return GLFW.windows[id - 1]
    }
    ,
    joystickFunc: 0,
    errorFunc: 0,
    monitorFunc: 0,
    active: null,
    scale: null,
    windows: null,
    monitors: null,
    monitorString: null,
    versionString: null,
    initialTime: null,
    extensions: null,
    devicePixelRatioMQL: null,
    hints: null,
    primaryTouchId: null,
    defaultHints: {
        131073: 0,
        131074: 0,
        131075: 1,
        131076: 1,
        131077: 1,
        131082: 0,
        135169: 8,
        135170: 8,
        135171: 8,
        135172: 8,
        135173: 24,
        135174: 8,
        135175: 0,
        135176: 0,
        135177: 0,
        135178: 0,
        135179: 0,
        135180: 0,
        135181: 0,
        135182: 0,
        135183: 0,
        139265: 196609,
        139266: 1,
        139267: 0,
        139268: 0,
        139269: 0,
        139270: 0,
        139271: 0,
        139272: 0,
        139276: 0
    },
    DOMToGLFWKeyCode: keycode=>{
        switch (keycode) {
        case 32:
            return 32;
        case 222:
            return 39;
        case 188:
            return 44;
        case 173:
            return 45;
        case 189:
            return 45;
        case 190:
            return 46;
        case 191:
            return 47;
        case 48:
            return 48;
        case 49:
            return 49;
        case 50:
            return 50;
        case 51:
            return 51;
        case 52:
            return 52;
        case 53:
            return 53;
        case 54:
            return 54;
        case 55:
            return 55;
        case 56:
            return 56;
        case 57:
            return 57;
        case 59:
            return 59;
        case 61:
            return 61;
        case 187:
            return 61;
        case 65:
            return 65;
        case 66:
            return 66;
        case 67:
            return 67;
        case 68:
            return 68;
        case 69:
            return 69;
        case 70:
            return 70;
        case 71:
            return 71;
        case 72:
            return 72;
        case 73:
            return 73;
        case 74:
            return 74;
        case 75:
            return 75;
        case 76:
            return 76;
        case 77:
            return 77;
        case 78:
            return 78;
        case 79:
            return 79;
        case 80:
            return 80;
        case 81:
            return 81;
        case 82:
            return 82;
        case 83:
            return 83;
        case 84:
            return 84;
        case 85:
            return 85;
        case 86:
            return 86;
        case 87:
            return 87;
        case 88:
            return 88;
        case 89:
            return 89;
        case 90:
            return 90;
        case 219:
            return 91;
        case 220:
            return 92;
        case 221:
            return 93;
        case 192:
            return 96;
        case 27:
            return 256;
        case 13:
            return 257;
        case 9:
            return 258;
        case 8:
            return 259;
        case 45:
            return 260;
        case 46:
            return 261;
        case 39:
            return 262;
        case 37:
            return 263;
        case 40:
            return 264;
        case 38:
            return 265;
        case 33:
            return 266;
        case 34:
            return 267;
        case 36:
            return 268;
        case 35:
            return 269;
        case 20:
            return 280;
        case 145:
            return 281;
        case 144:
            return 282;
        case 44:
            return 283;
        case 19:
            return 284;
        case 112:
            return 290;
        case 113:
            return 291;
        case 114:
            return 292;
        case 115:
            return 293;
        case 116:
            return 294;
        case 117:
            return 295;
        case 118:
            return 296;
        case 119:
            return 297;
        case 120:
            return 298;
        case 121:
            return 299;
        case 122:
            return 300;
        case 123:
            return 301;
        case 124:
            return 302;
        case 125:
            return 303;
        case 126:
            return 304;
        case 127:
            return 305;
        case 128:
            return 306;
        case 129:
            return 307;
        case 130:
            return 308;
        case 131:
            return 309;
        case 132:
            return 310;
        case 133:
            return 311;
        case 134:
            return 312;
        case 135:
            return 313;
        case 136:
            return 314;
        case 96:
            return 320;
        case 97:
            return 321;
        case 98:
            return 322;
        case 99:
            return 323;
        case 100:
            return 324;
        case 101:
            return 325;
        case 102:
            return 326;
        case 103:
            return 327;
        case 104:
            return 328;
        case 105:
            return 329;
        case 110:
            return 330;
        case 111:
            return 331;
        case 106:
            return 332;
        case 109:
            return 333;
        case 107:
            return 334;
        case 16:
            return 340;
        case 17:
            return 341;
        case 18:
            return 342;
        case 91:
            return 343;
        case 93:
            return 348;
        default:
            return -1
        }
    }
    ,
    getModBits: win=>{
        var mod = 0;
        if (win.keys[340])
            mod |= 1;
        if (win.keys[341])
            mod |= 2;
        if (win.keys[342])
            mod |= 4;
        if (win.keys[343])
            mod |= 8;
        return mod
    }
    ,
    onKeyPress: event=>{
        if (!GLFW.active || !GLFW.active.charFunc)
            return;
        if (event.ctrlKey || event.metaKey)
            return;
        var charCode = event.charCode;
        if (charCode == 0 || charCode >= 0 && charCode <= 31)
            return;
        getWasmTableEntry(GLFW.active.charFunc)(GLFW.active.id, charCode)
    }
    ,
    onKeyChanged: (keyCode,status)=>{
        if (!GLFW.active)
            return;
        var key = GLFW.DOMToGLFWKeyCode(keyCode);
        if (key == -1)
            return;
        var repeat = status && GLFW.active.keys[key];
        GLFW.active.keys[key] = status;
        GLFW.active.domKeys[keyCode] = status;
        if (GLFW.active.keyFunc) {
            if (repeat)
                status = 2;
            getWasmTableEntry(GLFW.active.keyFunc)(GLFW.active.id, key, keyCode, status, GLFW.getModBits(GLFW.active))
        }
    }
    ,
    onGamepadConnected: event=>{
        GLFW.refreshJoysticks()
    }
    ,
    onGamepadDisconnected: event=>{
        GLFW.refreshJoysticks()
    }
    ,
    onKeydown: event=>{
        GLFW.onKeyChanged(event.keyCode, 1);
        if (event.keyCode === 8 || event.keyCode === 9) {
            event.preventDefault()
        }
    }
    ,
    onKeyup: event=>{
        GLFW.onKeyChanged(event.keyCode, 0)
    }
    ,
    onBlur: event=>{
        if (!GLFW.active)
            return;
        for (var i = 0; i < GLFW.active.domKeys.length; ++i) {
            if (GLFW.active.domKeys[i]) {
                GLFW.onKeyChanged(i, 0)
            }
        }
    }
    ,
    onMousemove: event=>{
        if (!GLFW.active)
            return;
        if (event.type === "touchmove") {
            event.preventDefault();
            let primaryChanged = false;
            for (let i of event.changedTouches) {
                if (GLFW.primaryTouchId === i.identifier) {
                    Browser.setMouseCoords(i.pageX, i.pageY);
                    primaryChanged = true;
                    break
                }
            }
            if (!primaryChanged) {
                return
            }
        } else {
            Browser.calculateMouseEvent(event)
        }
        if (event.target != Module["canvas"] || !GLFW.active.cursorPosFunc)
            return;
        if (GLFW.active.cursorPosFunc) {
            getWasmTableEntry(GLFW.active.cursorPosFunc)(GLFW.active.id, Browser.mouseX, Browser.mouseY)
        }
    }
    ,
    DOMToGLFWMouseButton: event=>{
        var eventButton = event["button"];
        if (eventButton > 0) {
            if (eventButton == 1) {
                eventButton = 2
            } else {
                eventButton = 1
            }
        }
        return eventButton
    }
    ,
    onMouseenter: event=>{
        if (!GLFW.active)
            return;
        if (event.target != Module["canvas"])
            return;
        if (GLFW.active.cursorEnterFunc) {
            getWasmTableEntry(GLFW.active.cursorEnterFunc)(GLFW.active.id, 1)
        }
    }
    ,
    onMouseleave: event=>{
        if (!GLFW.active)
            return;
        if (event.target != Module["canvas"])
            return;
        if (GLFW.active.cursorEnterFunc) {
            getWasmTableEntry(GLFW.active.cursorEnterFunc)(GLFW.active.id, 0)
        }
    }
    ,
    onMouseButtonChanged: (event,status)=>{
        if (!GLFW.active)
            return;
        if (event.target != Module["canvas"])
            return;
        const isTouchType = event.type === "touchstart" || event.type === "touchend" || event.type === "touchcancel";
        let eventButton = 0;
        if (isTouchType) {
            event.preventDefault();
            let primaryChanged = false;
            if (GLFW.primaryTouchId === null && event.type === "touchstart" && event.targetTouches.length > 0) {
                const chosenTouch = event.targetTouches[0];
                GLFW.primaryTouchId = chosenTouch.identifier;
                Browser.setMouseCoords(chosenTouch.pageX, chosenTouch.pageY);
                primaryChanged = true
            } else if (event.type === "touchend" || event.type === "touchcancel") {
                for (let i of event.changedTouches) {
                    if (GLFW.primaryTouchId === i.identifier) {
                        GLFW.primaryTouchId = null;
                        primaryChanged = true;
                        break
                    }
                }
            }
            if (!primaryChanged) {
                return
            }
        } else {
            Browser.calculateMouseEvent(event);
            eventButton = GLFW.DOMToGLFWMouseButton(event)
        }
        if (status == 1) {
            GLFW.active.buttons |= 1 << eventButton;
            try {
                event.target.setCapture()
            } catch (e) {}
        } else {
            GLFW.active.buttons &= ~(1 << eventButton)
        }
        if (GLFW.active.mouseButtonFunc) {
            getWasmTableEntry(GLFW.active.mouseButtonFunc)(GLFW.active.id, eventButton, status, GLFW.getModBits(GLFW.active))
        }
    }
    ,
    onMouseButtonDown: event=>{
        if (!GLFW.active)
            return;
        GLFW.onMouseButtonChanged(event, 1)
    }
    ,
    onMouseButtonUp: event=>{
        if (!GLFW.active)
            return;
        GLFW.onMouseButtonChanged(event, 0)
    }
    ,
    onMouseWheel: event=>{
        var delta = -Browser.getMouseWheelDelta(event);
        delta = delta == 0 ? 0 : delta > 0 ? Math.max(delta, 1) : Math.min(delta, -1);
        GLFW.wheelPos += delta;
        if (!GLFW.active || !GLFW.active.scrollFunc || event.target != Module["canvas"])
            return;
        var sx = 0;
        var sy = delta;
        if (event.type == "mousewheel") {
            sx = event.wheelDeltaX
        } else {
            sx = event.deltaX
        }
        getWasmTableEntry(GLFW.active.scrollFunc)(GLFW.active.id, sx, sy);
        event.preventDefault()
    }
    ,
    onCanvasResize: (width,height,framebufferWidth,framebufferHeight)=>{
        if (!GLFW.active)
            return;
        var resizeNeeded = false;
        if (document["fullscreen"] || document["fullScreen"] || document["mozFullScreen"] || document["webkitIsFullScreen"]) {
            if (!GLFW.active.fullscreen) {
                resizeNeeded = width != screen.width || height != screen.height;
                GLFW.active.storedX = GLFW.active.x;
                GLFW.active.storedY = GLFW.active.y;
                GLFW.active.storedWidth = GLFW.active.width;
                GLFW.active.storedHeight = GLFW.active.height;
                GLFW.active.x = GLFW.active.y = 0;
                GLFW.active.width = screen.width;
                GLFW.active.height = screen.height;
                GLFW.active.fullscreen = true
            }
        } else if (GLFW.active.fullscreen == true) {
            resizeNeeded = width != GLFW.active.storedWidth || height != GLFW.active.storedHeight;
            GLFW.active.x = GLFW.active.storedX;
            GLFW.active.y = GLFW.active.storedY;
            GLFW.active.width = GLFW.active.storedWidth;
            GLFW.active.height = GLFW.active.storedHeight;
            GLFW.active.fullscreen = false
        }
        if (resizeNeeded) {
            Browser.setCanvasSize(GLFW.active.width, GLFW.active.height)
        } else if (GLFW.active.width != width || GLFW.active.height != height || GLFW.active.framebufferWidth != framebufferWidth || GLFW.active.framebufferHeight != framebufferHeight) {
            GLFW.active.width = width;
            GLFW.active.height = height;
            GLFW.active.framebufferWidth = framebufferWidth;
            GLFW.active.framebufferHeight = framebufferHeight;
            GLFW.onWindowSizeChanged();
            GLFW.onFramebufferSizeChanged()
        }
    }
    ,
    onWindowSizeChanged: ()=>{
        if (!GLFW.active)
            return;
        if (GLFW.active.windowSizeFunc) {
            getWasmTableEntry(GLFW.active.windowSizeFunc)(GLFW.active.id, GLFW.active.width, GLFW.active.height)
        }
    }
    ,
    onFramebufferSizeChanged: ()=>{
        if (!GLFW.active)
            return;
        if (GLFW.active.framebufferSizeFunc) {
            getWasmTableEntry(GLFW.active.framebufferSizeFunc)(GLFW.active.id, GLFW.active.framebufferWidth, GLFW.active.framebufferHeight)
        }
    }
    ,
    onWindowContentScaleChanged: scale=>{
        GLFW.scale = scale;
        if (!GLFW.active)
            return;
        if (GLFW.active.windowContentScaleFunc) {
            getWasmTableEntry(GLFW.active.windowContentScaleFunc)(GLFW.active.id, GLFW.scale, GLFW.scale)
        }
    }
    ,
    getTime: ()=>_emscripten_get_now() / 1e3,
    setWindowTitle: (winid,title)=>{
        var win = GLFW.WindowFromId(winid);
        if (!win)
            return;
        win.title = title;
        if (GLFW.active.id == win.id) {
            _emscripten_set_window_title(title)
        }
    }
    ,
    setJoystickCallback: cbfun=>{
        var prevcbfun = GLFW.joystickFunc;
        GLFW.joystickFunc = cbfun;
        GLFW.refreshJoysticks();
        return prevcbfun
    }
    ,
    joys: {},
    lastGamepadState: [],
    lastGamepadStateFrame: null,
    refreshJoysticks: ()=>{
        if (Browser.mainLoop.currentFrameNumber !== GLFW.lastGamepadStateFrame || !Browser.mainLoop.currentFrameNumber) {
            GLFW.lastGamepadState = navigator.getGamepads ? navigator.getGamepads() : navigator.webkitGetGamepads || [];
            GLFW.lastGamepadStateFrame = Browser.mainLoop.currentFrameNumber;
            for (var joy = 0; joy < GLFW.lastGamepadState.length; ++joy) {
                var gamepad = GLFW.lastGamepadState[joy];
                if (gamepad) {
                    if (!GLFW.joys[joy]) {
                        out("glfw joystick connected:", joy);
                        GLFW.joys[joy] = {
                            id: stringToNewUTF8(gamepad.id),
                            buttonsCount: gamepad.buttons.length,
                            axesCount: gamepad.axes.length,
                            buttons: _malloc(gamepad.buttons.length),
                            axes: _malloc(gamepad.axes.length * 4)
                        };
                        if (GLFW.joystickFunc) {
                            getWasmTableEntry(GLFW.joystickFunc)(joy, 262145)
                        }
                    }
                    var data = GLFW.joys[joy];
                    for (var i = 0; i < gamepad.buttons.length; ++i) {
                        HEAP8[data.buttons + i >> 0] = gamepad.buttons[i].pressed
                    }
                    for (var i = 0; i < gamepad.axes.length; ++i) {
                        HEAPF32[data.axes + i * 4 >> 2] = gamepad.axes[i]
                    }
                } else {
                    if (GLFW.joys[joy]) {
                        out("glfw joystick disconnected", joy);
                        if (GLFW.joystickFunc) {
                            getWasmTableEntry(GLFW.joystickFunc)(joy, 262146)
                        }
                        _free(GLFW.joys[joy].id);
                        _free(GLFW.joys[joy].buttons);
                        _free(GLFW.joys[joy].axes);
                        delete GLFW.joys[joy]
                    }
                }
            }
        }
    }
    ,
    setKeyCallback: (winid,cbfun)=>{
        var win = GLFW.WindowFromId(winid);
        if (!win)
            return null;
        var prevcbfun = win.keyFunc;
        win.keyFunc = cbfun;
        return prevcbfun
    }
    ,
    setCharCallback: (winid,cbfun)=>{
        var win = GLFW.WindowFromId(winid);
        if (!win)
            return null;
        var prevcbfun = win.charFunc;
        win.charFunc = cbfun;
        return prevcbfun
    }
    ,
    setMouseButtonCallback: (winid,cbfun)=>{
        var win = GLFW.WindowFromId(winid);
        if (!win)
            return null;
        var prevcbfun = win.mouseButtonFunc;
        win.mouseButtonFunc = cbfun;
        return prevcbfun
    }
    ,
    setCursorPosCallback: (winid,cbfun)=>{
        var win = GLFW.WindowFromId(winid);
        if (!win)
            return null;
        var prevcbfun = win.cursorPosFunc;
        win.cursorPosFunc = cbfun;
        return prevcbfun
    }
    ,
    setScrollCallback: (winid,cbfun)=>{
        var win = GLFW.WindowFromId(winid);
        if (!win)
            return null;
        var prevcbfun = win.scrollFunc;
        win.scrollFunc = cbfun;
        return prevcbfun
    }
    ,
    setDropCallback: (winid,cbfun)=>{
        var win = GLFW.WindowFromId(winid);
        if (!win)
            return null;
        var prevcbfun = win.dropFunc;
        win.dropFunc = cbfun;
        return prevcbfun
    }
    ,
    onDrop: event=>{
        if (!GLFW.active || !GLFW.active.dropFunc)
            return;
        if (!event.dataTransfer || !event.dataTransfer.files || event.dataTransfer.files.length == 0)
            return;
        event.preventDefault();
        var filenames = _malloc(event.dataTransfer.files.length * 4);
        var filenamesArray = [];
        var count = event.dataTransfer.files.length;
        var written = 0;
        var drop_dir = ".glfw_dropped_files";
        FS.createPath("/", drop_dir);
        function save(file) {
            var path = "/" + drop_dir + "/" + file.name.replace(/\//g, "_");
            var reader = new FileReader;
            reader.onloadend = e=>{
                if (reader.readyState != 2) {
                    ++written;
                    out("failed to read dropped file: " + file.name + ": " + reader.error);
                    return
                }
                var data = e.target.result;
                FS.writeFile(path, new Uint8Array(data));
                if (++written === count) {
                    getWasmTableEntry(GLFW.active.dropFunc)(GLFW.active.id, count, filenames);
                    for (var i = 0; i < filenamesArray.length; ++i) {
                        _free(filenamesArray[i])
                    }
                    _free(filenames)
                }
            }
            ;
            reader.readAsArrayBuffer(file);
            var filename = stringToNewUTF8(path);
            filenamesArray.push(filename);
            HEAPU32[filenames + i * 4 >> 2] = filename
        }
        for (var i = 0; i < count; ++i) {
            save(event.dataTransfer.files[i])
        }
        return false
    }
    ,
    onDragover: event=>{
        if (!GLFW.active || !GLFW.active.dropFunc)
            return;
        event.preventDefault();
        return false
    }
    ,
    setWindowSizeCallback: (winid,cbfun)=>{
        var win = GLFW.WindowFromId(winid);
        if (!win)
            return null;
        var prevcbfun = win.windowSizeFunc;
        win.windowSizeFunc = cbfun;
        return prevcbfun
    }
    ,
    setWindowCloseCallback: (winid,cbfun)=>{
        var win = GLFW.WindowFromId(winid);
        if (!win)
            return null;
        var prevcbfun = win.windowCloseFunc;
        win.windowCloseFunc = cbfun;
        return prevcbfun
    }
    ,
    setWindowRefreshCallback: (winid,cbfun)=>{
        var win = GLFW.WindowFromId(winid);
        if (!win)
            return null;
        var prevcbfun = win.windowRefreshFunc;
        win.windowRefreshFunc = cbfun;
        return prevcbfun
    }
    ,
    onClickRequestPointerLock: e=>{
        if (!Browser.pointerLock && Module["canvas"].requestPointerLock) {
            Module["canvas"].requestPointerLock();
            e.preventDefault()
        }
    }
    ,
    setInputMode: (winid,mode,value)=>{
        var win = GLFW.WindowFromId(winid);
        if (!win)
            return;
        switch (mode) {
        case 208897:
            {
                switch (value) {
                case 212993:
                    {
                        win.inputModes[mode] = value;
                        Module["canvas"].removeEventListener("click", GLFW.onClickRequestPointerLock, true);
                        Module["canvas"].exitPointerLock();
                        break
                    }
                case 212994:
                    {
                        err("glfwSetInputMode called with GLFW_CURSOR_HIDDEN value not implemented");
                        break
                    }
                case 212995:
                    {
                        win.inputModes[mode] = value;
                        Module["canvas"].addEventListener("click", GLFW.onClickRequestPointerLock, true);
                        Module["canvas"].requestPointerLock();
                        break
                    }
                default:
                    {
                        err(`glfwSetInputMode called with unknown value parameter value: ${value}`);
                        break
                    }
                }
                break
            }
        case 208898:
            {
                err("glfwSetInputMode called with GLFW_STICKY_KEYS mode not implemented");
                break
            }
        case 208899:
            {
                err("glfwSetInputMode called with GLFW_STICKY_MOUSE_BUTTONS mode not implemented");
                break
            }
        case 208900:
            {
                err("glfwSetInputMode called with GLFW_LOCK_KEY_MODS mode not implemented");
                break
            }
        case 3342341:
            {
                err("glfwSetInputMode called with GLFW_RAW_MOUSE_MOTION mode not implemented");
                break
            }
        default:
            {
                err(`glfwSetInputMode called with unknown mode parameter value: ${mode}`);
                break
            }
        }
    }
    ,
    getKey: (winid,key)=>{
        var win = GLFW.WindowFromId(winid);
        if (!win)
            return 0;
        return win.keys[key]
    }
    ,
    getMouseButton: (winid,button)=>{
        var win = GLFW.WindowFromId(winid);
        if (!win)
            return 0;
        return (win.buttons & 1 << button) > 0
    }
    ,
    getCursorPos: (winid,x,y)=>{
        HEAPF64[x >> 3] = Browser.mouseX;
        HEAPF64[y >> 3] = Browser.mouseY
    }
    ,
    getMousePos: (winid,x,y)=>{
        HEAP32[x >> 2] = Browser.mouseX;
        HEAP32[y >> 2] = Browser.mouseY
    }
    ,
    setCursorPos: (winid,x,y)=>{}
    ,
    getWindowPos: (winid,x,y)=>{
        var wx = 0;
        var wy = 0;
        var win = GLFW.WindowFromId(winid);
        if (win) {
            wx = win.x;
            wy = win.y
        }
        if (x) {
            HEAP32[x >> 2] = wx
        }
        if (y) {
            HEAP32[y >> 2] = wy
        }
    }
    ,
    setWindowPos: (winid,x,y)=>{
        var win = GLFW.WindowFromId(winid);
        if (!win)
            return;
        win.x = x;
        win.y = y
    }
    ,
    getWindowSize: (winid,width,height)=>{
        var ww = 0;
        var wh = 0;
        var win = GLFW.WindowFromId(winid);
        if (win) {
            ww = win.width;
            wh = win.height
        }
        if (width) {
            HEAP32[width >> 2] = ww
        }
        if (height) {
            HEAP32[height >> 2] = wh
        }
    }
    ,
    setWindowSize: (winid,width,height)=>{
        var win = GLFW.WindowFromId(winid);
        if (!win)
            return;
        if (GLFW.active.id == win.id) {
            Browser.setCanvasSize(width, height)
        }
    }
    ,
    defaultWindowHints: ()=>{
        GLFW.hints = Object.assign({}, GLFW.defaultHints)
    }
    ,
    createWindow: (width,height,title,monitor,share)=>{
        var i, id;
        for (i = 0; i < GLFW.windows.length && GLFW.windows[i] !== null; i++) {}
        if (i > 0)
            throw "glfwCreateWindow only supports one window at time currently";
        id = i + 1;
        if (width <= 0 || height <= 0)
            return 0;
        if (monitor) {
            Browser.requestFullscreen()
        } else {
            Browser.setCanvasSize(width, height)
        }
        for (i = 0; i < GLFW.windows.length && GLFW.windows[i] == null; i++) {}
        var useWebGL = GLFW.hints[139265] > 0;
        if (i == GLFW.windows.length) {
            if (useWebGL) {
                var contextAttributes = {
                    antialias: GLFW.hints[135181] > 1,
                    depth: GLFW.hints[135173] > 0,
                    stencil: GLFW.hints[135174] > 0,
                    alpha: GLFW.hints[135172] > 0
                };
                Module.ctx = Browser.createContext(Module["canvas"], true, true, contextAttributes)
            } else {
                Browser.init()
            }
        }
        if (!Module.ctx && useWebGL)
            return 0;
        const canvas = Module["canvas"];
        var win = new GLFW_Window(id,canvas.clientWidth,canvas.clientHeight,canvas.width,canvas.height,title,monitor,share);
        if (id - 1 == GLFW.windows.length) {
            GLFW.windows.push(win)
        } else {
            GLFW.windows[id - 1] = win
        }
        GLFW.active = win;
        GLFW.adjustCanvasDimensions();
        return win.id
    }
    ,
    destroyWindow: winid=>{
        var win = GLFW.WindowFromId(winid);
        if (!win)
            return;
        if (win.windowCloseFunc) {
            getWasmTableEntry(win.windowCloseFunc)(win.id)
        }
        GLFW.windows[win.id - 1] = null;
        if (GLFW.active.id == win.id)
            GLFW.active = null;
        for (var i = 0; i < GLFW.windows.length; i++)
            if (GLFW.windows[i] !== null)
                return;
        Module.ctx = Browser.destroyContext(Module["canvas"], true, true)
    }
    ,
    swapBuffers: winid=>{}
    ,
    requestFullscreen(lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer == "undefined")
            Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas == "undefined")
            Browser.resizeCanvas = false;
        var canvas = Module["canvas"];
        function fullscreenChange() {
            Browser.isFullscreen = false;
            var canvasContainer = canvas.parentNode;
            if ((document["fullscreenElement"] || document["mozFullScreenElement"] || document["msFullscreenElement"] || document["webkitFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvasContainer) {
                canvas.exitFullscreen = Browser.exitFullscreen;
                if (Browser.lockPointer)
                    canvas.requestPointerLock();
                Browser.isFullscreen = true;
                if (Browser.resizeCanvas) {
                    Browser.setFullscreenCanvasSize()
                } else {
                    Browser.updateCanvasDimensions(canvas);
                    Browser.updateResizeListeners()
                }
            } else {
                canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
                canvasContainer.parentNode.removeChild(canvasContainer);
                if (Browser.resizeCanvas) {
                    Browser.setWindowedCanvasSize()
                } else {
                    Browser.updateCanvasDimensions(canvas);
                    Browser.updateResizeListeners()
                }
            }
            if (Module["onFullScreen"])
                Module["onFullScreen"](Browser.isFullscreen);
            if (Module["onFullscreen"])
                Module["onFullscreen"](Browser.isFullscreen)
        }
        if (!Browser.fullscreenHandlersInstalled) {
            Browser.fullscreenHandlersInstalled = true;
            document.addEventListener("fullscreenchange", fullscreenChange, false);
            document.addEventListener("mozfullscreenchange", fullscreenChange, false);
            document.addEventListener("webkitfullscreenchange", fullscreenChange, false);
            document.addEventListener("MSFullscreenChange", fullscreenChange, false)
        }
        var canvasContainer = document.createElement("div");
        canvas.parentNode.insertBefore(canvasContainer, canvas);
        canvasContainer.appendChild(canvas);
        canvasContainer.requestFullscreen = canvasContainer["requestFullscreen"] || canvasContainer["mozRequestFullScreen"] || canvasContainer["msRequestFullscreen"] || (canvasContainer["webkitRequestFullscreen"] ? ()=>canvasContainer["webkitRequestFullscreen"](Element["ALLOW_KEYBOARD_INPUT"]) : null) || (canvasContainer["webkitRequestFullScreen"] ? ()=>canvasContainer["webkitRequestFullScreen"](Element["ALLOW_KEYBOARD_INPUT"]) : null);
        canvasContainer.requestFullscreen()
    },
    updateCanvasDimensions(canvas, wNative, hNative) {
        const scale = GLFW.getHiDPIScale();
        if (wNative && hNative) {
            canvas.widthNative = wNative;
            canvas.heightNative = hNative
        } else {
            wNative = canvas.widthNative;
            hNative = canvas.heightNative
        }
        var w = wNative;
        var h = hNative;
        if (Module["forcedAspectRatio"] && Module["forcedAspectRatio"] > 0) {
            if (w / h < Module["forcedAspectRatio"]) {
                w = Math.round(h * Module["forcedAspectRatio"])
            } else {
                h = Math.round(w / Module["forcedAspectRatio"])
            }
        }
        if ((document["fullscreenElement"] || document["mozFullScreenElement"] || document["msFullscreenElement"] || document["webkitFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvas.parentNode && typeof screen != "undefined") {
            var factor = Math.min(screen.width / w, screen.height / h);
            w = Math.round(w * factor);
            h = Math.round(h * factor)
        }
        if (Browser.resizeCanvas) {
            wNative = w;
            hNative = h
        }
        const wNativeScaled = Math.floor(wNative * scale);
        const hNativeScaled = Math.floor(hNative * scale);
        if (canvas.width != wNativeScaled)
            canvas.width = wNativeScaled;
        if (canvas.height != hNativeScaled)
            canvas.height = hNativeScaled;
        if (typeof canvas.style != "undefined") {
            if (wNativeScaled != wNative || hNativeScaled != hNative) {
                canvas.style.setProperty("width", wNative + "px", "important");
                canvas.style.setProperty("height", hNative + "px", "important")
            } else {
                canvas.style.removeProperty("width");
                canvas.style.removeProperty("height")
            }
        }
    },
    calculateMouseCoords(pageX, pageY) {
        var rect = Module["canvas"].getBoundingClientRect();
        var cw = Module["canvas"].clientWidth;
        var ch = Module["canvas"].clientHeight;
        var scrollX = typeof window.scrollX != "undefined" ? window.scrollX : window.pageXOffset;
        var scrollY = typeof window.scrollY != "undefined" ? window.scrollY : window.pageYOffset;
        var adjustedX = pageX - (scrollX + rect.left);
        var adjustedY = pageY - (scrollY + rect.top);
        adjustedX = adjustedX * (cw / rect.width);
        adjustedY = adjustedY * (ch / rect.height);
        return {
            x: adjustedX,
            y: adjustedY
        }
    },
    setWindowAttrib: (winid,attrib,value)=>{
        var win = GLFW.WindowFromId(winid);
        if (!win)
            return;
        const isHiDPIAware = GLFW.isHiDPIAware();
        win.attributes[attrib] = value;
        if (isHiDPIAware !== GLFW.isHiDPIAware())
            GLFW.adjustCanvasDimensions()
    }
    ,
    getDevicePixelRatio() {
        return typeof devicePixelRatio == "number" && devicePixelRatio || 1
    },
    isHiDPIAware() {
        if (GLFW.active)
            return GLFW.active.attributes[139276] > 0;
        else
            return false
    },
    adjustCanvasDimensions() {
        const canvas = Module["canvas"];
        Browser.updateCanvasDimensions(canvas, canvas.clientWidth, canvas.clientHeight);
        Browser.updateResizeListeners()
    },
    getHiDPIScale() {
        return GLFW.isHiDPIAware() ? GLFW.scale : 1
    },
    onDevicePixelRatioChange() {
        GLFW.onWindowContentScaleChanged(GLFW.getDevicePixelRatio());
        GLFW.adjustCanvasDimensions()
    },
    GLFW2ParamToGLFW3Param: param=>{
        var table = {
            196609: 0,
            196610: 0,
            196611: 0,
            196612: 0,
            196613: 0,
            196614: 0,
            131073: 0,
            131074: 0,
            131075: 0,
            131076: 0,
            131077: 135169,
            131078: 135170,
            131079: 135171,
            131080: 135172,
            131081: 135173,
            131082: 135174,
            131083: 135183,
            131084: 135175,
            131085: 135176,
            131086: 135177,
            131087: 135178,
            131088: 135179,
            131089: 135180,
            131090: 0,
            131091: 135181,
            131092: 139266,
            131093: 139267,
            131094: 139270,
            131095: 139271,
            131096: 139272
        };
        return table[param]
    }
};
var _glfwCreateWindow = (width,height,title,monitor,share)=>GLFW.createWindow(width, height, title, monitor, share);
var _glfwGetPrimaryMonitor = ()=>1;
var _glfwGetVideoMode = monitor=>0;
var _glfwInit = ()=>{
    if (GLFW.windows)
        return 1;
    GLFW.initialTime = GLFW.getTime();
    GLFW.defaultWindowHints();
    GLFW.windows = new Array;
    GLFW.active = null;
    GLFW.scale = GLFW.getDevicePixelRatio();
    window.addEventListener("gamepadconnected", GLFW.onGamepadConnected, true);
    window.addEventListener("gamepaddisconnected", GLFW.onGamepadDisconnected, true);
    window.addEventListener("keydown", GLFW.onKeydown, true);
    window.addEventListener("keypress", GLFW.onKeyPress, true);
    window.addEventListener("keyup", GLFW.onKeyup, true);
    window.addEventListener("blur", GLFW.onBlur, true);
    GLFW.devicePixelRatioMQL = window.matchMedia("(resolution: " + GLFW.getDevicePixelRatio() + "dppx)");
    GLFW.devicePixelRatioMQL.addEventListener("change", GLFW.onDevicePixelRatioChange);
    Module["canvas"].addEventListener("touchmove", GLFW.onMousemove, true);
    Module["canvas"].addEventListener("touchstart", GLFW.onMouseButtonDown, true);
    Module["canvas"].addEventListener("touchcancel", GLFW.onMouseButtonUp, true);
    Module["canvas"].addEventListener("touchend", GLFW.onMouseButtonUp, true);
    Module["canvas"].addEventListener("mousemove", GLFW.onMousemove, true);
    Module["canvas"].addEventListener("mousedown", GLFW.onMouseButtonDown, true);
    Module["canvas"].addEventListener("mouseup", GLFW.onMouseButtonUp, true);
    Module["canvas"].addEventListener("wheel", GLFW.onMouseWheel, true);
    Module["canvas"].addEventListener("mousewheel", GLFW.onMouseWheel, true);
    Module["canvas"].addEventListener("mouseenter", GLFW.onMouseenter, true);
    Module["canvas"].addEventListener("mouseleave", GLFW.onMouseleave, true);
    Module["canvas"].addEventListener("drop", GLFW.onDrop, true);
    Module["canvas"].addEventListener("dragover", GLFW.onDragover, true);
    Browser.requestFullscreen = GLFW.requestFullscreen;
    Browser.calculateMouseCoords = GLFW.calculateMouseCoords;
    Browser.updateCanvasDimensions = GLFW.updateCanvasDimensions;
    Browser.resizeListeners.push((width,height)=>{
        if (GLFW.isHiDPIAware()) {
            var canvas = Module["canvas"];
            GLFW.onCanvasResize(canvas.clientWidth, canvas.clientHeight, width, height)
        } else {
            GLFW.onCanvasResize(width, height, width, height)
        }
    }
    );
    return 1
}
;
var _glfwMakeContextCurrent = winid=>{}
;
var _glfwPollEvents = ()=>{}
;
var _glfwSetClipboardString = (win,string)=>{}
;
var _glfwSetDropCallback = (winid,cbfun)=>GLFW.setDropCallback(winid, cbfun);
var _glfwSetErrorCallback = cbfun=>{
    var prevcbfun = GLFW.errorFunc;
    GLFW.errorFunc = cbfun;
    return prevcbfun
}
;
var _glfwSetKeyCallback = (winid,cbfun)=>GLFW.setKeyCallback(winid, cbfun);
var _glfwSetScrollCallback = (winid,cbfun)=>GLFW.setScrollCallback(winid, cbfun);
var _glfwSetWindowSizeCallback = (winid,cbfun)=>GLFW.setWindowSizeCallback(winid, cbfun);
var _glfwSwapBuffers = winid=>GLFW.swapBuffers(winid);
var _glfwSwapInterval = interval=>{
    interval = Math.abs(interval);
    if (interval == 0)
        _emscripten_set_main_loop_timing(0, 0);
    else
        _emscripten_set_main_loop_timing(1, interval)
}
;
var _glfwTerminate = ()=>{
    window.removeEventListener("gamepadconnected", GLFW.onGamepadConnected, true);
    window.removeEventListener("gamepaddisconnected", GLFW.onGamepadDisconnected, true);
    window.removeEventListener("keydown", GLFW.onKeydown, true);
    window.removeEventListener("keypress", GLFW.onKeyPress, true);
    window.removeEventListener("keyup", GLFW.onKeyup, true);
    window.removeEventListener("blur", GLFW.onBlur, true);
    Module["canvas"].removeEventListener("touchmove", GLFW.onMousemove, true);
    Module["canvas"].removeEventListener("touchstart", GLFW.onMouseButtonDown, true);
    Module["canvas"].removeEventListener("touchcancel", GLFW.onMouseButtonUp, true);
    Module["canvas"].removeEventListener("touchend", GLFW.onMouseButtonUp, true);
    Module["canvas"].removeEventListener("mousemove", GLFW.onMousemove, true);
    Module["canvas"].removeEventListener("mousedown", GLFW.onMouseButtonDown, true);
    Module["canvas"].removeEventListener("mouseup", GLFW.onMouseButtonUp, true);
    Module["canvas"].removeEventListener("wheel", GLFW.onMouseWheel, true);
    Module["canvas"].removeEventListener("mousewheel", GLFW.onMouseWheel, true);
    Module["canvas"].removeEventListener("mouseenter", GLFW.onMouseenter, true);
    Module["canvas"].removeEventListener("mouseleave", GLFW.onMouseleave, true);
    Module["canvas"].removeEventListener("drop", GLFW.onDrop, true);
    Module["canvas"].removeEventListener("dragover", GLFW.onDragover, true);
    if (GLFW.devicePixelRatioMQL)
        GLFW.devicePixelRatioMQL.removeEventListener("change", GLFW.onDevicePixelRatioChange);
    Module["canvas"].width = Module["canvas"].height = 1;
    GLFW.windows = null;
    GLFW.active = null
}
;
var _glfwWindowHint = (target,hint)=>{
    GLFW.hints[target] = hint
}
;
var arraySum = (array,index)=>{
    var sum = 0;
    for (var i = 0; i <= index; sum += array[i++]) {}
    return sum
}
;
var MONTH_DAYS_LEAP = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var MONTH_DAYS_REGULAR = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var addDays = (date,days)=>{
    var newDate = new Date(date.getTime());
    while (days > 0) {
        var leap = isLeapYear(newDate.getFullYear());
        var currentMonth = newDate.getMonth();
        var daysInCurrentMonth = (leap ? MONTH_DAYS_LEAP : MONTH_DAYS_REGULAR)[currentMonth];
        if (days > daysInCurrentMonth - newDate.getDate()) {
            days -= daysInCurrentMonth - newDate.getDate() + 1;
            newDate.setDate(1);
            if (currentMonth < 11) {
                newDate.setMonth(currentMonth + 1)
            } else {
                newDate.setMonth(0);
                newDate.setFullYear(newDate.getFullYear() + 1)
            }
        } else {
            newDate.setDate(newDate.getDate() + days);
            return newDate
        }
    }
    return newDate
}
;
var writeArrayToMemory = (array,buffer)=>{
    HEAP8.set(array, buffer)
}
;
var _strftime = (s,maxsize,format,tm)=>{
    var tm_zone = HEAPU32[tm + 40 >> 2];
    var date = {
        tm_sec: HEAP32[tm >> 2],
        tm_min: HEAP32[tm + 4 >> 2],
        tm_hour: HEAP32[tm + 8 >> 2],
        tm_mday: HEAP32[tm + 12 >> 2],
        tm_mon: HEAP32[tm + 16 >> 2],
        tm_year: HEAP32[tm + 20 >> 2],
        tm_wday: HEAP32[tm + 24 >> 2],
        tm_yday: HEAP32[tm + 28 >> 2],
        tm_isdst: HEAP32[tm + 32 >> 2],
        tm_gmtoff: HEAP32[tm + 36 >> 2],
        tm_zone: tm_zone ? UTF8ToString(tm_zone) : ""
    };
    var pattern = UTF8ToString(format);
    var EXPANSION_RULES_1 = {
        "%c": "%a %b %d %H:%M:%S %Y",
        "%D": "%m/%d/%y",
        "%F": "%Y-%m-%d",
        "%h": "%b",
        "%r": "%I:%M:%S %p",
        "%R": "%H:%M",
        "%T": "%H:%M:%S",
        "%x": "%m/%d/%y",
        "%X": "%H:%M:%S",
        "%Ec": "%c",
        "%EC": "%C",
        "%Ex": "%m/%d/%y",
        "%EX": "%H:%M:%S",
        "%Ey": "%y",
        "%EY": "%Y",
        "%Od": "%d",
        "%Oe": "%e",
        "%OH": "%H",
        "%OI": "%I",
        "%Om": "%m",
        "%OM": "%M",
        "%OS": "%S",
        "%Ou": "%u",
        "%OU": "%U",
        "%OV": "%V",
        "%Ow": "%w",
        "%OW": "%W",
        "%Oy": "%y"
    };
    for (var rule in EXPANSION_RULES_1) {
        pattern = pattern.replace(new RegExp(rule,"g"), EXPANSION_RULES_1[rule])
    }
    var WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    function leadingSomething(value, digits, character) {
        var str = typeof value == "number" ? value.toString() : value || "";
        while (str.length < digits) {
            str = character[0] + str
        }
        return str
    }
    function leadingNulls(value, digits) {
        return leadingSomething(value, digits, "0")
    }
    function compareByDay(date1, date2) {
        function sgn(value) {
            return value < 0 ? -1 : value > 0 ? 1 : 0
        }
        var compare;
        if ((compare = sgn(date1.getFullYear() - date2.getFullYear())) === 0) {
            if ((compare = sgn(date1.getMonth() - date2.getMonth())) === 0) {
                compare = sgn(date1.getDate() - date2.getDate())
            }
        }
        return compare
    }
    function getFirstWeekStartDate(janFourth) {
        switch (janFourth.getDay()) {
        case 0:
            return new Date(janFourth.getFullYear() - 1,11,29);
        case 1:
            return janFourth;
        case 2:
            return new Date(janFourth.getFullYear(),0,3);
        case 3:
            return new Date(janFourth.getFullYear(),0,2);
        case 4:
            return new Date(janFourth.getFullYear(),0,1);
        case 5:
            return new Date(janFourth.getFullYear() - 1,11,31);
        case 6:
            return new Date(janFourth.getFullYear() - 1,11,30)
        }
    }
    function getWeekBasedYear(date) {
        var thisDate = addDays(new Date(date.tm_year + 1900,0,1), date.tm_yday);
        var janFourthThisYear = new Date(thisDate.getFullYear(),0,4);
        var janFourthNextYear = new Date(thisDate.getFullYear() + 1,0,4);
        var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
        var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
        if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
            if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
                return thisDate.getFullYear() + 1
            }
            return thisDate.getFullYear()
        }
        return thisDate.getFullYear() - 1
    }
    var EXPANSION_RULES_2 = {
        "%a": date=>WEEKDAYS[date.tm_wday].substring(0, 3),
        "%A": date=>WEEKDAYS[date.tm_wday],
        "%b": date=>MONTHS[date.tm_mon].substring(0, 3),
        "%B": date=>MONTHS[date.tm_mon],
        "%C": date=>{
            var year = date.tm_year + 1900;
            return leadingNulls(year / 100 | 0, 2)
        }
        ,
        "%d": date=>leadingNulls(date.tm_mday, 2),
        "%e": date=>leadingSomething(date.tm_mday, 2, " "),
        "%g": date=>getWeekBasedYear(date).toString().substring(2),
        "%G": date=>getWeekBasedYear(date),
        "%H": date=>leadingNulls(date.tm_hour, 2),
        "%I": date=>{
            var twelveHour = date.tm_hour;
            if (twelveHour == 0)
                twelveHour = 12;
            else if (twelveHour > 12)
                twelveHour -= 12;
            return leadingNulls(twelveHour, 2)
        }
        ,
        "%j": date=>leadingNulls(date.tm_mday + arraySum(isLeapYear(date.tm_year + 1900) ? MONTH_DAYS_LEAP : MONTH_DAYS_REGULAR, date.tm_mon - 1), 3),
        "%m": date=>leadingNulls(date.tm_mon + 1, 2),
        "%M": date=>leadingNulls(date.tm_min, 2),
        "%n": ()=>"\n",
        "%p": date=>{
            if (date.tm_hour >= 0 && date.tm_hour < 12) {
                return "AM"
            }
            return "PM"
        }
        ,
        "%S": date=>leadingNulls(date.tm_sec, 2),
        "%t": ()=>"\t",
        "%u": date=>date.tm_wday || 7,
        "%U": date=>{
            var days = date.tm_yday + 7 - date.tm_wday;
            return leadingNulls(Math.floor(days / 7), 2)
        }
        ,
        "%V": date=>{
            var val = Math.floor((date.tm_yday + 7 - (date.tm_wday + 6) % 7) / 7);
            if ((date.tm_wday + 371 - date.tm_yday - 2) % 7 <= 2) {
                val++
            }
            if (!val) {
                val = 52;
                var dec31 = (date.tm_wday + 7 - date.tm_yday - 1) % 7;
                if (dec31 == 4 || dec31 == 5 && isLeapYear(date.tm_year % 400 - 1)) {
                    val++
                }
            } else if (val == 53) {
                var jan1 = (date.tm_wday + 371 - date.tm_yday) % 7;
                if (jan1 != 4 && (jan1 != 3 || !isLeapYear(date.tm_year)))
                    val = 1
            }
            return leadingNulls(val, 2)
        }
        ,
        "%w": date=>date.tm_wday,
        "%W": date=>{
            var days = date.tm_yday + 7 - (date.tm_wday + 6) % 7;
            return leadingNulls(Math.floor(days / 7), 2)
        }
        ,
        "%y": date=>(date.tm_year + 1900).toString().substring(2),
        "%Y": date=>date.tm_year + 1900,
        "%z": date=>{
            var off = date.tm_gmtoff;
            var ahead = off >= 0;
            off = Math.abs(off) / 60;
            off = off / 60 * 100 + off % 60;
            return (ahead ? "+" : "-") + String("0000" + off).slice(-4)
        }
        ,
        "%Z": date=>date.tm_zone,
        "%%": ()=>"%"
    };
    pattern = pattern.replace(/%%/g, "\0\0");
    for (var rule in EXPANSION_RULES_2) {
        if (pattern.includes(rule)) {
            pattern = pattern.replace(new RegExp(rule,"g"), EXPANSION_RULES_2[rule](date))
        }
    }
    pattern = pattern.replace(/\0\0/g, "%");
    var bytes = intArrayFromString(pattern, false);
    if (bytes.length > maxsize) {
        return 0
    }
    writeArrayToMemory(bytes, s);
    return bytes.length - 1
}
;
var getCFunc = ident=>{
    var func = Module["_" + ident];
    return func
}
;
var ccall = (ident,returnType,argTypes,args,opts)=>{
    var toC = {
        "string": str=>{
            var ret = 0;
            if (str !== null && str !== undefined && str !== 0) {
                ret = stringToUTF8OnStack(str)
            }
            return ret
        }
        ,
        "array": arr=>{
            var ret = stackAlloc(arr.length);
            writeArrayToMemory(arr, ret);
            return ret
        }
    };
    function convertReturnValue(ret) {
        if (returnType === "string") {
            return UTF8ToString(ret)
        }
        if (returnType === "boolean")
            return Boolean(ret);
        return ret
    }
    var func = getCFunc(ident);
    var cArgs = [];
    var stack = 0;
    if (args) {
        for (var i = 0; i < args.length; i++) {
            var converter = toC[argTypes[i]];
            if (converter) {
                if (stack === 0)
                    stack = stackSave();
                cArgs[i] = converter(args[i])
            } else {
                cArgs[i] = args[i]
            }
        }
    }
    var ret = func.apply(null, cArgs);
    function onDone(ret) {
        if (stack !== 0)
            stackRestore(stack);
        return convertReturnValue(ret)
    }
    ret = onDone(ret);
    return ret
}
;
var cwrap = (ident,returnType,argTypes,opts)=>{
    var numericArgs = !argTypes || argTypes.every(type=>type === "number" || type === "boolean");
    var numericRet = returnType !== "string";
    if (numericRet && numericArgs && !opts) {
        return getCFunc(ident)
    }
    return function() {
        return ccall(ident, returnType, argTypes, arguments, opts)
    }
}
;
var FSNode = function(parent, name, mode, rdev) {
    if (!parent) {
        parent = this
    }
    this.parent = parent;
    this.mount = parent.mount;
    this.mounted = null;
    this.id = FS.nextInode++;
    this.name = name;
    this.mode = mode;
    this.node_ops = {};
    this.stream_ops = {};
    this.rdev = rdev
};
var readMode = 292 | 73;
var writeMode = 146;
Object.defineProperties(FSNode.prototype, {
    read: {
        get: function() {
            return (this.mode & readMode) === readMode
        },
        set: function(val) {
            val ? this.mode |= readMode : this.mode &= ~readMode
        }
    },
    write: {
        get: function() {
            return (this.mode & writeMode) === writeMode
        },
        set: function(val) {
            val ? this.mode |= writeMode : this.mode &= ~writeMode
        }
    },
    isFolder: {
        get: function() {
            return FS.isDir(this.mode)
        }
    },
    isDevice: {
        get: function() {
            return FS.isChrdev(this.mode)
        }
    }
});
FS.FSNode = FSNode;
FS.createPreloadedFile = FS_createPreloadedFile;
FS.staticInit();
Module["FS_createPath"] = FS.createPath;
Module["FS_createDataFile"] = FS.createDataFile;
Module["FS_createPreloadedFile"] = FS.createPreloadedFile;
Module["FS_unlink"] = FS.unlink;
Module["FS_createLazyFile"] = FS.createLazyFile;
Module["FS_createDevice"] = FS.createDevice;
Module["requestFullscreen"] = Browser.requestFullscreen;
Module["requestAnimationFrame"] = Browser.requestAnimationFrame;
Module["setCanvasSize"] = Browser.setCanvasSize;
Module["pauseMainLoop"] = Browser.mainLoop.pause;
Module["resumeMainLoop"] = Browser.mainLoop.resume;
Module["getUserMedia"] = Browser.getUserMedia;
Module["createContext"] = Browser.createContext;
var preloadedImages = {};
var preloadedAudios = {};
var GLctx;
var miniTempWebGLFloatBuffersStorage = new Float32Array(288);
for (var i = 0; i < 288; ++i) {
    miniTempWebGLFloatBuffers[i] = miniTempWebGLFloatBuffersStorage.subarray(0, i + 1)
}
var wasmImports = {
    a: ___assert_fail,
    la: ___syscall_faccessat,
    R: ___syscall_fcntl64,
    fa: ___syscall_getdents64,
    ia: ___syscall_ioctl,
    ga: ___syscall_mkdirat,
    T: ___syscall_openat,
    ca: ___syscall_renameat,
    da: ___syscall_rmdir,
    ba: ___syscall_stat64,
    ea: ___syscall_unlinkat,
    Ya: ___syscall_utimensat,
    Ua: __localtime_js,
    Va: __mktime_js,
    Za: __tzset_js,
    aa: _abort,
    d: _emscripten_asm_const_int,
    Ha: _emscripten_cancel_main_loop,
    ja: _emscripten_date_now,
    ka: _emscripten_memcpy_js,
    Ta: _emscripten_pause_main_loop,
    _a: _emscripten_request_fullscreen_strategy,
    Xa: _emscripten_resize_heap,
    Sa: _emscripten_resume_main_loop,
    Ga: _emscripten_set_main_loop,
    $: _exit,
    J: _fd_close,
    ha: _fd_read,
    Wa: _fd_seek,
    Q: _fd_write,
    S: get_device_pixel_ratio,
    O: get_hostname,
    xa: get_url_level_index,
    u: _glActiveTexture,
    Z: _glAttachShader,
    l: _glBindBuffer,
    o: _glBindFramebuffer,
    p: _glBindRenderbuffer,
    e: _glBindTexture,
    ma: _glBlendFunc,
    v: _glBufferData,
    V: _glCheckFramebufferStatus,
    t: _glClear,
    F: _glClearColor,
    wa: _glCompileShader,
    ua: _glCreateProgram,
    za: _glCreateShader,
    M: _glDeleteBuffers,
    G: _glDeleteFramebuffers,
    B: _glDeleteRenderbuffers,
    N: _glDeleteTextures,
    na: _glDepthFunc,
    q: _glDepthMask,
    c: _glDisable,
    i: _glDisableVertexAttribArray,
    s: _glDrawArrays,
    b: _glEnable,
    k: _glEnableVertexAttribArray,
    w: _glFramebufferRenderbuffer,
    W: _glFramebufferTexture2D,
    H: _glGenBuffers,
    I: _glGenFramebuffers,
    y: _glGenRenderbuffers,
    D: _glGenTextures,
    j: _glGetAttribLocation,
    r: _glGetIntegerv,
    sa: _glGetProgramInfoLog,
    Y: _glGetProgramiv,
    va: _glGetShaderInfoLog,
    _: _glGetShaderiv,
    n: _glGetUniformLocation,
    ta: _glLinkProgram,
    U: _glReadPixels,
    x: _glRenderbufferStorage,
    ya: _glShaderSource,
    C: _glTexImage2D,
    h: _glTexParameterf,
    K: _glTexParameteri,
    qa: _glTexSubImage2D,
    X: _glUniform1f,
    L: _glUniform1i,
    E: _glUniform2f,
    z: _glUniform3fv,
    g: _glUniformMatrix4fv,
    A: _glUseProgram,
    f: _glVertexAttribPointer,
    m: _glViewport,
    Na: _glfwCreateWindow,
    Pa: _glfwGetPrimaryMonitor,
    Oa: _glfwGetVideoMode,
    Qa: _glfwInit,
    Ma: _glfwMakeContextCurrent,
    pa: _glfwPollEvents,
    oa: _glfwSetClipboardString,
    Ja: _glfwSetDropCallback,
    Ra: _glfwSetErrorCallback,
    La: _glfwSetKeyCallback,
    Ka: _glfwSetScrollCallback,
    Ia: _glfwSetWindowSizeCallback,
    ra: _glfwSwapBuffers,
    Fa: _glfwSwapInterval,
    Ea: _glfwTerminate,
    P: _glfwWindowHint,
    Da: is_daily_reward_possible,
    Ca: is_latest_browser_tab,
    Ba: set_latest_browser_tab,
    Aa: _strftime
};
var wasmExports = createWasm();
var ___wasm_call_ctors = ()=>(___wasm_call_ctors = wasmExports["ab"])();
var _malloc = Module["_malloc"] = a0=>(_malloc = Module["_malloc"] = wasmExports["bb"])(a0);
var _free = Module["_free"] = a0=>(_free = Module["_free"] = wasmExports["cb"])(a0);
var _webaudio_fill = Module["_webaudio_fill"] = ()=>(_webaudio_fill = Module["_webaudio_fill"] = wasmExports["eb"])();
var _get_app_version = Module["_get_app_version"] = ()=>(_get_app_version = Module["_get_app_version"] = wasmExports["fb"])();
var _use_test_api_server = Module["_use_test_api_server"] = ()=>(_use_test_api_server = Module["_use_test_api_server"] = wasmExports["gb"])();
var _level_select_menu_start_level = Module["_level_select_menu_start_level"] = a0=>(_level_select_menu_start_level = Module["_level_select_menu_start_level"] = wasmExports["hb"])(a0);
var _set_game_focus = Module["_set_game_focus"] = a0=>(_set_game_focus = Module["_set_game_focus"] = wasmExports["ib"])(a0);
var _set_ad_freq = Module["_set_ad_freq"] = a0=>(_set_ad_freq = Module["_set_ad_freq"] = wasmExports["jb"])(a0);
var _set_ad_duration_offline = Module["_set_ad_duration_offline"] = a0=>(_set_ad_duration_offline = Module["_set_ad_duration_offline"] = wasmExports["kb"])(a0);
var _set_abtest_in_game_get = Module["_set_abtest_in_game_get"] = a0=>(_set_abtest_in_game_get = Module["_set_abtest_in_game_get"] = wasmExports["lb"])(a0);
var _set_user_premium_ends = Module["_set_user_premium_ends"] = a0=>(_set_user_premium_ends = Module["_set_user_premium_ends"] = wasmExports["mb"])(a0);
var _get_user_premium_ends = Module["_get_user_premium_ends"] = ()=>(_get_user_premium_ends = Module["_get_user_premium_ends"] = wasmExports["nb"])();
var _set_user_banned = Module["_set_user_banned"] = a0=>(_set_user_banned = Module["_set_user_banned"] = wasmExports["ob"])(a0);
var _set_user_gems = Module["_set_user_gems"] = a0=>(_set_user_gems = Module["_set_user_gems"] = wasmExports["pb"])(a0);
var _set_user_nick = Module["_set_user_nick"] = a0=>(_set_user_nick = Module["_set_user_nick"] = wasmExports["qb"])(a0);
var _set_user_state = Module["_set_user_state"] = a0=>(_set_user_state = Module["_set_user_state"] = wasmExports["rb"])(a0);
var _set_user_uid = Module["_set_user_uid"] = a0=>(_set_user_uid = Module["_set_user_uid"] = wasmExports["sb"])(a0);
var _set_user_adfree_ends = Module["_set_user_adfree_ends"] = a0=>(_set_user_adfree_ends = Module["_set_user_adfree_ends"] = wasmExports["tb"])(a0);
var _get_app_inited = Module["_get_app_inited"] = ()=>(_get_app_inited = Module["_get_app_inited"] = wasmExports["ub"])();
var _log_simple = Module["_log_simple"] = a0=>(_log_simple = Module["_log_simple"] = wasmExports["vb"])(a0);
var _app_terminate_if_necessary = Module["_app_terminate_if_necessary"] = ()=>(_app_terminate_if_necessary = Module["_app_terminate_if_necessary"] = wasmExports["wb"])();
var _score_set_top_nicks_and_scores = Module["_score_set_top_nicks_and_scores"] = (a0,a1,a2,a3,a4,a5,a6,a7,a8,a9)=>(_score_set_top_nicks_and_scores = Module["_score_set_top_nicks_and_scores"] = wasmExports["xb"])(a0, a1, a2, a3, a4, a5, a6, a7, a8, a9);
var _score_set_above_nicks_and_scores = Module["_score_set_above_nicks_and_scores"] = (a0,a1,a2,a3,a4,a5,a6,a7)=>(_score_set_above_nicks_and_scores = Module["_score_set_above_nicks_and_scores"] = wasmExports["yb"])(a0, a1, a2, a3, a4, a5, a6, a7);
var _score_set_below_nicks_and_scores = Module["_score_set_below_nicks_and_scores"] = (a0,a1,a2,a3)=>(_score_set_below_nicks_and_scores = Module["_score_set_below_nicks_and_scores"] = wasmExports["zb"])(a0, a1, a2, a3);
var _score_read_finished_em = Module["_score_read_finished_em"] = (a0,a1,a2,a3,a4,a5)=>(_score_read_finished_em = Module["_score_read_finished_em"] = wasmExports["Ab"])(a0, a1, a2, a3, a4, a5);
var _state_menu_payout_stop = Module["_state_menu_payout_stop"] = a0=>(_state_menu_payout_stop = Module["_state_menu_payout_stop"] = wasmExports["Bb"])(a0);
var _keydown_browser = Module["_keydown_browser"] = a0=>(_keydown_browser = Module["_keydown_browser"] = wasmExports["Cb"])(a0);
var _update_screen_size = Module["_update_screen_size"] = (a0,a1,a2)=>(_update_screen_size = Module["_update_screen_size"] = wasmExports["Db"])(a0, a1, a2);
var _touch_start = Module["_touch_start"] = a0=>(_touch_start = Module["_touch_start"] = wasmExports["Eb"])(a0);
var _touch_move = Module["_touch_move"] = (a0,a1,a2)=>(_touch_move = Module["_touch_move"] = wasmExports["Fb"])(a0, a1, a2);
var _touch_end = Module["_touch_end"] = a0=>(_touch_end = Module["_touch_end"] = wasmExports["Gb"])(a0);
var _mouse_move = Module["_mouse_move"] = (a0,a1,a2)=>(_mouse_move = Module["_mouse_move"] = wasmExports["Hb"])(a0, a1, a2);
var _mouse_updown = Module["_mouse_updown"] = (a0,a1,a2,a3)=>(_mouse_updown = Module["_mouse_updown"] = wasmExports["Ib"])(a0, a1, a2, a3);
var _request_fullscreen = Module["_request_fullscreen"] = ()=>(_request_fullscreen = Module["_request_fullscreen"] = wasmExports["Jb"])();
var _user_accepted_and_clicked = Module["_user_accepted_and_clicked"] = ()=>(_user_accepted_and_clicked = Module["_user_accepted_and_clicked"] = wasmExports["Kb"])();
var _pause_main_loop = Module["_pause_main_loop"] = ()=>(_pause_main_loop = Module["_pause_main_loop"] = wasmExports["Lb"])();
var _resume_main_loop = Module["_resume_main_loop"] = ()=>(_resume_main_loop = Module["_resume_main_loop"] = wasmExports["Mb"])();
var _main = Module["_main"] = (a0,a1)=>(_main = Module["_main"] = wasmExports["Nb"])(a0, a1);
var _app_webview_message = Module["_app_webview_message"] = a0=>(_app_webview_message = Module["_app_webview_message"] = wasmExports["Ob"])(a0);
var _app_pause = Module["_app_pause"] = ()=>(_app_pause = Module["_app_pause"] = wasmExports["Pb"])();
var _app_resume = Module["_app_resume"] = ()=>(_app_resume = Module["_app_resume"] = wasmExports["Qb"])();
var _app_on_signin = Module["_app_on_signin"] = (a0,a1,a2,a3,a4,a5)=>(_app_on_signin = Module["_app_on_signin"] = wasmExports["Rb"])(a0, a1, a2, a3, a4, a5);
var _app_on_signout = Module["_app_on_signout"] = ()=>(_app_on_signout = Module["_app_on_signout"] = wasmExports["Sb"])();
var _app_error_ts = Module["_app_error_ts"] = (a0,a1)=>(_app_error_ts = Module["_app_error_ts"] = wasmExports["Tb"])(a0, a1);
var _notification_show_inapp = Module["_notification_show_inapp"] = (a0,a1)=>(_notification_show_inapp = Module["_notification_show_inapp"] = wasmExports["Ub"])(a0, a1);
var _app_set_opengl_context_lost = Module["_app_set_opengl_context_lost"] = a0=>(_app_set_opengl_context_lost = Module["_app_set_opengl_context_lost"] = wasmExports["Vb"])(a0);
var _opengl_resume = Module["_opengl_resume"] = ()=>(_opengl_resume = Module["_opengl_resume"] = wasmExports["Wb"])();
var _app_init = Module["_app_init"] = ()=>(_app_init = Module["_app_init"] = wasmExports["Xb"])();
var _web_command_fetch_url_done = Module["_web_command_fetch_url_done"] = (a0,a1)=>(_web_command_fetch_url_done = Module["_web_command_fetch_url_done"] = wasmExports["Yb"])(a0, a1);
var _menu_query_games_add_result = Module["_menu_query_games_add_result"] = (a0,a1,a2,a3)=>(_menu_query_games_add_result = Module["_menu_query_games_add_result"] = wasmExports["Zb"])(a0, a1, a2, a3);
var _menu_query_games_finished = Module["_menu_query_games_finished"] = ()=>(_menu_query_games_finished = Module["_menu_query_games_finished"] = wasmExports["_b"])();
var _menu_read_game_finished = Module["_menu_read_game_finished"] = (a0,a1,a2,a3,a4,a5)=>(_menu_read_game_finished = Module["_menu_read_game_finished"] = wasmExports["$b"])(a0, a1, a2, a3, a4, a5);
var _menu_read_counts_finished = Module["_menu_read_counts_finished"] = (a0,a1,a2,a3)=>(_menu_read_counts_finished = Module["_menu_read_counts_finished"] = wasmExports["ac"])(a0, a1, a2, a3);
var _menu_read_ledger_finished = Module["_menu_read_ledger_finished"] = (a0,a1,a2,a3,a4,a5)=>(_menu_read_ledger_finished = Module["_menu_read_ledger_finished"] = wasmExports["bc"])(a0, a1, a2, a3, a4, a5);
var _menu_write_ledger_finished = Module["_menu_write_ledger_finished"] = (a0,a1,a2)=>(_menu_write_ledger_finished = Module["_menu_write_ledger_finished"] = wasmExports["cc"])(a0, a1, a2);
var _menu_read_gems_finished = Module["_menu_read_gems_finished"] = a0=>(_menu_read_gems_finished = Module["_menu_read_gems_finished"] = wasmExports["dc"])(a0);
var _state_menu_deeplink_stop = Module["_state_menu_deeplink_stop"] = (a0,a1)=>(_state_menu_deeplink_stop = Module["_state_menu_deeplink_stop"] = wasmExports["ec"])(a0, a1);
var _menu_file_upload_finished = Module["_menu_file_upload_finished"] = a0=>(_menu_file_upload_finished = Module["_menu_file_upload_finished"] = wasmExports["fc"])(a0);
var _share_file_finished = Module["_share_file_finished"] = a0=>(_share_file_finished = Module["_share_file_finished"] = wasmExports["gc"])(a0);
var _iap_cancelled = Module["_iap_cancelled"] = ()=>(_iap_cancelled = Module["_iap_cancelled"] = wasmExports["hc"])();
var _state_menu_payout_add = Module["_state_menu_payout_add"] = (a0,a1,a2)=>(_state_menu_payout_add = Module["_state_menu_payout_add"] = wasmExports["ic"])(a0, a1, a2);
var _menu_on_password_reset_email_sent = Module["_menu_on_password_reset_email_sent"] = ()=>(_menu_on_password_reset_email_sent = Module["_menu_on_password_reset_email_sent"] = wasmExports["jc"])();
var _menu_sync_upload_finished = Module["_menu_sync_upload_finished"] = ()=>(_menu_sync_upload_finished = Module["_menu_sync_upload_finished"] = wasmExports["kc"])();
var _menu_sync_download_finished = Module["_menu_sync_download_finished"] = ()=>(_menu_sync_download_finished = Module["_menu_sync_download_finished"] = wasmExports["lc"])();
var _game_download_finished = Module["_game_download_finished"] = (a0,a1,a2)=>(_game_download_finished = Module["_game_download_finished"] = wasmExports["mc"])(a0, a1, a2);
var _set_is_mobile = Module["_set_is_mobile"] = a0=>(_set_is_mobile = Module["_set_is_mobile"] = wasmExports["nc"])(a0);
var _storage_write = Module["_storage_write"] = (a0,a1,a2)=>(_storage_write = Module["_storage_write"] = wasmExports["oc"])(a0, a1, a2);
var _play_counter_falloff = Module["_play_counter_falloff"] = a0=>(_play_counter_falloff = Module["_play_counter_falloff"] = wasmExports["pc"])(a0);
var _ad_on_inited = Module["_ad_on_inited"] = ()=>(_ad_on_inited = Module["_ad_on_inited"] = wasmExports["qc"])();
var _ad_interstitial_on_showed = Module["_ad_interstitial_on_showed"] = a0=>(_ad_interstitial_on_showed = Module["_ad_interstitial_on_showed"] = wasmExports["rc"])(a0);
var _ad_rewarded_on_rewarded = Module["_ad_rewarded_on_rewarded"] = ()=>(_ad_rewarded_on_rewarded = Module["_ad_rewarded_on_rewarded"] = wasmExports["sc"])();
var _ad_rewarded_on_showed = Module["_ad_rewarded_on_showed"] = a0=>(_ad_rewarded_on_showed = Module["_ad_rewarded_on_showed"] = wasmExports["tc"])(a0);
var _hint_file_exists = Module["_hint_file_exists"] = a0=>(_hint_file_exists = Module["_hint_file_exists"] = wasmExports["uc"])(a0);
var _ntp_set_server_time = Module["_ntp_set_server_time"] = a0=>(_ntp_set_server_time = Module["_ntp_set_server_time"] = wasmExports["vc"])(a0);
var _news_create = Module["_news_create"] = a0=>(_news_create = Module["_news_create"] = wasmExports["wc"])(a0);
var _news_update_started = Module["_news_update_started"] = ()=>(_news_update_started = Module["_news_update_started"] = wasmExports["xc"])();
var _news_update_finished = Module["_news_update_finished"] = ()=>(_news_update_finished = Module["_news_update_finished"] = wasmExports["yc"])();
var _moderation_publish_perform = Module["_moderation_publish_perform"] = ()=>(_moderation_publish_perform = Module["_moderation_publish_perform"] = wasmExports["zc"])();
var ___errno_location = ()=>(___errno_location = wasmExports["Ac"])();
var setTempRet0 = a0=>(setTempRet0 = wasmExports["Bc"])(a0);
var stackSave = ()=>(stackSave = wasmExports["Cc"])();
var stackRestore = a0=>(stackRestore = wasmExports["Dc"])(a0);
var stackAlloc = a0=>(stackAlloc = wasmExports["Ec"])(a0);
var ___start_em_js = Module["___start_em_js"] = 579523;
var ___stop_em_js = Module["___stop_em_js"] = 579974;
Module["addRunDependency"] = addRunDependency;
Module["removeRunDependency"] = removeRunDependency;
Module["FS_createPath"] = FS.createPath;
Module["FS_createLazyFile"] = FS.createLazyFile;
Module["FS_createDevice"] = FS.createDevice;
Module["ccall"] = ccall;
Module["cwrap"] = cwrap;
Module["getValue"] = getValue;
Module["UTF8ToString"] = UTF8ToString;
Module["stringToUTF8"] = stringToUTF8;
Module["writeArrayToMemory"] = writeArrayToMemory;
Module["FS_createPreloadedFile"] = FS.createPreloadedFile;
Module["FS_createDataFile"] = FS.createDataFile;
Module["FS_unlink"] = FS.unlink;
var calledRun;
dependenciesFulfilled = function runCaller() {
    if (!calledRun)
        run();
    if (!calledRun)
        dependenciesFulfilled = runCaller
}
;
function callMain(args=[]) {
    var entryFunction = _main;
    args.unshift(thisProgram);
    var argc = args.length;
    var argv = stackAlloc((argc + 1) * 4);
    var argv_ptr = argv;
    args.forEach(arg=>{
        HEAPU32[argv_ptr >> 2] = stringToUTF8OnStack(arg);
        argv_ptr += 4
    }
    );
    HEAPU32[argv_ptr >> 2] = 0;
    try {
        var ret = entryFunction(argc, argv);
        exitJS(ret, true);
        return ret
    } catch (e) {
        return handleException(e)
    }
}
function run(args=arguments_) {
    if (runDependencies > 0) {
        return
    }
    preRun();
    if (runDependencies > 0) {
        return
    }
    function doRun() {
        if (calledRun)
            return;
        calledRun = true;
        Module["calledRun"] = true;
        if (ABORT)
            return;
        initRuntime();
        preMain();
        if (Module["onRuntimeInitialized"])
            Module["onRuntimeInitialized"]();
        if (shouldRunNow)
            callMain(args);
        postRun()
    }
    if (Module["setStatus"]) {
        Module["setStatus"]("Running...");
        setTimeout(function() {
            setTimeout(function() {
                Module["setStatus"]("")
            }, 1);
            doRun()
        }, 1)
    } else {
        doRun()
    }
}
if (Module["preInit"]) {
    if (typeof Module["preInit"] == "function")
        Module["preInit"] = [Module["preInit"]];
    while (Module["preInit"].length > 0) {
        Module["preInit"].pop()()
    }
}
var shouldRunNow = true;
if (Module["noInitialRun"])
    shouldRunNow = false;
run();
