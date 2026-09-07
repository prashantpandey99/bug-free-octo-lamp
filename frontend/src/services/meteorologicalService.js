/**
 * Meteorological Products Catalog & Barcode Scanner Service
 * 
 * Compliant with Legal Metrology (Packaged Commodities & Measuring Instruments) Standards
 * Provides demo dataset, Web Audio API 880Hz tone generator, and barcode validation.
 */

export const METEOROLOGICAL_CATALOG = {
  "1001": {
    barcode: "1001",
    name: "Rain Gauge",
    category: "Precipitation",
    stock: 45,
    location: "Warehouse A",
    description: "Standard meteorological instrument for measuring liquid precipitation depth over a specified duration.",
    unit: "mm / cm",
    accuracy: "± 0.2 mm",
    standards: "IMD / WMO No. 8 Standard Compliant",
    status: "In Stock",
    rack: "R-04 / Bay 2",
    lastCalibrated: "15 Jan 2026",
    iconType: "rain"
  },
  "1002": {
    barcode: "1002",
    name: "Anemometer",
    category: "Wind Speed",
    stock: 12,
    location: "Warehouse B",
    description: "High-precision 3-cup optical rotor anemometer designed for surface wind velocity and gust observation.",
    unit: "m/s, km/h, Knots",
    accuracy: "± 0.1 m/s (0 - 60 m/s)",
    standards: "WMO Guideline Compliant • Optical Pulse Sensor",
    status: "Low Stock",
    rack: "R-11 / Bay 1",
    lastCalibrated: "02 Feb 2026",
    iconType: "wind"
  },
  "1003": {
    barcode: "1003",
    name: "Barograph",
    category: "Pressure",
    stock: 8,
    location: "Lab Store",
    description: "Precision recording aneroid barograph for continuous atmospheric pressure variation plotting on chart drum.",
    unit: "hPa / mbar",
    accuracy: "± 0.3 hPa",
    standards: "NABL / IMD Certified 7-Day Mechanical Clockwork",
    status: "Critical Stock",
    rack: "Lab Cabinet C",
    lastCalibrated: "20 Dec 2025",
    iconType: "pressure"
  },
  "1004": {
    barcode: "1004",
    name: "Thermometer",
    category: "Temperature",
    stock: 30,
    location: "Warehouse A",
    description: "Calibrated Stevenson screen dual maximum and minimum meteorological liquid-in-glass thermometer set.",
    unit: "°C / °F",
    accuracy: "± 0.1 °C (-30°C to +60°C)",
    standards: "IS:5681 Meteorological Thermometers Certified",
    status: "In Stock",
    rack: "R-02 / Shelf 4",
    lastCalibrated: "18 Jan 2026",
    iconType: "temperature"
  },
  "1005": {
    barcode: "1005",
    name: "Hygrometer",
    category: "Humidity",
    stock: 22,
    location: "Warehouse C",
    description: "Digital capacitive hygrometer with ventilated psychrometer probe for relative atmospheric humidity.",
    unit: "% RH",
    accuracy: "± 1.5% RH (10% - 95% RH)",
    standards: "Class 1 Humidity Sensor • Legal Metrology Verified",
    status: "In Stock",
    rack: "R-08 / Shelf 1",
    lastCalibrated: "10 Feb 2026",
    iconType: "humidity"
  }
};

/**
 * Play an 880Hz audio tone for 200ms using Web Audio API on successful barcode match
 * Exact Specifications:
 * - Frequency: 880Hz (A5 pitch)
 * - Duration: 200ms (0.2 seconds)
 * - Waveform Type: "sine"
 * - AudioContext oscillator stopped after 0.2 seconds
 */
export function playSuccessBeep() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) {
      console.warn("Web Audio API is not supported in this environment");
      return;
    }

    const ctx = new AudioCtx();
    // Resume context if suspended by browser autoplay policy
    if (ctx.state === "suspended") {
      ctx.resume().catch((e) => console.warn("AudioContext resume error:", e));
    }

    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);

    // Audio envelope for clean crisp tone without clicks
    const startTime = ctx.currentTime;
    const duration = 0.2; // 200ms
    const stopTime = startTime + duration;

    gainNode.gain.setValueAtTime(0.001, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.18, startTime + 0.015);
    gainNode.gain.exponentialRampToValueAtTime(0.001, stopTime);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(stopTime);

    // Clean up audio context resources after playback
    setTimeout(() => {
      try {
        if (ctx.state !== "closed") {
          ctx.close();
        }
      } catch {
        // ignore close error
      }
    }, 400);
  } catch (error) {
    console.warn("Audio playback failure:", error);
  }
}

/**
 * Search the meteorological demo dataset by barcode.
 * Normalizes input (trims whitespace, handles leading zeros).
 * 
 * @param {string} barcode - Barcode to search
 * @returns {{ found: boolean, product: object|null, message: string }}
 */
export function searchMeteorologicalProduct(barcode) {
  if (!barcode || typeof barcode !== "string" && typeof barcode !== "number") {
    return {
      found: false,
      product: null,
      message: "Please enter a valid barcode number to scan."
    };
  }

  const rawClean = String(barcode).trim();
  if (!rawClean) {
    return {
      found: false,
      product: null,
      message: "Barcode input cannot be empty."
    };
  }

  // 1. Direct match
  if (METEOROLOGICAL_CATALOG[rawClean]) {
    return {
      found: true,
      product: METEOROLOGICAL_CATALOG[rawClean],
      message: "Product located in meteorological inventory."
    };
  }

  // 2. Normalization check (e.g., stripping non-digits if padded)
  const digitsOnly = rawClean.replace(/\D/g, "");
  if (digitsOnly && METEOROLOGICAL_CATALOG[digitsOnly]) {
    return {
      found: true,
      product: METEOROLOGICAL_CATALOG[digitsOnly],
      message: "Product located in meteorological inventory."
    };
  }

  // 3. Substring match if barcode is padded with GS1/EAN leading zeros (e.g. 00000000001001)
  for (const key of Object.keys(METEOROLOGICAL_CATALOG)) {
    if (rawClean.endsWith(key) && (rawClean.length <= 16)) {
      return {
        found: true,
        product: METEOROLOGICAL_CATALOG[key],
        message: "Product located via barcode suffix match."
      };
    }
  }

  return {
    found: false,
    product: null,
    message: `Barcode "${rawClean}" not found in meteorological database. Please verify the code.`
  };
}
