////////////////////// 自訂控制元件 //////////////////////////
/*      比例尺     */
L.control.scale({imperial:false}).addTo(lMap);

/*     定位按鈕     */
const getPsitionControl = L.control({ position: "bottomleft" }); 
getPsitionControl.onAdd = function (map) {
    const container = L.DomUtil.create("div", " leaflet-control leaflet-control-custom");
    container.innerHTML = '<img src="myPositionButton.jpg">';
    container.onclick = function () {
      // 在這裡處理按鈕點擊事件，例如進行地理定位等
      getLocation();
    };
    return container;
  };
getPsitionControl.addTo(lMap);

/*     說明按鈕、側邊欄     */
const InfoSidebar = L.control.sidebar('sidebar',{
  closeButton: true,
  position: "left" 
  }); 
lMap.addControl(InfoSidebar); 
setTimeout(function () {InfoSidebar.show();}, 500);
const InfoButton = L.control({ position: "bottomleft" }); 
InfoButton.onAdd = function (map) {
    const container = L.DomUtil.create("div", " leaflet-control leaflet-control-custom");
    container.innerHTML = '<img src="InfoButtonIcon.jpg">';
    container.onclick = function () {
      InfoSidebar.toggle();
    };
    return container;
  };
InfoButton.addTo(lMap);


/////////////////// geolocation //////////////////////

const getLocation = () => {
    if (navigator.geolocation)
    {navigator.geolocation.getCurrentPosition(showPosition);}
    else 
    {console.log("Geolocation is not supported by this browser.");}
};
const myLocationIcon = L.icon({iconUrl: 'myLocationIcon.png',})
const showPosition = (position) => {
    const lng = position.coords.longitude;
    const lat = position.coords.latitude;
    const marker = L.marker([lat, lng],{icon:myLocationIcon}).addTo(lMap);
    lMap.setView([lat, lng], 15); // 使用 setView() 設定地圖視圖為標記點的位置
};

////////////////////// Mapillary 街景 ////////////////////////////
const SVGeoJSONLayer = L.layerGroup();

async function loadSVData() {
  const response = await fetch("MapillaryStreetView.geojson");
  const data = await response.json();
  return data;
};

loadSVData().then((data) => {
  const markers = L.markerClusterGroup();
  data.features.forEach((feature) => {
    const coordinates = feature.geometry.coordinates;
    const marker = L.marker(new L.LatLng(coordinates[1], coordinates[0]),{icon:L.icon({iconUrl: 'MapillaryIcon.png'})})
    .on('click', function () {
      let content = `<h3>街景坐標：${feature.geometry.coordinates}</h3>`;
      if (window.innerWidth <= 768) {
        content += `<iframe 
              src="https://www.mapillary.com/embed?image_key=${feature.properties.id}&style=photo" 
              height="250"
              width="340"
              frameborder="0"></iframe>`;
      } else {
        content += `<iframe 
              src="https://www.mapillary.com/embed?image_key=${feature.properties.id}&style=photo" 
              height="480"
              width="640" 
              frameborder="0"></iframe>`;
      }
      marker.bindPopup(content,{maxWidth:640});
      marker.openPopup();
    })
    .addTo(markers);
});
SVGeoJSONLayer.addLayer(markers);
});
///////////////////// 台北市國小 /////////////////////////

