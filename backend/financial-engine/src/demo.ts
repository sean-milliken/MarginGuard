import { analyzeDisruption } from './index.ts';
import { steelCityBeverages, logisticsDisruption } from './steel-city-beverages.ts';
console.log(JSON.stringify(analyzeDisruption(steelCityBeverages, logisticsDisruption), null, 2));
