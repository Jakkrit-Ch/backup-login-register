/************PROCESS DATA TO/FROM Client****************************/

	
var socket = io(); //load socket.io-client and connect to the host that serves the page
window.addEventListener('load', function() {
                document.addEventListener("mouseup", ReportMouseUp, false);
                document.addEventListener("mousedown", ReportMouseDown, false);
		document.addEventListener("touchmove", TouchMove, false);
            });

            // Send GPIO button toggle to server
            socket.on('GPIO6', function (data) {
                const myJSON = JSON.stringify(data);
                document.getElementById('GPIO6').checked = data;
            });

            socket.on('GPIO13', function (data) {
                const myJSON = JSON.stringify(data);
                document.getElementById('GPIO13').checked = data;
            });

            socket.on('GPIO22', function (data) {
                const myJSON = JSON.stringify(data);
                document.getElementById('GPIO22').checked = data;
            });

            socket.on('GPIO27', function (data) {
                const myJSON = JSON.stringify(data);
                document.getElementById('GPIO27').checked = data;
            });

            // When toggle button is clicked
            function ReportMouseDown(e) {
                var y = e.target.previousElementSibling;
                if (y !== null) var x = y.id;
                if (x !== null) {
                    // Now we know that x is defined, we are good to go.
                    if (x === "GPIO6") {
                        socket.emit("GPIO6T");  // send GPIO button toggle to node.js server
                    }
                    else if (x === "GPIO13") {
                        socket.emit("GPIO13T");  // send GPIO button toggle to node.js server
                    }
                    else if (x === "GPIO22") {
                        socket.emit("GPIO22T");  // send GPIO button toggle to node.js server
                    }
                    else if (x === "GPIO27") {
                        socket.emit("GPIO27T");  // send GPIO button toggle to node.js server
                    }
                }

                if (e.target.id === "GPIO6M") {
                    socket.emit("GPIO6", 1);
                    document.getElementById('GPIO6').checked = 1;
                }
                else if (e.target.id === "GPIO13M") {
                    socket.emit("GPIO13", 1);
                    document.getElementById('GPIO13').checked = 1;
                }
                else if (e.target.id === "GPIO22M") {
                    socket.emit("GPIO22", 1);
                    document.getElementById('GPIO22').checked = 1;
                }
                else if (e.target.id === "GPIO27M") {
                    socket.emit("GPIO27", 1);
                }
            }

            function ReportMouseUp(e) {
                if (e.target.id === "GPIO6M") {
                    socket.emit("GPIO6", 0);
                    document.getElementById('GPIO6').checked = 0;
                } else if (e.target.id === "GPIO13M") {
                    socket.emit("GPIO13", 0);
                    document.getElementById('GPIO13').checked = 0;
                } else if (e.target.id === "GPIO22M") {
                    socket.emit("GPIO22", 0);
                    document.getElementById('GPIO22').checked = 0;
                } else if (e.target.id === "GPIO27M") {
                    socket.emit("GPIO27", 0);
                    document.getElementById('GPIO27').checked = 0;
                }
            }
function TouchMove(e) {

}