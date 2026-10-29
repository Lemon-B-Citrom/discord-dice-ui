function LiberImperiumVehicleHitLocation(result: number | string) {
  const resultNum = Number(result);

  switch (true) {
    case resultNum >= 1 && resultNum <= 20:
      return "Motive Systems";
    case resultNum >= 21 && resultNum <= 60:
      return "Hull";
    case resultNum >= 61 && resultNum <= 80:
      return "Weapons";
    case (resultNum >= 81 && resultNum <= 99) || resultNum === 0:
      return "Turret";
    default:
      return "";
  }
}

export default LiberImperiumVehicleHitLocation;
