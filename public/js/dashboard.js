const btnOn_Fan = document.getElementById("btnOn_Fan");
const btnOff_Fan = document.getElementById("btnOff_Fan");
const fanSymbol = document.getElementById("fanSymbol");

const btnOn_Water = document.getElementById("btnOn_Water");
const btnOff_Water = document.getElementById("btnOff_Water");
const waterSymbol = document.getElementById("waterSymbol");

const btnOn_Bulb = document.getElementById("btnOn_Bulb");
const btnOff_Bulb = document.getElementById("btnOff_Bulb");
const bulbSymbol = document.getElementById("bulbSymbol");

const canvas = document.querySelector("#canvas");
const chart = new Chart(canvas, {
  type: "line",
  data: {
    labels: [], // Trục thời gian sẽ được cập nhật
    datasets: [
      {
        label: "Temperature",
        backgroundColor: "red",
        borderColor: "red",
        data: [],
        yAxisID: "temperature-y-axis",
        tension: 0.4,
      },
      {
        label: "Humidity",
        backgroundColor: "blue",
        borderColor: "blue",
        data: [],
        yAxisID: "humidity-y-axis",
        tension: 0.4,
      },
      {
        label: "Light",
        backgroundColor: "green",
        borderColor: "green",
        data: [],
        yAxisID: "light-y-axis",
        tension: 0.4,
      },
    ],
  },
  options: {
    animation: {
      duration: 1000, // Smooth transition duration
      easing: 'easeInOutQuad', // Easing function for smoothness
    },
    scales: {
      "temperature-y-axis": {
        position: "left",
        title: {
          color: "red",
          display: true,
          text: "Temperature (\u2103)",
          font: { size: 16 },
        },
      },
      "humidity-y-axis": {
        position: "left",
        title: {
          color: "blue",
          display: true,
          text: "Humidity (%)",
          font: { size: 16 },
        },
      },
      "light-y-axis": {
        position: "right",
        title: {
          color: "green",
          display: true,
          text: "Light",
          font: { size: 16 },
        },
      },
    },
  },
});

const mqttClient = mqtt.connect("mqtt://192.168.1.101", {
  username: "sonnt",
  password: "sonnt",
  port: 9001,
});

mqttClient.on("connect", () => {
  mqttClient.subscribe("sensor/downstream", (err) => {
    if (!err) {
      console.log("Ok")
    }else{
      console.log(err)
    }
  });

  mqttClient.subscribe("temp/status", (err) => {
    if (!err) {
      console.log("Ok")
    }else{
      console.log(err)
    }
  });

  mqttClient.subscribe("humid/status", (err) => {
    if (!err) {
      console.log("Ok")
    }else{
      console.log(err)
    }
  });

  mqttClient.subscribe("light/status", (err) => {
    if (!err) {
      console.log("Ok")
    }else{
      console.log(err)
    }
  });
});

mqttClient.on("message", (topic, message) => {
// message is Buffer
  if (topic == 'sensor/downstream'){
    var obj = JSON.parse(message);
    document.querySelector('.temp .desc').textContent = `${obj.temperature}°C`;
    document.querySelector('.temp .desc').style.color = 'white';
    document.querySelector('.temp').style.backgroundColor = getTemperatureColor(obj.temperature);
    document.querySelector('.humidity .desc').textContent = `${obj.humidity}%`;
    document.querySelector('.humidity .desc').style.color = 'white';
    $('.humidity').css('background-color', getHumidityColor(obj.humidity));
    document.querySelector('.light .desc').textContent = `${obj.light}`;
    document.querySelector('.light .desc').style.color = 'white';
    $('.light').css('background-color', getLumenColor(obj.light));
    pushData(obj.time, obj);
  }else if (topic=='temp/status'){
    if (message=='on'){
      fanSymbol.classList.add("rotateFan");
    }else{
      fanSymbol.classList.remove("rotateFan");
    }
  }else if (topic=='humid/status'){
    if (message=='on'){
      waterSymbol.classList.add("changeColor_water");
    }else{
      waterSymbol.classList.remove("changeColor_water");
    }
  }else if (topic=='light/status'){
    if (message=='on'){
      bulbSymbol.classList.add("changeColor_light");
    }else{
      bulbSymbol.classList.remove("changeColor_light");
    }
  }
});

 // Function to push new data and remove old data
 function pushData(newLabel, {temperature, humidity, light}) {
  const maxPoints = 7;
  console.log( {temperature, humidity, light})
  // Add new data and label
  chart.data.labels.push(newLabel);
  chart.data.datasets[0].data.push(temperature);
  chart.data.datasets[1].data.push(humidity);
  chart.data.datasets[2].data.push(light);

  // Remove oldest data if length exceeds maxPoints
  if (chart.data.labels.length > maxPoints) {
      chart.data.labels.shift(); // Remove first (oldest) label
      chart.data.datasets[0].data.shift(); // Remove first (oldest) data point
      chart.data.datasets[1].data.shift(); // Remove first (oldest) data point
      chart.data.datasets[2].data.shift(); // Remove first (oldest) data point
  }

  // Smoothly update the chart with the new data
  chart.update('none'); // Use 'none' mode to avoid reset of animations
}


