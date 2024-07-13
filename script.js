var webSocket;
var isConnected = false;
var isError = false;
var messageTimeout;
var connectionTimeout;
var connectionTimeoutDuration = 3000; // 5 seconds

var c = 0;
var E1 = 0;
var E2 = 0;
var initValueE1 = 0;
var initValueE2 = 0;
var count = 0;

var ax = 0;
var ay = 0;
var az = 0;
  
const ctxc = document.getElementById('myChart');
const config = {
    type: 'line',
    data: {
        datasets: [
            {
                label: 'X',
                backgroundColor: 'rgba(0, 255, 132, 0.5)',
                borderColor: 'rgb(0, 255, 0)',
                cubicInterpolationMode: 'monotone',
                pointRadius: 0,
                pointStyle: 'circle',

            },
            {
                label: 'Y',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                borderColor: 'rgb(255, 0, 0)',
                cubicInterpolationMode: 'monotone',
                pointRadius: 0,
                pointStyle: 'circle',

            },
            {
                label: 'Z',
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgb(0, 0, 255)',
                cubicInterpolationMode: 'monotone',
                pointRadius: 0,
                pointStyle: 'circle',
                data: []
            }
        ]
    },
    options: {
        scales: {
            x: {
                type: 'realtime',
                realtime: {
                    frameRate: 60,
                    refresh: 10,
                    // delay:500,
                    duration:5000,
                    onRefresh: chart => {
                        const now = Date.now();
                        chart.data.datasets[0].data.push({
                            x: now,
                            y: ax
                        }),
                        chart.data.datasets[1].data.push({
                            x: now,
                            y: ay
                        }),
                        chart.data.datasets[2].data.push({
                            x: now,
                            y: az
                        })
                        
                    }
                },
                display:false
            }
        },
        plugins:{
            zoom:{
                pan:{
                    enabled:true,
                    mode: 'x'
                },
                zoom:{
                    pinch:{
                        enabled:true
                    },
                    wheel:{
                        enabled:true
                    },
                    mode:'x'
                },
                limits:{
                    x:{
                        minDelay: 0,
                        maxDelay: 4000,
                        minDuration: 1000,
                        maxDuration: 20000
                    }
                }
            }
        }
    }
    
};
const chart = new Chart(ctxc,config 

);
Chart.defaults.set('plugins.streaming', {
    duration: 20000
});

function toggleWebSocket() {
    var ip = document.getElementById("ipAddress").value;
    if (isConnected) {
        // Close the WebSocket connection
        isError = false;
        webSocket.close();
        count = 0;
        
    } else {
        // Open the WebSocket connection
        startWebSocket(ip);
    }
}

function startWebSocket(ip) {
    // Connect to the WebSocket server
    webSocket = new WebSocket(`ws://${ip}:81`);

    connectionTimeout = setTimeout(function() {
        if (webSocket.readyState !== WebSocket.OPEN) {
            console.log("WebSocket connection timeout.");
            isConnected = false;
            updateStatus(true);
            webSocket.close();
        }
    }, connectionTimeoutDuration);

    // Handle incoming messages
    webSocket.onmessage = function(event) {
        c++;
        var data = JSON.parse(event.data);
        // document.getElementById("Encoder1").innerText = data.Encoder1;
        // document.getElementById("Encoder2").innerText = data.Encoder2;
        // document.getElementById("curE1").innerText = E1;
        // document.getElementById("curE2").innerText = E2;

        if (data.ax !== undefined && data.ay !== undefined && data.az !== undefined) {
            ax = data.ax;
            ay  = data.ay;
            az = data.az;
        }

        resetMessageTimeout();

    };

    // Handle connection open event
    webSocket.onopen = function() {
        console.log("WebSocket connection opened.");
        isConnected = true;
        clearTimeout(connectionTimeout); // Clear the connection timeout
        updateStatus();
        resetMessageTimeout(); // Start the timeout when the connection is opened
    };

    // Handle connection close event
    webSocket.onclose = function() {
        console.log("WebSocket connection closed.");
        isConnected = false;
        updateStatus();
        clearTimeout(messageTimeout); // Clear the timeout when the connection is closed
        clearTimeout(connectionTimeout); // Clear the connection timeout
    };

    // Handle connection error event
    webSocket.onerror = function() {
        console.log("WebSocket connection error.");
        isConnected = false;
        isError = true;
        updateStatus();
        clearTimeout(messageTimeout); // Clear the timeout when there is an error
        clearTimeout(connectionTimeout); // Clear the connection timeout
    };
}

function resetMessageTimeout() {
    // Clear any existing timeout
    clearTimeout(messageTimeout);
    // Set a new timeout to trigger if no message is received within 5 seconds
    messageTimeout = setTimeout(function() {
        console.log("No message received in 5 seconds. Connection failed.");
        isError = true;
        isConnected = false;
        updateStatus(true);
        webSocket.close();
    }, 5000); // 5 seconds
}

function updateStatus() {
    var statusElement = document.getElementById("status");
    var buttonElement = document.getElementById("toggleButton");
    if (isConnected) {
        statusElement.innerText = "Connected";
        buttonElement.innerText = "Disconnect";
        
    } else {
        if(isError == true){
            statusElement.innerText = "Connection Failed";
            buttonElement.innerText = "Retry";
            
        }
        else{
            statusElement.innerText = "Disconnected";
            buttonElement.innerText = "Connect";
            isError = false;
            
        }
        
    }
}

document.getElementById("toggleButton").addEventListener("click", toggleWebSocket);