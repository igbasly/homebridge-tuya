const BaseAccessory = require("./BaseAccessory");

class TemperatureAndHumidityAccessory extends BaseAccessory {
  static getCategory(Categories) {
    return Categories.SENSOR;
  }

  constructor(...props) {
    super(...props);
    this.defaultDps = {
      CurrentTemperature: 103,
      CurrentHumidity: 104,
    };
  }

  _registerPlatformAccessory() {
    const { Service } = this.hap;

    this.accessory.addService(
      Service.TemperatureSensor,
      this.device.context.name
    );
    this.accessory.addService(Service.HumiditySensor, this.device.context.name);

    super._registerPlatformAccessory();
  }

  _registerCharacteristics(dps) {
    const { Service, Characteristic } = this.hap;

    const tempService = this.accessory.getService(Service.TemperatureSensor);

    this._checkServiceName(tempService, this.device.context.name);

    this.temperatureDivisor = parseInt(this.device.context.temperatureDivisor) || 1;
    this.humidityDivisor = parseInt(this.device.context.humidityDivisor) || 1;
    
    const characteristicTemperature = tempService
      .getCharacteristic(Characteristic.CurrentTemperature)
      .updateValue(this._getDividedState(dps[this.getDp("CurrentTemperature")], this.temperatureDivisor))
      .on('get', this.getDividedState.bind(this, this.getDp("CurrentTemperature"), this.temperatureDivisor));

    const characteristicCurrentHumidity = this.accessory
      .getService(Service.HumiditySensor)
      .getCharacteristic(Characteristic.CurrentRelativeHumidity)
      .updateValue(this._getDividedState(dps[this.getDp("CurrentHumidity")], this.humidityDivisor))
      .on('get', this.getDividedState.bind(this, this.getDp("CurrentHumidity"), this.humidityDivisor));

    this.device.on("change", (changes, state) => {
      if (
        changes.hasOwnProperty("Humidity") &&
        this.characteristicHumidity.value !== changes[this.getDp("Humidity")]
      )
        this.characteristicHumidity.updateValue(
          changes[this.getDp("Humidity")]
        );

      if (
        changes.hasOwnProperty("Temperature") &&
        this.characteristicTemperature.value !==
          changes[this.getDp("Temperature")]
      )
        this.characteristicTemperature.updateValue(
          changes[this.getDp("Temperature")]
        );
    });
  }

  getCurrentHumidity(callback) {
    this.getState(this.getDp('CurrentHumidity'), (err, dp) => {
        if (err) return callback(err);

        callback(null, this._getCurrentHumidity(dp));
    });
  }

  _getCurrentHumidity(dp) {
    return dp;
  }

  getCurrentTemperature(callback) {
    this.getState(this.getDp("CurrentTemperature"), (err, dp) => {
      if (err) return callback(err);

      callback(null, this._getCurrentTemperature(dp));
    });
  }

  _getCurrentTemperature(dp) {
    return dp;
  }

  getTemperatureDisplayUnits(callback) {
    this.getState(this.dpTemperatureDisplayUnits, (err, dp) => {
      if (err) return callback(err);

      callback(null, this._getTemperatureDisplayUnits(dp));
    });
  }

  _getTemperatureDisplayUnits(dp) {
    const { Characteristic } = this.hap;

    return dp === "F"
      ? Characteristic.TemperatureDisplayUnits.FAHRENHEIT
      : Characteristic.TemperatureDisplayUnits.CELSIUS;
  }

  setTemperatureDisplayUnits(value, callback) {
    const { Characteristic } = this.hap;

    this.setState(
      this.dpTemperatureDisplayUnits,
      value === Characteristic.TemperatureDisplayUnits.FAHRENHEIT ? "F" : "C",
      callback
    );
  }

  getDp(name) {
    return this.device.context["dp" + name]
      ? this.device.context["dp" + name]
      : this.defaultDps[name];
  }
}

module.exports = TemperatureAndHumidityAccessory;
