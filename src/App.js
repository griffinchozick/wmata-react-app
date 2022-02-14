import logo from './logo.svg';

import './App.css';
import react from 'react';
import $ from 'jquery';
import { tab } from '@testing-library/user-event/dist/tab';

const wmataKey = "7e869058fcb5439a95e6e55e92a3f99b"

function LineIcon(props) {
  return (
    <button className={props.colorId + ' ' + 'line-icon'} onClick={props.onClick}>
      {props.value}
    </button>
  );
}

class Navigation extends react.Component {
  /*constructor(props) {
    super(props)
  }*/

  renderIcon(lineKey){
    console.log(lineKey)
    const id = lineKey.toLowerCase()
    return (
      <LineIcon key={lineKey}
        value={this.props.lines[lineKey].code}
        onClick={() => this.props.onClick(lineKey)}
        colorId={id}
      />
    );
  }

  render(){
    let iconList = [];
    Object.keys(this.props.lines).forEach(key => {
      iconList.push(this.renderIcon(key))
    })
    return(
      <div className='navigation'>
        {iconList}
      </div>

    );
  }
}

function TrainTableRow(props) {
  return (
    <tr className='train-row'>
      <td>
        {props.name}
      </td>
      <td>
        {props.prediction}
      </td>
    </tr>
  );
}

class TrainTable extends react.Component {
  /*constructor(props){
    super(props)
  }*/

  renderRow(_name, _prediction){
    return (
      <TrainTableRow
        name={_name}
        prediction={_prediction}
      />
    );
  }

  render(){
    let rowList = []
    const stationList = this.props.value
    const stationHeading = this.props.canRender ? "Station" : ""
    const arrivalHeading = this.props.canRender ? "Arrival(Minutes)" : ""
    for(const station of stationList) {
      rowList.push(this.renderRow(station["name"], station["prediction"]))
    }
    return (
      <div>

        <table className='train-table'>
          <thead>
            <th>{stationHeading}</th>
            <th>{arrivalHeading}</th>
          </thead>
          <tbody>
            {rowList}
          </tbody>
          
        </table>
      </div>
    );
  }

}

class Display extends react.Component {
  constructor(props){
    super(props)
    this.state = {
      lines: {
        //Switch letters are based on the order of the letters in the station code for a given wmata line
        //e.g. if a line had stations C02 -> C03 -> P20 -> J43 -> J42 -> J41 the switch letters would 
        //be [C,P, -J], the minus sign indicates the codes increment down
        "Red": {
          code: "RD",
          switchLetters: ["A", "B"] 
        }, 
        "Orange": {
          code: "OR",
          switchLetters: ["K", "C", "D"]
        }, 
        "Silver": {
          code: "SV",
          switchLetters: []
        }, 
        "Blue": {
          code: "BL",
          switchLetters: ["J", "C", "D", "G"] 
        }, 
        "Yellow": {
          code: "YL"
        }, 
        "Green": {
          code: "GR"
        }, 
      },
      stationList: [{
          "name": null,
          "prediction": null
        }],
      currentLineKey: null,
      canLoadData: true
    };
  }

  tick() {
    if(this.state.currentLineKey == null || !this.state.canLoadData){
      return
    }
    this.RefreshTableData(this.state.currentLineKey)
  }

  componentDidMount() {

    this.interval = setInterval(() => this.tick(), 15000);
  }

  RefreshTableData(lineKey){
    GetTableData(this.state.lines[lineKey], 
      (responseData) => {
        if(responseData == "Error"){
          this.setState({
            canLoadData: false
          })
        }
        else{
          this.setState({
            canLoadData: true,
            currentLineKey: lineKey,
            stationList: responseData
          })
        }

      }
    );
  }

  handleNavClick(lineKey){
    this.RefreshTableData(lineKey)
  }  

  render(){
    
    let color = this.state.currentLineKey;
    if(color != null){
      color = color.toLowerCase()
    }
    

    let table = null
    if(this.state.canLoadData){
      table =
        <TrainTable
          value={this.state.stationList}
          canRender={this.state.currentLineKey != null && this.state.canLoadData}
        />
    }
    else {
      table = <h1>
        Sorry Table Not Loading! :(
      </h1>
    }
    return (
      <div className='display'>
        <div className={'color-bar' + ' active ' + color}></div>
        <h1 className='title'>WMATA Real Time Prediction</h1>
        <Navigation
          lines={this.state.lines}
          onClick={(lineKey) => this.handleNavClick(lineKey)}
        />
        <div className='display-table'>
          {table}
        </div>
      </div>
    );
  }
}

function App() {
  return (
    <div className="App">
      <header className="App-header">

        <Display/>
        <a
          className="App-link"
          href="https://github.com/griffinchozick/wmata-react-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Check out my github for other stuff
        </a>
      </header>
    </div>
  );
}


export default App;

function GetStations(line, callback) {
  var params = {
      "api_key": wmataKey,
      // Request parameters
      "LineCode": line.code,
  };

  $.ajax({
      url: `http://api.wmata.com/Rail.svc/json/jStations?` + $.param(params),
      type: "GET",
  })
  .done(function(data) {
      //alert("successfdsljl");
      //callback(SortStations(data["Stations"]))
      callback(data["Stations"])
  })
  .fail(function() {
      alert("error Stations");
  });
}

function GetPredictions(stationCodes, callback) {
  console.log(stationCodes)
  var params = {
    "api_key": wmataKey,
    // Request parameters
    //"StationCodes": "A01,A02"
  };


  $.ajax({
      url: "https://api.wmata.com/StationPrediction.svc/json/GetPrediction/" + stationCodes + "?" + $.param(params),
      type: "GET",
  })
  .done(function(data) {
      //alert("success")
      callback(data["Trains"])
  })
  .fail(function() {
      alert("error Predictions");
  });
}

function GetTableData(line, mainCallback) {
  //Calls callback and passes in the response data for the table in the format
  //[{
  //  info:
  //  prediction:  
  //}]
  GetStations(line, (getStationsData) => {
    let stationCodes = ""
    for (const station of getStationsData) {
      stationCodes += station.Code + ", "

    }
    stationCodes = stationCodes.slice(0,-2)

    GetPredictions(stationCodes, (getPredictionsData) =>{
      let predictionData = FormatPredictionData(getPredictionsData)
      if (getStationsData.length !== predictionData.length){
        console.warn("Station Data and Real Time Prediction Data are not of same length :(")
        console.log("GetStationsData:" + getStationsData.length)
        console.log("PredictionsData:" + predictionData.length)
        /*mainCallback("Error")
        return*/
      }
      
      let responseData = []
      for (let i = 0; i <predictionData.length; i++){
        responseData.push(predictionData[i])
      }
      mainCallback(responseData)
    })
  })
}

function FormatPredictionData(trains){
  let formattedData = []
  let formattedLocations = []
  for (const train of trains){
    const location = train["LocationName"]
    //console.log("location"+ location)
    if(formattedLocations.includes(location)){
      continue
    }
    formattedLocations.push(location)
    formattedData.push({
      "name": location,
      "prediction": train["Min"]
    })  
  }
  console.log("Frmatted:" + formattedData)
  return formattedData
}

function str(input){
  return JSON.stringify(input)
}
/*function SortStations(swtichPoints, stationList){
  stationData = {}
  for(points of swtichPoints){
    stationData.points = []
  }
  for(station of stationList){
    const letter = station.Code.charAt(0)
    stationData[letter].append(station)
  }
  Object.keys(stationData).forEach(key => {
    for(station in stationData.key){
      sortedList.push(station)
    }
  })
  sortedList = []

  
}*/