let eleLayer;
async function loadeleData() {
  const response = await fetch("TP_ele_school.geojson");
  const data = await response.json();
  return data;
};
loadeleData().then((data) => {
eleLayer = L.geoJSON(data, {
  onEachFeature: function (feature, layer) {
    const avgRankA1 = parseFloat(feature.properties.avg_rankA1).toFixed(3); // 先轉換為數字，再四捨五入至小數點後三位
    if (!isNaN(avgRankA1) ){
      const content = `
        <h2>${feature.properties.school}</h2>
        <p style='font-size:16px'>周邊500公尺平均分數：${avgRankA1}</p>
        <p style='font-size:16px'>資料數：${feature.properties.data_count}</p>
        <a style='
            font-size:14px;
            display: flex; 
            justify-content: center; 
            color: gray; 
            text-decoration: none; 
            border: 1px solid #ACACAC;
            padding: 5px 10px;
            border-radius: 5px;
          '
        href="https://commutag.agawork.tw/dataset?id=63528cc34f042e88cc951433">
          我想提供資料
        </a>
      `
      layer.bindPopup(content);
    }else{layer.bindPopup(`
      <h2>${feature.properties.school}</h2>
      <p style='font-size:16px'>暫無資料</p>
      <a style='
          font-size:14px;
          display: flex; 
          justify-content: center; 
          color: gray; 
          text-decoration: none; 
          border: 1px solid #ACACAC;
          padding: 5px 10px;
          border-radius: 5px;
        '
        href="https://commutag.agawork.tw/dataset?id=63528cc34f042e88cc951433">
        我想提供資料
      </a>
      `);};
  },
  style: function (feature) {
    return {
      fillColor: 'white',  
      fillOpacity: 0.8,     
      color: 'gray', 
      weight: 1,            
    };}
});
eleLayer.addTo(lMap);
});

///////////////////// 小學周邊 500m 平均分數 //////////////////
/* 平均分數：No data */
const NoDataGeoJSONLayer = L.layerGroup();
async function loadavgData() {
      const response = await fetch("ele_school_avg_rank.geojson");
      const data = await response.json();
      return data;
};
loadavgData().then((data) => {
    const avgData = data.features.filter((avg) => avg.properties.avg_rankA1 == null ); 
    const NoDataBuffer = L.geoJSON(avgData, {
      style: function (feature) {
        return {
          fillColor: 'gray', 
          fillOpacity: 0.5,     
          color: 'transparent', 
          weight: 2,            
        };}
    });
    NoDataGeoJSONLayer.addLayer(NoDataBuffer).addTo(lMap);
});

/* 平均分數：極差（avg < 2） */
const avg1GeoJSONLayer = L.layerGroup();
async function loadavgData() {
      const response = await fetch("ele_school_avg_rank.geojson");
      const data = await response.json();
      return data;
};
loadavgData().then((data) => {
    const avgData = data.features.filter((avg) => avg.properties.avg_rankA1 < 2 && avg.properties.avg_rankA1 !== null ); 
    const avgLayer = L.geoJSON(avgData, {
      style: function (feature) {
        return {
          fillColor: 'red',  
          fillOpacity: 0.5,     
          color: 'transparent', 
          weight: 2,            
        };}
    });
    avg1GeoJSONLayer.addLayer(avgLayer).addTo(lMap);
});

/* 平均分數：差（2 <= avg < 5） */
const avg2GeoJSONLayer = L.layerGroup();
async function loadavgData() {
      const response = await fetch("ele_school_avg_rank.geojson");
      const data = await response.json();
      return data;
};
loadavgData().then((data) => {
    const avgData = data.features.filter((avg) => avg.properties.avg_rankA1 >= 2 &&avg.properties.avg_rankA1 < 5 && avg.properties.avg_rankA1 !== null ); 
    const avgLayer = L.geoJSON(avgData, {
      style: function (feature) {
        return {
          fillColor: 'orange', 
          fillOpacity: 0.5,     
          color: 'transparent', 
          weight: 2,            
        };}
    });
    avg2GeoJSONLayer.addLayer(avgLayer).addTo(lMap);
});

/* 平均分數：尚可（5 <= avg < 8） */
const avg3GeoJSONLayer = L.layerGroup();
async function loadavgData() {
      const response = await fetch("ele_school_avg_rank.geojson");
      const data = await response.json();
      return data;
};
loadavgData().then((data) => {
    const avgData = data.features.filter((avg) => avg.properties.avg_rankA1 >= 5 &&avg.properties.avg_rankA1 < 8 && avg.properties.avg_rankA1 !== null ); 
    const avgLayer = L.geoJSON(avgData, {
      style: function (feature) {
        return {
          fillColor: 'yellow', 
          fillOpacity: 0.5,     
          color: 'transparent', 
          weight: 2,            
        };}
    });
    avg3GeoJSONLayer.addLayer(avgLayer).addTo(lMap);
});