function updateChartData() {
  fetch("http://localhost:3000/api")
    .then(response => response.json())
    .then(data => {
      // Chọn 7 bản ghi mới nhất
      // const latestData = data.slice(0, 7);
      const latestData = data.slice(0, 7).reverse();

      // Tạo các mảng riêng cho labels và datasets
      const labels = latestData.map(entry => {
        // Lấy chỉ phần thời gian (giờ:phút:giây)
        const time = new Date(entry.time);
        // return time.toLocaleTimeString(); // Chuyển thành dạng "HH:MM:SS"
        // Chuyển đổi thời gian thành định dạng YYYY-MM-DD HH:mm:ss
        const formattedTime = 
          time.getFullYear() + '-' + 
          String(time.getMonth() + 1).padStart(2, '0') + '-' + 
          String(time.getDate()).padStart(2, '0') + ' ' + 
          String(time.getHours()).padStart(2, '0') + ':' + 
          String(time.getMinutes()).padStart(2, '0') + ':' + 
          String(time.getSeconds()).padStart(2, '0');

        return formattedTime; 
      });

      const temperatures = latestData.map(entry => entry.temperature);
      const humidities = latestData.map(entry => entry.humidity);
      const lights = latestData.map(entry => entry.light);

      // Cập nhật dữ liệu cho biểu đồ
      chart.data.labels = labels;
      chart.data.datasets[0].data = temperatures;
      chart.data.datasets[1].data = humidities;
      chart.data.datasets[2].data = lights;
      // Cập nhật lại biểu đồ
      chart.update();
    })
    .catch(error => console.error("Error fetching data:", error));
}

// Gọi hàm để lấy dữ liệu lần đầu
updateChartData();

// add event for button
// Fan Icon

// btnOff_Fan.style.background = "rgb(224, 55, 55)";  
// btnOn_Fan.style.background = "";  
// Khôi phục trạng thái từ localStorage khi tải trang
document.addEventListener("DOMContentLoaded", function() {
  const fanState = localStorage.getItem('fanState');  // Lấy trạng thái quạt từ localStorage

  if (fanState === "on") {
      fanSymbol.classList.add("rotateFan");
      btnOn_Fan.style.background = "linear-gradient(100deg, #08dce3, #26d9d9, #6bf3ee, #88eef0)";
      btnOff_Fan.style.background = "";
  } else {
      fanSymbol.classList.remove("rotateFan");
      btnOff_Fan.style.background = "rgb(224, 55, 55)";
      btnOn_Fan.style.background = "";
  }

  const waterState = localStorage.getItem('waterState');
  if (waterState === "on") {
      waterSymbol.classList.add("changeColor_water");
      btnOn_Water.style.background = "linear-gradient(100deg, #08dce3, #26d9d9, #6bf3ee, #88eef0)";
      btnOff_Water.style.background = "";
  } else {
      waterSymbol.classList.remove("changeColor_water");
      btnOff_Water.style.background = "rgb(224, 55, 55)";
      btnOn_Water.style.background = "";
  }

  const bulbState = localStorage.getItem('bulbState');
    if (bulbState === "on") {
        bulbSymbol.classList.add("changeColor_light");
        btnOn_Bulb.style.background = "linear-gradient(100deg, #08dce3, #26d9d9, #6bf3ee, #88eef0)";
        btnOff_Bulb.style.background = "";
    } else {
        bulbSymbol.classList.remove("changeColor_light");
        btnOff_Bulb.style.background = "rgb(224, 55, 55)";
        btnOn_Bulb.style.background = "";
    }
});

