var webSocket;
var isConnected = false;
var isError = false;
var messageTimeout;
var connectionTimeout;
var connectionTimeoutDuration = 3000; // 3 seconds
var datasetsMap = {}; // Object to store dataset values dynamically
  
// Get the canvas context for the chart
const ctxc = document.getElementById('myChart');
const config = {
    type: 'line',
    data: {
        datasets: [] // Initialize with an empty array of datasets
    },
    options: {
        scales: {
            x: {
                type: 'realtime',
                realtime: {
                    frameRate: 60,
                    refresh: 10,
                    duration: 5000,
                    onRefresh: chart => {
                        const now = Date.now();
                        for (let key in datasetsMap) {
                            chart.data.datasets.forEach(dataset => {
                                if (dataset.label === key) {
                                    dataset.data.push({
                                        x: now,
                                        y: datasetsMap[key]
                                    });
                                }
                            });
                        }
                    }
                },
                display: false
            }
        },
        plugins: {
            zoom: {
                pan: {
                    enabled: true,
                    mode: 'x'
                },
                zoom: {
                    pinch: {
                        enabled: true
                    },
                    wheel: {
                        enabled: true
                    },
                    mode: 'x'
                },
                limits: {
                    x: {
                        minDelay: 0,
                        maxDelay: 50,
                        minDuration: 1000,
                        maxDuration: 20000
                    }
                }
            }
        }
    }
};

// Create the chart with the specified configuration
const chart = new Chart(ctxc, config);

// Function to toggle WebSocket connection on and off
function toggleWebSocket() {
    var ip = document.getElementById("ipAddress").value;
    if (isConnected) {
        // Close the WebSocket connection
        isError = false;
        webSocket.close();
    } else {
        // Open the WebSocket connection
        startWebSocket(ip);
    }
}

// Function to start the WebSocket connection
function startWebSocket(ip) {
    webSocket = new WebSocket(`ws://${ip}:81`);

    // Set a timeout to handle connection timeout
    connectionTimeout = setTimeout(function() {
        if (webSocket.readyState !== WebSocket.OPEN) {
            console.log("WebSocket connection timeout.");
            isConnected = false;
            updateStatus(true);
            webSocket.close();
        }
    }, connectionTimeoutDuration);

    // Handle incoming messages from the WebSocket server
    webSocket.onmessage = function(event) {
        var data = JSON.parse(event.data);
        // Create new dataset for each keys in 'data' JSON
        Object.keys(data).forEach(key => {
            if (!datasetsMap.hasOwnProperty(key)) {
                datasetsMap[key] = data[key];
                const color = getRandomColor();
                const newDataset = {
                    label: key,
                    backgroundColor: color,
                    borderColor: color,
                    cubicInterpolationMode: 'monotone',
                    pointRadius: 0,
                    pointStyle: 'circle',
                    data: []
                };
                config.data.datasets.push(newDataset);
                chart.update();
            } else {
                datasetsMap[key] = data[key];
            }
        });

        resetMessageTimeout();
    };

    // Handle WebSocket connection open event
    webSocket.onopen = function() {
        console.log("WebSocket connection opened.");
        isConnected = true;
        clearTimeout(connectionTimeout); // Clear the connection timeout
        updateStatus();
        resetMessageTimeout(); // Start the timeout when the connection is opened
    };

    // Handle WebSocket connection close event
    webSocket.onclose = function() {
        console.log("WebSocket connection closed.");
        isConnected = false;
        updateStatus();
        clearTimeout(messageTimeout); // Clear the timeout when the connection is closed
        clearTimeout(connectionTimeout); // Clear the connection timeout
    };

    // Handle WebSocket connection error event
    webSocket.onerror = function() {
        console.log("WebSocket connection error.");
        isConnected = false;
        isError = true;
        updateStatus();
        clearTimeout(messageTimeout); // Clear the timeout when there is an error
        clearTimeout(connectionTimeout); // Clear the connection timeout
    };
}

// Function to reset the message timeout
function resetMessageTimeout() {
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

// Function to update the connection status on the UI
function updateStatus() {
    var statusElement = document.getElementById("status");
    var buttonElement = document.getElementById("toggleButton");
    if (isConnected) {
        statusElement.innerText = "Connected";
        buttonElement.innerText = "Disconnect";
    } else {
        // clear the chart
        config.data.datasets = [];
        datasetsMap = {};
        if (isError == true) {
            statusElement.innerText = "Connection Failed";
            buttonElement.innerText = "Retry";
        } else {
            statusElement.innerText = "Disconnected";
            buttonElement.innerText = "Connect";
            isError = false;
        }
    }
}

// Function to generate a random color for datasets
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Add event listener to the toggle button
document.getElementById("toggleButton").addEventListener("click", toggleWebSocket);
