function unixToLocal(unix, offset){
    let timesecs = (unix % 86400) + offset;
    if (timesecs < 0) {timesecs += 86400}
    const mins = Math.floor(timesecs / 60);
    let hours = (Math.floor(mins / 60)) % 12;
    let hourmins = mins % 60;
    if (hourmins < 10){hourmins = '0' + hourmins;}
    if (hours == 0){hours = 12;}

    return '' + hours + ':' + hourmins;
}

//location functions
function getLocation(){
    return new Promise( (resolve, reject) => {
        if (navigator.geolocation) 
        {
            navigator.geolocation.getCurrentPosition(
                (position) => saveLocation(position, resolve), 
                (error) => failLocation(error, reject)
            );
        }
        else 
        {reject("Geolocation not supported");}
    })
}

function failLocation(error, reject){
    console.log("Request failed");
    switch(error.code){
        case error.PERMISSION_DENIED:
            reject("location denied");
            break;
        default:
            reject("fail?");
            break;
    }
}

function saveLocation(position, resolve){
    console.log("Request through");
    resolve(position.coords);
}

async function getWeather(coords){
    const debug = false;
    const weatherurl = debug ? 'fake_forecast.json' : `https://api.openweathermap.org/data/2.5/weather?lat=${coords.latitude}&lon=${coords.longitude}&appid=d50daadd909d583c949fca136d5db47b&units=imperial`
    const qualityrurl = debug ? 'fake_quality.json' : `http://api.openweathermap.org/data/2.5/air_pollution?lat=${coords.latitude}&lon=${coords.longitude}&appid=d50daadd909d583c949fca136d5db47b`
   
    const weatherprom = fetch(weatherurl);
    const qualityprom = fetch(qualityrurl)

    const wdata = await weatherprom;
    const qdata = await qualityprom;
    const wjson = await wdata.json();
    const qjson = await qdata.json();
    
    return [wjson, qjson];
}

function displayWeather(data){
    const forecast = data[0];
    const quality = data[1];
    const timezone = parseInt(forecast.timezone);

    document.getElementById('time').innerHTML = unixToLocal(parseInt(forecast.dt), timezone);
    document.getElementById('currenttemp').innerHTML = Math.round(forecast.main.temp) + '°';
    document.getElementById('weather').innerHTML = forecast.weather[0].main;
    document.getElementById('templowhigh').innerHTML = 'L: ' + Math.round(forecast.main.temp_min) + ' H: ' + Math.round(forecast.main.temp_max);
    const windspd = Math.round(parseFloat(forecast.wind.speed) * 10) / 10;
    document.getElementById('windspeed').innerHTML = `<p>${windspd}</p>MPH`;

    setSunTime(forecast);

    let winddir;
    switch(Math.floor(parseFloat(forecast.wind.deg) / 45)){
        case 0:
            winddir = 'S';
        break;
        case 1:
            winddir = 'SW';
        break;
        case 2:
            winddir = 'W';
        break;
        case 3:
            winddir = 'NW';
        break;
        case 4:
            winddir = 'N';
        break;
        case 5:
            winddir = 'NE';
        break;
        case 6:
            winddir = 'E';
        break;
        case 7:
            winddir = 'SE';
        break;
    }
    document.getElementById('winddir').innerHTML = winddir;

    document.getElementById('airquality').innerHTML = quality.list[0].main.aqi;

    console.log(forecast.weather[0].id)

    return forecast;
}


function setSunTime(forecast){
    //get which half of the day
    const isday = isDay(forecast);

    if (!isday){
        document.getElementById('sunsettime').innerHTML = unixToLocal(parseInt(forecast.sys.sunrise), forecast.timezone);
        document.getElementById('sunsettitle').innerHTML = 'Sunrise';
    }
        else{document.getElementById('sunsettime').innerHTML = unixToLocal(parseInt(forecast.sys.sunset), forecast.timezone);
        document.getElementById('sunsettitle').innerHTML = 'Sunset';
    }
}

function isDay(forecast){
    return (forecast.dt < forecast.sys.sunset && forecast.dt > forecast.sys.sunrise);
}

