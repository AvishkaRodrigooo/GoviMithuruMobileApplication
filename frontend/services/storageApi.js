import axios from "axios";

const BASE_URL = "http://YOUR_IP:5000/api/storage";

export const predictStorage = async (stock) => {
  const payload = {
    variety: stock.variety,
    season: stock.season,
    storageType: stock.storageType,
    storageArea: stock.storageArea || 0,
    areaUnit: stock.areaUnit,
    moisture: stock.moisture || 0,
    ventilation: stock.ventilation,
    pestCheck: stock.pestCheck,
    grade: stock.grade,
    quantityKg: stock.quantityKg,
  };

  const response = await axios.post(
    `${BASE_URL}/predict`,
    payload,
    { headers: { "Content-Type": "application/json" } }
  );

  return response.data;
};