/* 平均分數：良好（avg >= 8） */
const avg4GeoJSONLayer = L.layerGroup();
async function loadavgData() {
      const response = await fetch("ele_school_avg_rank.geojson");
      const data = await response.json();
      return data;
};
loadavgData().then((data) => {
    const avgData = data.features.filter((avg) => avg.properties.avg_rankA1 >= 8 && avg.properties.avg_rankA1 !== null ); 
    const avgLayer = L.geoJSON(avgData, {
      style: function (feature) {
        return {
          fillColor: 'green', 
          fillOpacity: 0.5,     
          color: 'transparent', 
          weight: 2,            
        };}
    });
    avg4GeoJSONLayer.addLayer(avgLayer).addTo(lMap);
});



////////////////////// 平安走路許願帳戶資料點 ////////////////////////
/* rankA1 < 2 */
const Img1Sidebar = L.control.sidebar('Img1Sidebar',{
  closeButton: true,
  position: "left" 
  }); 
lMap.addControl(Img1Sidebar); 
lMap.on('click', function () {Img1Sidebar.hide();})
const walk1GeoJSONLayer = L.layerGroup();
async function loadwalkData() {
      const response = await fetch("./TPwalkdata.geojson");
      const data = await response.json();
      return data;
};
loadwalkData().then((data) => {
    const taipeiData = data.features.filter((walk) => walk.properties.rankA1 < 2);
    const walkLayer = L.geoJSON(taipeiData, {
      onEachFeature: function (feature, layer) {
        const coorX = parseFloat(feature.properties.lat).toFixed(5);
        const coorY = parseFloat(feature.properties.lng).toFixed(5);
        let content =`
          <p style='font-size:16px'>坐標：${coorX}, ${coorY}</p>
          <p style='font-size:16px'>時間：${feature.properties.dataTime}</p>
          <p style='font-size:16px'>評分：${feature.properties.rankA1}</p>
          <p style='font-size:16px'>備註：${feature.properties.remark}</p>
        `;
        if (window.innerWidth <= 768) {
          content += `
                    <h3>圖片編號：${feature.properties.imgName}</h3>
                    <img src="${feature.properties.imgUrl}" style="width:100%; display:block; margin:auto;"></img>
                    `;
          InfoSidebar.hide();Img2Sidebar.hide();Img3Sidebar.hide();Img4Sidebar.hide();Img1Sidebar.hide();
          layer.bindPopup(content,{ maxHeight: 200 });
        } else {
          layer.bindPopup(content,{ maxHeight: 250 });
          layer.on('click', function () {
            Img1Sidebar.setContent(`
              <h3>圖片編號：${feature.properties.imgName}</h3>
              <img src="${feature.properties.imgUrl}" style="width:100%; display:block; margin:auto;"></img>`);
              InfoSidebar.hide();Img1Sidebar.show();Img2Sidebar.hide();Img3Sidebar.hide();Img4Sidebar.hide();
          })
        } 
      },
      pointToLayer: function (feature, latlng) {
        return L.marker(
          latlng,{icon:L.icon({iconUrl: 'rankA1Icon_2.png',iconSize:[10, 10],})})
        },
    });
    walk1GeoJSONLayer.addLayer(walkLayer);
});


/* 2 <= rankA1 < 5 */
const Img2Sidebar = L.control.sidebar('Img2Sidebar',{
  closeButton: true,
  position: "left" 
  }); 
