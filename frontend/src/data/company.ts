import type { CompanyProfile } from '../types/mock';

export const steelCityBeverages: CompanyProfile = {
  id: 'scb-001',
  name: 'Steel City Beverages',
  industry: 'Beverage Manufacturing',
  revenue: 4_800_000, // $4.8M annually
  cash: 148_230, // $148K
  monthlyExpenses: 42_100, // $42.1K
  burnRate: 3.5, // months

  components: [
    {
      id: 'component-aluminum-cans',
      name: 'Aluminum Cans',
      category: 'Packaging',
      suppliers: ['supplier-atlantic', 'supplier-metro'],
      products: ['product-classic-cola', 'product-zero-cola']
    },
    {
      id: 'component-glass-bottles',
      name: 'Glass Bottles',
      category: 'Packaging',
      suppliers: ['supplier-metro'],
      products: ['product-sparkling-water']
    },
    {
      id: 'component-sweetener',
      name: 'Sweetener',
      category: 'Ingredient',
      suppliers: ['supplier-atlantic'],
      products: ['product-classic-cola']
    }
  ],

  suppliers: [
    {
      id: 'supplier-atlantic',
      name: 'Atlantic Packaging',
      location: 'Newark, NJ',
      category: 'Packaging',
      dependencyPercentage: 42,
      relationship: 'primary',
      components: ['component-aluminum-cans', 'component-sweetener']
    },
    {
      id: 'supplier-metro',
      name: 'Metro Aluminum',
      location: 'Pittsburgh, PA',
      category: 'Materials',
      dependencyPercentage: 31,
      relationship: 'primary',
      components: ['component-aluminum-cans', 'component-glass-bottles']
    },
    {
      id: 'supplier-keystone',
      name: 'Keystone Logistics',
      location: 'Philadelphia, PA',
      category: 'Transportation',
      dependencyPercentage: 18,
      relationship: 'secondary',
      components: []
    }
  ],

  products: [
    {
      id: 'product-classic-cola',
      name: 'Classic Cola',
      unitsPerMonth: 8000,
      marginPerUnit: 17.50,
      totalMargin: 140_000, // 8000 * 17.50
      components: ['component-aluminum-cans', 'component-sweetener']
    },
    {
      id: 'product-zero-cola',
      name: 'Zero Cola',
      unitsPerMonth: 5400,
      marginPerUnit: 15.10,
      totalMargin: 81_540, // 5400 * 15.10
      components: ['component-aluminum-cans']
    },
    {
      id: 'product-sparkling-water',
      name: 'Sparkling Water',
      unitsPerMonth: 3200,
      marginPerUnit: 12.80,
      totalMargin: 40_960, // 3200 * 12.80
      components: ['component-glass-bottles']
    }
  ]
};