btnOn_Fan.addEventListener("click", function () {
  btnOn_Fan.style.background = "linear-gradient(100deg, #08dce3, #26d9d9, #6bf3ee, #88eef0)";
  btnOff_Fan.style.background = "";
  localStorage.setItem('fanState', 'on');  // Lưu trạng thái quạt vào localStorage
  mqttClient.publish("temp/upstream", "on");
});

btnOff_Fan.addEventListener("click", function () {
  btnOff_Fan.style.background = "rgb(224, 55, 55)";
  btnOn_Fan.style.background = "";
  localStorage.setItem('fanState', 'off');  // Lưu trạng thái quạt vào localStorage
  mqttClient.publish("temp/upstream", "off");
});

// Water Icon
// btnOff_Water.style.background = "rgb(224, 55, 55)";  
// btnOn_Water.style.background = "";  
btnOn_Water.addEventListener("click", function () {
  btnOn_Water.style.background = "linear-gradient(100deg, #08dce3, #26d9d9, #6bf3ee, #88eef0)";
  btnOff_Water.style.background = "";
  localStorage.setItem('waterState', 'on');
  mqttClient.publish("humid/upstream", "on"); 
});

btnOff_Water.addEventListener("click", function () {
  btnOn_Water.style.background = "";
  btnOff_Water.style.background = "rgb(224, 55, 55)";
  localStorage.setItem('waterState', 'off');
  mqttClient.publish("humid/upstream", "off");
});

// light bulb icon

// btnOff_Bulb.style.background = "rgb(224, 55, 55)";  
// btnOn_Bulb.style.background = "";  
btnOn_Bulb.addEventListener("click", function () {
  btnOn_Bulb.style.background = "linear-gradient(100deg, #08dce3, #26d9d9, #6bf3ee, #88eef0)";
  btnOff_Bulb.style.background = "";
  localStorage.setItem('bulbState', 'on');
  mqttClient.publish("light/upstream", "on");
});

btnOff_Bulb.addEventListener("click", function () {
  btnOn_Bulb.style.background = "";
  btnOff_Bulb.style.background = "rgb(224, 55, 55)";
  localStorage.setItem('bulbState', 'off');
  mqttClient.publish("light/upstream", "off");
});

function getTemperatureColor(temperature) {
  if (temperature < 0) temperature = 0;
  if (temperature > 100) temperature = 100;

  // Calculate the red and blue components based on the temperature
  const red = Math.round((temperature / 100) * 255 * 0.5);   // More red as temperature increases
  const blue = Math.round((1 - temperature / 100) * 255 * 0.5); // Less blue as temperature increases

  // Return the rgb color string
  return `rgb(${red}, 100, ${blue})`;
}

function getLumenColor(lumen) {
  if (lumen < 0) lumen = 0;
  if (lumen > 1024) lumen = 1024;

  // Calculate the reversed grayscale value based on lumen
  const pinkValue = Math.round((lumen / 1024) * 255); // Invert the mapping

  // Return the rgb color string (same value for R, G, B to make it grayscale)
  return `rgb(${pinkValue}, 100, ${pinkValue})`;
}

function getHumidityColor(humidity) {
  if (humidity < 0) humidity = 0;
  if (humidity > 100) humidity = 100;

  // Calculate the green and blue components based on the humidity
  const green = Math.round((humidity / 100) * 255);   // More green as humidity increases
  const blue = Math.round((1 - humidity / 100) * 255); // Less blue as humidity increases

  // Return the rgb color string
  return `rgb(0, ${green}, ${blue})`;
}