lMap.addControl(Img2Sidebar); 
lMap.on('click', function () {Img2Sidebar.hide();})
const walk2GeoJSONLayer = L.layerGroup();
async function loadwalkData() {
      const response = await fetch("TPwalkdata.geojson");
      const data = await response.json();
      return data;
};
loadwalkData().then((data) => {
    const taipeiData = data.features.filter((walk) => walk.properties.rankA1 >= 2 && walk.properties.rankA1 < 5);
    const walkLayer = L.geoJSON(taipeiData, {
      onEachFeature: function (feature, layer) {
        const coorX = parseFloat(feature.properties.lat).toFixed(5);
        const coorY = parseFloat(feature.properties.lng).toFixed(5);
        let content =`
          <p style='font-size:16px'>坐標：${coorX}, ${coorY}</p>
          <p style='font-size:16px'>時間：${feature.properties.dataTime}</p>
          <p style='font-size:16px'>評分：${feature.properties.rankA1}</p>
          <p style='font-size:16px'>備註：${feature.properties.remark}</p>
        `;
        if (window.innerWidth <= 768) {
          content += `
                    <h3>圖片編號：${feature.properties.imgName}</h3>
                    <img src="${feature.properties.imgUrl}" style="width:100%; display:block; margin:auto;"></img>
                    `;
          InfoSidebar.hide();Img2Sidebar.hide();Img3Sidebar.hide();Img4Sidebar.hide();Img1Sidebar.hide();
          layer.bindPopup(content,{ maxHeight: 200 });
        } else {
          layer.bindPopup(content,{ maxHeight: 250 });
          layer.on('click', function () {
            Img2Sidebar.setContent(`
              <h3>圖片編號：${feature.properties.imgName}</h3>
              <img src="${feature.properties.imgUrl}" style="width:100%; display:block; margin:auto;"></img>`);
              InfoSidebar.hide();Img1Sidebar.hide();Img2Sidebar.show();Img3Sidebar.hide();Img4Sidebar.hide();
          })
        } 
      },
      pointToLayer: function (feature, latlng) {
        return L.marker(latlng,{icon:L.icon({iconUrl: 'rankA1Icon_2-5.png',iconSize:[10, 10]})});
      },
    });
    walk2GeoJSONLayer.addLayer(walkLayer);
});

/* 5 <= rankA1 < 8 */

const Img3Sidebar = L.control.sidebar('Img3Sidebar',{
  closeButton: true,
  position: "left" 
  }); 
lMap.addControl(Img3Sidebar); 
lMap.on('click', function () {Img3Sidebar.hide();})
const walk3GeoJSONLayer = L.layerGroup();
async function loadwalkData() {
      const response = await fetch("TPwalkdata.geojson");
      const data = await response.json();
      return data;
};
loadwalkData().then((data) => {
    const taipeiData = data.features.filter((walk) => walk.properties.rankA1 >= 5 && walk.properties.rankA1 < 8);
    const walkLayer = L.geoJSON(taipeiData, {
      onEachFeature: function (feature, layer) {
        const coorX = parseFloat(feature.properties.lat).toFixed(5);
        const coorY = parseFloat(feature.properties.lng).toFixed(5);
        let content =`
          <p style='font-size:16px'>坐標：${coorX}, ${coorY}</p>
          <p style='font-size:16px'>時間：${feature.properties.dataTime}</p>
          <p style='font-size:16px'>評分：${feature.properties.rankA1}</p>
          <p style='font-size:16px'>備註：${feature.properties.remark}</p>
        `;
        if (window.innerWidth <= 768) {
          content += `
                    <h3>圖片編號：${feature.properties.imgName}</h3>
                    <img src="${feature.properties.imgUrl}" style="width:100%; display:block; margin:auto;"></img>
                    `;
          InfoSidebar.hide();Img2Sidebar.hide();Img3Sidebar.hide();Img4Sidebar.hide();Img1Sidebar.hide();
          layer.bindPopup(content,{ maxHeight: 200 });
        } else {
          layer.bindPopup(content,{ maxHeight: 250 });
          layer.on('click', function () {
            Img3Sidebar.setContent(`
              <h3>圖片編號：${feature.properties.imgName}</h3>
              <img src="${feature.properties.imgUrl}" style="width:100%; display:block; margin:auto;"></img>`);
              InfoSidebar.hide();Img1Sidebar.hide();Img2Sidebar.hide();Img3Sidebar.show();Img4Sidebar.hide();
          })
        } 
      },
      pointToLayer: function (feature, latlng) {
        return L.marker(latlng,{icon:L.icon({iconUrl: 'rankA1Icon_5-8.png',iconSize:[10, 10]})});
      },
    });

    walk3GeoJSONLayer.addLayer(walkLayer);
});

/* rankA1 >= 8 */

