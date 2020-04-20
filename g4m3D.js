var CANNON = require("cannon");
var wss = require("ws");

class g4m3D {
    _physicsFPS = 60
    _world = null
    _planets = [{
            name: "sun",
            codeName: 0,
            static: true,
            position: this.vec2(0, 0),
            radius: 10000,
            cannonBody: new CANNON.Body()
        },
        {
            name: "mercury",
            codeName: 1,
            static: false,
            orbit: this.vec2(22000, 22000),
            position: this.vec2(0, 0),
            rotaryCycle: 0,
            radius: 100
        },
        {
            name: "venus",
            codeName: 2,
            static: false,
            orbit: this.vec2(25000, 25000),
            position: this.vec2(0, 0),
            rotaryCycle: 0,
            radius: 125
        },
        {
            name: "earth",
            codeName: 3,
            static: false,
            orbit: this.vec2(30000, 30000),
            position: this.vec2(0, 0),
            rotaryCycle: 0,
            radius: 150
        },
        {
            name: "mars",
            codeName: 4,
            static: false,
            orbit: this.vec2(33000, 33000),
            position: this.vec2(0, 0),
            rotaryCycle: 0,
            radius: 137.5
        },
        {
            name: "jupiter",
            codeName: 5,
            static: false,
            orbit: this.vec2(45000, 45000),
            position: this.vec2(0, 0),
            rotaryCycle: 0,
            radius: 2500,
        },
        {
            name: "saturn",
            codeName: 6,
            static: false,
            orbit: this.vec2(52500, 52500),
            position: this.vec2(0, 0),
            rotaryCycle: 0,
            radius: 750
        },
        {
            name: "uranus",
            codeName: 7,
            static: false,
            orbit: this.vec2(60000, 60000),
            position: this.vec2(0, 0),
            rotaryCycle: 0,
            radius: 1000
        },
        {
            name: "neptune",
            codeName: 8,
            static: false,
            orbit: this.vec2(65000, 65000),
            position: this.vec2(0, 0),
            rotaryCycle: 0,
            radius: 600
        },
        {
            name: "moon",
            boundTo: 3,
            orbit: this.vec2(1500, 1500),
            position: this.vec2(0, 0),
            rotaryCycle: 0,
            radius: 50,
            codeName: 9
        }
    ]
    _players = []
    _ws = new wss.Server({
        port: 3000
    })
    _physics_lastTime = undefined
    eRAMData = {
        lastShape: null,
        lastBody: null
    }
    constructor(physicsFps) {
        CANNON.Body.prototype.userData = {}
        this._physicsFPS = physicsFps;
        this._world = new CANNON.World();
        //this._world.broadphase = new CANNON.NaiveBroadphase();
        this._planets.forEach((e, i) => {
            if (!e.hasOwnProperty("boundTo")) {
                this.eRAMData.lastShape = new CANNON.Sphere(e.radius)
                if (e.static) {
                    this.eRAMData.lastBody = new CANNON.Body({
                        mass: 0,
                        fixedRotation: true,
                        position: new CANNON.Vec3(e.position._x, 0, e.position._y)
                    })
                    this.eRAMData.lastBody.addShape(this.eRAMData.lastShape);
                    this.eRAMData.lastBody.userData = {
                        type: -1
                    }
                    this._world.add(this.eRAMData.lastBody);
                    this._planets[i].cannonBody = this.eRAMData.lastBody;
                    

                } else {
                    this.eRAMData.lastBody = new CANNON.Body({
                        mass: 1000,
                        fixedRotation: true,
                        position: new CANNON.Vec3(e.position._x, 0, e.position._y)
                    })
                    this.eRAMData.lastBody.addShape(this.eRAMData.lastShape);
                    this.eRAMData.lastBody.userData = {
                        type: -1
                    }
                    this._world.add(this.eRAMData.lastBody);
                    this._planets[i].cannonBody = this.eRAMData.lastBody;
                    this._planets[i].rotaryCycle = Math.random() * 360;
                    var glthis = this;
                    this._planets[i].cannonBody.addEventListener("collide", function(a,b) {
                        
                        if (a.body.userData.type != -1) {
                            
                            glthis._players.forEach(e=>{
                                if (e.id == a.body.userData.owner) e.power = e.maxPower;
                            })
                        }
                        console.log(a.body);
                        /*if (b.body.userData.type == -1) {
                            _players.forEach(e=>{
                                if (e.id == a.body.userData.owner) e.power = e.maxPower;
                            })
                        }*/
                    })
                }
            }
        })

        this._computedDTFPS = 1 / this._physicsFPS;

        this.startPhysicsAndNetwork();
    }
    _computedDTFPS = 0.1
    _clock = new Date()
    startPhysicsAndNetwork() {
        setInterval(() => {
            this.physicsLoop();
        }, 1000 / this._physicsFPS);
        var glThis = this;
        this._ws.on("connection", function (ws) {
            var playerinstance;
            var playerid;
            var clname = "";
            ws.onclose = function() {
                glThis._world.remove(playerinstance.playerobj);
                playerinstance = null;
                glThis._ws.clients.forEach(e=>{
                    e.send(JSON.stringify(
                        [4,{n:clname,i:playerid}]
                    ))
                })
            }

            ws.onmessage = function (message) {
                

                if (message.data.startsWith("0")) {
                    var tempclk = Date.now();
                    playerid = tempclk;
                    ws.send(JSON.stringify([0, tempclk]));
                    glThis.json = []
                    glThis._world.bodies.forEach(e => {
                        ws.send(JSON.stringify([2,{
                            t: e.userData.type,
                            i: e.id,
                            n: e.userData.owner
                        }]));
                    })
                    // client connection confirmed
                    clname = message.data.slice(1, 16);
                    glThis.eRAMData.lastShape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
                    glThis.eRAMData.lastBody = new CANNON.Body({
                        mass: 20,
                        position: new CANNON.Vec3((Math.sin(Math.random() * 360) * (glThis._planets[3].radius + 20) + glThis._planets[3].position._x), (Math.sin(Math.random() * 360) * (glThis._planets[3].radius + 20)), (Math.sin(Math.random() * 360) * (glThis._planets[3].radius + 20) + glThis._planets[3].position._y)),
                        shape: glThis.eRAMData.lastShape,
                        linearDamping: 0.1,
                        angularDamping: 0.5
                    });
                    glThis.eRAMData.lastBody.userData = {
                        type: 0,
                        owner: tempclk,
                        ownerws: ws
                    };
                    glThis._world.add(glThis.eRAMData.lastBody);
                    glThis._players.push({
                        ws: ws,
                        name: clname,
                        playerobj: glThis.eRAMData.lastBody,
                        pressingkeys: {
                            w: false,
                            s: false,
                            a: false,
                            d: false,
                            c: false,
                            " ": false
                        },
                        id: tempclk,
                        mousebuttonstate: {
                            down: false,
                            xpos: 0,
                            ypos: 0
                        },
                        activethrusters: {
                            "frleup": false,
                            "frrgup": false,
                            "frledn": false,
                            "frrgdn": false,
                            "bkleup": false,
                            "bkrgup": false,
                            "bkledn": false,
                            "bkrgdn": false
                        },
                        power: 1000,
                        maxPower: 1000
                    });
                    glThis._players.forEach((e, i) => {
                        if (tempclk == e.id) playerinstance = glThis._players[i];
                        console.log(playerinstance);
                    })
                    glThis._ws.clients.forEach(e=>{
                        e.send(JSON.stringify(
                            [3,{n:clname,i:playerid}]
                        ))
                    })
                    glThis._ws.clients.forEach(e=>{
                        e.send(JSON.stringify([2,{
                            t: 0,
                            i: glThis.eRAMData.lastBody.id,
                            n: playerid
                        }]));
                    })
                    
                } else {
                    var json = JSON.parse(message.data);
                    switch (json[0]) {
                        case 0:
                            playerinstance.pressingkeys[json[1]] = json[2];
                            break;
                        case 1:
                            playerinstance.mousebuttonstate.down = true;
                            break;
                        case 2:
                            playerinstance.mousebuttonstate.down = false;
                            break;
                        case 3:
                            playerinstance.mousebuttonstate.xpos = json[1];
                            playerinstance.mousebuttonstate.ypos = json[2];
                            break;
                    }
                }

            }
            console.log("connection");
        })
    }
    data = ""
    json = []
    networkLoop() {
        this.json = [1, [],
            []
        ]
        this._planets.forEach(e => {
            this.json[1].push({
                c: e.codeName,
                x: e.position._x,
                z: e.position._y
            })
        })
        /* module types:
            0 - MainHub,
            1 - Cargo,
            2 - LandingBooster,
            3 - Booster,
            4 - GreenBooster,
            5 - HubBooster,
            6 - SuperBooster,
            7 - SolarPanel,
            8 - SuperSolarPanel,
            9 - Hub,
            10 - PowerHub,
            11 - UltraHub,
            13 - Lander,
            14 - Generator
            */
        this._world.bodies.forEach(e => {
            if (e.userData.type < 0) return;
            if (e.userData.type == 0) {
                this.json[2].push({
                    x: e.position.x,
                    y: e.position.y,
                    z: e.position.z,
                    qx: e.quaternion.x,
                    qy: e.quaternion.y,
                    qz: e.quaternion.z,
                    qw: e.quaternion.w,
                    t: e.userData.type,
                    n: e.userData.owner,
                    i: e.id
                })
            } else {
                this.json[2].push({
                    x: e.position.x,
                    y: e.position.y,
                    z: e.position.z,
                    qx: e.quaternion.x,
                    qy: e.quaternion.y,
                    qz: e.quaternion.z,
                    qw: e.quaternion.w,
                    t: e.userData.type,
                    i: e.id
                })
            }
        })
        
        this._ws.clients.forEach(e => {
            e.send(JSON.stringify(this.json));
        })
        this._players.forEach(e=>{
            e.ws.send(JSON.stringify([6,e.power,e.maxPower,(Math.abs(e.playerobj.velocity.x)+Math.abs(e.playerobj.velocity.y)+Math.abs(e.playerobj.velocity.z)).toFixed(2)]));
        })
    }
    thrusterBasicSpeed = 5
    thrusterEcoSpeed = 10
    thrusterHubSpeed = 15
    thrusterSuperSpeed = 20