function getWeatherStats(forecast){      
    let weatherstats = {
        isday : isDay(forecast)
    };

    const weathercode = String(forecast.weather[0].id)
    const codegroup = [weathercode.at(0), weathercode.at(1) * 10 + weathercode.at(2)];

    windspd = forecast.wind.speed;

    switch (codegroup[0]){
        case ('2'):
            //Thunderstorm
            weatherstats.clouds = 0.70;

            switch (codegroup[1]){
                case ('02'):
                case ('12'):
                case ('32'):
                    weatherstats.clouds += 0.15;
                    break;
            }

            switch (codegroup[1]){
                case ('00'):
                case ('30'):
                    weatherstats.rain = 0.25;
                    break;

                case ('01'):
                case ('31'):
                    weatherstats.rain = 0.75;
                    break;

                case ('02'):
                case ('32'):
                    weatherstats.rain = 1;
                    break;

                case ('10'):
                case ('11'):
                case ('12'):
                case ('21'):
                    weatherstats.rain = 0;
                    break;
            }

            break;
        case ('3'):
            //drizzle
            isdrizzle = true;
            weatherstats.clouds = 0.25;

            switch (codegroup[1]){
                case ('00'):
                case ('10'):
                    weatherstats.rain = 0.05;
                    break;

                case ('01'):
                case ('11'):
                case ('21'):
                case ('13'):
                    weatherstats.rain = 0.55;
                    break;

                case ('02'):
                case ('12'):
                case ('14'):
                    weatherstats.rain = 0.8;
                    break;
            }

            break;
        case ('5'):
            //Rain
            weatherstats.clouds = 0.55;

            switch (codegroup[1]){
                case ('00'):
                case ('20'):
                    weatherstats.rain = 0.25;
                    break;

                case ('01'):
                case ('21'):
                case ('31'):
                case ('11'):
                    weatherstats.rain = 0.75;
                    break;

                case ('02'):
                case ('22'):
                    weatherstats.rain = 1;
                    break;

                case ('03'):
                case ('04'):
                    weatherstats.rain = 1.2;
                    break;
            }

            break;
        case ('6'):
            //Snow
            weatherstats.clouds = 0.25;
            weatherstats.rain = 0;

            break;
        case ('7'):
            //Fog
            weatherstats.clouds = 0.40;
            weatherstats.rain = 0;

            break;
        case ('8'):
            // Clear/cloudy
            weatherstats.clouds = 0;
            weatherstats.rain = 0;

            switch (codegroup[1]){
                case ('01'):
                    weatherstats.clouds = 0.15;
                    break;

                case ('02'):
                    weatherstats.clouds = 0.25;
                    break;

                case ('03'):
                    weatherstats.clouds = 0.40;
                    break;

                case ('04'):
                    weatherstats.clouds = 0.55;
                    weatherstats.rain = 0.01;
                    break;
            }

            break;
        default:
            //Unknown
            weatherstats.clouds = 0.70;
            break;
    }

    // weatherstats.isday = true;
    // weatherstats.rain = 3;
    return weatherstats;
}

function changeVisual(weatherstats){
    if (weatherstats.isday)
    {
        document.documentElement.style.setProperty('--gradtopcol--', `rgb(43, 159, 255)`);
        document.documentElement.style.setProperty('--gradbotcol--', `rgb(148, 221, 255)`);
    } else{
        document.documentElement.style.setProperty('--gradtopcol--', `rgb(0, 0, 0)`);
        document.documentElement.style.setProperty('--gradbotcol--', `rgb(0, 1, 51)`);
    }

    if (weatherstats.clouds > 0) 
    {
        document.querySelector('body').style.background = 'white';
        document.querySelectorAll('.node h2').forEach((element) => element.style.color = 'rgb(130, 130, 130)');
    }

    if (!weatherstats.isday){weatherstats.clouds += 0.45;}

    document.getElementById('clouds').style.background = `linear-gradient(rgba(62, 62, 62, ${weatherstats.clouds}), rgba(22, 22, 22, ${weatherstats.clouds}))`;
    
    return weatherstats.rain;
}


//rain
function createRain(rain) {
    rainamount = rain * 200;
    rainspd = Math.max(rain * 60 + 10, 30)

    function createDrop(){
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            spd: rainspd + (Math.random() * 2) - 1,
            len: (rainspd / 2) + (Math.random() * 20) - 10
        }
    }

    for (i = 0; i < rainamount; i++){
        drops.push(createDrop());
    }

    drawRain();
}

function drawRain(){
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drops.forEach((drop) => {
        ctx.beginPath();

        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x + windspd * 0.75, drop.y + drop.len);

        ctx.strokeStyle = `rgba(233, 248, 255, 0.5)`;
        ctx.lineWidth = 2;

        ctx.stroke();

        drop.y += drop.spd;
        drop.x += windspd * 0.75;

        if (drop.y > canvas.height) {
            drop.y = 0;
            drop.x = (Math.random() * (canvas.width + 1000)) - 500;
        }
    })

    requestAnimationFrame(drawRain);
}



function loadStats(){
    getLocation()
    .then((loc) => getWeather(loc))
    .then((forecast) => displayWeather(forecast))
    .then((forecast) => getWeatherStats(forecast))
    .then((weatherstats) => changeVisual(weatherstats))
    .then((rain) => createRain(rain))
    .catch((errmsg) => document.getElementById('weather').innerHTML = errmsg);
}

//resizing
function resizeCanvas(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}


//main
let windspd;
let rainspd;
let rainamount;
const canvas = document.getElementById('rain');
const ctx = canvas.getContext('2d');
let drops = [];

window.addEventListener('resize', resizeCanvas);
resizeCanvas();
loadStats();