const Img4Sidebar = L.control.sidebar('Img4Sidebar',{
  closeButton: true,
  position: "left" 
  }); 
lMap.addControl(Img4Sidebar); 
lMap.on('click', function () {Img4Sidebar.hide();})
const walk4GeoJSONLayer = L.layerGroup();
async function loadwalkData() {
      const response = await fetch("TPwalkdata.geojson");
      const data = await response.json();
      return data;
};
loadwalkData().then((data) => {
    const taipeiData = data.features.filter((walk) => walk.properties.rankA1 >= 8);
    const walkLayer = L.geoJSON(taipeiData, {
      onEachFeature: function (feature, layer) {
        const coorX = parseFloat(feature.properties.lat).toFixed(5);
        const coorY = parseFloat(feature.properties.lng).toFixed(5);
        let content =`
          <p style='font-size:16px'>坐標：${coorX}, ${coorY}</p>
          <p style='font-size:16px'>時間：${feature.properties.dataTime}</p>
          <p style='font-size:16px'>評分：${feature.properties.rankA1}</p>
          <p style='font-size:16px'>備註：${feature.properties.remark}</p>
        `;
        if (window.innerWidth <= 768) {
          content += `
                    <h3>圖片編號：${feature.properties.imgName}</h3>
                    <img src="${feature.properties.imgUrl}" style="width:100%; display:block; margin:auto;"></img>
                    `;
          InfoSidebar.hide();Img2Sidebar.hide();Img3Sidebar.hide();Img4Sidebar.hide();Img1Sidebar.hide();
          layer.bindPopup(content,{ maxHeight: 200 });
        } else {
          layer.bindPopup(content,{ maxHeight: 250 });
          layer.on('click', function () {
            Img4Sidebar.setContent(`
              <h3>圖片編號：${feature.properties.imgName}</h3>
              <img src="${feature.properties.imgUrl}" style="width:100%; display:block; margin:auto;"></img>`);
              InfoSidebar.hide();Img1Sidebar.hide();Img2Sidebar.hide();Img3Sidebar.hide();Img4Sidebar.show();
          })
        } 
      },
      pointToLayer: function (feature, latlng) {
        return L.marker(latlng,{icon:L.icon({iconUrl: 'rankA1Icon_8.png',iconSize:[10, 10]})});
      },
    });

    walk4GeoJSONLayer.addLayer(walkLayer);
});

/////////////////////// WMTS 圖層 ////////////////////////
/* 預設底圖 */
L.tileLayer(
  "https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoicGVycnlsaWFvIiwiYSI6ImNrdGVkYWJueTJveWEycm84NzZrMXJyZjAifQ.s8EyAc5U3E1c7wcN1qlE9w",
  {
      maxZoom: 18,
      id: "mapbox.streets",
  }
).addTo(lMap);

const Mapbox = L.tileLayer(
  "https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoicGVycnlsaWFvIiwiYSI6ImNrdGVkYWJueTJveWEycm84NzZrMXJyZjAifQ.s8EyAc5U3E1c7wcN1qlE9w",
  {
      maxZoom: 18,
      id: "mapbox.streets",
  });
const MapboxLayer = L.layerGroup().addLayer(Mapbox);

/* 底圖：台灣通用電子地圖 */
const EMAP = L.tileLayer("https://wmts.nlsc.gov.tw/wmts/EMAP/default/GoogleMapsCompatible/{z}/{y}/{x}", {
    maxZoom: 18,
    id: "EMAP",
});
const EMAPWmtsLayer = L.layerGroup().addLayer(EMAP);

/* 底圖：正射影像圖（通用） */
const PHOTO2 = L.tileLayer("https://wmts.nlsc.gov.tw/wmts/PHOTO2/default/GoogleMapsCompatible/{z}/{y}/{x}", {
    maxZoom: 18,
    id: "PHOTO2",
});
const PHOTO2WmtsLayer = L.layerGroup().addLayer(PHOTO2);