    physicsLoop() {
        this._planets.forEach(e => {
            if (!e.static && !e.hasOwnProperty("boundTo")) {
                e.rotaryCycle += (1 / Math.max(e.orbit._x, e.orbit._y)) / 100;
                e.position._x = Math.sin(e.rotaryCycle) * e.orbit._x;
                e.position._y = Math.cos(e.rotaryCycle) * e.orbit._y;
                e.cannonBody.position.x = e.position._x;
                e.cannonBody.position.z = e.position._y;
            }
        })
        var glthis = this;
        
        this._players.forEach(e => {
            e.activethrusters.bkledn = false;
            e.activethrusters.bkleup = false;
            e.activethrusters.bkrgdn = false;
            e.activethrusters.bkrgup = false;
            e.activethrusters.frledn = false;
            e.activethrusters.frleup = false;
            e.activethrusters.frrgdn = false;
            e.activethrusters.frrgup = false;
            if (e.pressingkeys.s) {
                e.activethrusters.bkledn = true;
                e.activethrusters.bkleup = true;
                e.activethrusters.bkrgdn = true;
                e.activethrusters.bkrgup = true;
            }
            if (e.pressingkeys.w) {
                e.activethrusters.frledn = true;
                e.activethrusters.frleup = true;
                e.activethrusters.frrgdn = true;
                e.activethrusters.frrgup = true;
            }
            if (e.pressingkeys.d) {
                e.activethrusters.frledn = true;
                e.activethrusters.frleup = true;
                e.activethrusters.bkrgdn = true;
                e.activethrusters.bkrgup = true;
            }
            if (e.pressingkeys.a) {
                e.activethrusters.frrgdn = true;
                e.activethrusters.frrgup = true;
                e.activethrusters.bkledn = true;
                e.activethrusters.bkleup = true;
            }
            if (e.pressingkeys[" "] == true) {
                e.activethrusters.frledn = true;
                e.activethrusters.frrgdn = true;
                e.activethrusters.bkleup = true;
                e.activethrusters.bkrgup = true;
            }
            if (e.pressingkeys.c) {
                e.activethrusters.frleup = true;
                e.activethrusters.frrgup = true;
                e.activethrusters.bkledn = true;
                e.activethrusters.bkrgdn = true;
            }
            if (e.activethrusters.frleup) {
                e.power -= 0.05;
                e.playerobj.applyLocalForce(new CANNON.Vec3(0, 0, -glthis.thrusterBasicSpeed), new CANNON.Vec3(-0.5, 0.5, 0.5))
            }
            if (e.activethrusters.frledn) {
                e.power -= 0.05;
                e.playerobj.applyLocalForce(new CANNON.Vec3(0, 0, -glthis.thrusterBasicSpeed),new CANNON.Vec3(-0.5, -0.5, 0.5))
            }
            if (e.activethrusters.frrgup) {
                e.power -= 0.05;
                e.playerobj.applyLocalForce(new CANNON.Vec3(0, 0, -glthis.thrusterBasicSpeed),new CANNON.Vec3(0.5, 0.5, 0.5))
            }
            if (e.activethrusters.frrgdn) {
                e.power -= 0.05;
                e.playerobj.applyLocalForce(new CANNON.Vec3(0, 0, -glthis.thrusterBasicSpeed),new CANNON.Vec3(0.5, -0.5, 0.5))
            }
            if (e.activethrusters.bkleup) {
                e.power -= 0.05;
                e.playerobj.applyLocalForce(new CANNON.Vec3(0, 0, glthis.thrusterBasicSpeed),new CANNON.Vec3(-0.5, 0.5, -0.5))
            }
            if (e.activethrusters.bkledn) {
                e.power -= 0.05;
                e.playerobj.applyLocalForce(new CANNON.Vec3(0, 0, glthis.thrusterBasicSpeed), new CANNON.Vec3(-0.5, -0.5, -0.5))
            }
            if (e.activethrusters.bkrgup) {
                e.power -= 0.05;
                e.playerobj.applyLocalForce(new CANNON.Vec3(0, 0, glthis.thrusterBasicSpeed),new CANNON.Vec3(0.5, 0.5, -0.5))
            }
            if (e.activethrusters.bkrgdn) {
                e.power -= 0.05;
                e.playerobj.applyLocalForce(new CANNON.Vec3(0, 0, glthis.thrusterBasicSpeed),new CANNON.Vec3(0.5, -0.5, -0.5))
            }
        })
        
        this._world.step(this._computedDTFPS);



        this.networkLoop();
    }
    vec4(x, y, z, w) {
        return {
            _x: x,
            _y: y,
            _z: z,
            _w: w
        }
    }
    vec3(x, y, z) {
        return {
            _x: x,
            _y: y,
            _z: z
        }
    }
    vec2(x, y) {
        return {
            _x: x,
            _y: y
        }
    }
}

var game = new g4m3D(30);