/* 各級學校範圍圖 */
const SCHOOL = L.tileLayer("https://wmts.nlsc.gov.tw/wmts/SCHOOL/default/GoogleMapsCompatible/{z}/{y}/{x}", {
    maxZoom: 18,
    id: "SCHOOL",
});
const SCHOOLWmtsLayer = L.layerGroup().addLayer(SCHOOL);

////////////////////// 圖層控制 ///////////////////////////
const baseLayers = {
  "<span style='font-size:16px'>臺灣通用電子地圖</span>": EMAPWmtsLayer,
  "<span style='font-size:16px'>正射影像圖（通用）</span>": PHOTO2WmtsLayer,
  "<span style='font-size:16px'>Mapbox Dark</span>":MapboxLayer
};

const Groupedoverlays = {
  "<span style='font-size:16px;font-weight:bold'>人行環境評分</span>":{
      "<img style='width:10px' src='rankA1Icon_2.png'><span style='font-size:16px'> 極差（低於2分）</span>":walk1GeoJSONLayer,
      "<img style='width:10px' src='rankA1Icon_2-5.png'><span style='font-size:16px'> 差（2至5分）</span>":walk2GeoJSONLayer,
      "<img style='width:10px' src='rankA1Icon_5-8.png'><span style='font-size:16px'> 尚可（5至8分）</span>":walk3GeoJSONLayer,
      "<img style='width:10px' src='rankA1Icon_8.png'><span style='font-size:16px'> 良好（高於8分）</span>":walk4GeoJSONLayer,
  },
  "<hr color='#F0F0F0'><span style='font-size:16px;font-weight:bold'>國小周邊500公尺平均分數</span>":{
      "<img style='width:10px' src='rankA1Icon_2.png'><span style='font-size:16px'> 極差（低於2分）</span>":avg1GeoJSONLayer,
      "<img style='width:10px' src='rankA1Icon_2-5.png'><span style='font-size:16px'> 差（2至5分）</span>":avg2GeoJSONLayer,
      "<img style='width:10px' src='rankA1Icon_5-8.png'><span style='font-size:16px'> 尚可（5至8分）</span>":avg3GeoJSONLayer,
      "<img style='width:10px' src='rankA1Icon_8.png'><span style='font-size:16px'> 良好（高於8分）</span>":avg4GeoJSONLayer,
      "<img style='width:10px' src='rankA1Icon_NoData.png'><span style='font-size:16px'> 暫無資料</span>":NoDataGeoJSONLayer
  },
  "<hr color='#F0F0F0'><span></span>":{
    "<img style='width:20px' src='MapillaryIcon.png'><span style='font-size:16px;font-weight:bold'> Mapillary 街景</span>":SVGeoJSONLayer,
  },
  "<hr color='#F0F0F0'>":{
    "<strong style='font-size:16px'>各級學校範圍圖</strong><div style='padding-left:25px;font-size:16px'><img src='elementary_school.png'> 小學<br><img src='junior_high_school.png'> 國中<br><img src='senior_high_school.png'> 高中職<br><img src='university.png'> 大專院校<br><img src='special_school.png'> 特殊學校</div>"
    :SCHOOLWmtsLayer,
  },
};
const layerControl = L.control.groupedLayers(baseLayers, Groupedoverlays).addTo(lMap);
// 監聽圖層控制的"overlayadd"事件
lMap.on('overlayadd', function(event) {
  if (event.layer === avg1GeoJSONLayer || 
      event.layer === avg2GeoJSONLayer ||
      event.layer === avg3GeoJSONLayer ||
      event.layer === avg4GeoJSONLayer ||
      event.layer === NoDataGeoJSONLayer)
  {eleLayer.bringToFront();}
});
///////////////////// attribution ////////////////////////

L.control.attribution({
  prefix: `
          © <a href="https://www.mapbox.com/feedback/">Mapbox</a>
          © <a href="http://www.openstreetmap.org/copyright">OSM</a>
          © <a href="https://commutag.agawork.tw/dataset?id=63528cc34f042e88cc951433">平安走路許願帳戶</a>
          © <a href="https://maps.nlsc.gov.tw/">NLSC</a>
          © <a href="https://www.mapillary.com/">Mapillary</a>
          `
}).addTo(lMap);
